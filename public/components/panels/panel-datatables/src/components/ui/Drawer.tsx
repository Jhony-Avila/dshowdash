// components/ui/Drawer.tsx — painel lateral deslizante (Elevação visual §12).
// @version 1.0.0  @created 2026-07-21
// Abre pela direita: detalhe rico SEM sair da listagem. Overlay, Esc, foco
// inicial, clique-fora. Mesma linguagem do Modal, mas lateral.
import { useEffect, useRef, type JSX, type ReactNode } from 'react';
import { Icone } from './Icone';
import css from './Drawer.module.css';

export function Drawer({ aberto, aoFechar, titulo, subtitulo, icone, acoes, largura = 560, children }: {
  aberto: boolean; aoFechar: () => void; titulo: string; subtitulo?: string; icone?: string;
  acoes?: ReactNode; largura?: number; children: ReactNode;
}): JSX.Element | null {
  const painel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;
    const aoTecla = (e: KeyboardEvent): void => { if (e.key === 'Escape') aoFechar(); };
    document.addEventListener('keydown', aoTecla);
    const t = setTimeout(() => painel.current?.querySelector<HTMLElement>('button, a, input')?.focus(), 60);
    return () => { document.removeEventListener('keydown', aoTecla); clearTimeout(t); };
  }, [aberto, aoFechar]);

  if (!aberto) return null;

  return (
    <div className={css.overlay} onMouseDown={(e) => { if (e.target === e.currentTarget) aoFechar(); }}>
      <aside className={css.painel} style={{ maxWidth: largura }} ref={painel}
             role="dialog" aria-modal="true" aria-label={titulo}>
        <header className={css.topo}>
          {icone && <span className={css.icone}><Icone nome={icone} size={18} /></span>}
          <div className={css.tituloBloco}>
            <h3 className={css.titulo}>{titulo}</h3>
            {subtitulo && <span className={css.subtitulo}>{subtitulo}</span>}
          </div>
          {acoes && <div className={css.acoes}>{acoes}</div>}
          <button type="button" className={css.fechar} onClick={aoFechar} aria-label="Fechar">
            <Icone nome="X" size={17} />
          </button>
        </header>
        <div className={css.corpo}>{children}</div>
      </aside>
    </div>
  );
}

/** Seção padronizada dentro do drawer. */
export function DrawerSecao({ titulo, icone, contagem, children }: {
  titulo: string; icone?: string; contagem?: number; children: ReactNode;
}): JSX.Element {
  return (
    <section className={css.secao}>
      <h4 className={css.secaoTitulo}>
        {icone && <Icone nome={icone} size={14} />} {titulo}
        {contagem !== undefined && <span className={css.secaoContagem}>{contagem}</span>}
      </h4>
      {children}
    </section>
  );
}
