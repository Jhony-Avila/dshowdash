// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:devtools-panel:renderers:performance
// PURPOSE: DevTools Panel - Performance Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatStatus from ../helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderPerformance() — exported function
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

import { formatStatus } from '../helpers.js';

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:devtools-panel:renderers:performance';

export function renderPerformance(bootstrap: unknown) {
  // @ts-expect-error TS migration - TS2339
  const perfMonitor = bootstrap?.getPerformanceMonitor();
  if (!perfMonitor) return '<p>Performance monitor not available</p>';

  const snapshot = perfMonitor.collect?.() || {};
  const health = perfMonitor.healthCheck?.() || {};

  return `
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">Memory</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Used</span>
        <span class="cm-devtools-value">${snapshot.memory?.usedMB?.toFixed(2) || 'N/A'} MB</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Leak Detected</span>
        <span class="cm-devtools-value">${snapshot.memory?.leak ? 'Yes ⚠️' : 'No ✓'}</span>
      </div>
    </div>
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">FPS</div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Current</span>
        <span class="cm-devtools-value">${snapshot.fps?.current || 'N/A'}</span>
      </div>
      <div class="cm-devtools-row">
        <span class="cm-devtools-label">Status</span>
        ${formatStatus(health.status)}
      </div>
    </div>
  `;
}

export default { VERSION, MODULE_ID, renderPerformance };
