import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { money, dateBr, parseNum } from '../../format';

// Grupo FORMAS DE PAGAMENTO: vincula formas do catálogo (koala_payment_methods) à proposta.
export function PaymentTermsEditor({ proposalId, currency = 'BRL' }: { proposalId: number; currency?: string }) {
  const [terms, setTerms] = useState<any[]>([]);
  const [methods, setMethods] = useState<any[]>([]);
  const [nw, setNw] = useState<any>({ payment_method_id: '', installments_quantity: '', down_payment_value: '', first_due_date: '', free_observations: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    try { setTerms(await apiGet(`/proposals/${proposalId}/payment-terms`)); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  useEffect(() => {
    load();
    apiGet('/payment-methods').then(setMethods).catch(() => {});
  }, [proposalId]);

  async function add() {
    if (!nw.payment_method_id) return;
    try {
      const r = await apiSend('POST', `/proposals/${proposalId}/payment-terms`, {
        payment_method_id: Number(nw.payment_method_id),
        installments_quantity: nw.installments_quantity ? (parseNum(nw.installments_quantity) ?? null) : null,
        down_payment_value: nw.down_payment_value ? (parseNum(nw.down_payment_value) ?? null) : null,
        first_due_date: nw.first_due_date || null,
        free_observations: nw.free_observations || null,
      });
      setTerms(r?.terms ?? []);
      setNw({ payment_method_id: '', installments_quantity: '', down_payment_value: '', first_due_date: '', free_observations: '' });
      setMsg('');
    } catch (e: any) { setMsg(e?.meta?.message || 'Erro: ' + e.message); }
  }
  async function del(t: any) {
    try { const r = await apiSend('DELETE', `/proposals/${proposalId}/payment-terms/${t.id}`); setTerms(r?.terms ?? []); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  return (
    <div className="k-field">
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      <table className="k-table k-items">
        <thead><tr><th>Forma</th><th className="k-num">Parcelas</th><th className="k-num">Entrada</th><th>1º venc.</th><th>Obs.</th><th></th></tr></thead>
        <tbody>
          {terms.map((t) => (
            <tr key={t.id}>
              <td>{t.payment_method_name ?? '—'}</td>
              <td className="k-num">{t.installments_quantity ?? '—'}</td>
              <td className="k-num">{t.down_payment_value == null ? '—' : money(t.down_payment_value, currency)}</td>
              <td>{dateBr(t.first_due_date)}</td>
              <td>{t.free_observations ?? ''}</td>
              <td><button className="k-btn-x" onClick={() => del(t)} title="Remover">×</button></td>
            </tr>
          ))}
          {terms.length === 0 && <tr><td colSpan={6} className="k-muted">Nenhuma forma de pagamento vinculada.</td></tr>}
        </tbody>
      </table>
      <div className="k-row">
        <select className="k-input" value={nw.payment_method_id} onChange={(e) => setNw({ ...nw, payment_method_id: e.target.value })}>
          <option value="">— forma de pagamento —</option>
          {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <input className="k-input k-num" placeholder="Parcelas" value={nw.installments_quantity} onChange={(e) => setNw({ ...nw, installments_quantity: e.target.value })} />
        <input className="k-input k-num" placeholder="Entrada" value={nw.down_payment_value} onChange={(e) => setNw({ ...nw, down_payment_value: e.target.value })} />
        <input type="date" className="k-input" value={nw.first_due_date} onChange={(e) => setNw({ ...nw, first_due_date: e.target.value })} />
        <button className="k-btn k-btn-sm" onClick={add} disabled={!nw.payment_method_id}>+ vincular</button>
      </div>
    </div>
  );
}
