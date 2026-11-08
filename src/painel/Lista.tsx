import { ArrowsClockwise, MagnifyingGlass, Plus } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef } from 'react';
import { normalizar, ordenarProdutos, type ArquivoCatalogo } from '../lib/catalogo';
import { emReais, paraNumero } from '../lib/preco';
import { CAMPO } from './Acesso';
import { Miniatura } from './Miniatura';

type Props = {
  nome: string;
  arquivo: ArquivoCatalogo;
  urlFoto: (codigo: string) => string | null;
  abrir: (codigo: string | null) => void;
  atualizar: () => void;
  atualizando: boolean;
  filtros: FiltrosLista;
  mudarFiltros: (f: FiltrosLista) => void;
};

type Situacao = '' | 'esgotada' | 'semFoto' | 'queridinho';

// Ficam no Painel: a lista some enquanto a ficha está aberta e volta como estava.
export type FiltrosLista = { termo: string; categoria: string; situacao: Situacao };
export const FILTROS_INICIAIS: FiltrosLista = { termo: '', categoria: '', situacao: '' };

const TONS = {
  ativa: 'bg-acento/25 text-acento-escuro',
  esgotada: 'bg-red-100 text-red-800',
  queridinho: 'bg-acento text-sobre-acento',
  semFoto: 'bg-amber-100 text-amber-900',
};

function Etiqueta({ tom, children }: { tom: keyof typeof TONS; children: string }) {
  return <span className={`rounded-full px-2 py-0.5 text-[12px] font-semibold leading-tight ${TONS[tom]}`}>{children}</span>;
}

function Resumo({ numero, rotulo, ativo, aoTocar }: { numero: number; rotulo: string; ativo: boolean; aoTocar: () => void }) {
  return (
    <button type="button" onClick={aoTocar} aria-pressed={ativo} className={`rounded-2xl p-3 text-left transition-colors md:p-4 ${ativo ? 'bg-acento text-sobre-acento ring-2 ring-texto' : 'bg-superficie ring-1 ring-linha'}`}>
      <span className="titulo block text-[28px] leading-none tabular-nums">{numero}</span>
      <span className={`mt-1.5 block text-[14px] ${ativo ? 'font-medium' : 'text-suave'}`}>{rotulo}</span>
    </button>
  );
}

