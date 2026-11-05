// A chave do GitHub fica no aparelho cifrada com a senha do painel. O site inteiro do
// domínio divide o mesmo localStorage, então a chave nunca é guardada em texto puro.
// A senha não é salva: uma senha errada simplesmente não consegue decifrar.
const CHAVE_LOCAL = 'np3d_painel';
const ITERACOES = 310_000;

type Guardado = { nome: string; sal: string; iv: string; cifra: string };

const paraTexto = (bytes: ArrayBuffer | Uint8Array) => btoa(String.fromCharCode(...new Uint8Array(bytes)));
const paraBytes = (texto: string) => Uint8Array.from(atob(texto), (c) => c.charCodeAt(0));

async function derivar(senha: string, sal: Uint8Array) {
  const material = await crypto.subtle.importKey('raw', new TextEncoder().encode(senha), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', hash: 'SHA-256', salt: sal.slice(), iterations: ITERACOES },
    material,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

function ler(): Guardado | null {
  try {
    const bruto = localStorage.getItem(CHAVE_LOCAL);
    return bruto ? JSON.parse(bruto) : null;
  } catch {
    return null;
  }
}

export const nomeGuardado = () => ler()?.nome ?? null;

export async function guardarAcesso(nome: string, token: string, senha: string) {
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cifra = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, await derivar(senha, sal), new TextEncoder().encode(token));
  const guardado: Guardado = { nome, sal: paraTexto(sal), iv: paraTexto(iv), cifra: paraTexto(cifra) };
  localStorage.setItem(CHAVE_LOCAL, JSON.stringify(guardado));
}

// Devolve a chave, ou null se a senha estiver errada.
export async function abrirAcesso(senha: string): Promise<string | null> {
  const guardado = ler();
  if (!guardado) return null;
  try {
    const aberto = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: paraBytes(guardado.iv) },
      await derivar(senha, paraBytes(guardado.sal)),
      paraBytes(guardado.cifra),
    );
    return new TextDecoder().decode(aberto);
  } catch {
    return null;
  }
}

export function apagarAcesso() {
  try {
    localStorage.removeItem(CHAVE_LOCAL);
  } catch {
    /* navegador sem armazenamento: não havia nada guardado */
  }
}
