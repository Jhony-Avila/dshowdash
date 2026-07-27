// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: nav-route-repository
// PURPOSE: NavRouteRepository - Repositório de Rotas de Navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   register() — exported function
//   get() — exported function
//   match() — exported function
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
export const MODULE_ID = 'nav-route-repository';

let _routes = new Map();
let _metrics = { registered: 0, lookups: 0, errors: 0 };

export function register(path: string, config: Record<string, unknown>) {
  try {
    _routes.set(path, { ...config, registeredAt: Date.now() });
    _metrics.registered++;
    return true;
  } catch (error) {
    _metrics.errors++;
    return false;
  }
}

export function get(path: string) {
  _metrics.lookups++;
  return _routes.get(path) || null;
}

export function match(path: string) {
  _metrics.lookups++;
  if (_routes.has(path)) return _routes.get(path);
  for (const [routePath, config] of _routes) {
    if (path.startsWith(routePath.replace('*', ''))) return config;
  }
  return null;
}

export function getAll() { return Object.fromEntries(_routes); }
export function has(path: string) { return _routes.has(path); }
export function remove(path: string) { return _routes.delete(path); }
export function clear() { _routes.clear(); }
export function getMetrics() { return { ..._metrics, count: _routes.size }; }

export function healthCheck() {
  return {
    status: _metrics.errors === 0 ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { routeCount: _routes.size, noErrors: _metrics.errors === 0 },
    metrics: getMetrics()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    routeCount: _routes.size,
    registeredRoutes: Array.from(_routes.keys()),
    metrics: getMetrics()
  };
}

export default { register, get, match, getAll, has, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
