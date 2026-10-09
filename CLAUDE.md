# Catálogo Nosso Projeto 3D

Site publicado no GitHub Pages: https://nossoprojeto3d.github.io/catalogo/
Todo push na `main` vai pro ar pelo GitHub Action `.github/workflows/publicar.yml` (testes, build e publicação).

Versão 3 (branch `v3`): React + Vite + Tailwind v4. A versão 2 (HTML único) está na tag `backup-oficial-*`.

## Rodar local

- `npm install` uma vez; depois `npm run dev` (abre em `http://localhost:5173/catalogo/` e na rede local, pra testar no celular).
- `npm test`: regras de preço, planilha e mensagem do WhatsApp (vitest, com amostras reais em `src/lib/__amostras__/`).
- `npm run build` gera `dist/`; `npm run preview` serve o build.

## Arquivos

- `src/lib/config.ts`: número do WhatsApp, ID da planilha, `ABAS_CATEGORIAS`, cache e tamanho do lote.
- `src/lib/catalogo.ts`: leitura do CSV, montagem das categorias, ordenação, queridinhos, busca.
- `src/lib/whatsapp.ts`: texto das mensagens. O formato foi aprovado pelo usuário em 08/10/2026; não mudar sem pedir.
- `src/lib/preco.ts`, `cores.ts`, `fotos.ts`, `medicao.ts`.
- `src/store/`: lista de pedido (zustand, chave `np3d_lista` no localStorage, compatível com a v2) e estado da interface.
- `src/components/`: uma seção por arquivo. `TelaProduto` é tela cheia no celular (entra da direita, com "Voltar") e modal de duas colunas no computador.
- `src/three/Vitrine.tsx`: abertura 3D (Three.js / react-three-fiber), carregada com `lazy()`. Anel giratório com até 14 fotos sorteadas a cada visita, sem queridinhos, esgotados ou repetidos; arrastar gira, tocar abre o produto.
- `scripts/`: `recolorir-logo.mjs` (logo dourada original -> limão), `vetorizar-logo.mjs` (logo -> `public/logo.svg`), `plugin-fotos.ts` (lista de fotos no build).
- `public/`: `imagens/`, `logo.png` (limão), `og-image.jpg`, ícones e `medicao.js`.
- `medicao.js`: Google Analytics 4 com aviso de cookies. É o mesmo arquivo em todos os projetos do domínio; se mudar aqui, avisar que precisa copiar pros outros. As cores do aviso são trocadas só pelo CSS do catálogo (`src/styles.css`).

## Como os dados chegam

- Produtos vêm da planilha do Google Sheets, lida em CSV (`gviz/tq?tqx=out:csv`). Cada aba é uma categoria; aba nova só aparece se entrar em `ABAS_CATEGORIAS`.
- Cada aba fica 5 minutos em cache no `sessionStorage`.
- Pedido pelo WhatsApp. Não tem carrinho, pagamento nem cadastro.
- Coluna `Tag` não é mais usada na v3 (sem selo e sem categoria "Lançamentos").
- Produto com `Cores` exige escolher a cor antes de pedir ou pôr na lista.
- `PrecoPromocional` só vale se for menor que `Preco`.
- Item da lista que esgota ou sai da planilha é removido com aviso.

## Visual

- Tema "Filamento", só escuro: tokens em `src/styles.css` (`fundo`, `superficie`, `superficie-2`, `linha`, `texto`, `suave`, `acento` limão #C6F432). Texto sobre o limão é sempre `text-fundo`.
- Fontes: Archivo expandida e pesada nos títulos (classe `.titulo`), Instrument Sans no texto, Geist Mono em códigos e rótulos (não em preços).
- Botões em pílula; cards com moldura dupla (24px por fora, 18px por dentro) e borda limão que acende sob o mouse (`.holofote`). Ícones: Phosphor, peso light/regular.
- Uma única faixa correndo na página (`FaixaCategorias`).
- Sem travessão (—) em texto visível.
- O card em 2 colunas no celular (~375px) é onde os bugs de layout costumam aparecer.

## Imagens

- Fotos em `public/imagens/<CODIGO>.jpg`, com o código em maiúsculo igual à coluna `Codigo` (`KID-01.jpg`).
- 1200×900 (4:3), JPEG, média ~120KB, nunca acima de 400KB. Produto inteiro dentro da faixa central de 675px (zona segura): o grid recorta em 1:1 e "Os queridinhos" em 3:4. Padrão completo, molde e prompt pra IA de imagens em `docs/padrao-fotos.md`.
- A tela do produto mostra a foto sempre inteira (`FotoProduto inteira`), com a própria foto desfocada preenchendo a sobra. Hoje KID-06, 07, 08, 09, 10, 12, 13, 14, 15, 17 e 18 estão fora do 1200×900.
- A página acha a foto pelo código (lista gerada no build). A coluna `Foto` da planilha fica vazia. Lembre o usuário disso.
- Foto nova só aparece depois do push (o build refaz a lista). No `npm run dev`, reinicie o servidor.
- Mensagens de commit: `Adicionar foto de KID-06`, `Adicionar fotos de KID-07 a 21 e KID-23`, `Atualizar fotos de DEC-01 a 03`.

## Roteiro de teste

Usado pelo `/conferir-site`, no celular e no desktop (`npm run build && npm run preview`):

1. Abertura 3D: o anel de fotos entra girando e para; arrastar gira; tocar numa peça abre o produto. Produtos carregam sem a tela "Estamos ajustando o catálogo". Sem erros no console.
2. Trocar 3 categorias: no computador pelas pílulas; no celular pelo botão "Categoria", que abre a gaveta em grade.
3. Rolagem infinita: rolar até o fim de "Kids" (6 em 6), trocar de categoria e rolar de novo.
4. Cards em 2 colunas sem vazar. Esgotados por último, com "Avise-me quando voltar" na tela do produto.
5. Nenhuma foto quebrada. "Foto em breve" só para quem não tem foto; liste esses códigos.
6. Tela do produto: num produto com `Cores`, "Pedir" sem cor pede a cor; escolher cor e quantidade e conferir o valor no botão e a mensagem. No computador, duas colunas sem rolagem.
7. Lista: adicionar 2 produtos, conferir contador da sacola, mudar quantidade, total, mensagem de "Enviar pedido no WhatsApp" e "Limpar lista" (dois toques).
8. WhatsApp: conferir o `href` (`wa.me/5562993152843?text=...`) sem clicar.
9. Link compartilhado `#produto/<CODIGO>` abre o produto; o "voltar" do celular fecha a tela.
