// "Voar pra sacola": uma cópia da foto do produto sai de onde está, faz
// um arco e encolhe até o botão da sacola no menu; ao chegar, a sacola
// pula e solta uma onda limão. Mostra pro cliente onde a lista fica.

export const ID_SACOLA = 'botao-sacola';

const semMovimento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function pularSacola(sacola: HTMLElement) {
  sacola.animate(
    [{ transform: 'scale(1)' }, { transform: 'scale(1.22)' }, { transform: 'scale(0.92)' }, { transform: 'scale(1)' }],
    { duration: 520, easing: 'cubic-bezier(0.32, 0.72, 0, 1)' },
  );
  if (semMovimento()) return;
  // Onda: um anel limão que cresce e some a partir da sacola.
  const r = sacola.getBoundingClientRect();
  const onda = document.createElement('span');
  Object.assign(onda.style, {
    position: 'fixed',
    left: `${r.left}px`,
    top: `${r.top}px`,
    width: `${r.width}px`,
    height: `${r.height}px`,
    borderRadius: '999px',
    border: '2px solid #c6f432',
    pointerEvents: 'none',
    zIndex: '70',
  });
  document.body.appendChild(onda);
  onda
    .animate([{ transform: 'scale(1)', opacity: 0.9 }, { transform: 'scale(2.4)', opacity: 0 }], {
      duration: 650,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    })
    .finished.finally(() => onda.remove());
}

// Resolve quando a foto chega na sacola: é a hora de somar o item, pro
// contador subir junto com o pulo.
export function voarParaSacola(origem: HTMLElement | null): Promise<void> {
  const sacola = document.getElementById(ID_SACOLA);
  if (!sacola) return Promise.resolve();
  // A foto principal (na tela do produto há também o fundo desfocado).
  const foto = origem?.querySelector<HTMLImageElement>('img[data-principal]');
  if (!origem || !foto || !foto.complete || semMovimento()) {
    pularSacola(sacola);
    return Promise.resolve();
  }

  const de = origem.getBoundingClientRect();
  const para = sacola.getBoundingClientRect();
  const copia = foto.cloneNode() as HTMLImageElement;
  copia.removeAttribute('class');
  copia.alt = '';
  copia.setAttribute('aria-hidden', 'true');
  Object.assign(copia.style, {
    position: 'fixed',
    left: `${de.left}px`,
    top: `${de.top}px`,
    width: `${de.width}px`,
    height: `${de.height}px`,
    objectFit: 'contain',
    borderRadius: '24px',
    pointerEvents: 'none',
    zIndex: '70',
    boxShadow: '0 20px 50px -10px rgb(0 0 0 / 0.6)',
    willChange: 'transform, opacity',
  });
  document.body.appendChild(copia);

  // Deslocamento do centro da foto até o centro da sacola, com um arco pra cima.
  const dx = para.left + para.width / 2 - (de.left + de.width / 2);
  const dy = para.top + para.height / 2 - (de.top + de.height / 2);
  const escalaFinal = Math.max(para.width / de.width, 0.04);
  const arco = Math.min(-60, dy * 0.25 - 80);

  // Encolhe logo no começo (parece "entrar" na sacola) e acelera no fim.
  return copia
    .animate(
      [
        // A curva de cada quadro vale pro trecho que começa nele.
        { transform: 'translate(0, 0) scale(1)', opacity: 1, borderRadius: '24px', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' },
        { transform: `translate(${dx * 0.3}px, ${dy * 0.3 + arco}px) scale(0.38)`, opacity: 1, borderRadius: '48px', offset: 0.4, easing: 'cubic-bezier(0.55, 0, 1, 0.45)' },
        { transform: `translate(${dx}px, ${dy}px) scale(${escalaFinal})`, opacity: 0.4, borderRadius: '999px' },
      ],
      { duration: 760, fill: 'forwards' },
    )
    .finished.then(() => pularSacola(sacola))
    .catch(() => {})
    .finally(() => copia.remove());
}
