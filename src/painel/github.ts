import { normalizar, type ArquivoCatalogo } from '../lib/catalogo';

// O painel fala direto com o GitHub, do celular: não existe servidor no meio.
const API = 'https://api.github.com/repos/nossoprojeto3d/catalogo';
const ARQUIVO = 'public/catalogo.json';
const PASTA_FOTOS = 'public/imagens';

// Só o site oficial grava na main (que publica). Link de teste ou máquina local gravam na v4.
const SITES_OFICIAIS = ['nossoprojeto3d.github.io', 'nossoprojeto3d.com.br', 'www.nossoprojeto3d.com.br'];
export const RAMO = SITES_OFICIAIS.includes(location.hostname) ? 'main' : 'v4';

export type TipoDeErro = 'chave' | 'conflito' | 'rede' | 'outro';

export class ErroPainel extends Error {
  tipo: TipoDeErro;
  constructor(tipo: TipoDeErro, mensagem: string) {
    super(mensagem);
    this.tipo = tipo;
  }
}

const SEM_PERMISSAO = 'A chave não tem permissão para alterar o catálogo. Crie outra seguindo o passo a passo.';

async function chamar<T>(token: string, caminho: string, opcoes?: { metodo?: string; corpo?: unknown }): Promise<T> {
  let resposta: Response;
  try {
    resposta = await fetch(`${API}${caminho}`, {
      method: opcoes?.metodo ?? 'GET',
      cache: 'no-store',
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...(opcoes?.corpo ? { 'Content-Type': 'application/json' } : {}),
      },
      body: opcoes?.corpo ? JSON.stringify(opcoes.corpo) : undefined,
    });
  } catch {
    throw new ErroPainel('rede', 'Sem conexão com a internet. Confira a rede e tente de novo.');
  }
  if (resposta.ok) return resposta.json() as Promise<T>;
  if (resposta.status === 401) throw new ErroPainel('chave', 'A chave venceu ou foi cancelada. Configure uma chave nova.');
  if (resposta.status === 403) throw new ErroPainel('chave', SEM_PERMISSAO);
  // A chave pode estar certa e o arquivo é que não existe: não manda a pessoa de volta para a senha.
  if (resposta.status === 404) throw new ErroPainel('outro', `Não encontrei o catálogo na versão ${RAMO} do GitHub, ou a chave não dá acesso a ele.`);
  if (resposta.status === 409 || resposta.status === 422) throw new ErroPainel('conflito', 'O catálogo mudou enquanto você salvava. Toque em Salvar de novo.');
  throw new ErroPainel('outro', `O GitHub não respondeu como esperado (${resposta.status}). Tente de novo em instantes.`);
}

export async function conferirChave(token: string) {
  let projeto: { permissions?: { push?: boolean } };
  try {
    projeto = await chamar(token, '');
  } catch (falha) {
    // Chave sem acesso ao projeto: o GitHub responde como se ele não existisse.
    if (falha instanceof ErroPainel && falha.tipo === 'outro' && falha.message.startsWith('Não encontrei')) throw new ErroPainel('chave', SEM_PERMISSAO);
    throw falha;
  }
  if (!projeto.permissions?.push) throw new ErroPainel('chave', SEM_PERMISSAO);
}

function deBase64(base64: string) {
  const bytes = Uint8Array.from(atob(base64.replace(/\s/g, '')), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

export type Dados = {
  arquivo: ArquivoCatalogo;
  shaCommit: string;
  // Código em minúsculas -> nome real do arquivo da foto.
  fotos: Map<string, string>;
};

export async function lerDados(token: string): Promise<Dados> {
  const ref = await chamar<{ object: { sha: string } }>(token, `/git/ref/heads/${RAMO}`);
  const shaCommit = ref.object.sha;
  const [conteudo, pasta] = await Promise.all([
    chamar<{ content: string }>(token, `/contents/${ARQUIVO}?ref=${shaCommit}`),
    chamar<{ name: string }[]>(token, `/contents/${PASTA_FOTOS}?ref=${shaCommit}`),
  ]);
  const fotos = new Map<string, string>();
  for (const { name } of pasta) {
    if (/\.(jpe?g|png|webp)$/i.test(name)) fotos.set(normalizar(name.replace(/\.[^.]+$/, '')), name);
  }
  return { arquivo: JSON.parse(deBase64(conteudo.content)), shaCommit, fotos };
}

export type Gravacao = {
  shaBase: string;
  arquivo: ArquivoCatalogo;
  mensagem: string;
  fotoNova?: { nome: string; base64: string };
  apagarFotos?: string[];
};

// Tudo entra num commit só, ou não entra nada. Se outra pessoa salvou depois de
// shaBase, o GitHub recusa a última etapa e nada é perdido.
export async function gravar(token: string, { shaBase, arquivo, mensagem, fotoNova, apagarFotos = [] }: Gravacao): Promise<string> {
  const base = await chamar<{ tree: { sha: string } }>(token, `/git/commits/${shaBase}`);
  const criarBlob = (corpo: { content: string; encoding: 'utf-8' | 'base64' }) => chamar<{ sha: string }>(token, '/git/blobs', { metodo: 'POST', corpo });
  const json = await criarBlob({ content: `${JSON.stringify(arquivo, null, 2)}\n`, encoding: 'utf-8' });
  const tree: { path: string; mode: '100644'; type: 'blob'; sha: string | null }[] = [
    { path: ARQUIVO, mode: '100644', type: 'blob', sha: json.sha },
  ];
  if (fotoNova) {
    const foto = await criarBlob({ content: fotoNova.base64, encoding: 'base64' });
    tree.push({ path: `${PASTA_FOTOS}/${fotoNova.nome}`, mode: '100644', type: 'blob', sha: foto.sha });
  }
  for (const nome of apagarFotos) tree.push({ path: `${PASTA_FOTOS}/${nome}`, mode: '100644', type: 'blob', sha: null });

  const novaArvore = await chamar<{ sha: string }>(token, '/git/trees', { metodo: 'POST', corpo: { base_tree: base.tree.sha, tree } });
  const commit = await chamar<{ sha: string }>(token, '/git/commits', { metodo: 'POST', corpo: { message: mensagem, tree: novaArvore.sha, parents: [shaBase] } });
  await chamar(token, `/git/refs/heads/${RAMO}`, { metodo: 'PATCH', corpo: { sha: commit.sha, force: false } });
  return commit.sha;
}
