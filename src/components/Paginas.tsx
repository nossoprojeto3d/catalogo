import { ArrowLeft, CaretDown, Gift, ShoppingBag } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { categoriasDeVarejo, ordenarPor, queridinhos, type Categoria, type Ordem, type Produto } from '../lib/catalogo';
import { ABAS_BRINDES, TAMANHO_LOTE } from '../lib/config';
import { urlFoto } from '../lib/fotos';
import { MENSAGEM_GERAL, linkWhatsapp } from '../lib/whatsapp';
import { useUI } from '../store/ui';
import { Banners } from './Banners';
import { BotaoLink, IconeWhats } from './Botoes';
import { CardEsqueleto, CardProduto, CLASSES_GRADE } from './CardProduto';
import { FotoProduto } from './FotoProduto';

const LARGURA = 'mx-auto max-w-[1240px] px-4 md:px-6';

function comFoto(lista: Produto[]) {
  return lista.find((p) => !p.esgotado && urlFoto(p)) ?? null;
}

function produtosBrindes(categorias: Categoria[]) {
  return categorias.filter((c) => ABAS_BRINDES.includes(c.nome)).flatMap((c) => c.produtos);
}

// Categorias que aparecem no início e no "Para você". Brindes entra na ordem
// alfabética com as outras, mas leva para a página própria dele.
type Atalho = { nome: string; href: string; produtos: Produto[] };
function atalhosDeCategoria(categorias: Categoria[]): Atalho[] {
  const atalhos: Atalho[] = categoriasDeVarejo(categorias).map((c) => ({ nome: c.nome, href: `#categoria/${encodeURIComponent(c.nome)}`, produtos: c.produtos }));
  const brindes = produtosBrindes(categorias);
  if (brindes.length) atalhos.push({ nome: 'Brindes', href: '#brindes', produtos: brindes });
  return atalhos.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
}

function AvisoErro() {
  return (
    <div className="rounded-3xl bg-superficie px-6 py-12 text-center ring-1 ring-linha">
      <h2 className="titulo text-[24px]">Estamos ajustando o catálogo</h2>
      <p className="mx-auto mt-2 max-w-[40ch] text-suave">Enquanto isso, fale direto com a gente pelo WhatsApp.</p>
      <BotaoLink href={linkWhatsapp(MENSAGEM_GERAL)} target="_blank" rel="noopener" icone={<IconeWhats />} className="mt-6" data-evento="duvida_whatsapp" data-link="manutencao">
        Chamar no WhatsApp
      </BotaoLink>
    </div>
  );
}

// As duas portas de entrada: quem compra uma peça e quem compra em quantidade.
function Porta({ href, titulo, texto, acao, produto, icone }: { href: string; titulo: string; texto: string; acao: string; produto: Produto | null; icone: React.ReactNode }) {
  return (
    <a href={href} className="group grid min-h-[168px] grid-cols-[1fr_42%] overflow-hidden rounded-3xl bg-superficie ring-1 ring-linha transition-shadow hover:shadow-(--shadow-suave) md:min-h-[240px]">
      <div className="flex flex-col justify-between gap-3 p-4 md:p-7">
        <div>
          <h2 className="titulo text-[22px] md:text-[30px]">{titulo}</h2>
          <p className="mt-1.5 text-[14px] leading-snug text-suave md:text-[16px]">{texto}</p>
        </div>
        <span className="inline-flex min-h-10 w-fit items-center gap-1.5 rounded-full bg-acento px-3.5 text-[14px] font-semibold text-sobre-acento">
          {icone} {acao}
        </span>
      </div>
      <div className="relative bg-superficie-2">
        {produto ? <div className="absolute inset-0"><FotoProduto decorativa prioridade produto={produto} tamanhos="(min-width: 768px) 260px, 42vw" /></div> : <div className="esqueleto absolute inset-0" />}
      </div>
    </a>
  );
}

