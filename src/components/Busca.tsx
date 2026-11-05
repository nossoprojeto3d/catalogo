import { MagnifyingGlass, X } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { buscar, chaveProduto } from '../lib/catalogo';
import { medir } from '../lib/medicao';
import { precoUnitario, textoPreco } from '../lib/preco';
import { useUI } from '../store/ui';
import { BotaoIcone } from './Botoes';
import { FotoProduto } from './FotoProduto';

export function Busca() {
  const aberta = useUI((s) => s.buscaAberta);
  const setAberta = useUI((s) => s.setBuscaAberta);
  const categorias = useUI((s) => s.categorias);
  const abrir = useUI((s) => s.abrirProduto);
  const [termo, setTermo] = useState('');
  const adiado = useDeferredValue(termo);
  const campo = useRef<HTMLInputElement>(null);
  const resultados = useMemo(() => buscar(categorias, adiado), [categorias, adiado]);

  useEffect(() => {
    if (!aberta) return;
    const t = setTimeout(() => campo.current?.focus(), 60);
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setAberta(false);
    window.addEventListener('keydown', esc);
    return () => { clearTimeout(t); window.removeEventListener('keydown', esc); };
  }, [aberta, setAberta]);

  // Mede o termo buscado depois que a pessoa para de digitar.
  useEffect(() => {
    if (adiado.trim().length < 2) return;
    const t = setTimeout(() => medir('busca', { termo: adiado.trim(), resultados: resultados.length }), 1200);
    return () => clearTimeout(t);
  }, [adiado, resultados.length]);

  return (
    <AnimatePresence>
      {aberta && (
        <motion.div className="fixed inset-0 z-50 flex flex-col bg-fundo" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} role="dialog" aria-modal="true" aria-label="Buscar produtos">
          <div className="bg-barra px-4 pb-3 pt-[max(12px,env(safe-area-inset-top))]">
            <div className="mx-auto flex max-w-2xl items-center gap-2 rounded-full bg-superficie p-1 pl-4 ring-1 ring-texto/20">
              <MagnifyingGlass size={20} className="shrink-0 text-suave" />
              <label htmlFor="campo-busca" className="sr-only">Buscar peça</label>
              <input
                id="campo-busca"
                ref={campo}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="O que você procura?"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-suave"
              />
              <BotaoIcone onClick={() => setAberta(false)} aria-label="Fechar busca"><X size={22} /></BotaoIcone>
            </div>
          </div>

          <div className="mx-auto mt-3 w-full max-w-2xl min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
            {adiado.trim() && resultados.length === 0 && (
              <p className="mt-10 text-center text-suave">Nada encontrado para “{adiado.trim()}”. Tente outra palavra.</p>
            )}
            {!adiado.trim() && (
              <div className="mt-4 flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <button key={c.nome} type="button" onClick={() => setTermo(c.nome)} className="min-h-11 rounded-full bg-superficie px-4 text-[14px] font-medium ring-1 ring-linha">
                    {c.nome}
                  </button>
                ))}
              </div>
            )}
            <ul>
              {resultados.slice(0, 40).map((p) => (
                <li key={chaveProduto(p) + p.categoria}>
                  <button type="button" onClick={() => { setAberta(false); abrir(p); }} className="flex w-full items-center gap-3 rounded-2xl p-2 text-left active:bg-texto/5 hover:bg-texto/5">
                    <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-superficie-2"><FotoProduto decorativa produto={p} tamanhos="56px" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-medium">{p.nome}</p>
                      <p className="truncate text-[13px] text-suave">{p.categoria}</p>
                    </div>
                    <span className="shrink-0 text-[14px] font-semibold">{p.esgotado ? 'Esgotado' : textoPreco(precoUnitario(p))}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
