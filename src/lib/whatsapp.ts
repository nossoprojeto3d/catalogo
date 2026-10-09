import type { Produto } from './catalogo';
import { WHATSAPP_NUMERO } from './config';
import { emPromocao, emReais, paraNumero, precoUnitario } from './preco';

export type ItemPedido = { produto: Produto; quantidade: number; cor: string };

export function linkWhatsapp(mensagem: string): string {
  return `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;
}

export const MENSAGEM_GERAL = 'Oi! Vi o catálogo de vocês e fiquei com uma dúvida.';

// Formato do pedido (aprovado em 08/10/2026). *texto* vira negrito no WhatsApp.
//
//   *1. Estrela Sensorial* (SEN-01)
//   2 x R$ 24,90 = R$ 49,80
//   Promoção, de R$ 29,90 cada
//   Cor: Azul
function blocoItem({ produto, quantidade, cor }: ItemPedido, indice: number): string {
  const unitario = precoUnitario(produto);
  const linhas = [`*${indice + 1}. ${produto.nome}*${produto.codigo ? ` (${produto.codigo})` : ''}`];
  if (unitario <= 0) linhas.push(`${quantidade} x valor a combinar`);
  else if (quantidade > 1) linhas.push(`${quantidade} x ${emReais(unitario)} = ${emReais(unitario * quantidade)}`);
  else linhas.push(`1 x ${emReais(unitario)}`);
  if (unitario > 0 && emPromocao(produto) && paraNumero(produto.preco) > 0) {
    linhas.push(`Promoção, de ${emReais(paraNumero(produto.preco))} cada`);
  }
  if (cor) linhas.push(`Cor: ${cor}`);
  return linhas.join('\n');
}

// Serve tanto para "Pedir pelo WhatsApp" de um produto quanto para a lista.
export function mensagemPedido(itens: ItemPedido[]): string {
  const validos = itens.filter((i) => i.quantidade > 0);
  const total = validos.reduce((s, i) => s + precoUnitario(i.produto) * i.quantidade, 0);
  const temACombinar = validos.some((i) => precoUnitario(i.produto) <= 0);
  const apenasACombinar = validos.length > 0 && validos.every((i) => precoUnitario(i.produto) <= 0);

  let msg = 'Olá! Quero fazer um pedido pelo catálogo:\n\n';
  msg += validos.map(blocoItem).join('\n\n');
  msg += '\n\n';
  if (apenasACombinar) msg += '*Total: a combinar*\n';
  else msg += `*Total: ${emReais(total)}*\n${temACombinar ? '(sem os itens a combinar)\n' : ''}`;
  msg += '\nPode confirmar disponibilidade e prazo?';
  return msg;
}

export function mensagemAviseMe(p: Produto): string {
  return (
    'Olá! Vi este produto no catálogo, mas está esgotado. Podem me avisar quando voltar?\n\n' +
    `*${p.nome}*${p.codigo ? ` (${p.codigo})` : ''}`
  );
}
