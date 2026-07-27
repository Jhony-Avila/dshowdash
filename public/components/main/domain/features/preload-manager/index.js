import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const MODULE_ID = "main.feature.preload-manager";
const VERSION = "1.1.0-PATH-FIX";
const PRELOAD_STRATEGIES = Object.freeze({
  EAGER: "eager",
  LAZY: "lazy",
  ON_HOVER: "on-hover",
  ON_VISIBLE: "on-visible",
  PREDICTIVE: "predictive"
});
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _enabled = false;
let _cleanups = [];
const _preloadQueue = [];
const _preloadedResources = /* @__PURE__ */ new Map();
const _navigationHistory = [];
const _hoverTimers = /* @__PURE__ */ new Map();
let _config = {
  strategy: PRELOAD_STRATEGIES.PREDICTIVE,
  maxPreloads: 5,
  hoverDelay: 150,
  predictiveThreshold: 0.3,
  cacheTimeout: 3e5
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
const _transitionCounts = {};
function _recordNavigation(from, to) {
  if (!from || !to) return;
  const key = `${from}->${to}`;
  _transitionCounts[key] = (_transitionCounts[key] || 0) + 1;
  _navigationHistory.push({ from, to, timestamp: Date.now() });
  if (_navigationHistory.length > 100) {
    _navigationHistory.shift();
  }
}
function _getPredictedTargets(currentPanel) {
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
      const target = k.split("->")[1];
      const probability = _transitionCounts[k] / totalFromCurrent;
      if (probability >= _config.predictiveThreshold) {
        predictions.push({ target, probability });
      }
    }
  }
  predictions.sort((a, b) => b.probability - a.probability);
  return predictions.slice(0, _config.maxPreloads);
}
function _preloadPanel(panelId) {
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
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = `/components/panels/${panelId}/index.js`;
    link.as = "script";
    link.onload = () => {
      _metrics.preloadsCompleted++;
      _preloadedResources.set(panelId, { timestamp: Date.now(), status: "loaded" });
    };
    link.onerror = () => {
      _metrics.preloadsFailed++;
      _preloadedResources.set(panelId, { timestamp: Date.now(), status: "error" });
    };
    document.head.appendChild(link);
    _preloadedResources.set(panelId, { timestamp: Date.now(), status: "loading", link });
    return { ok: true, preloading: true };
  } catch (e) {
    _metrics.preloadsFailed++;
    return { ok: false, error: e.message };
  }
}
function _preloadPredicted(currentPanel) {
  const predictions = _getPredictedTargets(currentPanel);
  _metrics.predictionsMade += predictions.length;
  for (let i = 0; i < predictions.length; i++) {
    _preloadPanel(predictions[i].target);
  }
  return { ok: true, preloaded: predictions.length };
}
function init(options) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  try {
    _initPorts();
    _metrics.inits++;
    if (options && options.config) {
      _config = Object.assign({}, _config, options.config);
    }
    const eb = _getPort("eventBus");
    let lastPanel = null;
    if (eb && eb.on) {
      if (MAIN_EVENTS && MAIN_EVENTS.NAVIGATION_COMPLETE) {
        const navHandler = (data) => {
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
        _cleanups.push(() => {
          if (eb.off) eb.off(MAIN_EVENTS.NAVIGATION_COMPLETE, navHandler);
        });
      }
    }
    _enabled = true;
    return { ok: true, version: VERSION };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
function destroy() {
  _hoverTimers.forEach((timerId) => {
    clearTimeout(timerId);
  });
  _hoverTimers.clear();
  for (let i = 0; i < _cleanups.length; i++) {
    try {
      _cleanups[i]();
    } catch (e) {
    }
  }
  _cleanups = [];
  _enabled = false;
  return { ok: true };
}
const cleanup = destroy;
function preload(panelId) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  return _preloadPanel(panelId);
}
function preloadMultiple(panelIds) {
  if (!_enabled) return { ok: false, error: "Not initialized" };
  const results = [];
  for (let i = 0; i < panelIds.length && i < _config.maxPreloads; i++) {
    results.push(_preloadPanel(panelIds[i]));
  }
  return { ok: true, results };
}
function onHover(panelId) {
  if (!_enabled || _config.strategy !== PRELOAD_STRATEGIES.ON_HOVER) return;
  if (_hoverTimers.has(panelId)) return;
  const timerId = setTimeout(() => {
    _preloadPanel(panelId);
    _hoverTimers.delete(panelId);
  }, _config.hoverDelay);
  _hoverTimers.set(panelId, timerId);
}
function onHoverEnd(panelId) {
  if (_hoverTimers.has(panelId)) {
    clearTimeout(_hoverTimers.get(panelId));
    _hoverTimers.delete(panelId);
  }
}
function isPreloaded(panelId) {
  const cached = _preloadedResources.get(panelId);
  if (!cached) return false;
  if (Date.now() - cached.timestamp > _config.cacheTimeout) return false;
  return cached.status === "loaded";
}
function getPredictions(currentPanel) {
  return _getPredictedTargets(currentPanel);
}
function getTransitionStats() {
  return Object.assign({}, _transitionCounts);
}
function clearCache() {
  _preloadedResources.clear();
  return { ok: true };
}
function updateConfig(newConfig) {
  _config = Object.assign({}, _config, newConfig);
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  const hitRate = _metrics.cacheHits + _metrics.cacheMisses > 0 ? Math.round(_metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses) * 100) : 0;
  return Object.assign({}, _metrics, {
    cacheSize: _preloadedResources.size,
    cacheHitRate: `${hitRate}%`,
    predictionAccuracy: _metrics.predictionsMade > 0 ? `${Math.round(_metrics.predictionsCorrect / _metrics.predictionsMade * 100)}%` : "N/A"
  });
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _enabled,
    strategies: PRELOAD_STRATEGIES,
    config: Object.assign({}, _config),
    metrics: getMetrics()
  };
}
function healthCheck() {
  const checks = {
    enabled: _enabled,
    cacheNotFull: _preloadedResources.size < _config.maxPreloads * 10,
    lowFailureRate: _metrics.preloadsFailed < _metrics.preloadsTriggered * 0.2
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_enabled) status = "NOT_INITIALIZED";
  else if (!checks.lowFailureRate) status = "DEGRADED";
  return {
    status,
    score: { passed, total, percentage: Math.round(passed / total * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    checks,
    metrics: _metrics,
    timestamp: Date.now()
  };
}
var preload_manager_default = {
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
export {
  MODULE_ID,
  VERSION,
  cleanup,
  clearCache,
  preload_manager_default as default,
  destroy,
  getMetrics,
  getPorts,
  getPredictions,
  getTransitionStats,
  healthCheck,
  info,
  init,
  injectPorts,
  isPreloaded,
  onHover,
  onHoverEnd,
  preload,
  preloadMultiple,
  updateConfig
};
