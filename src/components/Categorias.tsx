import { CaretDown, Check, SquaresFour, X } from '@phosphor-icons/react';
import { motion } from 'motion/react';
import { useMemo, useRef, useState } from 'react';
import { Drawer } from 'vaul';
import { queridinhos, type Produto } from '../lib/catalogo';
import { urlFoto } from '../lib/fotos';
import { medir } from '../lib/medicao';
import { useDesktop } from '../hooks/useTela';
import { rolarAte } from '../hooks/useRolagemSuave';
import { TODAS, useUI } from '../store/ui';
import { BotaoIcone } from './Botoes';

type Opcao = { nome: string; qtd: number; capa: string | null };

// "Tudo" + uma opção por categoria, com a quantidade e uma foto de capa
// (a primeira peça disponível que tenha foto).
function useOpcoes(): Opcao[] {
  const categorias = useUI((s) => s.categorias);
  return useMemo(() => {
    const capaDe = (produtos: Produto[]) => {
      const p = produtos.find((x) => !x.esgotado && urlFoto(x));
      return p ? urlFoto(p) : null;
    };
    const todos = categorias.flatMap((c) => c.produtos);
    const porCategoria = categorias.map((c) => ({ nome: c.nome, qtd: c.produtos.length, capa: capaDe(c.produtos) }));
    // A capa de "Tudo" não repete nenhuma capa de categoria; prefere um queridinho.
    const usadas = new Set(porCategoria.map((o) => o.capa));
    const livres = [...queridinhos(categorias), ...todos].filter((p) => !usadas.has(urlFoto(p)));
    return [{ nome: TODAS, qtd: todos.length, capa: capaDe(livres) ?? capaDe(todos) }, ...porCategoria];
  }, [categorias]);
}

function useEscolher() {
  const setAtiva = useUI((s) => s.setCategoriaAtiva);
  return (nome: string) => {
    setAtiva(nome);
    medir('categoria_aberta', { categoria: nome });
    rolarAte('#catalogo');
  };
}

const TOPO_FIXO = 'sticky top-[calc(max(12px,env(safe-area-inset-top))+64px)] z-30';

