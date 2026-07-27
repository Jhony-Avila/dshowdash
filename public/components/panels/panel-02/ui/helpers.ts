// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/helpers
// PURPOSE: Panel-02 UI Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   escapeHtml as _escapeHtml from ../utils/formatters.js
//
// PROVIDES:
//   escapeHtml — exported value
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

import { escapeHtml as _escapeHtml } from '../utils/formatters.js';

export const escapeHtml = _escapeHtml;

export const MODULE_ID = 'panel-02/ui/helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } }; }

export default { escapeHtml };
