import { useEffect, useRef, useState, type ReactNode } from 'react';

// Acordeão de uma seção na lista (mesma linguagem visual do Section do editor: chevron rotaciona,
// barra roxa quando aberto). Header próprio (não é o Section literal) porque precisa dos botões
// Ativar/Excluir ao lado (não dá p/ aninhar <button> dentro do <button> do Section) e de animação
// de altura. O corpo (edição inline) é montado SÓ quando abre (lazy) e desmontado ao colapsar —
// assim os previews (iframes) nunca carregam 38 de uma vez.
export function SectionAccordion({ section, onToggleActive, onRemove, children }:
  { section: any; onToggleActive: () => void; onRemove: () => void; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [render, setRender] = useState(false); // corpo montado no DOM (lazy + anim de saída)
  const rootRef = useRef<HTMLDivElement>(null);
  const timer = useRef<any>(null);
  const active = Number(section.is_active) === 1;

  function toggle() {
    if (open) {
      setOpen(false); // remove is-open -> grid 1fr→0fr anima; desmonta o corpo após a transição
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setRender(false), 220);
    } else {
      clearTimeout(timer.current);
      setRender(true); // monta o corpo (grid ainda 0fr)
      // 2 frames depois liga is-open -> anima 0fr→1fr; rola p/ ficar visível
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setOpen(true);
        rootRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }));
    }
  }
  useEffect(() => () => clearTimeout(timer.current), []);
  const bodyId = 'k-acc-body-' + section.id;

  // células da linha (cols 2..6) — clicar expande (conveniência de mouse; o teclado usa o chevron-button)
  return (
    <div ref={rootRef} className={'k-acc' + (open ? ' is-open' : '')}>
      <div className="k-acc-head">
        <button type="button" className="k-acc-caret" onClick={toggle} aria-expanded={open} aria-controls={bodyId}
          aria-label={(open ? 'Recolher' : 'Expandir') + ' seção ' + section.name}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </button>
        <span className="k-acc-cell k-acc-num" onClick={toggle}>{section.display_order}</span>
        <span className="k-acc-cell k-acc-name" onClick={toggle}>
          {section.name}
          {section.description && <span className="k-muted k-sm k-acc-desc">{section.description}</span>}
        </span>
        <span className="k-acc-cell k-acc-key" onClick={toggle}><span className="k-badge">{section.section_key}</span></span>
        <span className="k-acc-cell k-acc-imgs k-num" onClick={toggle}>{section.image_count}</span>
        <span className="k-acc-cell k-acc-status" onClick={toggle}>
          <span className={'k-badge ' + (active ? 'k-badge-ok' : 'k-badge-off')}>{active ? 'Ativa' : 'Inativa'}</span>
        </span>
        <div className="k-acc-actions">
          <button type="button" className="k-btn k-btn-sm k-btn-ghost" onClick={onToggleActive}>{active ? 'Desativar' : 'Ativar'}</button>
          <button type="button" className="k-btn k-btn-sm k-btn-danger" onClick={onRemove}>Excluir</button>
        </div>
      </div>
      <div id={bodyId} className={'k-acc-body-wrap' + (open ? ' is-open' : '')}>
        {render && <div className="k-acc-body-inner">{children}</div>}
      </div>
    </div>
  );
}
