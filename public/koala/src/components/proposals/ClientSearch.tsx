import { useEffect, useRef, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';

// Busca remota (debounce) + import/snapshot. Degrada gracioso se o ERP não responder.
export function ClientSearch({ proposalId, onImported }: { proposalId: number; onImported: (externalId: number) => void }) {
  const [q, setQ] = useState('');
  const [res, setRes] = useState<any[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const t = useRef<any>(null);

  useEffect(() => {
    if (t.current) clearTimeout(t.current);
    if (q.trim().length < 2) { setRes([]); return; }
    t.current = setTimeout(async () => {
      setBusy(true);
      try { setRes(await apiGet('/clients/search?q=' + encodeURIComponent(q))); setMsg(''); }
      catch (e: any) { setMsg(e.message === 'REMOTE_UNAVAILABLE' ? 'ERP indisponível, tente de novo.' : 'Erro: ' + e.message); }
      finally { setBusy(false); }
    }, 500);
  }, [q]);

  async function pick(c: any) {
    try {
      await apiSend('POST', `/proposals/${proposalId}/import-client`, { external_client_id: c.cliente_id });
      setRes([]); setQ('');
      onImported(c.cliente_id);
    } catch (e: any) { setMsg('Erro ao importar: ' + e.message); }
  }

  return (
    <div className="k-field">
      <label className="k-label">Cliente (busca no ERP: nome / CNPJ / e-mail / id)</label>
      <input className="k-input k-w-full" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Digite para buscar…" />
      {busy && <div className="k-muted k-sm">buscando…</div>}
      {msg && <div className="k-msg k-msg-err">{msg}</div>}
      {res.length > 0 && (
        <div className="k-search-list">
          {res.map((c) => (
            <button key={c.cliente_id} className="k-search-item" onClick={() => pick(c)}>
              <b>{c.nome || '—'}</b> <span className="k-muted">{c.tipo} · {c.documento || ''}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
