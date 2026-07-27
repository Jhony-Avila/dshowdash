// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-button-dashboard-contracts
// PURPOSE: Footer dashboard Button - Contracts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   BUTTON_CONFIG — exported value
//   EMITTED_EVENTS — exported value
//   ACTION_PAYLOAD — exported value
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const MODULE_ID = 'footer-button-dashboard-contracts';
const VERSION = '1.2.0-P18EC';

export const BUTTON_CONFIG = { id: 'dashboard', area: 'footer', label: 'dashboard', icon: 'dashboard', kind: 'navigation' };
export const EMITTED_EVENTS = [UI_EVENTS.ACTION];
export const ACTION_PAYLOAD = { actionId: 'footer:dashboard', meta: {} };

export function getMetrics() { return { configLoaded: true }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, config: BUTTON_CONFIG, events: EMITTED_EVENTS, p18Compliant: true }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { configValid: !!BUTTON_CONFIG.id, p18Events: true }, metrics: getMetrics() }; }

export { MODULE_ID, VERSION };
export default { VERSION, MODULE_ID, BUTTON_CONFIG, EMITTED_EVENTS, ACTION_PAYLOAD, getMetrics, info, healthCheck };
