import { ShoppingBag, Trash, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { Drawer } from 'vaul';
import { temCombos, textoDoItem, textoDoTotal, totalDoItem } from '../lib/preco';
import { linkWhatsapp, mensagemPedido } from '../lib/whatsapp';
import { useDesktop } from '../hooks/useTela';
import { irPara } from '../hooks/useRota';
import { resolverItens, totalDeItens, useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { Botao, BotaoIcone, BotaoLink, IconeWhats } from './Botoes';
import { FotoProduto } from './FotoProduto';
import { Quantidade, QuantidadeDeBrinde } from './Escolhas';

function Conteudo({ fechar }: { fechar: () => void }) {
  const categorias = useUI((s) => s.categorias);
  const salvos = useLista((s) => s.itens);
  const { mudarQuantidade, remover, limpar } = useLista.getState();
  const itens = useMemo(() => resolverItens(salvos, categorias), [salvos, categorias]);
  const quantidade = totalDeItens(salvos);
  const temACombinar = itens.some((i) => totalDoItem(i.produto, i.quantidade) <= 0);
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
        <div className="grid size-20 place-items-center rounded-full bg-superficie-2 text-suave">
          <ShoppingBag size={34} />
        </div>
        <h3 className="titulo mt-5 text-[22px]">Sua sacola está vazia</h3>
        <p className="mt-2 max-w-[32ch] text-suave">Toque na sacola de uma peça para começar o pedido.</p>
        <Botao className="mt-6" onClick={() => { fechar(); irPara({ tipo: 'produtos' }); }}>
          Ver as peças
        </Botao>
      </div>
    );
  }

  return (
    <>
      <ul className="min-h-0 flex-1 space-y-2.5 overflow-y-auto overscroll-contain px-5 py-2">
        <AnimatePresence initial={false}>
          {itens.map((item) => {
            const { produto, quantidade: q, cor, versao } = item;
            const valor = totalDoItem(produto, q);
            return (
              <motion.li
                key={`${item.chave}|${cor}|${versao}`}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                className="flex gap-3 rounded-2xl bg-superficie p-2 ring-1 ring-linha"
              >
                <div className="size-20 shrink-0 overflow-hidden rounded-xl bg-superficie-2">
                  <FotoProduto decorativa produto={produto} tamanhos="80px" />
                </div>
                <div className="flex min-w-0 flex-1 flex-col py-0.5 pr-1">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-[15px] font-medium">{produto.nome}</p>
                      <p className="mt-0.5 truncate text-xs text-suave">
                        {[versao, cor, produto.codigo].filter(Boolean).join(' / ')}
                      </p>
                    </div>
                    <button type="button" onClick={() => remover(item)} aria-label={`Remover ${produto.nome}`} className="-mr-1 -mt-1.5 grid size-9 shrink-0 place-items-center rounded-full text-suave transition hover:bg-texto/5 hover:text-texto">
                      <Trash size={18} />
                    </button>
                  </div>
                  <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                    {temCombos(produto)
                      ? <QuantidadeDeBrinde valor={q} mudar={(n) => mudarQuantidade(item, n)} rotulo={`Quantidade de ${produto.nome}`} />
                      : <Quantidade compacta valor={q} mudar={(n) => mudarQuantidade(item, n)} rotulo={`Quantidade de ${produto.nome}`} />}
                    <span className="text-[15px] font-semibold tracking-tight">{valor > 0 ? textoDoItem(produto, q) : 'A combinar'}</span>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </ul>

      <div className="border-t border-linha bg-superficie px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-4">
        <div className="flex items-baseline justify-between">
          <span className="text-suave">Total ({quantidade} {quantidade === 1 ? 'item' : 'itens'})</span>
          <span className="titulo text-[1.6rem] tabular-nums">{textoDoTotal(itens)}</span>
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
          className={`mt-2 w-full rounded-full py-3 text-sm transition-colors ${confirmarLimpar ? 'font-semibold text-red-700' : 'text-suave hover:text-texto'}`}
        >
          {confirmarLimpar ? 'Toque de novo para limpar tudo' : 'Limpar sacola'}
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
          className={`fixed z-50 flex flex-col overflow-hidden bg-fundo outline-none ${
            desktop
              ? 'inset-y-0 right-0 w-[440px]'
              : 'inset-x-0 bottom-0 max-h-[92dvh] min-h-[50dvh] rounded-t-3xl'
          }`}
        >
          {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-texto/15" aria-hidden />}
          <div className="flex items-center justify-between px-5 pb-2 pt-4">
            <Drawer.Title className="titulo text-[22px]">Sua sacola</Drawer.Title>
            <BotaoIcone onClick={fechar} aria-label="Fechar">
              <X size={22} />
            </BotaoIcone>
          </div>
          <Conteudo fechar={fechar} />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
