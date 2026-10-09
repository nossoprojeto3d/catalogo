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

// Cada aba fica 5 minutos no sessionStorage: trocar de categoria ou
// voltar à página não refaz as 10 buscas, e preço/estoque seguem atuais.
export const DURACAO_CACHE_ABA_MS = 5 * 60 * 1000;

// Produtos carregam de 6 em 6 na rolagem (poupa dados no celular).
export const TAMANHO_LOTE = 6;

export const INSTAGRAM_URL = 'https://instagram.com/nossoprojeto3d';
