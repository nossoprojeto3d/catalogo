import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSemMovimento } from '../hooks/useTela';
import { useAlgumPainelAberto } from '../store/ui';
import { Camadas } from './Botoes';

const foto = (codigo: string) => `${import.meta.env.BASE_URL}imagens/${codigo}.jpg`;
const CATEGORIA_FE = '#categoria/Cantinho%20da%20F%C3%A9';
// Enquanto a aba Natal não existe na planilha, os anjinhos estão no Cantinho da Fé.
const CATEGORIA_NATAL = CATEGORIA_FE;
const CATEGORIA_KIDS = '#categoria/Kids';

// Estrela de quatro pontas, desenhada aqui para não depender de imagem.
function Estrela({ className, cor }: { className: string; cor: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={`absolute ${className}`} fill={cor}>
      <path d="M12 0c1 7 4 10 12 12-8 2-11 5-12 12-1-7-4-10-12-12 8-2 11-5 12-12Z" />
    </svg>
  );
}

// Varal de bolinhas de Natal no topo do banner.
function Varal() {
  const bolas = [
    [40, 34, '#e5322d'], [150, 56, '#c6f432'], [270, 44, '#ffffff'], [400, 62, '#e5322d'],
    [530, 44, '#c6f432'], [660, 58, '#ffffff'], [790, 40, '#e5322d'], [920, 56, '#c6f432'],
    [1050, 42, '#ffffff'], [1160, 54, '#e5322d'],
  ] as const;
  return (
    <svg viewBox="0 0 1200 90" preserveAspectRatio="xMidYMin slice" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[44px] w-full md:h-[90px]">
      <path d="M0 8C200 60 400 60 600 24S1000-4 1200 40" fill="none" stroke="#9cc7a8" strokeWidth="2" />
      {bolas.map(([x, y, cor]) => (
        <g key={x}>
          <rect x={x - 3} y={y - 11} width="6" height="5" rx="1" fill="#d7e5da" />
          <circle cx={x} cy={y} r="8" fill={cor} />
        </g>
      ))}
    </svg>
  );
}

function Moldura({ href, rotulo, fundo, canto, camadas, children }: { href: string; rotulo: string; fundo: string; canto: 'baixo' | 'cima'; camadas: string; children: ReactNode }) {
  return (
    <a href={href} aria-label={rotulo} className={`relative block h-[232px] w-full shrink-0 snap-center overflow-hidden md:h-[420px] ${fundo}`} >
      <Camadas canto={canto} className={camadas} />
      <div className="relative mx-auto flex h-full max-w-[1240px] items-center">{children}</div>
    </a>
  );
}

function Texto({ titulo, texto, acao, botao, cor = '', topo = '' }: { titulo: string; texto: string; acao: string; botao: string; cor?: string; topo?: string }) {
  return (
    <div className={`relative z-10 w-[56%] shrink-0 px-4 pb-6 ${topo} md:w-1/2 md:px-6 md:pb-0 md:pt-0 lg:pl-20 ${cor}`}>
      <h2 className="titulo text-[22px] md:max-w-[14ch] md:text-[38px] lg:text-[56px]">{titulo}</h2>
      <p className="hidden max-w-[34ch] leading-snug md:mt-3 md:block md:text-[18px]">{texto}</p>
      <span className={`mt-2.5 inline-flex min-h-10 items-center whitespace-nowrap rounded-full px-4 text-[14px] font-semibold md:mt-6 md:min-h-[52px] md:px-7 md:text-[16px] ${botao}`}>{acao}</span>
    </div>
  );
}

const IMAGEM = 'h-full w-full object-cover';

function BannerNatal({ prioridade }: { prioridade: boolean }) {
  return (
    <Moldura href={CATEGORIA_NATAL} rotulo="Natal: ver anjinhos iluminados e peças de fé" fundo="bg-[#17492f]" canto="baixo" camadas="hidden text-acento opacity-40 md:block">
      <Varal />
      <Estrela className="right-[43%] top-[52px] size-4 md:right-[46%] md:top-[120px] md:size-7" cor="#c6f432" />
      <Estrela className="hidden md:left-[44%] md:block md:bottom-[70px] md:size-6" cor="#ffffff" />
      <Texto titulo="Um Natal com mais luz" texto="Anjinhos iluminados para decorar e presentear." acao="Ver peças de Natal" botao="bg-acento text-sobre-acento" cor="text-[#f6fbe6] [&_h2]:text-acento" topo="pt-5" />
      <div className="relative ml-auto mr-4 h-[176px] w-[36%] self-end md:mx-auto md:mt-[60px] md:h-[340px] md:w-[400px]">
        <div className="h-full overflow-hidden rounded-t-[999px] ring-4 ring-acento">
          <img src={foto('DEC-05')} alt="" loading={prioridade ? 'eager' : 'lazy'} className={IMAGEM} />
        </div>
      </div>
    </Moldura>
  );
}

