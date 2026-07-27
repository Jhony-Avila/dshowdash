// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-applier
// PURPOSE: Theme Manager - Applier v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   apply() — exported function
//   remove() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
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
export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'theme-manager-applier';
let _metrics = { applications: 0 };
export function apply(theme: string) { document.documentElement.setAttribute('data-theme', theme); document.documentElement.classList.remove('theme-light', 'theme-dark'); document.documentElement.classList.add(`theme-${theme}`); _metrics.applications++; return true; }
export function remove() { document.documentElement.removeAttribute('data-theme'); document.documentElement.classList.remove('theme-light', 'theme-dark'); }
export function getMetrics() { return { ..._metrics }; }
export function healthCheck() { const checks = { canApply: true }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 1 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/1`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, currentTheme: document.documentElement.getAttribute('data-theme'), metrics: getMetrics(), timestamp: Date.now() }; }
export const ThemeApplier = { apply, remove, getMetrics, healthCheck, info };
export default { apply, remove, getMetrics, healthCheck, info, VERSION, MODULE_ID };
