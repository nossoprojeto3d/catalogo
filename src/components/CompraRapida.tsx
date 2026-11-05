import { ShoppingBag, X } from '@phosphor-icons/react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Drawer } from 'vaul';
import type { Produto } from '../lib/catalogo';
import { useDesktop } from '../hooks/useTela';
import { useLista } from '../store/lista';
import { useUI } from '../store/ui';
import { Botao, BotaoIcone } from './Botoes';
import { Preco } from './CardProduto';
import { SeletorCor, SeletorQuantidade, useEscolha } from './Escolhas';

function Conteudo({ produto, fechar }: { produto: Produto; fechar: () => void }) {
  const brindes = useUI((s) => s.pagina.tipo === 'brindes');
  const setLista = useUI((s) => s.setListaAberta);
  const adicionar = useLista((s) => s.adicionar);
  const escolha = useEscolha(produto, brindes ? 10 : 1);

  const colocar = () => {
    if (escolha.faltaCor) return escolha.setPedirCor(true);
    adicionar(produto, escolha.quantidade, escolha.cor);
    fechar();
    toast('Colocado na sacola', {
      description: `${escolha.quantidade} x ${produto.nome}${escolha.cor ? `, ${escolha.cor}` : ''}`,
      action: { label: 'Ver sacola', onClick: () => setLista(true) },
    });
  };

  return (
    <div className="space-y-5 overflow-y-auto overscroll-contain px-5 pb-[max(20px,env(safe-area-inset-bottom))]">
      <Preco produto={produto} />
      {produto.cores.length > 0 && <SeletorCor produto={produto} escolha={escolha} />}
      <SeletorQuantidade produto={produto} escolha={escolha} />
      <Botao onClick={colocar} icone={<ShoppingBag size={20} />} className="w-full">
        Colocar na sacola, {escolha.textoTotal}
      </Botao>
    </div>
  );
}

// Painel que sobe por cima da lista: escolhe e segue navegando.
export function CompraRapida() {
  const produto = useUI((s) => s.compraRapida);
  const setCompra = useUI((s) => s.setCompraRapida);
  const desktop = useDesktop();
  const fechar = () => setCompra(null);
  // Mantém o último produto durante a animação de saída.
  const [exibido, setExibido] = useState<Produto | null>(produto);
  useEffect(() => { if (produto) setExibido(produto); }, [produto]);

  return (
    <Drawer.Root open={!!produto} onOpenChange={(v) => !v && fechar()} direction={desktop ? 'right' : 'bottom'}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50" />
        <Drawer.Content
          aria-describedby={undefined}
          className={`fixed z-50 flex flex-col bg-fundo outline-none ${desktop ? 'inset-y-0 right-0 w-[440px]' : 'inset-x-0 bottom-0 max-h-[92dvh] rounded-t-3xl'}`}
        >
          {!desktop && <div className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-texto/20" aria-hidden />}
          <div className="flex items-start justify-between gap-3 px-5 pb-2 pt-3">
            <Drawer.Title className="titulo pt-2.5 text-[22px]">{exibido?.nome}</Drawer.Title>
            <BotaoIcone onClick={fechar} aria-label="Fechar" className="-mr-2 shrink-0"><X size={22} /></BotaoIcone>
          </div>
          {exibido && <Conteudo produto={exibido} fechar={fechar} />}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