function BannerFe() {
  return (
    <Moldura href={CATEGORIA_FE} rotulo="Itens religiosos: ver as peças do Cantinho da Fé" fundo="bg-superficie-2" canto="cima" camadas="camadas-curta text-texto opacity-20">
      <div aria-hidden className="absolute -bottom-20 -right-14 size-[220px] rounded-full bg-acento md:bottom-auto md:right-[-40px] md:size-[560px]" />
      <Texto titulo="Para o seu cantinho de fé" texto="Peças religiosas para decorar e presentear." acao="Ver itens religiosos" botao="bg-acento text-sobre-acento" />
      <div className="relative mb-3 ml-auto mr-4 h-[150px] w-[36%] md:mx-auto md:mb-0 md:h-[320px] md:w-[420px]">
        <img src={foto('MIN-01')} alt="" loading="lazy" className={`${IMAGEM} rotate-[-3deg] rounded-3xl shadow-(--shadow-flutua)`} />
      </div>
    </Moldura>
  );
}

function BannerCriancada() {
  return (
    <Moldura href={CATEGORIA_KIDS} rotulo="Para a criançada: ver as peças de Kids" fundo="bg-acento text-sobre-acento" canto="cima" camadas="camadas-curta opacity-30">
      <Texto titulo="Para a criançada" texto="Peças para brincar e soltar a imaginação." acao="Ver peças" botao="bg-sobre-acento text-[#f8f9f4]" />
      <div className="relative mb-3 ml-auto mr-4 flex h-[150px] w-[36%] items-center justify-center gap-3 md:mx-auto md:mb-0 md:h-[320px] md:w-1/2 md:px-6">
        <div className="h-full w-full rotate-[-3deg] overflow-hidden rounded-3xl shadow-(--shadow-flutua) md:w-[46%]"><img src={foto('KID-16')} alt="" loading="lazy" className={IMAGEM} /></div>
        <div className="hidden h-full w-[46%] rotate-[3deg] overflow-hidden rounded-3xl shadow-(--shadow-flutua) md:block"><img src={foto('KID-19')} alt="" loading="lazy" className={IMAGEM} /></div>
      </div>
    </Moldura>
  );
}

const TOTAL = 3;
const INTERVALO_MS = 6000;

// Carrossel simples: arrasta com o dedo (scroll-snap) e troca sozinho, parando
// quando a pessoa interage, abre um painel ou pede menos movimento.
export function Banners() {
  const trilho = useRef<HTMLDivElement>(null);
  const [atual, setAtual] = useState(0);
  const [pausado, setPausado] = useState(false);
  const semMovimento = useSemMovimento();
  const painelAberto = useAlgumPainelAberto();

  const ir = useCallback((i: number) => {
    const el = trilho.current;
    if (el) el.scrollTo({ left: el.clientWidth * i, behavior: semMovimento ? 'auto' : 'smooth' });
  }, [semMovimento]);

  useEffect(() => {
    if (pausado || semMovimento || painelAberto) return;
    const t = setInterval(() => {
      const el = trilho.current;
      if (el) ir((Math.round(el.scrollLeft / el.clientWidth) + 1) % TOTAL);
    }, INTERVALO_MS);
    return () => clearInterval(t);
  }, [pausado, semMovimento, painelAberto, ir]);

  const seta = 'absolute top-1/2 z-20 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-superficie/90 text-texto shadow-(--shadow-suave) lg:grid';
  return (
    <section
      aria-label="Destaques"
      aria-roledescription="carrossel"
      className="relative"
      onPointerDown={() => setPausado(true)}
      onFocusCapture={() => setPausado(true)}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div ref={trilho} onScroll={(e) => setAtual(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))} className="sem-barra flex snap-x snap-mandatory overflow-x-auto">
        <BannerNatal prioridade />
        <BannerFe />
        <BannerCriancada />
      </div>
      <button type="button" onClick={() => ir((atual + TOTAL - 1) % TOTAL)} aria-label="Banner anterior" className={`${seta} left-4`}><CaretLeft size={20} /></button>
      <button type="button" onClick={() => ir((atual + 1) % TOTAL)} aria-label="Próximo banner" className={`${seta} right-4`}><CaretRight size={20} /></button>
      <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-start pl-4 md:justify-center md:pl-0">
        <div className="flex rounded-full bg-superficie/90 px-1">
          {Array.from({ length: TOTAL }, (_, i) => (
            <button key={i} type="button" onClick={() => ir(i)} aria-label={`Ver banner ${i + 1} de ${TOTAL}`} aria-current={i === atual} className="grid size-7 place-items-center">
              <span className={`size-2 rounded-full transition-colors ${i === atual ? 'bg-texto' : 'bg-texto/25'}`} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
