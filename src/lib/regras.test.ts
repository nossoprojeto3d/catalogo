import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { buscar, interpretarCSV, montarCategoria, queridinhos, type Produto } from './catalogo';
import { emPromocao, paraNumero, precoUnitario } from './preco';
import { linkWhatsapp, mensagemAviseMe, mensagemPedido as mensagemBruta } from './whatsapp';

// toLocaleString põe espaço sem quebra depois de "R$"; aqui vira espaço comum pra ler melhor.
const mensagemPedido = (...a: Parameters<typeof mensagemBruta>) => mensagemBruta(...a).replace(/\u00a0/g, ' ');

const amostra = (nome: string) => readFileSync(new URL(`./__amostras__/${nome}`, import.meta.url), 'utf8');
const kids = montarCategoria('Kids', interpretarCSV(amostra('kids.csv')));
const org = montarCategoria('Organizadores', interpretarCSV(amostra('organizadores.csv')));
const porCodigo = (codigo: string) => [...kids.produtos, ...org.produtos].find((p) => p.codigo === codigo)!;

const produto = (dados: Partial<Produto>): Produto => ({
  nome: 'Peça', codigo: '', descricao: '', preco: '', precoPromocional: '', foto: '',
  cores: [], maisVendido: null, esgotado: false, categoria: 'Kids', ...dados,
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
