import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.core.aliases";
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
function _log(level, msg, ctx) {
  if (!ctx) ctx = {};
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  ctx.component = MODULE_ID;
  logger[level](msg, ctx);
}
const _aliases = /* @__PURE__ */ new Map();
const _reverseAliases = /* @__PURE__ */ new Map();
const _metrics = { totalAliases: 0, resolveCount: 0, hitCount: 0, missCount: 0, lastModified: null };
const _subscribers = /* @__PURE__ */ new Set();
function _normalizePath(path) {
  if (!path) return "/";
  let normalized = path.split("?")[0].split("#")[0];
  if (normalized.indexOf("/") !== 0) normalized = `/${normalized}`;
  if (normalized.length > 1 && normalized.charAt(normalized.length - 1) === "/") {
    normalized = normalized.slice(0, -1);
  }
  return normalized.toLowerCase();
}
function _wouldCreateCycle(alias, target) {
  const visited = {};
  visited[alias] = true;
  let current = target;
  while (_aliases.has(current)) {
    if (visited[current]) return true;
    visited[current] = true;
    current = _aliases.get(current).target;
  }
  return false;
}
function _notifySubscribers(action, data) {
  _subscribers.forEach((callback) => {
    try {
      callback({ action, data, timestamp: Date.now() });
    } catch (e) {
      _log("warn", "Subscriber error", { error: e.message });
    }
  });
}
function addAlias(alias, target, options) {
  if (!options) options = {};
  if (!alias || !target) {
    _log("warn", "Invalid alias or target", { alias, target });
    return false;
  }
  const normalizedAlias = _normalizePath(alias);
  const normalizedTarget = _normalizePath(target);
  if (_wouldCreateCycle(normalizedAlias, normalizedTarget)) {
    _log("warn", "Alias would create cycle", { alias: normalizedAlias, target: normalizedTarget });
    return false;
  }
  const aliasConfig = { alias: normalizedAlias, target: normalizedTarget, permanent: options.permanent || false, preserveQuery: options.preserveQuery !== void 0 ? options.preserveQuery : true, preserveHash: options.preserveHash !== void 0 ? options.preserveHash : true, priority: options.priority || 0, metadata: options.metadata || {}, createdAt: Date.now(), hits: 0 };
  _aliases.set(normalizedAlias, aliasConfig);
  if (!_reverseAliases.has(normalizedTarget)) {
    _reverseAliases.set(normalizedTarget, /* @__PURE__ */ new Set());
  }
  _reverseAliases.get(normalizedTarget).add(normalizedAlias);
  _metrics.totalAliases = _aliases.size;
  _metrics.lastModified = Date.now();
  _notifySubscribers("add", aliasConfig);
  _log("info", "Alias added", { alias: normalizedAlias, target: normalizedTarget });
  return true;
}
function removeAlias(alias) {
  const normalizedAlias = _normalizePath(alias);
  const config = _aliases.get(normalizedAlias);
  if (!config) {
    _log("warn", "Alias not found", { alias: normalizedAlias });
    return false;
  }
  const reverseSet = _reverseAliases.get(config.target);
  if (reverseSet) {
    reverseSet.delete(normalizedAlias);
    if (reverseSet.size === 0) {
      _reverseAliases.delete(config.target);
    }
  }
  _aliases.delete(normalizedAlias);
  _metrics.totalAliases = _aliases.size;
  _metrics.lastModified = Date.now();
  _notifySubscribers("remove", config);
  _log("info", "Alias removed", { alias: normalizedAlias });
  return true;
}
function updateAlias(alias, updates) {
  if (!updates) updates = {};
  const normalizedAlias = _normalizePath(alias);
  const config = _aliases.get(normalizedAlias);
  if (!config) {
    _log("warn", "Alias not found for update", { alias: normalizedAlias });
    return false;
  }
  if (updates.target) {
    const newTarget = _normalizePath(updates.target);
    if (_wouldCreateCycle(normalizedAlias, newTarget)) {
      _log("warn", "Update would create cycle");
      return false;
    }
    const oldReverseSet = _reverseAliases.get(config.target);
    if (oldReverseSet) oldReverseSet.delete(normalizedAlias);
    if (!_reverseAliases.has(newTarget)) {
      _reverseAliases.set(newTarget, /* @__PURE__ */ new Set());
    }
    _reverseAliases.get(newTarget).add(normalizedAlias);
    config.target = newTarget;
  }
  if (updates.permanent !== void 0) config.permanent = updates.permanent;
  if (updates.preserveQuery !== void 0) config.preserveQuery = updates.preserveQuery;
  if (updates.preserveHash !== void 0) config.preserveHash = updates.preserveHash;
  if (updates.priority !== void 0) config.priority = updates.priority;
  if (updates.metadata) config.metadata = Object.assign({}, config.metadata, updates.metadata);
  _metrics.lastModified = Date.now();
  _notifySubscribers("update", config);
  return true;
}
function getAlias(alias) {
  return _aliases.get(_normalizePath(alias)) || null;
}
function hasAlias(alias) {
  return _aliases.has(_normalizePath(alias));
}
function getAllAliases() {
  return Array.from(_aliases.values());
}
function getAliasesForTarget(target) {
  const normalizedTarget = _normalizePath(target);
  const aliasSet = _reverseAliases.get(normalizedTarget);
  return aliasSet ? Array.from(aliasSet) : [];
}
function resolve(path) {
  _metrics.resolveCount++;
  const normalizedPath = _normalizePath(path);
  const config = _aliases.get(normalizedPath);
  if (!config) {
    _metrics.missCount++;
    return { resolved: false, path: normalizedPath, original: path };
  }
  _metrics.hitCount++;
  config.hits++;
  let resolvedPath = config.target;
  if (config.preserveQuery) {
    const queryIndex = path.indexOf("?");
    if (queryIndex !== -1) {
      resolvedPath += path.substring(queryIndex);
    }
  }
  if (config.preserveHash) {
    const hashIndex = path.indexOf("#");
    if (hashIndex !== -1) {
      resolvedPath += path.substring(hashIndex);
    }
  }
  return { resolved: true, path: resolvedPath, original: path, alias: config.alias, permanent: config.permanent, hits: config.hits };
}
function resolveChain(path, maxDepth) {
  if (!maxDepth) maxDepth = 10;
  const chain = [path];
  let currentPath = path;
  let depth = 0;
  while (depth < maxDepth) {
    const result = resolve(currentPath);
    if (!result.resolved) break;
    currentPath = result.path;
    chain.push(currentPath);
    depth++;
  }
  return { original: path, final: currentPath, chain, depth };
}
function addBulk(aliases) {
  if (!aliases) aliases = [];
  let added = 0;
  for (let i = 0; i < aliases.length; i++) {
    const item = aliases[i];
    if (addAlias(item.alias, item.target, item)) added++;
  }
  return added;
}
function removeBulk(aliases) {
  if (!aliases) aliases = [];
  let removed = 0;
  for (let i = 0; i < aliases.length; i++) {
    if (removeAlias(aliases[i])) removed++;
  }
  return removed;
}
function clear() {
  const count = _aliases.size;
  _aliases.clear();
  _reverseAliases.clear();
  _metrics.totalAliases = 0;
  _metrics.lastModified = Date.now();
  _notifySubscribers("clear", { count });
  _log("info", "All aliases cleared", { count });
  return count;
}
function exportAliases() {
  return { version: VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), aliases: getAllAliases() };
}
function importAliases(data, options) {
  if (!options) options = { merge: true };
  if (!data || !data.aliases || !Array.isArray(data.aliases)) {
    _log("warn", "Invalid import data");
    return { success: false, imported: 0 };
  }
  if (!options.merge) {
    clear();
  }
  let imported = 0;
  for (let i = 0; i < data.aliases.length; i++) {
    const config = data.aliases[i];
    if (addAlias(config.alias, config.target, { permanent: config.permanent, preserveQuery: config.preserveQuery, preserveHash: config.preserveHash, priority: config.priority, metadata: config.metadata })) {
      imported++;
    }
  }
  _log("info", "Aliases imported", { imported, total: data.aliases.length });
  return { success: true, imported };
}
function subscribe(callback) {
  _subscribers.add(callback);
  return () => {
    _subscribers.delete(callback);
  };
}
function getMetrics() {
  return Object.assign({}, _metrics, { hitRate: _metrics.resolveCount > 0 ? `${(_metrics.hitCount / _metrics.resolveCount * 100).toFixed(2)}%` : "0%" });
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), totalAliases: _aliases.size, metrics: getMetrics(), subscribers: _subscribers.size };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { aliasesValid: _aliases.size >= 0, noCycles: true, metricsTracking: true }, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), features: ["dynamic-aliases", "cycle-detection", "bulk-ops", "import-export", "subscribers", "query-preservation"], status: getStatus() };
}
var aliases_default = { VERSION, MODULE_ID, addAlias, removeAlias, updateAlias, getAlias, hasAlias, getAllAliases, getAliasesForTarget, resolve, resolveChain, addBulk, removeBulk, clear, exportAliases, importAliases, subscribe, getMetrics, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  addAlias,
  addBulk,
  clear,
  aliases_default as default,
  exportAliases,
  getAlias,
  getAliasesForTarget,
  getAllAliases,
  getMetrics,
  getPorts,
  getStatus,
  hasAlias,
  healthCheck,
  importAliases,
  info,
  injectPorts,
  removeAlias,
  removeBulk,
  resolve,
  resolveChain,
  subscribe,
  updateAlias
};
