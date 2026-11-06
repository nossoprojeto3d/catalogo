import { ABAS_BRINDES } from './config';
import { paraNumero, precoUnitario } from './preco';

export type Produto = {
  nome: string;
  codigo: string;
  descricao: string;
  preco: string;
  foto: string;
  cores: string[];
  // Preço fechado por quantidade (coluna Combos): { 10: 119, 20: 220 }
  combos: Record<number, number>;
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

// Coluna Combos: "10=119,00; 20=220,00". O que não seguir o formato é ignorado.
export function lerCombos(texto: string): Record<number, number> {
  const combos: Record<number, number> = {};
  for (const [, quantidade, valor] of texto.matchAll(/(\d+)\s*[=:]\s*([\d.,]+)/g)) {
    const preco = paraNumero(valor);
    if (preco > 0) combos[Number(quantidade)] = preco;
  }
  return combos;
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
    // O site não tem mais promoção: na importação, vale o preço que o cliente já pagava.
    const promocao = paraNumero(ler(linha, 'precopromocional'));
    const normal = paraNumero(ler(linha, 'preco'));
    const preco = promocao > 0 && (normal <= 0 || promocao < normal) ? ler(linha, 'precopromocional') : ler(linha, 'preco');
    produtos.push({
      nome,
      codigo: ler(linha, 'codigo'),
      descricao: ler(linha, 'descricao'),
      preco,
      foto: ler(linha, 'foto'),
      cores: coresTexto ? coresTexto.split(',').map((c) => c.trim()).filter(Boolean) : [],
      combos: lerCombos(ler(linha, 'combos')),
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

export type Ordem = 'pedidos' | 'menor' | 'maior' | 'nome';

// Ordem escolhida pelo cliente, com esgotados sempre por último.
export function ordenarPor(produtos: Produto[], ordem: Ordem): Produto[] {
  const base = ordenarProdutos(produtos);
  const comparar: Record<Ordem, ((a: Produto, b: Produto) => number) | null> = {
    nome: null,
    pedidos: (a, b) => (a.maisVendido ?? Infinity) - (b.maisVendido ?? Infinity),
    menor: (a, b) => precoUnitario(a) - precoUnitario(b),
    maior: (a, b) => precoUnitario(b) - precoUnitario(a),
  };
  const regra = comparar[ordem];
  const ordenados = regra ? [...base].sort((a, b) => (a.maisVendido === b.maisVendido && ordem === 'pedidos' ? 0 : regra(a, b))) : base;
  return ordenados.sort((a, b) => Number(a.esgotado) - Number(b.esgotado));
}

export function ordenarCategorias(categorias: Categoria[]): Categoria[] {
  return categorias
    .filter((c) => c.produtos.length > 0)
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

// Categorias de quem compra para si: os brindes têm página própria.
export function categoriasDeVarejo(categorias: Categoria[]): Categoria[] {
  return categorias.filter((c) => !ABAS_BRINDES.includes(c.nome));
}

// Aba vazia não vira categoria, então o banner só vai para Natal quando há peças.
export function linkDoNatal(categorias: Categoria[]): string {
  const nome = categorias.some((c) => c.nome === 'Natal') ? 'Natal' : 'Cantinho da Fé';
  return `#categoria/${encodeURIComponent(nome)}`;
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

/* ---------- Arquivo do catálogo (public/catalogo.json, editado pelo painel) ---------- */

export type Peca = Omit<Produto, 'categoria'>;
export type ArquivoCatalogo = { categorias: { nome: string; produtos: Peca[] }[] };

export function categoriasDoArquivo(arquivo: ArquivoCatalogo): Categoria[] {
  return ordenarCategorias(arquivo.categorias.map((c) => ({
    nome: c.nome,
    produtos: ordenarProdutos(c.produtos.map((p) => ({ ...p, categoria: c.nome }))),
  })));
}

// Uma tentativa extra antes de desistir: falha passageira de rede é
// comum no celular e não deve levar à tela de manutenção.
export async function carregarCatalogo(tentativas = 2): Promise<Categoria[]> {
  try {
    const resposta = await fetch(`${import.meta.env.BASE_URL}catalogo.json?v=${Date.now()}`, { cache: 'no-store' });
    if (!resposta.ok) throw new Error(`Não foi possível ler o catálogo: ${resposta.status}.`);
    return categoriasDoArquivo(await resposta.json());
  } catch (erro) {
    if (tentativas <= 1) throw erro;
    await new Promise((ok) => setTimeout(ok, 1500));
    return carregarCatalogo(tentativas - 1);
  }
}
