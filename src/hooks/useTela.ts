import { useSyncExternalStore } from 'react';

function useMedia(consulta: string): boolean {
  return useSyncExternalStore(
    (avisar) => {
      const m = window.matchMedia(consulta);
      m.addEventListener('change', avisar);
      return () => m.removeEventListener('change', avisar);
    },
    () => window.matchMedia(consulta).matches,
    () => false,
  );
}

export const useDesktop = () => useMedia('(min-width: 768px)');
export const useSemMovimento = () => useMedia('(prefers-reduced-motion: reduce)');
export const useMouse = () => useMedia('(hover: hover) and (pointer: fine)');
