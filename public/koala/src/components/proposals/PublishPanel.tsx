import { useEffect, useState } from 'react';
import { apiGet, apiSend } from '../../api/client';
import { dateTimeBr } from '../../format';

// F4 — Publicação: publicar/revogar/republicar + link público copiável + histórico de visualizações.
type PublicState = {
  published: boolean; revoked: boolean; public_slug: string | null; public_url: string | null;
  published_at: string | null; valid_until: string | null; expired: boolean; version_id: number | null;
};
type View = { ip: string; ua: string; viewed_at: string; version_id: number | null };

export function PublishPanel({ proposalId, onChange }: { proposalId: number; onChange: () => void }) {
  const [st, setSt] = useState<PublicState | null>(null);
  const [views, setViews] = useState<View[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [copied, setCopied] = useState(false);

  async function load() {
    try {
      const s = await apiGet('/proposals/' + proposalId + '/public-state');
      setSt(s);
      if (s.published) { try { setViews(await apiGet('/proposals/' + proposalId + '/views')); } catch { /* ignore */ } }
    } catch (e: any) { setMsg(e?.meta?.message || e?.message || 'Falha ao carregar estado.'); }
  }
  useEffect(() => { load(); }, [proposalId]);

  const fullUrl = st?.public_url ? window.location.origin + st.public_url : '';

  async function publish(republish = false) {
    const validade = st?.valid_until ? ` Validade: ${st.valid_until}.` : ' Validade padrão: +30 dias.';
    const q = republish
      ? 'Republicar? Um link NOVO é gerado e a versão atual é congelada. O link anterior deixa de valer.'
      : 'Publicar esta proposta? Congela a versão atual e gera o link público.' + validade;
    if (!window.confirm(q)) return;
    setBusy(true); setMsg('');
    try {
      await apiSend('POST', '/proposals/' + proposalId + '/publish', {});
      setMsg(republish ? 'Republicada — link novo gerado.' : 'Publicada.');
      await load(); onChange();
    } catch (e: any) { setMsg(e?.meta?.message || e?.message || 'Falha ao publicar.'); }
    finally { setBusy(false); }
  }

  async function revoke() {
    if (!window.confirm('Revogar o link público? Ele deixa de funcionar imediatamente.')) return;
    setBusy(true); setMsg('');
    try { await apiSend('POST', '/proposals/' + proposalId + '/revoke', {}); setMsg('Link revogado.'); await load(); onChange(); }
    catch (e: any) { setMsg(e?.meta?.message || e?.message || 'Falha ao revogar.'); }
    finally { setBusy(false); }
  }

  function copy() {
    if (!fullUrl) return;
    navigator.clipboard?.writeText(fullUrl).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); });
  }

  if (!st) return <div className="k-sm k-muted">Carregando…</div>;

  return (
    <div className="k-publish">
      {msg && <div className="k-sm k-pdf-ok" style={{ marginBottom: 8 }}>{msg}</div>}

      {!st.published && (
        <div>
          <p className="k-sm k-muted">A proposta ainda não tem link público. Publicar congela a versão atual e gera um link compartilhável.</p>
          <button className="k-btn k-btn-primary" disabled={busy} onClick={() => publish(false)}>Publicar</button>
        </div>
      )}

      {st.published && (
        <div>
          <div className="k-pub-badge">
            <span className="k-badge k-badge-ok">Publicada</span>
            {st.expired && <span className="k-badge k-badge-warn">Expirada</span>}
            {st.valid_until && <span className="k-sm k-muted">válida até {st.valid_until}</span>}
          </div>
          <div className="k-pub-link">
            <input readOnly value={fullUrl} onFocus={(e) => e.currentTarget.select()} />
            <button className="k-btn k-btn-ghost" onClick={copy}>{copied ? 'Copiado ✓' : 'Copiar'}</button>
            <a className="k-btn k-btn-ghost" href={fullUrl} target="_blank" rel="noopener">Abrir</a>
          </div>
          <div className="k-pub-actions">
            <button className="k-btn k-btn-ghost" disabled={busy} onClick={() => publish(true)}>Republicar (novo link)</button>
            <button className="k-btn k-btn-danger" disabled={busy} onClick={revoke}>Revogar link</button>
          </div>

          <div className="k-pub-views">
            <div className="k-sm k-muted" style={{ margin: '10px 0 4px' }}>Visualizações ({views.length})</div>
            {!views.length && <div className="k-sm k-muted">Ninguém abriu o link ainda.</div>}
            {views.length > 0 && (
              <ul className="k-viewlist">
                {views.slice(0, 20).map((v, i) => (
                  <li key={i} className="k-sm">
                    <span>{dateTimeBr(v.viewed_at)}</span>
                    <span className="k-muted"> · {v.ip} · {v.ua}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
