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
        <motion.div
          className="fixed inset-0 z-50 flex flex-col bg-fundo/85 backdrop-blur-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          role="dialog"
          aria-modal="true"
          aria-label="Buscar produtos"
        >
          <div className="mx-auto w-full max-w-2xl px-4 pt-[max(16px,env(safe-area-inset-top))]">
            <motion.div
              initial={{ y: -16, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center gap-2 rounded-full bg-superficie p-1.5 pl-5 shadow-(--shadow-flutua) ring-1 ring-texto/8"
            >
              <MagnifyingGlass size={20} weight="light" className="shrink-0 text-suave" />
              <label htmlFor="campo-busca" className="sr-only">Buscar por nome ou código</label>
              <input
                id="campo-busca"
                ref={campo}
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                placeholder="Nome ou código da peça"
                className="min-w-0 flex-1 bg-transparent py-2.5 text-[16px] outline-none placeholder:text-suave"
              />
              <BotaoIcone onClick={() => setAberta(false)} aria-label="Fechar busca">
                <X size={20} weight="light" />
              </BotaoIcone>
            </motion.div>
          </div>

          <div data-lenis-prevent className="mx-auto mt-4 w-full max-w-2xl min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-10">
            {adiado.trim() && resultados.length === 0 && (
              <p className="mt-10 text-center text-suave">Nada encontrado para “{adiado.trim()}”. Tente outro nome ou o código (ex.: KID-01).</p>
            )}
            {!adiado.trim() && (
              <div className="mt-6 flex flex-wrap gap-2">
                {categorias.map((c) => (
                  <button key={c.nome} type="button" onClick={() => setTermo(c.nome)} className="rounded-full bg-superficie px-4 py-2 text-sm ring-1 ring-texto/8 transition hover:ring-texto/25">
                    {c.nome}
                  </button>
                ))}
              </div>
            )}
            <ul className="space-y-1.5">
              {resultados.slice(0, 40).map((p, i) => (
                <motion.li
                  key={chaveProduto(p) + p.categoria}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: Math.min(i, 8) * 0.03, ease: [0.16, 1, 0.3, 1] }}
                >
                  <button
                    type="button"
                    onClick={() => { setAberta(false); abrir(p); }}
                    className="flex w-full items-center gap-3 rounded-[1.25rem] p-2 text-left transition hover:bg-superficie"
                  >
                    <div className="size-14 shrink-0 overflow-hidden rounded-2xl bg-superficie-2">
                      <FotoProduto decorativa produto={p} tamanhos="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{p.nome}</p>
                      <p className="truncate font-mono text-[11px] text-suave">{p.categoria}{p.codigo ? ` / ${p.codigo}` : ''}</p>
                    </div>
                    <span className="shrink-0 text-sm">{p.esgotado ? 'Esgotado' : textoPreco(precoUnitario(p))}</span>
                  </button>
                </motion.li>
              ))}
            </ul>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
