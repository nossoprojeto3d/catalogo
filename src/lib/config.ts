/* =====================================================================
   CONFIGURAÇÃO. WHATSAPP_NUMERO: DDI 55 + DDD, só números. Produtos e
   categorias ficam em public/catalogo.json, editado pelo painel.
   ===================================================================== */
export const WHATSAPP_NUMERO = '5562993152843';

// Categorias mostradas em "Brindes para seus clientes", com os combos. Elas ficam fora
// das categorias de quem compra para si; Personalizados é venda comum.
export const ABAS_BRINDES = ['Brindes'];
export const QUANTIDADES_COMBO = [10, 30, 50];
export const QUANTIDADE_MAXIMA = 999;
// Desconto de cada combo nas abas de brindes. Outra quantidade é a combinar.
export const DESCONTOS_COMBO: Record<number, number> = { 10: 5, 30: 10, 50: 15 };

// Produtos carregam de 6 em 6 na rolagem (poupa dados no celular).
export const TAMANHO_LOTE = 6;

export const INSTAGRAM_URL = 'https://instagram.com/nossoprojeto3d';
