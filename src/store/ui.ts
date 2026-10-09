import { create } from 'zustand';
import type { Categoria, Produto } from '../lib/catalogo';

type Estado = {
  categorias: Categoria[];
  status: 'carregando' | 'pronto' | 'erro';
  produtoAberto: Produto | null;
  listaAberta: boolean;
  buscaAberta: boolean;
  categoriaAtiva: string;
  setCatalogo: (categorias: Categoria[]) => void;
  setErro: () => void;
  abrirProduto: (p: Produto | null) => void;
  setListaAberta: (v: boolean) => void;
  setBuscaAberta: (v: boolean) => void;
  setCategoriaAtiva: (nome: string) => void;
};

export const TODAS = 'Tudo';

export const useUI = create<Estado>((set) => ({
  categorias: [],
  status: 'carregando',
  produtoAberto: null,
  listaAberta: false,
  buscaAberta: false,
  categoriaAtiva: TODAS,
  setCatalogo: (categorias) => set({ categorias, status: 'pronto' }),
  setErro: () => set({ status: 'erro' }),
  abrirProduto: (produtoAberto) => set({ produtoAberto }),
  setListaAberta: (listaAberta) => set({ listaAberta }),
  setBuscaAberta: (buscaAberta) => set({ buscaAberta }),
  setCategoriaAtiva: (categoriaAtiva) => set({ categoriaAtiva }),
}));

// Algum painel por cima da página? (pausa a rolagem suave e a cena 3D)
export const useAlgumPainelAberto = () =>
  useUI((s) => !!s.produtoAberto || s.listaAberta || s.buscaAberta);
