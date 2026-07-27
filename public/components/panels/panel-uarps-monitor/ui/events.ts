// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-uarps-monitor:ui/events
// PURPOSE: UARPS Monitor UI event binding
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   bindEvents() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-uarps-monitor:ui/events';

export function bindEvents(container: HTMLElement, callbacks: { canRefresh: () => boolean; refresh: () => unknown }) {
  if (!container) return;

  container.querySelectorAll('[data-action="refresh"]').forEach((btn: Element) => {
    btn.addEventListener('click', () => {
      if (callbacks.canRefresh()) callbacks.refresh();
    });
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
