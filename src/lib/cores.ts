import { normalizar } from './catalogo';

// Nome de cor (texto livre do painel) -> cor da bolinha. As chaves já vêm sem
// acento e em minúsculas. O nome inteiro vale primeiro ("vermelho bordo");
// depois o começo do nome ("verde militar fosco" -> "verde militar"); por fim
// qualquer palavra conhecida. Nome que não casa cai num tom neutro; o texto do
// chip continua o que foi digitado.
const MAPA_CORES: Record<string, string> = {
  // Básicas
  branco: '#F7F6F2', preto: '#1C1C1E', vermelho: '#C0392B', azul: '#2E5FA3',
  verde: '#3E8E5A', amarelo: '#E8C547', roxo: '#7B4EA0', rosa: '#E195B8',
  laranja: '#D9782D', cinza: '#8A8A85', marrom: '#6B4A34', bege: '#D9C7A3',
  transparente: 'transparent',

  // Brancos e claros
  'branco perolado': '#F1EDE4', perolado: '#F1EDE4', perola: '#F1EDE4',
  'off white': '#F2EEE3', 'branco gelo': '#EDF0F0', gelo: '#EDF0F0',
  creme: '#EFE6D2', marfim: '#F3EBD6', areia: '#D8C3A0', nude: '#E3C4AE',
  champagne: '#E6D3B3', fendi: '#C9B9A6',

  // Pretos e cinzas
  'preto fosco': '#232325', grafite: '#3B3F45', chumbo: '#55595E',
  'cinza claro': '#BDBDB8', 'cinza escuro': '#5A5A57', prateado: '#B8B8B2',
  prata: '#B8B8B2',

  // Vermelhos
  'vermelho bordo': '#7A1F2B', bordo: '#7A1F2B', vinho: '#5E2129',
  marsala: '#8E3B46', 'vermelho escuro': '#8B1E1E', carmim: '#A4161A',
  'vermelho ferrari': '#D0021B', coral: '#F27C6B', salmao: '#F4A08A',
  terracota: '#B5563A', cobre: '#B87333',

  // Rosas e roxos
  'rosa bebe': '#F6C9D6', 'rosa claro': '#F4C2D1', 'rosa pink': '#E0338A',
  pink: '#E0338A', magenta: '#C2187A', fucsia: '#C21E7A', 'rosa choque': '#E0338A',
  'rosa antigo': '#C99199', 'rose gold': '#D8A193', rose: '#D8A193',
  lilas: '#B79CC9', lavanda: '#C3B1E1', violeta: '#7F3FBF', uva: '#5B2A6E',
  'roxo escuro': '#4B2463',

  // Azuis
  'azul marinho': '#1F2D4F', marinho: '#1F2D4F', 'azul bebe': '#A9CCE8',
  'azul claro': '#8DB8E0', 'azul celeste': '#7EB6E3', celeste: '#7EB6E3',
  'azul royal': '#2747B8', royal: '#2747B8', 'azul escuro': '#1E3566',
  'azul petroleo': '#1F4E5A', petroleo: '#1F4E5A', 'azul turquesa': '#2FA4B0',
  turquesa: '#3FA9A0', 'azul tiffany': '#81D8D0', tiffany: '#81D8D0',
  ciano: '#2BB3D9', 'azul ceu': '#7EB6E3', 'azul serenity': '#92A8D1',

  // Verdes
  'verde militar': '#4B5320', militar: '#4B5320', 'verde oliva': '#6B7A2E',
  oliva: '#6B7A2E', 'verde musgo': '#5A6B2F', musgo: '#5A6B2F',
  'verde bandeira': '#1E8C3A', 'verde escuro': '#1F4D2E', 'verde floresta': '#228B3B',
  'verde limao': '#A8D53A', limao: '#A8D53A', 'verde claro': '#9ED39A',
  'verde agua': '#8FD3C1', 'verde menta': '#A8E0C6', menta: '#A8E0C6',
  'verde neon': '#5CFF4A', 'verde abacate': '#7FA650', 'verde salvia': '#9CAF88',
  salvia: '#9CAF88', 'verde esmeralda': '#14866A', esmeralda: '#14866A',
  'verde pistache': '#B5CF8C', pistache: '#B5CF8C', 'verde matte': '#4E8C63',

  // Amarelos e laranjas
  'amarelo ouro': '#E3A922', 'amarelo canario': '#F5D61E', 'amarelo claro': '#F3E28A',
  'amarelo bebe': '#F7E8A4', mostarda: '#C9A227', ocre: '#C88B2E',
  dourado: '#C9A227', ouro: '#D4AF37', 'laranja neon': '#FF6A1A',
  'laranja escuro': '#C25A1C', pessego: '#F5BE9B', abobora: '#E07B24',
  caramelo: '#B9732F',

  // Marrons e madeira
  'marrom cafe': '#4A3226', cafe: '#4A3226', chocolate: '#4E2E1E',
  'marrom claro': '#9C7350', castanho: '#6B4A34', madeira: '#A0714A',
  caqui: '#B9A77C', camelo: '#B88A57', bronze: '#8C6239',
};

// Chaves compostas primeiro, para "vermelho bordo" ganhar de "vermelho".
const CHAVES = Object.keys(MAPA_CORES).sort((a, b) => b.split(' ').length - a.split(' ').length);

export function corDaBolinha(nomeCor: string): string {
  const nome = normalizar(nomeCor).replace(/[-_/]+/g, ' ').replace(/\s+/g, ' ');
  if (MAPA_CORES[nome]) return MAPA_CORES[nome];
  // Começo do nome: "verde militar fosco" -> "verde militar" -> "verde"
  const palavras = nome.split(' ');
  for (let n = palavras.length - 1; n > 0; n--) {
    const cor = MAPA_CORES[palavras.slice(0, n).join(' ')];
    if (cor) return cor;
  }
  // Qualquer trecho conhecido: "tom bordo" -> bordo
  const achada = CHAVES.find((c) => ` ${nome} `.includes(` ${c} `));
  return achada ? MAPA_CORES[achada] : '#9A948A';
}
