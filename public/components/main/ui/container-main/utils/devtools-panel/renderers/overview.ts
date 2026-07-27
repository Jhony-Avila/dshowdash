// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:devtools-panel:renderers:overview
// PURPOSE: DevTools Panel - Overview Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatStatus from ../helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderOverview() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__cmDevTools
// ═══════════════════════════════════════════════════════════════
'use strict';

import { formatStatus } from '../helpers.js';

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:devtools-panel:renderers:overview';

export function renderOverview(bootstrap: Record<string, unknown>) {
  if (!bootstrap) return '<p>Bootstrap not connected</p>';

  const info = (bootstrap.info as (...args: unknown[]) => unknown)();
  const state = (bootstrap.getState as (...args: unknown[]) => unknown)();

  return `
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">System Status</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Bootstrap State</span>
        <span class="cm-devtools-value">${formatStatus((state as string))}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Version</span>
        <span class="cm-devtools-value">${(info as Record<string, unknown>).version || 'N/A'}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Kernel State</span>
        <span class="cm-devtools-value">${(info as Record<string, unknown>).kernelState || 'N/A'}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Managers Active</span>
        <span class="cm-devtools-value">${(info as Record<string, unknown>).managersActive || 0}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Plugins Active</span>
        <span class="cm-devtools-value">${(info as Record<string, unknown>).pluginsActive || 0}</span>
      </div>
    </div>
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">Boot Metrics</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Total Time</span>
        <span class="cm-devtools-value">${((info as Record<string, unknown>).bootMetrics as Record<string, unknown>)?.totalTime ? (((info as Record<string, unknown>).bootMetrics as Record<string, unknown>).totalTime as number).toFixed(2) : 'N/A'}ms</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Rating</span>
        <span class="cm-devtools-value">${((info as Record<string, unknown>).bootMetrics as Record<string, unknown>)?.rating || 'N/A'}</span>
      </div>
    </div>
    <div class="cm-devtools-section">
      <button class="cm-devtools-btn" onclick="window.__cmDevTools.refresh()">Refresh</button>
      <button class="cm-devtools-btn" onclick="window.__cmDevTools.snapshot()">Snapshot</button>
      <button class="cm-devtools-btn danger" onclick="window.__cmDevTools.reboot()">Reboot</button>
    </div>
  `;
}

export default { VERSION, MODULE_ID, renderOverview };
