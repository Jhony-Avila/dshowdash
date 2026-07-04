import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { EditableLineTable } from './EditableLineTable';

// Itens da proposta = tabela editável comum + slot "adicionar do catálogo" (F1).
export function LineItemsEditor({ proposalId, currency, onChange }: { proposalId: number; currency: string; onChange: () => void }) {
  const [catalog, setCatalog] = useState<any[]>([]);
  const [sel, setSel] = useState('');
  const [sig, setSig] = useState(0);
  const [msg, setMsg] = useState('');

  useEffect(() => { apiGet('/items').then(setCatalog).catch(() => {}); }, [proposalId]);

  async function addCat() {
    if (!sel) return;
    try {
      await apiSend('POST', `/proposals/${proposalId}/items`, { catalog_item_id: Number(sel), quantity: 1 });
      setSel(''); setMsg(''); setSig((s) => s + 1); onChange();
    } catch (e: any) { setMsg(e?.meta?.message || 'Erro: ' + e.message); }
  }

  const catalogSlot = (
    <div className="k-row k-catalog-row">
      <select className="k-input" value={sel} onChange={(e) => setSel(e.target.value)}>
        <option value="">— adicionar do catálogo —</option>
        {catalog.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <button className="k-btn k-btn-sm k-btn-outline" onClick={addCat} disabled={!sel}>+ do catálogo</button>
      {msg && <span className="k-msg k-msg-err">{msg}</span>}
    </div>
  );

  return (
    <EditableLineTable
      proposalId={proposalId} resource="items" currency={currency}
      onChange={onChange} addLabel="+ item avulso" catalogSlot={catalogSlot} reloadSignal={sig}
    />
  );
}
