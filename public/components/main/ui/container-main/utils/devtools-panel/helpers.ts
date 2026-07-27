// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:devtools-panel:helpers
// PURPOSE: DevTools Panel - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   formatStatus() — exported function
//   createElement() — exported function
//   formatTimestamp() — exported function
//   info() — exported function
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

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:devtools-panel:helpers';

// Formata status com classe CSS
export function formatStatus(status: string) {
  const statusClass = status?.toLowerCase() || 'unknown';
  return `<span class="cm-devtools-status ${statusClass}">${status || 'UNKNOWN'}</span>`;
}

// Cria elemento DOM
export function createElement(tag: string, className: string, content = '') {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (content) el.innerHTML = content;
  return el;
}

// Formata timestamp
export function formatTimestamp(date = new Date()) {
  return date.toLocaleTimeString();
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['formatStatus', 'createElement', 'formatTimestamp']
  };
}

export default {
  VERSION,
  MODULE_ID,
  formatStatus,
  createElement,
  formatTimestamp,
  info
};
