

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-PATH-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.preload-manager
// PURPOSE: MainFeature: Preload Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   cleanup — exported value
//   preload() — exported function
//   preloadMultiple() — exported function
//   onHover() — exported function
//   onHoverEnd() — exported function
//   isPreloaded() — exported function
//   getPredictions() — exported function
//   getTransitionStats() — exported function
//   clearCache() — exported function
//   updateConfig() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   MAIN_EVENTS.NAVIGATION_COMPLETE
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
// @version 1.1.0-PATH-FIX
// @changelog v1.1.0-PATH-FIX - Fixed panel prefetch path: /components/main/panels/ → /components/panels/ (panels live at /components/panels/)
// @changelog v1.0.0-ENTERPRISE - Initial enterprise version
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';

export const MODULE_ID = 'main.feature.preload-manager';
export const VERSION = '1.1.0-PATH-FIX';

const PRELOAD_STRATEGIES = Object.freeze({
  EAGER: 'eager',
  LAZY: 'lazy',
  ON_HOVER: 'on-hover',
  ON_VISIBLE: 'on-visible',
  PREDICTIVE: 'predictive'
});

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _enabled = false;
let _cleanups: Array<() => void> = [];
const _preloadQueue = [];
const _preloadedResources = new Map();
const _navigationHistory: Array<Record<string, unknown>> = [];
const _hoverTimers = new Map();

let _config = {
  strategy: PRELOAD_STRATEGIES.PREDICTIVE,
  maxPreloads: 5,
  hoverDelay: 150,
  predictiveThreshold: 0.3,
  cacheTimeout: 300000
};

const _metrics = {
  inits: 0,
  preloadsTriggered: 0,
  preloadsCompleted: 0,
  preloadsFailed: 0,
  cacheHits: 0,
  cacheMisses: 0,
  predictionsCorrect: 0,
  predictionsMade: 0
};

// ═══════════════════════════════════════════════════════════════
// PREDICTION ENGINE
// ═══════════════════════════════════════════════════════════════

const _transitionCounts: Record<string, number> = {};

function _recordNavigation(from: unknown, to: unknown) {
  if (!from || !to) return;
  
  const key = `${from}->${to}`;
  _transitionCounts[key] = (_transitionCounts[key] || 0) + 1;
  
  _navigationHistory.push({ from, to, timestamp: Date.now() });
  if (_navigationHistory.length > 100) {
    _navigationHistory.shift();
  }
}

function _getPredictedTargets(currentPanel: unknown) {
  if (!currentPanel) return [];
  
  const predictions = [];
  let totalFromCurrent = 0;
  
  for (const key in _transitionCounts) {
    if (key.indexOf(`${currentPanel}->`) === 0) {
      totalFromCurrent += _transitionCounts[key];
    }
  }
  
  if (totalFromCurrent === 0) return [];
  
  for (const k in _transitionCounts) {
    if (k.indexOf(`${currentPanel}->`) === 0) {
      const target = k.split('->')[1];
      const probability = _transitionCounts[k] / totalFromCurrent;
      
      if (probability >= _config.predictiveThreshold) {
        predictions.push({ target, probability });
      }
    }
  }
  
  predictions.sort((a, b) => b.probability - a.probability);
  
  return predictions.slice(0, _config.maxPreloads);
}

// ═══════════════════════════════════════════════════════════════
// PRELOAD LOGIC
// ═══════════════════════════════════════════════════════════════

function _preloadPanel(panelId: string) {
  if (_preloadedResources.has(panelId)) {
    const cached = _preloadedResources.get(panelId);
    if (Date.now() - cached.timestamp < _config.cacheTimeout) {
      _metrics.cacheHits++;
      return { ok: true, cached: true };
    }
  }
  
  _metrics.cacheMisses++;
  _metrics.preloadsTriggered++;
  
  try {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    // v1.1.0-PATH-FIX: Panels live at /components/panels/, not /components/main/panels/
    link.href = `/components/panels/${panelId}/index.js`;
    link.as = 'script';
    
    link.onload = () => {
      _metrics.preloadsCompleted++;
      _preloadedResources.set(panelId, { timestamp: Date.now(), status: 'loaded' });
    };
    
    link.onerror = () => {
      _metrics.preloadsFailed++;
      _preloadedResources.set(panelId, { timestamp: Date.now(), status: 'error' });
    };
    
    document.head.appendChild(link);
    
    _preloadedResources.set(panelId, { timestamp: Date.now(), status: 'loading', link });
    
    return { ok: true, preloading: true };
  } catch (e: any) {
    _metrics.preloadsFailed++;
    return { ok: false, error: e.message };
  }
}

