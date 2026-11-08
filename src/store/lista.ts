import { create } from 'zustand';
import { chaveProduto, naVersao, temVersoes, type Categoria, type Produto } from '../lib/catalogo';
import { QUANTIDADE_MAXIMA } from '../lib/config';
import { medir } from '../lib/medicao';
import type { ItemPedido } from '../lib/whatsapp';

// Mesmo formato e mesma chave da versão anterior: quem já tinha uma
// lista salva no celular continua com ela. `versao` veio depois (vazio = sem versão).
type ItemSalvo = { chave: string; quantidade: number; cor: string; versao: string };
// O mesmo produto em outra cor ou versão é outro item da sacola.
export type Alvo = Pick<ItemSalvo, 'chave' | 'cor' | 'versao'>;
const mesmo = (a: Alvo, b: Alvo) => a.chave === b.chave && a.cor === b.cor && a.versao === b.versao;
const CHAVE = 'np3d_lista';

function ler(): ItemSalvo[] {
  try {
    const salva = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (Array.isArray(salva)) return salva.filter((i) => i && i.chave && i.quantidade > 0).map((i) => ({ ...i, cor: i.cor || '', versao: i.versao || '' }));
  } catch {
    /* modo privado etc. */
  }
  return [];
}

function salvar(itens: ItemSalvo[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(itens));
  } catch {
    /* modo privado etc. */
  }
}

type EstadoLista = {
  itens: ItemSalvo[];
  adicionar: (p: Produto, quantidade: number, cor: string, versao?: string) => void;
  mudarQuantidade: (alvo: Alvo, quantidade: number) => void;
  remover: (alvo: Alvo) => void;
  limpar: () => void;
  // Tira da lista o que saiu da planilha ou esgotou. Devolve os nomes
  // removidos, pra avisar o cliente.
  conferir: (categorias: Categoria[]) => string[];
};

export const useLista = create<EstadoLista>((set, get) => {
  const atualizar = (itens: ItemSalvo[]) => { salvar(itens); set({ itens }); };
  return {
    itens: ler(),
    adicionar(p, quantidade, cor, versao = '') {
      const novo = { chave: chaveProduto(p), cor, versao };
      const itens = get().itens.map((i) => ({ ...i }));
      const existente = itens.find((i) => mesmo(i, novo));
      if (existente) existente.quantidade += quantidade;
      else itens.push({ ...novo, quantidade });
      atualizar(itens.map((i) => ({ ...i })));
      medir('lista_adicionado', { produto: p.nome, categoria: p.categoria });
    },
    mudarQuantidade(alvo, quantidade) {
      atualizar(get().itens.map((i) => (mesmo(i, alvo) ? { ...i, quantidade: Math.max(1, Math.min(QUANTIDADE_MAXIMA, quantidade)) } : i)));
    },
    remover(alvo) {
      atualizar(get().itens.filter((i) => !mesmo(i, alvo)));
    },
    limpar() {
      atualizar([]);
    },
    conferir(categorias) {
      const porChave = mapaProdutos(categorias);
      const removidos: string[] = [];
      const validos = get().itens.filter((i) => {
        const p = porChave.get(i.chave);
        if (p && !p.esgotado && versaoExiste(p, i.versao)) return true;
        if (p) removidos.push(p.nome);
        return false;
      });
      if (validos.length !== get().itens.length) atualizar(validos);
      return removidos;
    },
  };
});

export function mapaProdutos(categorias: Categoria[]): Map<string, Produto> {
  const mapa = new Map<string, Produto>();
  categorias.forEach((c) => c.produtos.forEach((p) => mapa.set(chaveProduto(p), p)));
  return mapa;
}

// Versão que saiu do produto (ou produto que passou a ter versões) tira o item da sacola.
function versaoExiste(p: Produto, versao: string): boolean {
  return versao ? !!p.versoes?.some((v) => v.nome === versao) : !temVersoes(p);
}

// O produto de cada item já vem com o preço da versão escolhida.
export function resolverItens(itens: ItemSalvo[], categorias: Categoria[]): (ItemPedido & Alvo)[] {
  const mapa = mapaProdutos(categorias);
  return itens.flatMap((i) => {
    const produto = mapa.get(i.chave);
    return produto ? [{ produto: naVersao(produto, i.versao), quantidade: i.quantidade, cor: i.cor, versao: i.versao, chave: i.chave }] : [];
  });
}

export const totalDeItens = (itens: ItemSalvo[]) => itens.reduce((s, i) => s + i.quantidade, 0);
