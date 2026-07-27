// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:devtools-panel:renderers:plugins
// PURPOSE: DevTools Panel - Plugins Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatStatus from ../helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderPlugins() — exported function
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
export const MODULE_ID = 'container-main:devtools-panel:renderers:plugins';

export function renderPlugins(bootstrap: unknown) {
  // @ts-expect-error TS migration - TS2339
  const pluginSystem = bootstrap?.getPluginSystem();
  if (!pluginSystem) return '<p>Plugin system not available</p>';

  const plugins = pluginSystem.list?.() || [];

  if (plugins.length === 0) return '<p>No plugins registered</p>';

  return `
    <div class="cm-devtools-section">
      <div class="cm-devtools-section-title">Registered Plugins (${plugins.length})</div>
      ${plugins.map((p: unknown) => `
        <div class="cm-devtools-row">
          <span class="cm-devtools-label">${(p as Record<string, unknown>).name}</span>
          <span class="cm-devtools-value">${formatStatus((p as Record<string, unknown>).state as string)}</span>
        </div>
      `).join('')}
    </div>
  `;
}

export default { VERSION, MODULE_ID, renderPlugins };
