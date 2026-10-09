import { readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { Plugin } from 'vite';

// Módulo virtual "virtual:fotos": a lista das fotos que existem em
// public/imagens (com subpastas). A página escolhe a foto certa sem
// tentar endereços que dão 404. Foto nova entra no próximo build/push;
// no servidor local, reinicie o "npm run dev".
const PASTA = 'public/imagens';
const ID = 'virtual:fotos';

function listar(pasta: string): string[] {
  return readdirSync(pasta).flatMap((nome) => {
    const caminho = join(pasta, nome);
    if (statSync(caminho).isDirectory()) return listar(caminho);
    return /\.(jpe?g|png|webp)$/i.test(nome) ? [relative(PASTA, caminho)] : [];
  });
}

export function pluginFotos(): Plugin {
  return {
    name: 'np3d-fotos',
    resolveId: (id) => (id === ID ? '\0' + ID : undefined),
    load(id) {
      if (id !== '\0' + ID) return;
      return `export default ${JSON.stringify(listar(PASTA).sort())};`;
    },
  };
}
