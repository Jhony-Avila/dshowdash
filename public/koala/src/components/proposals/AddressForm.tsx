import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';

// Grupo ENDEREÇO do cliente (no snapshot; editar NUNCA altera o ERP).
export function AddressForm({ proposalId }: { proposalId: number }) {
  const [snap, setSnap] = useState<any>(null);
  const [msg, setMsg] = useState('');

  async function load() {
    // Fix F4: sem try/catch, um erro deixava o grupo preso em "Carregando endereço…" pra sempre.
    try {
      const b = await apiGet(`/proposals/${proposalId}/client`);
      setSnap(b?.snapshot ?? {});
      setMsg('');
    } catch (e: any) {
      setSnap({});   // sai do estado de carregando e mostra o formulário (vazio)
      setMsg(e?.meta?.message || 'Não foi possível carregar o endereço. Tente recarregar a página.');
    }
  }
  useEffect(() => { load(); }, [proposalId]);

  async function save(field: string, value: any) {
    try {
      const b = await apiSend('PUT', `/proposals/${proposalId}/client`, { [field]: value });
      setSnap(b?.snapshot ?? {});
      setMsg('');
    } catch (e: any) { setMsg(e?.meta?.message || 'Erro: ' + e.message); }
  }

  if (!snap) return <div className="k-muted k-sm">Carregando endereço…</div>;
  const k = (s: string) => s + (snap.id ?? 0);

  return (
    <div>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      <div className="k-row">
        <div className="k-field k-f-third">
          <label className="k-label">CEP</label>
          <input className="k-input k-w-full" defaultValue={snap.postal_code ?? ''} key={k('cep')} onBlur={(e) => save('postal_code', e.target.value)} placeholder="00000-000" />
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Número</label>
          <input className="k-input k-w-full" defaultValue={snap.address_number ?? ''} key={k('num')} onBlur={(e) => save('address_number', e.target.value)} />
        </div>
        <div className="k-field k-f-third">
          <label className="k-label">Complemento</label>
          <input className="k-input k-w-full" defaultValue={snap.address_complement ?? ''} key={k('cmp')} onBlur={(e) => save('address_complement', e.target.value)} />
        </div>
      </div>
      <div className="k-field">
        <label className="k-label">Logradouro</label>
        <input className="k-input k-w-full" defaultValue={snap.address ?? ''} key={k('addr')} onBlur={(e) => save('address', e.target.value)} />
      </div>
      <div className="k-row">
        <div className="k-field k-f-half">
          <label className="k-label">Cidade</label>
          <input className="k-input k-w-full" defaultValue={snap.city ?? ''} key={k('city')} onBlur={(e) => save('city', e.target.value)} />
        </div>
        <div className="k-field k-f-half">
          <label className="k-label">Estado</label>
          <input className="k-input k-w-full" defaultValue={snap.state ?? ''} key={k('st')} onBlur={(e) => save('state', e.target.value)} />
        </div>
      </div>
    </div>
  );
}
