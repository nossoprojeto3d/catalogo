import { useEffect } from 'react';
import { useUI, type Pagina } from '../store/ui';

// As páginas moram no hash: o link pode ser compartilhado e o "voltar" do
// celular funciona. #produto/... é só uma tela por cima e não troca a página.
function lerRota(hash: string): Pagina | null {
  if (hash.startsWith('#produto/')) return null;
  if (hash === '#brindes') return { tipo: 'brindes' };
  if (hash === '#produtos') return { tipo: 'produtos' };
  const categoria = hash.match(/^#categoria\/(.+)$/);
  if (categoria) return { tipo: 'produtos', categoria: decodeURIComponent(categoria[1]) };
  return { tipo: 'inicio' };
}

export function hashDaPagina(p: Pagina): string {
  if (p.tipo === 'brindes') return '#brindes';
  if (p.tipo === 'produtos') return p.categoria ? `#categoria/${encodeURIComponent(p.categoria)}` : '#produtos';
  return '#inicio';
}

export function irPara(p: Pagina) {
  const hash = hashDaPagina(p);
  if (location.hash === hash) window.scrollTo(0, 0);
  else location.hash = hash;
}

export function useRota() {
  const setPagina = useUI((s) => s.setPagina);
  useEffect(() => {
    const aplicar = () => {
      const pagina = lerRota(location.hash);
      if (!pagina) return;
      const atual = hashDaPagina(useUI.getState().pagina);
      setPagina(pagina);
      if (atual !== hashDaPagina(pagina)) window.scrollTo(0, 0);
    };
    aplicar();
    window.addEventListener('hashchange', aplicar);
    return () => window.removeEventListener('hashchange', aplicar);
  }, [setPagina]);
}
