import { normalizar, ordenarProdutos, type ArquivoCatalogo, type Peca, type Versao } from '../lib/catalogo';
import { paraNumero } from '../lib/preco';

// Regras do painel, sem tela nem internet: dá para testar sozinhas.

export type Localizada = { peca: Peca; categoria: string };

export function acharPeca(arquivo: ArquivoCatalogo, codigo: string): Localizada | null {
  for (const c of arquivo.categorias) {
    const peca = c.produtos.find((p) => normalizar(p.codigo) === normalizar(codigo));
    if (peca) return { peca, categoria: c.nome };
  }
  return null;
}

export const mesmaPeca = (a: Localizada, b: Localizada) =>
  a.categoria === b.categoria && JSON.stringify(a.peca) === JSON.stringify(b.peca);

// "69,9", "69.90" e "R$ 69,90" viram "69,90". Vazio continua vazio.
export function normalizarPreco(texto: string): string {
  const limpo = texto.replace(/[R$\s]/gi, '');
  if (!limpo) return '';
  const decimal = /^\d+\.\d{1,2}$/.test(limpo) ? limpo.replace('.', ',') : limpo;
  return paraNumero(decimal).toFixed(2).replace('.', ',');
}

// Próximo número do prefixo mais usado na categoria (KID-23 -> KID-24). Categoria
// nova usa as três primeiras letras do nome. O número nunca repete em todo o catálogo.
export function gerarCodigo(arquivo: ArquivoCatalogo, categoria: string): string {
  const prefixoDe = (codigo: string) => codigo.match(/^([A-Za-z]+)-\d+$/)?.[1].toUpperCase();
  const daCategoria = arquivo.categorias.find((c) => c.nome === categoria)?.produtos ?? [];
  const contagem = new Map<string, number>();
  for (const p of daCategoria) {
    const prefixo = prefixoDe(p.codigo);
    if (prefixo) contagem.set(prefixo, (contagem.get(prefixo) ?? 0) + 1);
  }
  const prefixo = [...contagem].sort((a, b) => b[1] - a[1])[0]?.[0]
    ?? (normalizar(categoria).replace(/[^a-z]/g, '').slice(0, 3).toUpperCase() || 'NP');
  const usados = arquivo.categorias.flatMap((c) => c.produtos)
    .map((p) => p.codigo.toUpperCase().match(new RegExp(`^${prefixo}-(\\d+)$`))?.[1])
    .filter((n): n is string => !!n)
    .map(Number);
  return `${prefixo}-${String(Math.max(0, ...usados) + 1).padStart(2, '0')}`;
}

// Devolve um arquivo novo; o original não muda. A peça sai da categoria antiga, se mudou.
export function aplicarPeca(arquivo: ArquivoCatalogo, peca: Peca, categoria: string): ArquivoCatalogo {
  const sem = removerPeca(arquivo, peca.codigo);
  const existe = sem.categorias.some((c) => c.nome === categoria);
  const categorias = existe ? sem.categorias : [...sem.categorias, { nome: categoria, produtos: [] }];
  return {
    categorias: categorias.map((c) => (c.nome === categoria
      ? { ...c, produtos: ordenarProdutos([...c.produtos, peca].map((p) => ({ ...p, categoria }))).map(({ categoria: _c, ...p }) => p) }
      : c)),
  };
}

export function removerPeca(arquivo: ArquivoCatalogo, codigo: string): ArquivoCatalogo {
  return {
    categorias: arquivo.categorias.map((c) => ({ ...c, produtos: c.produtos.filter((p) => normalizar(p.codigo) !== normalizar(codigo)) })),
  };
}

export type CamposDaPeca = { nome: string; preco: string; categoria: string; esgotado: boolean; versoes?: Versao[] };

// Linhas de versão totalmente vazias são ignoradas; o resto vai limpo para o arquivo.
export function limparVersoes(versoes: Versao[]): Versao[] {
  return versoes
    .map((v) => ({ nome: v.nome.trim(), preco: normalizarPreco(v.preco) }))
    .filter((v) => v.nome || paraNumero(v.preco) > 0);
}

