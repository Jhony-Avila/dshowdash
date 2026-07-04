import { useState, type ReactNode } from 'react';

// Seção colapsável para agrupar o formulário da proposta nos grupos da spec.
export function Section({ title, children, defaultOpen = true, hint }:
  { title: string; children: ReactNode; defaultOpen?: boolean; hint?: string }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <section className={'k-sec' + (open ? ' is-open' : '')}>
      <button type="button" className="k-sec-head" onClick={() => setOpen((o) => !o)}>
        <span className="k-sec-caret">{open ? '▾' : '▸'}</span>
        <span className="k-sec-title">{title}</span>
        {hint && <span className="k-sec-hint">{hint}</span>}
      </button>
      {open && <div className="k-sec-body">{children}</div>}
    </section>
  );
}
