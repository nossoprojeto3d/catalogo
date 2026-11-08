import { CaretDown, Check, Minus, Plus } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { naVersao, temVersoes, type Produto } from '../lib/catalogo';
import { QUANTIDADE_MAXIMA, QUANTIDADES_COMBO } from '../lib/config';
import { corDaBolinha } from '../lib/cores';
import { medir } from '../lib/medicao';
import { descontoDaQuantidade, emReaisInteiro, precoUnitario, temCombos, textoDoItem, totalDoItem } from '../lib/preco';
import { linkWhatsapp } from '../lib/whatsapp';

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
      <button type="button" onClick={() => mudar(valor + 1)} disabled={valor >= QUANTIDADE_MAXIMA} aria-label="Aumentar" className={botao}>
        <Plus size={icone} />
      </button>
    </div>
  );
}

// Brinde na sacola: só as quantidades que têm preço. Um valor antigo fora da lista
// continua aparecendo, para o seletor não mudar a quantidade sozinho.
// Letra de 16px para o iPhone não dar zoom ao abrir o seletor.
export function QuantidadeDeBrinde({ valor, mudar, rotulo }: { valor: number; mudar: (n: number) => void; rotulo: string }) {
  const opcoes = [1, ...QUANTIDADES_COMBO];
  if (!opcoes.includes(valor)) opcoes.push(valor);
  return (
    <span className="relative inline-flex">
      <select
        value={valor}
        onChange={(e) => mudar(Number(e.target.value))}
        aria-label={rotulo}
        className="h-8 appearance-none rounded-full bg-superficie pl-3 pr-8 text-[16px] font-semibold tabular-nums ring-1 ring-texto/20"
      >
        {opcoes.sort((a, b) => a - b).map((n) => <option key={n} value={n}>{n} {n === 1 ? 'unidade' : 'unidades'}</option>)}
      </select>
      <CaretDown size={14} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" aria-hidden />
    </span>
  );
}

// Versão, cor e quantidade são escolhidas igual na tela do produto e na compra rápida.
export function useEscolha(produto: Produto, quantidadeSugerida: number) {
  // Peça de brindes sempre começa no menor combo, venha de onde vier.
  const quantidadeInicial = temCombos(produto) ? QUANTIDADES_COMBO[0] : quantidadeSugerida;
  // Uma versão só já vem escolhida.
  const versaoInicial = produto.versoes?.length === 1 ? produto.versoes[0].nome : '';
  const [versao, setVersao] = useState(versaoInicial);
  const [cor, setCor] = useState('');
  const [quantidade, setQuantidade] = useState(quantidadeInicial);
  const [pedirCor, setPedirCor] = useState(false);
  useEffect(() => {
    setVersao(versaoInicial); setCor(''); setQuantidade(quantidadeInicial); setPedirCor(false);
  }, [produto, quantidadeInicial, versaoInicial]);
  const faltaVersao = !produto.esgotado && temVersoes(produto) && !versao;
  const faltaCor = faltaVersao || (!produto.esgotado && produto.cores.length > 0 && !cor);
  // Produto com o preço da versão escolhida (sem versão, o próprio produto).
  const escolhido = naVersao(produto, versao);
  const valor = totalDoItem(escolhido, quantidade);
  return {
    versao, setVersao, faltaVersao, escolhido,
    cor, setCor, quantidade, setQuantidade, pedirCor, setPedirCor, faltaCor,
    // Para onde rolar quando falta escolher algo.
    idDaFalta: faltaVersao ? 'escolha-versao' : 'escolha-cor',
    textoTotal: valor > 0 ? textoDoItem(escolhido, quantidade) : 'a combinar',
  };
}

type Escolha = ReturnType<typeof useEscolha>;

const PILULA = 'inline-flex min-h-11 items-center gap-2 rounded-full bg-superficie py-1.5 text-[15px] ring-1';

