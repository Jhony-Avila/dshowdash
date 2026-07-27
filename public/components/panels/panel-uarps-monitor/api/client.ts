// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-uarps-monitor:api/client
// PURPOSE: UARPS Monitor API client
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   fetchAPI() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-uarps-monitor:api/client';

const API_BASE = '/api/uarps-status.php';

export async function fetchAPI(action: string, { signal }: { signal?: AbortSignal } = {}) {
  const response = await fetch(`${API_BASE}?action=${action}`, {
    credentials: 'include',
    headers: { 'Accept': 'application/json' },
    signal
  });
  const json = await response.json();
  if (!json.ok) throw new Error(json.error || 'API Error');
  return json.data;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE }; }
