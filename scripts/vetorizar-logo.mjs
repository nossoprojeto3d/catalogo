// Vetoriza o contorno da logo (pelo canal alfa) para public/logo.svg,
// a versão nítida da marca usada na navegação.
// Uso: node scripts/vetorizar-logo.mjs
import sharp from 'sharp';
import potrace from 'potrace';
import { writeFile } from 'node:fs/promises';

const ESCALA = 3; // traça em resolução maior pra curva do P sair lisa
const { width, height } = await sharp('public/logo.png').metadata();
const mascara = await sharp('public/logo.png')
  .resize(width * ESCALA, height * ESCALA, { kernel: 'lanczos3' })
  .extractChannel('alpha').threshold(128).negate().png().toBuffer();

const svg = await new Promise((ok, erro) =>
  potrace.trace(mascara, { turdSize: 40, optTolerance: 0.4, threshold: 128 }, (e, s) => e ? erro(e) : ok(s)));
const d = svg.match(/ d="([^"]+)"/)[1];
const viewBox = `0 0 ${width * ESCALA} ${height * ESCALA}`;
await writeFile('public/logo.svg',
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}"><path fill="#C6F432" fill-rule="evenodd" d="${d}"/></svg>\n`);
console.log('path com', d.length, 'caracteres');
