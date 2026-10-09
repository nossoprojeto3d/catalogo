import type { ComponentProps, ReactNode } from 'react';
import { ArrowUpRight, WhatsappLogo } from '@phosphor-icons/react';

type Tom = 'acento' | 'texto' | 'fundo' | 'contorno';

const TONS: Record<Tom, string> = {
  acento: 'bg-acento text-fundo hover:bg-acento-forte shadow-(--shadow-acento)',
  texto: 'bg-texto text-fundo hover:bg-white',
  fundo: 'bg-fundo text-texto hover:bg-superficie',
  contorno: 'bg-superficie/70 text-texto ring-1 ring-texto/15 hover:ring-acento/60',
};

const ICONE_TOM: Record<Tom, string> = {
  acento: 'bg-fundo/12',
  texto: 'bg-fundo/10',
  fundo: 'bg-texto/10',
  contorno: 'bg-texto/8',
};

const base =
  'group inline-flex min-h-12 select-none items-center justify-between gap-3 rounded-full py-1.5 pl-5 pr-1.5 text-[15px] font-medium transition-[background-color,box-shadow,scale,color] duration-500 ease-(--ease-mola) active:scale-[0.97]';

// Botão em pílula com o ícone dentro de um círculo próprio, que se mexe
// no hover (botão-dentro-do-botão).
function Conteudo({ children, icone, tom }: { children: ReactNode; icone: ReactNode; tom: Tom }) {
  return (
    <>
      <span className="truncate">{children}</span>
      <span
        className={`grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-500 ease-(--ease-mola) group-hover:-translate-y-px group-hover:translate-x-0.5 group-hover:scale-105 ${ICONE_TOM[tom]}`}
      >
        {icone}
      </span>
    </>
  );
}

export function BotaoLink({
  tom = 'acento',
  icone = <ArrowUpRight size={18} weight="regular" />,
  children,
  className = '',
  ...props
}: ComponentProps<'a'> & { tom?: Tom; icone?: ReactNode }) {
  return (
    <a className={`${base} ${TONS[tom]} ${className}`} {...props}>
      <Conteudo icone={icone} tom={tom}>{children}</Conteudo>
    </a>
  );
}

export function Botao({
  tom = 'acento',
  icone = <ArrowUpRight size={18} weight="regular" />,
  children,
  className = '',
  ...props
}: ComponentProps<'button'> & { tom?: Tom; icone?: ReactNode }) {
  return (
    <button type="button" className={`${base} ${TONS[tom]} ${className}`} {...props}>
      <Conteudo icone={icone} tom={tom}>{children}</Conteudo>
    </button>
  );
}

export const IconeWhats = ({ size = 18 }: { size?: number }) => <WhatsappLogo size={size} weight="regular" />;

// Botão redondo só com ícone (fechar, buscar, sacola)
export function BotaoIcone({ className = '', children, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`relative grid size-11 place-items-center rounded-full transition-[background-color,scale] duration-300 ease-(--ease-mola) hover:bg-texto/8 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