// Com versões, o preço da peça é o menor deles (card "a partir de" e ordenação).
export function menorPreco(versoes: Versao[]): string {
  const precos = versoes.map((v) => paraNumero(v.preco)).filter((n) => n > 0);
  return precos.length ? Math.min(...precos).toFixed(2).replace('.', ',') : '';
}

// O que falta arrumar em cada campo, para a ficha marcar o campo certo.
// versaoNome e versaoPreco são as posições das linhas de versão na tela.
export type ErrosPorCampo = { nome?: string; categoria?: string; preco?: string; versoes: string[]; versaoNome: number[]; versaoPreco: number[] };

export function errosPorCampo({ nome, preco, categoria, esgotado, versoes = [] }: CamposDaPeca): ErrosPorCampo {
  const erros: ErrosPorCampo = { versoes: [], versaoNome: [], versaoPreco: [] };
  if (!nome.trim()) erros.nome = 'Escreva o nome da peça.';
  if (!categoria.trim()) erros.categoria = 'Escolha a categoria.';
  // Mesma regra de limparVersoes, guardando a posição de cada linha.
  const linhas = versoes
    .map((v, i) => ({ i, nome: v.nome.trim(), preco: normalizarPreco(v.preco) }))
    .filter((v) => v.nome || paraNumero(v.preco) > 0);
  if (linhas.length) {
    const semNome = linhas.filter((v) => !v.nome).map((v) => v.i);
    if (semNome.length) erros.versoes.push('Escreva o nome de cada versão.');
    if (!esgotado) erros.versaoPreco = linhas.filter((v) => paraNumero(v.preco) <= 0).map((v) => v.i);
    if (erros.versaoPreco.length) erros.versoes.push('Escreva o preço de cada versão.');
    const repetidas = linhas.filter((v) => v.nome && linhas.some((o) => o.i !== v.i && normalizar(o.nome) === normalizar(v.nome))).map((v) => v.i);
    if (repetidas.length) erros.versoes.push('Duas versões estão com o mesmo nome.');
    erros.versaoNome = [...new Set([...semNome, ...repetidas])].sort((a, b) => a - b);
  } else if (!esgotado && paraNumero(normalizarPreco(preco)) <= 0) erros.preco = 'Escreva o preço da peça.';
  return erros;
}

// Devolve o que falta arrumar; vazio quer dizer que pode salvar.
export function errosDaPeca(campos: CamposDaPeca): string[] {
  const e = errosPorCampo(campos);
  return [e.nome, e.categoria, ...e.versoes, e.preco].filter((x): x is string => !!x);
}

const juntar = (itens: string[]) => (itens.length > 1 ? `${itens.slice(0, -1).join(', ')} e ${itens[itens.length - 1]}` : itens[0]);

// Texto do histórico do Git, para saber quem mudou o quê.
export function descreverMudanca(antes: Localizada | null, depois: Localizada, fotoNova: boolean, quem: string): string {
  const { codigo } = depois.peca;
  const final = `pelo painel (${quem})`;
  if (!antes) return `Adicionar ${codigo} ${final}`;
  if (antes.peca.esgotado !== depois.peca.esgotado && !fotoNova && mesmaPeca({ ...antes, peca: { ...antes.peca, esgotado: depois.peca.esgotado } }, depois)) {
    return `${depois.peca.esgotado ? 'Esgotar' : 'Reativar'} ${codigo} ${final}`;
  }
  const a = antes.peca; const d = depois.peca; const mudou: string[] = [];
  if (a.nome !== d.nome) mudou.push('nome');
  if (a.preco !== d.preco) mudou.push('preço');
  if (a.descricao !== d.descricao) mudou.push('descrição');
  if (JSON.stringify(a.versoes ?? []) !== JSON.stringify(d.versoes ?? [])) mudou.push('versões');
  if (JSON.stringify(a.cores) !== JSON.stringify(d.cores)) mudou.push('cores');
  if (JSON.stringify(a.combos) !== JSON.stringify(d.combos)) mudou.push('combos');
  if (a.maisVendido !== d.maisVendido) mudou.push('queridinhos');
  if (a.esgotado !== d.esgotado) mudou.push('estoque');
  if (antes.categoria !== depois.categoria) mudou.push('categoria');
  if (fotoNova) mudou.push('foto');
  return `Alterar ${mudou.length ? `${juntar(mudou)} de ` : ''}${codigo} ${final}`;
}
