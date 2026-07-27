// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.keyboard
// PURPOSE: Overlay Layer Keyboard - Keyboard event handling for overlays
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INIT - init() initializes keyboard handlers
// @contract DESTROY - destroy() removes keyboard handlers
// @contract IS_ENABLED - isEnabled() checks if enabled
// @contract GET_METRICS - getMetrics() returns keyboard metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   init() — exported function
//   destroy() — exported function
//   isEnabled() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): onEscape callback, onTab callback
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: document.addEventListener, document.removeEventListener
// ───────────────────────────────────────────────────────────────
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.1-ENTERPRISE: ES5 conversion
// @changelog v2.0.0: Adicionado healthCheck + info (Enterprise AAA)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-keyboard';

let _handler: DynObj = null;
let _enabled = false;
const _metrics = { escapeCount: 0, tabCount: 0 };

export function init(onEscape: DynObj, onTab: DynObj) {
  if (_handler) destroy();
  _handler = (e: KeyboardEvent) => {
    if (e.key === 'Escape') { _metrics.escapeCount++; if (onEscape) onEscape(e); }
    if (e.key === 'Tab') { _metrics.tabCount++; if (onTab) onTab(e); }
  };
  document.addEventListener('keydown', _handler);
  _enabled = true;
  return true;
}

export function destroy() { if (_handler) document.removeEventListener('keydown', _handler); _handler = null; _enabled = false; }
export function isEnabled() { return _enabled; }
export function getMetrics() { return Object.assign({}, _metrics); }

export function healthCheck() {
  const checks = { enabled: _enabled, hasHandler: !!_handler };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  return { status: passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, metrics: getMetrics(), timestamp: Date.now() }; }

export default { init, destroy, isEnabled, getMetrics, healthCheck, info, VERSION, MODULE_ID };
