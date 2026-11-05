// Prepara a foto no próprio aparelho, no padrão do catálogo: 1200×900, JPEG, leve.
const LARGURA = 1200;
const ALTURA = 900;
const LIMITE_BYTES = 300 * 1024;

export function carregarImagem(url: string): Promise<HTMLImageElement> {
  return new Promise((ok, erro) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = () => erro(new Error('Esta imagem não abriu. Escolha outra foto em JPEG ou PNG.'));
    img.src = url;
  });
}

// Corta para 4:3 sem deformar. posX e posY (0 a 100) dizem qual parte da foto fica.
export function recorte(largura: number, altura: number, posX: number, posY: number) {
  const proporcao = LARGURA / ALTURA;
  const w = Math.min(largura, altura * proporcao);
  const h = w / proporcao;
  return { x: ((largura - w) * posX) / 100, y: ((altura - h) * posY) / 100, w, h };
}

const paraBlob = (canvas: HTMLCanvasElement, qualidade: number) =>
  new Promise<Blob>((ok, erro) => canvas.toBlob((b) => (b ? ok(b) : erro(new Error('Não foi possível preparar a foto.'))), 'image/jpeg', qualidade));

const paraBase64 = (blob: Blob) =>
  new Promise<string>((ok, erro) => {
    const leitor = new FileReader();
    leitor.onload = () => ok(String(leitor.result).split(',')[1]);
    leitor.onerror = () => erro(new Error('Não foi possível preparar a foto.'));
    leitor.readAsDataURL(blob);
  });

export async function prepararFoto(img: HTMLImageElement, posX: number, posY: number): Promise<string> {
  const canvas = document.createElement('canvas');
  canvas.width = LARGURA;
  canvas.height = ALTURA;
  const contexto = canvas.getContext('2d');
  if (!contexto) throw new Error('Não foi possível preparar a foto.');
  const { x, y, w, h } = recorte(img.naturalWidth, img.naturalHeight, posX, posY);
  contexto.fillStyle = '#fff';
  contexto.fillRect(0, 0, LARGURA, ALTURA);
  contexto.imageSmoothingQuality = 'high';
  contexto.drawImage(img, x, y, w, h, 0, 0, LARGURA, ALTURA);
  let blob = await paraBlob(canvas, 0.84);
  for (const qualidade of [0.76, 0.68, 0.6, 0.5]) {
    if (blob.size <= LIMITE_BYTES) break;
    blob = await paraBlob(canvas, qualidade);
  }
  return paraBase64(blob);
}
