import { InstagramLogo } from '@phosphor-icons/react';
import { INSTAGRAM_URL } from '../lib/config';
import { MENSAGEM_GERAL, linkWhatsapp } from '../lib/whatsapp';
import { Camadas, IconeWhats, Logo } from './Botoes';

export function Rodape() {
  return (
    <footer className="relative mt-12 overflow-hidden bg-barra pb-[calc(58px+env(safe-area-inset-bottom))] text-sobre-barra md:mt-16 md:pb-0">
      <Camadas canto="cima" className="opacity-30" />
      <div className="relative mx-auto grid max-w-[1240px] gap-6 px-4 py-8 md:grid-cols-3 md:px-6 md:py-12">
        <div className="flex items-center gap-3">
          <Logo className="h-12" />
          <p className="titulo text-[18px]">Nosso Projeto 3D</p>
        </div>
        <div className="text-[15px]">
          <p>Atendemos Goiânia e região</p>
          <p className="mt-1">Enviamos para todo o Brasil</p>
        </div>
        <div className="flex flex-col items-start gap-1 text-[15px] font-medium">
          <a href={linkWhatsapp(MENSAGEM_GERAL)} target="_blank" rel="noopener" data-evento="duvida_whatsapp" data-link="rodape" className="inline-flex min-h-11 items-center gap-2">
            <IconeWhats /> WhatsApp
          </a>
          <a href={INSTAGRAM_URL} target="_blank" rel="noopener" className="inline-flex min-h-11 items-center gap-2">
            <InstagramLogo size={20} /> @nossoprojeto3d
          </a>
        </div>
      </div>
    </footer>
  );
}
