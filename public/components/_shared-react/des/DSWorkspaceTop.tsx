// _shared-react/des/DSWorkspaceTop.tsx — DES · o ÚNICO bloco travado do topo de uma tela (contrato espacial aprovado pelo Jhony, 26/11 13:44).
// ROXO (CIMA), portado do Lab (src/des/layout). Linha 1 (36 px): título + trilha + navegação da seção. Linha 2 (48 px): controles.
// Fica preso logo ABAIXO da faixa fixa do shell (cabeçalho + ticker), medida como na P51 — sem mexer em nenhum ancestral (UX01).
import { useEffect, useState, type ReactNode } from 'react';
import './ds-layout.css';

export interface DSWorkspaceTopProps {
  titulo: string; icone?: ReactNode; trilha?: ReactNode; nav?: { rotulo: string; atual?: boolean; onClick?: () => void }[];
  controles?: ReactNode; dados?: Record<`data-${string}`, string | undefined>;
}
/** Altura da faixa fixa do shell (cabeçalho + ticker), a mesma conta da P51. */
function useFaixaShell(): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    const medir = () => setT(Math.max(0, ...[...document.querySelectorAll('.dsd-shell__region--header, .dsd-shell__region--ticker')]
      .map((e) => { const r = e.getBoundingClientRect(); return getComputedStyle(e).position === 'fixed' && r.height > 0 ? r.bottom : 0; })));
    medir(); window.addEventListener('resize', medir); return () => window.removeEventListener('resize', medir);
  }, []);
  return t;
}
export function DSWorkspaceTop({ titulo, icone, trilha, nav, controles, dados }: DSWorkspaceTopProps) {
  const topo = useFaixaShell();
  return (
    <header className="des-wt" style={{ top: topo }} data-des-wt {...dados}>
      <div className="des-wt__local">
        <h1 className="des-wt__titulo">{icone}{titulo}</h1>
        {trilha && <span className="des-wt__trilha">{trilha}</span>}
        {nav && nav.length > 0 && (
          <nav className="des-wt__nav" aria-label={`Seções de ${titulo}`}>
            {nav.map((n) => <button key={n.rotulo} type="button" aria-current={n.atual ? 'page' : undefined} onClick={n.onClick}>{n.rotulo}</button>)}
          </nav>
        )}
      </div>
      {controles && <div className="des-wt__controles" data-titulo={titulo}>{controles}</div>}
    </header>
  );
}
