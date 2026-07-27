// components/ui/Modal.tsx — diálogo acessível, sem dependência externa.
// @version 1.0.0  @created 2026-07-20
// Radix seria o padrão do projeto, mas não está instalado; um diálogo enxuto
// (overlay, Esc, foco inicial, clique-fora, role=dialog) resolve os formulários
// de escrita sem inflar o bundle.
import { useEffect, useRef, type JSX, type ReactNode } from 'react';
import { Icone } from './Icone';
import css from './Modal.module.css';

export function Modal({ titulo, aberto, aoFechar, children, largura = 560 }: {
  titulo: string; aberto: boolean; aoFechar: () => void; children: ReactNode; largura?: number;
}): JSX.Element | null {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoTecla = (e: KeyboardEvent): void => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', aoTecla);
    // Foco no primeiro campo — teclado entra direto no formulário.
    const t = setTimeout(() => {
      const alvo = caixa.current?.querySelector<HTMLElement>('input, select, textarea, button');
      alvo?.focus();
    }, 40);
    return () => { document.removeEventListener('keydown', aoTecla); clearTimeout(t); };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className={css.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <div className={css.caixa} style={{ maxWidth: largura }} ref={caixa}
           role="dialog" aria-modal="true" aria-label={titulo}>
        <header className={css.topo}>
          <h3 className={css.titulo}>{titulo}</h3>
          <button type="button" className={css.fechar} onClick={aoFechar} aria-label="Fechar">
            <Icone nome="X" size={16} />
          </button>
        </header>
        <div className={css.corpo}>{children}</div>
      </div>
    </div>
  );
}
