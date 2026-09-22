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

`Categoria | CapaCategoria | Produto | Codigo | Descricao | Preco | Foto`

- Uma linha por produto.
- `CapaCategoria` não é usada na tela hoje (a seleção de categoria é só
  texto) — pode deixar em branco. A coluna continua existindo pra não
  bagunçar as outras, caso volte a ser usada no futuro.
- `Codigo` é opcional, mas ajuda a identificar o produto exato quando o
  pedido chega no WhatsApp (ex: `DEC-01`).
- `Descricao` também é opcional — se ficar vazia, o card do produto
  simplesmente fica mais compacto.
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
correspondente for encontrado, o card mostra o placeholder "Foto do
produto" em vez de imagem quebrada.

Forma alternativa — link direto: se preferir, ainda dá pra preencher a
coluna `Foto` da planilha com um link direto de imagem (ex.: subindo a
foto no [imgbb.com](https://imgbb.com) ou [postimages.org](https://postimages.org)).
Quando a coluna `Foto` está preenchida, ela tem prioridade sobre a busca
automática pelo código.

Proporção recomendada: retrato (3:4), até 1200px no lado maior, e o
arquivo abaixo de ~400KB pra carregar rápido no celular.

## Estrutura

```
index.html      → a página do catálogo
imagens/         → opcional, caso hospede fotos aqui em vez de usar ImgBB
```

## Como funciona por dentro

Tudo em um arquivo só (HTML + CSS + JS), sem build, sem dependências. A
página busca a planilha publicada em CSV, monta as categorias e produtos em
memória, e desenha os cards. Se a planilha não responder (link errado,
sem internet, compartilhamento desligado), aparece uma tela de manutenção
com um botão direto pro WhatsApp, em vez de dar erro na cara do cliente.
