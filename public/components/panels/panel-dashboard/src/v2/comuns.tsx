// v2/comuns.tsx — peças da Geral V2 usadas pela página e pela lista: carregamento por bloco e a linha "Com problema".
import { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { ErroV2, fmtQuando } from './servico';

// ── carregamento por bloco: guarda o último valor válido (falha depois de um sucesso = "Desatualizado") ──
export function useBloco<T>(carregar: (s: AbortSignal) => Promise<T>, deps: unknown[]) {
  const [dados, setDados] = useState<T | null>(null);
  const [erro, setErro] = useState<ErroV2 | Error | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [atualizando, setAtualizando] = useState(false);
  const okEm = useRef<string | null>(null); const tem = useRef(false); const falhou = useRef(false); const seq = useRef(0);
  const executar = useCallback(() => {
    const id = ++seq.current; const ctrl = new AbortController();
    // depois de um sucesso OU de uma falha, buscar de novo = "atualizando" (a falha fica na tela com "Tentando…"); esqueleto só na 1ª carga
    if (tem.current || falhou.current) setAtualizando(true); else setCarregando(true);
    carregar(ctrl.signal).then((r) => { if (id !== seq.current) return; tem.current = true; okEm.current = new Date().toISOString(); setDados(r); setErro(null); })
      .catch((e) => { if (id !== seq.current) return; falhou.current = true; setErro(e instanceof Error ? e : new Error(String(e))); })
      .finally(() => { if (id !== seq.current) return; setCarregando(false); setAtualizando(false); });
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => executar(), [executar]);
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
