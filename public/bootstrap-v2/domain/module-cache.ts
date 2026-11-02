// Module Load Cache
// @version 1.0.1-CONTRACTS
// @changelog v1.0.1-CONTRACTS: Dependency Contract formalizado
// @description QW#28 - Cache de módulos carregados para evitar reimportações
// @changelog v1.0.0-QUICKWINS: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: has(), get(), set(), remove(), clear(), getOrLoad(),
//   getStats(), getCacheEntries(), resetStats(), info()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'module-cache';
var VERSION = '1.0.1-CONTRACTS';

// Types
interface CacheEntry {
  module: unknown;
  loadedAt: number;
  lastAccess: number;
  accessCount: number;
  loadTime: number;
  path: string | null;
  size: number | null;
}

interface CacheMetadata {
  loadTime?: number;
  path?: string | null;
  size?: number | null;
}

var _cache: Record<string, CacheEntry> = {};
var _stats = {
  hits: 0,
  misses: 0,
  loads: 0,
  errors: 0
};

function has(moduleId: string) {
  return _cache.hasOwnProperty(moduleId) && _cache[moduleId].module !== null;
}

function get(moduleId: string) {
  if (has(moduleId)) {
    _stats.hits++;
    _cache[moduleId].lastAccess = Date.now();
    _cache[moduleId].accessCount++;
    return _cache[moduleId].module;
  }
  _stats.misses++;
  return null;
}

function set(moduleId: string, module: unknown, metadata: CacheMetadata) {
  if (metadata === undefined) metadata = {};
  
  _cache[moduleId] = {
    module: module,
    loadedAt: Date.now(),
    lastAccess: Date.now(),
    accessCount: 1,
    loadTime: metadata.loadTime || 0,
    path: metadata.path || null,
    size: metadata.size || null
  };
  _stats.loads++;
  
  return _cache[moduleId];
}

function remove(moduleId: string) {
  if (_cache.hasOwnProperty(moduleId)) {
    delete _cache[moduleId];
    return true;
  }
  return false;
}

function clear() {
  _cache = {};
  return true;
}

function getOrLoad(moduleId: string, loadFn: () => unknown | Promise<unknown>, metadata: CacheMetadata) {
  if (has(moduleId)) {
    return Promise.resolve(get(moduleId));
  }
  
  var startTime = Date.now();
  
  return Promise.resolve().then(function() {
    return loadFn();
  }).then(function(module) {
    var loadTime = Date.now() - startTime;
    set(moduleId, module, Object.assign({}, metadata || {}, { loadTime: loadTime }));
    return module;
  }).catch(function(error) {
    _stats.errors++;
    throw error;
  });
}

function getStats() {
  var cacheSize = Object.keys(_cache).length;
  var hitRate = (_stats.hits + _stats.misses) > 0 
    ? Math.round((_stats.hits / (_stats.hits + _stats.misses)) * 100) 
    : 0;
  
  return {
    cacheSize: cacheSize,
    hits: _stats.hits,
    misses: _stats.misses,
    loads: _stats.loads,
    errors: _stats.errors,
    hitRate: hitRate
  };
}

function getCacheEntries() {
  var entries = [];
  for (var id in _cache) {
    if (_cache.hasOwnProperty(id)) {
      entries.push({
        moduleId: id,
        loadedAt: _cache[id].loadedAt,
        lastAccess: _cache[id].lastAccess,
        accessCount: _cache[id].accessCount,
        loadTime: _cache[id].loadTime
      });
    }
  }
  return entries;
}

function resetStats() {
  _stats = { hits: 0, misses: 0, loads: 0, errors: 0 };
}

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    stats: getStats(),
    entries: getCacheEntries()
  };
}

export {
  has,
  get,
  set,
  remove,
  clear,
  getOrLoad,
  getStats,
  getCacheEntries,
  resetStats,
  info,
  MODULE_ID,
  VERSION
};

export default {
  has: has,
  get: get,
  set: set,
  remove: remove,
  clear: clear,
  getOrLoad: getOrLoad,
  getStats: getStats,
  getCacheEntries: getCacheEntries,
  resetStats: resetStats,
  info: info
};