export function SeletorVersao({ produto, escolha }: { produto: Produto; escolha: Escolha }) {
  const { versao, setVersao, pedirCor, faltaVersao } = escolha;
  return (
    <fieldset id="escolha-versao">
      <legend className="text-[15px] font-semibold">
        Versão{' '}
        <span className={`font-normal ${pedirCor && faltaVersao ? 'font-semibold text-red-700' : 'text-suave'}`}>
          {versao || (pedirCor ? 'Escolha uma versão para continuar' : 'Escolha uma')}
        </span>
      </legend>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {produto.versoes!.map((v) => {
          const ativa = v.nome === versao;
          return (
            <button
              key={v.nome}
              type="button"
              aria-pressed={ativa}
              onClick={() => { setVersao(v.nome); medir('versao_escolhida', { produto: produto.nome, versao: v.nome }); }}
              className={`${PILULA} px-4 ${ativa ? 'font-semibold ring-2 ring-texto' : 'ring-texto/20'}`}
            >
              {v.nome}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function SeletorCor({ produto, escolha }: { produto: Produto; escolha: Escolha }) {
  const { cor, setCor, pedirCor, setPedirCor } = escolha;
  return (
    <fieldset id="escolha-cor">
      <legend className="text-[15px] font-semibold">
        Cor{' '}
        <span className={`font-normal ${pedirCor && !cor && !escolha.faltaVersao ? 'font-semibold text-red-700' : 'text-suave'}`}>
          {cor || (pedirCor && !escolha.faltaVersao ? 'Escolha uma cor para continuar' : 'Escolha uma')}
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
              className={`${PILULA} pl-2 pr-4 ${ativa ? 'font-semibold ring-2 ring-texto' : 'ring-texto/20'}`}
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
      {temCombos(produto) ? (
        <>
          <p className="text-[15px] font-semibold">Quanto você precisa?</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {[1, ...QUANTIDADES_COMBO].map((n) => {
              const ativo = quantidade === n;
              const valor = totalDoItem(produto, n);
              const desconto = valor > 0 ? descontoDaQuantidade(produto, n) : 0;
              return (
                <button
                  key={n}
                  type="button"
                  aria-pressed={ativo}
                  onClick={() => { setQuantidade(n); medir('combo_escolhido', { produto: produto.nome, quantidade: n }); }}
                  className={`rounded-2xl px-1 py-2.5 text-center ring-1 transition-colors ${ativo ? 'bg-acento text-sobre-acento ring-acento-forte' : 'bg-superficie ring-texto/20'}`}
                >
                  <span className="block text-[15px] font-semibold">{n} {n === 1 ? 'unidade' : 'unidades'}</span>
                  {desconto > 0 ? (
                <>
                  <span className={`block text-[13px] tabular-nums ${ativo ? 'text-sobre-acento' : 'text-suave'}`}>de <s>{emReaisInteiro(Math.floor(precoUnitario(produto) * n))}</s></span>
                  <span className={`block text-[13px] font-semibold tabular-nums ${ativo ? 'text-sobre-acento' : 'text-acento-escuro'}`}>por {textoDoItem(produto, n)}</span>
                </>
              ) : (
                <span className={`block text-[13px] tabular-nums ${ativo ? 'text-sobre-acento' : 'text-suave'}`}>{valor > 0 ? textoDoItem(produto, n) : 'a combinar'}</span>
              )}
                </button>
              );
            })}
            <a
              href={linkWhatsapp(`Oi! Quero um orçamento de ${produto.nome} em outra quantidade.`)}
              target="_blank"
              rel="noopener"
              data-evento="duvida_whatsapp"
              data-link="outra_quantidade"
              className="col-span-2 flex min-h-11 items-center justify-center gap-1.5 rounded-2xl bg-superficie px-3 py-2 text-center text-[15px] font-semibold ring-1 ring-texto/20"
            >
              Outra quantidade <span className="font-normal text-suave">a combinar</span>
            </a>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between gap-3">
            <span className="text-[15px] font-semibold">Quantidade</span>
            <Quantidade valor={quantidade} mudar={(n) => setQuantidade(Math.max(1, Math.min(QUANTIDADE_MAXIMA, n)))} rotulo="Quantidade" />
          </div>
          <p className="mt-2 text-[13px] leading-snug text-suave">Para comprar em quantidade, combine com a gente no WhatsApp.</p>
        </>
      )}
    </div>
  );
}
