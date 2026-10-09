import { MagnifyingGlass, ShoppingBagOpen } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { totalDeItens, useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { ID_SACOLA } from '../lib/efeitos';
import { BotaoIcone } from './Botoes';
import { rolarAte } from '../hooks/useRolagemSuave';

const LOGO = `${import.meta.env.BASE_URL}logo.png`;

// Ilha flutuante: solta do topo, com vidro fosco (só em elemento fixo).
export function Navegacao() {
  const quantidade = useLista((s) => totalDeItens(s.itens));
  const setBusca = useUI((s) => s.setBuscaAberta);
  const setLista = useUI((s) => s.setListaAberta);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center px-3 pt-[max(12px,env(safe-area-inset-top))]">
      <motion.nav
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        className="pointer-events-auto flex w-full max-w-xl items-center justify-between gap-2 rounded-full bg-superficie/72 py-1.5 pl-2 pr-1.5 shadow-(--shadow-flutua) ring-1 ring-texto/6 backdrop-blur-xl backdrop-saturate-150"
        aria-label="Principal"
      >
        <a
          href="#topo"
          onClick={(e) => { e.preventDefault(); rolarAte('#topo', 0); }}
          className="flex items-center gap-2.5 rounded-full py-1 pl-1.5 pr-3"
        >
          <img src={LOGO} alt="" className="h-8 w-auto" width={28} height={33} />
          <span className="titulo text-[13px] tracking-[-0.02em]">Nosso Projeto 3D</span>
        </a>
        <div className="flex items-center gap-0.5">
          <BotaoIcone aria-label="Buscar produtos" onClick={() => setBusca(true)}>
            <MagnifyingGlass size={21} weight="light" />
          </BotaoIcone>
          <BotaoIcone
            id={ID_SACOLA}
            aria-label={`Ver sua lista (${quantidade} ${quantidade === 1 ? 'item' : 'itens'})`}
            onClick={() => setLista(true)}
            className="bg-texto text-fundo hover:bg-white"
          >
            <ShoppingBagOpen size={21} weight="light" />
            <AnimatePresence>
              {quantidade > 0 && (
                <motion.span
                  key={quantidade}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 22 }}
                  className="absolute -right-0.5 -top-0.5 grid min-w-5 place-items-center rounded-full bg-acento px-1 font-mono text-[11px] font-medium leading-5 text-fundo ring-2 ring-superficie"
                  aria-hidden
                >
                  {quantidade}
                </motion.span>
              )}
            </AnimatePresence>
          </BotaoIcone>
        </div>
      </motion.nav>
    </header>
  );
}
