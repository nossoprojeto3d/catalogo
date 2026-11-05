import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buscar, categoriasDeVarejo, interpretarCSV, linkDoNatal, lerCombos, montarCategoria, ordenarPor, queridinhos, type Produto } from './catalogo';
import { paginaDoProduto } from '../../scripts/plugin-compartilhar';
import { descontoDaQuantidade, emPromocao, paraNumero, precoUnitario, temCombos, textoDoTotal, totalDoItem } from './preco';
import { linkWhatsapp, mensagemAviseMe, mensagemPedido as mensagemBruta } from './whatsapp';

// toLocaleString põe espaço sem quebra depois de "R$"; aqui vira espaço comum pra ler melhor.
const mensagemPedido = (...a: Parameters<typeof mensagemBruta>) => mensagemBruta(...a).replace(/\u00a0/g, ' ');

describe('página de compartilhar', () => {
  const site = 'https://exemplo.com/catalogo/';
  const pagina = (nome?: string) => paginaDoProduto({ site, caminho: '/catalogo/', foto: 'KID-07.jpg', codigo: 'KID-07', nome });

  it('traz foto, nome e leva ao produto', () => {
    const html = pagina('Dinossauros');
    expect(html).toContain('property="og:image" content="https://exemplo.com/catalogo/imagens/KID-07.jpg"');
    expect(html).toContain('property="og:title" content="Dinossauros | Nosso Projeto 3D"');
    expect(html).toContain('property="og:url" content="https://exemplo.com/catalogo/p/kid-07/"');
    expect(html).toContain('location.replace("/catalogo/#produto/KID-07")');
  });

  it('protege o nome vindo da planilha e funciona sem ele', () => {
    expect(pagina('Vaso "A" <b>')).toContain('Vaso &quot;A&quot; &lt;b&gt;');
    expect(pagina()).toContain('og:title" content="Catálogo Nosso Projeto 3D"');
  });
});

const amostra = (nome: string) => readFileSync(new URL(`./__amostras__/${nome}`, import.meta.url), 'utf8');
const kids = montarCategoria('Kids', interpretarCSV(amostra('kids.csv')));
const org = montarCategoria('Organizadores', interpretarCSV(amostra('organizadores.csv')));
const porCodigo = (codigo: string) => [...kids.produtos, ...org.produtos].find((p) => p.codigo === codigo)!;

const produto = (dados: Partial<Produto>): Produto => ({
  nome: 'Peça', codigo: '', descricao: '', preco: '', precoPromocional: '', foto: '',
  cores: [], combos: {}, maisVendido: null, esgotado: false, categoria: 'Kids', ...dados,
});

describe('planilha real', () => {
  it('lê todas as linhas de Kids e coloca esgotados por último', () => {
    expect(kids.produtos.length).toBe(28);
    expect(kids.produtos.at(-1)!.codigo).toBe('KID-22');
    expect(kids.produtos.filter((p) => p.esgotado).map((p) => p.codigo)).toEqual(['KID-22']);
  });

  it('lê cores separadas por vírgula', () => {
    expect(porCodigo('ORG-01').cores).toEqual(['Branco', 'Preto', 'Areia', 'Verde Matte']);
  });

  it('marca queridinhos pela coluna MaisVendido', () => {
    expect(queridinhos([kids]).map((p) => p.codigo).sort()).toEqual(['KID-15', 'KID-16', 'KID-19', 'SEN-04']);
  });

  it('busca ignora acento e maiúscula', () => {
    expect(buscar([kids], 'dragao').map((p) => p.codigo)).toEqual(['SEN-05']);
    expect(buscar([kids], 'kid-0').length).toBe(9);
    const brindes = montarCategoria('Brindes', [['Produto', 'Codigo', 'Preco'], ['Bandeja Porta-Joias', 'BRI-01', '10']]);
    expect(buscar([kids, brindes], 'bandeja').map((p) => p.codigo)).toEqual(['BRI-01']);
    expect(buscar([kids, brindes], 'brindes').map((p) => p.codigo)).toEqual(['BRI-01']);
  });
});

describe('preço', () => {
  it('converte vírgula decimal e milhar', () => {
    expect(paraNumero('29,90')).toBe(29.9);
    expect(paraNumero('1.234,56')).toBe(1234.56);
    expect(paraNumero('')).toBe(0);
  });

  it('usa o promocional só quando é menor que o cheio', () => {
    expect(precoUnitario(porCodigo('SEN-01'))).toBe(24.9);
    expect(emPromocao(produto({ preco: '20,00', precoPromocional: '25,00' }))).toBe(false);
    expect(precoUnitario(produto({ preco: '20,00', precoPromocional: '25,00' }))).toBe(20);
  });
});

