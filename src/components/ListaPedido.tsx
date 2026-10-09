import { ShoppingBagOpen, Trash, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { emReais, precoUnitario } from '../lib/preco';
import { linkWhatsapp, mensagemPedido } from '../lib/whatsapp';
import { useDesktop } from '../hooks/useTela';
import { rolarAte } from '../hooks/useRolagemSuave';
import { resolverItens, totalDeItens, useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { Botao, BotaoIcone, BotaoLink, IconeWhats } from './Botoes';
import { FotoProduto } from './FotoProduto';
import { Quantidade } from './TelaProduto';

function Conteudo({ fechar }: { fechar: () => void }) {
  const categorias = useUI((s) => s.categorias);
  const salvos = useLista((s) => s.itens);
  const { mudarQuantidade, remover, limpar } = useLista.getState();
  const itens = useMemo(() => resolverItens(salvos, categorias), [salvos, categorias]);
  const quantidade = totalDeItens(salvos);
  const total = itens.reduce((s, i) => s + precoUnitario(i.produto) * i.quantidade, 0);
  const temACombinar = itens.some((i) => precoUnitario(i.produto) <= 0);
  // "Limpar lista" pede um segundo toque em vez de abrir um confirm().
  const [confirmarLimpar, setConfirmarLimpar] = useState(false);
  useEffect(() => {
    if (!confirmarLimpar) return;
    const t = setTimeout(() => setConfirmarLimpar(false), 3500);
    return () => clearTimeout(t);
  }, [confirmarLimpar]);

  if (itens.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-16 text-center">
        <div className="pontos grid size-20 place-items-center rounded-full bg-superficie-2 text-suave">
          <ShoppingBagOpen size={34} weight="light" />
        </div>
        <h3 className="titulo mt-6 text-2xl">Sua lista está vazia</h3>
        <p className="mt-2 max-w-[32ch] text-suave">Abra um produto e toque em “Adicionar à lista” para montar o pedido.</p>
        <Botao className="mt-8" onClick={() => { fechar(); setTimeout(() => rolarAte('#catalogo'), 350); }}>
          Ver o catálogo
        </Botao>
      </div>
    );
  }

  return (
    <>
      <ul data-lenis-prevent className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-5 py-2">
        <AnimatePresence initial={false}>
          {itens.map(({ produto, quantidade: q, cor, chave }) => {
            const unitario = precoUnitario(produto);
            return (
              <motion.li
                key={`${chave}|${cor}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex gap-3 rounded-[1.5rem] bg-texto/[0.025] p-2 ring-1 ring-texto/5"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-[1.1rem] bg-superficie-2">
                  <FotoProduto decorativa produto={produto} tamanhos="80px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{produto.nome}</p>
                      <p className="mt-0.5 truncate text-xs text-suave">
                        {[cor, produto.codigo].filter(Boolean).join(' / ')}
                      </p>
                    </div>
                    <button type="button" onClick={() => remover(chave, cor)} aria-label={`Remover ${produto.nome}`} className="-mr-1 -mt-1 grid size-9 shrink-0 place-items-center rounded-full text-suave transition hover:bg-texto/5 hover:text-texto">
                      <Trash size={17} weight="light" />
                    </button>
                  </div>
                  <div className="mt-auto flex items-end justify-between gap-2 pt-1">
                    <Quantidade valor={q} mudar={(n) => mudarQuantidade(chave, cor, n)} rotulo={`Quantidade de ${produto.nome}`} />
                    <span className="pb-1.5 text-[15px] font-semibold tracking-tight">{unitario > 0 ? emReais(unitario * q) : 'A combinar'}</span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="border-t border-texto/6 px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-suave">Total <span className="font-mono text-xs">({quantidade} {quantidade === 1 ? 'item' : 'itens'})</span></span>
          <span className="titulo text-[1.6rem] tabular-nums text-acento">{emReais(total)}</span>
        </div>
        <p className="mt-1 text-[13px] text-suave">
          {temACombinar ? 'Itens com valor a combinar não entram no total. ' : ''}Pagamento, prazo e entrega a gente combina pelo WhatsApp.
        </p>
        <BotaoLink
          href={linkWhatsapp(mensagemPedido(itens))}
          target="_blank"
          rel="noopener"
          icone={<IconeWhats />}
          className="mt-4 w-full"
          data-evento="pedido_lista"
          data-itens={String(quantidade)}
        >
          Enviar pedido no WhatsApp
        </BotaoLink>
        <button
          type="button"
          onClick={() => (confirmarLimpar ? (limpar(), setConfirmarLimpar(false)) : setConfirmarLimpar(true))}
          className={`mt-2 w-full rounded-full py-3 text-sm transition-colors ${confirmarLimpar ? 'font-medium text-acento' : 'text-suave hover:text-texto'}`}
        >
          {confirmarLimpar ? 'Toque de novo para limpar tudo' : 'Limpar lista'}
        </button>
      </div>
    </>
  );
}

export function ListaPedido() {
  const aberta = useUI((s) => s.listaAberta);
  const setAberta = useUI((s) => s.setListaAberta);
  const desktop = useDesktop();
  const fechar = () => setAberta(false);

  return (
    <Drawer.Root open={aberta} onOpenChange={setAberta} direction={desktop ? 'right' : 'bottom'}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50" />
        <Drawer.Content
          aria-describedby={undefined}
          className={`fixed z-50 flex flex-col overflow-hidden bg-superficie outline-none ${
            desktop
              ? 'inset-y-3 right-3 w-[440px] rounded-[2rem] shadow-(--shadow-flutua)'
              : 'inset-x-0 bottom-0 max-h-[92dvh] min-h-[50dvh] rounded-t-[2rem]'
          }`}
        >
          {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-texto/15" aria-hidden />}
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Drawer.Title className="titulo text-2xl">Sua lista</Drawer.Title>
            <BotaoIcone onClick={fechar} aria-label="Fechar">
              <X size={20} weight="light" />
            </BotaoIcone>
          </div>
          <Conteudo fechar={fechar} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
