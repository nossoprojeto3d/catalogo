import { InstagramLogo } from '@phosphor-icons/react';
import { INSTAGRAM_URL } from '../lib/config';
import { MENSAGEM_GERAL, linkWhatsapp } from '../lib/whatsapp';
import { IconeWhats } from './Botoes';

const LOGO = `${import.meta.env.BASE_URL}logo.png`;

export function Rodape() {
  return (
    <footer className="relative overflow-hidden border-t border-texto/8 pb-[max(16px,env(safe-area-inset-bottom))]">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-4 pb-12 pt-16 md:grid-cols-[1.4fr_1fr_1fr] md:px-10 md:pt-24 lg:px-16">
        <div>
          <img src={LOGO} alt="Nosso Projeto 3D" className="h-16 w-auto" width={54} height={64} loading="lazy" />
          <p className="mt-6 max-w-[28ch] text-[17px] leading-relaxed text-suave">Transformamos ideias em peças 3D personalizadas.</p>
        </div>
        <div>
          <h2 className="font-mono text-xs text-acento">Cadê a gente</h2>
          <p className="mt-4">Atendemos Goiânia e região</p>
          <p className="mt-1">Enviamos para todo o Brasil</p>
        </div>
        <div>
          <h2 className="font-mono text-xs text-acento">Fale com a gente</h2>
          <div className="mt-4 flex flex-col items-start gap-2">
            <a href={linkWhatsapp(MENSAGEM_GERAL)} target="_blank" rel="noopener" data-evento="duvida_whatsapp" data-link="rodape" className="inline-flex items-center gap-2 py-1 transition-colors hover:text-acento">
              <IconeWhats size={20} /> WhatsApp
            </a>
            <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className="inline-flex items-center gap-2 py-1 transition-colors hover:text-acento">
              <InstagramLogo size={20} weight="regular" /> @nossoprojeto3d
            </a>
          </div>
        </div>
      </div>
      {/* Assinatura gigante, de ponta a ponta da página */}
      <p aria-hidden className="titulo select-none whitespace-nowrap text-center text-[7.6vw] leading-[0.8] text-acento">
        NOSSO PROJETO 3D
      </p>
      <p className="mx-auto mt-6 max-w-[1400px] px-4 text-center text-xs text-suave">
        Catálogo digital Nosso Projeto 3D. Pedidos feitos diretamente pelo WhatsApp.
      </p>
    </footer>
  );
}