function ComoPedir() {
  const passos = [
    ['Escolha a peça', 'Veja as fotos, o preço e as cores.'],
    ['Coloque na sacola', 'Junte quantas peças quiser, ou peça uma só.'],
    ['Envie no WhatsApp', 'A mensagem vai pronta. Pagamento e entrega a gente combina por lá.'],
  ];
  return (
    <section className={`${LARGURA} mt-12 md:mt-16`}>
      <h2 className="titulo text-[24px] md:text-[32px]">Como pedir</h2>
      <ol className="mt-4 grid gap-3 md:grid-cols-3 md:gap-5">
        {passos.map(([titulo, texto], i) => (
          <li key={titulo} className="flex gap-3 rounded-2xl bg-superficie p-4 ring-1 ring-linha">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-acento text-[15px] font-bold text-sobre-acento">{i + 1}</span>
            <div className="pt-1.5">
              <h3 className="text-[16px] font-semibold leading-6">{titulo}</h3>
              <p className="mt-0.5 text-[14px] leading-snug text-suave">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function PaginaInicio() {
  const categorias = useUI((s) => s.categorias);
  const status = useUI((s) => s.status);
  const destaques = useMemo(() => queridinhos(categorias).slice(0, 8), [categorias]);

  return (
    <>
      <Banners />

      <div className={`${LARGURA} mt-4 grid gap-3 md:mt-6 md:grid-cols-2 md:gap-5`}>
        <Porta href="#produtos" titulo="Para você ou para presentear" texto="Uma ou mais peças." acao="Ver peças" icone={<ShoppingBag size={17} />} produto={comFoto(destaques)} />
        <Porta href="#brindes" titulo="Brindes para seus clientes" texto="Combos de 10, 30 e 50 unidades." acao="Ver combos" icone={<Gift size={17} />} produto={comFoto(produtosBrindes(categorias)) ?? comFoto(categorias.find((c) => c.nome === 'Personalizados')?.produtos ?? [])} />
      </div>

      {status === 'erro' ? (
        <div className={`${LARGURA} mt-10`}><AvisoErro /></div>
      ) : (
        <>
          <section className="mt-10 md:mt-14">
            <h2 className={`${LARGURA} titulo text-[24px] md:text-[32px]`}>Categorias</h2>
            <ul className="sem-barra mx-auto mt-4 flex max-w-[1240px] gap-3 overflow-x-auto px-4 md:gap-5 md:px-6">
              {atalhosDeCategoria(categorias).map((c) => {
                const foto = comFoto(c.produtos);
                return (
                  <li key={c.nome} className="w-[84px] shrink-0 md:w-28">
                    <a href={c.href} className="block text-center">
                      <div className="aspect-square overflow-hidden rounded-full bg-superficie-2 ring-1 ring-linha">
                        {foto && <FotoProduto decorativa produto={foto} tamanhos="112px" />}
                      </div>
                      <p className="mt-2 text-[13px] font-medium leading-tight md:text-[14px]">{c.nome}</p>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className={`${LARGURA} mt-10 md:mt-14`}>
            <h2 className="titulo text-[24px] md:text-[32px]">Os queridinhos</h2>
            <ul className={`mt-4 ${CLASSES_GRADE}`}>
              {status === 'carregando'
                ? Array.from({ length: 4 }, (_, i) => <CardEsqueleto key={i} />)
                : destaques.map((p, i) => <CardProduto key={p.codigo || p.nome} produto={p} prioridade={i < 2} />)}
            </ul>
          </section>
        </>
      )}
      <ComoPedir />
    </>
  );
}

// Volta para a home, mesmo quem chegou direto por um link compartilhado.
function Voltar() {
  return (
    <a href="#inicio" className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-full pl-2 pr-4 text-[16px] font-medium active:bg-texto/8 md:hover:bg-texto/5">
      <ArrowLeft size={22} /> Voltar
    </a>
  );
}

const ORDENS: { valor: Ordem; rotulo: string }[] = [
  { valor: 'pedidos', rotulo: 'Mais pedidos' },
  { valor: 'menor', rotulo: 'Menor preço' },
  { valor: 'maior', rotulo: 'Maior preço' },
  { valor: 'nome', rotulo: 'Nome, A a Z' },
];

// Grade com rolagem infinita: o sentinela no fim puxa mais um lote. O observer
// é refeito a cada lote, então não trava ao trocar de categoria.
function Grade({ produtos, brindes, chave }: { produtos: Produto[]; brindes?: boolean; chave: string }) {
  const status = useUI((s) => s.status);
  const [quantos, setQuantos] = useState(TAMANHO_LOTE);
  const sentinela = useRef<HTMLDivElement>(null);
  useEffect(() => setQuantos(TAMANHO_LOTE), [chave]);
  const temMais = quantos < produtos.length;
  useEffect(() => {
    if (!temMais || !sentinela.current) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setQuantos((q) => q + TAMANHO_LOTE); }, { rootMargin: '600px 0px' });
    obs.observe(sentinela.current);
    return () => obs.disconnect();
  }, [temMais, quantos, chave]);

  if (status === 'erro') return <div className="mt-5"><AvisoErro /></div>;
  return (
    <>
      <ul className={`mt-5 ${CLASSES_GRADE}`}>
        {status === 'carregando'
          ? Array.from({ length: 6 }, (_, i) => <CardEsqueleto key={i} />)
          : produtos.slice(0, quantos).map((p, i) => <CardProduto key={`${p.categoria}-${p.codigo || p.nome}`} produto={p} brindes={brindes} prioridade={i < 2} />)}
      </ul>
      {temMais && <div ref={sentinela} className="h-10" aria-hidden />}
    </>
  );
}

export function PaginaProdutos({ categoria }: { categoria?: string }) {
  const todas = useUI((s) => s.categorias);
  const categorias = useMemo(() => categoriasDeVarejo(todas), [todas]);
  const [ordem, setOrdem] = useState<Ordem>('pedidos');
  const produtos = useMemo(() => {
    const base = categoria ? todas.find((c) => c.nome === categoria)?.produtos ?? [] : categorias.flatMap((c) => c.produtos);
    return ordenarPor(base, ordem);
  }, [todas, categorias, categoria, ordem]);
  const setMenu = useUI((s) => s.setMenuAberto);
  const textoPecas = `${produtos.length} ${produtos.length === 1 ? 'peça' : 'peças'}`;
  const chip = (ativo: boolean) => `shrink-0 rounded-full px-4 py-2.5 text-[14px] font-medium ring-1 ${ativo ? 'bg-acento text-sobre-acento ring-acento-forte' : 'bg-superficie ring-linha'}`;

  return (
    <section className={`${LARGURA} pt-2 md:pt-5`}>
      <Voltar />
      <h1 className="titulo mt-1 text-[28px] md:text-[40px]">{categoria ?? 'Para você ou para presentear'}</h1>
      {!categoria && <p className="mt-2 text-[15px] leading-relaxed text-suave md:text-[17px]">Escolha uma ou várias e feche o pedido no WhatsApp.</p>}
      {/* No celular a categoria é escolhida pelo botão abaixo, que abre a gaveta. */}
      <ul className="mt-4 hidden flex-wrap gap-2 md:flex">
        <li><a href="#produtos" className={`block ${chip(!categoria)}`} aria-current={!categoria ? 'page' : undefined}>Todas</a></li>
        {atalhosDeCategoria(todas).map((c) => (
          <li key={c.nome}><a href={c.href} className={`block whitespace-nowrap ${chip(c.nome === categoria)}`} aria-current={c.nome === categoria ? 'page' : undefined}>{c.nome}</a></li>
        ))}
      </ul>
      <div className="mt-4 flex items-center gap-2 md:justify-between md:gap-3">
        <button type="button" onClick={() => setMenu(true)} aria-haspopup="dialog" className="flex h-11 min-w-0 flex-1 items-center justify-between gap-1.5 rounded-full bg-superficie px-4 text-[15px] font-medium ring-1 ring-linha md:hidden">
          <span className="truncate">{categoria ?? 'Categoria: Todas'}</span>
          <CaretDown size={16} className="shrink-0" aria-hidden />
        </button>
        <p className="hidden text-[14px] text-suave md:block">{textoPecas}</p>
        <label className="flex shrink-0 items-center gap-2 text-[14px] text-suave">
          <span className="sr-only md:not-sr-only">Ordenar</span>
          {/* 16px no celular: com menos, o iPhone dá zoom ao abrir o seletor. */}
          <select value={ordem} onChange={(e) => setOrdem(e.target.value as Ordem)} className="h-11 rounded-full bg-superficie px-3 text-[16px] font-medium text-texto ring-1 ring-linha md:text-[14px]">
            {ORDENS.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
          </select>
        </label>
      </div>
      <p className="mt-3 text-[14px] text-suave md:hidden">{textoPecas}</p>
      <Grade produtos={produtos} chave={`${categoria ?? 'todas'}-${ordem}`} />
    </section>
  );
}

const PASSOS_BRINDES = [
  ['Escolha a peça', 'Veja as opções logo abaixo.'],
  ['Coloque a sua marca', 'Nome, logo e identidade da sua empresa. Combinamos os detalhes pelo WhatsApp.'],
  ['Feche a quantidade', 'Combos de 10, 30 ou 50 unidades, com desconto. Outra quantidade, a gente combina.'],
];

export function PaginaBrindes() {
  const categorias = useUI((s) => s.categorias);
  const status = useUI((s) => s.status);
  const produtos = useMemo(() => ordenarPor(produtosBrindes(categorias), 'pedidos'), [categorias]);
  const vazia = status !== 'carregando' && status !== 'erro' && produtos.length === 0;
  return (
    <section className={`${LARGURA} pt-2 md:pt-5`}>
      <Voltar />
      <h1 className="titulo mt-1 text-[28px] md:text-[40px]">Brindes para seus clientes</h1>
      <ol className="mt-4 grid gap-3 md:grid-cols-3 md:gap-5">
        {PASSOS_BRINDES.map(([titulo, texto], i) => (
          <li key={titulo} className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full bg-acento text-[15px] font-bold text-sobre-acento">{i + 1}</span>
            <div className="pt-1.5">
              <h2 className="text-[16px] font-semibold leading-6">{titulo}</h2>
              <p className="mt-0.5 text-[14px] leading-snug text-suave">{texto}</p>
            </div>
          </li>
        ))}
      </ol>
      {vazia
        ? <p className="mt-6 text-[15px] text-suave">Estamos separando as peças de brindes. Enquanto isso, peça um orçamento pelo WhatsApp.</p>
        : <Grade produtos={produtos} brindes chave="brindes" />}
    </section>
  );
}
