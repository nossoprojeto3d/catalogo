import { ArrowsClockwise, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useMemo, useState } from 'react';
import { normalizar, ordenarProdutos, type ArquivoCatalogo } from '../lib/catalogo';
import { emReais, paraNumero } from '../lib/preco';
import { CAMPO } from './Acesso';
import { Miniatura } from './Miniatura';

type Props = {
  arquivo: ArquivoCatalogo;
  urlFoto: (codigo: string) => string | null;
  abrir: (codigo: string | null) => void;
  atualizar: () => void;
  atualizando: boolean;
};

export function Lista({ arquivo, urlFoto, abrir, atualizar, atualizando }: Props) {
  const [termo, setTermo] = useState('');
  const [categoria, setCategoria] = useState('');
  const pecas = useMemo(() => {
    const partes = normalizar(termo).split(/\s+/).filter(Boolean);
    const todas = arquivo.categorias.filter((c) => !categoria || c.nome === categoria)
      .flatMap((c) => c.produtos.map((p) => ({ ...p, categoria: c.nome })));
    return ordenarProdutos(todas.filter((p) => {
      const alvo = normalizar(`${p.nome} ${p.codigo} ${p.categoria}`);
      return partes.every((parte) => alvo.includes(parte));
    }));
  }, [arquivo, termo, categoria]);

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-10 pt-3">
      <div className="relative">
        <MagnifyingGlass size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave" aria-hidden />
        <input type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar peça" aria-label="Buscar peça" className={`${CAMPO} rounded-full pl-11`} autoComplete="off" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <select value={categoria} onChange={(e) => setCategoria(e.target.value)} aria-label="Filtrar por categoria" className="h-11 min-w-0 flex-1 rounded-full bg-superficie px-3 text-[16px] ring-1 ring-texto/20">
          <option value="">Todas as categorias</option>
          {arquivo.categorias.map((c) => <option key={c.nome} value={c.nome}>{c.nome} ({c.produtos.length})</option>)}
        </select>
        <button type="button" onClick={() => abrir(null)} className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-acento px-4 text-[15px] font-semibold text-sobre-acento">
          <Plus size={18} weight="bold" /> Nova
        </button>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <p className="text-[14px] text-suave">{pecas.length} {pecas.length === 1 ? 'peça' : 'peças'}</p>
        <button type="button" onClick={atualizar} disabled={atualizando} className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] text-suave disabled:opacity-50">
          <ArrowsClockwise size={16} className={atualizando ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>
      {pecas.length === 0 ? (
        <p className="mt-8 text-center text-[15px] text-suave">Nenhuma peça encontrada. Tente outra palavra ou outra categoria.</p>
      ) : (
        <ul className="mt-1 space-y-2">
          {pecas.map((p) => (
            <li key={p.codigo}>
              <button type="button" onClick={() => abrir(p.codigo)} className="flex w-full items-center gap-3 rounded-2xl bg-superficie p-2 text-left ring-1 ring-linha active:bg-superficie-2">
                <Miniatura url={urlFoto(p.codigo)} className="size-16 shrink-0 rounded-xl" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{p.nome}</span>
                  <span className="mt-0.5 block truncate text-[13px] text-suave">{p.codigo} / {p.categoria}</span>
                  <span className="mt-0.5 flex items-center justify-between gap-2 pr-1 text-[14px]">
                    <span className="font-semibold tabular-nums">{paraNumero(p.preco) > 0 ? emReais(paraNumero(p.preco)) : 'Sem preço'}</span>
                    <span className={p.esgotado ? 'font-medium text-red-700' : 'text-acento-escuro'}>{p.esgotado ? 'Esgotada' : 'Ativa'}</span>
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
