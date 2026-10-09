// Recolore a logo dourada original para a cor do catálogo v3 (limão
// "filamento"), preservando o relevo metálico: cada pixel vira um tom do
// degradê conforme a luminosidade original. Gera também os ícones.
// Uso: node scripts/recolorir-logo.mjs <logo-original.png>
import sharp from 'sharp';

const [, , origem = 'scripts/logo-original-dourada.png'] = process.argv;
const PARADAS = [
  [0.0, [54, 72, 6]],     // sombra
  [0.45, [150, 196, 22]], // tom médio
  [0.78, [198, 244, 50]], // limão (acento)
  [1.0, [244, 255, 196]], // brilho
];

function tom(t){
  for(let i = 1; i < PARADAS.length; i++){
    const [p1, c1] = PARADAS[i];
    const [p0, c0] = PARADAS[i - 1];
    if(t <= p1){
      const k = (t - p0) / (p1 - p0);
      return c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
    }
  }
  return PARADAS.at(-1)[1];
}

const { data, info } = await sharp(origem).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
let min = 1, max = 0;
const lum = new Float32Array(info.width * info.height);
for(let i = 0, p = 0; i < data.length; i += 4, p++){
  const l = (0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]) / 255;
  lum[p] = l;
  if(data[i + 3] > 200){ min = Math.min(min, l); max = Math.max(max, l); }
}
for(let i = 0, p = 0; i < data.length; i += 4, p++){
  const t = Math.min(1, Math.max(0, (lum[p] - min) / (max - min)));
  const [r, g, b] = tom(t);
  data[i] = r; data[i + 1] = g; data[i + 2] = b;
}
const recolorida = sharp(data, { raw: info });
await recolorida.clone().png({ compressionLevel: 9 }).toFile('public/logo.png');
await recolorida.clone().resize(180, 180, { fit: 'contain', background: { r: 12, g: 13, b: 11, alpha: 1 } })
  .extend({ top: 0, bottom: 0, left: 0, right: 0 }).png().toFile('public/apple-touch-icon.png');
await recolorida.clone().resize(64, 64, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toFile('public/favicon.png');
console.log('Logo recolorida:', info.width, 'x', info.height);
