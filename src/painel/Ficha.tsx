import { ArrowLeft, Copy, ImageSquare, Trash, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent } from 'react';
import { toast } from 'sonner';
import { Botao } from '../components/Botoes';
import type { ArquivoCatalogo, Peca } from '../lib/catalogo';
import { ABAS_BRINDES, QUANTIDADES_COMBO } from '../lib/config';
import { corDaBolinha } from '../lib/cores';
import { paraNumero } from '../lib/preco';
import { CAMPO, ROTULO } from './Acesso';
import { carregarImagem, prepararFoto } from './foto';
import { ErroPainel } from './github';
import { errosDaPeca, normalizarPreco, type Localizada } from './pecas';
import { promptDaFoto } from './promptFoto';
import { Miniatura } from './Miniatura';

const OUTRA_CATEGORIA = '__nova__';

export type Pedido = {
  original: Localizada | null;
  peca: Omit<Peca, 'codigo'>;
  categoria: string;
  foto?: string;
};

type Props = {
  inicial: Localizada | null;
  arquivo: ArquivoCatalogo;
  categoriaPadrao: string;
  urlFoto: string | null;
  salvar: (pedido: Pedido) => Promise<void>;
  apagar: (original: Localizada) => Promise<void>;
  voltar: () => void;
  recarregar: () => void;
  avisarAlterado: (alterado: boolean) => void;
};

// Valor que a planilha já usava para marcar queridinho sem posição definida.
const POSICAO_NOVO_QUERIDINHO = 999;

