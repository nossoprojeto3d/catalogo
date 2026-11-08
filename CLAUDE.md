# Catálogo Nosso Projeto 3D

Site publicado no GitHub Pages: https://nossoprojeto3d.com.br/catalogo/
Todo push na `main` vai pro ar pelo GitHub Action `.github/workflows/publicar.yml` (testes, build e publicação).

No ar: versão 4 (React + Vite + Tailwind v4), publicada em 05/11/2026 e aprovada como oficial em 08/11/2026 (tag `v4.0.0`).
Desenvolvimento direto na `main` (decisão do usuário em 08/11/2026; a branch `v4` foi apagada). O painel também grava na `main`: antes de mexer, `git pull --ff-only`. Push na `main` publica, então só com aprovação do usuário.

## Versões e backups

- `backup-v3-20261105`: branch com a versão 3 como estava no ar. Não apagar sem o usuário pedir. Para voltar, reverter os commits na `main` sem `push --force`, combinando antes: ela lê a planilha, então não mostra o que foi alterado no painel.
- `v4.0.0`: versão 4. `v3.0.0`: versão 3. `v2.0.0`: versão 2 (HTML único). Tags de versão são permanentes.
- `backup-oficial-AAAAMMDD`: último backup oficial. Só o mais recente fica, então não use essa tag como referência fixa.
- Voltar para a v2 não é só reverter o código: o Action publica `dist/`, que a v2 não tem. Em Settings > Pages, a origem precisa continuar "GitHub Actions" para o site funcionar.

## Rodar local

- `npm install` uma vez; depois `npm run dev` (abre em `http://localhost:5173/catalogo/` e na rede local, pra testar no celular).
- `npm test`: regras de preço, mensagem do WhatsApp, painel e arquivo do catálogo (vitest, com amostras reais em `src/lib/__amostras__/`). Roda também no Action: se `catalogo.json` ficar inválido, o site não é publicado e continua na versão anterior.
- `npm run build` gera `dist/`; `npm run preview` serve o build.

## Arquivos

- `src/lib/config.ts`: número do WhatsApp, `ABAS_BRINDES`, `QUANTIDADES_COMBO`, descontos e tamanho do lote.
- `src/lib/catalogo.ts`: leitura de `catalogo.json`, montagem das categorias, combos, ordenação, queridinhos, busca. O leitor de CSV continua aqui para a importação e os testes.
- `src/painel/`: `Painel` (telas e salvamento), `Acesso` (configurar e senha), `Lista`, `Ficha`, `github.ts` (gravação), `chaveLocal.ts` (chave cifrada), `foto.ts` (foto em 1200×900 no aparelho), `promptFoto.ts` (texto do botão Copiar prompt), `pecas.ts` (regras, testadas em `painel.test.ts`).
- `src/lib/whatsapp.ts`: texto das mensagens. O formato foi aprovado pelo usuário em 08/10/2026; não mudar sem pedir. As adições são a linha de combo (`Combo de 10 = R$ 129`), só em combos, e a versão entre parênteses depois do nome (`*1. Letreiro Feliz Natal (20 cm)* (NAT-10)`), aprovada em 08/11/2026.
- `src/lib/preco.ts` (combo em valor inteiro, unidade com centavos), `cores.ts`, `fotos.ts`, `medicao.ts` e `efeitos.ts` (foto voando até a sacola).
- `src/hooks/`: `useRota` (rotas por hash: `#inicio`, `#produtos`, `#categoria/<nome>`, `#brindes`, `#produto/<CODIGO>`) e `useTela` (consultas de tela e movimento reduzido).
- `src/store/`: lista de pedido (zustand, chave `np3d_lista` no localStorage, compatível com a v2) e estado da interface.
- `src/components/`: `Paginas` (início, produtos e brindes), `Banners` (carrossel de produtos: Natal, religiosos e criançada; os públicos ficam nos cartões logo abaixo), `Navegacao` (no celular, topo e barra de baixo), `Menu` (gaveta de categorias), `Escolhas` (cor, quantidade e combos), `CompraRapida` (painel do botão de sacola no card, quando há cor para escolher), `ListaPedido` (sacola). `TelaProduto` é tela cheia no celular (entra da direita, com "Voltar") e modal de duas colunas no computador. Garantia e cuidados ficam numa gaveta aberta por um único link, para a tela não precisar rolar.
- `scripts/`: `recolorir-logo.mjs` (logo dourada original -> limão), `vetorizar-logo.mjs` (logo -> `public/logo.svg`), `importar-planilha.mjs` (uso único, já feito: rodar de novo apaga o que foi feito no painel), `plugin-fotos.ts` (lista de fotos no build), `plugin-compartilhar.ts` (página `p/<codigo>/` de cada foto, com a prévia do link: o robô do WhatsApp não enxerga o `#`. Nome lido de `catalogo.json` no build; para testar num link temporário, `URL_DO_SITE=https://.../catalogo/ npm run build`), `padronizar-fotos.mjs` (leva foto fora do padrão a 1200×900 sem cortar o produto), `molde-foto.mjs` (gera o molde em `docs/`).
- `public/`: `catalogo.json` (produtos), `imagens/`, `logo.png` (limão), `logo.svg`, `og-image.jpg` (imagem do link compartilhado), ícones e `medicao.js`.
- `medicao.js`: Google Analytics 4 com aviso de cookies. É o mesmo arquivo em todos os projetos do domínio; se mudar aqui, avisar que precisa copiar pros outros. As cores do aviso são trocadas só pelo CSS do catálogo (`src/styles.css`), que também esconde o botão flutuante do WhatsApp no celular enquanto o aviso está aberto.

