import { Plus } from '@phosphor-icons/react';
import { useState } from 'react';

// Texto do aviso "Antes de pedir, um papo rápido" da versão anterior, só
// com os travessões trocados por dois-pontos. Não mudar sem combinar: é a
// política de garantia da loja.
export const ITENS_ANTES_DE_PEDIR = [
  {
    titulo: 'Garantia',
    texto: 'A garantia é válida exclusivamente para defeitos de fabricação. Não cobre danos decorrentes de quedas, mau uso, alterações, exposição ao calor ou uso inadequado do produto.',
  },
  {
    titulo: 'Cuidados com o produto',
    texto: 'Evite exposição prolongada a altas temperaturas, calor intenso e sol direto, que podem deformar ou alterar o material.',
  },
  {
    titulo: 'Produtos articulados',
    texto: 'As articulações são projetadas para movimento. Manuseie com cuidado e não force além do movimento natural da peça, evitando danos.',
  },
  {
    titulo: 'Cores, imagens e acabamento',
    texto: 'As imagens são referências: cores, tonalidades e efeitos podem variar em relação à peça física, especialmente em filamentos multicoloridos (duo color/tricolor), cuja posição das cores e transições muda a cada impressão. Pequenas marcas de camada, variações de acabamento e medidas aproximadas fazem parte do processo de impressão 3D e não são consideradas defeito: cada peça é única. Consulte a disponibilidade de cores antes de fechar o pedido.',
  },
];

export function AntesDePedir() {
  const [aberto, setAberto] = useState<number | null>(0);
  return (
    <section id="antes-de-pedir" className="mx-auto grid max-w-[1400px] gap-10 px-4 pb-24 md:grid-cols-[0.8fr_1.2fr] md:gap-16 md:px-10 md:pb-36 lg:px-16">
      <div>
        <h2 className="titulo text-[clamp(2.2rem,8vw,5rem)]">Antes de pedir</h2>
        <p className="mt-4 max-w-[34ch] text-suave">Um papo rápido sobre garantia, cuidados e cores.</p>
      </div>
      <ul className="divide-y divide-texto/8 border-y border-texto/8">
        {ITENS_ANTES_DE_PEDIR.map((item, i) => {
          const estaAberto = aberto === i;
          return (
            <li key={item.titulo}>
              <button
                type="button"
                aria-expanded={estaAberto}
                onClick={() => setAberto(estaAberto ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-5 text-left text-[17px] font-medium"
              >
                {item.titulo}
                <span className={`grid size-9 shrink-0 place-items-center rounded-full ring-1 ring-texto/10 transition-transform duration-500 ease-(--ease-mola) ${estaAberto ? 'rotate-45 bg-texto text-fundo' : ''}`}>
                  <Plus size={16} />
                </span>
              </button>
              <div className={`grid transition-[grid-template-rows] duration-500 ease-(--ease-mola) ${estaAberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
                <div className="overflow-hidden">
                  <p className="max-w-[60ch] pb-6 leading-relaxed text-suave">{item.texto}</p>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
