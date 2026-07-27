// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-kernel-config-loader
// PURPOSE: SidebarKernel Config Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   getConfig() — exported function
//   getKernelConfig() — exported function
//   getFeatureConfig() — exported function
//   isFeatureEnabled() — exported function
//   updateConfig() — exported function
//   resetConfig() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar-kernel-config-loader';
export const VERSION = '1.1.0-ES6';

const DEFAULT_CONFIG = {
  logLevel: 'info',
  kernel: {
    enableConsoleCommands: true,
    enableHealthMonitor: true,
    enableCircuitBreaker: true
  },
  features: {}
};

let _config: DynObj | null = null;
let _loaded = false;

function _deepMerge(target: EventTarget, source: DynObj) {
  const result = Object.assign({}, target);
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        (result as DynObj)[key] = _deepMerge((result as DynObj)[key] || {}, (source as DynObj)[key]);
      } else {
        (result as DynObj)[key] = (source as DynObj)[key];
      }
    }
  }
  return result;
}

export async function loadConfig(path: string) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      _config = Object.assign({}, DEFAULT_CONFIG);
      return { ok: true, config: _config, source: 'default' };
    }
    const json = await response.json();
    _config = _deepMerge((DEFAULT_CONFIG as DynObj), json);
    _loaded = true;
    return { ok: true, config: _config, source: 'file' };
  } catch (e: any) {
    _config = Object.assign({}, DEFAULT_CONFIG);
    return { ok: true, config: _config, source: 'default', error: e.message };
  }
}

export function getConfig() {
  return _config ? Object.assign({}, _config) : Object.assign({}, DEFAULT_CONFIG);
}

export function getKernelConfig() {
  const c = getConfig();
  return c.kernel || {};
}

export function getFeatureConfig(featureId: string) {
  const c = getConfig();
  return (c.features && c.features[featureId]) || {};
}

export function isFeatureEnabled(featureId: string) {
  const fc = getFeatureConfig(featureId);
  return fc.enabled !== false;
}

export function updateConfig(newConfig: DynObj) {
  _config = _deepMerge(_config || DEFAULT_CONFIG, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}

export function resetConfig() {
  _config = Object.assign({}, DEFAULT_CONFIG);
  _loaded = false;
  return { ok: true };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, loaded: _loaded, config: getConfig() };
}

export default {
  MODULE_ID,
  VERSION,
  loadConfig,
  getConfig,
  getKernelConfig,
  getFeatureConfig,
  isFeatureEnabled,
  updateConfig,
  resetConfig,
  info
};