## Como os dados chegam

- Produtos ficam em `public/catalogo.json`, lido pelo site a cada visita e editado pelo painel. Categoria vazia não aparece no site. A planilha não é mais usada desde 05/11/2026.
- Painel em `/catalogo/painel/` (`src/painel/`), aberto pelo link "Área da loja" no rodapé, página à parte, sem Analytics. Grava direto no GitHub, num commit só, com a chave do aparelho; o Action publica em 1 a 2 minutos. Só o site oficial grava na `main`; em qualquer outro endereço grava na branch `teste` (não publica), com aviso de modo de teste.
- Acesso: uma chave do GitHub por aparelho (Contents: Read and write, só neste repositório), guardada cifrada com a senha do painel (`chaveLocal.ts`). A chave nunca entra no código nem no chat. Não existe cadastro: nome e senha ficam só no navegador do aparelho. Só a conta `nossoprojeto3d` tem acesso de escrita ao projeto.
- Se duas pessoas salvam peças diferentes, as duas alterações ficam. Se for a mesma peça, o painel avisa e não grava por cima.
- Tela do painel (opção escolhida pelo usuário em 05/11/2026): saudação, resumo clicável (peças, esgotadas, sem foto, queridinhos), Nova peça, busca, pílulas de categoria e etiquetas na lista. A ficha é em blocos, com prévia ao vivo do card; no computador, duas colunas. Mudança de layout aqui também passa pelos 3 rascunhos.
- Pedido pelo WhatsApp. Não tem carrinho, pagamento nem cadastro.
- Não há promoção no site (decisão do usuário): sem preço riscado nem selo de desconto. Exceção (08/11/2026): o banner "Kit de Natal" no topo da categoria Natal (`BannerKitNatal` em `Paginas.tsx`, números em `KIT_NATAL` no `config.ts`: 3 unidades quaisquer de Natal = 10%). É só aviso; o desconto é calculado pelo WhatsApp, não na sacola. Queridinho é um interruptor no painel; `maisVendido` 999 marca a peça sem posição definida, e o início mostra só as 8 primeiras.
- A categoria `Brindes` alimenta a página "Brindes para seus clientes" e fica fora das categorias comuns. `Personalizados` é venda comum, sem combo. A categoria `Natal`, quando tem peças, aparece no site e vira destino do banner de Natal; vazia, o banner vai para o Cantinho da Fé.
- Combos de 10, 30 e 50 só existem nas categorias de `ABAS_BRINDES`. Nas outras, a quantidade é só quantidade, com centavos e sem "Combo" na mensagem.
- Desconto dos combos (`DESCONTOS_COMBO`): 10 un. 5%, 30 un. 10%, 50 un. 15%, mostrado como "de R$ 500 por R$ 425". Nos brindes, de 1 a 9 unidades vale o preço normal, sem desconto; acima disso, fora dos combos, é a combinar.
- Preço fechado do combo (campo opcional no painel, `combos` no arquivo) manda sobre o desconto naquela quantidade exata.
- Termos: "Para você ou para presentear" e "Brindes para seus clientes", sem "lembrancinhas" nem "evento" no texto visível.
- Produto com cores exige escolher a cor antes de pedir ou pôr na lista.
- Versões (`versoes: [{ nome, preco }]`, opcional): o mesmo anúncio em tamanhos que só mudam o preço; foto, cores e descrição são as mesmas. Com versões, `preco` guarda o menor (card e busca mostram "a partir de") e o cliente precisa escolher a versão (pílulas acima da cor). `naVersao` troca o preço, então as regras de preço e combo não mudam. Na sacola, outra versão é outro item; versão que some do produto tira o item. No painel, bloco "Versões" (linhas nome + preço); com versões, o campo Preço some.
- Item da sacola que esgota ou sai do catálogo é removido com aviso.

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

