// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-02/ui/table/helpers
// PURPOSE: Panel-02 Table Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Formatters from ../../utils/formatters.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//   escapeHtml — exported value
//   formatNumber — exported value
//   formatDateTime — exported value
//   formatDuration — exported value
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

export { 
  escapeHtml, 
  formatNumber, 
  formatDateTime, 
  formatDuration 
} from '../../utils/formatters.js';

export const MODULE_ID = 'panel-02/ui/table/helpers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } }; }

import Formatters from '../../utils/formatters.js';
export default { 
  escapeHtml: Formatters.escapeHtml, 
  formatNumber: Formatters.formatNumber, 
  formatDateTime: Formatters.formatDateTime, 
  formatDuration: Formatters.formatDuration 
};
