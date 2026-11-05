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
  const [aberto, setAberto] = useState<number | null>(null);
  return (
    <section id="antes-de-pedir" className="mx-auto mt-12 max-w-[1240px] px-4 md:mt-16 md:px-6">
      <div>
        <h2 className="titulo text-[24px] md:text-[32px]">Antes de pedir</h2>
        <p className="mt-1 text-[15px] text-suave">Garantia, cuidados e cores.</p>
      </div>
      <ul className="mt-3 divide-y divide-linha border-y border-linha">
        {ITENS_ANTES_DE_PEDIR.map((item, i) => {
          const estaAberto = aberto === i;
          return (
            <li key={item.titulo}>
              <button
                type="button"
                aria-expanded={estaAberto}
                onClick={() => setAberto(estaAberto ? null : i)}
                className="flex w-full items-center justify-between gap-4 py-3.5 text-left text-[16px] font-medium"
              >
                {item.titulo}
                <span className={`grid size-9 shrink-0 place-items-center rounded-full transition-transform duration-300 ${estaAberto ? 'rotate-45' : ''}`}>
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
