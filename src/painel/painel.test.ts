import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { categoriasDoArquivo, type ArquivoCatalogo, type Peca } from '../lib/catalogo';
import { acharPeca, aplicarPeca, descreverMudanca, errosDaPeca, gerarCodigo, mesmaPeca, normalizarPreco, removerPeca } from './pecas';

const peca = (codigo: string, extra: Partial<Peca> = {}): Peca => ({
  nome: codigo, codigo, descricao: '', preco: '10,00', precoPromocional: '', foto: '', cores: [], combos: {}, maisVendido: null, esgotado: false, ...extra,
});
const arquivo: ArquivoCatalogo = {
  categorias: [
    { nome: 'Kids', produtos: [peca('KID-02'), peca('KID-23'), peca('SEN-05')] },
    { nome: 'Natal', produtos: [] },
  ],
};

describe('arquivo real do catálogo', () => {
  const real: ArquivoCatalogo = JSON.parse(readFileSync('public/catalogo.json', 'utf8'));
  const todas = real.categorias.flatMap((c) => c.produtos);

  it('toda peça tem nome e código, sem repetir', () => {
    expect(todas.length).toBeGreaterThan(0);
    expect(todas.every((p) => p.nome && p.codigo)).toBe(true);
    expect(new Set(todas.map((p) => p.codigo.toLowerCase())).size).toBe(todas.length);
  });

  it('vira categorias do site, sem as vazias', () => {
    const categorias = categoriasDoArquivo(real);
    expect(categorias.every((c) => c.produtos.length > 0 && c.produtos.every((p) => p.categoria === c.nome))).toBe(true);
  });
});

describe('painel', () => {
  it('normaliza o preço digitado', () => {
    expect(normalizarPreco('69,9')).toBe('69,90');
    expect(normalizarPreco('69.90')).toBe('69,90');
    expect(normalizarPreco('R$ 1.234,50')).toBe('1234,50');
    expect(normalizarPreco('10')).toBe('10,00');
    expect(normalizarPreco('  ')).toBe('');
  });

  it('gera o próximo código sem repetir', () => {
    expect(gerarCodigo(arquivo, 'Kids')).toBe('KID-24');
    expect(gerarCodigo(arquivo, 'Natal')).toBe('NAT-01');
    expect(gerarCodigo(arquivo, 'Órgãos Novos')).toBe('ORG-01');
    expect(gerarCodigo({ categorias: [{ nome: 'A', produtos: [peca('ORG-07')] }] }, 'Órgãos')).toBe('ORG-08');
  });

  it('salva, troca de categoria e apaga sem alterar o original', () => {
    const editado = aplicarPeca(arquivo, peca('KID-02', { preco: '20,00' }), 'Natal');
    expect(acharPeca(editado, 'kid-02')).toEqual({ categoria: 'Natal', peca: peca('KID-02', { preco: '20,00' }) });
    expect(editado.categorias[0].produtos.map((p) => p.codigo)).toEqual(['KID-23', 'SEN-05']);
    expect(arquivo.categorias[0].produtos).toHaveLength(3);
    expect(acharPeca(removerPeca(editado, 'KID-02'), 'KID-02')).toBeNull();
    expect(aplicarPeca(arquivo, peca('NOV-01'), 'Nova').categorias.at(-1)?.nome).toBe('Nova');
  });

  it('reconhece peça alterada por outra pessoa', () => {
    const a = { peca: peca('KID-02'), categoria: 'Kids' };
    expect(mesmaPeca(a, { peca: peca('KID-02'), categoria: 'Kids' })).toBe(true);
    expect(mesmaPeca(a, { peca: peca('KID-02', { preco: '11,00' }), categoria: 'Kids' })).toBe(false);
    expect(mesmaPeca(a, { peca: peca('KID-02'), categoria: 'Natal' })).toBe(false);
  });

  it('avisa o que falta antes de salvar', () => {
    const base = { nome: 'Peça', preco: '10', precoPromocional: '', categoria: 'Kids', esgotado: false };
    expect(errosDaPeca(base)).toEqual([]);
    expect(errosDaPeca({ ...base, nome: ' ' })).toEqual(['Escreva o nome da peça.']);
    expect(errosDaPeca({ ...base, preco: '' })).toEqual(['Escreva o preço da peça.']);
    expect(errosDaPeca({ ...base, preco: '', esgotado: true })).toEqual([]);
    expect(errosDaPeca({ ...base, precoPromocional: '10' })).toEqual(['O preço de promoção precisa ser menor que o preço normal.']);
  });

  it('descreve a mudança no histórico', () => {
    const antes = { peca: peca('KID-07'), categoria: 'Kids' };
    expect(descreverMudanca(null, antes, true, 'Thai')).toBe('Adicionar KID-07 pelo painel (Thai)');
    expect(descreverMudanca(antes, { peca: peca('KID-07', { preco: '20,00' }), categoria: 'Kids' }, false, 'Thai')).toBe('Alterar preço de KID-07 pelo painel (Thai)');
    expect(descreverMudanca(antes, { peca: peca('KID-07', { preco: '20,00' }), categoria: 'Kids' }, true, 'Thai')).toBe('Alterar preço e foto de KID-07 pelo painel (Thai)');
    expect(descreverMudanca(antes, { peca: peca('KID-07', { esgotado: true }), categoria: 'Kids' }, false, 'Thai')).toBe('Esgotar KID-07 pelo painel (Thai)');
  });
});
