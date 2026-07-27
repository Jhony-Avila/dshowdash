// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/render/error
// PURPOSE: Panel-02 Render Error
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   escapeHtml from ../helpers.js
//
// PROVIDES:
//   renderError() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
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

import { escapeHtml } from '../helpers.js';

export function renderError(message: string) {
  return `
    <div class="p02-error-state" role="alert">
      <svg class="p02-error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <p class="p02-error-message">${escapeHtml(message) || 'Erro ao carregar dados'}</p>
      <button class="p02-retry-btn" data-action="retry">Tentar novamente</button>
    </div>
  `;
}

export default { renderError };

export const MODULE_ID = 'panel-02/ui/render/error';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
