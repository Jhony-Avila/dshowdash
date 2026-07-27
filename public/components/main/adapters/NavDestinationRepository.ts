// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: nav-destination-repository
// PURPOSE: NavDestinationRepository - Repositório de Destinos de Navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   get() — exported function
//   getAll() — exported function
//   has() — exported function
//   remove() — exported function
//   clear() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'nav-destination-repository';

let _destinations = new Map();
let _metrics = { registered: 0, lookups: 0, errors: 0 };

export function register(id: string, destination: Record<string, unknown>) {
  try {
    _destinations.set(id, { ...destination, registeredAt: Date.now() });
    _metrics.registered++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}

export function get(id: string) {
  _metrics.lookups++;
  return _destinations.get(id) || null;
}

export function getAll() {
  return Object.fromEntries(_destinations);
}

export function has(id: string) {
  return _destinations.has(id);
}

export function remove(id: string) {
  return _destinations.delete(id);
}

export function clear() {
  _destinations.clear();
}

export function getMetrics() { return { ..._metrics, count: _destinations.size }; }

export function healthCheck() {
  return {
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { destinationCount: _destinations.size, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    destinationCount: _destinations.size,
    registeredDestinations: Array.from(_destinations.keys()),
    metrics: getMetrics()
  };
}

export default { register, get, getAll, has, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
