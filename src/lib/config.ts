/* =====================================================================
   CONFIGURAÇÃO: só precisa mexer aqui quando mudar número ou planilha.
   - WHATSAPP_NUMERO: DDI 55 + DDD, só números.
   - SHEET_ID: o código do link da planilha, entre "/d/" e "/edit".
   - ABAS_CATEGORIAS: cada aba da planilha é uma categoria. Aba nova só
     aparece no catálogo depois de entrar nesta lista.
   ===================================================================== */
export const WHATSAPP_NUMERO = '5562993152843';
export const SHEET_ID = '1g8NUVwsozRXUAVavaQlmjtLQOuw3td0q';
export const ABAS_CATEGORIAS = [
  'Natal',
  'Brindes',
  'Kids',
  'Pros Fãs',
  'Organizadores',
  'Setup dos Sonhos',
  'Personalizados',
  'Cantinho da Fé',
  'Profissões',
  'Time do coração',
  'Plantinhas Mimadas',
  'Lembrancinhas',
];

// Abas mostradas em "Brindes para seus clientes", com os combos. Elas ficam fora
// das categorias de quem compra para si; Personalizados é venda comum.
export const ABAS_BRINDES = ['Brindes'];
export const QUANTIDADES_COMBO = [10, 30, 50];
export const QUANTIDADE_MAXIMA = 999;
// Desconto de cada combo nas abas de brindes. Outra quantidade é a combinar.
export const DESCONTOS_COMBO: Record<number, number> = { 10: 5, 30: 10, 50: 15 };

// Cada aba fica 5 minutos no sessionStorage: trocar de categoria ou
// voltar à página não refaz as 10 buscas, e preço/estoque seguem atuais.
export const DURACAO_CACHE_ABA_MS = 5 * 60 * 1000;

// Produtos carregam de 6 em 6 na rolagem (poupa dados no celular).
export const TAMANHO_LOTE = 6;

export const INSTAGRAM_URL = 'https://instagram.com/nossoprojeto3d';
