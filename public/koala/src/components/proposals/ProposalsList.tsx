import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { STATUS_LABELS } from './status';
import { money } from '../../format';

// F9: usa a fonte única de rótulos (status.ts). Antes havia um mapa local que divergia
// (user_deleted = 'Excluída' aqui vs 'Excluída pelo usuário' no resto do app).
const SL = STATUS_LABELS;
function fmt(v: any, cur: string) {
  return v == null ? '—' : money(v, cur);   // F6: formatação de dinheiro unificada
}

export function ProposalsList({ onOpen }: { onOpen: (id: number) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [msg, setMsg] = useState('');

  async function load() {
    try { setRows(await apiGet('/proposals' + (status ? `?status=${status}` : ''))); setMsg(''); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  useEffect(() => { load(); }, [status]);

  async function novo() {
    try { const p = await apiSend('POST', '/proposals', {}); onOpen(p.id); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  return (
    <div className="k-card">
      <div className="k-list-head">
        <h2>Propostas</h2>
        <button className="k-btn" onClick={novo}>+ Nova Proposta</button>
      </div>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      <div className="k-row">
        <select className="k-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.keys(SL).map((s) => <option key={s} value={s}>{SL[s]}</option>)}
        </select>
      </div>
      <table className="k-table">
        <thead><tr><th>Número</th><th>Título</th><th>Orçamento</th><th>Status</th><th className="k-num">Total</th><th></th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td>{r.proposal_number}</td>
              <td>{r.title || '—'}</td>
              <td>{r.budget_number ? 'Orç ' + r.budget_number : '—'}</td>
              <td><span className="k-badge">{SL[r.status] || r.status}</span></td>
              <td className="k-num">{fmt(r.total_final, r.currency)}</td>
              <td><button className="k-btn k-btn-sm" onClick={() => onOpen(r.id)}>Abrir</button></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={6} className="k-muted">Nenhuma proposta ainda. Crie a primeira.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
