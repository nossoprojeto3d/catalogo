import { useState } from 'react';
import { Cube } from '@phosphor-icons/react';
import type { Produto } from '../lib/catalogo';
import { urlFoto } from '../lib/fotos';

// Sem foto (ou se o link da coluna Foto falhar), mostra "Foto em breve"
// no lugar de imagem quebrada.
//
// inteira: a foto aparece sempre completa, sem recorte. O espaço que sobrar
// (foto fora do formato do quadro) é preenchido pela própria foto desfocada.
// Usado na tela do produto, onde o cliente decide a compra.
export function FotoProduto({
  produto,
  className = '',
  prioridade = false,
  tamanhos = '(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 46vw',
  decorativa = false,
  inteira = false,
}: {
  produto: Produto;
  className?: string;
  prioridade?: boolean;
  tamanhos?: string;
  // true quando o nome do produto já aparece em texto ao lado da foto
  decorativa?: boolean;
  inteira?: boolean;
}) {
  const url = urlFoto(produto);
  const [falhou, setFalhou] = useState<string | null>(null);
  const [carregou, setCarregou] = useState(false);
  const semFoto = !url || falhou === url;

  if (semFoto) {
    return (
      <div className={`pontos flex h-full w-full flex-col items-center justify-center gap-2 bg-superficie-2 text-suave ${className}`}>
        <Cube size={28} weight="light" />
        <span className="text-xs">Foto em breve</span>
      </div>
    );
  }

  const principal = (
    <img
      key={url}
      data-principal
      src={url}
      alt={decorativa ? '' : produto.nome}
      sizes={tamanhos}
      loading={prioridade ? 'eager' : 'lazy'}
      decoding="async"
      onLoad={() => setCarregou(true)}
      onError={() => setFalhou(url)}
      className={`h-full w-full ${inteira ? 'relative object-contain' : 'object-cover'} transition-[opacity,filter,scale] duration-700 ease-(--ease-saida) ${
        carregou ? 'opacity-100 blur-0' : 'opacity-0 blur-md'
      } ${produto.esgotado ? 'grayscale-[0.7]' : ''} ${className}`}
    />
  );

  if (!inteira) return principal;
  return (
    <>
      <img
        src={url}
        alt=""
        aria-hidden
        decoding="async"
        className={`absolute inset-0 h-full w-full scale-110 object-cover opacity-60 blur-2xl ${produto.esgotado ? 'grayscale-[0.7]' : ''}`}
      />
      {principal}
    </>
  );
}
