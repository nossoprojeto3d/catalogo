import Lenis from 'lenis';
import { useEffect } from 'react';
import { useAlgumPainelAberto } from '../store/ui';
import { useSemMovimento } from './useTela';

let lenis: Lenis | null = null;
export const lenisAtual = () => lenis;

// Rolagem suave com roda do mouse/trackpad (Lenis). No toque o navegador
// continua no controle: Lenis não suaviza o dedo por padrão.
export function useRolagemSuave() {
  const semMovimento = useSemMovimento();
  const painelAberto = useAlgumPainelAberto();

  useEffect(() => {
    if (semMovimento) return;
    lenis = new Lenis({ lerp: 0.11, wheelMultiplier: 0.95, autoRaf: true });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, [semMovimento]);

  useEffect(() => {
    if (painelAberto) lenis?.stop();
    else lenis?.start();
  }, [painelAberto]);
}

export function rolarAte(alvo: string | HTMLElement, deslocamento = -88) {
  // Rolagem suave do Lenis só com mouse/trackpad. No toque vai a rolagem do
  // navegador: depois que uma gaveta solta a página, a conta interna do Lenis
  // pode estar velha e mandar pro topo.
  const mouse = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (lenis && mouse) {
    lenis.scrollTo(alvo, { offset: deslocamento, duration: 1.1 });
    return;
  }
  const el = typeof alvo === 'string' ? document.querySelector(alvo) : alvo;
  if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY + deslocamento, behavior: 'smooth' });
}
