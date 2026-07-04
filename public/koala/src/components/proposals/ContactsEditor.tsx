import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';

// Grupo CONTATOS: lista repetível (pessoa, tipo Telefone|E-mail, valor) com adicionar/remover.
export function ContactsEditor({ proposalId }: { proposalId: number }) {
  const [rows, setRows] = useState<any[]>([]);
  const [nw, setNw] = useState<any>({ contact_name: '', contact_type: 'phone', contact_value: '' });
  const [msg, setMsg] = useState('');

  async function load() {
    try { setRows(await apiGet(`/proposals/${proposalId}/contacts`)); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }
  useEffect(() => { load(); }, [proposalId]);

  async function add() {
    if (!nw.contact_value.trim()) return;
    try {
      const r = await apiSend('POST', `/proposals/${proposalId}/contacts`, nw);
      setRows(r?.contacts ?? []);
      setNw({ contact_name: '', contact_type: 'phone', contact_value: '' });
      setMsg('');
    } catch (e: any) { setMsg(e?.meta?.message || 'Erro: ' + e.message); }
  }
  async function upd(c: any, field: string, value: any) {
    try {
      const r = await apiSend('PUT', `/proposals/${proposalId}/contacts/${c.id}`, { ...c, [field]: value });
      setRows(r?.contacts ?? []);
    } catch (e: any) { setMsg(e?.meta?.message || 'Erro: ' + e.message); }
  }
  async function del(c: any) {
    try { const r = await apiSend('DELETE', `/proposals/${proposalId}/contacts/${c.id}`); setRows(r?.contacts ?? []); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  return (
    <div className="k-field">
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      <table className="k-table k-items">
        <thead><tr><th>Pessoa de contato</th><th>Tipo</th><th>Valor</th><th></th></tr></thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id}>
              <td><input className="k-input k-mini k-w-full" defaultValue={c.contact_name ?? ''} onBlur={(e) => upd(c, 'contact_name', e.target.value)} /></td>
              <td>
                <select className="k-input k-mini" defaultValue={c.contact_type} onChange={(e) => upd(c, 'contact_type', e.target.value)}>
                  <option value="phone">Telefone</option>
                  <option value="email">E-mail</option>
                </select>
              </td>
              <td><input className="k-input k-mini k-w-full" defaultValue={c.contact_value ?? ''} onBlur={(e) => upd(c, 'contact_value', e.target.value)} /></td>
              <td><button className="k-btn-x" onClick={() => del(c)} title="Remover">×</button></td>
            </tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={4} className="k-muted">Nenhum contato. Adicione abaixo.</td></tr>}
        </tbody>
      </table>
      <div className="k-row">
        <input className="k-input" placeholder="Pessoa" value={nw.contact_name} onChange={(e) => setNw({ ...nw, contact_name: e.target.value })} />
        <select className="k-input" value={nw.contact_type} onChange={(e) => setNw({ ...nw, contact_type: e.target.value })}>
          <option value="phone">Telefone</option>
          <option value="email">E-mail</option>
        </select>
        <input className="k-input" placeholder="Valor" value={nw.contact_value} onChange={(e) => setNw({ ...nw, contact_value: e.target.value })} />
        <button className="k-btn k-btn-sm" onClick={add} disabled={!nw.contact_value.trim()}>+ contato</button>
      </div>
    </div>
  );
}
