// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-BULLETPROOF-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-config-loader
// PURPOSE: Sidebar Core - Config Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   loadConfig() — exported function
//   getConfig() — exported function
//   mergeConfig() — exported function
//   updateConfig() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.5.0-ENTERPRISE-FULL';
export const MODULE_ID = 'sidebar-config-loader';

let _config: DynObj | null = null;
let _metrics = { loads: 0, merges: 0, errors: 0 };

const DEFAULT_CONFIG = {
  collapsed: false, mobileBreakpoint: 1024, animationDuration: 200, persistState: true,
  containerSelector: '#sidebar-container', settings: { defaultCollapsed: false },
  accordion: { allowMultipleOpen: true, persistState: true }, header: { title: 'DshowDash' }
};

export function loadConfig(options = {}) {
  try { _config = { ...DEFAULT_CONFIG, ...options }; _metrics.loads++; return _config; }
  catch (error) { _metrics.errors++; _config = { ...DEFAULT_CONFIG }; return _config; }
}

export function getConfig() { if (!_config) loadConfig(); return { ..._config }; }
export function mergeConfig(options = {}) { _metrics.merges++; if (!_config) loadConfig(); return { ..._config, ...options }; }
export function updateConfig(updates = {}) { _config = { ..._config, ...updates }; return _config; }
export function getMetrics() { return { ..._metrics }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, hasConfig: !!_config, metrics: getMetrics() }; }

export function healthCheck() {
  let status = 'HEALTHY';
  if (!_config) status = 'NOT_INITIALIZED';
  if (_metrics.errors > 0) status = 'DEGRADED';
  return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasConfig: !!_config, noErrors: _metrics.errors === 0 }, metrics: getMetrics() };
}

export default { loadConfig, getConfig, mergeConfig, updateConfig, getMetrics, info, healthCheck, VERSION, MODULE_ID };
