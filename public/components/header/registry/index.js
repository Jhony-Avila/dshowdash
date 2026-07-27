import { createUiPorts } from "/core/runtime/ports-profiles.js";
import * as RegistryCache from "./registry-cache.js";
const MODULE_ID = "header:registry";
const VERSION = "4.1.0-ES6";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _debug = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug || false;
};
const _log = function(level, ...rest) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, args.join(" "));
};
const BASE_COMPONENTS = [
  { component_key: "logo", component_type: "brand", label: "Logo", order_index: 0, group_position: "left", uarps_trigger_id: null, is_active: 1 },
  { component_key: "real-time-clock", component_type: "indicator", label: "Relogio", order_index: 1, group_position: "right", uarps_trigger_id: null, is_active: 1 },
  { component_key: "notifications", component_type: "indicator", label: "Notificacoes", order_index: 2, group_position: "right", uarps_trigger_id: null, is_active: 1 },
  { component_key: "errors-status", component_type: "indicator", label: "Erros", order_index: 3, group_position: "right", uarps_trigger_id: null, is_active: 1 },
  { component_key: "user-menu", component_type: "menu", label: "Menu", order_index: 99, group_position: "left", uarps_trigger_id: null, is_active: 1 }
];
let _registry = [];
let _loaded = false;
let _userPermissions = null;
const _loadedComponents = /* @__PURE__ */ new Map();
let _orderSource = "fallback";
const _metrics = { apiCalls: 0, cacheHits: 0, cacheMisses: 0, lastLoadAt: null };
async function loadFromAPI() {
  const cached = RegistryCache.getCachedComponents();
  if (cached) {
    _registry = cached;
    _loaded = true;
    _orderSource = "cache";
    _metrics.cacheHits++;
    _log("debug", "Components loaded from cache", { count: _registry.length });
    return _registry;
  }
  _metrics.cacheMisses++;
  _metrics.apiCalls++;
  try {
    const response = await fetch("/api/ui/header/components", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if ((result.success || result.ok) && result.data) {
      _registry = result.data;
      _loaded = true;
      _orderSource = "database";
      _metrics.lastLoadAt = Date.now();
      RegistryCache.cacheComponents(_registry);
      _log("info", "Components loaded from API", { count: _registry.length });
      return _registry;
    }
    _log("warn", "Failed to load components, using base", { error: result.error });
    _registry = BASE_COMPONENTS.slice();
    _orderSource = "fallback";
    return _registry;
  } catch (err) {
    _log("error", "Error loading components", { error: err.message });
    _registry = BASE_COMPONENTS.slice();
    _orderSource = "fallback";
    return _registry;
  }
}
async function loadUserPermissions() {
  const cached = RegistryCache.getCachedPermissions();
  if (cached) {
    _userPermissions = cached;
    _metrics.cacheHits++;
    _log("debug", "User permissions loaded from cache", { triggers: _userPermissions.triggers.length });
    return;
  }
  _metrics.cacheMisses++;
  _metrics.apiCalls++;
  try {
    const response = await fetch("/api/permissions/me", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" }
    });
    const result = await response.json();
    if ((result.success || result.ok) && result.data) {
      _userPermissions = {
        triggers: result.data.triggers || [],
        regions: result.data.regions || [],
        level: result.data.user && result.data.user.level || 0
      };
      RegistryCache.cachePermissions(_userPermissions);
      _log("debug", "User permissions loaded", { triggers: _userPermissions.triggers.length });
    }
  } catch (err) {
    _log("error", "Error loading user permissions", { error: err.message });
    _userPermissions = { triggers: [], regions: [], level: 0 };
  }
}
function hasAccess(component) {
  const triggerId = component.uarps_trigger_id;
  if (!triggerId) return true;
  if (!_userPermissions) return false;
  const permission = _userPermissions.triggers.find((t) => t.trigger_id === triggerId);
  if (permission) {
    return permission.state === "allow";
  }
  return false;
}
async function load() {
  try {
    await loadFromAPI();
    await loadUserPermissions();
    return { success: true, count: _registry.length, source: _orderSource };
  } catch (err) {
    _log("error", "Load failed", { error: err.message });
    _registry = BASE_COMPONENTS.slice();
    _orderSource = "fallback";
    return { success: true, count: _registry.length, source: "fallback" };
  }
}
function getOrderedComponents() {
  const components = _registry.length > 0 ? _registry : BASE_COMPONENTS;
  const filtered = components.filter((comp) => hasAccess(comp));
  return filtered.slice().sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
}
function getOrderInfo() {
  return { source: _orderSource, count: _registry.length, timestamp: Date.now() };
}
function setComponentLoaded(key, loaded, instance) {
  _loadedComponents.set(key, { loaded, instance, timestamp: Date.now() });
  _log("debug", "Component loaded status updated", { key, loaded });
}
function invalidateCache() {
  _loaded = false;
  _orderSource = "fallback";
  RegistryCache.invalidateAll();
  _log("debug", "Cache invalidated");
}
async function getComponentsForUser() {
  if (!_loaded) {
    await loadFromAPI();
  }
  if (!_userPermissions) {
    await loadUserPermissions();
  }
  const filtered = _registry.filter((comp) => hasAccess(comp));
  _log("debug", "Components filtered", { total: _registry.length, allowed: filtered.length });
  return filtered;
}
function getAllComponents() {
  return _registry;
}
function getComponent(key) {
  return _registry.find((c) => c.component_key === key);
}
function register(component) {
  if (!component.component_key) {
    _log("warn", "Cannot register component without key");
    return false;
  }
  const existing = _registry.findIndex((c) => c.component_key === component.component_key);
  if (existing >= 0) {
    _registry[existing] = Object.assign(_registry[existing], component);
    _log("debug", "Component updated", { key: component.component_key });
  } else {
    _registry.push(component);
    _log("debug", "Component registered", { key: component.component_key });
  }
  RegistryCache.invalidateAll();
  return true;
}
function unregister(key) {
  const index = _registry.findIndex((c) => c.component_key === key);
  if (index >= 0) {
    _registry.splice(index, 1);
    _log("debug", "Component unregistered", { key });
    RegistryCache.invalidateAll();
    return true;
  }
  return false;
}
async function refresh() {
  _loaded = false;
  _userPermissions = null;
  RegistryCache.invalidateAll();
  await loadFromAPI();
  await loadUserPermissions();
  return _registry;
}
function getMetrics() {
  return Object.assign({}, _metrics, { cacheStats: RegistryCache.getStats() });
}
function resetMetrics() {
  _metrics.apiCalls = 0;
  _metrics.cacheHits = 0;
  _metrics.cacheMisses = 0;
  _metrics.lastLoadAt = null;
}
function healthCheck() {
  const ps = Ports.snapshot();
  const hitRate = _metrics.cacheHits + _metrics.cacheMisses > 0 ? _metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses) : 0;
  const checks = {
    registryLoaded: _loaded,
    hasComponents: _registry.length > 0,
    permissionsLoaded: !!_userPermissions,
    goodCacheHitRate: hitRate >= 0.5 || _metrics.cacheHits + _metrics.cacheMisses < 3,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    cacheHitRate: hitRate,
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: _loaded,
    totalComponents: _registry.length,
    userPermissionsLoaded: !!_userPermissions,
    orderSource: _orderSource,
    loadedComponentsCount: _loadedComponents.size,
    uarpsMode: "pure",
    metrics: getMetrics(),
    portsInitialized: ps._initialized,
    healthCheck: healthCheck()
  };
}
var registry_default = { load, loadFromAPI, loadUserPermissions, getOrderedComponents, getOrderInfo, setComponentLoaded, invalidateCache, getComponentsForUser, getAllComponents, getComponent, register, unregister, refresh, hasAccess, getMetrics, resetMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  registry_default as default,
  getAllComponents,
  getComponent,
  getComponentsForUser,
  getMetrics,
  getOrderInfo,
  getOrderedComponents,
  getPorts,
  hasAccess,
  healthCheck,
  info,
  injectPorts,
  invalidateCache,
  load,
  loadFromAPI,
  loadUserPermissions,
  refresh,
  register,
  resetMetrics,
  setComponentLoaded,
  unregister
};
