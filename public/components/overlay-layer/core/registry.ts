// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.registry
// PURPOSE: Overlay Layer Registry - Type registry for overlay configurations
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract REGISTER - register() registers overlay type
// @contract UNREGISTER - unregister() removes overlay type
// @contract GET - get() returns overlay config by type
// @contract HAS - has() checks if type exists
// @contract LIST - list() returns registered types
// @contract CLEAR - clear() clears all registrations
// @contract SIZE - size() returns registry size
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   unregister() — exported function
//   get() — exported function
//   has() — exported function
//   list() — exported function
//   clear() — exported function
//   size() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.1-ENTERPRISE: ES5 conversion
// @changelog v2.0.0: Adicionado healthCheck + info (Enterprise AAA)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-registry';

let _registry = {};

export function register(type: DynObj, config: DynObj) { if (!type) return false; (_registry as DynObj)[type] = config; return true; }
export function unregister(type: DynObj) { if (!(_registry as DynObj)[type]) return false; delete (_registry as DynObj)[type]; return true; }
export function get(type: DynObj) { return (_registry as DynObj)[type] || null; }
export function has(type: DynObj) { return !!(_registry as DynObj)[type]; }
export function list() { return Object.keys(_registry); }
export function clear() { _registry = {}; }
export function size() { return Object.keys(_registry).length; }

export function healthCheck() {
  const checks = { registryExists: true, hasEntries: size() > 0 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, registeredTypes: list(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, size: size(), registeredTypes: list(), timestamp: Date.now() }; }

export default { register, unregister, get, has, list, clear, size, healthCheck, info, VERSION, MODULE_ID };
