import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';

// F5 — Histórico de versões congeladas: visualizar (readonly) e restaurar (gestor/admin).
const TRIGGER_LABEL: Record<string, string> = {
  pdf: 'PDF', publish: 'Publicação', restore: 'Restauração', manual: 'Manual',
};

type Version = {
  id: number; version_number: number; trigger_event: string | null;
  created_at: string; total_final: number | null; currency: string | null;
  restored_from: number | null; has_pdf: boolean;
};

export function VersionsPanel({ proposalId, onRestored }: { proposalId: number; onRestored: () => void }) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  async function load() {
    try { setVersions(await apiGet('/proposals/' + proposalId + '/versions')); }
    catch (e: any) { setMsg(e?.meta?.message || e?.message || 'Falha ao carregar versões.'); }
  }
  useEffect(() => { load(); }, [proposalId]);

  function view(vid: number) {
    window.open('/api/koala/proposals/' + proposalId + '/versions/' + vid + '/preview', '_blank', 'noopener');
  }

  async function restore(v: Version) {
    if (!window.confirm(`Restaurar a versão ${v.version_number}? O estado atual é congelado antes (nada se perde).`)) return;
    setBusy(true); setMsg('');
    try {
      await apiSend('POST', '/proposals/' + proposalId + '/versions/' + v.id + '/restore', {});
      setMsg('Versão ' + v.version_number + ' restaurada.');
      await load();
      onRestored();
    } catch (e: any) {
      setMsg(e?.meta?.message || e?.message || 'Falha ao restaurar (restauração é de gestor/admin).');
    } finally { setBusy(false); }
  }

  function money(v: number | null, cur: string | null) {
    if (v === null || v === undefined) return '—';
    const sym = (cur || 'BRL') === 'USD' ? 'US$' : 'R$';
    return sym + ' ' + Number(v).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  if (!versions.length) return <div className="k-sm k-muted">Nenhuma versão congelada ainda. Gerar PDF ou publicar cria a primeira.</div>;

  return (
    <div className="k-versions">
      {msg && <div className="k-sm k-pdf-ok" style={{ marginBottom: 8 }}>{msg}</div>}
      <table className="k-vtable">
        <thead><tr><th>#</th><th>Marco</th><th>Data</th><th>Total</th><th></th></tr></thead>
        <tbody>
          {versions.map((v) => (
            <tr key={v.id}>
              <td>v{v.version_number}</td>
              <td>{TRIGGER_LABEL[v.trigger_event || ''] || v.trigger_event || '—'}
                {v.restored_from ? <span className="k-sm k-muted"> (de v{v.restored_from})</span> : null}</td>
              <td className="k-sm">{new Date(v.created_at.replace(' ', 'T')).toLocaleString('pt-BR')}</td>
              <td>{money(v.total_final, v.currency)}</td>
              <td className="k-vactions">
                <button className="k-btn k-btn-ghost k-btn-sm" onClick={() => view(v.id)}>Visualizar</button>
                <button className="k-btn k-btn-ghost k-btn-sm" disabled={busy} onClick={() => restore(v)}>Restaurar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
