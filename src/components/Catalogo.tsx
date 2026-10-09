import { useEffect, useMemo, useRef, useState } from 'react';
import { ordenarProdutos } from '../lib/catalogo';
import { TAMANHO_LOTE } from '../lib/config';
import { MENSAGEM_GERAL, linkWhatsapp } from '../lib/whatsapp';
import { TODAS, useUI } from '../store/ui';
import { BotaoLink, IconeWhats } from './Botoes';
import { CardEsqueleto, CardProduto } from './CardProduto';
import { SeletorCategorias } from './Categorias';

export function Catalogo() {
  const categorias = useUI((s) => s.categorias);
  const status = useUI((s) => s.status);
  const ativa = useUI((s) => s.categoriaAtiva);
  const [quantos, setQuantos] = useState(TAMANHO_LOTE);
  const sentinela = useRef<HTMLDivElement>(null);

  const produtos = useMemo(() => {
    if (ativa === TODAS) return ordenarProdutos(categorias.flatMap((c) => c.produtos));
    return categorias.find((c) => c.nome === ativa)?.produtos ?? [];
  }, [categorias, ativa]);

  // Trocar de categoria volta pro primeiro lote.
  useEffect(() => setQuantos(TAMANHO_LOTE), [ativa]);

  // Rolagem infinita: o sentinela no fim da grade puxa mais 6. O observer
  // é refeito a cada lote, então nunca fica "travado" depois de trocar de
  // categoria (bug da versão anterior).
  const temMais = quantos < produtos.length;
  useEffect(() => {
    if (!temMais || !sentinela.current) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setQuantos((q) => q + TAMANHO_LOTE); },
      { rootMargin: '600px 0px' },
    );
    obs.observe(sentinela.current);
    return () => obs.disconnect();
  }, [temMais, quantos, ativa]);

  return (
    <section id="catalogo" className="mx-auto max-w-[1400px] px-4 pb-24 pt-8 md:px-10 md:pb-32 lg:px-16">
      <div className="flex items-end justify-between gap-4">
        <h2 className="titulo text-[clamp(2.2rem,8vw,5rem)]">Catálogo</h2>
        {status === 'pronto' && (
          <p className="pb-1 font-mono text-xs text-suave">{produtos.length} peças</p>
        )}
      </div>

      {status === 'erro' ? (
        <div className="mt-10 rounded-[2rem] bg-texto/[0.03] p-1.5 ring-1 ring-texto/6">
          <div className="pontos rounded-[calc(2rem-0.375rem)] bg-superficie px-6 py-14 text-center md:py-20">
            <h3 className="titulo text-3xl">Estamos ajustando o catálogo</h3>
            <p className="mx-auto mt-3 max-w-[44ch] text-suave">
              Enquanto isso, fale direto com a gente pelo WhatsApp que te ajudamos na hora.
            </p>
            <BotaoLink
              href={linkWhatsapp(MENSAGEM_GERAL)}
              target="_blank"
              rel="noopener"
              icone={<IconeWhats />}
              className="mt-8"
              data-evento="duvida_whatsapp"
              data-link="manutencao"
            >
              Chamar no WhatsApp
            </BotaoLink>
          </div>
        </div>
      ) : (
        <>
          {status === 'pronto' && <SeletorCategorias />}
          <ul className="mt-4 grid grid-cols-2 gap-x-2.5 gap-y-3 md:grid-cols-3 md:gap-x-4 md:gap-y-6 xl:grid-cols-4">
            {status === 'carregando'
              ? Array.from({ length: 6 }, (_, i) => <CardEsqueleto key={i} />)
              : produtos.slice(0, quantos).map((p, i) => (
                  <CardProduto key={`${ativa}-${p.categoria}-${p.codigo || p.nome}`} produto={p} indice={i} />
                ))}
          </ul>
          {temMais && (
            <div ref={sentinela} className="mt-6 grid grid-cols-2 gap-2.5 md:grid-cols-3 md:gap-4 xl:grid-cols-4" aria-hidden>
              <div className="esqueleto aspect-square rounded-3xl opacity-60" />
              <div className="esqueleto aspect-square rounded-3xl opacity-60" />
            </div>
          )}
        </>
      )}
    </section>
  );
}
