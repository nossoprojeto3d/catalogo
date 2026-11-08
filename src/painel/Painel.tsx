import { ArrowLeft, SignOut } from '@phosphor-icons/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Botao, Logo } from '../components/Botoes';
import { normalizar } from '../lib/catalogo';
import { nomeGuardado } from './chaveLocal';
import { Configurar, Desbloquear } from './Acesso';
import { Ficha, type Pedido } from './Ficha';
import { ErroPainel, gravar, lerDados, RAMO, type Dados } from './github';
import { Lista } from './Lista';
import { acharPeca, aplicarPeca, descreverMudanca, gerarCodigo, mesmaPeca, removerPeca, type Localizada } from './pecas';

const AVISO_PUBLICACAO = RAMO === 'main' ? 'Aparece no site em 1 a 2 minutos.' : 'Modo de teste: salvo só na branch teste, o site não muda.';
const MSG_PECA_MUDOU = 'Outra pessoa alterou esta peça agora há pouco. Recarregue a lista para ver a versão nova.';

type Fase = 'configurar' | 'senha' | 'pronto';
type Tela = { tipo: 'lista' } | { tipo: 'ficha'; codigo: string | null };

export function Painel() {
  const [fase, setFase] = useState<Fase>(() => (nomeGuardado() ? 'senha' : 'configurar'));
  // A chave aberta fica só na memória: recarregar a página pede a senha de novo.
  const token = useRef('');
  const [nome, setNome] = useState('');
  const [dados, setDados] = useState<Dados | null>(null);
  const [erroCarga, setErroCarga] = useState('');
  const [atualizando, setAtualizando] = useState(false);
  const [tela, setTela] = useState<Tela>({ tipo: 'lista' });
  const [fotosRecentes, setFotosRecentes] = useState<Map<string, string>>(new Map());
  const [versaoFotos] = useState(() => Date.now());
  const alterado = useRef(false);

  const avisarAlterado = useCallback((v: boolean) => { alterado.current = v; }, []);

  const tratarChave = useCallback((falha: unknown) => {
    if (falha instanceof ErroPainel && falha.tipo === 'chave') {
      token.current = '';
      setFase('senha');
      toast.error(falha.message);
      return true;
    }
    return false;
  }, []);

  const carregar = useCallback(async () => {
    setAtualizando(true);
    setErroCarga('');
    try {
      setDados(await lerDados(token.current));
    } catch (falha) {
      if (!tratarChave(falha)) setErroCarga(falha instanceof Error ? falha.message : 'Não foi possível abrir o catálogo.');
    } finally {
      setAtualizando(false);
    }
  }, [tratarChave]);

  const entrar = (chave: string, quem: string) => {
    token.current = chave;
    setNome(quem);
    setFase('pronto');
    setTela({ tipo: 'lista' });
    void carregar();
  };

  const sair = () => {
    token.current = '';
    setDados(null);
    setFase('senha');
  };

  // O "voltar" do celular fecha a ficha em vez de sair do painel.
  useEffect(() => {
    const aoVoltar = () => {
      if (alterado.current && !confirm('Sair sem salvar as alterações?')) {
        history.pushState({ ficha: true }, '');
        return;
      }
      alterado.current = false;
      setTela({ tipo: 'lista' });
    };
    window.addEventListener('popstate', aoVoltar);
    return () => window.removeEventListener('popstate', aoVoltar);
  }, []);

  const abrir = (codigo: string | null) => {
    history.pushState({ ficha: true }, '');
    alterado.current = false;
    setTela({ tipo: 'ficha', codigo });
    scrollTo(0, 0);
  };

  const fecharFicha = () => {
    alterado.current = false;
    setTela({ tipo: 'lista' });
    if (history.state?.ficha) history.back();
  };

  const urlFoto = (codigo: string) => {
    const chave = normalizar(codigo);
    const recente = fotosRecentes.get(chave);
    if (recente) return recente;
    const arquivo = dados?.fotos.get(chave);
    return arquivo ? `${import.meta.env.BASE_URL}imagens/${encodeURIComponent(arquivo)}?v=${versaoFotos}` : null;
  };

  // Sempre parte da versão mais nova do GitHub. Se outra pessoa salvou outra peça, as duas
  // alterações ficam; só para se a mesma peça tiver mudado depois de aberta aqui.
  const comVersaoAtual = async (original: Localizada | null, operacao: (atual: Dados) => Promise<Dados>) => {
    for (let tentativa = 0; ; tentativa++) {
      try {
        const atual = await lerDados(token.current);
        if (original) {
          const agora = acharPeca(atual.arquivo, original.peca.codigo);
          if (!agora || !mesmaPeca(agora, original)) throw new ErroPainel('conflito', MSG_PECA_MUDOU);
        }
        setDados(await operacao(atual));
        return;
      } catch (falha) {
        const corrida = falha instanceof ErroPainel && falha.tipo === 'conflito' && falha.message !== MSG_PECA_MUDOU;
        if (corrida && tentativa < 2) continue;
        if (tratarChave(falha)) return;
        throw falha;
      }
    }
  };

  const salvar = async ({ original, peca, categoria, foto }: Pedido) => {
    let codigoSalvo = '';
    await comVersaoAtual(original, async (atual) => {
      const codigo = original?.peca.codigo ?? gerarCodigo(atual.arquivo, categoria);
      const completa = { ...peca, codigo };
      const nomeFoto = `${codigo.toUpperCase()}.jpg`;
      const fotoAntiga = atual.fotos.get(normalizar(codigo));
      const arquivo = aplicarPeca(atual.arquivo, completa, categoria);
      const shaCommit = await gravar(token.current, {
        shaBase: atual.shaCommit,
        arquivo,
        mensagem: descreverMudanca(original, { peca: completa, categoria }, !!foto, nome),
        fotoNova: foto ? { nome: nomeFoto, base64: foto } : undefined,
        apagarFotos: foto && fotoAntiga && fotoAntiga !== nomeFoto ? [fotoAntiga] : [],
      });
      codigoSalvo = codigo;
      const fotos = new Map(atual.fotos);
      if (foto) fotos.set(normalizar(codigo), nomeFoto);
      return { arquivo, shaCommit, fotos };
    });
    if (!codigoSalvo) return;
    if (foto) setFotosRecentes((m) => new Map(m).set(normalizar(codigoSalvo), `data:image/jpeg;base64,${foto}`));
    toast.success(`Salvo. ${AVISO_PUBLICACAO}`);
    fecharFicha();
  };

  const apagar = async (original: Localizada) => {
    const { codigo } = original.peca;
    let apagada = false;
    await comVersaoAtual(original, async (atual) => {
      const arquivo = removerPeca(atual.arquivo, codigo);
      const fotoAntiga = atual.fotos.get(normalizar(codigo));
      const shaCommit = await gravar(token.current, {
        shaBase: atual.shaCommit,
        arquivo,
        mensagem: `Apagar ${codigo} pelo painel (${nome})`,
        apagarFotos: fotoAntiga ? [fotoAntiga] : [],
      });
      apagada = true;
      const fotos = new Map(atual.fotos);
      fotos.delete(normalizar(codigo));
      return { arquivo, shaCommit, fotos };
    });
    if (!apagada) return;
    toast.success(`Peça apagada. ${AVISO_PUBLICACAO}`);
    fecharFicha();
  };

  const recarregar = () => {
    fecharFicha();
    void carregar();
  };

  if (fase === 'configurar') return <Moldura><Configurar pronto={entrar} /></Moldura>;
  if (fase === 'senha') return <Moldura><Desbloquear pronto={entrar} reconfigurar={() => setFase('configurar')} /></Moldura>;

  const emEdicao = tela.tipo === 'ficha' && dados ? (tela.codigo ? acharPeca(dados.arquivo, tela.codigo) : null) : null;

  return (
    <Moldura sair={sair} temAlteracao={() => alterado.current}>
      {erroCarga && !dados ? (
        <main className="mx-auto max-w-md px-4 py-12 text-center">
          <p role="alert" className="text-[15px] text-suave">{erroCarga}</p>
          <Botao className="mt-5" onClick={() => void carregar()}>Tentar de novo</Botao>
        </main>
      ) : !dados ? (
        <p role="status" className="py-16 text-center text-[15px] text-suave">Abrindo o catálogo...</p>
      ) : tela.tipo === 'lista' ? (
        <Lista nome={nome} arquivo={dados.arquivo} urlFoto={urlFoto} abrir={abrir} atualizar={() => void carregar()} atualizando={atualizando} />
      ) : (
        <Ficha
          key={tela.codigo ?? 'nova'}
          inicial={emEdicao}
          arquivo={dados.arquivo}
          urlFoto={tela.codigo ? urlFoto(tela.codigo) : null}
          salvar={salvar}
          apagar={apagar}
          voltar={() => { if (!alterado.current || confirm('Sair sem salvar as alterações?')) fecharFicha(); }}
          recarregar={recarregar}
          avisarAlterado={avisarAlterado}
        />
      )}
    </Moldura>
  );
}

function Moldura({ sair, temAlteracao, children }: { sair?: () => void; temAlteracao?: () => boolean; children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-fundo text-texto">
      <header className="bg-barra text-sobre-barra">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 md:px-6">
        <span className="flex items-center gap-2.5">
          <Logo className="h-8" />
          <span className="titulo text-[17px]">Painel</span>
        </span>
        <span className="-mr-2 flex items-center gap-1">
          <a
            href={import.meta.env.BASE_URL}
            onClick={(e) => { if (temAlteracao?.() && !confirm('Sair sem salvar as alterações?')) e.preventDefault(); }}
            className="inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium"
          >
            <ArrowLeft size={20} /> Catálogo
          </a>
          {sair && (
            <button type="button" onClick={sair} className="inline-flex h-11 items-center gap-1.5 rounded-full px-2 text-[15px] font-medium">
              <SignOut size={20} /> Sair
            </button>
          )}
        </span>
        </div>
      </header>
      {RAMO !== 'main' && <p className="bg-superficie-2 px-4 py-2 text-center text-[13px] font-medium">Modo de teste: salva só na branch teste. O site não muda.</p>}
      {children}
    </div>
  );
}
