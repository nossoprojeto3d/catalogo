import { ArrowDown, HandSwipeRight } from '@phosphor-icons/react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { Suspense, lazy, memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { chaveProduto, queridinhos } from '../lib/catalogo';
import { urlFoto } from '../lib/fotos';
import { precoUnitario, textoPreco } from '../lib/preco';
import { MENSAGEM_GERAL, linkWhatsapp } from '../lib/whatsapp';
import { rolarAte } from '../hooks/useRolagemSuave';
import { useAlgumPainelAberto, useUI } from '../store/ui';
import type { ItemVitrine } from '../three/Vitrine';
import { Botao, BotaoLink, IconeWhats } from './Botoes';

// Three.js só baixa quando a abertura monta, num pedaço separado.
// memo: a legenda muda a cada peça que passa sem redesenhar o Canvas.
const Vitrine = memo(lazy(() => import('../three/Vitrine')));

const MAX_PAINEIS = 14;

const entrada = (atraso: number) => ({
  initial: { opacity: 0, y: 30, filter: 'blur(10px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  transition: { duration: 1.1, ease: [0.16, 1, 0.3, 1] as const, delay: atraso },
});

function useNaTela<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [visivel, setVisivel] = useState(true);
  useEffect(() => {
    if (!ref.current) return;
    const obs = new IntersectionObserver(([e]) => setVisivel(e.isIntersecting), { threshold: 0.02 });
    obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);
  return [ref, visivel] as const;
}

// Peças da vitrine: sorteio a cada visita, sem repetir produto. Ficam de
// fora os queridinhos (já têm a seção deles), os esgotados e quem não tem
// foto. Com menos de 3 peças o anel não fecha, então não aparece.
function usePecasDaVitrine(): ItemVitrine[] {
  const categorias = useUI((s) => s.categorias);
  return useMemo(() => {
    const deFora = new Set(queridinhos(categorias).map(chaveProduto));
    const vistos = new Set<string>();
    const candidatas: ItemVitrine[] = [];
    for (const produto of categorias.flatMap((c) => c.produtos)) {
      const url = urlFoto(produto);
      const chave = chaveProduto(produto);
      if (!url || produto.esgotado || deFora.has(chave) || vistos.has(chave)) continue;
      vistos.add(chave);
      candidatas.push({ produto, url });
    }
    // Embaralha (Fisher-Yates) e fica com as primeiras.
    for (let i = candidatas.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [candidatas[i], candidatas[j]] = [candidatas[j], candidatas[i]];
    }
    const lista = candidatas.slice(0, MAX_PAINEIS);
    return lista.length >= 3 ? lista : [];
  }, [categorias]);
}

export function Abertura() {
  const semMovimento = !!useReducedMotion();
  const painelAberto = useAlgumPainelAberto();
  const abrir = useUI((s) => s.abrirProduto);
  const [palco, palcoVisivel] = useNaTela<HTMLElement>();
  const pecas = usePecasDaVitrine();
  const carregando = useUI((s) => s.status === 'carregando');
  const [frente, setFrente] = useState(0);
  const aoMudarFrente = useCallback((i: number) => setFrente(i), []);
  const naFrente = pecas[frente];

  return (
    <section ref={palco} id="topo" className="relative isolate flex min-h-[100svh] flex-col overflow-hidden">
      {/* Fundo: malha de pontos que some nas bordas + brilho limão sob o anel */}
      <div className="pontos absolute inset-0 -z-20 [mask-image:radial-gradient(80%_60%_at_50%_55%,#000,transparent)]" aria-hidden />
      <div className="absolute inset-x-0 bottom-[10%] -z-20 mx-auto h-[34%] w-[90%] max-w-5xl rounded-[50%] bg-acento/10 blur-[90px]" aria-hidden />

      <div className="absolute inset-0 -z-10">
        {pecas.length > 0 ? (
          <Suspense fallback={null}>
            <Vitrine
              itens={pecas}
              aoAbrir={abrir}
              aoMudarFrente={aoMudarFrente}
              pausado={!palcoVisivel || painelAberto}
              estatico={semMovimento}
            />
          </Suspense>
        ) : carregando ? (
          <div className="absolute inset-x-[8%] top-[46%] h-[26%] animate-pulse rounded-[50%] border border-texto/8" aria-hidden />
        ) : null}
      </div>

      {/* Degradê na base: legenda e botões sempre legíveis sobre as fotos */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[28%] bg-gradient-to-t from-fundo via-fundo/70 to-transparent" aria-hidden />

      {/* O anel é um canvas: esta lista invisível dá acesso às mesmas peças pra leitor de tela */}
      {pecas.length > 0 && (
        <ul className="sr-only" aria-label="Peças na vitrine">
          {pecas.map((p) => (
            <li key={chaveProduto(p.produto)} data-codigo={p.produto.codigo}>
              <button type="button" onClick={() => abrir(p.produto)}>
                {p.produto.nome}, {textoPreco(precoUnitario(p.produto))}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="pointer-events-none mx-auto w-full max-w-[1400px] px-4 pt-[calc(max(12px,env(safe-area-inset-top))+88px)] md:px-10 lg:px-16">
        <motion.h1 {...entrada(0.1)} className="titulo max-w-[12ch] text-[clamp(2.5rem,11vw,7rem)] text-balance">
          Do digital para <span className="text-acento">a sua mão.</span>
        </motion.h1>
        <motion.p {...entrada(0.25)} className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-suave [text-shadow:0_2px_18px_#0c0d0b] md:mt-6 md:text-lg">
          Ideias que ganham forma. Explore nossas peças e encontre aquela que combina com você.
        </motion.p>
      </div>

      <div className="mx-auto mt-auto flex w-full max-w-[1400px] flex-col gap-4 px-4 pb-[max(20px,env(safe-area-inset-bottom))] md:flex-row md:items-end md:justify-between md:px-10 md:pb-10 lg:px-16">
        {/* Legenda da peça de frente: tocar abre o produto */}
        <div className="min-h-12">
          <AnimatePresence mode="wait">
            {naFrente && (
              <motion.button
                key={chaveProduto(naFrente.produto) + frente}
                type="button"
                onClick={() => abrir(naFrente.produto)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="inline-flex max-w-full items-center gap-3 rounded-full bg-superficie/70 py-2 pl-2 pr-4 text-left ring-1 ring-texto/8 backdrop-blur-md"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-full bg-acento text-fundo">
                  <HandSwipeRight size={16} weight="bold" />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{naFrente.produto.nome}</span>
                  <span className="block text-xs tabular-nums text-suave">{textoPreco(precoUnitario(naFrente.produto))}</span>
                </span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <motion.div {...entrada(0.4)} className="flex flex-col gap-2.5 sm:flex-row">
          <Botao onClick={() => rolarAte('#catalogo')} icone={<ArrowDown size={18} weight="bold" />} className="sm:min-w-52">
            Ver o catálogo
          </Botao>
          <BotaoLink
            tom="contorno"
            href={linkWhatsapp(MENSAGEM_GERAL)}
            target="_blank"
            rel="noopener"
            icone={<IconeWhats />}
            data-evento="duvida_whatsapp"
            data-link="abertura"
            className="backdrop-blur-md"
          >
            Tirar uma dúvida
          </BotaoLink>
        </motion.div>
      </div>
    </section>
  );
}
