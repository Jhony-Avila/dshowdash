// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.metrics
// PURPOSE: Footer Metrics - Metrics collection and reporting
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INCREMENT - increment() increments metric counter
// @contract SET - set() sets metric value
// @contract GET_SNAPSHOT - getSnapshot() returns metrics snapshot
// @contract GET_METRICS - getMetrics() returns metrics
// @contract RESET_ALL - resetAll() resets all metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   increment() — exported function
//   set() — exported function
//   setLastActivity() — exported function
//   getSnapshot() — exported function
//   resetAll() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v9.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v9.3.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '9.4.0-P2-ENTERPRISE';
const MODULE_ID = 'footer-metrics';

const _metrics = { mountCount: 0, unmountCount: 0, routeChanges: 0, configLoads: 0, errors: 0, lastActivity: (null as unknown|null) };

// @ts-expect-error TS migration - TS2356
export function increment(key: string) { if (key in _metrics && typeof (_metrics as Record<string,unknown>)[key as string] === 'number') (_metrics as Record<string,unknown>)[key as string]++; }
export function set(key: string, value: unknown) { if (key in _metrics) (_metrics as Record<string,unknown>)[key as string] = value; }
export function setLastActivity() { _metrics.lastActivity = Date.now(); }
export function getSnapshot() { return { ..._metrics }; }
export function resetAll() { _metrics.mountCount = 0; _metrics.unmountCount = 0; _metrics.routeChanges = 0; _metrics.configLoads = 0; _metrics.errors = 0; _metrics.lastActivity = null; }
export function getMetrics() { return getSnapshot(); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { metricsReady: true }, metrics: getMetrics() }; }

export { MODULE_ID, VERSION };
export default { increment, set, setLastActivity, getSnapshot, resetAll, getMetrics, info, healthCheck, VERSION, MODULE_ID };
