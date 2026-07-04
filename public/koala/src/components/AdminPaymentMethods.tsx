import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../api/client';

const TYPES = ['cash', 'installment', 'bank_transfer', 'boleto', 'pix', 'custom'];

export function AdminPaymentMethods({ canWrite }: { canWrite: boolean }) {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('custom');

  async function load() {
    try {
      setRows(await apiGet('/payment-methods'));
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);

  async function add() {
    try {
      await apiSend('POST', '/payment-methods', { name, payment_type: type });
      setName('');
      setType('custom');
      setMsg('Forma de pagamento criada.');
      load();
    } catch (e: any) {
      setMsg('Erro: ' + e.message);
    }
  }

  return (
    <div className="k-card">
      <h2>Formas de Pagamento</h2>
      {msg && <div className="k-msg">{msg}</div>}
      {canWrite && (
        <div className="k-row">
          <input className="k-input" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="k-input" value={type} onChange={(e) => setType(e.target.value)}>
            {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <button className="k-btn" onClick={add} disabled={!name}>+ Forma</button>
        </div>
      )}
      <h3>Cadastradas ({rows.length})</h3>
      <table className="k-table">
        <thead><tr><th>Nome</th><th>Tipo</th></tr></thead>
        <tbody>
          {rows.map((r) => <tr key={r.id}><td>{r.name}</td><td>{r.payment_type}</td></tr>)}
        </tbody>
      </table>
      {!canWrite && <p className="k-muted">Somente administradores cadastram formas de pagamento.</p>}
    </div>
  );
}
