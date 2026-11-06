// Texto do botão "Copiar prompt" da ficha, para tratar a foto numa IA antes de subir.
// Mesmo padrão de docs/padrao-fotos.md; se mudar lá, mude aqui. O nome do arquivo
// não aparece porque o painel cuida disso ao salvar.
export function promptDaFoto(nomeDaPeca: string): string {
  const peca = nomeDaPeca.trim();
  return `Você vai preparar uma foto de produto para o catálogo de uma loja de peças
impressas em 3D. Use a foto anexada como referência do produto.${peca ? `\nProduto: ${peca}.` : ''}

REGRA MAIS IMPORTANTE: não altere o produto. Formato, cores, proporções,
textura, detalhes e quantidade de peças devem ficar idênticos aos da foto
original. Você só pode mudar o fundo, o enquadramento, a luz e o tamanho.
Não invente peças, acessórios ou detalhes que não existem.

Entrega:
- Uma imagem de 1200 x 900 pixels, paisagem, proporção 4:3.
- Formato JPEG, cores sRGB.

Enquadramento:
- Produto centralizado na horizontal e na vertical.
- O produto inteiro precisa caber na faixa central de 675 pixels de largura
  (de x = 262 a x = 937). Nada do produto pode ficar fora dessa faixa,
  porque as laterais da foto são cortadas em alguns lugares do site.
- O produto ocupa cerca de 520 x 600 pixels (60% a 75% da altura da foto),
  com folga em cima e embaixo. Não encoste o produto nas bordas.
- Se forem várias peças, agrupe todas juntas dentro dessa faixa central.

Fundo e luz:
- Fundo de estúdio liso e contínuo, sem emenda visível, em tom claro e
  neutro (off-white, areia clara ou cinza claro), com superfície fosca.
- Luz suave e difusa, sem reflexo estourado, com uma sombra leve e natural
  embaixo do produto.
- O produto deve estar nítido, com as cores fiéis às da peça real.

Não coloque:
- Texto, logotipo, marca d'água, moldura, borda ou selo.
- Setas, réguas ou medidas desenhadas.
- Mãos, plantas ou objetos que não fazem parte do produto (a menos que eu
  peça para mostrar a escala).
- Colagem de várias fotos numa imagem só.

Antes de entregar, confira: 1200 x 900 px, produto inteiro dentro da faixa
central de 675 px, fundo liso e claro, nenhum texto na imagem.`;
}
