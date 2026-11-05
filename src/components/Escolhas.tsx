import { Check, Minus, Plus } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import type { Produto } from '../lib/catalogo';
import { QUANTIDADES_COMBO } from '../lib/config';
import { corDaBolinha } from '../lib/cores';
import { medir } from '../lib/medicao';
import { temCombos, textoDoItem, totalDoItem } from '../lib/preco';

// Compacta: para a sacola. O visual tem 32px, e o toque vai além para cima e para baixo.
export function Quantidade({ valor, mudar, rotulo, compacta }: { valor: number; mudar: (n: number) => void; rotulo: string; compacta?: boolean }) {
  const botao = `grid place-items-center rounded-full active:bg-texto/8 disabled:opacity-30 ${compacta ? 'relative size-8 before:absolute before:-inset-y-1.5 before:inset-x-0' : 'size-11'}`;
  const icone = compacta ? 14 : 16;
  return (
    <div className="inline-flex items-center rounded-full bg-superficie ring-1 ring-texto/20" role="group" aria-label={rotulo}>
      <button type="button" onClick={() => mudar(valor - 1)} disabled={valor <= 1} aria-label="Diminuir" className={botao}>
        <Minus size={icone} />
      </button>
      <span className={`text-center font-semibold tabular-nums ${compacta ? 'w-7 text-[14px]' : 'w-9 text-[16px]'}`} aria-live="polite">{valor}</span>
      <button type="button" onClick={() => mudar(valor + 1)} disabled={valor >= 99} aria-label="Aumentar" className={botao}>
        <Plus size={icone} />
      </button>
    </div>
  );
}

// Cor e quantidade são escolhidas igual na tela do produto e na compra rápida.
export function useEscolha(produto: Produto, quantidadeInicial: number) {
  const [cor, setCor] = useState('');
  const [quantidade, setQuantidade] = useState(quantidadeInicial);
  const [pedirCor, setPedirCor] = useState(false);
  useEffect(() => {
    setCor(''); setQuantidade(quantidadeInicial); setPedirCor(false);
  }, [produto, quantidadeInicial]);
  const faltaCor = !produto.esgotado && produto.cores.length > 0 && !cor;
  const valor = totalDoItem(produto, quantidade);
  return {
    cor, setCor, quantidade, setQuantidade, pedirCor, setPedirCor, faltaCor,
    textoTotal: valor > 0 ? textoDoItem(produto, quantidade) : 'a combinar',
  };
}

type Escolha = ReturnType<typeof useEscolha>;

export function SeletorCor({ produto, escolha }: { produto: Produto; escolha: Escolha }) {
  const { cor, setCor, pedirCor, setPedirCor } = escolha;
  return (
    <fieldset id="escolha-cor">
      <legend className="text-[15px] font-semibold">
        Cor{' '}
        <span className={`font-normal ${pedirCor && !cor ? 'font-semibold text-red-700' : 'text-suave'}`}>
          {cor || (pedirCor ? 'Escolha uma cor para continuar' : 'Escolha uma')}
        </span>
      </legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {produto.cores.map((c) => {
          const ativa = c === cor;
          return (
            <button
              key={c}
              type="button"
              aria-pressed={ativa}
              onClick={() => { setCor(c); setPedirCor(false); medir('cor_escolhida', { produto: produto.nome, cor: c }); }}
              className={`inline-flex min-h-11 items-center gap-2 rounded-full bg-superficie py-1.5 pl-2 pr-4 text-[15px] ring-1 ${ativa ? 'font-semibold ring-2 ring-texto' : 'ring-texto/20'}`}
            >
              <span className="grid size-6 place-items-center rounded-full ring-1 ring-texto/20" style={{ background: corDaBolinha(c) }}>
                {ativa && <Check size={12} weight="bold" className={['branco', 'areia', 'creme', 'amarelo', 'bege', 'nude', 'prata', 'prateado'].some((n) => c.toLowerCase().startsWith(n)) ? 'text-sobre-acento' : 'text-white'} />}
              </span>
              {c}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SeletorQuantidade({ produto, escolha }: { produto: Produto; escolha: Escolha }) {
  const { quantidade, setQuantidade } = escolha;
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[15px] font-semibold">Quantidade</span>
        <Quantidade valor={quantidade} mudar={(n) => setQuantidade(Math.max(1, Math.min(99, n)))} rotulo="Quantidade" />
      </div>
      {temCombos(produto) ? (
        <>
          <p className="mt-4 text-[15px] font-semibold">Para brindes</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {QUANTIDADES_COMBO.map((n) => {
              const ativo = quantidade === n;
              const valor = totalDoItem(produto, n);
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => { setQuantidade(n); medir('combo_escolhido', { produto: produto.nome, quantidade: n }); }}
                  className={`rounded-2xl px-1 py-2.5 text-center ring-1 transition-colors ${ativo ? 'bg-acento text-sobre-acento ring-acento-forte' : 'bg-superficie ring-texto/20'}`}
                >
                  <span className="block text-[15px] font-semibold">{n} unidades</span>
                  <span className={`block text-[13px] tabular-nums ${ativo ? 'text-sobre-acento' : 'text-suave'}`}>{valor > 0 ? textoDoItem(produto, n) : 'a combinar'}</span>
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-[13px] leading-snug text-suave">
            Precisa de outra quantidade? Combine com a gente no WhatsApp.
          </p>
        </>
      ) : (
        <p className="mt-2 text-[13px] leading-snug text-suave">Para comprar em quantidade, combine com a gente no WhatsApp.</p>
      )}
    </div>
  );
}
