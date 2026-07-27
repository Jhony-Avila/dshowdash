// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-render-footer
// PURPOSE: Panel-11 Render Footer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../../core/constants.js
//   formatNumber from ../helpers.js
//
// PROVIDES:
//   renderFooter() — exported function
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

import { ICONS } from '../../core/constants.js';
import { formatNumber } from '../helpers.js';

export function renderFooter(data: Record<string, unknown>, filters: Record<string, unknown>) {
  const dataNode = (data.data as Record<string, unknown>) || {};
  const exec = (dataNode.executions as Record<string, unknown>) || {};
  const jobs = (dataNode.jobs as Record<string, unknown>) || {};

  return `
    <footer class="p11-footer">
      <div class="p11-footer-left">
        <span class="p11-footer-stat">${ICONS.bolt} Total: <strong>${formatNumber(exec.total || 0)}</strong></span>
        <span class="p11-footer-stat">${ICONS.check} Sucesso: <strong>${formatNumber(exec.success || 0)}</strong></span>
        <span class="p11-footer-stat">${ICONS.server} Jobs: <strong>${jobs.total || 0}</strong></span>
      </div>
      <div class="p11-footer-right">
        <span class="p11-footer-info">Período: ${filters.period} | Auto-refresh: 60s</span>
      </div>
    </footer>
  `;
}

export default { renderFooter };

export const MODULE_ID = 'panels-ui-render-footer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { footerReady: true } }; }
