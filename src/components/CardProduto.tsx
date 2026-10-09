import { motion, useReducedMotion } from 'motion/react';
import type { Produto } from '../lib/catalogo';
import { emReais, paraNumero, percentualDesconto, precoUnitario, textoPreco } from '../lib/preco';
import { useUI } from '../store/ui';
import { FotoProduto } from './FotoProduto';

export function Preco({ produto, grande = false }: { produto: Produto; grande?: boolean }) {
  const unitario = precoUnitario(produto);
  const desconto = percentualDesconto(produto);
  return (
    <div className={`flex flex-wrap items-baseline gap-x-2 gap-y-0.5 ${grande ? 'text-2xl' : 'text-[15px]'}`}>
      <span className={`font-semibold tabular-nums tracking-tight ${desconto ? 'text-acento' : ''}`}>{textoPreco(unitario)}</span>
      {desconto > 0 && (
        <>
          <s className={`tabular-nums text-suave ${grande ? 'text-base' : 'text-xs'}`}>{emReais(paraNumero(produto.preco))}</s>
          {grande && <span className="font-mono text-sm font-medium text-acento">-{desconto}%</span>}
        </>
      )}
    </div>
  );
}

// Card do catálogo: moldura dupla (casca + núcleo). O card inteiro abre a
// tela do produto; a compra acontece lá.
export function CardProduto({ produto, indice }: { produto: Produto; indice: number }) {
  const abrir = useUI((s) => s.abrirProduto);
  const semMovimento = useReducedMotion();
  const desconto = percentualDesconto(produto);
  // Posição do cursor vira variável CSS: a borda acende onde o mouse está.
  const luz = (e: React.PointerEvent<HTMLElement>) => {
    if (e.pointerType !== 'mouse') return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };

  return (
    <motion.li
      initial={semMovimento ? false : { opacity: 0, y: 36, filter: 'blur(6px)' }}
      whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: (indice % 6) * 0.06 }}
      className="min-w-0"
    >
      <button
        type="button"
        onClick={() => abrir(produto)}
        onPointerMove={luz}
        className="holofote group block w-full rounded-3xl text-left"
        aria-label={`${produto.esgotado ? 'Esgotado. ' : ''}${produto.nome}, ${textoPreco(precoUnitario(produto))}. Ver detalhes`}
      >
        <div className="rounded-3xl bg-superficie p-1.5 ring-1 ring-texto/6 transition-[box-shadow,background-color] duration-500 ease-(--ease-mola) group-hover:bg-superficie-2 group-hover:shadow-(--shadow-suave)">
          <div className="relative aspect-square overflow-hidden rounded-[calc(1.5rem-0.375rem)] bg-superficie-2">
            <FotoProduto
              decorativa
              produto={produto}
              className="transition-transform duration-[1.1s] ease-(--ease-saida) group-hover:scale-[1.05]"
            />
            {desconto > 0 && !produto.esgotado && (
              <span className="absolute left-2 top-2 rounded-full bg-acento px-2 py-1 font-mono text-[11px] font-medium leading-none text-fundo">-{desconto}%</span>
            )}
          </div>
          <div className="px-2.5 pb-2.5 pt-3 md:px-3">
            <h3 className="line-clamp-2 min-h-[2.5em] text-[14px] font-medium leading-tight md:text-[15px]">{produto.nome}</h3>
            <div className="mt-2 flex items-end justify-between gap-2">
              {produto.esgotado ? (
                <span className="font-mono text-[12px] text-suave">Esgotado</span>
              ) : (
                <Preco produto={produto} />
              )}
              {produto.codigo && <span className="hidden shrink-0 font-mono text-[10px] text-suave sm:inline">{produto.codigo}</span>}
            </div>
          </div>
        </div>
      </button>
    </motion.li>
  );
}

export function CardEsqueleto() {
  return (
    <li className="rounded-3xl bg-superficie p-1.5 ring-1 ring-texto/6" aria-hidden>
      <div className="esqueleto aspect-square rounded-[calc(1.5rem-0.375rem)]" />
      <div className="space-y-2 px-2.5 pb-3 pt-3">
        <div className="esqueleto h-3.5 w-4/5 rounded-full" />
        <div className="esqueleto h-3.5 w-2/5 rounded-full" />
      </div>
    </li>
  );
}
