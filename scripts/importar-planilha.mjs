// Importa a planilha para public/catalogo.json, o arquivo que o site lê e o painel edita.
// Uso único: a planilha deixa de valer depois que o painel entrar no ar. Rodar de novo
// apaga o que foi feito no painel. Uso: node scripts/importar-planilha.mjs
import { writeFileSync } from 'node:fs';
import { createServer } from 'vite';

const SHEET_ID = '1g8NUVwsozRXUAVavaQlmjtLQOuw3td0q';
const ABAS = ['Natal', 'Brindes', 'Kids', 'Pros Fãs', 'Organizadores', 'Setup dos Sonhos', 'Personalizados', 'Cantinho da Fé', 'Profissões', 'Time do coração', 'Plantinhas Mimadas', 'Lembrancinhas'];
// Ficam no arquivo mesmo vazias, para aparecerem na lista de categorias do painel.
const MANTER_VAZIAS = ['Natal', 'Brindes'];

const vite = await createServer({ configFile: false, server: { middlewareMode: true }, appType: 'custom', logLevel: 'error' });
const { interpretarCSV, montarCategoria } = await vite.ssrLoadModule('/src/lib/catalogo.ts');

const categorias = [];
for (const aba of ABAS) {
  const resposta = await fetch(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(aba)}`);
  if (!resposta.ok) throw new Error(`Aba ${aba}: ${resposta.status}`);
  const { nome, produtos } = montarCategoria(aba, interpretarCSV(await resposta.text()));
  if (!produtos.length && !MANTER_VAZIAS.includes(aba)) continue;
  categorias.push({ nome, produtos: produtos.map(({ categoria: _categoria, ...peca }) => peca) });
}
await vite.close();

writeFileSync('public/catalogo.json', `${JSON.stringify({ categorias }, null, 2)}\n`);

const todas = categorias.flatMap((c) => c.produtos);
const codigos = todas.map((p) => p.codigo);
console.log(`Categorias: ${categorias.map((c) => `${c.nome} (${c.produtos.length})`).join(', ')}`);
console.log(`Peças: ${todas.length}`);
console.log(`Sem código: ${todas.filter((p) => !p.codigo).map((p) => p.nome).join(', ') || 'nenhuma'}`);
console.log(`Código repetido: ${[...new Set(codigos.filter((c, i) => c && codigos.indexOf(c) !== i))].join(', ') || 'nenhum'}`);
console.log(`Com foto externa: ${todas.filter((p) => p.foto).map((p) => p.codigo).join(', ') || 'nenhuma'}`);
