const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-config-cache";
const _cache = /* @__PURE__ */ new Map();
const _ttls = /* @__PURE__ */ new Map();
const _hits = { total: 0, hit: 0, miss: 0 };
const DEFAULT_TTL = 5 * 60 * 1e3;
function set(key, value, ttlMs = DEFAULT_TTL) {
  if (typeof key !== "string") return false;
  _cache.set(key, value);
  if (ttlMs > 0) {
    _ttls.set(key, Date.now() + ttlMs);
  } else {
    _ttls.delete(key);
  }
  return true;
}
function get(key, defaultValue = void 0) {
  _hits.total++;
  if (!_cache.has(key)) {
    _hits.miss++;
    return defaultValue;
  }
  const expiry = _ttls.get(key);
  if (expiry && Date.now() > expiry) {
    _cache.delete(key);
    _ttls.delete(key);
    _hits.miss++;
    return defaultValue;
  }
  _hits.hit++;
  return _cache.get(key);
}
function has(key) {
  if (!_cache.has(key)) return false;
  const expiry = _ttls.get(key);
  if (expiry && Date.now() > expiry) {
    _cache.delete(key);
    _ttls.delete(key);
    return false;
  }
  return true;
}
function remove(key) {
  const existed = _cache.has(key);
  _cache.delete(key);
  _ttls.delete(key);
  return existed;
}
function clear() {
  const count = _cache.size;
  _cache.clear();
  _ttls.clear();
  return count;
}
function getOrSet(key, factory, ttlMs = DEFAULT_TTL) {
  if (has(key)) {
    return get(key);
  }
  const value = typeof factory === "function" ? factory() : factory;
  set(key, value, ttlMs);
  return value;
}
async function getOrSetAsync(key, asyncFactory, ttlMs = DEFAULT_TTL) {
  if (has(key)) {
    return get(key);
  }
  const value = await asyncFactory();
  set(key, value, ttlMs);
  return value;
}
function memoize(fn, keyFn = (...args) => JSON.stringify(args), ttlMs = DEFAULT_TTL) {
  return (...args) => {
    const key = `memoize:${fn.name || "anon"}:${keyFn(...args)}`;
    return getOrSet(key, () => fn(...args), ttlMs);
  };
}
function memoizeAsync(fn, keyFn = (...args) => JSON.stringify(args), ttlMs = DEFAULT_TTL) {
  return async (...args) => {
    const key = `memoize:${fn.name || "anon"}:${keyFn(...args)}`;
    return getOrSetAsync(key, () => fn(...args), ttlMs);
  };
}
function prune() {
  const now = Date.now();
  let pruned = 0;
  _ttls.forEach((expiry, key) => {
    if (now > expiry) {
      _cache.delete(key);
      _ttls.delete(key);
      pruned++;
    }
  });
  return pruned;
}
function getStats() {
  return {
    size: _cache.size,
    hitRate: _hits.total > 0 ? Math.round(_hits.hit / _hits.total * 100) : 0,
    hits: _hits.hit,
    misses: _hits.miss,
    total: _hits.total
  };
}
function resetStats() {
  _hits.total = 0;
  _hits.hit = 0;
  _hits.miss = 0;
}
function keys() {
  return [..._cache.keys()];
}
function size() {
  return _cache.size;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, ...getStats() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, ...getStats() };
}
var config_cache_default = {
  set,
  get,
  has,
  remove,
  clear,
  getOrSet,
  getOrSetAsync,
  memoize,
  memoizeAsync,
  prune,
  getStats,
  resetStats,
  keys,
  size,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clear,
  config_cache_default as default,
  get,
  getOrSet,
  getOrSetAsync,
  getStats,
  has,
  healthCheck,
  info,
  keys,
  memoize,
  memoizeAsync,
  prune,
  remove,
  resetStats,
  set,
  size
};
