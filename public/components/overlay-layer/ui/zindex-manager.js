const VERSION = "1.0.0";
const MODULE_ID = "overlay-layer-zindex-manager";
const DEFAULT_LAYERS = {
  base: { min: 1, max: 99, current: 1 },
  dropdown: { min: 100, max: 199, current: 100 },
  sticky: { min: 200, max: 299, current: 200 },
  tooltip: { min: 300, max: 399, current: 300 },
  popover: { min: 400, max: 499, current: 400 },
  overlay: { min: 500, max: 799, current: 500 },
  modal: { min: 800, max: 999, current: 800 },
  toast: { min: 1e3, max: 1099, current: 1e3 },
  system: { min: 1100, max: 1199, current: 1100 },
  maximum: { min: 1200, max: 9999, current: 1200 }
};
const DEFAULT_CONFIG = {
  enabled: true,
  baseOffset: 0,
  autoRelease: true,
  trackAllocations: true
};
let _config = { ...DEFAULT_CONFIG };
let _layers = JSON.parse(JSON.stringify(DEFAULT_LAYERS));
let _allocations = /* @__PURE__ */ new Map();
let _state = {
  totalAcquired: 0,
  totalReleased: 0,
  peakUsage: {}
};
for (const layer of Object.keys(DEFAULT_LAYERS)) {
  _state.peakUsage[layer] = 0;
}
function acquire(layer, options = {}) {
  if (!_config.enabled) {
    return { ok: false, error: "manager-disabled" };
  }
  const layerConfig = _layers[layer];
  if (!layerConfig) {
    return { ok: false, error: "invalid-layer", validLayers: Object.keys(_layers) };
  }
  if (layerConfig.current >= layerConfig.max) {
    if (options.wrap) {
      layerConfig.current = layerConfig.min;
    } else {
      return {
        ok: false,
        error: "layer-exhausted",
        layer,
        max: layerConfig.max
      };
    }
  }
  const zIndex = layerConfig.current + _config.baseOffset;
  layerConfig.current++;
  _state.totalAcquired++;
  if (_config.trackAllocations && options.id) {
    _allocations.set(options.id, {
      zIndex,
      layer,
      acquiredAt: Date.now(),
      metadata: options.metadata || {}
    });
  }
  const currentUsage = layerConfig.current - layerConfig.min;
  if (currentUsage > _state.peakUsage[layer]) {
    _state.peakUsage[layer] = currentUsage;
  }
  return {
    ok: true,
    zIndex,
    layer,
    remaining: layerConfig.max - layerConfig.current
  };
}
function release(idOrZIndex) {
  _state.totalReleased++;
  if (typeof idOrZIndex === "string") {
    const allocation = _allocations.get(idOrZIndex);
    if (allocation) {
      _allocations.delete(idOrZIndex);
      return { ok: true, released: idOrZIndex, zIndex: allocation.zIndex };
    }
    return { ok: false, error: "allocation-not-found" };
  }
  for (const [id, allocation] of _allocations) {
    if (allocation.zIndex === idOrZIndex) {
      _allocations.delete(id);
      return { ok: true, released: id, zIndex: idOrZIndex };
    }
  }
  return { ok: false, error: "zindex-not-tracked" };
}
function getTop(layer) {
  const layerConfig = _layers[layer];
  if (!layerConfig) return null;
  return layerConfig.current - 1 + _config.baseOffset;
}
function peekNext(layer) {
  const layerConfig = _layers[layer];
  if (!layerConfig) return null;
  if (layerConfig.current >= layerConfig.max) {
    return null;
  }
  return layerConfig.current + _config.baseOffset;
}
function getLayerInfo(layer) {
  const layerConfig = _layers[layer];
  if (!layerConfig) return null;
  return {
    layer,
    min: layerConfig.min + _config.baseOffset,
    max: layerConfig.max + _config.baseOffset,
    current: layerConfig.current + _config.baseOffset,
    used: layerConfig.current - layerConfig.min,
    remaining: layerConfig.max - layerConfig.current,
    utilizationPercent: (layerConfig.current - layerConfig.min) / (layerConfig.max - layerConfig.min) * 100
  };
}
function getAllocations() {
  const result = [];
  for (const [id, allocation] of _allocations) {
    result.push({
      id,
      ...allocation
    });
  }
  return result.sort((a, b) => a.zIndex - b.zIndex);
}
function getAllocation(id) {
  return _allocations.get(id) || null;
}
function isInUse(zIndex) {
  for (const allocation of _allocations.values()) {
    if (allocation.zIndex === zIndex) return true;
  }
  return false;
}
function getLayerForZIndex(zIndex) {
  const adjustedZ = zIndex - _config.baseOffset;
  for (const [layer, config] of Object.entries(_layers)) {
    if (adjustedZ >= config.min && adjustedZ <= config.max) {
      return layer;
    }
  }
  return null;
}
function resetLayer(layer) {
  const layerConfig = _layers[layer];
  if (!layerConfig) {
    return { ok: false, error: "invalid-layer" };
  }
  const oldCurrent = layerConfig.current;
  layerConfig.current = layerConfig.min;
  for (const [id, allocation] of _allocations) {
    if (allocation.layer === layer) {
      _allocations.delete(id);
    }
  }
  return { ok: true, layer, previousCurrent: oldCurrent };
}
function reset() {
  _layers = JSON.parse(JSON.stringify(DEFAULT_LAYERS));
  _allocations.clear();
  return { ok: true, reset: true };
}
function defineLayer(name, min, max) {
  if (!name || typeof name !== "string") {
    return { ok: false, error: "invalid-layer-name" };
  }
  if (typeof min !== "number" || typeof max !== "number" || min >= max) {
    return { ok: false, error: "invalid-range" };
  }
  for (const [existingLayer, config] of Object.entries(_layers)) {
    if (existingLayer === name) continue;
    if (min >= config.min && min <= config.max || max >= config.min && max <= config.max || min <= config.min && max >= config.max) {
      return {
        ok: false,
        error: "range-overlaps",
        conflictsWith: existingLayer
      };
    }
  }
  _layers[name] = { min, max, current: min };
  _state.peakUsage[name] = 0;
  return { ok: true, layer: name, min, max };
}
function removeLayer(name) {
  if (DEFAULT_LAYERS[name]) {
    return { ok: false, error: "cannot-remove-default-layer" };
  }
  if (!_layers[name]) {
    return { ok: false, error: "layer-not-found" };
  }
  for (const [id, allocation] of _allocations) {
    if (allocation.layer === name) {
      _allocations.delete(id);
    }
  }
  delete _layers[name];
  delete _state.peakUsage[name];
  return { ok: true, removed: name };
}
function getLayers() {
  return Object.keys(_layers).map((layer) => getLayerInfo(layer));
}
function getLayerNames() {
  return Object.keys(_layers);
}
function compare(zIndex1, zIndex2) {
  if (zIndex1 > zIndex2) return 1;
  if (zIndex1 < zIndex2) return -1;
  return 0;
}
function isAbove(zIndex1, zIndex2) {
  return zIndex1 > zIndex2;
}
function isBelow(zIndex1, zIndex2) {
  return zIndex1 < zIndex2;
}
function configure(config) {
  if (!config || typeof config !== "object") return false;
  _config = { ..._config, ...config };
  return true;
}
function getConfig() {
  return { ..._config };
}
function getMetrics() {
  const layers = getLayers();
  return {
    enabled: _config.enabled,
    totalLayers: layers.length,
    totalAcquired: _state.totalAcquired,
    totalReleased: _state.totalReleased,
    activeAllocations: _allocations.size,
    peakUsage: { ..._state.peakUsage },
    layerUtilization: layers.reduce((acc, l) => {
      acc[l.layer] = `${l.utilizationPercent.toFixed(0)}%`;
      return acc;
    }, {})
  };
}
function healthCheck() {
  const layers = getLayers();
  const highUtilization = layers.filter((l) => l.utilizationPercent > 80);
  const checks = {
    enabled: _config.enabled,
    layersConfigured: layers.length > 0,
    noExhaustedLayers: layers.every((l) => l.remaining > 0),
    lowUtilization: highUtilization.length === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!checks.noExhaustedLayers) status = "UNHEALTHY";
  else if (!checks.lowUtilization) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    metrics: {
      layers: layers.length,
      allocations: _allocations.size,
      highUtilization: highUtilization.map((l) => l.layer)
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    config: getConfig(),
    layers: getLayers(),
    allocations: getAllocations(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
const LAYER_NAMES = Object.keys(DEFAULT_LAYERS);
var zindex_manager_default = {
  acquire,
  release,
  getTop,
  peekNext,
  getLayerInfo,
  getAllocations,
  getAllocation,
  isInUse,
  getLayerForZIndex,
  resetLayer,
  reset,
  defineLayer,
  removeLayer,
  getLayers,
  getLayerNames,
  compare,
  isAbove,
  isBelow,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info,
  LAYER_NAMES,
  VERSION,
  MODULE_ID
};
export {
  LAYER_NAMES,
  MODULE_ID,
  VERSION,
  acquire,
  compare,
  configure,
  zindex_manager_default as default,
  defineLayer,
  getAllocation,
  getAllocations,
  getConfig,
  getLayerForZIndex,
  getLayerInfo,
  getLayerNames,
  getLayers,
  getMetrics,
  getTop,
  healthCheck,
  info,
  isAbove,
  isBelow,
  isInUse,
  peekNext,
  release,
  removeLayer,
  reset,
  resetLayer
};
