import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/plugin-system";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const _plugins = /* @__PURE__ */ new Map();
const _hooks = /* @__PURE__ */ new Map();
let _headerInstance = null;
let _initialized = false;
const AVAILABLE_HOOKS = ["beforeMount", "afterMount", "beforeUnmount", "afterUnmount", "beforeComponentLoad", "afterComponentLoad", "beforeRender", "afterRender", "onError", "onHealthCheck", "onStateChange", "onRouteChange", "onRefresh", "onResize"];
let _metrics = { pluginsRegistered: 0, pluginsActive: 0, hooksExecuted: 0, hookErrors: 0, lastHookAt: null };
function init(headerInstance) {
  _initPorts();
  _headerInstance = headerInstance;
  AVAILABLE_HOOKS.forEach((hookName) => {
    _hooks.set(hookName, []);
  });
  _initialized = true;
  _log("info", "PluginSystem inicializado com", AVAILABLE_HOOKS.length, "hooks dispon\xEDveis");
}
function _validatePlugin(plugin) {
  const errors = [];
  if (!plugin) {
    errors.push("Plugin \xE9 null ou undefined");
    return { valid: false, errors };
  }
  if (!plugin.id || typeof plugin.id !== "string") {
    errors.push("Plugin deve ter um id (string)");
  }
  if (!plugin.version || typeof plugin.version !== "string") {
    errors.push("Plugin deve ter uma version (string)");
  }
  if (typeof plugin.init !== "function") {
    errors.push("Plugin deve ter um m\xE9todo init()");
  }
  if (typeof plugin.destroy !== "function") {
    errors.push("Plugin deve ter um m\xE9todo destroy()");
  }
  if (plugin.hooks) {
    Object.keys(plugin.hooks).forEach((hookName) => {
      if (AVAILABLE_HOOKS.indexOf(hookName) === -1) {
        errors.push(`Hook desconhecido: ${hookName}`);
      }
      if (typeof plugin.hooks[hookName] !== "function") {
        errors.push(`Hook ${hookName} deve ser uma fun\xE7\xE3o`);
      }
    });
  }
  return { valid: errors.length === 0, errors };
}
function registerPlugin(plugin) {
  if (!_initialized) {
    _log("error", "PluginSystem n\xE3o inicializado");
    return { success: false, error: "PluginSystem n\xE3o inicializado" };
  }
  const validation = _validatePlugin(plugin);
  if (!validation.valid) {
    _log("error", "Plugin inv\xE1lido:", validation.errors.join(", "));
    return { success: false, error: validation.errors.join(", ") };
  }
  if (_plugins.has(plugin.id)) {
    _log("warn", "Plugin j\xE1 registrado:", plugin.id);
    return { success: false, error: `Plugin j\xE1 registrado: ${plugin.id}` };
  }
  const context = _createPluginContext(plugin.id);
  try {
    plugin.init(context);
    if (plugin.hooks) {
      Object.keys(plugin.hooks).forEach((hookName) => {
        _registerHook(hookName, plugin.id, plugin.hooks[hookName]);
      });
    }
    _plugins.set(plugin.id, { plugin, context, active: true, registeredAt: Date.now(), hooks: plugin.hooks ? Object.keys(plugin.hooks) : [] });
    _metrics.pluginsRegistered++;
    _metrics.pluginsActive++;
    _log("info", "Plugin registrado:", plugin.id, `v${plugin.version}`);
    _emitPluginEvent("registered", { pluginId: plugin.id, version: plugin.version });
    return { success: true, pluginId: plugin.id };
  } catch (error) {
    _log("error", "Erro ao inicializar plugin:", plugin.id, error.message);
    return { success: false, error: error.message };
  }
}
function unregisterPlugin(pluginId) {
  if (!_plugins.has(pluginId)) {
    _log("warn", "Plugin n\xE3o encontrado:", pluginId);
    return false;
  }
  const entry = _plugins.get(pluginId);
  try {
    entry.plugin.destroy(entry.context);
  } catch (error) {
    _log("error", "Erro ao destruir plugin:", pluginId, error.message);
  }
  entry.hooks.forEach((hookName) => {
    _unregisterHook(hookName, pluginId);
  });
  _plugins.delete(pluginId);
  _metrics.pluginsActive--;
  _log("info", "Plugin removido:", pluginId);
  _emitPluginEvent("unregistered", { pluginId });
  return true;
}
function _createPluginContext(pluginId) {
  return {
    pluginId,
    getHeader() {
      return _headerInstance;
    },
    log(level, message) {
      _log(level, `[Plugin:${pluginId}]`, message);
    },
    emit(eventName, data) {
      const eventBus = _getPort("eventBus");
      if (eventBus && eventBus.emit) {
        eventBus.emit(`header:plugin:${pluginId}:${eventName}`, data);
      }
    },
    on(eventName, callback) {
      const eventBus = _getPort("eventBus");
      if (eventBus && eventBus.on) {
        return eventBus.on(eventName, callback);
      }
      return () => {
      };
    },
    storage: {
      get(key) {
        try {
          const data = localStorage.getItem(`header:plugin:${pluginId}:${key}`);
          return data ? JSON.parse(data) : null;
        } catch (e) {
          return null;
        }
      },
      set(key, value) {
        try {
          localStorage.setItem(`header:plugin:${pluginId}:${key}`, JSON.stringify(value));
          return true;
        } catch (e) {
          return false;
        }
      },
      remove(key) {
        localStorage.removeItem(`header:plugin:${pluginId}:${key}`);
      }
    },
    dom: {
      // @ts-expect-error TS migration - TS2339
      querySelector(selector) {
        const container = _headerInstance && _headerInstance.elements && _headerInstance.elements.container;
        return container ? container.querySelector(selector) : null;
      },
      // @ts-expect-error TS migration - TS2339
      querySelectorAll(selector) {
        const container = _headerInstance && _headerInstance.elements && _headerInstance.elements.container;
        return container ? container.querySelectorAll(selector) : [];
      },
      // @ts-expect-error TS migration - TS2322, TS2345
      createElement(tag, attributes) {
        const el = document.createElement(tag);
        if (attributes) {
          Object.keys(attributes).forEach((key) => {
            if (key === "className") {
              el.className = attributes[key];
            } else if (key === "innerHTML") {
              el.innerHTML = attributes[key];
            } else {
              el.setAttribute(key, attributes[key]);
            }
          });
        }
        el.setAttribute("data-plugin", pluginId);
        return el;
      }
    },
    getPlugin(otherId) {
      const entry = _plugins.get(otherId);
      if (entry && entry.plugin.api) {
        return entry.plugin.api;
      }
      return null;
    }
  };
}
function _registerHook(hookName, pluginId, callback) {
  const hookList = _hooks.get(hookName);
  if (hookList) {
    hookList.push({ pluginId, callback });
  }
}
function _unregisterHook(hookName, pluginId) {
  const hookList = _hooks.get(hookName);
  if (hookList) {
    const filtered = hookList.filter((h) => h.pluginId !== pluginId);
    _hooks.set(hookName, filtered);
  }
}
function executeHook(hookName, data) {
  const hookList = _hooks.get(hookName);
  if (!hookList || hookList.length === 0) {
    return Promise.resolve(data);
  }
  _metrics.hooksExecuted++;
  _metrics.lastHookAt = Date.now();
  let result = data;
  const promises = [];
  hookList.forEach((hook) => {
    const entry = _plugins.get(hook.pluginId);
    if (!entry || !entry.active) return;
    try {
      const hookResult = hook.callback(result, entry.context);
      if (hookResult && typeof hookResult.then === "function") {
        promises.push(hookResult.catch((error) => {
          _metrics.hookErrors++;
          _log("error", "Hook error:", hookName, "plugin:", hook.pluginId, error.message);
          return result;
        }));
      } else if (hookResult !== void 0) {
        result = hookResult;
      }
    } catch (error) {
      _metrics.hookErrors++;
      _log("error", "Hook error:", hookName, "plugin:", hook.pluginId, error.message);
    }
  });
  if (promises.length > 0) {
    return Promise.all(promises).then(() => result);
  }
  return Promise.resolve(result);
}
function hasHookListeners(hookName) {
  const hookList = _hooks.get(hookName);
  return hookList && hookList.length > 0;
}
function getPlugin(pluginId) {
  const entry = _plugins.get(pluginId);
  return entry ? entry.plugin : null;
}
function hasPlugin(pluginId) {
  return _plugins.has(pluginId);
}
function getAllPlugins() {
  const result = [];
  _plugins.forEach((entry, id) => {
    result.push({ id, version: entry.plugin.version, name: entry.plugin.name || id, active: entry.active, hooks: entry.hooks, registeredAt: entry.registeredAt });
  });
  return result;
}
function enablePlugin(pluginId) {
  const entry = _plugins.get(pluginId);
  if (entry && !entry.active) {
    entry.active = true;
    _metrics.pluginsActive++;
    _log("info", "Plugin habilitado:", pluginId);
    return true;
  }
  return false;
}
function disablePlugin(pluginId) {
  const entry = _plugins.get(pluginId);
  if (entry && entry.active) {
    entry.active = false;
    _metrics.pluginsActive--;
    _log("info", "Plugin desabilitado:", pluginId);
    return true;
  }
  return false;
}
function _emitPluginEvent(type, data) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(`header:plugin-system:${type}`, Object.assign({ timestamp: Date.now() }, data));
  }
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { pluginsRegistered: _plugins.size, pluginsActive: 0, hooksExecuted: 0, hookErrors: 0, lastHookAt: null };
  _plugins.forEach((entry) => {
    if (entry.active) _metrics.pluginsActive++;
  });
}
function healthCheck() {
  _initPorts();
  const hookErrorRate = _metrics.hooksExecuted > 0 ? _metrics.hookErrors / _metrics.hooksExecuted : 0;
  const checks = { initialized: _initialized, hasHeaderInstance: !!_headerInstance || !_initialized, lowHookErrorRate: hookErrorRate < 0.1 || _metrics.hooksExecuted === 0, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, pluginsCount: _plugins.size, activePlugins: _metrics.pluginsActive, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, availableHooks: AVAILABLE_HOOKS, plugins: getAllPlugins(), metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var plugin_system_default = { VERSION, MODULE_ID, init, registerPlugin, unregisterPlugin, getPlugin, hasPlugin, getAllPlugins, enablePlugin, disablePlugin, executeHook, hasHookListeners, healthCheck, info, AVAILABLE_HOOKS };
export {
  AVAILABLE_HOOKS,
  MODULE_ID,
  VERSION,
  plugin_system_default as default,
  disablePlugin,
  enablePlugin,
  executeHook,
  getAllPlugins,
  getMetrics,
  getPlugin,
  getPorts,
  hasHookListeners,
  hasPlugin,
  healthCheck,
  info,
  init,
  injectPorts,
  registerPlugin,
  resetMetrics,
  unregisterPlugin
};
