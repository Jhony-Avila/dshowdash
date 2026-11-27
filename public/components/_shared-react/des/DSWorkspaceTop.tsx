// _shared-react/des/DSWorkspaceTop.tsx — DES · o ÚNICO bloco travado do topo de uma tela (contrato espacial aprovado pelo Jhony, 26/11 13:44).
// ROXO (CIMA), portado do Lab (src/des/layout). Linha 1 (36 px): título + trilha + navegação da seção. Linha 2 (48 px): controles.
// Fica preso logo ABAIXO da faixa fixa do shell (cabeçalho + ticker), medida como na P51 — sem mexer em nenhum ancestral (UX01).
import { useEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import './ds-layout.css';

export interface DSWorkspaceTopProps {
  titulo: string; icone?: ReactNode; trilha?: ReactNode; nav?: { rotulo: string; atual?: boolean; onClick?: () => void }[];
  controles?: ReactNode; dados?: Record<`data-${string}`, string | undefined>;
  /** INT-UX-001 §10 (27/11): o shell já mostra o título do destino → o h1 fica só para leitor de tela (sem título duplicado na tela) */
  tituloOculto?: boolean;
}
/** `top` do sticky = quanto da faixa fixa do shell (cabeçalho + ticker, a conta da P51) cobre o CONTÊINER QUE ROLA.
 *  27/11 (capturas do Panorama DES): o sticky conta a partir do ancestral que rola, não da janela. No Dash esse ancestral é o miolo do painel,
 *  que já começa ABAIXO da faixa → somar a faixa inteira empurrava o cabeçalho ~84 px para baixo, por cima da faixa de KPI (Integrações). */
function useTopoSticky(ref: RefObject<HTMLElement | null>): number {
  const [t, setT] = useState(0);
  useEffect(() => {
    const medir = () => {
      const faixa = Math.max(0, ...[...document.querySelectorAll('.dsd-shell__region--header, .dsd-shell__region--ticker')]
        .map((e) => { const r = e.getBoundingClientRect(); return getComputedStyle(e).position === 'fixed' && r.height > 0 ? r.bottom : 0; }));
      let p = ref.current?.parentElement ?? null;
      while (p && p !== document.body && p !== document.documentElement) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|overlay)/.test(cs.overflowY + ' ' + cs.overflowX)) break; p = p.parentElement; }
      const base = p && p !== document.body && p !== document.documentElement ? p.getBoundingClientRect().top + p.clientTop : 0;
      setT(Math.max(0, Math.round(faixa - base)));
    };
    medir(); window.addEventListener('resize', medir); return () => window.removeEventListener('resize', medir);
  }, [ref]);
  return t;
}
export function DSWorkspaceTop({ titulo, icone, trilha, nav, controles, dados, tituloOculto }: DSWorkspaceTopProps) {
  const ref = useRef<HTMLElement | null>(null); const topo = useTopoSticky(ref);
  return (
    <header ref={ref} className="des-wt" style={{ top: topo }} data-des-wt {...dados}>
      {tituloOculto && !trilha && !(nav && nav.length) ? <h1 className="des-sr">{titulo}</h1> : <div className="des-wt__local">
        {tituloOculto ? <h1 className="des-sr">{titulo}</h1> : <h1 className="des-wt__titulo">{icone}{titulo}</h1>}
        {trilha && <span className="des-wt__trilha">{trilha}</span>}
        {nav && nav.length > 0 && (
          <nav className="des-wt__nav" aria-label={`Seções de ${titulo}`}>
            {nav.map((n) => <button key={n.rotulo} type="button" aria-current={n.atual ? 'page' : undefined} onClick={n.onClick}>{n.rotulo}</button>)}
          </nav>
        )}
      </div>}
      {controles && <div className="des-wt__controles" data-titulo={titulo}>{controles}</div>}
    </header>
  );
}