export function Lista({ nome, arquivo, urlFoto, abrir, atualizar, atualizando, filtros, mudarFiltros }: Props) {
  const { termo, categoria, situacao } = filtros;
  const setTermo = (termo: string) => mudarFiltros({ ...filtros, termo });
  const setCategoria = (categoria: string) => mudarFiltros({ ...filtros, categoria });
  const setSituacao = (situacao: Situacao) => mudarFiltros({ ...filtros, situacao });

  // Ao voltar da ficha, a pílula escolhida aparece mesmo que a fila role de lado.
  const pilulas = useRef<HTMLUListElement>(null);
  useEffect(() => {
    pilulas.current?.querySelector('[aria-pressed="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, []);

  const todas = useMemo(() => arquivo.categorias.flatMap((c) => c.produtos.map((p) => ({ ...p, categoria: c.nome }))), [arquivo]);
  const contagem = useMemo(() => ({
    esgotada: todas.filter((p) => p.esgotado).length,
    semFoto: todas.filter((p) => !urlFoto(p.codigo)).length,
    queridinho: todas.filter((p) => p.maisVendido !== null).length,
  }), [todas, urlFoto]);

  const pecas = useMemo(() => {
    const partes = normalizar(termo).split(/\s+/).filter(Boolean);
    return ordenarProdutos(todas.filter((p) => {
      if (categoria && p.categoria !== categoria) return false;
      if (situacao === 'esgotada' && !p.esgotado) return false;
      if (situacao === 'semFoto' && urlFoto(p.codigo)) return false;
      if (situacao === 'queridinho' && p.maisVendido === null) return false;
      const alvo = normalizar(`${p.nome} ${p.codigo} ${p.categoria}`);
      return partes.every((parte) => alvo.includes(parte));
    }));
  }, [todas, termo, categoria, situacao, urlFoto]);

  const alternar = (s: Situacao) => setSituacao(situacao === s ? '' : s);
  const pilula = (ativa: boolean) => `shrink-0 rounded-full px-4 py-2.5 text-[14px] font-medium ring-1 ${ativa ? 'bg-acento text-sobre-acento ring-acento-forte' : 'bg-superficie ring-linha'}`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 pb-10 pt-4 md:px-6">
      <h1 className="titulo text-[24px] md:text-[30px]">Olá, {nome}</h1>

      <section aria-label="Resumo do catálogo" className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-4 md:gap-3">
        <Resumo numero={todas.length} rotulo="peças" ativo={!situacao} aoTocar={() => setSituacao('')} />
        <Resumo numero={contagem.esgotada} rotulo={contagem.esgotada === 1 ? 'esgotada' : 'esgotadas'} ativo={situacao === 'esgotada'} aoTocar={() => alternar('esgotada')} />
        <Resumo numero={contagem.semFoto} rotulo="sem foto" ativo={situacao === 'semFoto'} aoTocar={() => alternar('semFoto')} />
        <Resumo numero={contagem.queridinho} rotulo={contagem.queridinho === 1 ? 'queridinho' : 'queridinhos'} ativo={situacao === 'queridinho'} aoTocar={() => alternar('queridinho')} />
      </section>

      <div className="mt-3 flex flex-col gap-2 md:flex-row-reverse">
        <button type="button" onClick={() => abrir(null)} className="inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-acento px-6 text-[16px] font-semibold text-sobre-acento">
          <Plus size={18} weight="bold" /> Nova peça
        </button>
        <div className="relative min-w-0 flex-1">
          <MagnifyingGlass size={20} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-suave" aria-hidden />
          <input type="search" value={termo} onChange={(e) => setTermo(e.target.value)} placeholder="Buscar peça" aria-label="Buscar peça" className={`${CAMPO} rounded-full pl-11`} autoComplete="off" />
        </div>
      </div>

      <ul ref={pilulas} aria-label="Filtrar por categoria" className="sem-barra -mx-4 mt-3 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
        <li><button type="button" onClick={() => setCategoria('')} aria-pressed={!categoria} className={pilula(!categoria)}>Todas</button></li>
        {arquivo.categorias.map((c) => (
          <li key={c.nome}>
            <button type="button" onClick={() => setCategoria(categoria === c.nome ? '' : c.nome)} aria-pressed={categoria === c.nome} className={`whitespace-nowrap ${pilula(categoria === c.nome)}`}>
              {c.nome} <span className="tabular-nums opacity-60">{c.produtos.length}</span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-2 flex items-center justify-between">
        <p role="status" className="text-[14px] text-suave">{pecas.length} {pecas.length === 1 ? 'peça' : 'peças'}</p>
        <button type="button" onClick={atualizar} disabled={atualizando} className="-mr-2 inline-flex min-h-11 items-center gap-1.5 rounded-full px-2 text-[14px] text-suave disabled:opacity-50">
          <ArrowsClockwise size={16} className={atualizando ? 'animate-spin' : ''} /> Atualizar
        </button>
      </div>

      {pecas.length === 0 ? (
        <p className="mt-8 text-center text-[15px] text-suave">Nenhuma peça encontrada. Tente outra palavra ou tire um filtro.</p>
      ) : (
        <ul className="mt-1 grid grid-cols-1 gap-2 md:grid-cols-2 md:gap-3">
          {pecas.map((p) => {
            const temFoto = !!urlFoto(p.codigo);
            return (
              <li key={p.codigo}>
                <button type="button" onClick={() => abrir(p.codigo)} className="flex w-full items-center gap-3 rounded-2xl bg-superficie p-2 text-left ring-1 ring-linha active:bg-superficie-2 md:hover:ring-texto/30">
                  <Miniatura url={urlFoto(p.codigo)} className="size-[72px] shrink-0 rounded-xl" />
                  <span className="min-w-0 flex-1 pr-1">
                    <span className="flex items-baseline justify-between gap-2">
                      <span className="truncate text-[15px] font-medium">{p.nome}</span>
                      <span className="shrink-0 text-[14px] font-semibold tabular-nums">{paraNumero(p.preco) > 0 ? emReais(paraNumero(p.preco)) : 'Sem preço'}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[13px] text-suave">{p.codigo} / {p.categoria}</span>
                    <span className="mt-1.5 flex flex-wrap gap-1">
                      {p.esgotado ? <Etiqueta tom="esgotada">Esgotada</Etiqueta> : <Etiqueta tom="ativa">Ativa</Etiqueta>}
                      {p.maisVendido !== null && <Etiqueta tom="queridinho">Queridinho</Etiqueta>}
                      {!temFoto && <Etiqueta tom="semFoto">Sem foto</Etiqueta>}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
