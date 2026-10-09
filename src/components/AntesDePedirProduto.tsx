import { ArrowLeft, HandGrabbing, Palette, ShieldCheck, Thermometer, type Icon } from '@phosphor-icons/react';
import { AnimatePresence, motion } from 'motion/react';
import { ITENS_ANTES_DE_PEDIR } from './AntesDePedir';

// Garantia e cuidados dentro da tela do produto. Em vez de um texto longo
// que empurra a tela, ficam 4 atalhos numa linha; tocar num deles troca o
// conteúdo da tela por um painel com abas, um assunto por vez.

const ICONES: Icon[] = [ShieldCheck, Thermometer, HandGrabbing, Palette];
const CURTOS = ['Garantia', 'Cuidados', 'Articulados', 'Cores'];

export function AtalhosAntesDePedir({ abrir }: { abrir: (indice: number) => void }) {
  return (
    <div className="mt-5">
      <p className="text-center font-mono text-[11px] text-suave">Antes de pedir</p>
      <ul className="mt-2.5 grid grid-cols-4 gap-1.5">
        {CURTOS.map((nome, i) => {
          const Icone = ICONES[i];
          return (
            <li key={nome}>
              <button
                type="button"
                onClick={() => abrir(i)}
                className="flex w-full flex-col items-center gap-1.5 rounded-2xl px-1 py-2.5 text-[11px] text-suave ring-1 ring-texto/8 transition-[color,box-shadow] hover:text-texto hover:ring-acento/50 active:scale-[0.97]"
              >
                <Icone size={20} weight="light" className="text-acento" />
                {nome}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function PainelAntesDePedir({
  indice,
  mudar,
  voltar,
}: {
  indice: number;
  mudar: (i: number) => void;
  voltar: () => void;
}) {
  const item = ITENS_ANTES_DE_PEDIR[indice];
  const Icone = ICONES[indice];
  return (
    <div className="flex h-full flex-col">
      <button
        type="button"
        onClick={voltar}
        className="-ml-1 inline-flex items-center gap-2 self-start rounded-full py-2 pl-1 pr-3 text-sm text-suave transition-colors hover:text-texto"
      >
        <ArrowLeft size={16} /> Voltar ao produto
      </button>
      <h2 className="titulo mt-3 text-[1.9rem] leading-[0.98] md:text-[2.4rem]">Antes de pedir</h2>

      {/* Abas: um assunto por vez */}
      <div role="tablist" aria-label="Assuntos" className="mt-6 grid grid-cols-4 gap-1 rounded-full bg-superficie-2 p-1 ring-1 ring-texto/6">
        {CURTOS.map((nome, i) => {
          const ativo = i === indice;
          return (
            <button
              key={nome}
              type="button"
              role="tab"
              aria-selected={ativo}
              onClick={() => mudar(i)}
              className={`relative rounded-full py-2 text-[12px] font-medium transition-colors ${ativo ? 'text-fundo' : 'text-suave hover:text-texto'}`}
            >
              {ativo && (
                <motion.span layoutId="aba-antes-de-pedir" className="absolute inset-0 rounded-full bg-acento" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />
              )}
              <span className="relative">{nome}</span>
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={indice}
          role="tabpanel"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6"
        >
          <div className="flex items-center gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-full bg-acento-suave text-acento">
              <Icone size={22} weight="light" />
            </span>
            <h3 className="text-lg font-semibold">{item.titulo}</h3>
          </div>
          <p className="mt-4 leading-relaxed text-suave">{item.texto}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
