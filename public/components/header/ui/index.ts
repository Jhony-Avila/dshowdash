// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui
// PURPOSE: Barrel index re-exporting all header UI sub-modules
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CustomizationOverlay from ./customization-overlay.js
//   EnvChip from ./env-chip.js
//   RippleEffect, createRipple from ./ripple.js
//   ScrollDetector from ./scroll-detector.js
//   headerTemplate from ./template.js
//   TooltipManager from ./tooltips.js
// PROVIDES:
//   Re-exports all imported UI components
//   modules — list of sub-module names
//   info() — returns module metadata
// ═══════════════════════════════════════════════════════════════
// Header UI - Module Index
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B01: var → const
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/ui';

// UI Components
export { CustomizationOverlay } from './customization-overlay.js';

// @ts-expect-error TS migration - TS2724
export { EnvChip } from './env-chip.js';

export { default as RippleEffect } from './ripple.js';
export { RippleManager as createRipple } from './ripple.js';
export { ScrollDetector } from './scroll-detector.js';
export { headerTemplate } from './template.js';

// @ts-expect-error TS migration - TS2724
export { TooltipManager } from './tooltips.js';

// Module list
export const modules = ['customization-overlay', 'env-chip', 'ripple', 'scroll-detector', 'template', 'tooltips'];

export function info() {
    return { version: VERSION, moduleId: MODULE_ID, modules, totalModules: modules.length };
}

export default { VERSION, MODULE_ID, modules, info };
