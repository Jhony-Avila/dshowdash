
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer-zindex-manager
// PURPOSE: Overlay Layer - Z-Index Manager v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LAYER_NAMES — exported value
//   acquire() — exported function
//   release() — exported function
//   getTop() — exported function
//   peekNext() — exported function
//   getLayerInfo() — exported function
//   getAllocations() — exported function
//   getAllocation() — exported function
//   isInUse() — exported function
//   getLayerForZIndex() — exported function
//   resetLayer() — exported function
//   reset() — exported function
//   defineLayer() — exported function
//   removeLayer() — exported function
//   getLayers() — exported function
//   getLayerNames() — exported function
//   compare() — exported function
//   isAbove() — exported function
//   isBelow() — exported function
//   configure() — exported function
//   getConfig() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-layer-zindex-manager';

// Configuração de layers e ranges
const DEFAULT_LAYERS = {
  base: { min: 1, max: 99, current: 1 },
  dropdown: { min: 100, max: 199, current: 100 },
  sticky: { min: 200, max: 299, current: 200 },
  tooltip: { min: 300, max: 399, current: 300 },
  popover: { min: 400, max: 499, current: 400 },
  overlay: { min: 500, max: 799, current: 500 },
  modal: { min: 800, max: 999, current: 800 },
  toast: { min: 1000, max: 1099, current: 1000 },
  system: { min: 1100, max: 1199, current: 1100 },
  maximum: { min: 1200, max: 9999, current: 1200 }
};

// Configuração padrão
const DEFAULT_CONFIG = {
  enabled: true,
  baseOffset: 0,
  autoRelease: true,
  trackAllocations: true
};

// Estado interno
let _config = { ...DEFAULT_CONFIG };
let _layers: Record<string, any> = JSON.parse(JSON.stringify(DEFAULT_LAYERS));
let _allocations = new Map();
let _state = {
  totalAcquired: 0,
  totalReleased: 0,
  peakUsage: {}
};

// Inicializar peak usage
for (const layer of Object.keys(DEFAULT_LAYERS)) {
  (_state.peakUsage as DynObj)[layer] = 0;
}

/**
 * Adquire um z-index para uma layer específica
 */
export function acquire(layer: string, options: { id?: string; wrap?: boolean; metadata?: Record<string, any> } = {}) {
  if (!_config.enabled) {
    return { ok: false, error: 'manager-disabled' };
  }
  
  const layerConfig = _layers[layer];
  if (!layerConfig) {
    return { ok: false, error: 'invalid-layer', validLayers: Object.keys(_layers) };
  }
  
  // Verificar se atingiu máximo
  if (layerConfig.current >= layerConfig.max) {
    if (options.wrap) {
      // Voltar ao início se permitido
      layerConfig.current = layerConfig.min;
    } else {
      return { 
        ok: false, 
        error: 'layer-exhausted', 
        layer, 
        max: layerConfig.max 
      };
    }
  }
  
  const zIndex = layerConfig.current + _config.baseOffset;
  layerConfig.current++;
  
  _state.totalAcquired++;
  
  // Rastrear alocação
  if (_config.trackAllocations && options.id) {
    _allocations.set(options.id, {
      zIndex,
      layer,
      acquiredAt: Date.now(),
      metadata: options.metadata || {}
    });
  }
  
  // Atualizar peak usage
  const currentUsage = layerConfig.current - layerConfig.min;
  if (currentUsage > (_state.peakUsage as DynObj)[layer]) {
    (_state.peakUsage as DynObj)[layer] = currentUsage;
  }
  
  return {
    ok: true,
    zIndex,
    layer,
    remaining: layerConfig.max - layerConfig.current
  };
}

/**
 * Libera um z-index (para tracking)
 */
export function release(idOrZIndex: number) {
  _state.totalReleased++;
  
  if (typeof idOrZIndex === 'string') {
    // Liberar por ID
    const allocation = _allocations.get(idOrZIndex);
    if (allocation) {
      _allocations.delete(idOrZIndex);
      return { ok: true, released: idOrZIndex, zIndex: allocation.zIndex };
    }
    return { ok: false, error: 'allocation-not-found' };
  }
  
  // Liberar por z-index
  for (const [id, allocation] of _allocations) {
    if (allocation.zIndex === idOrZIndex) {
      _allocations.delete(id);
      return { ok: true, released: id, zIndex: idOrZIndex };
    }
  }
  
  return { ok: false, error: 'zindex-not-tracked' };
}

/**
 * Retorna o z-index do topo de uma layer
 */
export function getTop(layer: DynObj) {
  const layerConfig = _layers[layer];
  if (!layerConfig) return null;
  
  return layerConfig.current - 1 + _config.baseOffset;
}

/**
 * Retorna o próximo z-index de uma layer (sem adquirir)
 */
export function peekNext(layer: DynObj) {
  const layerConfig = _layers[layer];
  if (!layerConfig) return null;
  
  if (layerConfig.current >= layerConfig.max) {
    return null;
  }
  
  return layerConfig.current + _config.baseOffset;
}

/**
 * Retorna informações de uma layer
 */
export function getLayerInfo(layer: DynObj) {
  const layerConfig = _layers[layer];
  if (!layerConfig) return null;
  
  return {
    layer,
    min: layerConfig.min + _config.baseOffset,
    max: layerConfig.max + _config.baseOffset,
    current: layerConfig.current + _config.baseOffset,
    used: layerConfig.current - layerConfig.min,
    remaining: layerConfig.max - layerConfig.current,
    utilizationPercent: ((layerConfig.current - layerConfig.min) / (layerConfig.max - layerConfig.min)) * 100
  };
}

/**
 * Retorna todas as alocações ativas
 */
