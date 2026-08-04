// shell/TelemetriaDev.tsx — VIEWER de telemetria local (AS5 · mega 46).
// @version 1.0.0  @created 2026-08-04
//
// Observabilidade §290 sem servidor: lista viva dos últimos eventos do
// ring buffer (Telemetria.ts), export JSON p/ anexar em issue e limpar.
// Só existe atrás da flag as5.telemetria_painel (dev) — aberto pela
// paleta §566. Nada aqui persiste nem sai da aba.
import { useEffect, useRef, useState } from 'react';
import { Download, ScrollText, Trash2 } from 'lucide-react';
import { assinarTelemetria, eventosRecentes, limparTelemetria } from '../services/Telemetria';
import { MOVIMENTOS, animar } from './movimento';

export function TelemetriaDev({ aoFechar }: { aoFechar: () => void }) {
  const [tic, setTic] = useState(0);
  void tic;
  const refCaixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    void animar(refCaixa.current, MOVIMENTOS.aparecer, { duracao: 160, easing: 'ease-out' });
    // mega 104 (§548): foco entra no diálogo ao abrir
    refCaixa.current?.setAttribute('tabindex', '-1');
    refCaixa.current?.focus();
    const cancelar = assinarTelemetria(() => setTic((t) => t + 1));
    const aoEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') aoFechar(); };
    window.addEventListener('keydown', aoEsc);
    return () => { cancelar(); window.removeEventListener('keydown', aoEsc); };
  }, [aoFechar]);

  const eventos = eventosRecentes();

  // mega 109: SAÚDE DO STORAGE — uso por chave dshow.* (só leitura)
  const storage = (() => {
    try {
      const linhas: Array<{ chave: string; kb: number }> = [];
      let total = 0;
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (!k?.startsWith('dshow.')) continue;
        const kb = Math.round(((localStorage.getItem(k)?.length ?? 0) * 2) / 1024 * 10) / 10;
        linhas.push({ chave: k, kb });
        total += kb;
      }
      linhas.sort((a, b) => b.kb - a.kb);
      return { linhas: linhas.slice(0, 10), total: Math.round(total * 10) / 10 };
    } catch { return { linhas: [], total: 0 }; }
  })();

  const exportar = () => {
    const blob = new Blob([JSON.stringify(eventos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dshow-telemetria-${new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
  };

  return (
    <div className="avst5-detalhe-fundo" role="dialog" aria-modal="true" aria-label="Telemetria local (dev)">
      <button type="button" className="avst-fpop-fundo" aria-label="Fechar" onClick={aoFechar} />
      <div ref={refCaixa} className="avst5-tlm" data-teste="telemetria-dev">
        <h3><ScrollText size={15} aria-hidden /> Telemetria local · últimos {eventos.length} eventos</h3>
        <div className="avst5-tlm-acoes">
          <button type="button" className="avst-botao" data-teste="tlm-exportar"
            disabled={!eventos.length} onClick={exportar}>
            <Download size={12} aria-hidden /> Exportar JSON</button>
          <button type="button" className="avst-botao" data-teste="tlm-limpar"
            disabled={!eventos.length} onClick={limparTelemetria}>
            <Trash2 size={12} aria-hidden /> Limpar</button>
        </div>
        {eventos.length === 0 ? (
          <p className="avst5-tlm-vazio">Nenhum evento ainda — interaja com o estúdio.</p>
        ) : (
          <ol className="avst5-tlm-lista" data-teste="tlm-lista">
            {[...eventos].reverse().map((e, i) => (
              <li key={`${e.em}-${i}`}>
                <time>{new Date(e.em).toLocaleTimeString('pt-BR')}</time>
                <strong>{e.evento}</strong>
                <code>{JSON.stringify(e.dados)}</code>
              </li>
            ))}
          </ol>
        )}
        {/* mega 109: saúde do localStorage (top 10 chaves dshow.*) */}
        <div className="avst5-tlm-storage" data-teste="tlm-storage">
          <h4>Storage local · {storage.total}KB em chaves dshow.*</h4>
          <ul>
            {storage.linhas.map((l) => (
              <li key={l.chave}><code>{l.chave}</code><em>{l.kb}KB</em></li>
            ))}
          </ul>
        </div>
        <p className="avst5-tlm-nota">Só nesta aba, sem PII, nada persiste (§290).</p>
      </div>
    </div>
  );
}
