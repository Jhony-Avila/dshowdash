import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { STATUS_LABELS, STATUS_ORDER } from './status';
import { money, dateBr } from '../../format';
import { useGridSort, sortRows, DataGridHeader, type GridCol } from '../dataGrid';

const SL = STATUS_LABELS;
function fmt(v: any, cur: string) { return v == null ? '—' : money(v, cur); }
const norm = (s: any) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Datagrid de Propostas — colunas do print. Comparadores ascendentes (dir aplicada por sortRows).
const PROP_COLS: GridCol[] = [
  { key: 'number', label: 'Número' }, { key: 'title', label: 'Título' }, { key: 'client', label: 'Cliente' },
  { key: 'budget', label: 'Orçamento' }, { key: 'date', label: 'Data' }, { key: 'status', label: 'Status' },
  { key: 'total', label: 'Total', num: true },
];
const PROP_CMP: Record<string, (a: any, b: any) => number> = {
  number: (a, b) => String(a.proposal_number || '').localeCompare(String(b.proposal_number || ''), 'pt-BR', { numeric: true }),
  title: (a, b) => (a.title || '').localeCompare(b.title || '', 'pt-BR'),
  client: (a, b) => (a.client_display || '').localeCompare(b.client_display || '', 'pt-BR'),
  budget: (a, b) => String(a.budget_number || '').localeCompare(String(b.budget_number || ''), 'pt-BR', { numeric: true }),
  date: (a, b) => String(a.proposal_date || '').localeCompare(String(b.proposal_date || '')),
  status: (a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status),
  total: (a, b) => (Number(a.total_final) || 0) - (Number(b.total_final) || 0), // NUMÉRICO pelo valor bruto
};

export function ProposalsList({ onOpen }: { onOpen: (id: number) => void }) {
  const [rows, setRows] = useState<any[]>([]);
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [msg, setMsg] = useState('');
  const { sort, cycle } = useGridSort('koala.proposals.sort', { key: 'number', dir: 'desc' });

  async function load() {
    try { setRows(await apiGet('/proposals' + (status ? `?status=${status}` : ''))); setMsg(''); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  useEffect(() => { load(); }, [status]);

  async function novo() {
    try { const p = await apiSend('POST', '/proposals', {}); onOpen(p.id); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  const needle = norm(q.trim());
  const filtered = needle
    ? rows.filter((r) => norm(r.proposal_number).includes(needle) || norm(r.title).includes(needle) || norm(r.client_display).includes(needle))
    : rows;
  const sorted = sortRows(filtered, sort, PROP_CMP);

  return (
    <div className="k-card">
      <div className="k-list-head">
        <h2>Propostas</h2>
        <button className="k-btn" onClick={novo}>+ Nova Proposta</button>
      </div>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      <div className="k-sec-toolbar">
        <select className="k-input" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.keys(SL).map((s) => <option key={s} value={s}>{SL[s]}</option>)}
        </select>
        <input className="k-input k-sec-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por número, título ou cliente…" />
        <span className="k-muted k-sm">{sorted.length} de {rows.length}</span>
      </div>

      <div className="k-prop-grid">
        <DataGridHeader cols={PROP_COLS} sort={sort} onSort={cycle} />
        <div className="k-dg-body">
          {sorted.map((r) => (
            <button key={r.id} type="button" className="k-dg-row" onClick={() => onOpen(r.id)}>
              <span className="k-dg-cell">{r.proposal_number}</span>
              <span className="k-dg-cell">{r.title || '—'}</span>
              <span className="k-dg-cell">{r.client_display || '—'}</span>
              <span className="k-dg-cell">{r.budget_number ? 'Orç ' + r.budget_number : '—'}</span>
              <span className="k-dg-cell">{dateBr(r.proposal_date) || '—'}</span>
              <span className="k-dg-cell"><span className="k-badge">{SL[r.status] || r.status}</span></span>
              <span className="k-dg-cell k-dg-num">{fmt(r.total_final, r.currency)}</span>
            </button>
          ))}
          {sorted.length === 0 && <p className="k-muted k-acc-empty">{rows.length === 0 ? 'Nenhuma proposta ainda. Crie a primeira.' : 'Nenhuma proposta corresponde à busca/filtro.'}</p>}
        </div>
      </div>
    </div>
  );
}