// Computador: pílulas numa linha, a ativa em limão.
function Pilulas({ opcoes }: { opcoes: Opcao[] }) {
  const ativa = useUI((s) => s.categoriaAtiva);
  const escolher = useEscolher();
  return (
    <div className={`${TOPO_FIXO} -mx-10 lg:-mx-16`}>
      <div className="sem-barra flex gap-1.5 overflow-x-auto px-10 py-3 lg:px-16" role="tablist" aria-label="Categorias">
        {opcoes.map(({ nome, qtd }) => {
          const selecionada = nome === ativa;
          return (
            <button
              key={nome}
              type="button"
              role="tab"
              aria-selected={selecionada}
              onClick={() => escolher(nome)}
              className={`relative shrink-0 rounded-full px-4 py-2.5 text-[14px] font-medium transition-colors duration-300 ${
                selecionada ? 'text-fundo' : 'bg-superficie/85 text-texto ring-1 ring-texto/10 backdrop-blur-md hover:ring-acento/50'
              }`}
            >
              {selecionada && (
                <motion.span
                  layoutId="pilula-ativa"
                  className="absolute inset-0 rounded-full bg-acento shadow-(--shadow-acento)"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                />
              )}
              <span className="relative">
                {nome}
                <span className={`ml-1.5 font-mono text-[11px] ${selecionada ? 'text-fundo/70' : 'text-suave'}`}>{qtd}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Celular: um botão fixo com a categoria atual; tocar abre uma gaveta com
// todas as categorias em grade, cada uma com foto, nome e quantidade.
function Seletor({ opcoes }: { opcoes: Opcao[] }) {
  const ativa = useUI((s) => s.categoriaAtiva);
  const escolher = useEscolher();
  const [aberto, setAberto] = useState(false);
  // Categoria tocada na gaveta: só é aplicada quando a gaveta termina de
  // fechar. Antes disso o iPhone ainda está com a página "presa" e a
  // rolagem até o catálogo ia parar no topo.
  const pendente = useRef<string | null>(null);
  const atual = opcoes.find((o) => o.nome === ativa) ?? opcoes[0];

  return (
    <Drawer.Root
      open={aberto}
      onOpenChange={setAberto}
      onAnimationEnd={(abriu) => {
        if (abriu || !pendente.current) return;
        const nome = pendente.current;
        pendente.current = null;
        requestAnimationFrame(() => escolher(nome));
      }}
    >
      <div className={`${TOPO_FIXO} -mx-4 px-4 py-3`}>
        <Drawer.Trigger asChild>
          <button
            type="button"
            className="flex h-14 w-full items-center gap-3 rounded-full bg-superficie/85 pl-2 pr-2 text-left ring-1 ring-texto/10 backdrop-blur-md transition-transform active:scale-[0.98]"
            aria-label={`Categoria: ${atual.nome}, ${atual.qtd} peças. Trocar categoria`}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-acento text-fundo">
              <SquaresFour size={19} weight="bold" />
            </span>
            {/* Etiqueta deixa claro que aqui se escolhe a categoria */}
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block font-mono text-[10px] uppercase tracking-[0.14em] text-suave">Categoria</span>
              <span className="block truncate font-medium">
                {atual.nome} <span className="font-mono text-xs font-normal text-suave">· {atual.qtd}</span>
              </span>
            </span>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-texto/8 px-3 py-2 text-[13px] font-medium">
              Trocar <CaretDown size={14} />
            </span>
          </button>
        </Drawer.Trigger>
      </div>

      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50" />
        <Drawer.Content
          aria-describedby={undefined}
          // Ao fechar, não devolve o foco ao botão: evita o contorno de foco depois do toque.
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed inset-x-0 bottom-0 z-50 flex max-h-[88dvh] flex-col overflow-hidden rounded-t-[2rem] bg-superficie outline-none"
        >
          <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-texto/15" aria-hidden />
          <div className="flex items-center justify-between px-5 pb-1 pt-3">
            <Drawer.Title className="titulo text-2xl">Categorias</Drawer.Title>
            <BotaoIcone onClick={() => setAberto(false)} aria-label="Fechar">
              <X size={20} weight="light" />
            </BotaoIcone>
          </div>
          <ul data-lenis-prevent className="grid min-h-0 flex-1 grid-cols-2 gap-2.5 overflow-y-auto overscroll-contain px-5 pb-[max(20px,env(safe-area-inset-bottom))] pt-3">
            {opcoes.map(({ nome, qtd, capa }) => {
              const selecionada = nome === ativa;
              return (
                <li key={nome}>
                  <button
                    type="button"
                    aria-pressed={selecionada}
                    onClick={() => {
                      pendente.current = nome;
                      setAberto(false);
                      // Reserva: se o fim da animação não for avisado, aplica mesmo assim.
                      setTimeout(() => {
                        if (pendente.current !== nome) return;
                        pendente.current = null;
                        escolher(nome);
                      }, 800);
                    }}
                    className={`relative block aspect-[4/3] w-full overflow-hidden rounded-2xl bg-superficie-2 text-left transition-transform active:scale-[0.97] ${
                      selecionada ? 'ring-2 ring-acento' : 'ring-1 ring-texto/8'
                    }`}
                  >
                    {capa && <img src={capa} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />}
                    <span className="absolute inset-0 bg-gradient-to-t from-fundo/95 via-fundo/45 to-transparent" aria-hidden />
                    {selecionada && (
                      <span className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-acento text-fundo">
                        <Check size={14} weight="bold" />
                      </span>
                    )}
                    <span className="absolute inset-x-3 bottom-2.5">
                      <span className="block truncate text-[15px] font-semibold leading-tight">{nome}</span>
                      <span className="block font-mono text-[11px] text-suave">{qtd} {qtd === 1 ? 'peça' : 'peças'}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export function SeletorCategorias() {
  const opcoes = useOpcoes();
  const desktop = useDesktop();
  if (opcoes.length <= 1) return null;
  return desktop ? <Pilulas opcoes={opcoes} /> : <Seletor opcoes={opcoes} />;
}
