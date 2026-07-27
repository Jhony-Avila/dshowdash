

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-kernel-hot-reload
// PURPOSE: MainKernel Hot Reload Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
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
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
//   window.hotReload (exposes module)
// ═══════════════════════════════════════════════════════════════
// @version 1.3.0-STRICT-MODE
// @changelog v1.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.2.0-P0-ENTERPRISE - Logger via Ports (elimina window.Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'main-kernel-hot-reload';
export const VERSION = '1.4.0-P2-ENTERPRISE';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface KernelHotReloadApi {
  getFeature?(featureId: string): { ok: boolean; data?: { status: string; [key: string]: unknown }; [key: string]: unknown } | null;
  disableFeature(featureId: string, reason: string): { ok: boolean; [key: string]: unknown };
  enableFeature(featureId: string, context?: Record<string, unknown>): { ok: boolean; errors?: Array<{ message: string; [key: string]: unknown }>; [key: string]: unknown };
  registerFeature(def: Record<string, unknown>): { ok: boolean; errors?: Array<{ message: string; [key: string]: unknown }>; [key: string]: unknown };
  listFeatures(): { ok: boolean; data?: { features: Array<{ id: string; [key: string]: unknown }>; [key: string]: unknown }; [key: string]: unknown };
}

interface ReloadOptions {
  path?: string;
  enable?: boolean;
  context?: Record<string, unknown>;
  [key: string]: unknown;
}

interface ReloadHistoryEntry {
  featureId: string;
  timestamp: number;
  status: string;
  duration: number;
  error: string | null;
}

// P0 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback to console)
  // 4. Non-strict: use window.Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

// Helper for logging
function _log(level: LogLevel, ...args: unknown[]) {
  const logger = _getLogger();
  if (logger && logger[level]) logger[level](...args);
}

let _kernel: KernelHotReloadApi | null = null;
let _enabled = false;
const _reloadHistory: ReloadHistoryEntry[] = [];
const MAX_HISTORY = 50;

const _metrics = {
  reloadsAttempted: 0,
  reloadsSucceeded: 0,
  reloadsFailed: 0,
  averageReloadTimeMs: 0
};

// ═══════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════

export function init(kernel: KernelHotReloadApi) {
  if (!kernel) return { ok: false, error: 'Kernel required' };
  
  _kernel = kernel;
  _enabled = true;
  
  // Expor globalmente para dev tools
  if (typeof window !== 'undefined') {
    (window as any).hotReload = {
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
  
  if (typeof window !== 'undefined') {
    delete (window as any).hotReload;
  }
  
  return { ok: true };
}

// ═══════════════════════════════════════════════════════════════
// HOT RELOAD LOGIC
// ═══════════════════════════════════════════════════════════════

export async function reloadFeature(featureId: string, options?: ReloadOptions) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: 'Hot reload not initialized' };
  }
  
  const opts = options || {};
  const startTime = performance.now();
  _metrics.reloadsAttempted++;
  
  const historyEntry: ReloadHistoryEntry = {
    featureId,
    timestamp: Date.now(),
    status: 'pending',
    duration: 0,
    error: null
  };
  
  try {
    // 1. Obter estado atual da feature
    const featureStatus = _kernel.getFeature ? _kernel.getFeature(featureId) : null;
    const wasEnabled = featureStatus && featureStatus.data && featureStatus.data.status === 'enabled';
    
    _log('info', '[HotReload] Reloading feature:', featureId, wasEnabled ? '(was enabled)' : '(was disabled)');
    
    // 2. Desabilitar feature se estava enabled
    if (wasEnabled) {
      const disableResult = _kernel.disableFeature(featureId, 'hot-reload');
      if (!disableResult.ok) {
        _log('warn', '[HotReload] Warning: Could not disable feature cleanly');
      }
    }
    
    // 3. Obter path do manifest
    let featurePath = opts.path;
    if (!featurePath) {
      // Tentar inferir path padrão
      featurePath = `../features/${featureId}/index.js`;
    }
    
    // 4. Invalidar cache do módulo (adicionar timestamp)
    const cacheBuster = `?t=${Date.now()}`;
    const fullPath = featurePath + cacheBuster;
    
    // 5. Re-importar módulo
    const featureModule = await import(fullPath);
    
    // 6. Re-registrar feature
    const registerResult = _kernel.registerFeature({
      id: featureId,
      version: (featureModule.VERSION || (featureModule.default && featureModule.default.VERSION)) || '1.0.0-HOT',
      init: featureModule.init || (featureModule.default && featureModule.default.init),
      cleanup: featureModule.destroy || featureModule.cleanup || (featureModule.default && featureModule.default.destroy),
      healthCheck: featureModule.healthCheck || (featureModule.default && featureModule.default.healthCheck),
      info: featureModule.info || (featureModule.default && featureModule.default.info),
      getMetrics: featureModule.getMetrics || (featureModule.default && featureModule.default.getMetrics)
    });
    
    if (!registerResult.ok) {
      throw new Error(`Failed to re-register: ${JSON.stringify(registerResult.errors)}`);
    }
    
    // 7. Re-habilitar se estava enabled
    if (wasEnabled || opts.enable) {
      const enableResult = _kernel.enableFeature(featureId, opts.context || {});
      if (!enableResult.ok) {
        throw new Error(`Failed to re-enable: ${JSON.stringify(enableResult.errors)}`);
      }
    }
    
    // 8. Métricas
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsSucceeded++;
    _updateAverageTime(duration);
    
    historyEntry.status = 'success';
    historyEntry.duration = duration;
    _addToHistory(historyEntry);
    
    _log('info', '[HotReload] ✅ Feature reloaded:', featureId, `(${duration}ms)`);
    
    return { ok: true, featureId, duration, wasEnabled };
    
  } catch (e: any) {
    const duration = Math.round(performance.now() - startTime);
    _metrics.reloadsFailed++;
    
    historyEntry.status = 'failed';
    historyEntry.duration = duration;
    historyEntry.error = e.message;
    _addToHistory(historyEntry);
    
    _log('error', '[HotReload] Failed to reload:', featureId, e.message);
    
    return { ok: false, featureId, error: e.message, duration };
  }
}

