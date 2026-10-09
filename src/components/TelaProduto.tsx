import { ArrowLeft, BellRinging, Check, Minus, Plus, ShareNetwork, ShoppingBagOpen, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { chaveProduto, type Produto } from '../lib/catalogo';
import { corDaBolinha } from '../lib/cores';
import { voarParaSacola } from '../lib/efeitos';
import { medir } from '../lib/medicao';
import { emReais, precoUnitario } from '../lib/preco';
import { linkWhatsapp, mensagemAviseMe, mensagemPedido } from '../lib/whatsapp';
import { useDesktop } from '../hooks/useTela';
import { useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { AtalhosAntesDePedir, PainelAntesDePedir } from './AntesDePedirProduto';
import { Botao, BotaoIcone, BotaoLink, IconeWhats } from './Botoes';
import { Preco } from './CardProduto';
import { FotoProduto } from './FotoProduto';

export function Quantidade({ valor, mudar, rotulo }: { valor: number; mudar: (n: number) => void; rotulo: string }) {
  return (
    <div className="inline-flex items-center rounded-full bg-texto/[0.04] p-1 ring-1 ring-texto/8" role="group" aria-label={rotulo}>
      <button type="button" onClick={() => mudar(valor - 1)} disabled={valor <= 1} aria-label="Diminuir" className="grid size-9 place-items-center rounded-full transition hover:bg-superficie active:scale-90 disabled:opacity-30">
        <Minus size={15} />
      </button>
      <span className="w-8 text-center font-mono text-[15px] tabular-nums" aria-live="polite">{valor}</span>
      <button type="button" onClick={() => mudar(valor + 1)} disabled={valor >= 99} aria-label="Aumentar" className="grid size-9 place-items-center rounded-full transition hover:bg-superficie active:scale-90 disabled:opacity-30">
        <Plus size={15} />
      </button>
    </div>
  );
}

function Parecidos({ produto }: { produto: Produto }) {
  const categorias = useUI((s) => s.categorias);
  const abrir = useUI((s) => s.abrirProduto);
  const lista = useMemo(
    () => (categorias.find((c) => c.nome === produto.categoria)?.produtos ?? [])
      .filter((p) => p !== produto && !p.esgotado)
      .slice(0, 6),
    [categorias, produto],
  );
  if (lista.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-sm font-medium text-suave">Da mesma categoria</h3>
      <ul className="sem-barra -mx-5 mt-3 flex gap-2.5 overflow-x-auto px-5 md:mx-0 md:px-0">
        {lista.map((p) => (
          <li key={chaveProduto(p)} className="w-28 shrink-0">
            <button type="button" onClick={() => abrir(p)} className="group block w-full text-left">
              <div className="aspect-square overflow-hidden rounded-2xl bg-superficie-2">
                <FotoProduto decorativa produto={p} tamanhos="112px" className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <p className="mt-1.5 truncate text-xs font-medium">{p.nome}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Detalhes({ produto, fechar }: { produto: Produto; fechar: () => void }) {
  const adicionar = useLista((s) => s.adicionar);
  const setLista = useUI((s) => s.setListaAberta);
  const temCores = !produto.esgotado && produto.cores.length > 0;
  const [cor, setCor] = useState('');
  const [quantidade, setQuantidade] = useState(1);
  const [pedirCor, setPedirCor] = useState(false);
  // Assunto aberto de "Antes de pedir" (null = mostrando o produto).
  const [info, setInfo] = useState<number | null>(null);
  const unitario = precoUnitario(produto);
  const faltaCor = temCores && !cor;
  const total = unitario > 0 ? emReais(unitario * quantidade) : 'a combinar';

  useEffect(() => {
    setCor(''); setQuantidade(1); setPedirCor(false); setInfo(null);
    medir('ver_produto', { produto: produto.nome, categoria: produto.categoria });
  }, [produto]);

  useEffect(() => {
    if (info === null) return;
    const t = setTimeout(() => document.getElementById('painel-antes-de-pedir')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 320);
    return () => clearTimeout(t);
  }, [info]);

  // Cor é obrigatória quando o produto tem cores: os botões avisam em vez de agir.
  const exigirCor = () => {
    setPedirCor(true);
    document.getElementById('escolha-cor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const noLista = () => {
    if (faltaCor) return exigirCor();
    // A foto voa até a sacola enquanto a tela fecha. O item entra na lista
    // (e o contador sobe) quando a foto chega; o aviso vem logo depois.
    voarParaSacola(document.querySelector<HTMLElement>('[data-foto-produto]')).then(() => adicionar(produto, quantidade, cor));
    fechar();
    setTimeout(() => toast(quantidade > 1 ? `${quantidade} unidades na lista` : 'Adicionado à lista', {
      description: `${produto.nome}${cor ? `, ${cor}` : ''}`,
      action: { label: 'Ver lista', onClick: () => setLista(true) },
    }), 750);
  };

  const compartilhar = async () => {
    const url = `${location.origin}${location.pathname}#produto/${encodeURIComponent(produto.codigo || produto.nome)}`;
    try {
      if (navigator.share) await navigator.share({ title: produto.nome, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch { /* cancelado */ }
  };

  const troca = {
    initial: { opacity: 0, x: 16 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -16 },
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const },
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {info !== null ? (
        <motion.div key="antes-de-pedir" id="painel-antes-de-pedir" {...troca} className="h-full scroll-mt-4">
          <PainelAntesDePedir indice={info} mudar={setInfo} voltar={() => setInfo(null)} />
        </motion.div>
      ) : (
    <motion.div key="produto" {...troca} className="flex h-full flex-col">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] text-suave">
            {produto.categoria}{produto.codigo ? ` / ${produto.codigo}` : ''}
          </p>
          <h2 className="titulo mt-2 text-[1.9rem] leading-[0.98] text-balance md:text-[2.4rem]">
            {produto.nome}
          </h2>
        </div>
        <BotaoIcone onClick={compartilhar} aria-label="Compartilhar produto" className="shrink-0 ring-1 ring-texto/8">
          <ShareNetwork size={18} weight="light" />
        </BotaoIcone>
      </div>

      <div className="mt-4">{produto.esgotado ? <p className="text-lg font-medium text-suave">Esgotado no momento</p> : <Preco produto={produto} grande />}</div>
      {produto.descricao && <p className="mt-4 max-w-[52ch] leading-relaxed text-suave">{produto.descricao}</p>}

      {temCores && (
        <fieldset id="escolha-cor" className="mt-7">
          <legend className="flex items-center gap-2 text-sm font-medium">
            Cor
            <AnimatePresence mode="wait">
              <motion.span
                key={cor || (pedirCor ? 'pedir' : 'vazio')}
                initial={{ opacity: 0, y: 4 }}
                animate={pedirCor && !cor ? { opacity: 1, y: 0, x: [0, -5, 5, -3, 3, 0] } : { opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.35 }}
                className={cor ? 'font-normal text-suave' : pedirCor ? 'font-normal text-acento' : 'font-normal text-suave'}
              >
                {cor || (pedirCor ? 'Escolha uma cor para continuar' : 'Escolha uma')}
              </motion.span>
            </AnimatePresence>
          </legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {produto.cores.map((c) => {
              const ativa = c === cor;
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={ativa}
                  onClick={() => { setCor(c); setPedirCor(false); medir('cor_escolhida', { produto: produto.nome, cor: c }); }}
                  className={`inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm transition-[box-shadow,background-color] duration-300 ${
                    ativa ? 'bg-texto text-fundo' : 'bg-superficie ring-1 ring-texto/10 hover:ring-texto/25'
                  } ${pedirCor && !cor ? 'ring-acento/60' : ''}`}
                >
                  <span className="grid size-6 place-items-center rounded-full ring-1 ring-texto/15" style={{ background: corDaBolinha(c) }}>
                    {ativa && <Check size={12} weight="bold" className={['branco', 'areia', 'creme', 'amarelo', 'bege', 'nude', 'prata', 'prateado'].some((n) => c.toLowerCase().startsWith(n)) ? 'text-fundo' : 'text-white'} />}
                  </span>
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-auto pt-8">
        {produto.esgotado ? (
          <BotaoLink
            tom="texto"
            href={linkWhatsapp(mensagemAviseMe(produto))}
            target="_blank"
            rel="noopener"
            icone={<BellRinging size={18} weight="light" />}
            className="w-full"
            data-evento="pedido_avise_me"
            data-produto={produto.nome}
            data-categoria={produto.categoria}
          >
            Avise-me quando voltar
          </BotaoLink>
        ) : (
          <>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-medium">Quantidade</span>
              <Quantidade valor={quantidade} mudar={(n) => setQuantidade(Math.max(1, Math.min(99, n)))} rotulo="Quantidade" />
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2">
              <Botao tom="contorno" onClick={noLista} icone={<ShoppingBagOpen size={18} weight="light" />} aria-disabled={faltaCor}>
                Adicionar à lista
              </Botao>
              {faltaCor ? (
                <Botao onClick={exigirCor} icone={<IconeWhats />} aria-disabled>
                  Pedir <span className="ml-1 tabular-nums opacity-85">{total}</span>
                </Botao>
              ) : (
                <BotaoLink
                  href={linkWhatsapp(mensagemPedido([{ produto, quantidade, cor }]))}
                  target="_blank"
                  rel="noopener"
                  icone={<IconeWhats />}
                  data-evento="pedido_whatsapp"
                  data-produto={produto.nome}
                  data-categoria={produto.categoria}
                  data-cor={cor || undefined}
                >
                  Pedir <span className="ml-1 tabular-nums opacity-85">{total}</span>
                </BotaoLink>
              )}
            </div>
          </>
        )}
        <AtalhosAntesDePedir abrir={setInfo} />
      </div>
    </motion.div>
      )}
    </AnimatePresence>
  );
}

// Hash do produto (#produto/SEN-01): o link pode ser compartilhado e o
// botão "voltar" do celular fecha a tela em vez de sair do site.
const hashDe = (p: Produto) => `#produto/${encodeURIComponent(p.codigo || p.nome)}`;

export function useProdutoNaUrl() {
  const categorias = useUI((s) => s.categorias);
  const aberto = useUI((s) => s.produtoAberto);
  const abrir = useUI((s) => s.abrirProduto);

  // Abre o produto do link compartilhado quando a planilha chega.
  useEffect(() => {
    const m = location.hash.match(/^#produto\/(.+)$/);
    if (!m || categorias.length === 0) return;
    const id = decodeURIComponent(m[1]);
    const p = categorias.flatMap((c) => c.produtos).find((x) => x.codigo === id || x.nome === id);
    if (p) abrir(p);
  }, [categorias, abrir]);

  // Só mexe no endereço quando a tela abre ou fecha. Na primeira carga o
  // hash do link compartilhado fica, até a planilha chegar e abrir o produto.
  const estavaAberto = useRef(false);
  useEffect(() => {
    if (aberto && location.hash !== hashDe(aberto)) {
      const jaEmProduto = location.hash.startsWith('#produto/');
      history[jaEmProduto ? 'replaceState' : 'pushState']({ produto: true }, '', hashDe(aberto));
    }
    if (!aberto && estavaAberto.current && location.hash.startsWith('#produto/')) {
      if (history.state?.produto) history.back();
      else history.replaceState(null, '', location.pathname + location.search);
    }
    estavaAberto.current = !!aberto;
  }, [aberto]);

  useEffect(() => {
    const voltar = () => { if (!location.hash.startsWith('#produto/')) abrir(null); };
    window.addEventListener('popstate', voltar);
    return () => window.removeEventListener('popstate', voltar);
  }, [abrir]);
}

export function TelaProduto() {
  const produto = useUI((s) => s.produtoAberto);
  const abrir = useUI((s) => s.abrirProduto);
  const desktop = useDesktop();
  // Mantém o último produto durante a animação de saída.
  const [exibido, setExibido] = useState<Produto | null>(produto);
  useEffect(() => { if (produto) setExibido(produto); }, [produto]);
  const fechar = () => abrir(null);
  const rolagem = useRef<HTMLDivElement>(null);
  useEffect(() => { rolagem.current?.scrollTo({ top: 0 }); }, [produto]);
  useEffect(() => {
    if (!produto || desktop) return;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = antes; };
  }, [produto, desktop]);

  if (desktop) {
    return (
      <AnimatePresence>
        {produto && (
          <motion.div
            key="fundo"
            className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-6 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={fechar}
            onKeyDown={(e) => e.key === 'Escape' && fechar()}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={produto.nome}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 40, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 24, scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 260, damping: 30 }}
              className="w-full max-w-5xl rounded-[2.25rem] bg-superficie/60 p-1.5 shadow-(--shadow-flutua) ring-1 ring-white/10"
            >
              <div className="grid max-h-[calc(100dvh-3rem)] grid-cols-[1.05fr_1fr] overflow-hidden rounded-[calc(2.25rem-0.375rem)] bg-superficie">
                <div data-foto-produto className="relative aspect-square max-h-[calc(100dvh-3.75rem)] overflow-hidden bg-superficie-2">
                  <FotoProduto inteira produto={produto} prioridade tamanhos="540px" />
                  <div className="absolute left-4 top-4">
                    <BotaoIcone onClick={fechar} aria-label="Fechar" className="bg-superficie/80 backdrop-blur hover:bg-superficie" autoFocus>
                      <X size={20} weight="light" />
                    </BotaoIcone>
                  </div>
                </div>
                {/* A foto define a altura do modal; a coluna da direita rola por dentro se precisar. */}
                <div className="relative">
                  <div data-lenis-prevent className="absolute inset-0 flex flex-col overflow-y-auto p-9">
                    <Detalhes produto={produto} fechar={fechar} />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Celular: tela própria, que entra deslizando da direita e cobre tudo
  // (como a página de produto de um app). Nada do catálogo aparece atrás.
  return (
    <AnimatePresence>
      {exibido && produto && (
        <motion.div
          key="tela-produto"
          role="dialog"
          aria-modal="true"
          aria-label={exibido.nome}
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ duration: 0.42, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-50 flex flex-col bg-fundo"
        >
          <header className="flex shrink-0 items-center gap-2 border-b border-texto/6 px-2 pb-2 pt-[max(10px,env(safe-area-inset-top))]">
            <button
              type="button"
              onClick={fechar}
              className="inline-flex h-11 items-center gap-1.5 rounded-full pl-2 pr-4 text-[15px] font-medium transition-colors active:bg-texto/8"
            >
              <ArrowLeft size={20} /> Voltar
            </button>
            <span className="ml-auto truncate pr-3 font-mono text-[11px] text-suave">{exibido.categoria}</span>
          </header>
          {/* data-lenis-prevent: a rolagem suave não segura o dedo aqui dentro. */}
          <div ref={rolagem} data-lenis-prevent className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(28px,env(safe-area-inset-bottom))]">
            <div data-foto-produto className="relative aspect-[4/3] overflow-hidden bg-superficie-2">
              <FotoProduto inteira produto={exibido} prioridade tamanhos="100vw" />
            </div>
            <div className="px-5 pt-6">
              <Detalhes produto={exibido} fechar={fechar} />
              <Parecidos produto={exibido} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
