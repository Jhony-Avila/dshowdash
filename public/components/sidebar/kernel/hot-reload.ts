// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-kernel-hot-reload
// PURPOSE: SidebarKernel Hot Reload Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   destroy() — exported function
//   getStatus() — exported function
//   getHistory() — exported function
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
//   (window as any).sidebarHotReload
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar-kernel-hot-reload';
export const VERSION = '1.1.0-ES6';

let _kernel: DynObj | null = null;
let _enabled = false;
let _reloadHistory: DynObj[] = [];
const MAX_HISTORY = 50;

let _metrics = {
  reloadsAttempted: 0,
  reloadsSucceeded: 0,
  reloadsFailed: 0,
  averageReloadTimeMs: 0
};

export function init(kernel: DynObj) {
  if (!kernel) return { ok: false, error: 'Kernel required' };
  _kernel = kernel;
  _enabled = true;
  
  if (typeof window !== 'undefined') {
    (window as any).sidebarHotReload = {
      reload: reloadFeature,
      reloadAll: reloadAllFeatures,
      status: getStatus,
      history: getHistory
    };
  }
  
  return { ok: true, version: VERSION };
}

export function destroy() {
  _kernel = null;
  _enabled = false;
  if (typeof window !== 'undefined') delete (window as any).sidebarHotReload;
  return { ok: true };
}

export async function reloadFeature(featureId: string, options: DynObj) {
  if (!_enabled || !_kernel) return { ok: false, error: 'Hot reload not initialized' };
  
  const opts = options || {};
  const startTime = performance.now();
  _metrics.reloadsAttempted++;
  
  const historyEntry = { featureId, timestamp: Date.now(), status: 'pending', duration: 0, error: null as string | null };
  
  try {
    const featureStatus = _kernel.getFeatureStatus ? _kernel.getFeatureStatus(featureId) : null;
    const wasEnabled = featureStatus && featureStatus.ok && featureStatus.data && featureStatus.data.status === 'enabled';
    
    if (wasEnabled) {
      _kernel.disableFeature(featureId, 'hot-reload');
    }
    
    const featurePath = opts.path || (`./features/${featureId}.js`);
    const cacheBuster = `?t=${Date.now()}`;
    const featureModule = await import(featurePath + cacheBuster);
    
    _kernel.registerFeature({
      id: featureId,
      version: (featureModule.VERSION || (featureModule.default && featureModule.default.VERSION)) || '1.0.0-HOT',
      init: featureModule.init || (featureModule.default && featureModule.default.init),
      cleanup: featureModule.destroy || featureModule.cleanup || (featureModule.default && featureModule.default.destroy),
      healthCheck: featureModule.healthCheck || (featureModule.default && featureModule.default.healthCheck)
    });
    
    if (wasEnabled || opts.enable) {
      _kernel.enableFeature(featureId, opts.context || {});
    }
    
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsSucceeded++;
    
    historyEntry.status = 'success';
    historyEntry.duration = duration;
    _addToHistory(historyEntry);
    
    return { ok: true, featureId, duration };
    
  } catch (e: any) {
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsFailed++;
    
    historyEntry.status = 'failed';
    historyEntry.duration = duration;
    historyEntry.error = e.message;
    _addToHistory(historyEntry);
    
    return { ok: false, featureId, error: e.message, duration };
  }
}

export async function reloadAllFeatures(options: DynObj) {
  if (!_enabled || !_kernel) return { ok: false, error: 'Hot reload not initialized' };
  
  const listResult = _kernel.listFeatures();
  if (!listResult.ok) return { ok: false, error: 'Could not list features' };
  
  const features = listResult.data.features;
  const results = [];
  
  for (let i = 0; i < features.length; i++) {
    const result = await reloadFeature(features[i].id, options);
    results.push(result);
  }
  
  const succeeded = results.filter(r => r.ok).length;
  
  return { ok: succeeded === results.length, total: features.length, succeeded, failed: results.length - succeeded, results };
}

function _addToHistory(entry: DynObj) {
  _reloadHistory.unshift(entry);
  if (_reloadHistory.length > MAX_HISTORY) _reloadHistory.pop();
}

export function getStatus() {
  return { enabled: _enabled, kernelConnected: !!_kernel, metrics: Object.assign({}, _metrics) };
}

export function getHistory(limit: number) {
  return limit ? _reloadHistory.slice(0, limit) : _reloadHistory.slice();
}

export function getMetrics() {
  return Object.assign({}, _metrics, { historySize: _reloadHistory.length });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, metrics: getMetrics() };
}

export function healthCheck() {
  return {
    status: _enabled ? 'HEALTHY' : 'NOT_INITIALIZED',
    moduleId: MODULE_ID,
    version: VERSION,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  init,
  destroy,
  reloadFeature,
  reloadAllFeatures,
  getStatus,
  getHistory,
  getMetrics,
  info,
  healthCheck
};