export async function reloadAllFeatures(options?: ReloadOptions) {
  if (!_enabled || !_kernel) {
    return { ok: false, error: 'Hot reload not initialized' };
  }
  
  const listResult = _kernel.listFeatures();
  if (!listResult.ok || !listResult.data || !listResult.data.features) {
    return { ok: false, error: 'Could not list features' };
  }
  
  const features = listResult.data.features;
  const results = [];
  
  for (let i = 0; i < features.length; i++) {
    const result = await reloadFeature(features[i].id, options);
    results.push(result);
  }
  
  const succeeded = results.filter(r => r.ok).length;
  const failed = results.filter(r => !r.ok).length;
  
  return {
    ok: failed === 0,
    total: features.length,
    succeeded,
    failed,
    results
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function _addToHistory(entry: ReloadHistoryEntry) {
  _reloadHistory.unshift(entry);
  if (_reloadHistory.length > MAX_HISTORY) {
    _reloadHistory.pop();
  }
}

function _updateAverageTime(newTime: number) {
  const total = _metrics.reloadsSucceeded;
  if (total === 1) {
    _metrics.averageReloadTimeMs = newTime;
  } else {
    _metrics.averageReloadTimeMs = Math.round(
      ((_metrics.averageReloadTimeMs * (total - 1)) + newTime) / total
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getStatus() {
  return {
    enabled: _enabled,
    kernelConnected: !!_kernel,
    metrics: Object.assign({}, _metrics)
  };
}

export function getHistory(limit?: number) {
  return limit ? _reloadHistory.slice(0, limit) : _reloadHistory.slice();
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    historySize: _reloadHistory.length,
    successRate: _metrics.reloadsAttempted > 0
      ? `${Math.round((_metrics.reloadsSucceeded / _metrics.reloadsAttempted) * 100)}%`
      : 'N/A'
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    kernelConnected: !!_kernel,
    lowFailureRate: _metrics.reloadsFailed < _metrics.reloadsAttempted * 0.3
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: _enabled ? 'HEALTHY' : 'NOT_INITIALIZED',
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    strictMode: isStrict(),
    portsInitialized: _portsInitialized,
    checks,
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
