# Catálogo Nosso Projeto 3D

Catálogo digital dos produtos da Nosso Projeto 3D: https://nossoprojeto3d.com.br/catalogo/

O cliente navega pelas categorias, escolhe a peça e finaliza o pedido direto no
WhatsApp. Não tem pagamento nem cadastro.

## Como mexer nos produtos

Tudo é feito pelo painel, no link "Área da loja", no fim do site:
https://nossoprojeto3d.com.br/catalogo/painel/

- **Primeiro acesso:** cada aparelho usa a própria chave do GitHub, criada pelo
  passo a passo da tela, e uma senha do painel. Depois, basta a senha.
- **Salvar:** a alteração aparece no site em 1 a 2 minutos.
- **O que dá para fazer:** criar, editar, esgotar e apagar peças, marcar
  queridinhos, definir cores e preço fechado de combos nos brindes.

## Fotos

Na ficha da peça: **Baixar foto**, **Copiar prompt**, tratar a imagem numa IA e
subir pela **galeria**. O painel cuida do nome e do tamanho do arquivo.

Padrão: 1200×900 (paisagem 4:3), com o produto inteiro dentro da faixa central,
porque o card mostra só o quadrado do meio. Detalhes e molde em
[docs/padrao-fotos.md](docs/padrao-fotos.md). Sem foto, aparece "Foto em breve".

## Para quem programa

- `npm install`, depois `npm run dev` para rodar local e `npm test` para testar.
- Os produtos ficam em `public/catalogo.json`, editado pelo painel. O painel grava
  direto na `main`, então atualize antes de mexer.
- A publicação é feita pelo GitHub Action `publicar.yml` a cada push na `main`.
  Em Settings > Pages, a origem precisa ser "GitHub Actions".
- Detalhes da estrutura no `CLAUDE.md`.
