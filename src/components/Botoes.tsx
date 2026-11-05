import type { ComponentProps, ReactNode } from 'react';
import { WhatsappLogo } from '@phosphor-icons/react';

type Tom = 'acento' | 'contorno';

const TONS: Record<Tom, string> = {
  acento: 'bg-acento text-sobre-acento hover:bg-acento-forte',
  contorno: 'bg-superficie text-texto ring-1 ring-texto/20 hover:ring-texto/50',
};

const base =
  'inline-flex min-h-[52px] select-none items-center justify-center gap-2 rounded-full px-5 text-center text-[16px] font-semibold transition-[background-color,box-shadow,scale] duration-200 active:scale-[0.98]';

export function BotaoLink({ tom = 'acento', icone, children, className = '', ...props }: ComponentProps<'a'> & { tom?: Tom; icone?: ReactNode }) {
  return (
    <a className={`${base} ${TONS[tom]} ${className}`} {...props}>
      {icone}
      <span>{children}</span>
    </a>
  );
}

export function Botao({ tom = 'acento', icone, children, className = '', ...props }: ComponentProps<'button'> & { tom?: Tom; icone?: ReactNode }) {
  return (
    <button type="button" className={`${base} ${TONS[tom]} ${className}`} {...props}>
      {icone}
      <span>{children}</span>
    </button>
  );
}

// Assinatura da marca: linhas de camadas de impressão em um canto. O elemento
// pai precisa ser relative e ter overflow-hidden.
export const Camadas = ({ canto = 'baixo', className = '' }: { canto?: 'baixo' | 'cima'; className?: string }) => (
  <span aria-hidden className={`camadas camadas-${canto} ${className}`} />
);

export const IconeWhats = ({ size = 20 }: { size?: number }) => <WhatsappLogo size={size} weight="regular" />;

// Botão redondo só com ícone (fechar, compartilhar)
export function BotaoIcone({ className = '', children, ...props }: ComponentProps<'button'>) {
  return (
    <button
      type="button"
      className={`relative grid size-11 place-items-center rounded-full transition-[background-color,scale] duration-200 hover:bg-texto/8 active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// A logo em SVG é recortada como máscara: assume a cor do texto ao redor,
// então funciona em qualquer cor de barra.
export function Logo({ className = '' }: { className?: string }) {
  const url = `url(${import.meta.env.BASE_URL}logo.svg)`;
  return (
    <span
      aria-hidden
      className={`inline-block aspect-[1500/1764] bg-current ${className}`}
      style={{ maskImage: url, WebkitMaskImage: url, maskSize: 'contain', WebkitMaskSize: 'contain', maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskPosition: 'center' }}
    />
  );
}
