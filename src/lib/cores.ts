import { normalizar } from './catalogo';

// Nome de cor (texto livre da planilha) -> cor da bolinha. Nome que não
// está aqui cai num tom neutro; o texto do chip continua o da planilha.
const MAPA_CORES: Record<string, string> = {
  branco: '#F7F6F2', preto: '#1C1C1E', vermelho: '#C0392B',
  azul: '#2E5FA3', verde: '#3E8E5A', amarelo: '#E8C547',
  roxo: '#7B4EA0', lilas: '#B79CC9', rosa: '#E195B8',
  laranja: '#D9782D', cinza: '#8A8A85', dourado: '#C9A227',
  prateado: '#B8B8B2', prata: '#B8B8B2', marrom: '#6B4A34',
  bege: '#D9C7A3', turquesa: '#3FA9A0', vinho: '#5E2129',
  areia: '#D8C3A0', creme: '#EFE6D2', nude: '#E3C4AE', grafite: '#3B3F45',
  chumbo: '#55595E', madeira: '#A0714A', transparente: 'transparent',
};

export function corDaBolinha(nomeCor: string): string {
  const nome = normalizar(nomeCor);
  if (MAPA_CORES[nome]) return MAPA_CORES[nome];
  // "Verde Matte" -> verde
  return MAPA_CORES[nome.split(/\s+/)[0]] ?? '#9A948A';
}
