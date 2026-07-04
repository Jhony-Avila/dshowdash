import { useEffect, useState } from 'react';
import { apiGet } from '../api/client';
import type { TemplateSummary } from '../types';

// Consome o RENDERIZADOR ÚNICO (mesma saída de preview, link público e PDF).
// F10: resolve o template dinamicamente (default > primeiro) em vez do id fixo=1,
// que quebrava o iframe se o template 1 fosse desativado/removido.
export function TemplatePreview() {
  const [tplId, setTplId] = useState<number | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const list = await apiGet<TemplateSummary[]>('/templates');
        const chosen = (list || []).find((t) => t.is_default) || (list || [])[0];
        if (chosen) setTplId(chosen.id);
        else setErr('Nenhum template publicado ainda. Cadastre um em “Templates”.');
      } catch (e: any) {
        setErr(e?.meta?.message || 'Não foi possível carregar o template para preview.');
      }
    })();
  }, []);

  return (
    <div className="k-card">
      <h2>Preview do Template</h2>
      <p className="k-muted">
        Renderizador único: este HTML A4 é exatamente o que o link público e o PDF vão usar
        (dados de exemplo). A marca d'água “RASCUNHO” aparece em modo rascunho.
      </p>
      {err && <div className="k-msg k-msg-err">{err}</div>}
      {tplId != null ? (
        <div className="k-preview-frame">
          <iframe title="Preview do template" src={`/api/koala/templates/${tplId}/preview`} />
        </div>
      ) : (
        !err && <div className="k-muted k-sm">Carregando template…</div>
      )}
    </div>
  );
}
