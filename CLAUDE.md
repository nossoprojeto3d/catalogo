# Catálogo Nosso Projeto 3D

Site estático publicado no GitHub Pages: https://nossoprojeto3d.github.io/catalogo/
Todo push na `main` vai direto pro ar. Não tem build, nem `package.json`, nem lib externa.

## Arquivos

- `index.html`: a página inteira (HTML, CSS e JS inline, ~2700 linhas).
- `medicao.js`: Google Analytics 4 com aviso de cookies. É o mesmo arquivo em todos os projetos do domínio; se mudar aqui, avisar que precisa copiar pros outros.
- `imagens/`: fotos dos produtos, nomeadas pelo código (`KID-01.jpg`).
- `logo.png`, `og-image.jpg`: marca e prévia de compartilhamento.

## Como os dados chegam

- Os produtos vêm de uma planilha do Google Sheets, lida em CSV (`gviz/tq?tqx=out:csv`).
- Cada aba da planilha é uma categoria. A lista fica em `ABAS_CATEGORIAS` no topo do script; aba nova na planilha só aparece se entrar nessa lista.
- Cada aba fica em cache por 5 minutos no `sessionStorage` (`DURACAO_CACHE_ABA_MS`).
- A categoria "Lançamentos" se monta sozinha a partir da coluna `Tag`.
- O pedido é feito pelo WhatsApp (`WHATSAPP_NUMERO`). Não tem carrinho, pagamento nem cadastro.
- O README.md explica as colunas da planilha para quem cuida dela. Partes dele ainda descrevem a coluna `Categoria` antiga.

## Regras

- HTML, CSS e JS puros: sem lib, framework nem build.
- O card em 2 colunas no celular (~375px) é onde os bugs de layout costumam aparecer (tag e botão vazando).

## Imagens

- Fotos de produto em `imagens/<CODIGO>.jpg`, com o código em maiúsculo igual à coluna `Codigo` da planilha (`KID-01.jpg`, `SEN-05.jpg`).
- 1200×900 (4:3), JPEG, média ~120KB, nunca acima de 400KB. Produto centralizado com margem, porque o carrossel "Os queridinhos" recorta em 3:4.
- A página acha a foto sozinha pelo código; a coluna `Foto` da planilha fica vazia. Lembre o usuário disso.
- As fotos ganham `?v=<timestamp>` a cada visita (`CACHE_BUST_FOTOS`), então trocar uma foto não exige mudar código.
- Mensagens de commit: `Adicionar foto de KID-06`, `Adicionar fotos de KID-07 a 21 e KID-23`, `Atualizar fotos de DEC-01 a 03`.

## Roteiro de teste

Usado pelo `/conferir-site`, no celular e no desktop:

1. Produtos carregam sem a tela de manutenção. Sem erros no console.
2. Trocar 3 categorias, incluindo "Lançamentos" se existir.
3. Rolagem infinita: rolar até o fim de "Kids" (carrega de 6 em 6), trocar de categoria e rolar de novo. Já travou antes.
4. Cards em 2 colunas: tag e botão sem vazar. Esgotados aparecem por último, com "Avise-me".
5. Nenhuma foto quebrada. "Foto em breve" só para quem não tem foto; liste esses códigos.
6. Zoom de um produto com `Cores`: as bolinhas trocam o botão "Quero esse!".
7. Favoritos: adicionar 2 produtos, conferir a posição da bolinha de contagem e limpar tudo.
8. WhatsApp: conferir o `href` (`wa.me/5562993152843?text=...`) sem clicar.
