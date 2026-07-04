import { STATUS_LABELS, STATUS_ORDER } from './status';

// Grupo DADOS DA PROPOSTA: identificação + textos comerciais + moeda + desconto da proposta.
export function ProposalFields(
  { p, onField, onStatus }:
  { p: any; onField: (f: string, v: any) => void; onStatus: (s: string) => void }
) {
  return (
    <div>
      <div className="k-row">
        <div className="k-field k-f-half">
          <label className="k-label">Título da proposta</label>
          <input className="k-input k-w-full" defaultValue={p.title ?? ''} onBlur={(e) => onField('title', e.target.value)} />
        </div>
        <div className="k-field k-f-half">
          <label className="k-label">Nome do projeto</label>
          <input className="k-input k-w-full" defaultValue={p.project_name ?? ''} onBlur={(e) => onField('project_name', e.target.value)} />
        </div>
      </div>

      <div className="k-row">
        <div className="k-field k-f-third">
          <label className="k-label">Data da proposta</label>
          <input type="date" className="k-input k-w-full" defaultValue={p.proposal_date ?? ''} onBlur={(e) => onField('proposal_date', e.target.value)} />
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Validade</label>
          <input type="date" className="k-input k-w-full" defaultValue={p.valid_until ?? ''} onBlur={(e) => onField('valid_until', e.target.value)} />
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Status</label>
          <select className="k-input k-w-full" value={p.status} onChange={(e) => onStatus(e.target.value)}>
            {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
          </select>
        </div>
      </div>

      <div className="k-row">
        <div className="k-field k-f-third">
          <label className="k-label">Moeda</label>
          <select className="k-input k-w-full" defaultValue={p.currency} onChange={(e) => onField('currency', e.target.value)}>
            <option value="BRL">BRL (R$)</option>
            <option value="USD">USD (US$)</option>
          </select>
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Nº do orçamento (ref.)</label>
          <input className="k-input k-w-full" defaultValue={p.budget_number ?? ''} onBlur={(e) => onField('budget_number', e.target.value)} />
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Versão</label>
          <input className="k-input k-w-full" value={p.current_version_id ? `v${p.current_version_id}` : 'rascunho'} readOnly />
        </div>
      </div>

      <div className="k-field">
        <label className="k-label">Objetivo da proposta</label>
        <textarea className="k-input k-w-full k-textarea" defaultValue={p.objective ?? ''} onBlur={(e) => onField('objective', e.target.value)} />
      </div>
      <div className="k-field">
        <label className="k-label">Contexto da necessidade</label>
        <textarea className="k-input k-w-full k-textarea" defaultValue={p.need_context ?? ''} onBlur={(e) => onField('need_context', e.target.value)} />
      </div>
      <div className="k-field">
        <label className="k-label">Resumo executivo</label>
        <textarea className="k-input k-w-full k-textarea" defaultValue={p.executive_summary ?? ''} onBlur={(e) => onField('executive_summary', e.target.value)} />
      </div>
      <div className="k-field">
        <label className="k-label">Escopo do projeto</label>
        <textarea className="k-input k-w-full k-textarea" defaultValue={p.project_scope ?? ''} onBlur={(e) => onField('project_scope', e.target.value)} />
      </div>
      <div className="k-field">
        <label className="k-label">Observações comerciais</label>
        <textarea className="k-input k-w-full k-textarea" defaultValue={p.commercial_notes ?? ''} onBlur={(e) => onField('commercial_notes', e.target.value)} />
      </div>
    </div>
  );
}
