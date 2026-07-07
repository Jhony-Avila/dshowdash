import { useState, type ReactNode } from 'react';

// Seção colapsável para agrupar o formulário da proposta nos grupos da spec.
// icon (opcional): SVG inline à esquerda do título (padrão da sidebar do Koala). Só visual —
// colapso/expansão/persistência inalterados. Chevron migra p/ a direita ([icone] [titulo] … [chevron]).
export function Section({ title, children, defaultOpen = true, hint, icon }:
  { title: string; children: ReactNode; defaultOpen?: boolean; hint?: string; icon?: ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={'k-sec' + (open ? ' is-open' : '')}>
      <button type="button" className="k-sec-head" onClick={() => setOpen((o) => !o)}>
        {icon && <span className="k-sec-ico" aria-hidden="true">{icon}</span>}
        <span className="k-sec-title">{title}</span>
        {hint && <span className="k-sec-hint">{hint}</span>}
        <span className="k-sec-caret" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
        </span>
      </button>
      {open && <div className="k-sec-body">{children}</div>}
    </section>
  );
}
