import { useState } from 'react';
import { apiSend } from '../../api/client';

// F3 — Ações de PDF: gerar (pelo renderizador único = fiel ao preview) e baixar.
// Marca d'água segue o status da proposta: rascunho => "RASCUNHO"; demais => final.
export function PdfActions({ proposalId, status }: { proposalId: number; status: string }) {
  const [state, setState] = useState<'idle' | 'generating' | 'ready' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const isDraft = status === 'draft';
  const pdfUrl = '/api/koala/proposals/' + proposalId + '/pdf';

  async function generate() {
    setState('generating');
    setMsg('');
    try {
      const r = await apiSend('POST', '/proposals/' + proposalId + '/generate-pdf', {});
      setState('ready');
      const kb = Math.round((r?.bytes || 0) / 1024);
      setMsg('PDF gerado (' + kb + ' KB' + (r?.mode === 'draft' ? ", com marca d'água" : '') + ').');
    } catch (e: any) {
      setState('error');
      setMsg(e?.meta?.message || e?.message || 'Falha ao gerar o PDF.');
    }
  }

  function download() {
    // GET autenticado (cookie); gera on-demand no backend se ainda não existir.
    window.open(pdfUrl, '_blank', 'noopener');
  }

  return (
    <div className="k-pdf-actions">
      <button className="k-btn k-btn-primary" onClick={generate} disabled={state === 'generating'}>
        {state === 'generating' ? 'Gerando…' : 'Gerar PDF'}
      </button>
      <button className="k-btn k-btn-ghost" onClick={download} disabled={state === 'generating'}>
        Baixar PDF
      </button>
      {isDraft && <span className="k-sm k-pdf-hint">rascunho → marca d'água</span>}
      {msg && <span className={'k-sm ' + (state === 'error' ? 'k-pdf-err' : 'k-pdf-ok')}>{msg}</span>}
    </div>
  );
}
