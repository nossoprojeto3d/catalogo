// Leva fotos fora do padrão para 1200x900 (4:3) SEM cortar o produto:
// a foto original entra inteira, centralizada, e a sobra é preenchida
// prolongando o próprio fundo da foto (bordas copiadas e desfocadas), com
// uma transição suave pra não aparecer emenda.
//
// Uso: node scripts/padronizar-fotos.mjs <pasta-origem> <pasta-destino> [CÓDIGO ...]
// Sem códigos, processa toda foto da origem que não esteja em 1200x900.
// Não sobrescreve a origem.
import sharp from 'sharp';
import { statSync } from 'node:fs';
import { mkdir, readdir } from 'node:fs/promises';
import { basename, join } from 'node:path';

const L = 1200, A = 900;
const SUAVE = 90; // largura da transição entre a foto e o fundo prolongado (px)
const QUALIDADE = 82;

const [, , origem, destino, ...codigos] = process.argv;
if (!origem || !destino) {
  console.error('Uso: node scripts/padronizar-fotos.mjs <origem> <destino> [CÓDIGO ...]');
  process.exit(1);
}
await mkdir(destino, { recursive: true });

// Máscara de opacidade: 100% no meio, esmaecendo nas bordas que encostam no
// fundo prolongado (só nos lados onde sobrou espaço).
function mascara(w, h, lados) {
  const g = (id, x1, y1, x2, y2) =>
    `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"><stop offset="0" stop-color="#000"/><stop offset="1" stop-color="#fff"/></linearGradient>`;
  const f = Math.min(SUAVE, Math.floor(Math.min(w, h) / 4));
  const partes = [];
  if (lados.esq) partes.push(`<rect x="0" y="0" width="${f}" height="${h}" fill="url(#e)"/>`);
  if (lados.dir) partes.push(`<rect x="${w - f}" y="0" width="${f}" height="${h}" fill="url(#d)"/>`);
  if (lados.cima) partes.push(`<rect x="0" y="0" width="${w}" height="${f}" fill="url(#c)"/>`);
  if (lados.baixo) partes.push(`<rect x="0" y="${h - f}" width="${w}" height="${f}" fill="url(#b)"/>`);
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">
    <defs>${g('e', 0, 0, 1, 0)}${g('d', 1, 0, 0, 0)}${g('c', 0, 0, 0, 1)}${g('b', 0, 1, 0, 0)}</defs>
    <rect width="${w}" height="${h}" fill="#fff"/>${partes.join('')}</svg>`);
}

async function padronizar(arquivo) {
  const nome = basename(arquivo).replace(/\.(jpe?g|png|webp)$/i, '');
  const { width: w, height: h } = await sharp(arquivo).metadata();

  // Quase no padrão (diferença de poucos px): só ajusta, sem preencher nada.
  if (Math.abs(w / h - L / A) < 0.01) {
    await sharp(arquivo).resize(L, A, { fit: 'cover' }).jpeg({ quality: QUALIDADE, mozjpeg: true }).toFile(join(destino, `${nome}.jpg`));
    return { nome, de: `${w}x${h}`, como: 'ajuste fino' };
  }

  // Encaixa a foto inteira no quadro 1200x900.
  const escala = Math.min(L / w, A / h);
  const fw = Math.round(w * escala), fh = Math.round(h * escala);
  const esq = Math.floor((L - fw) / 2), cima = Math.floor((A - fh) / 2);
  const foto = await sharp(arquivo).resize(fw, fh).toBuffer();

  // Fundo: só a faixa da borda da foto (6px) esticada pra preencher a sobra,
  // suavizada ao longo da borda. Não usa o miolo da foto, então a cor do
  // produto não vaza pro fundo e não sobram "riscos".
  const dir = L - fw - esq, baixo = A - fh - cima;
  const faixa = async (left, top, width, height, alvoW, alvoH, horizontal) => {
    const tira = await sharp(foto).extract({ left, top, width, height }).toBuffer();
    const media = await sharp(tira).resize(horizontal ? 24 : 1, horizontal ? 1 : 24, { fit: 'fill' }).toBuffer();
    return sharp(media).resize(alvoW, alvoH, { fit: 'fill', kernel: 'cubic' }).blur(12).toBuffer();
  };
  const camadas = [];
  if (esq > 0) camadas.push({ input: await faixa(0, 0, 6, fh, esq + SUAVE, A, false), left: 0, top: 0 });
  if (dir > 0) camadas.push({ input: await faixa(fw - 6, 0, 6, fh, dir + SUAVE, A, false), left: L - dir - SUAVE, top: 0 });
  if (cima > 0) camadas.push({ input: await faixa(0, 0, fw, 6, L, cima + SUAVE, true), left: 0, top: 0 });
  if (baixo > 0) camadas.push({ input: await faixa(0, fh - 6, fw, 6, L, baixo + SUAVE, true), left: 0, top: A - baixo - SUAVE });
  const { dominant } = await sharp(foto).stats();
  const fundo = await sharp({ create: { width: L, height: A, channels: 3, background: dominant } }).composite(camadas).png().toBuffer();

  // Foto com bordas esmaecidas só nos lados que encostam no fundo.
  const lados = { esq: esq > 0, dir: L - fw - esq > 0, cima: cima > 0, baixo: A - fh - cima > 0 };
  const alfa = await sharp(mascara(fw, fh, lados)).greyscale().toColourspace('b-w').raw().toBuffer();
  const fotoSuave = await sharp(foto).ensureAlpha().joinChannel(alfa, { raw: { width: fw, height: fh, channels: 1 } }).png().toBuffer();

  await sharp(fundo)
    .composite([{ input: fotoSuave, left: esq, top: cima }])
    .jpeg({ quality: QUALIDADE, mozjpeg: true })
    .toFile(join(destino, `${nome}.jpg`));
  return { nome, de: `${w}x${h}`, como: esq > 0 ? 'fundo prolongado nas laterais' : 'fundo prolongado em cima e embaixo' };
}

const arquivos = (await readdir(origem)).filter((f) => /\.(jpe?g|png|webp)$/i.test(f));
const alvo = [];
for (const f of arquivos) {
  const cod = f.replace(/\.[^.]+$/, '');
  if (codigos.length && !codigos.includes(cod)) continue;
  const { width, height } = await sharp(join(origem, f)).metadata();
  if (!codigos.length && width === L && height === A) continue;
  alvo.push(join(origem, f));
}
for (const a of alvo) {
  const r = await padronizar(a);
  const { size } = statSync(join(destino, `${r.nome}.jpg`));
  console.log(`${r.nome}  ${r.de} -> 1200x900  ${Math.round(size / 1024)}KB  (${r.como})`);
}
