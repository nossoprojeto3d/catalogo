import type { Produto } from './catalogo';
import { ABAS_BRINDES, QUANTIDADES_COMBO } from './config';

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

// Só as abas de brindes têm combo. Nas outras, 10 unidades são 10 unidades.
export function temCombos(p: Produto): boolean {
  return ABAS_BRINDES.includes(p.categoria);
}

// Combo: preço fechado da coluna Combos ou, sem ele, 10, 20 ou 30 vezes o
// preço da unidade. O valor do combo é sempre inteiro: os centavos caem.
export function emCombo(p: Produto, quantidade: number): boolean {
  if (!temCombos(p)) return false;
  if ((p.combos[quantidade] ?? 0) > 0) return true;
  return QUANTIDADES_COMBO.includes(quantidade) && precoUnitario(p) > 0;
}

export function totalDoItem(p: Produto, quantidade: number): number {
  // Arredonda em centavos antes: 0.7 * 30 daria 20.999... em ponto flutuante.
  const multiplicado = Math.round(precoUnitario(p) * 100) * quantidade / 100;
  if (!emCombo(p, quantidade)) return multiplicado;
  return Math.floor(p.combos[quantidade] ?? multiplicado);
}

export function emReaisInteiro(n: number): string {
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function textoDoItem(p: Produto, quantidade: number): string {
  const valor = totalDoItem(p, quantidade);
  return emCombo(p, quantidade) ? emReaisInteiro(valor) : emReais(valor);
}

// Total do pedido: sem centavos só se tiver combo e a soma der valor inteiro.
export function textoDoTotal(itens: { produto: Produto; quantidade: number }[]): string {
  const total = itens.reduce((s, i) => s + totalDoItem(i.produto, i.quantidade), 0);
  const inteiro = Number.isInteger(Math.round(total * 100) / 100) && itens.some((i) => emCombo(i.produto, i.quantidade));
  return inteiro ? emReaisInteiro(total) : emReais(total);
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
