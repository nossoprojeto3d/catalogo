import { useState, type FormEvent, type ReactNode } from 'react';
import { Botao } from '../components/Botoes';
import { abrirAcesso, apagarAcesso, guardarAcesso, nomeGuardado } from './chaveLocal';
import { conferirChave, ErroPainel } from './github';

export const CAMPO = 'h-12 w-full rounded-xl bg-superficie px-4 text-[16px] ring-1 ring-texto/20 focus:outline-2 focus:outline-acento-escuro';
export const ROTULO = 'block text-[15px] font-semibold';

function Cartao({ titulo, texto, children }: { titulo: string; texto?: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-md px-4 py-8">
      <h1 className="titulo text-[28px]">{titulo}</h1>
      {texto && <p className="mt-2 text-[15px] leading-relaxed text-suave">{texto}</p>}
      {children}
    </main>
  );
}

export function Configurar({ pronto }: { pronto: (token: string, nome: string) => void }) {
  const [nome, setNome] = useState('');
  const [chave, setChave] = useState('');
  const [senha, setSenha] = useState('');
  const [repetir, setRepetir] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    const token = chave.trim();
    if (!nome.trim() || !token) return setErro('Preencha o seu nome e a chave.');
    if (senha.length < 6) return setErro('A senha precisa ter pelo menos 6 caracteres.');
    if (senha !== repetir) return setErro('As duas senhas estão diferentes.');
    setOcupado(true);
    setErro('');
    try {
      await conferirChave(token);
      await guardarAcesso(nome.trim(), token, senha);
      pronto(token, nome.trim());
    } catch (falha) {
      setErro(falha instanceof ErroPainel ? falha.message : 'Não foi possível guardar o acesso neste navegador.');
    } finally {
      setOcupado(false);
    }
  };

  return (
    <Cartao titulo="Configurar este celular" texto="Só precisa fazer uma vez em cada aparelho. Cada celular usa a própria chave do GitHub.">
      <details className="mt-4 rounded-2xl bg-superficie p-4 text-[15px] ring-1 ring-linha">
        <summary className="cursor-pointer font-semibold">Como criar a chave</summary>
        <ol className="mt-3 list-decimal space-y-2 pl-5 leading-snug text-suave">
          <li>Entre no GitHub com a conta da loja e abra <a className="font-semibold text-acento-escuro underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener">a página de chaves</a>.</li>
          <li>Dê um nome, como "Painel celular", e escolha a validade.</li>
          <li>Em "Repository access", marque "Only select repositories" e escolha só <strong>catalogo</strong>.</li>
          <li>Em "Permissions", procure <strong>Contents</strong> e mude para <strong>Read and write</strong>.</li>
          <li>Gere a chave, copie e cole aqui. Ela só aparece uma vez.</li>
        </ol>
      </details>
      <form onSubmit={enviar} className="mt-5 space-y-4">
        <label className={ROTULO}>Seu nome
          <input className={`${CAMPO} mt-1.5 font-normal`} value={nome} onChange={(e) => setNome(e.target.value)} autoComplete="name" />
        </label>
        <label className={ROTULO}>Chave do GitHub
          <input className={`${CAMPO} mt-1.5 font-normal`} type="password" value={chave} onChange={(e) => setChave(e.target.value)} autoComplete="off" spellCheck={false} />
        </label>
        <label className={ROTULO}>Senha do painel
          <input className={`${CAMPO} mt-1.5 font-normal`} type="password" value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="new-password" />
        </label>
        <label className={ROTULO}>Repita a senha
          <input className={`${CAMPO} mt-1.5 font-normal`} type="password" value={repetir} onChange={(e) => setRepetir(e.target.value)} autoComplete="new-password" />
        </label>
        {erro && <p role="alert" className="text-[15px] font-medium text-red-700">{erro}</p>}
        <Botao type="submit" className="w-full" disabled={ocupado}>{ocupado ? 'Conferindo a chave...' : 'Entrar no painel'}</Botao>
      </form>
    </Cartao>
  );
}

export function Desbloquear({ pronto, reconfigurar }: { pronto: (token: string, nome: string) => void; reconfigurar: () => void }) {
  const nome = nomeGuardado() ?? '';
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState(false);

  const enviar = async (e: FormEvent) => {
    e.preventDefault();
    setOcupado(true);
    setErro('');
    const token = await abrirAcesso(senha);
    setOcupado(false);
    if (token) pronto(token, nome);
    else setErro('Senha errada. Tente de novo.');
  };

  return (
    <Cartao titulo={`Olá, ${nome}`} texto="Digite a senha do painel.">
      <form onSubmit={enviar} className="mt-5 space-y-4">
        <label className={ROTULO}>Senha
          <input className={`${CAMPO} mt-1.5 font-normal`} type="password" autoFocus value={senha} onChange={(e) => setSenha(e.target.value)} autoComplete="current-password" />
        </label>
        {erro && <p role="alert" className="text-[15px] font-medium text-red-700">{erro}</p>}
        <Botao type="submit" className="w-full" disabled={ocupado || !senha}>{ocupado ? 'Abrindo...' : 'Entrar'}</Botao>
      </form>
      <button
        type="button"
        onClick={() => { if (confirmar) { apagarAcesso(); reconfigurar(); } else setConfirmar(true); }}
        className="mt-5 min-h-11 w-full text-[15px] text-suave underline"
      >
        {confirmar ? 'Toque de novo para configurar com uma chave nova' : 'Esqueci a senha ou a chave venceu'}
      </button>
    </Cartao>
  );
}
