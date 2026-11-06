import { ArrowLeft, Copy, DownloadSimple, ImageSquare, ShoppingBag, Trash, X } from '@phosphor-icons/react';
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import { toast } from 'sonner';
import { Botao } from '../components/Botoes';
import type { ArquivoCatalogo, Peca } from '../lib/catalogo';
import { ABAS_BRINDES, QUANTIDADES_COMBO } from '../lib/config';
import { corDaBolinha } from '../lib/cores';
import { paraNumero, textoPreco } from '../lib/preco';
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
    <button type="button" role="switch" aria-checked={ligado} onClick={() => mudar(!ligado)} className="flex min-h-11 w-full items-center justify-between gap-3 py-3 text-left first:pt-0 last:pb-0">
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

function Bloco({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl bg-superficie p-4 ring-1 ring-linha">
      <h2 className="mb-3 text-[16px] font-semibold">{titulo}</h2>
      {children}
    </section>
  );
}

// Mesmo tamanho e mesmo recorte do card em 2 colunas do celular.
function PreviaDoCard({ nome, preco, esgotada, cores, ehBrinde, foto, urlFoto }: { nome: string; preco: string; esgotada: boolean; cores: string[]; ehBrinde: boolean; foto: FotoNova | null; urlFoto: string | null }) {
  return (
    <div className="w-[calc(50%-6px)] min-w-0">
      <div className="relative aspect-square overflow-hidden rounded-2xl bg-superficie-2">
        {foto ? (
          <span className="absolute inset-y-0 left-1/2 block aspect-[4/3] h-full -translate-x-1/2">
            <img src={foto.url} alt="" className={`size-full object-cover ${esgotada ? 'grayscale-[0.7]' : ''}`} style={{ objectPosition: `${foto.x}% ${foto.y}%` }} />
          </span>
        ) : (
          <Miniatura url={urlFoto} className={`size-full ${esgotada ? 'grayscale-[0.7]' : ''}`} />
        )}
        {esgotada
          ? <span className="absolute left-2 top-2 rounded-full bg-superficie px-2.5 py-1 text-[12px] font-semibold leading-none">Esgotado</span>
          : <span className="absolute right-2 top-2 grid size-9 place-items-center rounded-full bg-acento text-sobre-acento" aria-hidden><ShoppingBag size={18} /></span>}
      </div>
      <p className={`mt-2 line-clamp-2 text-[15px] font-medium leading-snug ${nome.trim() ? '' : 'text-suave'}`}>{nome.trim() || 'Nome da peça'}</p>
      {esgotada
        ? <p className="mt-1 text-[14px] text-suave">Avise-me quando voltar</p>
        : <p className="mt-1 text-[16px] font-bold tabular-nums tracking-tight">{textoPreco(paraNumero(normalizarPreco(preco)))}</p>}
      {ehBrinde && !esgotada && <p className="mt-0.5 text-[13px] text-suave">a unidade, em combos de 10, 30 ou 50</p>}
      {cores.length > 0 && !esgotada && (
        <div className="mt-1.5 flex items-center gap-1.5">
          {cores.slice(0, 4).map((c) => <span key={c} className="size-3.5 rounded-full ring-1 ring-texto/20" style={{ background: corDaBolinha(c) }} />)}
          {cores.length > 4 && <span className="text-[12px] text-suave">+{cores.length - 4}</span>}
        </div>
      )}
    </div>
  );
}

type FotoNova = { url: string; img: HTMLImageElement; x: number; y: number };

