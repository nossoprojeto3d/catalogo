// Ponte para o medicao.js (GA4 com aviso de cookies), carregado no
// index.html. Só envia algo se a pessoa aceitou os cookies.
declare global {
  interface Window {
    np3dTrack?: (evento: string, params?: Record<string, string | number | boolean>) => void;
  }
}

export function medir(evento: string, params?: Record<string, string | number | boolean>) {
  window.np3dTrack?.(evento, params);
}
