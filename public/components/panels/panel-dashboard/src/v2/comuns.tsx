// v2/comuns.tsx — peças da Geral V2 usadas pela página e pela lista: carregamento por bloco e a linha "Com problema".
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErroV2, fmtQuando } from './servico';

// ── carregamento por bloco: guarda o último valor válido (falha depois de um sucesso = "Desatualizado") ──
// F03 (achado da VINHO 09:23/09:24, verificador v2): (1) uma NEGATIVA de acesso confirmada (401/403/404 do portão) APAGA a última leitura —
// valor protegido nunca fica na tela depois da recusa; erro transitório (5xx/rede) continua com a última leitura + aviso. (2) `reconsultarAoVoltar`:
// a mesma montagem lê de novo quando a aba volta a ficar visível ou a janela recebe foco (no máximo 1×/min), para a revogação chegar sem recarregar.
export const negativaDeAcesso = (e: unknown) => e instanceof ErroV2 && (e.http === 401 || e.http === 403 || e.http === 404);
// (3) `reconsultarEm` (decisão do arquiteto 27/11): relê no horário que o SERVIDOR informa (a próxima rodada do coletor + 2 min) SÓ com a aba visível;
// com a aba oculta o relógio é desarmado (nenhum timer em segundo plano) e a volta à aba cobre a leitura. Sem o horário do servidor, nada é inventado.
export function useBloco<T>(carregar: (s: AbortSignal) => Promise<T>, deps: unknown[], opc: { reconsultarAoVoltar?: boolean; reconsultarEm?: (d: T) => string | null | undefined } = {}) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<ErroV2 | Error | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const okEm = useRef<string | null>(null); const tem = useRef(false); const falhou = useRef(false); const seq = useRef(0); const ultimo = useRef(0);
  const executar = useCallback(() => {
    const id = ++seq.current; const ctrl = new AbortController(); ultimo.current = Date.now();
    // depois de um sucesso OU de uma falha, buscar de novo = "atualizando" (a falha fica na tela com "Tentando…"); esqueleto só na 1ª carga
    if (tem.current || falhou.current) setAtualizando(true); else setCarregando(true);
    carregar(ctrl.signal).then((r) => { if (id !== seq.current) return; tem.current = true; okEm.current = new Date().toISOString(); setDados(r); setErro(null); })
      .catch((e) => { if (id !== seq.current) return; falhou.current = true;
        if (negativaDeAcesso(e)) { setDados(null); tem.current = false; okEm.current = null; }   // F03: a recusa apaga o valor protegido
        setErro(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (id !== seq.current) return; setCarregando(false); setAtualizando(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => executar(), [executar]);
  const alvoIso = dados && opc.reconsultarEm ? opc.reconsultarEm(dados) ?? null : null;
  useEffect(() => {
    if (!alvoIso) return; const alvo = Date.parse(alvoIso) + 120_000; if (!Number.isFinite(alvo)) return;
    let t: ReturnType<typeof setTimeout> | null = null;
    const armar = () => { if (t) { clearTimeout(t); t = null; } if (document.visibilityState !== 'visible') return;   // oculta: nada armado
      const falta = alvo - Date.now(); if (falta <= 0) return;                                                         // passou: a volta à aba cobre
      t = setTimeout(() => { t = null; if (document.visibilityState === 'visible') executar(); }, Math.min(falta, 2_147_000_000)); };
    armar(); document.addEventListener('visibilitychange', armar);
    return () => { if (t) clearTimeout(t); document.removeEventListener('visibilitychange', armar); };
  }, [alvoIso, executar]);
  const reconsultar = !!opc.reconsultarAoVoltar;
  useEffect(() => {
    if (!reconsultar) return;
    const talvez = () => { if (document.visibilityState === 'visible' && Date.now() - ultimo.current >= 60_000) executar(); };
    document.addEventListener('visibilitychange', talvez); window.addEventListener('focus', talvez);
    return () => { document.removeEventListener('visibilitychange', talvez); window.removeEventListener('focus', talvez); };
  }, [executar, reconsultar]);
  return { dados, erro, carregando, atualizando, recarregar: executar, okEm: okEm.current };
}

/** COM PROBLEMA (mesmo vocabulário dos "Estados da Geral", 8d7f6ff0): o que falhou + último sucesso + Tentar de novo. */
export function Problema({ motivo, quando, onTentar, tentando }: { motivo: string; quando: string | null; onTentar: () => void; tentando: boolean }) {
  return (
    <div className="gv2-problema" role="status" data-gv2-problema>
      <AlertTriangle size={14} aria-hidden className="gv2-problema-ic" />
      <div className="gv2-problema-corpo">
        <span className="gv2-problema-motivo">{motivo}</span>
        <div className="gv2-problema-linha2">
          <span className="gv2-fraco">{quando ? `Último sucesso ${fmtQuando(quando)}` : 'Sem leitura válida recente'}</span>
          <button type="button" className="gv2-btn" onClick={onTentar} disabled={tentando} aria-busy={tentando}>
            <RefreshCw size={13} aria-hidden className={tentando ? 'gv2-girando' : undefined} /> {tentando ? 'Tentando…' : 'Tentar de novo'}
          </button>
        </div>
      </div>
    </div>
  );
}
