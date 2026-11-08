import { describe, expect, it } from 'vitest';
import { naVersao, temVersoes, type Produto } from './catalogo';
import { totalDoItem } from './preco';
import { mensagemPedido } from './whatsapp';
import { errosDaPeca, limparVersoes, menorPreco } from '../painel/pecas';

const letreiro: Produto = {
  nome: 'Letreiro Feliz Natal', codigo: 'NAT-10', descricao: '', preco: '14,90', foto: '',
  cores: ['dourado'], combos: {}, maisVendido: null, esgotado: false, categoria: 'Natal',
  versoes: [{ nome: '10 cm', preco: '14,90' }, { nome: '20 cm', preco: '29,90' }],
};

describe('versões', () => {
  it('a versão escolhida vira o preço do produto', () => {
    const grande = naVersao(letreiro, '20 cm');
    expect(totalDoItem(grande, 2)).toBe(59.8);
    expect(temVersoes(grande)).toBe(false);
    expect(naVersao(letreiro, 'não existe')).toBe(letreiro);
  });

  it('mensagem do WhatsApp leva a versão junto do nome', () => {
    const msg = mensagemPedido([{ produto: naVersao(letreiro, '20 cm'), quantidade: 1, cor: 'dourado', versao: '20 cm' }]).replace(/ /g, ' ');
    expect(msg).toContain('*1. Letreiro Feliz Natal (20 cm)* (NAT-10)\n1 x R$ 29,90\nCor: dourado');
  });

  it('painel: limpa as linhas, pega o menor preço e confere os erros', () => {
    const versoes = limparVersoes([{ nome: ' 20 cm ', preco: '29.9' }, { nome: '', preco: '' }, { nome: '10 cm', preco: '14,9' }]);
    expect(versoes).toEqual([{ nome: '20 cm', preco: '29,90' }, { nome: '10 cm', preco: '14,90' }]);
    expect(menorPreco(versoes)).toBe('14,90');
    const base = { nome: 'Letreiro', preco: '', categoria: 'Natal', esgotado: false };
    expect(errosDaPeca({ ...base, versoes })).toEqual([]);
    expect(errosDaPeca({ ...base, versoes: [{ nome: '10 cm', preco: '' }] })).toContain('Escreva o preço de cada versão.');
    expect(errosDaPeca({ ...base, versoes: [{ nome: '', preco: '10' }] })).toContain('Escreva o nome de cada versão.');
    expect(errosDaPeca({ ...base, versoes: [{ nome: '10 cm', preco: '1' }, { nome: '10 CM', preco: '2' }] })).toContain('Duas versões estão com o mesmo nome.');
    expect(errosDaPeca(base)).toContain('Escreva o preço da peça.');
  });
});
