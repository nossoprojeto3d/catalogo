import { create } from 'zustand';
import type { Categoria, Produto } from '../lib/catalogo';

export type Pagina =
  | { tipo: 'inicio' }
  | { tipo: 'produtos'; categoria?: string }
  | { tipo: 'brindes' };

type Estado = {
  categorias: Categoria[];
  status: 'carregando' | 'pronto' | 'erro';
  pagina: Pagina;
  produtoAberto: Produto | null;
  compraRapida: Produto | null;
  listaAberta: boolean;
  buscaAberta: boolean;
  menuAberto: boolean;
  setCatalogo: (categorias: Categoria[]) => void;
  setErro: () => void;
  setPagina: (p: Pagina) => void;
  abrirProduto: (p: Produto | null) => void;
  setCompraRapida: (p: Produto | null) => void;
  setListaAberta: (v: boolean) => void;
  setBuscaAberta: (v: boolean) => void;
  setMenuAberto: (v: boolean) => void;
};

export const useUI = create<Estado>((set) => ({
  categorias: [],
  status: 'carregando',
  pagina: { tipo: 'inicio' },
  produtoAberto: null,
  compraRapida: null,
  listaAberta: false,
  buscaAberta: false,
  menuAberto: false,
  setCatalogo: (categorias) => set({ categorias, status: 'pronto' }),
  setErro: () => set({ status: 'erro' }),
  setPagina: (pagina) => set({ pagina }),
  abrirProduto: (produtoAberto) => set({ produtoAberto }),
  setCompraRapida: (compraRapida) => set({ compraRapida }),
  setListaAberta: (listaAberta) => set({ listaAberta }),
  setBuscaAberta: (buscaAberta) => set({ buscaAberta }),
  setMenuAberto: (menuAberto) => set({ menuAberto }),
}));

export const useAlgumPainelAberto = () =>
  useUI((s) => !!s.produtoAberto || !!s.compraRapida || s.listaAberta || s.buscaAberta || s.menuAberto);
