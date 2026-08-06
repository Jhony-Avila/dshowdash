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
import { lerCriticos, limparCriticos } from '../services/Log';
import { MOVIMENTOS, animar } from './movimento';
import { flag } from '../nucleo/flags'; // mega 381 (§183)
import { itemPorId } from '../services/AvatarCatalog'; // lote 461-470 (§293)
import { itensUsados } from '../services/Progresso';
import { lerRecentes } from '../services/Recentes';

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
  const criticos = lerCriticos(); // mega 279 (§291 v2): ring do suporte

  // mega 278 (§290 v2): MEMÓRIA JS quando o navegador expõe (Chrome) —
  // honesto: ausente = não mostra, nunca estima
  const memoria = (() => {
    try {
      const m = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
      if (!m) return null;
      return {
        usadoMb: Math.round(m.usedJSHeapSize / 1048576),
        limiteMb: Math.round(m.jsHeapSizeLimit / 1048576),
      };
    } catch { return null; }
  })();

  // mega 109: SAÚDE DO STORAGE — uso por chave dshow.* (só leitura)
  // mega 307 (§629 v2): STORAGE DOCTOR — chave que deveria ser JSON e não
  // parseia = CORROMPIDA (aparece marcada; chaves de texto puro são OK)
  const CHAVES_TEXTO = ['dshow.avst5.tour.v1', 'dshow.avst5.p3d.marca.v1'];
  const storage = (() => {
    try {
      const linhas: Array<{ chave: string; kb: number; sana: boolean }> = [];
      let total = 0;
      for (let i = 0; i < localStorage.length; i += 1) {
        const k = localStorage.key(i);
        if (!k?.startsWith('dshow.')) continue;
        const bruto = localStorage.getItem(k) ?? '';
        const kb = Math.round((bruto.length * 2) / 1024 * 10) / 10;
        let sana = true;
        if (!CHAVES_TEXTO.includes(k)) {
          try { JSON.parse(bruto); } catch { sana = false; }
        }
        linhas.push({ chave: k, kb, sana });
        total += kb;
      }
      linhas.sort((a, b) => Number(a.sana) - Number(b.sana) || b.kb - a.kb);
      return { linhas: linhas.slice(0, 10), total: Math.round(total * 10) / 10, corrompidas: linhas.filter((l) => !l.sana).length };
    } catch { return { linhas: [], total: 0, corrompidas: 0 }; }
  })();

  // ── lote 461-470 (§292-§294, flag as5.analytics_local) ──
  // mega 461-463 (§293): HEATMAP local — uso por categoria (dados que o
  // usuário já produziu; nada de rede, nada de PII)
  const heatmap = (() => {
    if (!flag('as5.analytics_local')) return null;
    const porCat = new Map<string, number>();
    for (const id of itensUsados()) {
      const cat = itemPorId(id)?.categoria;
      if (cat) porCat.set(cat, (porCat.get(cat) ?? 0) + 1);
    }
    const linhas = [...porCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8);
    const max = linhas[0]?.[1] ?? 1;
    return { linhas, max, topRecentes: lerRecentes().slice(0, 5).map((id) => itemPorId(id)?.nome ?? id) };
  })();
  // megas 464-466 (§294): contagem por EVENTO do ring da telemetria
  const porEvento = (() => {
    if (!flag('as5.analytics_local')) return null;
    const m = new Map<string, number>();
    for (const e of eventos) m.set(e.evento, (m.get(e.evento) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
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
        {/* mega 279 (§291 v2): críticos persistidos — o que o suporte lê */}
        {criticos.length > 0 && (
          <div className="avst5-tlm-storage" data-teste="tlm-criticos">
            <h4>Críticos persistidos · {criticos.length} (sobrevivem ao reload)</h4>
            <ul>
              {criticos.slice(0, 8).map((c, i) => (
                <li key={`${c.quando}-${i}`}>
                  <code>{c.quando.slice(11, 19)} {c.evento}</code>
                  <em>{JSON.stringify(c.dados)}</em>
                </li>
              ))}
            </ul>
            <button type="button" className="avst-botao" data-teste="tlm-criticos-limpar"
              onClick={() => { limparCriticos(); setTic((t) => t + 1); }}>
              <Trash2 size={12} aria-hidden /> Limpar críticos</button>
          </div>
        )}
        {/* lote 461-470 (§293/§294, flag as5.analytics_local) */}
        {heatmap && heatmap.linhas.length > 0 && (
          <div className="avst5-tlm-storage" data-teste="heatmap">
            <h4>Heatmap de uso (§293) · categorias mais exploradas</h4>
            <ul>
              {heatmap.linhas.map(([cat, n]) => (
                <li key={cat}>
                  <code>{cat}</code>
                  <em>
                    <i aria-hidden style={{ display: 'inline-block', height: 6, borderRadius: 3, background: 'var(--avst-acento, #7c5cff)', width: `${Math.max(8, (n / heatmap.max) * 90)}px`, marginRight: 6 }} />
                    {n}
                  </em>
                </li>
              ))}
            </ul>
            {heatmap.topRecentes.length > 0 && (
              <p className="avst5-tlm-nota" data-teste="heatmap-recentes">Últimos usados: {heatmap.topRecentes.join(' · ')}</p>
            )}
          </div>
        )}
        {porEvento && porEvento.length > 0 && (
          <div className="avst5-tlm-storage" data-teste="por-evento">
            <h4>Eventos da sessão (§294) · top {porEvento.length}</h4>
            <ul>
              {porEvento.map(([ev, n]) => (
                <li key={ev}><code>{ev}</code><em>×{n}</em></li>
              ))}
            </ul>
          </div>
        )}
        {/* mega 109: saúde do localStorage (top 10 chaves dshow.*) */}
        <div className="avst5-tlm-storage" data-teste="tlm-storage">
          <h4>
            Storage local · {storage.total}KB em chaves dshow.*
            {memoria && <> · heap JS {memoria.usadoMb}/{memoria.limiteMb}MB (§290)</>}
            {/* mega 307 (§629 v2): doctor — resumo honesto */}
            {/* mega 381 (§183, flag as5.orcamento_perf): orçamento honesto —
                ~5MB de localStorage; >80% = aviso de verdade */}
            {flag('as5.orcamento_perf') && storage.total > 4000 && (
              <strong data-teste="orcamento-aviso"> · ORÇAMENTO §183: {Math.round((storage.total / 5000) * 100)}% do storage</strong>
            )}
            {storage.corrompidas > 0
              ? <> · <strong data-teste="doctor-corrompidas">{storage.corrompidas} corrompida(s)</strong></>
              : <> · doctor OK (§629)</>}
          </h4>
          <ul>
            {storage.linhas.map((l) => (
              <li key={l.chave} data-sana={l.sana ? undefined : '0'}>
                <code>{l.chave}</code><em>{l.kb}KB{l.sana ? '' : ' · CORROMPIDA'}</em>
              </li>
            ))}
          </ul>
        </div>
        <p className="avst5-tlm-nota">Só nesta aba, sem PII, nada persiste (§290).</p>
      </div>
    </div>
  );
}
