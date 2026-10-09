import { AnimatePresence, motion } from 'motion/react';
import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { Toaster, toast } from 'sonner';
import { carregarCatalogo } from './lib/catalogo';
import { MENSAGEM_GERAL, linkWhatsapp } from './lib/whatsapp';
import { useRolagemSuave } from './hooks/useRolagemSuave';
import { useLista } from './store/lista';
import { useAlgumPainelAberto, useUI } from './store/ui';
import { Abertura } from './components/Abertura';
import { AntesDePedir } from './components/AntesDePedir';
import { Busca } from './components/Busca';
import { Catalogo } from './components/Catalogo';
import { FaixaCategorias } from './components/FaixaCategorias';
import { IconeWhats } from './components/Botoes';
import { ListaPedido } from './components/ListaPedido';
import { Navegacao } from './components/Navegacao';
import { Queridinhos } from './components/Queridinhos';
import { Rodape } from './components/Rodape';
import { TelaProduto, useProdutoNaUrl } from './components/TelaProduto';

const ComoPedir = lazy(() => import('./components/ComoPedir'));

function useCarregarPlanilha() {
  const setCatalogo = useUI((s) => s.setCatalogo);
  const setErro = useUI((s) => s.setErro);
  useEffect(() => {
    carregarCatalogo()
      .then((categorias) => {
        setCatalogo(categorias);
        // Item da lista que esgotou ou saiu da planilha sai da lista com aviso.
        const removidos = useLista.getState().conferir(categorias);
        if (removidos.length > 0) {
          toast('Sua lista foi atualizada', {
            description: `${removidos.join(', ')} ${removidos.length === 1 ? 'esgotou e saiu' : 'esgotaram e saíram'} da lista.`,
          });
        }
      })
      .catch(setErro);
  }, [setCatalogo, setErro]);
}

// Botão flutuante de dúvida: aparece depois que a abertura sai da tela.
function DuvidaFlutuante({ abertura }: { abertura: React.RefObject<HTMLDivElement | null> }) {
  const [visivel, setVisivel] = useState(false);
  const painelAberto = useAlgumPainelAberto();
  useEffect(() => {
    if (!abertura.current) return;
    // Só depois que a abertura passou pra cima (não antes de chegar nela).
    const obs = new IntersectionObserver(([e]) => setVisivel(!e.isIntersecting && e.boundingClientRect.top < 0), { threshold: 0 });
    obs.observe(abertura.current);
    return () => obs.disconnect();
  }, [abertura]);
  return (
    <AnimatePresence>
      {visivel && !painelAberto && (
        <motion.a
          href={linkWhatsapp(MENSAGEM_GERAL)}
          target="_blank"
          rel="noopener"
          aria-label="Tirar uma dúvida no WhatsApp"
          data-evento="duvida_whatsapp"
          data-link="flutuante"
          initial={{ opacity: 0, scale: 0.6, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 20 }}
          transition={{ type: 'spring', stiffness: 380, damping: 26 }}
          className="fixed bottom-[max(16px,env(safe-area-inset-bottom))] right-4 z-40 grid size-14 place-items-center rounded-full bg-acento text-fundo shadow-(--shadow-acento) active:scale-95"
        >
          <IconeWhats size={24} />
        </motion.a>
      )}
    </AnimatePresence>
  );
}

export default function App() {
  useRolagemSuave();
  useCarregarPlanilha();
  useProdutoNaUrl();
  const sentinelaAbertura = useRef<HTMLDivElement>(null);

  return (
    <div className="grao">
      <Navegacao />
      <main>
        <Abertura />
        <div ref={sentinelaAbertura} aria-hidden />
        <FaixaCategorias />
        <Queridinhos />
        <Catalogo />
        <Suspense fallback={<div className="min-h-[60svh]" />}>
          <ComoPedir />
        </Suspense>
        <AntesDePedir />
      </main>
      <Rodape />
      <DuvidaFlutuante abertura={sentinelaAbertura} />
      <TelaProduto />
      <ListaPedido />
      <Busca />
      <Toaster
        position="top-center"
        offset={84}
        mobileOffset={{ top: 84 }}
        toastOptions={{
          classNames: {
            toast: '!rounded-[1.25rem] !bg-superficie-2 !text-texto !border !border-texto/10 !shadow-(--shadow-flutua) !font-sans',
            description: '!text-suave',
            actionButton: '!bg-acento !text-fundo !rounded-full !px-3 !font-medium',
          },
        }}
      />
    </div>
  );
}
