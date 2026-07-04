import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { money } from '../../format';

// Orçamentos vêm do ERP (valores em BRL). F6: formatação unificada.
function fmt(v: any) {
  return v == null ? '—' : money(v, 'BRL');
}

export function OrcamentoImport(
  { proposalId, externalClientId, onImported }:
  { proposalId: number; externalClientId: number | null; onImported: () => void }
) {
  const [orcs, setOrcs] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    if (!externalClientId) { setOrcs([]); return; }
    (async () => {
      try { setOrcs(await apiGet(`/clients/${externalClientId}/orcamentos`)); setMsg(''); }
      catch (e: any) { setMsg(e.message === 'REMOTE_UNAVAILABLE' ? 'ERP indisponível.' : 'Erro: ' + e.message); }
    })();
  }, [externalClientId]);

  async function imp(o: any) {
    try { await apiSend('POST', `/proposals/${proposalId}/import-orcamento`, { orcamento_id: o.Id_Orc }); onImported(); }
    catch (e: any) { setMsg('Erro: ' + e.message); }
  }

  if (!externalClientId) return null;
  return (
    <div className="k-field">
      <label className="k-label">Orçamentos do cliente (importar itens)</label>
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      {orcs.length === 0 && !msg && <div className="k-muted k-sm">Nenhum orçamento encontrado.</div>}
      <div className="k-search-list">
        {orcs.map((o) => (
          <div key={o.Id_Orc} className="k-orc-row">
            <span>Orç <b>{o.Id_Orc}</b> · {fmt(o.Valor_Final)}</span>
            <button className="k-btn k-btn-sm" onClick={() => imp(o)}>Importar itens</button>
          </div>
        ))}
      </div>
    </div>
  );
}
