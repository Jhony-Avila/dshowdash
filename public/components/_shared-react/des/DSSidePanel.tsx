// _shared-react/des/DSSidePanel.tsx — DES · LIB-03 · painel lateral compartilhado (VERDE · ACIMA_DIREITA, 27/11/2026).
// EVOLUÇÃO do Drawer de _shared-react/components/Primitivos.tsx (que passa a delegar para cá): NÃO é uma segunda infraestrutura.
// Referência visual: Untitled UI "Slideout menu" (cabeçalho fixo com título/subtítulo/estado + fechar, corpo com rolagem própria, rodapé de
// ações), só como REFERÊNCIA — nenhum código premium copiado (licença não confirmada). Tokens DES (--des-*, --bl-*), CSS próprio, sem Tailwind.
// O componente cuida SÓ de estrutura e interação; dados e ações ficam no módulo que o usa (CB-UX-001: Cobranças).
// Interação (CB-UX-AC10/AC11): foco inicial no título; Esc fecha; retorno do foco ao elemento de origem; no modo `modal` o foco fica contido
// e há véu opaco; no modo `nao-modal` a tela de trás continua utilizável (a grade não perde filtro, ordenação, seleção nem rolagem); começa
// abaixo da faixa fixa do shell; 520 px no desktop, a largura toda no celular; estados carregando / erro / indisponível independentes.
import React from 'react';
import './ds-side-panel.css';

export type DSSidePanelModo = 'modal' | 'nao-modal';
export interface DSSidePanelProps {
  aberto: boolean;
  titulo: React.ReactNode;
  /** texto acessível do título quando `titulo` não é texto puro */
  rotuloTitulo?: string;
  subtitulo?: React.ReactNode;
  /** estado relevante ao lado do título (ex.: "Negativação pedida"); sempre com texto, nunca só cor */
  estado?: React.ReactNode;
  aoFechar: () => void;
  modo?: DSSidePanelModo;
  /** largura no desktop (px); no celular ocupa a largura disponível */
  largura?: number;
  rodape?: React.ReactNode;
  carregando?: boolean;
  /** conteúdo do estado de erro (ex.: <Problema …/>); tem prioridade sobre children */
  erro?: React.ReactNode;
  /** conteúdo do estado "indisponível" (fonte fora, sem permissão) */
  indisponivel?: React.ReactNode;
  /** elemento que recebe o foco ao fechar (padrão: o que tinha o foco ao abrir) */
  retornarFocoPara?: HTMLElement | null;
  /** começar abaixo da faixa fixa do shell (cabeçalho/ticker) — padrão true */
  abaixoDoShell?: boolean;
  rotuloFechar?: string;
  className?: string;
  id?: string;
  children?: React.ReactNode;
  /** atributo de teste/rastreio na raiz (ex.: data-cv-detalhe) */
  dados?: Record<string, string>;
}

const FOCAVEIS = 'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** Altura da faixa fixa do shell (cabeçalho + ticker), medida — o painel nunca fica por baixo dela. */
function topoDoShell(): number {
  if (typeof document === 'undefined') return 0;
  return Math.max(0, ...[...document.querySelectorAll('.dsd-shell__region--header, .dsd-shell__region--ticker')]
    .map((e) => { const q = e.getBoundingClientRect(); return getComputedStyle(e).position === 'fixed' && q.height > 0 ? q.bottom : 0; }));
}

let pilha: symbol[] = [];   // painéis abertos: só o do topo responde ao Esc