function Interruptor({ rotulo, ajuda, ligado, mudar }: { rotulo: string; ajuda?: string; ligado: boolean; mudar: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={ligado} onClick={() => mudar(!ligado)} className="flex min-h-11 w-full items-center justify-between gap-3 rounded-2xl bg-superficie px-4 py-3 text-left ring-1 ring-linha">
      <span>
        <span className="block text-[15px] font-semibold">{rotulo}</span>
        {ajuda && <span className="mt-0.5 block text-[13px] leading-snug text-suave">{ajuda}</span>}
      </span>
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${ligado ? 'bg-acento-escuro' : 'bg-superficie-2 ring-1 ring-texto/20'}`}>
        <span className={`absolute top-1 size-6 rounded-full bg-white shadow transition-[left] ${ligado ? 'left-7' : 'left-1'}`} />
      </span>
    </button>
  );
}

type FotoNova = { url: string; img: HTMLImageElement; x: number; y: number };

export function Ficha({ inicial, arquivo, categoriaPadrao, urlFoto, salvar, apagar, voltar, recarregar, avisarAlterado }: Props) {
  const p = inicial?.peca;
  const [nome, setNome] = useState(p?.nome ?? '');
  const [preco, setPreco] = useState(p?.preco ?? '');
  const [descricao, setDescricao] = useState(p?.descricao ?? '');
  const [categoria, setCategoria] = useState(inicial?.categoria ?? categoriaPadrao);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [cores, setCores] = useState<string[]>(p?.cores ?? []);
  const [corDigitada, setCorDigitada] = useState('');
  const [esgotada, setEsgotada] = useState(p?.esgotado ?? false);
  const [queridinho, setQueridinho] = useState(p?.maisVendido != null);
  const [combos, setCombos] = useState<Record<number, string>>(() => Object.fromEntries(Object.entries(p?.combos ?? {}).map(([q, v]) => [q, String(v).replace('.', ',')])));
  const [foto, setFoto] = useState<FotoNova | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [conflito, setConflito] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const [promptManual, setPromptManual] = useState(false);
  const [confirmarApagar, setConfirmarApagar] = useState(false);
  const urlAberta = useRef<string | null>(null);
  useEffect(() => () => { if (urlAberta.current) URL.revokeObjectURL(urlAberta.current); }, []);

  const categoriaFinal = categoria === OUTRA_CATEGORIA ? novaCategoria.trim() : categoria;
  const ehBrinde = ABAS_BRINDES.includes(categoriaFinal);

  const montar = (): Omit<Peca, 'codigo'> => {
    return {
      nome: nome.trim(),
      descricao: descricao.trim(),
      preco: normalizarPreco(preco),
      foto: p?.foto ?? '',
      cores,
      combos: ehBrinde
        ? Object.fromEntries(Object.entries(combos).map(([q, v]) => [q, paraNumero(normalizarPreco(v))]).filter(([, v]) => Number(v) > 0))
        : p?.combos ?? {},
      // Quem já era queridinho mantém a posição; quem entra agora vai para o fim da vitrine.
      maisVendido: queridinho ? p?.maisVendido ?? POSICAO_NOVO_QUERIDINHO : null,
      esgotado: esgotada,
    };
  };

  // Só conta como alterada se o resultado final mudou, e não por ter tocado num campo.
  const assinatura = (dados: Omit<Peca, 'codigo'>, cat: string) => JSON.stringify([dados.nome, dados.descricao, dados.preco, dados.cores, dados.combos, dados.maisVendido, dados.esgotado, cat]);
  const inicialAssinatura = useMemo(() => {
    if (!inicial) return JSON.stringify(['', '', '', [], {}, null, false, categoriaPadrao]);
    const { codigo: _c, ...resto } = inicial.peca;
    return assinatura({ ...resto, preco: normalizarPreco(resto.preco) }, inicial.categoria);
    // A foto inicial e a categoria padrão só valem na abertura da ficha.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const alterado = !!foto || assinatura(montar(), categoriaFinal) !== inicialAssinatura;
  useEffect(() => avisarAlterado(alterado), [alterado, avisarAlterado]);

  const escolherFoto = async (e: ChangeEvent<HTMLInputElement>) => {
    const arquivoFoto = e.target.files?.[0];
    e.target.value = '';
    if (!arquivoFoto) return;
    const url = URL.createObjectURL(arquivoFoto);
    try {
      const img = await carregarImagem(url);
      if (urlAberta.current) URL.revokeObjectURL(urlAberta.current);
      urlAberta.current = url;
      setFoto({ url, img, x: 50, y: 50 });
    } catch (falha) {
      URL.revokeObjectURL(url);
      setErros([(falha as Error).message]);
    }
  };

  const copiarPrompt = async () => {
    try {
      await navigator.clipboard.writeText(promptDaFoto(nome));
      setPromptManual(false);
      toast.success('Prompt copiado. Cole na IA junto com a foto da peça.');
    } catch {
      // Navegador sem acesso à área de transferência: mostra o texto para copiar à mão.
      setPromptManual(true);
    }
  };

  const adicionarCor = () => {
    const novas = corDigitada.split(',').map((c) => c.trim()).filter(Boolean);
    if (novas.length) setCores((atuais) => [...atuais, ...novas.filter((n) => !atuais.some((a) => a.toLowerCase() === n.toLowerCase()))]);
    setCorDigitada('');
  };

  const tratarFalha = (falha: unknown) => {
    if (falha instanceof ErroPainel && falha.tipo === 'conflito') setConflito(true);
    setErros([falha instanceof Error ? falha.message : 'Não foi possível salvar. Tente de novo.']);
  };

  const enviar = async () => {
    const problemas = errosDaPeca({ nome, preco, categoria: categoriaFinal, esgotado: esgotada });
    setErros(problemas);
    setConflito(false);
    if (problemas.length) return;
    setOcupado(true);
    try {
      const base64 = foto ? await prepararFoto(foto.img, foto.x, foto.y) : undefined;
      await salvar({ original: inicial, peca: montar(), categoria: categoriaFinal, foto: base64 });
    } catch (falha) {
      tratarFalha(falha);
      setOcupado(false);
    }
  };

  const tocarApagar = async () => {
    if (!inicial) return;
    if (!confirmarApagar) return setConfirmarApagar(true);
    setOcupado(true);
    try {
      await apagar(inicial);
    } catch (falha) {
      tratarFalha(falha);
      setOcupado(false);
    }
  };

  // A foto só precisa de ajuste no lado em que sobra imagem.
  const sobraLados = !!foto && foto.img.naturalWidth / foto.img.naturalHeight > 4 / 3 + 0.01;
  const sobraAltura = !!foto && foto.img.naturalWidth / foto.img.naturalHeight < 4 / 3 - 0.01;

  return (
    <main className="mx-auto w-full max-w-xl px-4 pb-28 pt-2">
      <button type="button" onClick={voltar} className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-full pl-2 pr-4 text-[16px] font-medium">
        <ArrowLeft size={22} /> Voltar
      </button>
      <h1 className="titulo mt-1 text-[26px]">{inicial ? inicial.peca.nome : 'Nova peça'}</h1>
      <p className="mt-1 text-[14px] text-suave">{inicial ? `Código ${inicial.peca.codigo}` : 'O código é criado ao salvar.'}</p>

      <section className="mt-4" aria-label="Foto da peça">
        <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-superficie-2">
          {foto
            ? <img src={foto.url} alt="Prévia da foto" className="size-full object-cover" style={{ objectPosition: `${foto.x}% ${foto.y}%` }} />
            : <Miniatura url={urlFoto} className="size-full" />}
          {/* O card mostra o quadrado central da foto. */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 aspect-square -translate-x-1/2 border-x-2 border-dashed border-white/80 mix-blend-difference" aria-hidden />
        </div>
        <p className="mt-1.5 text-[13px] leading-snug text-suave">O card mostra só o que fica entre as linhas. Use a foto já tratada, com a peça no centro.</p>
        {foto && (sobraLados || sobraAltura) && (
          <label className={`${ROTULO} mt-3`}>Ajustar o corte
            <input
              type="range"
              min={0}
              max={100}
              value={sobraLados ? foto.x : foto.y}
              onChange={(e) => setFoto({ ...foto, ...(sobraLados ? { x: Number(e.target.value) } : { y: Number(e.target.value) }) })}
              className="mt-2 h-8 w-full accent-[#4a6400]"
            />
          </label>
        )}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" onClick={copiarPrompt} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-superficie text-[15px] font-semibold ring-1 ring-texto/20">
            <Copy size={20} /> Copiar prompt
          </button>
          <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-superficie text-[15px] font-semibold ring-1 ring-texto/20">
            <ImageSquare size={20} /> Galeria
            <input type="file" accept="image/*" className="sr-only" onChange={escolherFoto} />
          </label>
        </div>
        {promptManual && (
          <label className={`${ROTULO} mt-3`}>Copie o texto abaixo
            <textarea readOnly value={promptDaFoto(nome)} onFocus={(e) => e.currentTarget.select()} className={`${CAMPO} mt-1.5 h-40 py-3 text-[14px] font-normal`} />
          </label>
        )}
      </section>

      <div className="mt-6 space-y-4">
        <label className={ROTULO}>Nome
          <input className={`${CAMPO} mt-1.5 font-normal`} value={nome} onChange={(e) => setNome(e.target.value)} />
        </label>
        <label className={ROTULO}>Preço
          <input className={`${CAMPO} mt-1.5 font-normal`} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} onBlur={() => setPreco(normalizarPreco(preco))} placeholder="0,00" />
        </label>
        <label className={ROTULO}>Categoria
          <select className={`${CAMPO} mt-1.5 font-normal`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
            {arquivo.categorias.map((c) => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
            <option value={OUTRA_CATEGORIA}>Nova categoria...</option>
          </select>
        </label>
        {categoria === OUTRA_CATEGORIA && (
          <label className={ROTULO}>Nome da nova categoria
            <input className={`${CAMPO} mt-1.5 font-normal`} value={novaCategoria} onChange={(e) => setNovaCategoria(e.target.value)} />
          </label>
        )}
        <label className={ROTULO}>Descrição
          <textarea className={`${CAMPO} mt-1.5 h-24 py-3 font-normal`} value={descricao} onChange={(e) => setDescricao(e.target.value)} placeholder="Opcional" />
        </label>

        <div>
          <label className={ROTULO} htmlFor="campo-cor">Cores</label>
          {cores.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {cores.map((c) => (
                <li key={c}>
                  <button type="button" onClick={() => setCores(cores.filter((x) => x !== c))} aria-label={`Tirar a cor ${c}`} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-superficie py-1.5 pl-2 pr-3 text-[15px] ring-1 ring-texto/20">
                    <span className="size-6 rounded-full ring-1 ring-texto/20" style={{ background: corDaBolinha(c) }} />
                    {c}
                    <X size={14} className="text-suave" />
                  </button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-2">
            <input
              id="campo-cor"
              className={`${CAMPO} min-w-0 flex-1`}
              value={corDigitada}
              onChange={(e) => setCorDigitada(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarCor(); } }}
              placeholder="Ex.: Azul"
            />
            <button type="button" onClick={adicionarCor} className="h-12 shrink-0 rounded-full bg-superficie px-4 text-[15px] font-semibold ring-1 ring-texto/20">Adicionar</button>
          </div>
          <p className="mt-1.5 text-[13px] text-suave">Com cores, o cliente precisa escolher uma antes de pedir.</p>
        </div>

        {ehBrinde && (
          <fieldset>
            <legend className={ROTULO}>Preço fechado dos combos</legend>
            <p className="mt-0.5 text-[13px] leading-snug text-suave">Opcional. Vazio usa o desconto automático de 5, 10 e 15%.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {QUANTIDADES_COMBO.map((q) => (
                <label key={q} className="block text-[14px] font-medium">{q} un.
                  <input className={`${CAMPO} mt-1 px-3 font-normal`} inputMode="decimal" aria-label={`Preço fechado de ${q} unidades`} value={combos[q] ?? ''} onChange={(e) => setCombos({ ...combos, [q]: e.target.value })} />
                </label>
              ))}
            </div>
          </fieldset>
        )}

        <Interruptor rotulo="Queridinho" ajuda={'Aparece em "Os queridinhos", no início do site.'} ligado={queridinho} mudar={setQueridinho} />
        <Interruptor rotulo="Esgotada" ligado={esgotada} mudar={setEsgotada} />

        {inicial && (
          <button type="button" onClick={tocarApagar} disabled={ocupado} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-red-700 disabled:opacity-50">
            <Trash size={18} /> {confirmarApagar ? 'Toque de novo para apagar de vez' : 'Apagar esta peça'}
          </button>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-fundo px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto max-w-xl">
          {erros.length > 0 && (
            <div role="alert" className="mb-2 text-[14px] font-medium leading-snug text-red-700">
              {erros.map((e) => <p key={e}>{e}</p>)}
              {conflito && <button type="button" onClick={recarregar} className="mt-1 min-h-11 font-semibold underline">Recarregar a lista</button>}
            </div>
          )}
          <Botao type="button" className="w-full" onClick={enviar} disabled={ocupado || !alterado}>
            {ocupado ? 'Salvando...' : alterado ? 'Salvar no site' : 'Nenhuma alteração'}
          </Botao>
        </div>
      </div>
    </main>
  );
}
