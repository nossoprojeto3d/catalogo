import { create } from 'zustand';
import { chaveProduto, type Categoria, type Produto } from '../lib/catalogo';
import { medir } from '../lib/medicao';
import type { ItemPedido } from '../lib/whatsapp';

// Mesmo formato e mesma chave da versão anterior: quem já tinha uma
// lista salva no celular continua com ela.
type ItemSalvo = { chave: string; quantidade: number; cor: string };
const CHAVE = 'np3d_lista';

function ler(): ItemSalvo[] {
  try {
    const salva = JSON.parse(localStorage.getItem(CHAVE) || 'null');
    if (Array.isArray(salva)) return salva.filter((i) => i && i.chave && i.quantidade > 0).map((i) => ({ ...i, cor: i.cor || '' }));
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
  adicionar: (p: Produto, quantidade: number, cor: string) => void;
  mudarQuantidade: (chave: string, cor: string, quantidade: number) => void;
  remover: (chave: string, cor: string) => void;
  limpar: () => void;
  // Tira da lista o que saiu da planilha ou esgotou. Devolve os nomes
  // removidos, pra avisar o cliente.
  conferir: (categorias: Categoria[]) => string[];
};

export const useLista = create<EstadoLista>((set, get) => {
  const atualizar = (itens: ItemSalvo[]) => { salvar(itens); set({ itens }); };
  return {
    itens: ler(),
    adicionar(p, quantidade, cor) {
      const chave = chaveProduto(p);
      const itens = [...get().itens];
      const existente = itens.find((i) => i.chave === chave && i.cor === cor);
      if (existente) existente.quantidade += quantidade;
      else itens.push({ chave, quantidade, cor });
      atualizar(itens.map((i) => ({ ...i })));
      medir('lista_adicionado', { produto: p.nome, categoria: p.categoria });
    },
    mudarQuantidade(chave, cor, quantidade) {
      atualizar(get().itens.map((i) => (i.chave === chave && i.cor === cor ? { ...i, quantidade: Math.max(1, Math.min(99, quantidade)) } : i)));
    },
    remover(chave, cor) {
      atualizar(get().itens.filter((i) => !(i.chave === chave && i.cor === cor)));
    },
    limpar() {
      atualizar([]);
    },
    conferir(categorias) {
      const porChave = mapaProdutos(categorias);
      const removidos: string[] = [];
      const validos = get().itens.filter((i) => {
        const p = porChave.get(i.chave);
        if (p && !p.esgotado) return true;
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

export function resolverItens(itens: ItemSalvo[], categorias: Categoria[]): (ItemPedido & { chave: string })[] {
  const mapa = mapaProdutos(categorias);
  return itens.flatMap((i) => {
    const produto = mapa.get(i.chave);
    return produto ? [{ produto, quantidade: i.quantidade, cor: i.cor, chave: i.chave }] : [];
  });
}

export const totalDeItens = (itens: ItemSalvo[]) => itens.reduce((s, i) => s + i.quantidade, 0);
