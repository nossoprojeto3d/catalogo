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
- `CapaCategoria` só precisa ser preenchida na primeira linha de cada
  categoria — as demais podem ficar em branco.
- `Codigo` é opcional, mas ajuda a identificar o produto exato quando o
  pedido chega no WhatsApp (ex: `DEC-01`).
- `Descricao` também é opcional — se ficar vazia, o card do produto
  simplesmente fica mais compacto.
- A planilha precisa estar compartilhada como "Qualquer pessoa com o
  link → Leitor", senão a página não consegue ler os dados.

## Fotos

O catálogo não hospeda imagem nenhuma — só usa o link. Duas formas de
conseguir esse link:

1. Subir a foto no [imgbb.com](https://imgbb.com) ou
   [postimages.org](https://postimages.org) e copiar o link direto.
2. Colocar o arquivo na pasta `imagens/` deste repositório e usar o link
   do GitHub Pages (veja `imagens/leia-me.txt`).

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
