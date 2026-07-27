/* ═══════════════════════════════════════════════════════════════
 * panel-criacao-botoes/core/panels-source.ts
 * @version 1.0.0
 * Leitura dos painéis REAIS (panel_registry) via endpoint existente
 * GET /api/admin/panels. É READ — não duplica nenhuma lógica de
 * escrita; o nav-adapter compartilhado cobre só a escrita em nav.
 * ═══════════════════════════════════════════════════════════════ */
'use strict';

import { PANELS_API, PANELS_API_QUERY } from './constants.js';
import type { RealPanel } from './types.js';

interface FetchOpts {
  signal?: AbortSignal;
}

/** Busca painéis reais ativos do panel_registry. Retorna [] em falha. */
export async function fetchRealPanels(opts: FetchOpts = {}): Promise<RealPanel[]> {
  try {
    const res = await fetch(`${PANELS_API}${PANELS_API_QUERY}`, {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
      signal: opts.signal,
    });
    if (!res.ok) return [];
    const json = await res.json();
    const data = Array.isArray(json?.data) ? json.data : [];
    return data.map(
      (p: Record<string, unknown>): RealPanel => ({
        panel_id: String(p.panel_id),
        title: String(p.title ?? p.panel_id),
        category: String(p.category ?? ''),
        icon: (p.icon as string) ?? null,
        is_active: Boolean(p.is_active),
      })
    );
  } catch {
    return [];
  }
}
