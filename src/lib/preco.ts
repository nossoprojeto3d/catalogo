import type { Produto } from './catalogo';
import { ABAS_BRINDES, DESCONTOS_COMBO, QUANTIDADES_COMBO } from './config';

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

// Combo: preço fechado da coluna Combos ou, sem ele, a quantidade do combo vezes o
// preço da unidade com o desconto do combo. O valor do combo é sempre inteiro: os centavos caem.
export function emCombo(p: Produto, quantidade: number): boolean {
  if (!temCombos(p)) return false;
  if ((p.combos[quantidade] ?? 0) > 0) return true;
  return QUANTIDADES_COMBO.includes(quantidade) && precoUnitario(p) > 0;
}

// Preço de cada peça na quantidade pedida, já em centavos exatos. Nas abas de
// brindes, abaixo do menor combo vale o preço normal; acima, fora dos combos,
// não há preço: é a combinar.
export function precoNaQuantidade(p: Produto, quantidade: number): number {
  if (!temCombos(p) || quantidade < QUANTIDADES_COMBO[0]) return precoUnitario(p);
  if (!emCombo(p, quantidade)) return 0;
  const centavos = Math.round(precoUnitario(p) * 100);
  return Math.round(centavos * (100 - (DESCONTOS_COMBO[quantidade] ?? 0)) / 100) / 100;
}

// Percentual real do combo. Com preço fechado na coluna Combos, é calculado a
// partir dele, para nunca indicar um desconto que não existe.
export function descontoDaQuantidade(p: Produto, quantidade: number): number {
  if (!temCombos(p) || !emCombo(p, quantidade)) return 0;
  const fechado = p.combos[quantidade] ?? 0;
  if (fechado <= 0) return DESCONTOS_COMBO[quantidade] ?? 0;
  const cheio = precoUnitario(p) * quantidade;
  return cheio > 0 ? Math.max(0, Math.round((1 - Math.floor(fechado) / cheio) * 100)) : 0;
}

export function totalDoItem(p: Produto, quantidade: number): number {
  // Arredonda em centavos antes: 0.7 * 30 daria 20.999... em ponto flutuante.
  const multiplicado = Math.round(precoNaQuantidade(p, quantidade) * 100) * quantidade / 100;
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
  if (total <= 0) return 'A combinar';
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
