import { ABAS_CATEGORIAS, DURACAO_CACHE_ABA_MS, SHEET_ID } from './config';

export type Produto = {
  nome: string;
  codigo: string;
  descricao: string;
  preco: string;
  precoPromocional: string;
  foto: string;
  cores: string[];
  maisVendido: number | null;
  esgotado: boolean;
  categoria: string;
};

export type Categoria = { nome: string; produtos: Produto[] };

// Interpretador de CSV que aceita vírgulas e quebras de linha dentro de aspas.
export function interpretarCSV(texto: string): string[][] {
  const linhas: string[][] = [];
  let linha: string[] = [];
  let campo = '';
  let emAspas = false;

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    const prox = texto[i + 1];
    if (emAspas) {
      if (c === '"' && prox === '"') { campo += '"'; i++; }
      else if (c === '"') emAspas = false;
      else campo += c;
    } else if (c === '"') emAspas = true;
    else if (c === ',') { linha.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && prox === '\n') continue;
      linha.push(campo); linhas.push(linha); linha = []; campo = '';
    } else campo += c;
  }
  if (campo.length > 0 || linha.length > 0) { linha.push(campo); linhas.push(linha); }
  return linhas.filter((l) => l.some((v) => v.trim() !== ''));
}

// Uma aba vira uma categoria. As colunas são achadas pelo nome do
// cabeçalho, então a ordem delas na planilha não importa.
export function montarCategoria(nomeAba: string, linhas: string[][]): Categoria {
  const cab = (linhas[0] ?? []).map((c) => c.trim().toLowerCase());
  const col = (nome: string) => cab.indexOf(nome);
  const ler = (linha: string[], nome: string) => (linha[col(nome)] ?? '').trim();

  const produtos: Produto[] = [];
  for (const linha of linhas.slice(1)) {
    const nome = ler(linha, 'produto');
    if (!nome) continue;
    const maisVendidoTexto = ler(linha, 'maisvendido');
    let maisVendido: number | null = null;
    if (maisVendidoTexto) {
      const n = Number(maisVendidoTexto.replace(',', '.'));
      maisVendido = Number.isNaN(n) ? 999 : n;
    }
    const coresTexto = ler(linha, 'cores');
    produtos.push({
      nome,
      codigo: ler(linha, 'codigo'),
      descricao: ler(linha, 'descricao'),
      preco: ler(linha, 'preco'),
      precoPromocional: ler(linha, 'precopromocional'),
      foto: ler(linha, 'foto'),
      cores: coresTexto ? coresTexto.split(',').map((c) => c.trim()).filter(Boolean) : [],
      maisVendido,
      esgotado: !!ler(linha, 'esgotado'),
      categoria: nomeAba,
    });
  }
  return { nome: nomeAba, produtos: ordenarProdutos(produtos) };
}

// Ordem alfabética, com esgotados sempre por último.
export function ordenarProdutos(produtos: Produto[]): Produto[] {
  return [...produtos]
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }))
    .sort((a, b) => Number(a.esgotado) - Number(b.esgotado));
}

export function ordenarCategorias(categorias: Categoria[]): Categoria[] {
  return categorias
    .filter((c) => c.produtos.length > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

// "Os queridinhos": coluna MaisVendido. Número define a posição; texto
// qualquer marca o produto e manda pro fim. Esgotado não entra na vitrine.
export function queridinhos(categorias: Categoria[]): Produto[] {
  return categorias
    .flatMap((c) => c.produtos)
    .filter((p) => p.maisVendido !== null && !p.esgotado)
    .sort((a, b) => (a.maisVendido ?? 0) - (b.maisVendido ?? 0));
}

// Código identifica melhor; sem código, categoria + nome.
export function chaveProduto(p: Produto): string {
  return p.codigo ? `codigo:${p.codigo}` : `nome:${p.categoria}::${p.nome}`;
}

export function normalizar(texto: string): string {
  return String(texto).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

export function buscar(categorias: Categoria[], termo: string): Produto[] {
  const t = normalizar(termo);
  if (!t) return [];
  const partes = t.split(/\s+/);
  return ordenarProdutos(
    categorias.flatMap((c) => c.produtos).filter((p) => {
      const alvo = normalizar(`${p.nome} ${p.codigo} ${p.descricao} ${p.categoria}`);
      return partes.every((parte) => alvo.includes(parte));
    }),
  );
}

/* ---------- Busca na planilha ---------- */

function urlDaAba(aba: string): string {
  return `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(aba)}&_=${Date.now()}`;
}

function lerCache(aba: string): string | null {
  try {
    const bruto = sessionStorage.getItem(`np3d_cache_aba_${aba}`);
    if (!bruto) return null;
    const { texto, ts } = JSON.parse(bruto);
    if (typeof texto !== 'string' || Date.now() - ts > DURACAO_CACHE_ABA_MS) return null;
    return texto;
  } catch {
    return null;
  }
}

function salvarCache(aba: string, texto: string) {
  try {
    sessionStorage.setItem(`np3d_cache_aba_${aba}`, JSON.stringify({ texto, ts: Date.now() }));
  } catch {
    /* aba anônima ou cota cheia: segue sem cache */
  }
}

async function buscarAba(aba: string): Promise<Categoria> {
  const emCache = lerCache(aba);
  if (emCache !== null) return montarCategoria(aba, interpretarCSV(emCache));
  const resposta = await fetch(urlDaAba(aba), { cache: 'no-store' });
  if (!resposta.ok) throw new Error(`Não foi possível acessar a aba ${aba}.`);
  const texto = await resposta.text();
  salvarCache(aba, texto);
  return montarCategoria(aba, interpretarCSV(texto));
}

// Uma tentativa extra antes de desistir: falha passageira de rede é
// comum no celular e não deve levar à tela de manutenção.
export async function carregarCatalogo(tentativas = 2): Promise<Categoria[]> {
  try {
    return ordenarCategorias(await Promise.all(ABAS_CATEGORIAS.map(buscarAba)));
  } catch (erro) {
    if (tentativas <= 1) throw erro;
    await new Promise((ok) => setTimeout(ok, 1500));
    return carregarCatalogo(tentativas - 1);
  }
}
