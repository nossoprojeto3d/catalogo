import { describe, expect, it } from 'vitest';
import { corDaBolinha } from './cores';

describe('corDaBolinha', () => {
  it('nome composto ganha da primeira palavra', () => {
    expect(corDaBolinha('Vermelho Bordô')).not.toBe(corDaBolinha('Vermelho'));
    expect(corDaBolinha('vermelho bordo')).toBe(corDaBolinha('Vermelho Bordô'));
    expect(corDaBolinha('Verde Militar')).not.toBe(corDaBolinha('Verde'));
    expect(corDaBolinha('Azul Marinho')).not.toBe(corDaBolinha('Azul'));
  });
  it('acha pelo começo ou por qualquer palavra conhecida', () => {
    expect(corDaBolinha('Verde militar fosco')).toBe(corDaBolinha('Verde Militar'));
    expect(corDaBolinha('Tom bordô')).toBe(corDaBolinha('Bordô'));
    expect(corDaBolinha('Azul-marinho')).toBe(corDaBolinha('Azul Marinho'));
  });
  it('nome desconhecido cai no neutro', () => {
    expect(corDaBolinha('xyz')).toBe('#9A948A');
  });
});
