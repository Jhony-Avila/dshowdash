// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-uarps-monitor:core/state
// PURPOSE: UARPS Monitor state management
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   state — exported value
//   resetState() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-uarps-monitor:core/state';

export const state: {
  mounted: boolean;
  loading: boolean;
  error: string | null;
  status: Record<string, unknown> | null;
  inventory: Record<string, unknown> | null;
  divergences: Record<string, unknown>[];
  stats: Record<string, unknown> | null;
  lastRefresh: Date | null;
  autoRefreshInterval: ReturnType<typeof setInterval> | null;
} = {
  mounted: false,
  loading: false,
  error: null,
  status: null,
  inventory: null,
  divergences: [],
  stats: null,
  lastRefresh: null,
  autoRefreshInterval: null
};

export function resetState() {
  state.mounted = false;
  state.loading = false;
  state.error = null;
  state.status = null;
  state.inventory = null;
  state.divergences = [];
  state.stats = null;
  state.lastRefresh = null;
  state.autoRefreshInterval = null;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