export function getAllocations() {
  const result = [];
  for (const [id, allocation] of _allocations) {
    result.push({
      id,
      ...allocation
    });
  }
  return result.sort((a, b) => a.zIndex - b.zIndex);
}

/**
 * Retorna alocação por ID
 */
export function getAllocation(id: DynObj) {
  return _allocations.get(id) || null;
}

/**
 * Verifica se um z-index está em uso
 */
export function isInUse(zIndex: number) {
  for (const allocation of _allocations.values()) {
    if (allocation.zIndex === zIndex) return true;
  }
  return false;
}

/**
 * Verifica qual layer um z-index pertence
 */
export function getLayerForZIndex(zIndex: number) {
  const adjustedZ = zIndex - _config.baseOffset;
  
  for (const [layer, config] of Object.entries(_layers)) {
    if (adjustedZ >= config.min && adjustedZ <= config.max) {
      return layer;
    }
  }
  
  return null;
}

/**
 * Reseta uma layer específica
 */
export function resetLayer(layer: DynObj) {
  const layerConfig = _layers[layer];
  if (!layerConfig) {
    return { ok: false, error: 'invalid-layer' };
  }
  
  const oldCurrent = layerConfig.current;
  layerConfig.current = layerConfig.min;
  
  // Remover alocações dessa layer
  for (const [id, allocation] of _allocations) {
    if (allocation.layer === layer) {
      _allocations.delete(id);
    }
  }
  
  return { ok: true, layer, previousCurrent: oldCurrent };
}

/**
 * Reseta todas as layers
 */
export function reset() {
  _layers = JSON.parse(JSON.stringify(DEFAULT_LAYERS));
  _allocations.clear();
  
  return { ok: true, reset: true };
}

/**
 * Define uma layer customizada
 */
export function defineLayer(name: string, min: number, max: number) {
  if (!name || typeof name !== 'string') {
    return { ok: false, error: 'invalid-layer-name' };
  }
  
  if (typeof min !== 'number' || typeof max !== 'number' || min >= max) {
    return { ok: false, error: 'invalid-range' };
  }
  
  // Verificar sobreposição com outras layers
  for (const [existingLayer, config] of Object.entries(_layers)) {
    if (existingLayer === name) continue;
    
    if ((min >= config.min && min <= config.max) ||
        (max >= config.min && max <= config.max) ||
        (min <= config.min && max >= config.max)) {
      return { 
        ok: false, 
        error: 'range-overlaps', 
        conflictsWith: existingLayer 
      };
    }
  }
  
  _layers[name] = { min, max, current: min };
  (_state.peakUsage as DynObj)[name] = 0;
  
  return { ok: true, layer: name, min, max };
}

/**
 * Remove uma layer customizada
 */
export function removeLayer(name: string) {
  // Não permitir remover layers padrão
  if ((DEFAULT_LAYERS as DynObj)[name]) {
    return { ok: false, error: 'cannot-remove-default-layer' };
  }
  
  if (!_layers[name]) {
    return { ok: false, error: 'layer-not-found' };
  }
  
  // Remover alocações dessa layer
  for (const [id, allocation] of _allocations) {
    if (allocation.layer === name) {
      _allocations.delete(id);
    }
  }
  
  delete _layers[name];
  delete (_state.peakUsage as DynObj)[name];
  
  return { ok: true, removed: name };
}

/**
 * Retorna todas as layers
 */
export function getLayers() {
  return Object.keys(_layers).map(layer => getLayerInfo(layer));
}

/**
 * Retorna nomes das layers
 */
export function getLayerNames() {
  return Object.keys(_layers);
}

/**
 * Compara dois z-indexes
 */
export function compare(zIndex1: DynObj, zIndex2: DynObj) {
  if (zIndex1 > zIndex2) return 1;
  if (zIndex1 < zIndex2) return -1;
  return 0;
}

/**
 * Verifica se zIndex1 está acima de zIndex2
 */
export function isAbove(zIndex1: DynObj, zIndex2: DynObj) {
  return zIndex1 > zIndex2;
}

/**
 * Verifica se zIndex1 está abaixo de zIndex2
 */
export function isBelow(zIndex1: DynObj, zIndex2: DynObj) {
  return zIndex1 < zIndex2;
}

/**
 * Atualiza configuração
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  _config = { ..._config, ...config };
  return true;
}

/**
 * Retorna configuração
 */
export function getConfig() {
  return { ..._config };
}

/**
 * Retorna métricas
 */
export function getMetrics() {
  const layers = getLayers();
  
  return {
    enabled: _config.enabled,
    totalLayers: layers.length,
    totalAcquired: _state.totalAcquired,
    totalReleased: _state.totalReleased,
    activeAllocations: _allocations.size,
    peakUsage: { ..._state.peakUsage },
    layerUtilization: layers.reduce((acc, l) => {
      (acc as DynObj)[l!.layer] = `${l!.utilizationPercent.toFixed(0)}%`;
      return acc;
    }, {})
  };
}

/**
 * Health check
 */
export function healthCheck() {
  const layers = getLayers();
  const highUtilization = layers.filter(l => l!.utilizationPercent > 80);
  
  const checks = {
    enabled: _config.enabled,
    layersConfigured: layers.length > 0,
    noExhaustedLayers: layers.every(l => l!.remaining > 0),
    lowUtilization: highUtilization.length === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!checks.noExhaustedLayers) status = 'UNHEALTHY';
  else if (!checks.lowUtilization) status = 'DEGRADED';
  
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    metrics: {
      layers: layers.length,
      allocations: _allocations.size,
      highUtilization: highUtilization.map(l => l!.layer)
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

/**
 * Info do módulo
 */
export function info() {
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

// Export constantes
export const LAYER_NAMES = Object.keys(DEFAULT_LAYERS);

// Export default
export default {
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
