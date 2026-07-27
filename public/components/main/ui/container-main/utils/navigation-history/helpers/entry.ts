// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: entry
// PURPOSE: Navigation History - Entry Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createEntry() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.navigation-history.helpers.entry';

export function createEntry(panelId: string, state: Record<string, unknown> = {}, title = '', config: Record<string, unknown>) {
  return {
    id: `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    panelId,
    state,
    title: title || panelId,
    timestamp: Date.now(),
    url: config.useBrowserHistory ? `${config.baseUrl}/${panelId}` : null
  };
}
