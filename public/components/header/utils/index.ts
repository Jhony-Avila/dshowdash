// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/utils
// PURPOSE: Barrel re-export index for all header utility modules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * from ./dom.js
//   HeaderAnnouncer from ./header-announcer.js
//   HeaderTooltip from ./header-tooltip.js
//   * from ./html-helpers.js
//   OverlayRoot, getOverlayRoot, createOverlayContainer from ./overlay-root.js
//   TimersManager from ./timers.js
// PROVIDES:
//   Re-exports all header utility modules
//   info() — module metadata
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header Utils - Module Index
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B01: var → const
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/utils';

// Utilities
export * from './dom.js';
export { HeaderAnnouncer } from './header-announcer.js';

export { HeaderTooltipManager as HeaderTooltip } from './header-tooltip.js';
// Explicit named exports to avoid TS2308 conflicts with dom.js
export { escapeHtml, sanitizeString, createElementFromHTML, resetMetrics } from './html-helpers.js';

export { default as OverlayRoot, getOverlayRoot, ensureOverlayRoot as createOverlayContainer } from './overlay-root.js';
export { TimersManager } from './timers.js';

// Module list
export const modules = ['dom', 'header-announcer', 'header-tooltip', 'html-helpers', 'overlay-root', 'timers'];

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}

export default { VERSION, MODULE_ID, modules, info };
