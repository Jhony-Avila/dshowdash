import { SYSTEM_EVENTS } from "/core/runtime/events/catalog/system.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict } from "/core/runtime/enterprise/strict-mode.js";
const MODULE_ID = "components.telemetry-kernel.health-registry";
const VERSION = "2.4.0-P2-ENTERPRISE";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _state = { initialized: false, history: [], maxHistory: 100, snapshotIdCounter: 0, collectionInterval: null, autoCollectMs: 6e4, lastCollection: null, collectionsCount: 0, collectionFailures: 0, metrics: { collections: 0, failures: 0, avgDuration: 0 } };
const _envelope = (ok, data, errors) => ({ ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: (/* @__PURE__ */ new Date()).toISOString() }, errors: errors || [] });
const _genSnapshotId = () => `snap-${++_state.snapshotIdCounter}-${Date.now().toString(36)}`;
const _track = (eventName, payload) => {
  try {
    const tk = _getPort("telemetryCore");
    tk?.track?.(eventName, payload, "info", MODULE_ID);
  } catch (e) {
  }
};
const init = (options = {}) => {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _initPorts();
    if (typeof options.autoCollectMs === "number") _state.autoCollectMs = options.autoCollectMs;
    if (typeof options.maxHistory === "number") _state.maxHistory = options.maxHistory;
    const tk = _getPort("telemetryCore");
    tk?.register?.({ id: MODULE_ID, version: VERSION, healthCheck, info });
    if (_state.autoCollectMs > 0) {
      _state.collectionInterval = setInterval(() => collectAndStore(), _state.autoCollectMs);
    }
    _state.initialized = true;
    const eb = _getPort("eventBus");
    eb?.emit?.(SYSTEM_EVENTS.HEALTH_REGISTRY_READY, { version: VERSION });
    _track("health-registry:init", { autoCollectMs: _state.autoCollectMs });
    return _envelope(true, { initialized: true, autoCollectMs: _state.autoCollectMs });
  } catch (e) {
    return _envelope(false, null, [{ code: "INIT_ERROR", message: e.message }]);
  }
};
const collectAndStore = () => {
  const tk = _getPort("telemetryCore");
  if (!tk?.collect) {
    _state.collectionFailures++;
    return _envelope(false, null, [{ code: "NO_KERNEL", message: "TelemetryKernel not available" }]);
  }
  const startTime = Date.now();
  try {
    const result = tk.collect();
    const durationMs = Date.now() - startTime;
    if (result.ok) {
      const snapshot = { snapshotId: _genSnapshotId(), timestamp: Date.now(), isoTime: (/* @__PURE__ */ new Date()).toISOString(), global: result.data.global, modules: result.data.modules, issues: result.data.issues, collectionMeta: { durationMs } };
      _state.lastCollection = snapshot;
      _state.history.push(snapshot);
      _state.collectionsCount++;
      _state.metrics.collections++;
      _state.metrics.avgDuration = Math.round((_state.metrics.avgDuration * (_state.metrics.collections - 1) + durationMs) / _state.metrics.collections);
      if (_state.history.length > _state.maxHistory) {
        _state.history = _state.history.slice(-_state.maxHistory);
      }
      const eb = _getPort("eventBus");
      eb?.emit?.(SYSTEM_EVENTS.HEALTH_COLLECTED, { snapshotId: snapshot.snapshotId, status: snapshot.global.status, score: snapshot.global.score });
      return _envelope(true, { snapshot });
    } else {
      _state.collectionFailures++;
      _state.metrics.failures++;
      return result;
    }
  } catch (e) {
    _state.collectionFailures++;
    _state.metrics.failures++;
    _track("health-registry:collection-error", { error: e.message });
    return _envelope(false, null, [{ code: "COLLECTION_ERROR", message: e.message }]);
  }
};
const getStatus = () => {
  const tk = _getPort("telemetryCore");
  if (!tk?.summary) {
    if (_state.lastCollection) {
      return _envelope(true, { status: _state.lastCollection.global.status, score: _state.lastCollection.global.score, modules: _state.lastCollection.global.modulesTotal, fromCache: true, cacheAge: Date.now() - _state.lastCollection.timestamp });
    }
    return _envelope(false, null, [{ code: "NO_KERNEL", message: "TelemetryKernel not available" }]);
  }
  return tk.summary();
};
const getHistory = (limit = 10) => {
  const recent = _state.history.slice(-limit);
  return _envelope(true, { history: recent.map((h) => ({ snapshotId: h.snapshotId, timestamp: h.timestamp, isoTime: h.isoTime, status: h.global.status, score: h.global.score, modules: h.global.modulesTotal, issues: h.issues.length })), count: recent.length, total: _state.history.length });
};
const getTrend = (points = 10) => {
  const recent = _state.history.slice(-points);
  if (recent.length === 0) {
    return _envelope(true, { trend: [], direction: "unknown", avgScore: 0, points: 0 });
  }
  const trend = recent.map((h) => ({ timestamp: h.timestamp, isoTime: h.isoTime, status: h.global.status, score: h.global.score, issues: h.issues.length, criticalIssues: h.issues.filter((i) => i.severity === "crit").length }));
  const totalScore = trend.reduce((sum, t) => sum + t.score, 0);
  const avgScore = Math.round(totalScore / trend.length);
  let direction = "stable";
  if (trend.length >= 2) {
    const firstHalf = trend.slice(0, Math.floor(trend.length / 2));
    const secondHalf = trend.slice(Math.floor(trend.length / 2));
    const firstAvg = firstHalf.reduce((s, t) => s + t.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((s, t) => s + t.score, 0) / secondHalf.length;
    if (secondAvg > firstAvg + 5) direction = "improving";
    else if (secondAvg < firstAvg - 5) direction = "declining";
  }
  const variance = trend.reduce((sum, t) => sum + Math.pow(t.score - avgScore, 2), 0) / trend.length;
  const volatility = Math.round(Math.sqrt(variance));
  return _envelope(true, { trend, direction, avgScore, minScore: Math.min(...trend.map((t) => t.score)), maxScore: Math.max(...trend.map((t) => t.score)), volatility, points: trend.length });
};
const getIncidentTimeline = (limit = 20) => {
  const incidents = [];
  for (const snapshot of _state.history.slice(-limit)) {
    if (snapshot.issues?.length > 0) {
      for (const issue of snapshot.issues) {
        incidents.push({ timestamp: snapshot.timestamp, isoTime: snapshot.isoTime, snapshotId: snapshot.snapshotId, moduleId: issue.moduleId, code: issue.code, severity: issue.severity, message: issue.message });
      }
    }
  }
  incidents.sort((a, b) => b.timestamp - a.timestamp);
  return _envelope(true, { incidents: incidents.slice(0, limit * 2), count: incidents.length });
};
const collectNow = () => collectAndStore();
const healthCheck = () => {
  const portsSnapshot = Ports.snapshot();
  const issues = [];
  let score = 100;
  if (!_state.initialized) {
    issues.push({ code: "NOT_INIT", severity: "crit", message: "Not initialized" });
    score -= 50;
  }
  const tk = _getPort("telemetryCore");
  if (!tk) {
    issues.push({ code: "NO_KERNEL", severity: "warn", message: "TelemetryKernel not available" });
    score -= 20;
  }
  if (!_state.lastCollection) {
    issues.push({ code: "NO_COLLECTION", severity: "info", message: "No collection yet" });
    score -= 5;
  } else if (Date.now() - _state.lastCollection.timestamp > _state.autoCollectMs * 2) {
    issues.push({ code: "STALE_DATA", severity: "warn", message: "Last collection too old" });
    score -= 15;
  }
  if (_state.collectionFailures > 0) {
    issues.push({ code: "COLLECTION_FAILURES", severity: "warn", message: `${_state.collectionFailures} failures` });
    score -= 10;
  }
  const status = score >= 80 ? "HEALTHY" : score >= 50 ? "DEGRADED" : "UNHEALTHY";
  return { status, score: Math.max(0, score), moduleId: MODULE_ID, version: VERSION, portsInitialized: portsSnapshot._initialized, checks: { initialized: { ok: _state.initialized, severity: "crit" }, kernelConnected: { ok: !!tk, severity: "warn" }, dataFresh: { ok: _state.lastCollection && Date.now() - _state.lastCollection.timestamp < _state.autoCollectMs * 2, severity: "warn" } }, issues, metrics: { historySize: _state.history.length, collectionsCount: _state.collectionsCount, collectionFailures: _state.collectionFailures, avgCollectionDuration: _state.metrics.avgDuration, lastCollectionAge: _state.lastCollection ? Date.now() - _state.lastCollection.timestamp : null }, strictMode: isStrict(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
const info = () => {
  const portsSnapshot = Ports.snapshot();
  return _envelope(true, { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, portsInitialized: portsSnapshot._initialized, historySize: _state.history.length, maxHistory: _state.maxHistory, autoCollectMs: _state.autoCollectMs, collectionsCount: _state.collectionsCount, collectionFailures: _state.collectionFailures, lastCollection: _state.lastCollection?.isoTime || null, timestamp: Date.now() });
};
const cleanup = () => {
  if (_state.collectionInterval) {
    clearInterval(_state.collectionInterval);
    _state.collectionInterval = null;
  }
  _state.history = [];
  _state.lastCollection = null;
  _state.initialized = false;
  _state.collectionsCount = 0;
  _state.collectionFailures = 0;
  return _envelope(true, { cleanedUp: true });
};
if (typeof window !== "undefined") {
  window.HealthRegistry = { MODULE_ID, VERSION, init, cleanup, getStatus, getHistory, getTrend, getIncidentTimeline, collectNow, healthCheck, info, injectPorts, getPorts };
}
var health_registry_default = { MODULE_ID, VERSION, init, cleanup, getStatus, getHistory, getTrend, getIncidentTimeline, collectNow, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  collectNow,
  health_registry_default as default,
  getHistory,
  getIncidentTimeline,
  getPorts,
  getStatus,
  getTrend,
  healthCheck,
  info,
  init,
  injectPorts
};
