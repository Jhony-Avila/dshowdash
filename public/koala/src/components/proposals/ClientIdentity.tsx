import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { ClientSearch } from './ClientSearch';

// Grupo CLIENTE: busca/snapshot do ERP + campos editáveis (editar aqui NUNCA altera o ERP).
export function ClientIdentity(
  { proposalId, onChange }: { proposalId: number; onChange: () => void }
) {
  const [snap, setSnap] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    // Fix F4: sem try/catch, um erro deixava o grupo preso em "Carregando cliente…" pra sempre.
    try {
      const b = await apiGet(`/proposals/${proposalId}/client`);
      setSnap(b?.snapshot ?? {});
      setMsg('');
    } catch (e: any) {
      setSnap({});   // sai do estado de carregando e mostra o formulário (vazio)
      setMsg(e?.meta?.message || 'Não foi possível carregar o cliente. Tente recarregar a página.');
    }
  }
  useEffect(() => { load(); }, [proposalId]);

  async function save(field: string, value: any) {
    try {
      const b = await apiSend('PUT', `/proposals/${proposalId}/client`, { [field]: value });
      setSnap(b?.snapshot ?? {});
      setMsg('');
      onChange();
    } catch (e: any) { setMsg(e?.meta?.message || 'Erro: ' + e.message); }
  }

  async function onImported() { await load(); onChange(); }

  if (!snap) return <div className="k-muted k-sm">Carregando cliente…</div>;

  return (
    <div>
      <ClientSearch proposalId={proposalId} onImported={onImported} />
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      <div className="k-row">
        <div className="k-field k-f-half">
          <label className="k-label">Razão social</label>
          <input className="k-input k-w-full" defaultValue={snap.legal_name ?? ''} key={'ln' + (snap.id ?? 0)} onBlur={(e) => save('legal_name', e.target.value)} />
        </div>
        <div className="k-field k-f-half">
          <label className="k-label">Nome fantasia</label>
          <input className="k-input k-w-full" defaultValue={snap.trade_name ?? ''} key={'tn' + (snap.id ?? 0)} onBlur={(e) => save('trade_name', e.target.value)} />
        </div>
      </div>
      <div className="k-row">
        <div className="k-field k-f-third">
          <label className="k-label">Tipo doc.</label>
          <select className="k-input" defaultValue={snap.document_type ?? 'CNPJ'} key={'dt' + (snap.id ?? 0)} onChange={(e) => save('document_type', e.target.value)}>
            <option value="CNPJ">CNPJ</option>
            <option value="CPF">CPF</option>
          </select>
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">CNPJ / CPF</label>
          <input className="k-input k-w-full" defaultValue={snap.document_number ?? ''} key={'dn' + (snap.id ?? 0)} onBlur={(e) => save('document_number', e.target.value)} />
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Código interno</label>
          <input className="k-input k-w-full" defaultValue={snap.internal_client_code ?? ''} key={'ic' + (snap.id ?? 0)} onBlur={(e) => save('internal_client_code', e.target.value)} />
        </div>
      </div>
      <div className="k-field">
        <label className="k-label">URL do logotipo do cliente</label>
        <input className="k-input k-w-full" defaultValue={snap.logo_url ?? ''} key={'lu' + (snap.id ?? 0)} onBlur={(e) => save('logo_url', e.target.value)} placeholder="https://…" />
      </div>
    </div>
  );
}
