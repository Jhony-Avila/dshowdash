// screens/MassSend.tsx — envio em massa (§23).
// @version 1.0.0  @created 2026-07-21
//
// Tratado SEPARADAMENTE do compositor comum (§23): lista de destinatários com
// dedup/validação, Cco por padrão, confirmação, progresso em lotes e relatório.
import { useEffect, useRef, useState } from 'react';
import { apiGet, apiWrite, ApiError } from '../lib/api';
import type { MassStatus } from '../shell/types';

const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseRecipients(txt: string): { validos: string[]; invalidos: string[] } {
  const toks = txt.split(/[\s,;]+/).map((t) => t.trim()).filter(Boolean);
  const vistos = new Set<string>(); const validos: string[] = []; const invalidos: string[] = [];
  for (const t of toks) {
    const e = t.toLowerCase();
    if (!RE_EMAIL.test(e)) { invalidos.push(t); continue; }
    if (vistos.has(e)) continue;
    vistos.add(e); validos.push(e);
  }
  return { validos, invalidos };
}

export function MassSend({ accountId, onFechar }: { accountId: number; onFechar: () => void }) {
  const [fase, setFase] = useState<'form' | 'sending' | 'done'>('form');
  const [dests, setDests] = useState('');
  const [assunto, setAssunto] = useState('');
  const [useBcc, setUseBcc] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);
  const [status, setStatus] = useState<MassStatus | null>(null);
  const corpoRef = useRef<HTMLDivElement>(null);

  const { validos, invalidos } = parseRecipients(dests);

  useEffect(() => {
    if (fase !== 'sending' || jobId === null) return;
    let vivo = true;
    const tick = async () => {
      try {
        const st = await apiGet<MassStatus>('/mass/status', { id: jobId });
        if (!vivo) return;
        setStatus(st);
        if (st.status === 'done') { setFase('done'); return; }
      } catch { /* continua tentando */ }
      if (vivo) window.setTimeout(tick, 700);
    };
    tick();
    return () => { vivo = false; };
  }, [fase, jobId]);

  async function iniciar() {
    setErro(null);
    if (validos.length === 0) { setErro('Adicione ao menos um destinatário válido.'); return; }
    if (assunto.trim() === '' && !window.confirm('Enviar sem assunto?')) return;
    if (!useBcc && !window.confirm('Sem Cco, todos os destinatários verão a lista. Continuar assim mesmo?')) return;
    if (!window.confirm(`Enviar para ${validos.length} destinatário(s)? Respeite os limites da Microsoft e evite parecer spam.`)) return;

    try {
      const { data } = await apiWrite<{ id: number; total: number }>('/mass/start', 'POST', {
        account_id: accountId, subject: assunto, body_html: corpoRef.current?.innerHTML ?? '',
        recipients: validos, use_bcc: useBcc,
      });
      setJobId(data.id);
      setFase('sending');
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Falha ao iniciar o envio.');
    }
  }

  function baixarRelatorio() {
    const linhas = ['email,status', ...(status?.results ?? []).map((r) => `${r.email},${r.status}`)];
    const blob = new Blob([linhas.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `envio-massa-${jobId}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  const pct = status && status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;

  return (
    <div className="ol-composer-overlay" role="dialog" aria-modal="true">
      <div className="ol-composer ol-mass">
        <div className="ol-composer-head">
          <span>📢 Envio em massa</span>
          <button className="ol-icon-btn" onClick={onFechar} aria-label="Fechar" disabled={fase === 'sending'}>✕</button>
        </div>

        {fase === 'form' && (
          <div className="ol-composer-body">
            {erro && <div className="ol-alert ol-alert-danger">{erro}</div>}
            <div className="ol-alert ol-alert-info">Ferramenta operacional — não use como plataforma de marketing. Respeite os limites da Microsoft (§23.2).</div>

            <label className="ol-field-lbl ol-mass-lbl">Destinatários (separe por vírgula, ponto e vírgula ou linha)</label>
            <textarea className="ol-mass-dests" value={dests} onChange={(e) => setDests(e.target.value)}
              placeholder="a@exemplo.com, b@exemplo.com…" rows={4} />
            <div className="ol-mass-cont">
              <span className="ol-mass-ok">{validos.length} válido(s)</span>
              {invalidos.length > 0 && <span className="ol-mass-bad">· {invalidos.length} inválido(s) ignorado(s)</span>}
            </div>

            <div className="ol-field">
              <label className="ol-field-lbl">Assunto</label>
              <input className="ol-inp" value={assunto} onChange={(e) => setAssunto(e.target.value)} />
            </div>
            <div ref={corpoRef} className="ol-composer-editor" contentEditable suppressContentEditableWarning data-placeholder="Mensagem…" />
            <label className="ol-cfg-check">
              <input type="checkbox" checked={useBcc} onChange={(e) => setUseBcc(e.target.checked)} />
              Usar Cco (oculta os destinatários entre si) — recomendado
            </label>
          </div>
        )}

        {(fase === 'sending' || fase === 'done') && status && (
          <div className="ol-composer-body">
            <div className="ol-mass-progresso">
              <div className="ol-mass-bar"><div className="ol-mass-fill" style={{ width: `${pct}%` }} /></div>
              <div className="ol-mass-nums">
                <span>{status.processed}/{status.total}</span>
                <span className="ol-mass-ok">✓ {status.success}</span>
                {status.failure > 0 && <span className="ol-mass-bad">✕ {status.failure}</span>}
                <span className="ol-mass-pct">{pct}%</span>
              </div>
            </div>
            {fase === 'done' && (
              <div className="ol-alert ol-alert-ok">
                Concluído: {status.success} enviado(s){status.failure > 0 ? `, ${status.failure} falha(s)` : ''}.
              </div>
            )}
            {status.failure > 0 && (
              <ul className="ol-mass-falhas">
                {status.results.filter((r) => r.status === 'failed').slice(0, 8).map((r, i) => (
                  <li key={i}>✕ {r.email}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <div className="ol-composer-foot">
          {fase === 'form' && (<>
            <button className="ol-btn ol-btn-primary" onClick={iniciar} disabled={validos.length === 0}>Enviar em massa</button>
            <button className="ol-btn ol-btn-ghost" onClick={onFechar}>Cancelar</button>
          </>)}
          {fase === 'sending' && <span className="ol-composer-hint">Processando em lotes…</span>}
          {fase === 'done' && (<>
            <button className="ol-btn ol-btn-primary" onClick={onFechar}>Fechar</button>
            <button className="ol-btn ol-btn-ghost" onClick={baixarRelatorio}>⬇ Baixar relatório (CSV)</button>
          </>)}
        </div>
      </div>
    </div>
  );
}