function _preloadPredicted(currentPanel: unknown) {
  const predictions = _getPredictedTargets(currentPanel);
  _metrics.predictionsMade += predictions.length;
  
  for (let i = 0; i < predictions.length; i++) {
    _preloadPanel(predictions[i].target);
  }
  
  return { ok: true, preloaded: predictions.length };
}

// ═══════════════════════════════════════════════════════════════
// LIFECYCLE
// ═══════════════════════════════════════════════════════════════

export function init(options: Record<string, unknown>) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  
  try {
    _initPorts();
    _metrics.inits++;
    
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    
    const eb = _getPort('eventBus');
    let lastPanel: unknown = null;
    
    if (eb && eb.on) {
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        const navHandler = (data: Record<string, unknown>) => {
          const currentPanel = data && (data.panelId || data.path);
          
          if (lastPanel && currentPanel) {
            _recordNavigation(lastPanel, currentPanel);
          }
          
          if (_config.strategy === PRELOAD_STRATEGIES.PREDICTIVE) {
            _preloadPredicted(currentPanel);
          }
          
          lastPanel = currentPanel;
        };
        eb.on(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler);
        _cleanups.push(() => { if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler); });
      }
    }
    
    _enabled = true;
    return { ok: true, version: VERSION };
    
  } catch (e: any) {
    return { ok: false, error: e.message };
  }
}

export function destroy() {
  _hoverTimers.forEach(timerId => {
    clearTimeout(timerId);
  });
  _hoverTimers.clear();
  
  for (let i = 0; i < _cleanups.length; i++) {
    try { _cleanups[i](); } catch (e: any) { }
  }
  _cleanups = [];
  
  _enabled = false;
  return { ok: true };
}

export const cleanup = destroy;

// ═══════════════════════════════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════════════════════════════

export function preload(panelId: string) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };
  return _preloadPanel(panelId);
}

export function preloadMultiple(panelIds: string[]) {
  if (!_enabled) return { ok: false, error: 'Not initialized' };

  const results = [];
  for (let i = 0; i < panelIds.length && i < _config.maxPreloads; i++) {
    results.push(_preloadPanel(panelIds[i]));
  }
  return { ok: true, results };
}

export function onHover(panelId: string) {
  if (!_enabled || (_config.strategy as string) !== PRELOAD_STRATEGIES.ON_HOVER) return;
  
  if (_hoverTimers.has(panelId)) return;
  
  const timerId = setTimeout(() => {
    _preloadPanel(panelId);
    _hoverTimers.delete(panelId);
  }, _config.hoverDelay);
  
  _hoverTimers.set(panelId, timerId);
}

export function onHoverEnd(panelId: string) {
  if (_hoverTimers.has(panelId)) {
    clearTimeout(_hoverTimers.get(panelId));
    _hoverTimers.delete(panelId);
  }
}

export function isPreloaded(panelId: string) {
  const cached = _preloadedResources.get(panelId);
  if (!cached) return false;
  if (Date.now() - cached.timestamp > _config.cacheTimeout) return false;
  return cached.status === 'loaded';
}

export function getPredictions(currentPanel: unknown) {
  return _getPredictedTargets(currentPanel);
}

export function getTransitionStats() {
  return Object.assign({}, _transitionCounts);
}

export function clearCache() {
  _preloadedResources.clear();
  return { ok: true };
}

export function updateConfig(newConfig: Record<string, unknown>) {
  _config = Object.assign({}, _config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}

// ═══════════════════════════════════════════════════════════════
// OBSERVABILITY
// ═══════════════════════════════════════════════════════════════

export function getMetrics() {
  const hitRate = _metrics.cacheHits + _metrics.cacheMisses > 0
    ? Math.round((_metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses)) * 100)
    : 0;
    
  return Object.assign({}, _metrics, {
    cacheSize: _preloadedResources.size,
    cacheHitRate: `${hitRate}%`,
    predictionAccuracy: _metrics.predictionsMade > 0
      ? `${Math.round((_metrics.predictionsCorrect / _metrics.predictionsMade) * 100)}%`
      : 'N/A'
  });
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    strategies: PRELOAD_STRATEGIES,
    config: Object.assign({}, _config),
    metrics: getMetrics()
  };
}

export function healthCheck() {
  const checks = {
    enabled: _enabled,
    cacheNotFull: _preloadedResources.size < _config.maxPreloads * 10,
    lowFailureRate: _metrics.preloadsFailed < _metrics.preloadsTriggered * 0.2
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_enabled) status = 'NOT_INITIALIZED';
  else if (!checks.lowFailureRate) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  PRELOAD_STRATEGIES,
  init,
  destroy,
  cleanup,
  preload,
  preloadMultiple,
  onHover,
  onHoverEnd,
  isPreloaded,
  getPredictions,
  getTransitionStats,
  clearCache,
  updateConfig,
  getMetrics,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
