import { readFileSync } from 'node:fs';
import { env } from 'node:process';
import type { Plugin } from 'vite';
import { categoriasDoArquivo, normalizar, queridinhos, type ArquivoCatalogo } from '../src/lib/catalogo';
import { listarFotos } from './plugin-fotos';

// O robô que monta a prévia do link (WhatsApp e outros) não roda o site nem
// enxerga o que vem depois do "#". Por isso cada peça com foto ganha uma página
// própria em p/<codigo>/, com foto e nome, que leva a pessoa para #produto/<CODIGO>.
// Para testar por um link temporário: URL_DO_SITE=https://.../catalogo/ npm run build
const URL_PADRAO = 'https://nossoprojeto3d.com.br/catalogo/';
const MARCA = 'Nosso Projeto 3D';
const DESCRICAO = 'Peça impressa em 3D. Veja o preço e peça direto pelo WhatsApp.';

const escapar = (texto: string) =>
  texto.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export function paginaDoProduto({ site, caminho, foto, codigo, nome }: { site: string; caminho: string; foto: string; codigo: string; nome?: string }) {
  const titulo = escapar(nome ? `${nome} | ${MARCA}` : `Catálogo ${MARCA}`);
  const destino = `${caminho}#produto/${encodeURIComponent(codigo)}`;
  const endereco = escapar(`${site}p/${encodeURIComponent(normalizar(codigo))}/`);
  const imagem = escapar(`${site}imagens/${encodeURIComponent(foto)}`);
  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${titulo}</title>
<meta name="description" content="${DESCRICAO}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${MARCA}">
<meta property="og:title" content="${titulo}">
<meta property="og:description" content="${DESCRICAO}">
<meta property="og:url" content="${endereco}">
<meta property="og:image" content="${imagem}">
<meta name="twitter:card" content="summary_large_image">
<script>location.replace(${JSON.stringify(destino)})</script>
</head>
<body><a href="${escapar(destino)}">Ver a peça no catálogo</a></body>
</html>
`;
}

function nomesDasPecas() {
  const arquivo: ArquivoCatalogo = JSON.parse(readFileSync('public/catalogo.json', 'utf8'));
  return new Map(arquivo.categorias.flatMap((c) => c.produtos).filter((p) => p.codigo).map((p) => [normalizar(p.codigo), p.nome]));
}

// queridinhos.json: os queridinhos que têm foto, para a página principal (nossoprojeto3d.com.br)
// sortear a cada visita. Sai a cada build, então acompanha o que for marcado no painel.
// brindes.json: as peças da categoria Brindes com foto, para a parte "Para empresas" da página principal.
export function listaDeQueridinhos(arquivo: ArquivoCatalogo, fotos: string[]) {
  return paraPagina(queridinhos(categoriasDoArquivo(arquivo)), fotos);
}

export function listaDeBrindes(arquivo: ArquivoCatalogo, fotos: string[]) {
  const brindes = categoriasDoArquivo(arquivo).find((c) => normalizar(c.nome) === 'brindes');
  return paraPagina((brindes?.produtos ?? []).filter((p) => !p.esgotado), fotos);
}

function paraPagina(produtos: ReturnType<typeof queridinhos>, fotos: string[]) {
  const porCodigo = new Map(fotos.map((f) => [normalizar(f.split('/').pop()!.replace(/\.[^.]+$/, '')), f]));
  return produtos
    .map((p) => {
      const arquivoFoto = p.codigo ? porCodigo.get(normalizar(p.codigo)) : undefined;
      const foto = p.foto || (arquivoFoto ? `imagens/${arquivoFoto.split('/').map(encodeURIComponent).join('/')}` : '');
      return { codigo: p.codigo, nome: p.nome.replace(/\s+/g, ' ').trim(), preco: p.preco, foto, link: `#produto/${encodeURIComponent(p.codigo || p.nome)}` };
    })
    .filter((p) => p.foto);
}

export function pluginCompartilhar(caminho: string): Plugin {
  return {
    name: 'np3d-compartilhar',
    apply: 'build',
    generateBundle() {
      const site = env.URL_DO_SITE || URL_PADRAO;
      const nomes = nomesDasPecas();
      const arquivo: ArquivoCatalogo = JSON.parse(readFileSync('public/catalogo.json', 'utf8'));
      this.emitFile({ type: 'asset', fileName: 'queridinhos.json', source: JSON.stringify(listaDeQueridinhos(arquivo, listarFotos())) });
      this.emitFile({ type: 'asset', fileName: 'brindes.json', source: JSON.stringify(listaDeBrindes(arquivo, listarFotos())) });
      for (const foto of listarFotos()) {
        const codigo = foto.split('/').pop()!.replace(/\.[^.]+$/, '');
        this.emitFile({
          type: 'asset',
          fileName: `p/${normalizar(codigo)}/index.html`,
          source: paginaDoProduto({ site, caminho, foto, codigo, nome: nomes.get(normalizar(codigo)) }),
        });
      }
    },
  };
}
