# Catálogo Nosso Projeto 3D

Catálogo digital dos produtos da Nosso Projeto 3D. O cliente navega pelas
categorias, escolhe a peça e finaliza o pedido direto no WhatsApp. Não tem
carrinho de pagamento nem cadastro.

Os produtos ficam numa planilha do Google Sheets, e a página lê os dados
sozinha toda vez que alguém abre o link. Para adicionar, editar ou remover
um produto, basta mexer na planilha. Não precisa mexer no código.

## Planilha

Cada aba da planilha é uma categoria. Colunas da linha 1, exatamente com
esta grafia (a ordem não importa):

`Produto | Codigo | Descricao | Cores | Preco | PrecoPromocional | Foto | MaisVendido | Esgotado`

- Uma linha por produto. `Produto` e `Preco` são o mínimo.
- `Codigo` identifica a peça no pedido do WhatsApp (ex.: `DEC-01`) e
  liga o produto à foto. Use sempre.
- `Descricao` é opcional e aparece na tela do produto.
- `Preco` com vírgula (ex.: `29,90`). Vazio ou `0,00` vira "Sob consulta",
  e no pedido aparece "valor a combinar".
- `PrecoPromocional` é opcional. Preencha só na promoção, com um valor
  menor que o `Preco`. A página mostra o preço riscado e o desconto em %,
  e a mensagem do WhatsApp avisa que é promoção.
- `Cores` é opcional: cores separadas por vírgula (ex.:
  `Branco, Preto, Areia, Verde Matte`). Quando preenchida, o cliente
  precisa escolher uma cor antes de pedir, e a cor vai na mensagem.
  Se a peça tem cores mas a coluna está vazia, o pedido chega sem cor.
- `MaisVendido` é opcional e coloca o produto na vitrine "Os
  queridinhos". Um número define a posição (`1` primeiro); qualquer outro
  texto (ex.: `Sim`) põe o produto no fim da vitrine. Produto esgotado
  não aparece lá.
- `Esgotado` é opcional: qualquer texto (ex.: `Sim`) marca a peça como
  esgotada. Ela vai para o fim da lista e o botão vira "Avise-me quando
  voltar". Se estava na lista de algum cliente, sai da lista com aviso.
  Apague o texto quando repor.
- A coluna `Tag` não é mais usada nesta versão e pode ficar como está.
- A planilha precisa estar compartilhada como "Qualquer pessoa com o
  link: Leitor".
- Aba nova só aparece no catálogo depois de entrar na lista
  `ABAS_CATEGORIAS`, em `src/lib/config.ts`.

## Fotos

1. Nomeie o arquivo igual ao `Codigo` do produto (ex.: `SEN-01.jpg`).
2. Coloque em `public/imagens/`.
3. Suba (commit + push). O site é refeito e publicado sozinho em poucos
   minutos.
4. Deixe a coluna `Foto` da planilha vazia. Ela só serve para usar um
   link de imagem de fora no lugar da foto do repositório.

Padrão: 1200×900 (paisagem 4:3), JPEG, abaixo de 400KB, com o produto
inteiro dentro da faixa central de 675 px, porque a foto aparece recortada
em quadrado no catálogo e em retrato (3:4) em "Os queridinhos". O padrão
completo, o molde e um prompt pronto para IA de imagens estão em
[docs/padrao-fotos.md](docs/padrao-fotos.md). Sem foto, aparece "Foto em breve".

## Para quem programa

- `npm install`, depois `npm run dev` para rodar local e `npm test`
  para testar as regras de preço e da mensagem do WhatsApp.
- A publicação é feita pelo GitHub Action `publicar.yml` a cada push na
  `main`. Em Settings > Pages, a origem precisa ser "GitHub Actions".
- Detalhes da estrutura no `CLAUDE.md`.
