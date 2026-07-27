import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.core.dom-recycler";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
class DOMRecycler {
  constructor(options = {}) {
    this.maxPoolSize = options.maxPoolSize || 100;
    this._pools = /* @__PURE__ */ new Map();
    this._activeElements = /* @__PURE__ */ new WeakSet();
    this._metrics = { created: 0, recycled: 0, returned: 0, poolHits: 0, poolMisses: 0 };
  }
  acquire(type, createFn) {
    let pool = this._pools.get(type);
    if (!pool) {
      pool = [];
      this._pools.set(type, pool);
    }
    let element;
    if (pool.length > 0) {
      element = pool.pop();
      this._metrics.poolHits++;
      this._metrics.recycled++;
      _log("debug", `Recycled: ${type}`);
    } else {
      element = createFn();
      this._metrics.poolMisses++;
      this._metrics.created++;
    }
    this._activeElements.add(element);
    return element;
  }
  release(type, element) {
    if (!element || !this._activeElements.has(element)) return false;
    let pool = this._pools.get(type);
    if (!pool) {
      pool = [];
      this._pools.set(type, pool);
    }
    if (pool.length >= this.maxPoolSize) {
      element.remove();
      return false;
    }
    this._resetElement(element);
    pool.push(element);
    this._activeElements.delete(element);
    this._metrics.returned++;
    return true;
  }
  releaseAll(type, elements) {
    if (!Array.isArray(elements)) return;
    elements.forEach((el) => this.release(type, el));
  }
  _resetElement(element) {
    const el = element;
    el.className = "";
    el.removeAttribute("style");
    el.removeAttribute("data-index");
    el.textContent = "";
    const attrs = [...el.attributes];
    attrs.forEach((attr) => {
      if (attr.name !== "class") el.removeAttribute(attr.name);
    });
  }
  getPoolSize(type) {
    const pool = this._pools.get(type);
    return pool ? pool.length : 0;
  }
  getTotalPoolSize() {
    let total = 0;
    for (const pool of this._pools.values()) {
      total += pool.length;
    }
    return total;
  }
  clearPool(type) {
    if (type) {
      const pool = this._pools.get(type);
      if (pool) {
        pool.forEach((el) => el.remove?.());
        pool.length = 0;
      }
    } else {
      for (const pool of this._pools.values()) {
        pool.forEach((el) => el.remove?.());
        pool.length = 0;
      }
      this._pools.clear();
    }
    _log("debug", type ? `Pool cleared: ${type}` : "All pools cleared");
  }
  warmPool(type, count, createFn) {
    let pool = this._pools.get(type);
    if (!pool) {
      pool = [];
      this._pools.set(type, pool);
    }
    const toCreate = Math.min(count, this.maxPoolSize - pool.length);
    for (let i = 0; i < toCreate; i++) {
      const element = createFn();
      pool.push(element);
      this._metrics.created++;
    }
    _log("debug", `Pool warmed: ${type} (+${toCreate})`);
  }
  healthCheck() {
    const logger = _getPort("logger");
    const hitRate = this._metrics.poolHits + this._metrics.poolMisses > 0 ? this._metrics.poolHits / (this._metrics.poolHits + this._metrics.poolMisses) : 0;
    const checks = { hasCapacity: this.getTotalPoolSize() < this.maxPoolSize * this._pools.size, goodHitRate: hitRate > 0.5 || this._metrics.poolHits + this._metrics.poolMisses < 10, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, hitRate: `${(hitRate * 100).toFixed(1)}%`, totalPoolSize: this.getTotalPoolSize(), poolTypes: this._pools.size, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, maxPoolSize: this.maxPoolSize, totalPoolSize: this.getTotalPoolSize(), poolTypes: [...this._pools.keys()], metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
  getMetrics() {
    return { ...this._metrics };
  }
  resetMetrics() {
    this._metrics = { created: 0, recycled: 0, returned: 0, poolHits: 0, poolMisses: 0 };
  }
}
function getVersion() {
  return VERSION;
}
var dom_recycler_default = DOMRecycler;
export {
  DOMRecycler,
  MODULE_ID,
  VERSION,
  dom_recycler_default as default,
  getPorts,
  getVersion,
  injectPorts
};
