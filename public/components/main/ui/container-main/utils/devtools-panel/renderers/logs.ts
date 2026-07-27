// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:devtools-panel:renderers:logs
// PURPOSE: DevTools Panel - Logs Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderLogs() — exported function
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

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:devtools-panel:renderers:logs';

export function renderLogs(logs: unknown[] = []) {
  if (logs.length === 0) return '<p>No logs captured</p>';

  return `
    <div class="cm-devtools-section">
      <button class="cm-devtools-btn" onclick="window.__cmDevTools.clearLogs()">Clear Logs</button>
    </div>
    <div class="cm-devtools-section">
      ${logs.slice(-50).reverse().map((log: unknown) => `
        <div class="cm-devtools-log ${(log as Record<string, unknown>).level}">
          <strong>[${(log as Record<string, unknown>).timestamp}]</strong> ${(log as Record<string, unknown>).message}
        </div>
      `).join('')}
    </div>
  `;
}

export default { VERSION, MODULE_ID, renderLogs };