export function DSSidePanel({
  aberto, titulo, rotuloTitulo, subtitulo, estado, aoFechar, modo = 'modal', largura = 520, rodape, carregando = false, erro, indisponivel,
  retornarFocoPara, abaixoDoShell = true, rotuloFechar = 'Fechar', className, id, children, dados,
}: DSSidePanelProps) {
  const raiz = React.useRef<HTMLDivElement>(null);
  const tit = React.useRef<HTMLHeadingElement>(null);
  const eu = React.useRef(Symbol('ds-side-panel'));
  const fechar = React.useRef(aoFechar); fechar.current = aoFechar;
  const idBase = React.useId(); const idTit = `${id ?? idBase}-titulo`; const idSub = `${id ?? idBase}-sub`;
  const [topo, setTopo] = React.useState(0);

  React.useLayoutEffect(() => { if (aberto && abaixoDoShell) setTopo(topoDoShell()); }, [aberto, abaixoDoShell]);

  React.useEffect(() => {
    if (!aberto) return;
    let antes = (retornarFocoPara ?? (document.activeElement as HTMLElement | null));
    const meu = eu.current; pilha = [...pilha, meu];
    tit.current?.focus({ preventScroll: true });
    // não modal: a tela de trás continua utilizável — o retorno vai para o ÚLTIMO elemento focado fora do painel (ex.: outra linha da grade)
    const onFocusIn = (e: FocusEvent) => { const t = e.target as HTMLElement | null; if (!retornarFocoPara && modo === 'nao-modal' && t && raiz.current && !raiz.current.contains(t)) antes = t; };
    const onKey = (e: KeyboardEvent) => {
      if (pilha[pilha.length - 1] !== meu) return;
      if (e.key === 'Escape') { e.stopPropagation(); fechar.current(); return; }
      if (modo === 'modal' && e.key === 'Tab' && raiz.current) {   // contenção de foco só no modal: cicla entre os tabuláveis do painel
        const f = [...raiz.current.querySelectorAll<HTMLElement>(FOCAVEIS)].filter((x) => x.offsetParent !== null);
        if (!f.length) { e.preventDefault(); tit.current?.focus(); return; }
        const a = document.activeElement as HTMLElement | null; const i = a ? f.indexOf(a) : -1;
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }          // do 1º (ou do título/fora) volta para o último
        else if (!e.shiftKey && (i === -1 || i === f.length - 1)) { e.preventDefault(); f[i === -1 ? 0 : 0].focus(); }   // do último (ou do título/fora) vai para o 1º
      }
    };
    document.addEventListener('focusin', onFocusIn, true);
    document.addEventListener('keydown', onKey, true);
    return () => {
      document.removeEventListener('keydown', onKey, true); document.removeEventListener('focusin', onFocusIn, true); pilha = pilha.filter((x) => x !== meu);
      if (antes && document.contains(antes)) antes.focus({ preventScroll: true });   // retorno ao registro de origem, sem rolar a tela
    };
  }, [aberto, modo, retornarFocoPara]);

  if (!aberto) return null;
  const corpo = erro ? <div className="ds-sp__estado" data-ds-sp-estado="erro">{erro}</div>
    : indisponivel ? <div className="ds-sp__estado" data-ds-sp-estado="indisponivel">{indisponivel}</div>
    : carregando ? <div className="ds-sp__estado" data-ds-sp-estado="carregando" aria-busy="true"><span className="des-osso ds-sp__osso" style={{ width: '62%' }} /><span className="des-osso ds-sp__osso" style={{ width: '40%' }} /><span className="des-osso ds-sp__osso" style={{ width: '78%' }} /></div>
    : children;
  const estilo = { '--ds-sp-largura': `${largura}px`, '--ds-sp-topo': `${topo}px` } as React.CSSProperties;
  return (
    <>
      {modo === 'modal' && <div className="ds-sp__veu" style={estilo} onClick={() => fechar.current()} aria-hidden="true" data-ds-sp-veu="" />}
      <div ref={raiz} id={id} role="dialog" aria-modal={modo === 'modal'} aria-labelledby={idTit} aria-describedby={subtitulo ? idSub : undefined}
        className={`des-escopo ds-sp ds-sp--${modo}${className ? ` ${className}` : ''}`} style={estilo} data-ds-side-panel={modo} {...(dados ?? {})}>
        <header className="ds-sp__cab">
          <div className="ds-sp__titulos">
            <h2 id={idTit} ref={tit} tabIndex={-1} className="ds-sp__titulo" aria-label={rotuloTitulo}>{titulo}</h2>
            {(subtitulo || estado) && (
              <div className="ds-sp__linha2">
                {subtitulo && <p id={idSub} className="ds-sp__sub">{subtitulo}</p>}
                {estado && <span className="ds-sp__estado-chip" data-ds-sp-chip="">{estado}</span>}
              </div>
            )}
          </div>
          <button type="button" className="ds-sp__fechar" onClick={() => fechar.current()} aria-label={rotuloFechar} data-ds-sp-fechar="">
            <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false"><path d="M18 6 6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" /></svg>
          </button>
        </header>
        <div className="ds-sp__corpo" data-ds-sp-corpo="">{corpo}</div>
        {rodape && <footer className="ds-sp__rodape" data-ds-sp-rodape="">{rodape}</footer>}
      </div>
    </>
  );
}

export default DSSidePanel;
