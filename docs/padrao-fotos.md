# Padrão das fotos de produto

Toda foto de produto do catálogo segue este padrão. Assim ela aparece bem em
todos os lugares: no anel da abertura e na tela do produto aparece inteira,
nos cards do catálogo é recortada em quadrado e em "Os queridinhos" é
recortada em retrato.

Molde visual com as áreas: [molde-foto-1200x900.png](molde-foto-1200x900.png)

## Resumo

| Item | Padrão |
|---|---|
| Tamanho | 1200 x 900 px, paisagem 4:3 |
| Arquivo | JPEG, cores sRGB, até 400 KB (o ideal é perto de 120 KB) |
| Nome | o código do produto em maiúsculo: `KID-01.jpg` |
| Posição do produto | centralizado, inteiro dentro da faixa central de 675 px de largura (a zona segura) |
| Tamanho do produto | cerca de 520 x 600 px, ou 60% a 75% da altura da foto |
| Fundo | liso e contínuo, claro e neutro (off-white, areia ou cinza claro), sem objetos disputando atenção |
| Luz | suave e difusa, com sombra leve e natural embaixo do produto |
| Proibido | texto, logo, marca d'água, moldura, borda, colagem de várias fotos, setas ou medidas desenhadas |

A coluna `Foto` da planilha fica vazia: a página acha a foto pelo nome do
arquivo. Se a IA não acertar o tamanho exato ou o peso do arquivo, o
`/otimizar-imagens` ajusta isso. O enquadramento, porém, precisa vir certo.

## Prompt para a IA de imagens

Copie o bloco abaixo, anexe a foto original do produto (e, se a ferramenta
aceitar, o molde `molde-foto-1200x900.png`) e troque `<CÓDIGO>` pelo código
do produto.

```
Você vai preparar uma foto de produto para o catálogo de uma loja de peças
impressas em 3D. Use a foto anexada como referência do produto.

REGRA MAIS IMPORTANTE: não altere o produto. Formato, cores, proporções,
textura, detalhes e quantidade de peças devem ficar idênticos aos da foto
original. Você só pode mudar o fundo, o enquadramento, a luz e o tamanho.
Não invente peças, acessórios ou detalhes que não existem.

Entrega:
- Uma imagem de 1200 x 900 pixels, paisagem, proporção 4:3.
- Formato JPEG, cores sRGB.
- Nome do arquivo: <CÓDIGO>.jpg

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
central de 675 px, fundo liso e claro, nenhum texto na imagem.
```
