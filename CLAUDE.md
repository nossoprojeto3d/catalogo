# Catálogo Nosso Projeto 3D

Site publicado no GitHub Pages: https://nossoprojeto3d.github.io/catalogo/
Todo push na `main` vai pro ar pelo GitHub Action `.github/workflows/publicar.yml` (testes, build e publicação).

No ar: versão 3 (React + Vite + Tailwind v4), na branch `main`.
Em desenvolvimento: versão 4, na branch `v4`. Push na `v4` não publica nada; o site só muda com merge na `main`. Este arquivo descreve a v4.

## Versões e backups

- `v3.0.0`: versão 3 no ar. `v2.0.0`: versão 2 (HTML único). Tags de versão são permanentes.
- `backup-oficial-AAAAMMDD`: último backup oficial. Só o mais recente fica, então não use essa tag como referência fixa.
- Voltar para a v2 não é só reverter o código: o Action publica `dist/`, que a v2 não tem. Em Settings > Pages, a origem precisa continuar "GitHub Actions" para a v3 funcionar.

## Rodar local

- `npm install` uma vez; depois `npm run dev` (abre em `http://localhost:5173/catalogo/` e na rede local, pra testar no celular).
- `npm test`: regras de preço, planilha e mensagem do WhatsApp (vitest, com amostras reais em `src/lib/__amostras__/`).
- `npm run build` gera `dist/`; `npm run preview` serve o build.

## Arquivos

- `src/lib/config.ts`: número do WhatsApp, ID da planilha, `ABAS_CATEGORIAS`, `ABAS_BRINDES`, `QUANTIDADES_COMBO`, cache e tamanho do lote.
- `src/lib/catalogo.ts`: leitura do CSV, montagem das categorias, combos, ordenação, queridinhos, busca.
- `src/lib/whatsapp.ts`: texto das mensagens. O formato foi aprovado pelo usuário em 08/10/2026; não mudar sem pedir. A única adição é a linha de combo (`Combo de 10 = R$ 129`), que só aparece em combos.
- `src/lib/preco.ts` (combo em valor inteiro, unidade com centavos), `cores.ts`, `fotos.ts`, `medicao.ts` e `efeitos.ts` (foto voando até a sacola).
- `src/hooks/`: `useRota` (rotas por hash: `#inicio`, `#produtos`, `#categoria/<nome>`, `#brindes`, `#produto/<CODIGO>`) e `useTela` (consultas de tela e movimento reduzido).
- `src/store/`: lista de pedido (zustand, chave `np3d_lista` no localStorage, compatível com a v2) e estado da interface.
- `src/components/`: `Paginas` (início, produtos e brindes), `Banners` (carrossel de Natal, varejo e brindes), `Navegacao` (no celular, topo e barra de baixo), `Menu` (gaveta de categorias), `Escolhas` (cor, quantidade e combos), `CompraRapida` (painel do botão de sacola no card, quando há cor para escolher), `ListaPedido` (sacola). `TelaProduto` é tela cheia no celular (entra da direita, com "Voltar") e modal de duas colunas no computador.
- `scripts/`: `recolorir-logo.mjs` (logo dourada original -> limão), `vetorizar-logo.mjs` (logo -> `public/logo.svg`), `plugin-fotos.ts` (lista de fotos no build), `padronizar-fotos.mjs` (leva foto fora do padrão a 1200×900 sem cortar o produto), `molde-foto.mjs` (gera o molde em `docs/`).
- `public/`: `imagens/`, `logo.png` (limão), `logo.svg`, `og-image.jpg` (imagem do link compartilhado), ícones e `medicao.js`.
- `medicao.js`: Google Analytics 4 com aviso de cookies. É o mesmo arquivo em todos os projetos do domínio; se mudar aqui, avisar que precisa copiar pros outros. As cores do aviso são trocadas só pelo CSS do catálogo (`src/styles.css`), que também esconde o botão flutuante do WhatsApp no celular enquanto o aviso está aberto.

## Como os dados chegam

- Produtos vêm da planilha do Google Sheets, lida em CSV (`gviz/tq?tqx=out:csv`). Cada aba é uma categoria; aba nova só aparece se entrar em `ABAS_CATEGORIAS`.
- Cada aba fica 5 minutos em cache no `sessionStorage`.
- Pedido pelo WhatsApp. Não tem carrinho, pagamento nem cadastro.
- Coluna `Tag` não é usada (sem selo e sem categoria "Lançamentos").
- Coluna opcional `Combos` define preço fechado (`10=99,00; 20=180,00; 30=250,00`). Sem ela, o combo multiplica o preço da unidade.
- Brindes são as abas de `ABAS_BRINDES`. Termos: "Para você ou para presentear" e "Brindes para seus clientes", sem "lembrancinhas" nem "evento" no texto visível.
- Produto com `Cores` exige escolher a cor antes de pedir ou pôr na lista.
- `PrecoPromocional` só vale se for menor que `Preco`.
- Item da lista que esgota ou sai da planilha é removido com aviso.

