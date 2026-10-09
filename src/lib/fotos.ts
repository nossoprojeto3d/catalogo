import fotos from 'virtual:fotos';
import type { Produto } from './catalogo';
import { normalizar } from './catalogo';

const BASE = `${import.meta.env.BASE_URL}imagens/`;

// Cada visita ganha um ?v= novo: trocar uma foto em imagens/ aparece na
// hora, sem mexer em código.
const CACHE_BUST = Date.now();

// "kids/kid-01.jpg" -> caminho real, indexado por pasta + código sem extensão.
const PORCODIGO = new Map<string, string>();
for (const caminho of fotos) {
  const partes = caminho.split('/');
  const arquivo = partes.pop()!;
  const chave = `${normalizar(partes.join('/'))}|${normalizar(arquivo.replace(/\.[^.]+$/, ''))}`;
  if (!PORCODIGO.has(chave)) PORCODIGO.set(chave, caminho);
}

// Link da coluna Foto tem prioridade. Senão, imagens/<CODIGO>.<ext> na
// raiz ou na subpasta da categoria (maiúsculo ou minúsculo tanto faz).
export function urlFoto(p: Produto): string | null {
  if (p.foto) return p.foto;
  if (!p.codigo) return null;
  const codigo = normalizar(p.codigo);
  const caminho = PORCODIGO.get(`|${codigo}`) ?? PORCODIGO.get(`${normalizar(p.categoria)}|${codigo}`);
  if (!caminho) return null;
  return `${BASE}${caminho.split('/').map(encodeURIComponent).join('/')}?v=${CACHE_BUST}`;
}