describe('mensagem do WhatsApp', () => {
  it('pedido de um produto com cor, quantidade e promoção', () => {
    expect(mensagemPedido([{ produto: porCodigo('SEN-01'), quantidade: 2, cor: 'Azul' }])).toBe(
      'Olá! Quero fazer um pedido pelo catálogo:\n\n' +
        '*1. Estrela Sensorial* (SEN-01)\n2 x R$ 24,90 = R$ 49,80\nPromoção, de R$ 29,90 cada\nCor: Azul\n\n' +
        '*Total: R$ 49,80*\n\nPode confirmar disponibilidade e prazo?',
    );
  });

  it('lista com item a combinar fica fora do total', () => {
    const msg = mensagemPedido([
      { produto: porCodigo('SEN-01'), quantidade: 2, cor: 'Azul' },
      { produto: porCodigo('ORG-01'), quantidade: 1, cor: 'Preto' },
      { produto: porCodigo('KID-22'), quantidade: 1, cor: '' },
    ]);
    expect(msg).toContain('*2. Suporte Papel Higiênico* (ORG-01)\n1 x R$ 24,99\nCor: Preto');
    expect(msg).toContain('*3. Xicara de café supresa* (KID-22)\n1 x valor a combinar');
    expect(msg).toContain('*Total: R$ 74,79*\n(sem os itens a combinar)');
  });

  it('só itens a combinar não mostra R$ 0,00', () => {
    const msg = mensagemPedido([{ produto: porCodigo('KID-22'), quantidade: 3, cor: '' }]);
    expect(msg).toContain('*Total: a combinar*');
    expect(msg).not.toContain('R$ 0,00');
  });

  it('produto sem código não deixa parênteses vazios', () => {
    const msg = mensagemPedido([{ produto: produto({ nome: 'Sem Código', preco: '10,00' }), quantidade: 1, cor: '' }]);
    expect(msg).toContain('*1. Sem Código*\n1 x R$ 10,00');
  });

  it('avise-me leva nome e código', () => {
    expect(mensagemAviseMe(porCodigo('KID-22'))).toContain('*Xicara de café supresa* (KID-22)');
  });

  it('link aponta para o número da loja e codifica o texto', () => {
    const link = linkWhatsapp('Olá! *1. Peça*\nCor: Azul & Branco');
    expect(link.startsWith('https://wa.me/5562993152843?text=')).toBe(true);
    expect(decodeURIComponent(link.split('text=')[1])).toBe('Olá! *1. Peça*\nCor: Azul & Branco');
  });
});

