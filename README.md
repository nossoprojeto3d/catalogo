# Catálogo Nosso Projeto 3D

Catálogo digital dos produtos da Nosso Projeto 3D. O cliente navega pelas
categorias, escolhe a peça e finaliza o pedido direto no WhatsApp — não tem
carrinho, pagamento nem cadastro.

Não existe banco de dados: os produtos ficam numa planilha do Google Sheets,
e a página busca esses dados sozinha toda vez que alguém abre o link. Pra
adicionar, editar ou remover um produto, é só mexer na planilha — nunca
precisa editar este arquivo nem subir nada de novo.

## Configuração (feita uma única vez)

Abrir o `index.html` e preencher, no topo do script:

- `WHATSAPP_NUMERO` — número com DDI 55 + DDD, só números
- `SHEET_ID` — o código que fica no link da planilha, entre `/d/` e `/edit`
- `NOME_DA_ABA` — o nome da aba dentro da planilha

## Planilha

Colunas, exatamente nessa grafia (linha 1):

`Categoria | Produto | Codigo | Descricao | Preco | Foto | Tag | PrecoPromocional | MaisVendido | Esgotado | Cores`

- Uma linha por produto.
- `Codigo` é opcional, mas ajuda a identificar o produto exato quando o
  pedido chega no WhatsApp (ex: `DEC-01`).
- `Descricao` também é opcional — se ficar vazia, o card do produto
  simplesmente fica mais compacto.
- `Tag` é opcional — texto livre tipo `Lançamento`, `Oferta`, `Novo`,
  `Exclusivo`... aparece como um selo em cima da foto do produto. Deixe
  vazio pra não mostrar nenhum. Escrever qualquer texto que contenha a
  palavra "Lançamento" (ex: `Lançamento`, `Novo Lançamento`) também
  coloca o produto automaticamente numa categoria "Lançamentos" que
  aparece sempre primeiro na lista — o produto continua normalmente
  na categoria original dele também, essa é só uma vitrine extra.
  Não precisa criar essa categoria na planilha, ela se monta sozinha.
- `PrecoPromocional` é opcional — preencha só quando o produto estiver
  em promoção (ex: `19,90`). O card passa a mostrar o preço original
  riscado + esse valor, e o card treme brevemente ao aparecer na tela.
  A mensagem que vai pro WhatsApp também já leva o valor promocional.
- `MaisVendido` é opcional — controla o carrossel "Os queridinhos" que
  aparece acima das categorias. Preencha com um número pra definir a
  posição (`1` aparece primeiro, `2` em seguida, e assim por diante).
  Se não quiser se preocupar com a ordem, qualquer texto/número serve
  só pra marcar o produto — ele entra no fim da lista. Deixe vazio pra
  não aparecer no carrossel. Lá só aparece foto e nome (sem preço,
  descrição ou tag) — é só uma vitrine; clicar no card leva direto até
  o produto na listagem completa da categoria dele, com o botão de
  WhatsApp já ali.
- `Esgotado` é opcional — preencha com qualquer texto (ex.: `sim`) quando
  o produto estiver fora de estoque. O card mostra um selo "Esgotado" e o
  botão vira "Avise-me quando voltar" (manda WhatsApp com uma mensagem
  diferente, avisando que é uma peça esgotada). O produto continua
  aparecendo na listagem, só que sempre por último. Deixe vazio assim
  que repor o estoque — não precisa apagar e recriar a linha.
- `Cores` é opcional — lista de cores separadas por vírgula (ex.:
  `Branco, Preto, Dourado`). Quando preenchida, some das mãos do card na
  listagem (pra não desalinhar o card de quem não tem cor) e aparece só
  no zoom da foto, como bolinhas clicáveis — escolher uma já atualiza o
  botão "Quero esse!" que aparece ali, incluindo a cor na mensagem do
  WhatsApp. Nomes comuns (branco, preto, azul, verde, dourado etc.)
  ganham a bolinha na cor certa; nome que a página não reconhece cai num
  tom neutro, mas o texto continua certo. Produto sem cor cadastrada
  continua exatamente como antes, sem essa seção aparecer.
- A planilha precisa estar compartilhada como "Qualquer pessoa com o
  link → Leitor", senão a página não consegue ler os dados.

## Fotos

Forma recomendada — automática pelo código do produto:

1. Nomeie o arquivo de imagem exatamente igual ao `Codigo` do produto
   (ex.: produto com código `SEN-01` → arquivo `SEN-01.jpg`). Maiúsculo
   ou minúsculo tanto faz, a página tenta as duas formas.
2. Coloque o arquivo dentro da pasta `imagens/` deste repositório — pode
   ser direto na raiz dela ou dentro de uma subpasta com o nome exato da
   categoria (ex.: `imagens/Sensoriais - Articulados/SEN-01.jpg`), pra
   manter organizado. A página procura nos dois lugares.
3. Suba (commit + push) o arquivo pro GitHub.
4. **Deixe a coluna `Foto` da planilha vazia** para esse produto — a
   página encontra a imagem sozinha pelo código.

Extensões aceitas: `.jpg`, `.jpeg`, `.png`, `.webp`. Se nenhum arquivo
correspondente for encontrado, o card mostra o placeholder "Foto em
breve" em vez de imagem quebrada.

Forma alternativa — link direto: se preferir, ainda dá pra preencher a
coluna `Foto` da planilha com um link direto de imagem (ex.: subindo a
foto no [imgbb.com](https://imgbb.com) ou [postimages.org](https://postimages.org)).
Quando a coluna `Foto` está preenchida, ela tem prioridade sobre a busca
automática pelo código.

Proporção recomendada: paisagem (4:3), com o produto centralizado e com
uma margem ao redor — isso também ajuda quando a mesma foto aparece
recortada no carrossel "Os queridinhos" (3:4). Até 1200px no lado maior,
e o arquivo abaixo de ~400KB pra carregar rápido no celular.

## Estrutura

```
index.html      → a página do catálogo
logo.png         → logo da marca (favicon, cabeçalho e rodapé)
imagens/         → fotos dos produtos (veja a seção Fotos acima)
```

## Como funciona por dentro

Tudo em um arquivo HTML principal (+ CSS e JS inline), sem build e sem
dependência de servidor — nenhuma lib externa. A página busca a planilha
publicada em CSV, sempre sem cache (pra nunca mostrar preço/produto
desatualizado), monta as categorias e produtos em memória, e desenha os
cards. As categorias aparecem como pills de filtro acima da listagem, e os
produtos carregam aos poucos (6 em 6) conforme o usuário rola a página —
poupa dados de quem tá com internet mais fraca, já que cada produto é uma
foto. Se a planilha não responder
(link errado, sem internet, compartilhamento desligado), aparece uma tela
de manutenção com um botão direto pro WhatsApp, em vez de dar erro na cara
do cliente.
