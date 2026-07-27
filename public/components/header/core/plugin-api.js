import { createCorePorts } from "/core/runtime/ports-profiles.js";
import * as PluginSystem from "./plugin-system.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/core/plugin-api";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error" && logger.error) logger.error(prefix, args.join(" "));
  else if (level === "warn" && logger.warn) logger.warn(prefix, args.join(" "));
  else if (level === "info" && logger.info) logger.info(prefix, args.join(" "));
};
let _initialized = false;
let _apiEndpoint = "/api/header/plugins.php";
const _remotePlugins = /* @__PURE__ */ new Map();
const _metrics = {
  apiCalls: 0,
  pluginsLoaded: 0,
  pluginsFailed: 0,
  lastLoadAt: null
};
function init(config) {
  if (_initialized) return;
  _initPorts();
  if (config && config.endpoint) {
    _apiEndpoint = config.endpoint;
  }
  _initialized = true;
  _log("info", "PluginAPI inicializada");
}
function createPlugin(definition) {
  if (!definition || !definition.id) {
    _log("error", "Plugin definition inv\xE1lida - id obrigat\xF3rio");
    return null;
  }
  return {
    id: definition.id,
    version: definition.version || "1.0.0",
    name: definition.name || definition.id,
    description: definition.description || "",
    hooks: definition.hooks || {},
    api: definition.api || {},
    init(context) {
      _log("debug", "Plugin inicializado:", definition.id);
      if (typeof definition.onInit === "function") {
        definition.onInit(context);
      }
    },
    destroy(context) {
      _log("debug", "Plugin destruido:", definition.id);
      if (typeof definition.onDestroy === "function") {
        definition.onDestroy(context);
      }
    }
  };
}
function register(definition) {
  const plugin = createPlugin(definition);
  if (!plugin) {
    return { success: false, error: "Invalid plugin definition" };
  }
  return PluginSystem.registerPlugin(plugin);
}
function unregister(pluginId) {
  return PluginSystem.unregisterPlugin(pluginId);
}
function loadRemotePlugins() {
  _metrics.apiCalls++;
  return fetch(_apiEndpoint, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "X-Requested-With": "XMLHttpRequest"
    },
    credentials: "same-origin"
  }).then((response) => {
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return response.json();
  }).then((data) => {
    if (!data || !Array.isArray(data.plugins)) {
      _log("warn", "Nenhum plugin remoto encontrado");
      return [];
    }
    const results = [];
    data.plugins.forEach((pluginDef) => {
      try {
        const result = register(pluginDef);
        if (result.success) {
          _metrics.pluginsLoaded++;
          _remotePlugins.set(pluginDef.id, pluginDef);
          results.push({ id: pluginDef.id, success: true });
        } else {
          _metrics.pluginsFailed++;
          results.push({ id: pluginDef.id, success: false, error: result.error });
        }
      } catch (e) {
        _metrics.pluginsFailed++;
        results.push({ id: pluginDef.id, success: false, error: e.message });
      }
    });
    _metrics.lastLoadAt = Date.now();
    _log("info", "Plugins remotos carregados:", results.length);
    return results;
  }).catch((error) => {
    _log("error", "Falha ao carregar plugins remotos:", error.message);
    throw error;
  });
}
function listPlugins() {
  return PluginSystem.getAllPlugins();
}
function hasPlugin(pluginId) {
  return PluginSystem.hasPlugin(pluginId);
}
function getPlugin(pluginId) {
  return PluginSystem.getPlugin(pluginId);
}
function enablePlugin(pluginId) {
  return PluginSystem.enablePlugin(pluginId);
}
function disablePlugin(pluginId) {
  return PluginSystem.disablePlugin(pluginId);
}
function executeHook(hookName, data) {
  return PluginSystem.executeHook(hookName, data);
}
function getAvailableHooks() {
  return PluginSystem.AVAILABLE_HOOKS ? PluginSystem.AVAILABLE_HOOKS.slice() : [];
}
function exposeGlobalAPI() {
  window.HeaderPluginAPI = {
    register,
    unregister,
    createPlugin,
    listPlugins,
    hasPlugin,
    getPlugin,
    enablePlugin,
    disablePlugin,
    executeHook,
    getAvailableHooks,
    VERSION
  };
  _log("info", "API global exposta: (window as any).HeaderPluginAPI");
}
function getMetrics() {
  return Object.assign({}, _metrics, {
    remotePluginsCount: _remotePlugins.size
  });
}
function resetMetrics() {
  _metrics.apiCalls = 0;
  _metrics.pluginsLoaded = 0;
  _metrics.pluginsFailed = 0;
  _metrics.lastLoadAt = null;
}
function healthCheck() {
  const pluginSystemHealth = PluginSystem.healthCheck ? PluginSystem.healthCheck() : { status: "UNKNOWN" };
  const checks = {
    initialized: _initialized,
    pluginSystemHealthy: pluginSystemHealth.status !== "UNHEALTHY",
    lowFailureRate: _metrics.pluginsLoaded + _metrics.pluginsFailed === 0 || _metrics.pluginsFailed / (_metrics.pluginsLoaded + _metrics.pluginsFailed) < 0.3,
    portsInitialized: Ports.isInitialized()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    pluginSystemStatus: pluginSystemHealth.status,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    apiEndpoint: _apiEndpoint,
    availableHooks: getAvailableHooks(),
    registeredPlugins: listPlugins(),
    remotePluginsCount: _remotePlugins.size,
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}
var plugin_api_default = {
  VERSION,
  MODULE_ID,
  init,
  createPlugin,
  register,
  unregister,
  loadRemotePlugins,
  listPlugins,
  hasPlugin,
  getPlugin,
  enablePlugin,
  disablePlugin,
  executeHook,
  getAvailableHooks,
  exposeGlobalAPI,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  VERSION,
  createPlugin,
  plugin_api_default as default,
  disablePlugin,
  enablePlugin,
  executeHook,
  exposeGlobalAPI,
  getAvailableHooks,
  getMetrics,
  getPlugin,
  getPorts,
  hasPlugin,
  healthCheck,
  info,
  init,
  injectPorts,
  listPlugins,
  loadRemotePlugins,
  register,
  resetMetrics,
  unregister
};