## Visual

- Tema claro: tokens em `src/styles.css` (`fundo`, `superficie`, `superficie-2`, `linha`, `texto`, `suave`, `acento` limão #C6F432). Topo, barra de baixo e rodapé são limão (`barra`). Texto sobre o limão é sempre `text-sobre-acento`; limão não vira texto em fundo claro (use `acento-escuro`).
- O usuário testou barras brancas e tema preto em 05/11/2026 e preferiu o limão. Não mudar sem pedir.
- Fontes: Archivo expandida e pesada nos títulos (classe `.titulo`), Instrument Sans no texto.
- Botões em pílula. Ícones: Phosphor.
- Assinatura da marca: listras de camadas de impressão (`Camadas`, classe `.camadas`) no canto dos banners e do rodapé, sempre discretas.
- Botão flutuante do WhatsApp discreto, tipo vidro: o usuário não quer que ele chame atenção.
- Sem travessão (—) em texto visível.
- O card em 2 colunas no celular (~375px) é onde os bugs de layout costumam aparecer.

## Imagens

- Fotos em `public/imagens/<CODIGO>.jpg`, com o código em maiúsculo igual à coluna `Codigo` (`KID-01.jpg`).
- 1200×900 (4:3), JPEG, média ~120KB, nunca acima de 400KB. Produto inteiro dentro da faixa central de 675px (zona segura): o card recorta em 3:4. Padrão completo, molde e prompt pra IA de imagens em `docs/padrao-fotos.md`.
- A tela do produto mostra a foto sempre inteira (`FotoProduto inteira`), com a própria foto desfocada preenchendo a sobra. Hoje KID-06, 08, 12 e 14 estão fora do 1200×900 e precisam de foto nova, porque o `padronizar-fotos.mjs` deixa borrão visível nelas. KID-22 e HP-06 não têm foto.
- A página acha a foto pelo código (lista gerada no build). A coluna `Foto` da planilha fica vazia. Lembre o usuário disso.
- Foto nova só aparece depois do push (o build refaz a lista). No `npm run dev`, reinicie o servidor.
- Mensagens de commit: `Adicionar foto de KID-06`, `Adicionar fotos de KID-07 a 21 e KID-23`, `Atualizar fotos de DEC-01 a 03`.

## Roteiro de teste

Usado pelo `/conferir-site`, no celular e no desktop (`npm run build && npm run preview`):

1. Início: banners trocam e levam à página certa; "Para você ou para presentear" e "Brindes para seus clientes" abrem e têm "Voltar". Produtos carregam sem a tela "Estamos ajustando o catálogo". Sem erros no console.
2. Trocar 3 categorias: no computador pelo menu "Categorias" e pelas pílulas; no celular pela barra de baixo, que abre a gaveta.
3. Rolagem infinita: rolar até o fim de "Kids" (6 em 6), trocar de categoria e rolar de novo.
4. Cards em 2 colunas sem vazar. Esgotados por último, com "Avise-me quando voltar" na tela do produto.
5. Nenhuma foto quebrada. "Foto em breve" só para quem não tem foto; liste esses códigos.
6. Tela do produto: num produto com `Cores`, "Pedir" sem cor pede a cor; escolher cor e quantidade e conferir o valor no botão e a mensagem. Em brindes, conferir os combos de 10, 20 e 30 em valor inteiro. No computador, duas colunas, com "Sacola" e "Pedir" sempre visíveis.
7. Card: botão de sacola adiciona direto com a foto voando, sem parte transparente; com `Cores`, abre a compra rápida.
8. Sacola: adicionar 2 produtos, conferir contador, mudar quantidade, total, mensagem de "Enviar pedido no WhatsApp" e "Limpar sacola" (dois toques).
9. WhatsApp: conferir o `href` (`wa.me/5562993152843?text=...`) sem clicar.
10. Link compartilhado `#produto/<CODIGO>` abre o produto; o "voltar" do celular fecha a tela.
11. Aviso de cookies: no celular, o botão flutuante do WhatsApp fica escondido até a resposta e volta depois dela.
