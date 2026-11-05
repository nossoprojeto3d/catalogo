import { House, List, MagnifyingGlass, ShoppingBag } from '@phosphor-icons/react';
import type { ReactNode } from 'react';
import { ID_SACOLA } from '../lib/efeitos';
import { irPara } from '../hooks/useRota';
import { useDesktop } from '../hooks/useTela';
import { totalDeItens, useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { Logo } from './Botoes';

function Contador({ valor }: { valor: number }) {
  if (valor <= 0) return null;
  return (
    <span aria-hidden className="absolute -right-2 -top-1.5 grid min-w-5 place-items-center rounded-full bg-texto px-1 text-[11px] font-semibold leading-5 text-fundo ring-2 ring-barra">
      {valor}
    </span>
  );
}

function ItemBarra({ rotulo, icone, ativo, onClick, id, aria }: { rotulo: string; icone: ReactNode; ativo?: boolean; onClick: () => void; id?: string; aria?: string }) {
  return (
    <button id={id} type="button" onClick={onClick} aria-label={aria} aria-current={ativo ? 'page' : undefined} className="flex min-h-14 flex-col items-center justify-center gap-0.5 text-[12px] font-medium">
      <span className="relative">{icone}</span>
      {rotulo}
    </button>
  );
}

export function Navegacao() {
  const desktop = useDesktop();
  const quantidade = useLista((s) => totalDeItens(s.itens));
  const pagina = useUI((s) => s.pagina.tipo);
  const setBusca = useUI((s) => s.setBuscaAberta);
  const setLista = useUI((s) => s.setListaAberta);
  const setMenu = useUI((s) => s.setMenuAberto);
  const ariaSacola = `Abrir sacola (${quantidade} ${quantidade === 1 ? 'item' : 'itens'})`;
  const marca = (
    <a href="#inicio" className="flex items-center gap-2.5 py-2">
      <Logo className="h-9" />
      <span className="titulo whitespace-nowrap text-[17px]">Nosso Projeto 3D</span>
    </a>
  );

  if (!desktop) {
    return (
      <>
        <header className="sticky top-0 z-40 flex justify-center bg-barra px-4 pt-[env(safe-area-inset-top)] text-sobre-barra">{marca}</header>
        <nav aria-label="Principal" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-4 border-t border-barra-linha bg-barra pb-[env(safe-area-inset-bottom)] text-sobre-barra">
          <ItemBarra rotulo="Início" icone={<House size={24} weight={pagina === 'inicio' ? 'fill' : 'regular'} />} ativo={pagina === 'inicio'} onClick={() => irPara({ tipo: 'inicio' })} />
          <ItemBarra rotulo="Categorias" icone={<List size={24} />} onClick={() => setMenu(true)} />
          <ItemBarra rotulo="Buscar" icone={<MagnifyingGlass size={24} />} onClick={() => setBusca(true)} />
          <ItemBarra id={ID_SACOLA} rotulo="Sacola" aria={ariaSacola} icone={<><ShoppingBag size={24} /><Contador valor={quantidade} /></>} onClick={() => setLista(true)} />
        </nav>
      </>
    );
  }

  const link = 'whitespace-nowrap rounded-full px-3 py-2 text-[15px] font-medium transition-colors hover:bg-sobre-barra/10 lg:px-4';
  return (
    <header className="sticky top-0 z-40 border-b border-barra-linha bg-barra text-sobre-barra">
      <div className="mx-auto flex max-w-[1240px] items-center gap-2 px-6 lg:gap-6">
        {marca}
        <nav aria-label="Principal" className="flex items-center gap-1">
          <a href="#produtos" className={link}>Para você</a>
          <a href="#brindes" className={link}>Brindes</a>
          <button type="button" onClick={() => setMenu(true)} className={link}>Categorias</button>
        </nav>
        <button type="button" onClick={() => setBusca(true)} aria-label="Buscar peça" className="ml-auto flex h-11 w-11 shrink-0 items-center justify-center gap-2 rounded-full bg-superficie text-[15px] text-suave ring-1 ring-texto/10 lg:w-64 lg:justify-start lg:px-4">
          <MagnifyingGlass size={18} /> <span className="hidden lg:inline">Buscar peça</span>
        </button>
        <button id={ID_SACOLA} type="button" onClick={() => setLista(true)} aria-label={ariaSacola} className="relative flex h-11 items-center gap-2 rounded-full px-3 text-[15px] font-medium transition-colors hover:bg-sobre-barra/10">
          <span className="relative"><ShoppingBag size={24} /><Contador valor={quantidade} /></span>
          <span className="ml-1 hidden lg:inline">Sacola</span>
        </button>
      </div>
    </header>
  );
}
