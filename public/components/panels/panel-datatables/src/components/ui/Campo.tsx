// components/ui/Campo.tsx — primitivas de formulário do design system.
// @version 1.0.0  @created 2026-07-20
// Campos controlados, rótulo associado (a11y), dica opcional. Sem lib externa.
import { type JSX, type ReactNode } from 'react';
import css from './Campo.module.css';

let _seq = 0;
function idUnico(p: string): string { _seq += 1; return `${p}-${_seq}`; }

export function Campo({ rotulo, dica, obrigatorio, children }: {
  rotulo: string; dica?: string; obrigatorio?: boolean; children: (id: string) => ReactNode;
}): JSX.Element {
  const id = idUnico('dtc');
  return (
    <div className={css.campo}>
      <label htmlFor={id} className={css.rotulo}>
        {rotulo}{obrigatorio && <span className={css.obrig} aria-hidden="true"> *</span>}
      </label>
      {children(id)}
      {dica && <span className={css.dica}>{dica}</span>}
    </div>
  );
}

export function Texto({ valor, aoMudar, tipo = 'text', ...resto }: {
  valor: string; aoMudar: (v: string) => void; tipo?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>): JSX.Element {
  return <input {...resto} type={tipo} className={css.input} value={valor}
    onChange={(e) => aoMudar(e.target.value)} />;
}

export function Selecao({ valor, aoMudar, opcoes, placeholder, ...resto }: {
  valor: string; aoMudar: (v: string) => void; opcoes: { valor: string; rotulo: string }[]; placeholder?: string;
} & Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'value' | 'onChange'>): JSX.Element {
  return (
    <select {...resto} className={css.select} value={valor} onChange={(e) => aoMudar(e.target.value)}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {opcoes.map((o) => <option key={o.valor} value={o.valor}>{o.rotulo}</option>)}
    </select>
  );
}

export function Interruptor({ marcado, aoMudar, rotulo }: {
  marcado: boolean; aoMudar: (v: boolean) => void; rotulo: string;
}): JSX.Element {
  return (
    <label className={css.interruptor}>
      <input type="checkbox" checked={marcado} onChange={(e) => aoMudar(e.target.checked)} />
      {rotulo}
    </label>
  );
}

/** Rodapé padronizado dos formulários: ação primária + cancelar (+ perigo opcional). */
export function AcoesForm({ salvarRotulo = 'Salvar', aoCancelar, salvando, perigo }: {
  salvarRotulo?: string; aoCancelar: () => void; salvando?: boolean; perigo?: ReactNode;
}): JSX.Element {
  return (
    <div className={css.acoes}>
      <button type="submit" className={css.primario} disabled={salvando}>
        {salvando ? 'Salvando…' : salvarRotulo}
      </button>
      <button type="button" className={css.secundario} onClick={aoCancelar} disabled={salvando}>Cancelar</button>
      {perigo && <span className={css.perigo}>{perigo}</span>}
    </div>
  );
}

export function Linha({ children }: { children: ReactNode }): JSX.Element {
  return <div className={css.linha}>{children}</div>;
}

export function ErroForm({ mensagem }: { mensagem: string | null }): JSX.Element | null {
  if (!mensagem) return null;
  return <div className={css.erro} role="alert">{mensagem}</div>;
}
