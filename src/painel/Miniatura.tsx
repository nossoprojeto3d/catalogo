import { ImageSquare } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';

// Foto recém-salva pode ainda não estar publicada: o erro mostra o lugar vazio, não um ícone quebrado.
export function Miniatura({ url, className }: { url: string | null; className: string }) {
  const [falhou, setFalhou] = useState(false);
  useEffect(() => setFalhou(false), [url]);
  return (
    <span className={`grid place-items-center overflow-hidden bg-superficie-2 text-suave ${className}`}>
      {url && !falhou
        ? <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFalhou(true)} className="size-full object-cover" />
        : <ImageSquare size={24} aria-hidden />}
    </span>
  );
}
