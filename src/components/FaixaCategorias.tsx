import { Asterisk } from '@phosphor-icons/react';
import { medir } from '../lib/medicao';
import { rolarAte } from '../hooks/useRolagemSuave';
import { useUI } from '../store/ui';

// Faixa limão com as categorias correndo (a única faixa assim na página).
// Cada nome é um atalho: escolhe a categoria e desce até o catálogo.
export function FaixaCategorias() {
  const categorias = useUI((s) => s.categorias);
  const setAtiva = useUI((s) => s.setCategoriaAtiva);
  if (categorias.length === 0) return null;

  const ir = (nome: string) => {
    setAtiva(nome);
    medir('categoria_aberta', { categoria: nome, local: 'faixa' });
    rolarAte('#catalogo');
  };

  // Duas cópias lado a lado: a animação anda metade e recomeça sem emenda.
  const itens = [...categorias, ...categorias];
  return (
    // O recorte de fora segura a faixa inclinada: nada vaza pro lado.
    <div className="overflow-hidden py-6">
      <nav aria-label="Categorias" className="relative -mx-4 -rotate-[1.5deg] overflow-hidden bg-acento py-3 text-fundo md:py-4">
        <ul className="faixa flex w-max items-center">
          {itens.map((c, i) => (
            <li key={`${c.nome}-${i}`} className="flex items-center" aria-hidden={i >= categorias.length}>
              <button
                type="button"
                tabIndex={i >= categorias.length ? -1 : 0}
                onClick={() => ir(c.nome)}
                className="titulo px-5 text-[clamp(1.4rem,4vw,2.4rem)] leading-none transition-opacity hover:opacity-60"
              >
                {c.nome}
              </button>
              <Asterisk size={22} weight="bold" aria-hidden />
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
