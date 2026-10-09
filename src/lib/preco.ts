import type { Produto } from './catalogo';

// "1.234,56" -> 1234.56 (a planilha usa vírgula decimal)
export function paraNumero(valor: string): number {
  return Number(String(valor).replace(/\./g, '').replace(',', '.').replace(/[^\d.]/g, '')) || 0;
}

export function emReais(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// Promoção só vale quando é menor que o preço cheio. Promocional igual ou
// maior que o original é erro de digitação na planilha e é ignorado.
export function emPromocao(p: Produto): boolean {
  const original = paraNumero(p.preco);
  const promo = paraNumero(p.precoPromocional);
  return promo > 0 && (original <= 0 || promo < original);
}

export function precoUnitario(p: Produto): number {
  return emPromocao(p) ? paraNumero(p.precoPromocional) : paraNumero(p.preco);
}

// Preço zerado/vazio = valor a combinar, nunca "R$ 0,00".
export function textoPreco(n: number): string {
  return n > 0 ? emReais(n) : 'Sob consulta';
}

export function percentualDesconto(p: Produto): number {
  const original = paraNumero(p.preco);
  if (!emPromocao(p) || original <= 0) return 0;
  return Math.round((1 - paraNumero(p.precoPromocional) / original) * 100);
}
