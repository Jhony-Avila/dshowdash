const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-object-pool";
function createPool(factory, options = {}) {
  const { initialSize = 10, maxSize = 100, reset = null } = options;
  const _pool = [];
  const _active = /* @__PURE__ */ new Set();
  let _created = 0;
  let _metrics = { acquires: 0, releases: 0, creates: 0, reuses: 0 };
  for (let i = 0; i < initialSize; i++) {
    _pool.push(factory());
    _created++;
    _metrics.creates++;
  }
  return {
    acquire() {
      _metrics.acquires++;
      let obj;
      if (_pool.length > 0) {
        obj = _pool.pop();
        _metrics.reuses++;
      } else if (_created < maxSize) {
        obj = factory();
        _created++;
        _metrics.creates++;
      } else {
        obj = factory();
        _metrics.creates++;
      }
      _active.add(obj);
      return obj;
    },
    release(obj) {
      if (!_active.has(obj)) return false;
      _metrics.releases++;
      _active.delete(obj);
      if (_pool.length < maxSize) {
        if (reset) reset(obj);
        _pool.push(obj);
      }
      return true;
    },
    clear() {
      const count = _pool.length;
      _pool.length = 0;
      _active.clear();
      _created = 0;
      return count;
    },
    getStats() {
      return {
        available: _pool.length,
        active: _active.size,
        created: _created,
        maxSize,
        ..._metrics,
        reuseRate: _metrics.acquires > 0 ? `${(_metrics.reuses / _metrics.acquires * 100).toFixed(1)}%` : "0%"
      };
    },
    prewarm(count) {
      const toCreate = Math.min(count, maxSize - _created);
      for (let i = 0; i < toCreate; i++) {
        _pool.push(factory());
        _created++;
        _metrics.creates++;
      }
      return toCreate;
    }
  };
}
function createElementPool(tagName, options = {}) {
  const { className = "", attributes: attrOpt = {} } = options;
  return createPool(
    () => {
      const el = document.createElement(tagName);
      if (className) el.className = className;
      Object.entries(attrOpt).forEach(([k, v]) => el.setAttribute(k, v));
      return el;
    },
    {
      ...options,
      reset: (el) => {
        el.innerHTML = "";
        el.className = className;
        el.removeAttribute("style");
        Object.keys(el.dataset).forEach((k) => delete el.dataset[k]);
      }
    }
  );
}
function createArrayPool(options = {}) {
  return createPool(
    () => [],
    {
      ...options,
      reset: (arr) => {
        arr.length = 0;
      }
    }
  );
}
function createObjectPool(template = {}, options = {}) {
  const templateKeys = Object.keys(template);
  return createPool(
    () => ({ ...template }),
    {
      ...options,
      reset: (obj) => {
        templateKeys.forEach((k) => {
          obj[k] = template[k];
        });
        Object.keys(obj).forEach((k) => {
          if (!templateKeys.includes(k)) delete obj[k];
        });
      }
    }
  );
}
function createEventPool(options = {}) {
  return createObjectPool({
    type: "",
    target: null,
    data: null,
    timestamp: 0,
    handled: false
  }, options);
}
function createRectPool(options = {}) {
  return createObjectPool({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0
  }, options);
}
const _pools = /* @__PURE__ */ new Map();
function registerPool(name, pool) {
  _pools.set(name, pool);
  return pool;
}
function getPool(name) {
  return _pools.get(name) || null;
}
function getAllPoolStats() {
  const stats = {};
  _pools.forEach((pool, name) => {
    stats[name] = pool.getStats();
  });
  return stats;
}
function clearAllPools() {
  let cleared = 0;
  _pools.forEach((pool) => {
    cleared += pool.clear();
  });
  return cleared;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, registeredPools: _pools.size };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, registeredPools: _pools.size, poolStats: getAllPoolStats() };
}
var object_pool_default = {
  createPool,
  createElementPool,
  createArrayPool,
  createObjectPool,
  createEventPool,
  createRectPool,
  registerPool,
  getPool,
  getAllPoolStats,
  clearAllPools,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearAllPools,
  createArrayPool,
  createElementPool,
  createEventPool,
  createObjectPool,
  createPool,
  createRectPool,
  object_pool_default as default,
  getAllPoolStats,
  getPool,
  healthCheck,
  info,
  registerPool
};
