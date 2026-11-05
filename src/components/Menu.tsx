import { CaretRight, Gift, SquaresFour, X } from '@phosphor-icons/react';
import { Drawer } from 'vaul';
import { urlFoto } from '../lib/fotos';
import { useDesktop } from '../hooks/useTela';
import { useUI } from '../store/ui';
import { BotaoIcone } from './Botoes';
import { FotoProduto } from './FotoProduto';

export function Menu() {
  const aberto = useUI((s) => s.menuAberto);
  const setAberto = useUI((s) => s.setMenuAberto);
  const categorias = useUI((s) => s.categorias);
  const desktop = useDesktop();
  const fechar = () => setAberto(false);
  const linha = 'flex min-h-14 items-center gap-3 rounded-2xl px-2 text-[16px] font-medium active:bg-texto/5 hover:bg-texto/5';
  const iconeBase = 'grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-superficie-2';

  return (
    <Drawer.Root open={aberto} onOpenChange={setAberto} direction={desktop ? 'right' : 'bottom'}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50" />
        <Drawer.Content aria-describedby={undefined} className={`fixed z-50 flex flex-col bg-fundo outline-none ${desktop ? 'inset-y-0 right-0 w-[400px]' : 'inset-x-0 bottom-0 max-h-[88dvh] rounded-t-3xl'}`}>
          {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-texto/20" aria-hidden />}
          <div className="flex items-center justify-between px-5 pb-1 pt-3">
            <Drawer.Title className="titulo text-[22px]">Categorias</Drawer.Title>
            <BotaoIcone onClick={fechar} aria-label="Fechar" className="-mr-2"><X size={22} /></BotaoIcone>
          </div>
          <nav aria-label="Categorias" className="overflow-y-auto overscroll-contain px-3 pb-[max(16px,env(safe-area-inset-bottom))]">
            <a href="#produtos" onClick={fechar} className={linha}><span className={iconeBase}><SquaresFour size={22} /></span>Todas as peças<CaretRight size={18} className="ml-auto text-suave" /></a>
            <a href="#brindes" onClick={fechar} className={linha}><span className={`${iconeBase} !bg-acento !text-sobre-acento`}><Gift size={22} /></span>Brindes para seus clientes<CaretRight size={18} className="ml-auto text-suave" /></a>
            <div className="mx-2 my-1.5 border-t border-linha" />
            {categorias.map((c) => {
              const foto = c.produtos.find((p) => !p.esgotado && urlFoto(p));
              return (
                <a key={c.nome} href={`#categoria/${encodeURIComponent(c.nome)}`} onClick={fechar} className={linha}>
                  <span className={iconeBase}>{foto && <FotoProduto decorativa produto={foto} tamanhos="44px" />}</span>
                  {c.nome}
                  <CaretRight size={18} className="ml-auto text-suave" />
                </a>
              );
            })}
          </nav>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
