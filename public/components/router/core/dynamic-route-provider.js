import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.core.dynamic-route-provider";
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
const _dynamicRoutes = /* @__PURE__ */ new Map();
let _loaded = false;
let _loading = false;
let _lastLoadTime = null;
let _loadPromise = null;
const CONFIG = { API_ENDPOINT: "/api/admin/orchestrator/?action=manifest", CACHE_TTL: 5 * 60 * 1e3, RETRY_DELAY: 1e3, MAX_RETRIES: 3, TIMEOUT: 1e4 };
const _metrics = { loads: 0, hits: 0, misses: 0, errors: 0 };
function _formatTitle(target) {
  return target.replace(/^status-/, "Status: ").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function loadRoutes(force) {
  if (!force) force = false;
  if (_loaded && !force && _lastLoadTime) {
    const elapsed = Date.now() - _lastLoadTime;
    if (elapsed < CONFIG.CACHE_TTL) {
      return Promise.resolve({ success: true, cached: true, count: _dynamicRoutes.size });
    }
  }
  if (_loading && _loadPromise) {
    return _loadPromise;
  }
  _loading = true;
  _metrics.loads++;
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, CONFIG.TIMEOUT);
  _loadPromise = fetch(CONFIG.API_ENDPOINT, { signal: controller.signal }).then((response) => {
    clearTimeout(timeout);
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return response.json();
  }).then((data) => {
    if (!data.success || !data.data || !data.data.rules) throw new Error("Invalid API response");
    _dynamicRoutes.clear();
    data.data.rules.forEach((rule) => {
      if (rule.action_type === "navigate" && rule.target && rule.is_active) {
        const target = rule.target;
        const path = `/${target}`;
        const hashPath = `#/${target}`;
        let panel = "panel-status";
        let page = target;
        if (target.startsWith("status-")) {
          panel = "panel-status";
          page = "panel-status";
        } else if (target === "meu-perfil") {
          panel = "panel-profile";
          page = "panel-profile";
        } else if (target === "preferencias") {
          panel = "panel-preferences";
          page = "panel-preferences";
        } else if (target === "seguranca") {
          panel = "panel-security";
          page = "panel-security";
        } else if (target === "sessoes") {
          panel = "panel-sessions";
          page = "panel-sessions";
        } else if (target === "home" || target === "dashboard") {
          panel = "panel-01";
          page = "panel-01";
        } else if (target === "clientes") {
          panel = "panel-05";
          page = "panel-05";
        } else if (target === "financeiro") {
          panel = "panel-10";
          page = "panel-10";
        } else if (target === "comercial") {
          panel = "panel-07";
          page = "panel-07";
        } else if (target === "analytics" || target === "relatorios") {
          panel = "panel-01";
          page = "panel-01";
        }
        const routeConfig = { id: rule.rule_key || `dynamic-${target}`, name: rule.rule_key || target, page, title: _formatTitle(target), public: false, requiresAuth: true, permissions: [], featureFlags: [], layout: "default", defaultView: panel, defaultHash: hashPath, mountMain: true, domain: "dashboard", virtualDefaults: { view: panel, tab: "overview", section: null, entity: null, mode: "view" }, tags: ["dynamic", "database"], source: "database", ruleId: rule.id, intentId: rule.intent_id };
        _dynamicRoutes.set(path, routeConfig);
        _dynamicRoutes.set(hashPath, routeConfig);
        _dynamicRoutes.set(target, routeConfig);
        _dynamicRoutes.set(hashPath.replace("#/", ""), routeConfig);
      }
    });
    _loaded = true;
    _lastLoadTime = Date.now();
    _log("info", "Dynamic routes loaded", { count: _dynamicRoutes.size });
    return { success: true, count: _dynamicRoutes.size };
  }).catch((error) => {
    clearTimeout(timeout);
    _metrics.errors++;
    _log("error", "Failed to load dynamic routes", { error: error.message, aborted: error.name === "AbortError" });
    return { success: false, error: error.message };
  }).finally(() => {
    _loading = false;
    _loadPromise = null;
  });
  return _loadPromise;
}
function resolve(path) {
  if (!path) return null;
  const cleanPath = path.replace(/^#?\/?/, "").toLowerCase();
  const variations = [path, `/${cleanPath}`, `#/${cleanPath}`, cleanPath];
  for (let i = 0; i < variations.length; i++) {
    if (_dynamicRoutes.has(variations[i])) {
      _metrics.hits++;
      const route = _dynamicRoutes.get(variations[i]);
      _log("debug", "Dynamic route hit", { path, variant: variations[i], route: route.id });
      return route;
    }
  }
  _metrics.misses++;
  return null;
}
function has(path) {
  return resolve(path) !== null;
}
function getAll() {
  const unique = /* @__PURE__ */ new Map();
  _dynamicRoutes.forEach((config, key) => {
    if (!unique.has(config.id)) {
      unique.set(config.id, Object.assign({ path: key }, config));
    }
  });
  return Array.from(unique.values());
}
function reload() {
  return loadRoutes(true);
}
function clear() {
  _dynamicRoutes.clear();
  _loaded = false;
  _lastLoadTime = null;
}
function getMetrics() {
  return Object.assign({}, _metrics, { routeCount: _dynamicRoutes.size, loaded: _loaded, cacheAge: _lastLoadTime ? Date.now() - _lastLoadTime : null });
}
function healthCheck() {
  return { status: _loaded ? "HEALTHY" : "NOT_LOADED", version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { loaded: _loaded, hasRoutes: _dynamicRoutes.size > 0, noErrors: _metrics.errors === 0 }, metrics: getMetrics() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), loaded: _loaded, routeCount: _dynamicRoutes.size, lastLoadTime: _lastLoadTime, metrics: getMetrics() };
}
const DynamicRouteProvider = { VERSION, MODULE_ID, loadRoutes, resolve, has, getAll, reload, clear, getMetrics, healthCheck, info, injectPorts, getPorts };
var dynamic_route_provider_default = DynamicRouteProvider;
export {
  DynamicRouteProvider,
  MODULE_ID,
  VERSION,
  dynamic_route_provider_default as default,
  getPorts,
  injectPorts
};
