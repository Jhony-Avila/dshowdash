// screens/usarDados.ts — hook de carregamento das telas.
// @version 1.0.0  @created 2026-07-30
//
// Uma tela nunca chama `fetch`: chama o serviço através deste hook, que cuida de
// carregamento, erro, cancelamento e de publicar a procedência para o rodapé.
//
// ⚠️ CANCELAMENTO É OBRIGATÓRIO (§74). Trocar de tela ou de período dispara requisição nova;
// sem `AbortController` a resposta antiga pode chegar DEPOIS da nova e sobrescrever a tela com
// dado velho — bug que aparece só em rede lenta e é dificílimo de reproduzir depois.
import { useEffect, useState } from 'react';
import type { ComMeta } from '../services/GoogleAnalyticsService';
import type { MetaProcedencia } from '../shell/types';

export interface EstadoDados<T> {
  dados: T | null;
  meta: MetaProcedencia | null;
  carregando: boolean;
  erro: { message: string; status?: number; pendencias?: string[] } | null;
}

export function usarDados<T>(
  buscar: (sinal: AbortSignal) => Promise<ComMeta<T>>,
  deps: unknown[],
  onMeta?: (m: MetaProcedencia | null) => void,
): EstadoDados<T> {
  const [estado, setEstado] = useState<EstadoDados<T>>({ dados: null, meta: null, carregando: true, erro: null });

  useEffect(() => {
    const ctrl = new AbortController();
    let vivo = true;

    // ⚠️ Preserva o último dado válido durante a recarga (§69.1: "sem spinner central único",
    // "preservação do último dado válido"). Zerar aqui faria a tela piscar em cada troca de
    // período — e num painel de análise piscar é ruído.
    setEstado((a) => ({ ...a, carregando: true, erro: null }));

    buscar(ctrl.signal)
      .then((r) => {
        if (!vivo) return;
        setEstado({ dados: r.dados, meta: r.meta, carregando: false, erro: null });
        onMeta?.(r.meta);
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        // Abort não é erro: é troca de tela/filtro. Mostrar "falhou" aqui seria mentira.
        if (e instanceof DOMException && e.name === 'AbortError') return;
        const err = e as { message?: string; status?: number; pendencias?: string[] };
        setEstado((a) => ({
          ...a,
          carregando: false,
          erro: { message: err.message ?? 'Falha inesperada.', status: err.status, pendencias: err.pendencias },
        }));
      });

    return () => { vivo = false; ctrl.abort(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return estado;
}
