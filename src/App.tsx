import { WhatsappLogo } from '@phosphor-icons/react';
import { useEffect } from 'react';
import { Toaster, toast } from 'sonner';
import { carregarCatalogo } from './lib/catalogo';
import { MENSAGEM_GERAL, linkWhatsapp } from './lib/whatsapp';
import { useRota } from './hooks/useRota';
import { useLista } from './store/lista';
import { useAlgumPainelAberto, useUI } from './store/ui';
import { AntesDePedir } from './components/AntesDePedir';
import { Busca } from './components/Busca';
import { CompraRapida } from './components/CompraRapida';
import { ListaPedido } from './components/ListaPedido';
import { Menu } from './components/Menu';
import { Navegacao } from './components/Navegacao';
import { PaginaBrindes, PaginaInicio, PaginaProdutos } from './components/Paginas';
import { Rodape } from './components/Rodape';
import { TelaProduto, useProdutoNaUrl } from './components/TelaProduto';

function useCarregarPlanilha() {
  const setCatalogo = useUI((s) => s.setCatalogo);
  const setErro = useUI((s) => s.setErro);
  useEffect(() => {
    carregarCatalogo()
      .then((categorias) => {
        setCatalogo(categorias);
        // Item da sacola que esgotou ou saiu da planilha sai com aviso.
        const removidos = useLista.getState().conferir(categorias);
        if (removidos.length > 0) {
          toast('Sua sacola foi atualizada', {
            description: `${removidos.join(', ')} ${removidos.length === 1 ? 'esgotou e saiu' : 'esgotaram e saíram'} da sacola.`,
          });
        }
      })
      .catch(setErro);
  }, [setCatalogo, setErro]);
}

function DuvidaFlutuante() {
  const painelAberto = useAlgumPainelAberto();
  if (painelAberto) return null;
  return (
    <a
      href={linkWhatsapp(MENSAGEM_GERAL)}
      target="_blank"
      rel="noopener"
      aria-label="Tirar uma dúvida no WhatsApp"
      data-evento="duvida_whatsapp"
      data-link="flutuante"
      className="fixed bottom-[calc(72px+env(safe-area-inset-bottom))] right-3 z-30 grid size-12 place-items-center rounded-full bg-white/30 text-sobre-acento ring-1 ring-sobre-acento/20 backdrop-blur-md active:scale-95 md:bottom-6 md:right-6"
    >
      <WhatsappLogo size={24} />
    </a>
  );
}

export default function App() {
  useRota();
  useCarregarPlanilha();
  useProdutoNaUrl();
  const pagina = useUI((s) => s.pagina);

  return (
    <div className="flex min-h-dvh flex-col bg-fundo">
      <Navegacao />
      <main className="flex-1">
        {pagina.tipo === 'inicio' && <PaginaInicio />}
        {pagina.tipo === 'produtos' && <PaginaProdutos categoria={pagina.categoria} />}
        {pagina.tipo === 'brindes' && <PaginaBrindes />}
        <AntesDePedir />
      </main>
      <Rodape />
      <DuvidaFlutuante />
      <TelaProduto />
      <CompraRapida />
      <ListaPedido />
      <Menu />
      <Busca />
      <Toaster
        position="top-center"
        offset={16}
        mobileOffset={{ top: 'calc(env(safe-area-inset-top) + 12px)' }}
        toastOptions={{
          classNames: {
            toast: '!rounded-2xl !bg-superficie !text-texto !border !border-linha !shadow-(--shadow-flutua) !font-sans',
            description: '!text-suave',
            actionButton: '!bg-acento !text-sobre-acento !rounded-full !px-3 !font-semibold',
          },
        }}
      />
    </div>
  );
}
