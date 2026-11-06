import { normalizar, ordenarProdutos, type ArquivoCatalogo, type Peca } from '../lib/catalogo';
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

export type CamposDaPeca = { nome: string; preco: string; categoria: string; esgotado: boolean };

// Devolve o que falta arrumar; vazio quer dizer que pode salvar.
export function errosDaPeca({ nome, preco, categoria, esgotado }: CamposDaPeca): string[] {
  const erros: string[] = [];
  if (!nome.trim()) erros.push('Escreva o nome da peça.');
  if (!categoria.trim()) erros.push('Escolha a categoria.');
  if (!esgotado && paraNumero(normalizarPreco(preco)) <= 0) erros.push('Escreva o preço da peça.');
  return erros;
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
  if (JSON.stringify(a.cores) !== JSON.stringify(d.cores)) mudou.push('cores');
  if (JSON.stringify(a.combos) !== JSON.stringify(d.combos)) mudou.push('combos');
  if (a.maisVendido !== d.maisVendido) mudou.push('queridinhos');
  if (a.esgotado !== d.esgotado) mudou.push('estoque');
  if (antes.categoria !== depois.categoria) mudou.push('categoria');
  if (fotoNova) mudou.push('foto');
  return `Alterar ${mudou.length ? `${juntar(mudou)} de ` : ''}${codigo} ${final}`;
}
