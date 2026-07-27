import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
import { cacheStore } from "../state/store.js";
import { trackCacheEvent } from "../telemetry/tracker.js";
import { POLICIES, TELEMETRY_EVENTS } from "./contracts.js";
const VERSION = "3.5.0-P2-ENTERPRISE";
const MODULE_ID = "components.cache-manager.core.policies";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let _debug = false;
let _metrics = { evictions: { total: 0, byPolicy: { lru: 0, lfu: 0, fifo: 0 } }, policyChanges: 0, batchEvictions: 0, lastEvictionAt: null };
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (level === "error") {
    logger.error?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
    return;
  }
  if (_debug) logger.debug?.(`[${MODULE_ID}]`, ...args);
};
const _getValidPolicies = () => Object.values(POLICIES);
const CachePolicies = {
  LRU: POLICIES.LRU,
  LFU: POLICIES.LFU,
  FIFO: POLICIES.FIFO,
  currentPolicy: POLICIES.DEFAULT,
  setDebug: (debug) => {
    _debug = debug;
  },
  getVersion: () => VERSION,
  setPolicy: (policy) => {
    const validPolicies = _getValidPolicies();
    if (validPolicies.includes(policy)) {
      const oldPolicy = CachePolicies.currentPolicy;
      CachePolicies.currentPolicy = policy;
      _metrics.policyChanges++;
      trackCacheEvent(TELEMETRY_EVENTS.EVICT.replace(":evict", ":policy:changed"), { oldPolicy, newPolicy: policy, moduleId: MODULE_ID });
      _log("info", "Policy changed:", oldPolicy, "->", policy);
    }
  },
  getPolicy: () => CachePolicies.currentPolicy,
  evict: () => {
    const keys = cacheStore.getAllKeys();
    if (keys.length === 0) return null;
    const entries = keys.map((key) => cacheStore.getEntry(key)).filter(Boolean);
    if (entries.length === 0) return null;
    let toEvict = null;
    switch (CachePolicies.currentPolicy) {
      case POLICIES.LFU:
        for (const entry of entries) {
          if (!toEvict || entry.accessCount < toEvict.accessCount) toEvict = entry;
        }
        break;
      case POLICIES.FIFO:
        for (const entry of entries) {
          if (!toEvict || entry.createdAt < toEvict.createdAt) toEvict = entry;
        }
        break;
      default:
        for (const entry of entries) {
          if (!toEvict || entry.lastAccess < toEvict.lastAccess) toEvict = entry;
        }
    }
    if (toEvict) {
      cacheStore.deleteEntry(toEvict.key);
      cacheStore.incrementEvictions();
      _metrics.evictions.total++;
      _metrics.evictions.byPolicy[CachePolicies.currentPolicy] = (_metrics.evictions.byPolicy[CachePolicies.currentPolicy] || 0) + 1;
      _metrics.lastEvictionAt = Date.now();
      trackCacheEvent(TELEMETRY_EVENTS.EVICT, { key: toEvict.key, policy: CachePolicies.currentPolicy, accessCount: toEvict.accessCount, age: Date.now() - toEvict.createdAt, reason: "capacity", moduleId: MODULE_ID });
      _log("info", "Evicted:", toEvict.key, "policy:", CachePolicies.currentPolicy);
      return toEvict.key;
    }
    return null;
  },
  evictBatch: (count = 5) => {
    const evicted = [];
    for (let i = 0; i < count; i++) {
      const key = CachePolicies.evict();
      if (key) evicted.push(key);
      else break;
    }
    if (evicted.length > 0) _metrics.batchEvictions++;
    return evicted;
  },
  getEvictionCandidates: (count = 5) => {
    const keys = cacheStore.getAllKeys();
    if (keys.length === 0) return [];
    const entries = keys.map((key) => cacheStore.getEntry(key)).filter(Boolean);
    if (entries.length === 0) return [];
    switch (CachePolicies.currentPolicy) {
      case POLICIES.LFU:
        entries.sort((a, b) => a.accessCount - b.accessCount);
        break;
      case POLICIES.FIFO:
        entries.sort((a, b) => a.createdAt - b.createdAt);
        break;
      default:
        entries.sort((a, b) => a.lastAccess - b.lastAccess);
    }
    return entries.slice(0, count).map((entry) => ({ key: entry.key, accessCount: entry.accessCount, age: Date.now() - entry.createdAt, lastAccess: entry.lastAccess, score: CachePolicies._calculateEvictionScore(entry) }));
  },
  _calculateEvictionScore: (entry) => {
    switch (CachePolicies.currentPolicy) {
      case POLICIES.LFU:
        return entry.accessCount;
      case POLICIES.FIFO:
        return entry.createdAt;
      default:
        return entry.lastAccess;
    }
  },
  getEvictionStats: () => ({ version: VERSION, moduleId: MODULE_ID, currentPolicy: CachePolicies.currentPolicy, total: _metrics.evictions.total, byPolicy: { ..._metrics.evictions.byPolicy }, policyChanges: _metrics.policyChanges, batchEvictions: _metrics.batchEvictions, lastEvictionAt: _metrics.lastEvictionAt }),
  resetEvictionStats: () => {
    _metrics = { evictions: { total: 0, byPolicy: { lru: 0, lfu: 0, fifo: 0 } }, policyChanges: 0, batchEvictions: 0, lastEvictionAt: null };
    _log("info", "Eviction stats reset");
  },
  healthCheck: () => {
    const portsSnapshot = Ports.snapshot();
    const logger = _getPort("logger");
    const validPolicies = _getValidPolicies();
    const checks = { validPolicy: validPolicies.includes(CachePolicies.currentPolicy), lowEvictionRate: _metrics.evictions.total < 1e3, loggerReady: !!logger, portsInitialized: portsSnapshot._initialized };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  info: () => {
    const portsSnapshot = Ports.snapshot();
    return { version: VERSION, moduleId: MODULE_ID, debug: _debug, currentPolicy: CachePolicies.currentPolicy, availablePolicies: _getValidPolicies(), metrics: { evictions: { ..._metrics.evictions }, policyChanges: _metrics.policyChanges, batchEvictions: _metrics.batchEvictions, lastEvictionAt: _metrics.lastEvictionAt }, healthCheck: CachePolicies.healthCheck(), portsInitialized: portsSnapshot._initialized, strictMode: isStrict(), timestamp: Date.now() };
  },
  getStats: () => ({ version: VERSION, moduleId: MODULE_ID, currentPolicy: CachePolicies.currentPolicy, evictionStats: CachePolicies.getEvictionStats() }),
  injectPorts,
  getPorts
};
function healthCheck() {
  return CachePolicies.healthCheck();
}
function info() {
  return CachePolicies.info();
}
var policies_default = CachePolicies;
export {
  CachePolicies,
  MODULE_ID,
  VERSION,
  policies_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
