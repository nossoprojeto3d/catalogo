import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useReducedMotion } from 'motion/react';
import { useEffect, useRef } from 'react';
import { MENSAGEM_GERAL, linkWhatsapp } from '../lib/whatsapp';
import { lenisAtual } from '../hooks/useRolagemSuave';
import { BotaoLink, IconeWhats } from './Botoes';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const FOTO = (codigo: string) => `${import.meta.env.BASE_URL}imagens/${codigo}.jpg`;

const PASSOS = [
  {
    titulo: 'Escolha a peça',
    texto: 'Navegue pelas categorias ou busque pelo nome. Cada peça é impressa sob encomenda.',
    fundo: 'bg-superficie text-texto',
    foto: FOTO('DEC-04'),
  },
  {
    titulo: 'Monte sua lista',
    texto: 'Defina cor e quantidade e junte várias peças num pedido só, com o total já somado.',
    fundo: 'bg-superficie-2 text-texto',
    foto: FOTO('ORG-06'),
  },
  {
    titulo: 'Finalize no WhatsApp',
    texto: 'A mensagem sai pronta, com tudo que você escolheu. Prazo, pagamento e entrega a gente combina por lá.',
    fundo: 'bg-acento text-fundo',
    foto: null,
  },
];

// Pilha de cards: cada card gruda no topo e o anterior recua (escala e
// brilho) enquanto o próximo chega. Conta o caminho da compra, que termina
// no WhatsApp.
// Carregado com lazy() em App.tsx: o GSAP baixa num pedaço separado,
// depois do resto, sem atrasar a primeira tela.
export default function ComoPedir() {
  const raiz = useRef<HTMLElement>(null);
  const semMovimento = useReducedMotion();

  // Mantém o ScrollTrigger em dia com a rolagem suave do Lenis.
  useEffect(() => {
    const l = lenisAtual();
    if (!l) return;
    const atualizar = () => ScrollTrigger.update();
    return l.on('scroll', atualizar);
  }, []);

  useGSAP(
    () => {
      if (semMovimento) return;
      const cards = gsap.utils.toArray<HTMLElement>('.pilha-card');
      cards.forEach((card, i) => {
        const proximo = cards[i + 1];
        if (!proximo) return;
        gsap.to(card.firstElementChild, {
          scale: 0.92,
          filter: 'brightness(0.92)',
          ease: 'none',
          scrollTrigger: { trigger: proximo, start: 'top bottom', end: 'top top+=120', scrub: true },
        });
      });
    },
    { scope: raiz, dependencies: [semMovimento] },
  );

  return (
    <section ref={raiz} id="como-pedir" className="mx-auto max-w-[1400px] px-4 pb-24 md:px-10 md:pb-36 lg:px-16">
      <h2 className="titulo max-w-[14ch] text-[clamp(2.2rem,8vw,5rem)]">
        Do catálogo à sua mão
      </h2>
      <div className="mt-10 md:mt-14">
        {PASSOS.map((p, i) => (
          <div key={p.titulo} className="pilha-card sticky pb-4" style={{ top: `calc(96px + ${i * 14}px)` }}>
            <div className={`origin-top overflow-hidden rounded-[2rem] ring-1 ring-texto/8 ${p.fundo} will-change-transform`}>
              <div className="grid min-h-[min(62svh,520px)] grid-cols-1 md:grid-cols-2">
                <div className="flex flex-col justify-between gap-8 p-7 md:p-12">
                  <p className={`font-mono text-xs ${p.foto ? 'text-acento' : 'text-fundo'}`}>{i + 1} de {PASSOS.length}</p>
                  <div>
                    <h3 className="titulo text-[clamp(1.9rem,5.5vw,3.4rem)]">{p.titulo}</h3>
                    <p className={`mt-4 max-w-[38ch] text-[17px] leading-relaxed ${p.foto ? 'text-suave' : 'text-fundo/80'}`}>{p.texto}</p>
                    {!p.foto && (
                      <BotaoLink
                        tom="fundo"
                        href={linkWhatsapp(MENSAGEM_GERAL)}
                        target="_blank"
                        rel="noopener"
                        icone={<IconeWhats />}
                        className="mt-8"
                        data-evento="duvida_whatsapp"
                        data-link="como_pedir"
                      >
                        Tirar uma dúvida
                      </BotaoLink>
                    )}
                  </div>
                </div>
                {p.foto ? (
                  <div className="relative min-h-56 md:min-h-0">
                    <img src={p.foto} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="pontos relative hidden place-items-center md:grid" aria-hidden>
                    <IconeWhats size={180} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