- Fotos em `public/imagens/<CODIGO>.jpg`, com o código da peça em maiúsculo (`KID-01.jpg`). O caminho normal é o painel: o usuário usa Baixar foto e Copiar prompt, trata a imagem numa IA e sobe pela galeria. Não há botão de câmera, porque a foto chega tratada. O painel gera o código, o arquivo e o commit.
- 1200×900 (4:3), JPEG, média ~120KB, nunca acima de 400KB. Produto inteiro dentro da faixa central de 675px (zona segura): o card recorta em quadrado (1:1), mostrando os 900px centrais. Padrão completo, molde e prompt pra IA de imagens em `docs/padrao-fotos.md`.
- A tela do produto mostra a foto sempre inteira (`FotoProduto inteira`), com a própria foto desfocada preenchendo a sobra. Hoje KID-06, 08, 12 e 14 estão fora do 1200×900 e precisam de foto nova, porque o `padronizar-fotos.mjs` deixa borrão visível nelas. KID-22 e HP-06 não têm foto.
- A página acha a foto pelo código (lista gerada no build), então foto nova só aparece depois da publicação de 1 a 2 minutos. No `npm run dev`, reinicie o servidor. O campo `foto` do arquivo fica vazio.
- O painel recomprime a foto ao salvar; se o usuário notar perda de qualidade, enviar o arquivo original quando já estiver em 1200×900.
- Fotos cortadas no card, a refazer aos poucos: CEL-05, HP-01 a 04, KID-07, 09, 11, 15, 16, 19, 20, 21, ORG-03, 06, 07, SEN-02, 03, 05.
- Mensagens de commit, quando a foto for pelo Git: `Adicionar foto de KID-06`, `Adicionar fotos de KID-07 a 21 e KID-23`, `Atualizar fotos de DEC-01 a 03`.

## Roteiro de teste

Usado pelo `/conferir-site`, no celular e no desktop (`npm run build && npm run preview`):

1. Início: banners trocam e levam à página certa; "Para você ou para presentear" e "Brindes para seus clientes" abrem e têm "Voltar". Produtos carregam sem a tela "Estamos ajustando o catálogo". Sem erros no console.
2. Trocar 3 categorias: no computador pelo menu "Categorias" e pelas pílulas; no celular pelo botão "Categoria" da página de produtos e pela barra de baixo, que abrem a mesma gaveta.
3. Rolagem infinita: rolar até o fim de "Kids" (6 em 6), trocar de categoria e rolar de novo.
4. Cards em 2 colunas sem vazar. Esgotados por último, com "Avise-me quando voltar" na tela do produto.
5. Nenhuma foto quebrada. "Foto em breve" só para quem não tem foto; liste esses códigos.
6. Tela do produto: num produto com `Cores`, "Pedir" sem cor pede a cor; escolher cor e quantidade e conferir o valor no botão e a mensagem. Nas peças de brindes, conferir "1 unidade" no preço normal, os combos de 10, 30 e 50 em valor inteiro com "de/por" e "Outra quantidade"; nas outras, sem botões de combo. No computador, duas colunas, com "Sacola" e "Pedir" sempre visíveis.
7. Card: botão de sacola adiciona direto com a foto voando, sem parte transparente; com `Cores`, abre a compra rápida.
8. Sacola: adicionar 2 produtos, conferir contador, mudar quantidade, total, mensagem de "Enviar pedido no WhatsApp" e "Limpar sacola" (dois toques).
9. WhatsApp: conferir o `href` (`wa.me/5562993152843?text=...`) sem clicar.
10. Link compartilhado `#produto/<CODIGO>` abre o produto; o "voltar" do celular fecha a tela.
11. Aviso de cookies: no celular, o botão flutuante do WhatsApp fica escondido até a resposta e volta depois dela.
12. Painel: "Área da loja" no rodapé abre `/catalogo/painel/`. No site oficial, sem chave real, conferir só a tela de configuração: salvar de verdade grava na `main` e publica. Para testar o resto, usar a prévia local (grava na branch `teste`) ou simular a API do GitHub no navegador.
