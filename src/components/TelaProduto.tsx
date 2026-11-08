import { ArrowLeft, BellRinging, CaretRight, Info, ShareNetwork, ShoppingBag, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import { chaveProduto, normalizar, temVersoes, type Produto } from '../lib/catalogo';
import { voarParaSacola } from '../lib/efeitos';
import { linkCompartilhar } from '../lib/fotos';
import { medir } from '../lib/medicao';
import { linkWhatsapp, mensagemAviseMe, mensagemPedido } from '../lib/whatsapp';
import { useDesktop } from '../hooks/useTela';
import { useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { ITENS_ANTES_DE_PEDIR } from './AntesDePedir';
import { Botao, BotaoIcone, BotaoLink, IconeWhats } from './Botoes';
import { Preco } from './CardProduto';
import { SeletorCor, SeletorQuantidade, SeletorVersao, useEscolha } from './Escolhas';
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
              <div className="aspect-square overflow-hidden rounded-xl bg-superficie-2"><FotoProduto decorativa produto={p} tamanhos="112px" /></div>
              <p className="mt-1.5 truncate text-[13px] font-medium">{p.nome}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Garantia e cuidados ficam numa gaveta: a tela do produto não precisa rolar
// por causa deles, e quem quer ler abre com um toque.
function InformacoesDoProduto() {
  const [aberta, setAberta] = useState(false);
  const desktop = useDesktop();
  return (
    <>
      <button type="button" onClick={() => setAberta(true)} className="mt-3 flex min-h-11 w-full items-center gap-2.5 text-left text-[15px] font-medium">
        <Info size={20} className="shrink-0 text-suave" />
        Garantia, cuidados e cores
        <CaretRight size={18} className="ml-auto shrink-0 text-suave" />
      </button>
      <Drawer.Root open={aberta} onOpenChange={setAberta} direction={desktop ? 'right' : 'bottom'}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-[60]" />
          <Drawer.Content aria-describedby={undefined} className={`fixed z-[60] flex flex-col bg-fundo outline-none ${desktop ? 'inset-y-0 right-0 w-[440px]' : 'inset-x-0 bottom-0 max-h-[85dvh] rounded-t-3xl'}`}>
            {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-texto/20" aria-hidden />}
            <div className="flex items-center justify-between px-5 pb-1 pt-3">
              <Drawer.Title className="titulo text-[22px]">Antes de pedir</Drawer.Title>
              <BotaoIcone onClick={() => setAberta(false)} aria-label="Fechar" className="-mr-2"><X size={22} /></BotaoIcone>
            </div>
            <div className="overflow-y-auto overscroll-contain px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
              {ITENS_ANTES_DE_PEDIR.map((item) => (
                <div key={item.titulo} className="border-t border-linha py-3.5 first:border-t-0">
                  <h3 className="text-[15px] font-semibold">{item.titulo}</h3>
                  <p className="mt-1 text-[14px] leading-relaxed text-suave">{item.texto}</p>
                </div>
              ))}
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

function Corpo({ produto, escolha }: { produto: Produto; escolha: ReturnType<typeof useEscolha> }) {
  const compartilhar = async () => {
    const url = linkCompartilhar(produto);
    try {
      if (navigator.share) await navigator.share({ title: produto.nome, url });
      else { await navigator.clipboard.writeText(url); toast('Link copiado'); }
    } catch { /* cancelado */ }
  };
  return (
    <>
      <h2 className="titulo text-[26px] text-balance md:pr-8 md:text-[30px]">{produto.nome}</h2>
      <div className="mt-1 flex items-center justify-between gap-3">
        {produto.esgotado ? <p className="text-[17px] font-medium text-suave">Esgotado no momento</p> : <Preco produto={escolha.escolhido} grande />}
        <BotaoIcone onClick={compartilhar} aria-label="Compartilhar produto" className="-mr-2 shrink-0"><ShareNetwork size={20} /></BotaoIcone>
      </div>
      {produto.descricao && <p className="mt-3 max-w-[52ch] whitespace-pre-line text-[15px] leading-relaxed text-suave">{produto.descricao}</p>}
      {!produto.esgotado && (
        <div className="mt-6 space-y-6">
          {temVersoes(produto) && <SeletorVersao produto={produto} escolha={escolha} />}
          {produto.cores.length > 0 && <SeletorCor produto={produto} escolha={escolha} />}
          <SeletorQuantidade produto={escolha.escolhido} escolha={escolha} />
        </div>
      )}
      <InformacoesDoProduto />
    </>
  );
}

// Os botões ficam sempre à vista, sem precisar rolar até eles.
function Acoes({ produto, escolha, fechar }: { produto: Produto; escolha: ReturnType<typeof useEscolha>; fechar: () => void }) {
  const adicionar = useLista((s) => s.adicionar);
  const setLista = useUI((s) => s.setListaAberta);
  const { cor, versao, escolhido, quantidade, faltaCor, textoTotal, setPedirCor, idDaFalta } = escolha;

  const exigirCor = () => {
    setPedirCor(true);
    document.getElementById(idDaFalta)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };
  const naSacola = () => {
    if (faltaCor) return exigirCor();
    voarParaSacola(document.querySelector<HTMLElement>('[data-foto-produto]')).then(() => adicionar(produto, quantidade, cor, versao));
    fechar();
    setTimeout(() => toast('Colocado na sacola', {
      description: `${quantidade} x ${produto.nome}${[versao, cor].filter(Boolean).map((t) => `, ${t}`).join('')}`,
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
        <BotaoLink href={linkWhatsapp(mensagemPedido([{ produto: escolhido, quantidade, cor, versao }]))} target="_blank" rel="noopener" icone={<IconeWhats />} data-evento="pedido_whatsapp" data-produto={produto.nome} data-categoria={produto.categoria} data-cor={cor || undefined}>
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
    const p = categorias.flatMap((c) => c.produtos).find((x) => normalizar(x.codigo) === normalizar(id) || x.nome === id);
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
    // Com a gaveta de garantia aberta, o Esc fecha só ela.
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && !document.querySelector('[data-vaul-drawer]') && abrir(null);
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
                <div className="px-8 pb-5 pt-1"><Acoes produto={produto} escolha={escolha} fechar={fechar} /></div>
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
          <div className="shrink-0 bg-fundo px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-2">
            <Acoes produto={exibido} escolha={escolha} fechar={fechar} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const SEM_PRODUTO: Produto = { nome: '', codigo: '', descricao: '', preco: '', foto: '', cores: [], combos: {}, maisVendido: null, esgotado: false, categoria: '' };

// O hook precisa existir mesmo antes de o primeiro produto ser aberto.
function useEscolhaSegura(produto: Produto | null, inicial: number) {
  return useEscolha(produto ?? SEM_PRODUTO, inicial);
}

