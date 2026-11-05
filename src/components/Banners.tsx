import { CaretLeft, CaretRight } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSemMovimento } from '../hooks/useTela';
import { useAlgumPainelAberto } from '../store/ui';
import { Camadas } from './Botoes';

const foto = (codigo: string) => `${import.meta.env.BASE_URL}imagens/${codigo}.jpg`;
const CATEGORIA_NATAL = '#categoria/Cantinho%20da%20F%C3%A9';

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
    <svg viewBox="0 0 1200 90" preserveAspectRatio="xMidYMin slice" aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[70px] w-full md:h-[90px]">
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
    <a href={href} aria-label={rotulo} className={`relative block h-[430px] w-full shrink-0 snap-center overflow-hidden md:h-[420px] ${fundo}`} >
      <Camadas canto={canto} className={camadas} />
      <div className="relative mx-auto flex h-full max-w-[1240px] flex-col md:flex-row md:items-center">{children}</div>
    </a>
  );
}

function Texto({ titulo, texto, acao, botao, cor = '', topo = 'pt-7' }: { titulo: string; texto: string; acao: string; botao: string; cor?: string; topo?: string }) {
  return (
    <div className={`relative z-10 shrink-0 px-5 ${topo} md:w-1/2 md:px-6 md:pt-0 ${cor}`}>
      <h2 className="titulo max-w-[14ch] text-[32px] md:text-[38px] lg:text-[56px]">{titulo}</h2>
      <p className="mt-2 max-w-[34ch] text-[15px] leading-snug md:mt-3 md:text-[18px]">{texto}</p>
      <span className={`mt-3 inline-flex min-h-11 items-center rounded-full px-5 text-[15px] font-semibold md:mt-6 md:min-h-[52px] md:px-7 md:text-[16px] ${botao}`}>{acao}</span>
    </div>
  );
}

const IMAGEM = 'h-full w-full object-cover';

function BannerNatal({ prioridade }: { prioridade: boolean }) {
  return (
    <Moldura href={CATEGORIA_NATAL} rotulo="Natal: ver anjinhos iluminados e peças de fé" fundo="bg-[#17492f]" canto="baixo" camadas="text-acento opacity-40">
      <Varal />
      <Estrela className="right-[8%] top-[88px] size-5 md:right-[46%] md:top-[120px] md:size-7" cor="#c6f432" />
      <Estrela className="left-[6%] bottom-[34px] size-4 md:left-[44%] md:bottom-[70px] md:size-6" cor="#ffffff" />
      <Texto titulo="Um Natal com mais luz" texto="Anjinhos iluminados para decorar e presentear." acao="Ver peças de Natal" botao="bg-acento text-sobre-acento" cor="text-[#f6fbe6] [&_h2]:text-acento" topo="pt-[62px]" />
      <div className="relative mx-auto mt-3 min-h-0 w-[64%] flex-1 md:mt-[60px] md:h-[340px] md:w-[400px] md:flex-none md:self-end">
        <div className="h-full overflow-hidden rounded-t-[999px] ring-4 ring-acento">
          <img src={foto('DEC-05')} alt="" loading={prioridade ? 'eager' : 'lazy'} className={IMAGEM} />
        </div>
      </div>
    </Moldura>
  );
}

function BannerVarejo() {
  return (
    <Moldura href="#produtos" rotulo="Para você ou para presentear: ver todas as peças" fundo="bg-superficie-2" canto="cima" camadas="camadas-curta text-texto opacity-20">
      <div aria-hidden className="absolute -bottom-24 -right-16 size-[340px] rounded-full bg-acento md:bottom-auto md:right-[-40px] md:size-[560px]" />
      <Texto titulo="Para você ou para presentear" texto="Escolha uma ou várias e feche o pedido no WhatsApp." acao="Ver peças" botao="bg-acento text-sobre-acento" />
      <div className="relative mx-auto mt-4 min-h-0 w-[70%] flex-1 md:mt-0 md:h-[320px] md:w-[420px] md:flex-none">
        <img src={foto('KID-16')} alt="" loading="lazy" className={`${IMAGEM} rotate-[-3deg] rounded-3xl shadow-(--shadow-flutua)`} />
      </div>
    </Moldura>
  );
}

function BannerBrindes() {
  return (
    <Moldura href="#brindes" rotulo="Brindes para seus clientes: ver combos de 10, 20 e 30 unidades" fundo="bg-acento text-sobre-acento" canto="cima" camadas="camadas-curta opacity-30">
      <Texto titulo="Brindes para seus clientes" texto="Combos de 10, 20 e 30 unidades." acao="Ver combos" botao="bg-sobre-acento text-[#f8f9f4]" />
      <div className="relative mx-auto mt-4 flex min-h-0 w-full flex-1 items-center justify-center gap-3 px-5 md:mt-0 md:h-[320px] md:w-1/2 md:flex-none md:px-6">
        <div className="h-full max-h-[230px] w-[46%] rotate-[-3deg] overflow-hidden rounded-3xl shadow-(--shadow-flutua) md:max-h-none"><img src={foto('PER-03')} alt="" loading="lazy" className={IMAGEM} /></div>
        <div className="h-full max-h-[230px] w-[46%] rotate-[3deg] overflow-hidden rounded-3xl shadow-(--shadow-flutua) md:max-h-none"><img src={foto('PER-02')} alt="" loading="lazy" className={IMAGEM} /></div>
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
        <BannerVarejo />
        <BannerBrindes />
      </div>
      <button type="button" onClick={() => ir((atual + TOTAL - 1) % TOTAL)} aria-label="Banner anterior" className={`${seta} left-4`}><CaretLeft size={20} /></button>
      <button type="button" onClick={() => ir((atual + 1) % TOTAL)} aria-label="Próximo banner" className={`${seta} right-4`}><CaretRight size={20} /></button>
      <div className="absolute inset-x-0 bottom-2.5 z-20 flex justify-center">
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