export function Ficha({ inicial, arquivo, urlFoto, salvar, apagar, voltar, recarregar, avisarAlterado }: Props) {
  const p = inicial?.peca;
  const [nome, setNome] = useState(p?.nome ?? '');
  const [preco, setPreco] = useState(p?.preco ?? '');
  const [descricao, setDescricao] = useState(p?.descricao ?? '');
  const [categoria, setCategoria] = useState(inicial?.categoria ?? '');
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
  const [baixando, setBaixando] = useState(false);
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
    if (!inicial) return JSON.stringify(['', '', '', [], {}, null, false, '']);
    const { codigo: _c, ...resto } = inicial.peca;
    return assinatura({ ...resto, preco: normalizarPreco(resto.preco) }, inicial.categoria);
    // A foto inicial só vale na abertura da ficha.
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

  // Entrega o arquivo que está no site, sem recomprimir, com o nome do código da peça.
  const baixarFoto = async () => {
    if (!urlFoto || !inicial) return;
    setBaixando(true);
    try {
      const resposta = await fetch(urlFoto);
      if (!resposta.ok) throw new Error(String(resposta.status));
      const endereco = URL.createObjectURL(await resposta.blob());
      const link = document.createElement('a');
      link.href = endereco;
      link.download = `${inicial.peca.codigo}.jpg`;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(endereco), 30_000);
    } catch {
      toast.error('Não foi possível baixar. Se a foto acabou de ser salva, espere 1 a 2 minutos e tente de novo.');
    } finally {
      setBaixando(false);
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
    <main className="mx-auto w-full max-w-5xl px-4 pb-28 pt-2 md:px-6">
      <button type="button" onClick={voltar} className="-ml-2 inline-flex h-11 items-center gap-1.5 rounded-full pl-2 pr-4 text-[16px] font-medium">
        <ArrowLeft size={22} /> Voltar
      </button>
      <h1 className="titulo mt-1 text-[26px] md:text-[30px]">{inicial ? inicial.peca.nome : 'Nova peça'}</h1>
      <p className="mt-1 text-[14px] text-suave">{inicial ? `Código ${inicial.peca.codigo}` : 'O código é criado ao salvar.'}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-2 md:items-start md:gap-4">
        <div className="space-y-3 md:space-y-4">
          <Bloco titulo="Foto">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-superficie-2">
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
              {inicial && urlFoto && (
                <button type="button" onClick={baixarFoto} disabled={baixando} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-superficie text-[15px] font-semibold ring-1 ring-texto/20 disabled:opacity-50">
                  <DownloadSimple size={20} /> {baixando ? 'Baixando...' : 'Baixar foto'}
                </button>
              )}
              <button type="button" onClick={copiarPrompt} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-superficie text-[15px] font-semibold ring-1 ring-texto/20">
                <Copy size={20} /> Copiar prompt
              </button>
              <label className={`inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-full bg-superficie text-[15px] font-semibold ring-1 ring-texto/20 ${inicial && urlFoto ? 'col-span-2' : ''}`}>
                <ImageSquare size={20} /> {inicial && urlFoto ? 'Trocar pela galeria' : 'Galeria'}
                <input type="file" accept="image/*" className="sr-only" onChange={escolherFoto} />
              </label>
            </div>
            {promptManual && (
              <label className={`${ROTULO} mt-3`}>Copie o texto abaixo
                <textarea readOnly value={promptDaFoto(nome)} onFocus={(e) => e.currentTarget.select()} className={`${CAMPO} mt-1.5 h-40 py-3 text-[14px] font-normal`} />
              </label>
            )}
          </Bloco>

          <Bloco titulo="Como aparece no site">
            <PreviaDoCard nome={nome} preco={preco} esgotada={esgotada} cores={cores} ehBrinde={ehBrinde} foto={foto} urlFoto={urlFoto} />
          </Bloco>
        </div>

        <div className="space-y-3 md:space-y-4">
          <Bloco titulo="Dados">
            <div className="space-y-4">
              <label className={ROTULO}>Nome
                <input className={`${CAMPO} mt-1.5 font-normal`} value={nome} onChange={(e) => setNome(e.target.value)} />
              </label>
              <label className={ROTULO}>Preço
                <input className={`${CAMPO} mt-1.5 font-normal`} inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} onBlur={() => setPreco(normalizarPreco(preco))} placeholder="0,00" />
              </label>
              <label className={ROTULO}>Categoria
                <select className={`${CAMPO} mt-1.5 font-normal`} value={categoria} onChange={(e) => setCategoria(e.target.value)}>
                  {/* Peça nova começa sem categoria, para ninguém salvar na primeira da lista sem querer. */}
                  <option value="" disabled hidden>Selecione uma categoria</option>
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
            </div>
          </Bloco>

          <Bloco titulo="Cores">
            {cores.length > 0 && (
              <ul className="mb-2 flex flex-wrap gap-2">
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
            <div className="flex gap-2">
              <input
                id="campo-cor"
                aria-label="Nova cor"
                className={`${CAMPO} min-w-0 flex-1`}
                value={corDigitada}
                onChange={(e) => setCorDigitada(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); adicionarCor(); } }}
                placeholder="Ex.: Azul"
              />
              <button type="button" onClick={adicionarCor} className="h-12 shrink-0 rounded-full bg-superficie px-4 text-[15px] font-semibold ring-1 ring-texto/20">Adicionar</button>
            </div>
            <p className="mt-1.5 text-[13px] text-suave">Com cores, o cliente precisa escolher uma antes de pedir.</p>
          </Bloco>

          {ehBrinde && (
            <Bloco titulo="Preço fechado dos combos">
              <p className="text-[13px] leading-snug text-suave">Opcional. Vazio usa o desconto automático de 5, 10 e 15%.</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {QUANTIDADES_COMBO.map((q) => (
                  <label key={q} className="block text-[14px] font-medium">{q} un.
                    <input className={`${CAMPO} mt-1 px-3 font-normal`} inputMode="decimal" aria-label={`Preço fechado de ${q} unidades`} value={combos[q] ?? ''} onChange={(e) => setCombos({ ...combos, [q]: e.target.value })} />
                  </label>
                ))}
              </div>
            </Bloco>
          )}

          <Bloco titulo="Opções">
            <div className="divide-y divide-linha">
              <Interruptor rotulo="Queridinho" ajuda={'Aparece em "Os queridinhos", no início do site.'} ligado={queridinho} mudar={setQueridinho} />
              <Interruptor rotulo="Esgotada" ligado={esgotada} mudar={setEsgotada} />
            </div>
          </Bloco>

          {inicial && (
            <button type="button" onClick={tocarApagar} disabled={ocupado} className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full text-[15px] font-medium text-red-700 disabled:opacity-50">
              <Trash size={18} /> {confirmarApagar ? 'Toque de novo para apagar de vez' : 'Apagar esta peça'}
            </button>
          )}
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-linha bg-fundo px-4 pb-[max(12px,env(safe-area-inset-bottom))] pt-3 md:px-0">
        <div className="mx-auto max-w-5xl md:px-6">
          {erros.length > 0 && (
            <div role="alert" className="mb-2 text-[14px] font-medium leading-snug text-red-700">
              {erros.map((e) => <p key={e}>{e}</p>)}
              {conflito && <button type="button" onClick={recarregar} className="mt-1 min-h-11 font-semibold underline">Recarregar a lista</button>}
            </div>
          )}
          <div className="md:flex md:justify-end">
            <Botao type="button" className="w-full disabled:opacity-50 md:w-72" onClick={enviar} disabled={ocupado || !alterado}>
              {ocupado ? 'Salvando...' : alterado ? 'Salvar no site' : 'Nenhuma alteração'}
            </Botao>
          </div>
        </div>
      </div>
    </main>
  );
}