describe('combos de brindes', () => {
  const brinde = (dados: Partial<Produto>) => produto({ categoria: 'Brindes', ...dados });

  it('lê a coluna Combos e ignora o que não entende', () => {
    expect(lerCombos('10=119,00; 20=220,00; 30: 300')).toEqual({ 10: 119, 20: 220, 30: 300 });
    expect(lerCombos('')).toEqual({});
    expect(lerCombos('sob consulta')).toEqual({});
  });

  it('10, 30 e 50 têm 5, 10 e 15% de desconto, sem centavos', () => {
    const p = brinde({ preco: '10,00' });
    expect([10, 30, 50].map((n) => descontoDaQuantidade(p, n))).toEqual([5, 10, 15]);
    expect([10, 30, 50].map((n) => totalDoItem(p, n))).toEqual([95, 270, 425]);
    const q = brinde({ preco: '19,99' });
    expect([10, 30, 50].map((n) => totalDoItem(q, n))).toEqual([189, 539, 849]);
    expect(totalDoItem(brinde({ preco: '0,70' }), 30)).toBe(18);
  });

  it('de 1 a 9 unidades vale o preço normal, sem desconto', () => {
    const p = brinde({ nome: 'Bandeja', preco: '10,90' });
    expect(totalDoItem(p, 1)).toBe(10.9);
    expect(totalDoItem(p, 9)).toBe(98.1);
    expect(descontoDaQuantidade(p, 1)).toBe(0);
    const msg = mensagemPedido([{ produto: p, quantidade: 2, cor: '' }]);
    expect(msg).toContain('2 x R$ 10,90 = R$ 21,80');
    expect(msg).toContain('*Total: R$ 21,80*');
    expect(mensagemPedido([{ produto: p, quantidade: 1, cor: '' }])).toContain('1 x R$ 10,90');
  });

  it('acima de 10, fora dos combos, o valor é a combinar', () => {
    const p = brinde({ nome: 'Bandeja', preco: '10,00' });
    for (const n of [11, 20, 49, 60, 100]) {
      expect(totalDoItem(p, n)).toBe(0);
      expect(descontoDaQuantidade(p, n)).toBe(0);
    }
    const msg = mensagemPedido([{ produto: p, quantidade: 60, cor: '' }]);
    expect(msg).toContain('60 x valor a combinar');
    expect(msg).toContain('*Total: a combinar*');
    expect(msg).not.toContain('Combo');
  });

  it('total só com itens a combinar não vira R$ 0,00', () => {
    const p = brinde({ preco: '10,00' });
    expect(textoDoTotal([{ produto: p, quantidade: 31 }])).toBe('A combinar');
    expect(textoDoTotal([{ produto: p, quantidade: 31 }, { produto: p, quantidade: 30 }])).toMatch(/^R\$\s270$/);
  });

  it('mensagem do combo mostra valor inteiro, igual ao botão', () => {
    const p = brinde({ nome: 'Chaveiro', codigo: 'PER-03', preco: '12,90' });
    const msg = mensagemPedido([{ produto: p, quantidade: 10, cor: '' }]);
    expect(msg).toContain('*1. Chaveiro* (PER-03)\nCombo de 10 = R$ 122\n');
    expect(msg).toContain('*Total: R$ 122*');
  });

  it('sem preço, combo continua a combinar', () => {
    expect(totalDoItem(brinde({}), 10)).toBe(0);
    expect(mensagemPedido([{ produto: brinde({}), quantidade: 10, cor: '' }])).toContain('10 x valor a combinar');
  });

  it('preço fechado na coluna Combos manda sobre o desconto, só na quantidade exata', () => {
    const p = brinde({ preco: '10,00', combos: { 50: 400, 100: 700 } });
    expect(totalDoItem(p, 50)).toBe(400);
    expect(descontoDaQuantidade(p, 50)).toBe(20);
    expect(totalDoItem(p, 100)).toBe(700);
    expect(totalDoItem(p, 99)).toBe(0);
  });

  it('com combo cadastrado, a mensagem e o total usam o valor do combo', () => {
    const p = brinde({ nome: 'Chaveiro', preco: '12,90', combos: { 10: 99 } });
    const msg = mensagemPedido([{ produto: p, quantidade: 10, cor: 'Azul' }]);
    expect(msg).toContain('Combo de 10 = R$ 99\n');
    expect(msg).toContain('*Total: R$ 99*');
    expect(msg).toContain('Cor: Azul');
  });

  it('só as abas de brindes têm combo', () => {
    expect(temCombos(brinde({ preco: '12,90' }))).toBe(true);
    expect(temCombos(produto({ categoria: 'Personalizados', preco: '12,90' }))).toBe(false);
    expect(temCombos(produto({ categoria: 'Kids', preco: '12,90' }))).toBe(false);
  });

  it('fora das abas de brindes, a quantidade é só quantidade, com centavos', () => {
    const p = produto({ nome: 'Kit', categoria: 'Kids', preco: '45,90', combos: { 10: 399 } });
    expect(totalDoItem(p, 10)).toBe(459);
    expect(descontoDaQuantidade(p, 10)).toBe(0);
    const msg = mensagemPedido([{ produto: p, quantidade: 10, cor: '' }]);
    expect(msg).toContain('10 x R$ 45,90 = R$ 459,00');
    expect(msg).not.toContain('Combo');
    expect(msg).toContain('*Total: R$ 459,00*');
  });
});

describe('abas de Natal e Brindes', () => {
  const cat = (nome: string) => ({ nome, produtos: [produto({ categoria: nome })] });

  it('a aba Brindes fica fora das categorias de quem compra para si', () => {
    const nomes = categoriasDeVarejo([cat('Brindes'), cat('Kids'), cat('Personalizados')]).map((c) => c.nome);
    expect(nomes).toEqual(['Kids', 'Personalizados']);
  });

  it('o banner de Natal usa a aba Natal quando ela tem peças', () => {
    expect(linkDoNatal([cat('Natal'), cat('Cantinho da Fé')])).toBe('#categoria/Natal');
  });

  it('com a aba Natal vazia, o banner vai para o Cantinho da Fé', () => {
    expect(linkDoNatal([cat('Cantinho da Fé')])).toBe('#categoria/Cantinho%20da%20F%C3%A9');
  });
});

describe('ordenação da lista', () => {
  const lista = [
    produto({ nome: 'B', preco: '30,00' }),
    produto({ nome: 'A', preco: '10,00', maisVendido: 2 }),
    produto({ nome: 'C', preco: '20,00', maisVendido: 1 }),
    produto({ nome: 'D', preco: '5,00', esgotado: true }),
  ];
  const nomes = (modo: Parameters<typeof ordenarPor>[1]) => ordenarPor(lista, modo).map((p) => p.nome).join('');

  it('mais pedidos vem primeiro e esgotado sempre por último', () => {
    expect(nomes('pedidos')).toBe('CABD');
    expect(nomes('menor')).toBe('ACBD');
    expect(nomes('maior')).toBe('BCAD');
    expect(nomes('nome')).toBe('ABCD');
  });
});
