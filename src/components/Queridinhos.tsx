import { motion } from 'motion/react';
import { useMemo, useState } from 'react';
import { chaveProduto, queridinhos } from '../lib/catalogo';
import { medir } from '../lib/medicao';
import { precoUnitario, textoPreco } from '../lib/preco';
import { useUI } from '../store/ui';
import { FotoProduto } from './FotoProduto';

// "Os queridinhos". No computador: tiras lado a lado, a tira sob o mouse
// se abre e mostra nome e preço. No celular: fila com encaixe, cards em pé.
export function Queridinhos() {
  const categorias = useUI((s) => s.categorias);
  const abrir = useUI((s) => s.abrirProduto);
  const produtos = useMemo(() => queridinhos(categorias), [categorias]);
  const [aberta, setAberta] = useState(0);

  if (produtos.length === 0) return null;

  const ver = (i: number) => {
    medir('ver_mais_vendido', { produto: produtos[i].nome, posicao: i + 1 });
    abrir(produtos[i]);
  };

  return (
    <section id="queridinhos" className="py-16 md:py-32">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.6 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="mx-auto max-w-[1400px] px-4 md:px-10 lg:px-16"
      >
        <h2 className="titulo text-[clamp(2.2rem,8vw,5rem)]">
          Os <span className="text-acento">queridinhos</span>
        </h2>
        <p className="mt-4 max-w-[40ch] text-suave">As peças que mais saem por aqui.</p>
      </motion.div>

      {/* Computador: tiras que se abrem */}
      <ul className="mx-auto mt-14 hidden h-[560px] max-w-[1400px] gap-2 px-10 md:flex lg:px-16" onMouseLeave={() => setAberta(0)}>
        {produtos.map((p, i) => {
          const ativa = i === aberta;
          return (
            <li
              key={chaveProduto(p)}
              onMouseEnter={() => setAberta(i)}
              className={`relative min-w-0 overflow-hidden rounded-3xl bg-superficie-2 transition-[flex-grow] duration-700 ease-(--ease-mola) ${ativa ? 'grow-[6]' : 'grow'}`}
              style={{ flexBasis: 0 }}
            >
              <button type="button" onClick={() => ver(i)} onFocus={() => setAberta(i)} className="group block h-full w-full text-left" aria-label={`${p.nome}, ${textoPreco(precoUnitario(p))}`}>
                <FotoProduto
                  decorativa
                  produto={p}
                  prioridade={i < 2}
                  tamanhos="720px"
                  className={`transition-[scale,filter] duration-700 ease-(--ease-mola) ${ativa ? 'scale-100' : 'scale-110 brightness-[0.55] saturate-50'}`}
                />
                <div className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-fundo/90 via-fundo/40 to-transparent p-6 pt-24 transition-opacity duration-500 ${ativa ? 'opacity-100' : 'opacity-0'}`}>
                  <p className="font-mono text-xs text-acento">{String(i + 1).padStart(2, '0')}</p>
                  <h3 className="titulo mt-2 truncate text-3xl">{p.nome}</h3>
                  <p className="mt-2 text-suave">{textoPreco(precoUnitario(p))}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>

      {/* Celular: fila com encaixe */}
      <ul className="sem-barra mt-10 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-2 md:hidden">
        {produtos.map((p, i) => (
          <li key={chaveProduto(p)} className="w-[72vw] max-w-[320px] shrink-0 snap-start">
            <button type="button" onClick={() => ver(i)} className="block w-full text-left">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-superficie-2">
                <FotoProduto decorativa produto={p} prioridade={i < 2} tamanhos="72vw" />
                <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full bg-fundo/70 font-mono text-xs text-acento backdrop-blur" aria-hidden>
                  {String(i + 1).padStart(2, '0')}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 px-1 pt-3">
                <h3 className="truncate font-medium">{p.nome}</h3>
                <span className="shrink-0 text-sm tabular-nums text-suave">{textoPreco(precoUnitario(p))}</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
