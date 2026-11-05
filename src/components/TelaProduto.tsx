import { ArrowLeft, BellRinging, CaretDown, ShareNetwork, ShoppingBag, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { chaveProduto, type Produto } from '../lib/catalogo';
import { voarParaSacola } from '../lib/efeitos';
import { medir } from '../lib/medicao';
import { linkWhatsapp, mensagemAviseMe, mensagemPedido } from '../lib/whatsapp';
import { useDesktop } from '../hooks/useTela';
import { useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { ITENS_ANTES_DE_PEDIR } from './AntesDePedir';
import { Botao, BotaoIcone, BotaoLink, IconeWhats } from './Botoes';
import { Preco } from './CardProduto';
import { SeletorCor, SeletorQuantidade, useEscolha } from './Escolhas';
import { FotoProduto } from './FotoProduto';

function Parecidos({ produto }: { produto: Produto }) {
  const categorias = useUI((s) => s.categorias);
  const abrir = useUI((s) => s.abrirProduto);
  const lista = useMemo(
    () => (categorias.find((c) => c.nome === produto.categoria)?.produtos ?? []).filter((p) => p !== produto && !p.esgotado).slice(0, 6),
    [categorias, produto],
  );
  if (lista.length === 0) return null;
  return (
    <div className="mt-8">
      <h3 className="text-[15px] font-semibold">Veja também</h3>
      <ul className="sem-barra -mx-5 mt-3 flex gap-3 overflow-x-auto px-5 md:mx-0 md:px-0">
        {lista.map((p) => (
          <li key={chaveProduto(p)} className="w-28 shrink-0">
            <button type="button" onClick={() => abrir(p)} className="block w-full text-left">
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-superficie-2"><FotoProduto decorativa produto={p} tamanhos="112px" /></div>
              <p className="mt-1.5 truncate text-[13px] font-medium">{p.nome}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Garantia e cuidados ficam recolhidos: quem quer ler abre.
function Recolhivel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <details className="group border-t border-linha">
      <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-3 text-[15px] font-medium [&::-webkit-details-marker]:hidden">
        {titulo}
        <CaretDown size={18} className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-4 text-[14px] leading-relaxed text-suave">{children}</div>
    </details>
  );
}

function Corpo({ produto, escolha }: { produto: Produto; escolha: ReturnType<typeof useEscolha> }) {
  const compartilhar = async () => {
    const url = `${location.origin}${location.pathname}#produto/${encodeURIComponent(produto.codigo || produto.nome)}`;
    try {
      if (navigator.share) await navigator.share({ title: produto.nome, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch { /* cancelado */ }
  };
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <h2 className="titulo text-[26px] text-balance md:text-[30px]">{produto.nome}</h2>
        <BotaoIcone onClick={compartilhar} aria-label="Compartilhar produto" className="-mr-2 -mt-1 shrink-0"><ShareNetwork size={20} /></BotaoIcone>
      </div>
      <div className="mt-2">
        {produto.esgotado ? <p className="text-[17px] font-medium text-suave">Esgotado no momento</p> : <Preco produto={produto} grande />}
      </div>
      {produto.descricao && <p className="mt-3 max-w-[52ch] text-[15px] leading-relaxed text-suave">{produto.descricao}</p>}
      {!produto.esgotado && (
        <div className="mt-6 space-y-6">
          {produto.cores.length > 0 && <SeletorCor produto={produto} escolha={escolha} />}
          <SeletorQuantidade produto={produto} escolha={escolha} />
        </div>
      )}
      <div className="mt-7 border-b border-linha">
        {ITENS_ANTES_DE_PEDIR.map((i) => <Recolhivel key={i.titulo} titulo={i.titulo}>{i.texto}</Recolhivel>)}
      </div>
    </>
  );
}

// Os botões ficam sempre à vista, sem precisar rolar até eles.
function Acoes({ produto, escolha, fechar }: { produto: Produto; escolha: ReturnType<typeof useEscolha>; fechar: () => void }) {
  const adicionar = useLista((s) => s.adicionar);
  const setLista = useUI((s) => s.setListaAberta);
  const { cor, quantidade, faltaCor, textoTotal, setPedirCor } = escolha;

  const exigirCor = () => {
    setPedirCor(true);
    document.getElementById('escolha-cor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const naSacola = () => {
    if (faltaCor) return exigirCor();
    voarParaSacola(document.querySelector<HTMLElement>('[data-foto-produto]')).then(() => adicionar(produto, quantidade, cor));
    fechar();
    setTimeout(() => toast('Colocado na sacola', {
      description: `${quantidade} x ${produto.nome}${cor ? `, ${cor}` : ''}`,
      action: { label: 'Ver sacola', onClick: () => setLista(true) },
    }), 750);
  };

  if (produto.esgotado) {
    return (
      <BotaoLink href={linkWhatsapp(mensagemAviseMe(produto))} target="_blank" rel="noopener" icone={<BellRinging size={20} />} className="w-full" data-evento="pedido_avise_me" data-produto={produto.nome} data-categoria={produto.categoria}>
        Avise-me quando voltar
      </BotaoLink>
    );
  }
  return (
    <div className="grid grid-cols-[auto_1fr] gap-2">
      <Botao tom="contorno" onClick={naSacola} aria-label="Colocar na sacola" icone={<ShoppingBag size={20} />} className="!px-4">
        Sacola
      </Botao>
      {faltaCor ? (
        <Botao onClick={exigirCor} icone={<IconeWhats />} aria-disabled>Pedir, {textoTotal}</Botao>
      ) : (
        <BotaoLink href={linkWhatsapp(mensagemPedido([{ produto, quantidade, cor }]))} target="_blank" rel="noopener" icone={<IconeWhats />} data-evento="pedido_whatsapp" data-produto={produto.nome} data-categoria={produto.categoria} data-cor={cor || undefined}>
          Pedir, {textoTotal}
        </BotaoLink>
      )}
    </div>
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
  const brindes = useUI((s) => s.pagina.tipo === 'brindes');
  const desktop = useDesktop();
  // Mantém o último produto durante a animação de saída.
  const [exibido, setExibido] = useState<Produto | null>(produto);
  useEffect(() => {
    if (!produto) return;
    setExibido(produto);
    medir('ver_produto', { produto: produto.nome, categoria: produto.categoria });
  }, [produto]);
  const fechar = () => abrir(null);
  const rolagem = useRef<HTMLDivElement>(null);
  useEffect(() => { rolagem.current?.scrollTo({ top: 0 }); }, [produto]);
  useEffect(() => {
    if (!produto) return;
    const html = document.documentElement;
    const antes = html.style.overflow;
    html.style.overflow = 'hidden';
    return () => { html.style.overflow = antes; };
  }, [produto]);
  useEffect(() => {
    if (!produto) return;
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && abrir(null);
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [produto, abrir]);

  const atual = produto ?? exibido;
  const escolha = useEscolhaSegura(atual, brindes ? 10 : 1);

  if (desktop) {
    return (
      <AnimatePresence>
        {produto && (
          <motion.div key="fundo" className="fixed inset-0 z-50 grid place-items-center bg-sobre-acento/40 p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={fechar}>
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label={produto.nome}
              onClick={(e) => e.stopPropagation()}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="grid h-[min(720px,calc(100dvh-3rem))] w-full max-w-5xl grid-cols-[1.05fr_1fr] overflow-hidden rounded-3xl bg-fundo shadow-(--shadow-flutua)"
            >
              <div data-foto-produto className="relative overflow-hidden bg-superficie-2">
                <FotoProduto inteira produto={produto} prioridade tamanhos="540px" />
              </div>
              <div className="flex min-h-0 flex-col">
                <div className="flex justify-end px-4 pt-3">
                  <BotaoIcone onClick={fechar} aria-label="Fechar" autoFocus><X size={22} /></BotaoIcone>
                </div>
                <div ref={rolagem} className="min-h-0 flex-1 overflow-y-auto px-8 pb-6"><Corpo produto={produto} escolha={escolha} /></div>
                <div className="border-t border-linha px-8 py-4"><Acoes produto={produto} escolha={escolha} fechar={fechar} /></div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Celular: tela própria, que entra da direita e cobre tudo, como a página
  // de produto de um app.
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
          transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-50 flex flex-col bg-fundo"
        >
          <header className="flex shrink-0 items-center border-b border-barra-linha bg-barra px-2 pb-1 pt-[max(6px,env(safe-area-inset-top))] text-sobre-barra">
            <button type="button" onClick={fechar} className="inline-flex h-11 items-center gap-1.5 rounded-full pl-2 pr-4 text-[16px] font-medium active:bg-texto/8">
              <ArrowLeft size={22} /> Voltar
            </button>
          </header>
          <div ref={rolagem} className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
            <div data-foto-produto className="relative aspect-[4/3] overflow-hidden bg-superficie-2">
              <FotoProduto inteira produto={exibido} prioridade tamanhos="100vw" />
            </div>
            <div className="px-5 pt-5">
              <Corpo produto={exibido} escolha={escolha} />
              <Parecidos produto={exibido} />
            </div>
          </div>
          <div className="shrink-0 border-t border-linha bg-superficie px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
            <Acoes produto={exibido} escolha={escolha} fechar={fechar} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SEM_PRODUTO: Produto = { nome: '', codigo: '', descricao: '', preco: '', precoPromocional: '', foto: '', cores: [], combos: {}, maisVendido: null, esgotado: false, categoria: '' };

// O hook precisa existir mesmo antes de o primeiro produto ser aberto.
function useEscolhaSegura(produto: Produto | null, inicial: number) {
  return useEscolha(produto ?? SEM_PRODUTO, inicial);
}

