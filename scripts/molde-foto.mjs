// Gera docs/molde-foto-1200x900.png: o molde das fotos de produto, com as
// áreas que cada parte do catálogo recorta. Uso: node scripts/molde-foto.mjs
import sharp from 'sharp';

const L = 1200, A = 900;
const quadrado = { x: (L - 900) / 2, w: 900 };   // cards do catálogo (1:1)
const retrato = { x: (L - 675) / 2, w: 675 };    // queridinhos (3:4): zona segura
const produto = { w: 520, h: 600 };              // tamanho sugerido do produto

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}" font-family="Helvetica, Arial, sans-serif">
  <rect width="${L}" height="${A}" fill="#ece9e3"/>
  <rect x="1" y="1" width="${L - 2}" height="${A - 2}" fill="none" stroke="#17181b" stroke-width="2"/>

  <rect x="${quadrado.x}" y="2" width="${quadrado.w}" height="${A - 4}" fill="none" stroke="#5a5d55" stroke-width="3" stroke-dasharray="14 10"/>

  <rect x="${retrato.x}" y="2" width="${retrato.w}" height="${A - 4}" fill="rgba(198,244,50,0.18)" stroke="#6f8f00" stroke-width="4"/>
  <text x="${L / 2}" y="92" font-size="24" fill="#3f5208" font-weight="700" text-anchor="middle">ZONA SEGURA (675 x 900)</text>
  <text x="${L / 2}" y="122" font-size="18" fill="#3f5208" text-anchor="middle">o produto inteiro precisa caber aqui dentro</text>

  <rect x="${(L - produto.w) / 2}" y="${(A - produto.h) / 2 + 30}" width="${produto.w}" height="${produto.h}" rx="24" fill="none" stroke="#17181b" stroke-width="2" stroke-dasharray="6 8"/>
  <text x="${L / 2}" y="${A / 2 + 30}" font-size="22" fill="#17181b" text-anchor="middle">PRODUTO</text>
  <text x="${L / 2}" y="${A / 2 + 58}" font-size="17" fill="#17181b" text-anchor="middle">cerca de 520 x 600 px, centralizado</text>
  <rect x="10" y="12" width="660" height="38" rx="8" fill="#ece9e3" stroke="#17181b" stroke-width="1.5"/>
  <text x="20" y="38" font-size="22" fill="#17181b" font-weight="700">1200 x 900 px (4:3) - foto inteira: anel, tela do produto, capas</text>
  <rect x="${quadrado.x + 6}" y="${A - 48}" width="420" height="34" rx="8" fill="#ece9e3"/>
  <text x="${quadrado.x + 14}" y="${A - 24}" font-size="20" fill="#5a5d55">Recorte dos cards do catálogo (900 x 900)</text>
</svg>`;

await sharp(Buffer.from(svg)).png().toFile('docs/molde-foto-1200x900.png');
console.log('ok: docs/molde-foto-1200x900.png');
