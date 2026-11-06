import { ShoppingBag } from '@phosphor-icons/react';
import { useRef } from 'react';
import { toast } from 'sonner';
import type { Produto } from '../lib/catalogo';
import { corDaBolinha } from '../lib/cores';
import { voarParaSacola } from '../lib/efeitos';
import { precoUnitario, textoPreco } from '../lib/preco';
import { useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { FotoProduto } from './FotoProduto';

export function Preco({ produto, grande = false }: { produto: Produto; grande?: boolean }) {
  return (
    <div className={grande ? 'text-[26px]' : 'text-[16px]'}>
      <span className="font-bold tabular-nums tracking-tight">{textoPreco(precoUnitario(produto))}</span>
    </div>
  );
}

// Sem cor para escolher, a sacola do card adiciona na hora. Com cor (ou na
// área de brindes, onde a quantidade importa), abre a compra rápida.
export function CardProduto({ produto, brindes = false, prioridade = false }: { produto: Produto; brindes?: boolean; prioridade?: boolean }) {
  const abrir = useUI((s) => s.abrirProduto);
  const setCompra = useUI((s) => s.setCompraRapida);
  const setLista = useUI((s) => s.setListaAberta);
  const adicionar = useLista((s) => s.adicionar);
  const foto = useRef<HTMLDivElement>(null);

  const naSacola = () => {
    if (brindes || produto.cores.length > 0) return setCompra(produto);
    voarParaSacola(foto.current).then(() => {
      adicionar(produto, 1, '');
      toast('Colocado na sacola', { description: produto.nome, action: { label: 'Ver sacola', onClick: () => setLista(true) } });
    });
  };

  return (
    // Foto e nome numa linha da grade, preço na seguinte: os preços ficam na mesma
    // altura, e a folga só aparece na linha em que algum nome quebra.
    <li className="relative row-span-2 grid min-w-0 grid-rows-subgrid gap-y-0">
      <button type="button" onClick={() => abrir(produto)} className="group row-span-2 grid w-full grid-rows-subgrid gap-y-0 text-left" aria-label={`${produto.esgotado ? 'Esgotado. ' : ''}${produto.nome}, ${textoPreco(precoUnitario(produto))}`}>
        <div className="min-w-0">
          <div ref={foto} className="relative aspect-square overflow-hidden rounded-2xl bg-superficie-2">
            <FotoProduto decorativa prioridade={prioridade} produto={produto} className="transition-transform duration-500 ease-(--ease-saida) group-hover:scale-[1.03]" />
            {produto.esgotado && (
              <span className="absolute left-2 top-2 rounded-full bg-superficie px-2.5 py-1 text-[12px] font-semibold leading-none text-texto">Esgotado</span>
            )}
          </div>
          <h3 className="mt-2.5 line-clamp-2 pr-1 text-[15px] font-medium leading-snug">{produto.nome}</h3>
        </div>
        <div className="min-w-0 pt-1">
          {produto.esgotado ? <span className="text-[14px] text-suave">Avise-me quando voltar</span> : <Preco produto={produto} />}
          {brindes && !produto.esgotado && <p className="mt-0.5 text-[13px] text-suave">a unidade, em combos de 10, 30 ou 50</p>}
          {produto.cores.length > 0 && !produto.esgotado && (
            <div className="mt-1.5 flex items-center gap-1.5" aria-label={`${produto.cores.length} cores`}>
              {produto.cores.slice(0, 4).map((c) => (
                <span key={c} className="size-3.5 rounded-full ring-1 ring-texto/20" style={{ background: corDaBolinha(c) }} />
              ))}
              {produto.cores.length > 4 && <span className="text-[12px] text-suave">+{produto.cores.length - 4}</span>}
            </div>
          )}
        </div>
      </button>
      {!produto.esgotado && (
        <button
          type="button"
          onClick={naSacola}
          aria-label={`Colocar ${produto.nome} na sacola`}
          className="absolute right-2 top-2 grid size-11 place-items-center rounded-full bg-acento text-sobre-acento shadow-(--shadow-suave) transition-[background-color,scale] hover:bg-acento-forte active:scale-90"
        >
          <ShoppingBag size={22} />
        </button>
      )}
    </li>
  );
}

export function CardEsqueleto() {
  return (
    <li aria-hidden>
      <div className="esqueleto aspect-square rounded-2xl" />
      <div className="esqueleto mt-3 h-3.5 w-4/5 rounded-full" />
      <div className="esqueleto mt-2 h-3.5 w-2/5 rounded-full" />
    </li>
  );
}

export const CLASSES_GRADE = 'grid grid-cols-2 gap-x-3 gap-y-6 md:grid-cols-3 md:gap-x-5 md:gap-y-9 lg:grid-cols-4';
