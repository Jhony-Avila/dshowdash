import { PLUGIN_EVENTS } from "/core/runtime/events/catalog/plugin.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { createLogger } from "../utils/logger.js";
const VERSION = "8.1.0-DI-STRICT";
const MODULE_ID = "container-plugin-system";
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
let _injectedStorage = null;
function injectStorage(storage) {
  _injectedStorage = storage;
}
function _getStorage() {
  if (_injectedStorage) return _injectedStorage;
  if (typeof localStorage !== "undefined") return localStorage;
  return { getItem: () => null, setItem: () => {
  }, removeItem: () => {
  } };
}
const logger = createLogger("PluginSystem");
const hasWindow = typeof window !== "undefined";
function _isDebugModeEnabled() {
  if (!hasWindow) return false;
  const config = _getPort("config");
  if (config?.app?.debug === true) return true;
  if (config?.debug === true) return true;
  if (typeof window !== "undefined" && window.location?.hostname === "localhost") return true;
  if (typeof window !== "undefined" && window.location?.hostname === "127.0.0.1") return true;
  return false;
}
function _trackPlugin(pluginId, action, status, details) {
  try {
    const eb = _getPort("eventBus");
    if (eb?.emit) {
      eb.emit(PLUGIN_EVENTS.AUDIT, { source: MODULE_ID, pluginId, action, status, timestamp: Date.now() });
    }
  } catch (e) {
  }
}
function _emitPluginEvent(eventType, payload) {
  try {
    const eb = _getPort("eventBus");
    if (eb?.emit) {
      eb.emit(eventType, { source: MODULE_ID, ...payload, timestamp: Date.now() });
    }
  } catch (e) {
  }
}
const PLUGIN_LIFECYCLE = { REGISTERED: "registered", INITIALIZING: "initializing", ACTIVE: "active", SUSPENDED: "suspended", ERROR: "error", DESTROYED: "destroyed" };
const PLUGIN_CONTRACT = Object.freeze({
  REQUIRED: ["id", "version", "init", "destroy", "healthCheck"],
  OPTIONAL: ["name", "capabilities", "requiredPermissions", "dependencies", "priority", "suspend", "resume"]
});
const TRUSTED_ORIGINS = ["dshowdash.com.br", "localhost", "127.0.0.1"];
function createPluginSystem(container, options = {}) {
  const requestedSandbox = options.sandboxed !== void 0 ? options.sandboxed : true;
  const effectiveSandbox = requestedSandbox === false && _isDebugModeEnabled() ? false : true;
  const { autoInit = true, maxPlugins = 50, onPluginLoad, onPluginError, onPluginUnload, allowDynamicPlugins = _isDebugModeEnabled(), strictContract = true, storage } = options;
  const sandboxed = effectiveSandbox;
  if (storage && !_injectedStorage) _injectedStorage = storage;
  let _initialized = false;
  let _plugins = /* @__PURE__ */ new Map();
  let _hooks = /* @__PURE__ */ new Map();
  let _api = null;
  function _createPluginAPI(pluginId) {
    const pluginLogger = createLogger(`Plugin:${pluginId}`);
    const storageInstance = _getStorage();
    return {
      container,
      containerId: container.id,
      pluginId,
      on: (hook, callback) => pluginSystem.addHook(hook, callback, pluginId),
      off: (hook, callback) => pluginSystem.removeHook(hook, callback),
      emit: (hook, data) => pluginSystem.triggerHook(hook, data),
      querySelector: (selector) => container.querySelector(selector),
      querySelectorAll: (selector) => container.querySelectorAll(selector),
      createElement: (tag) => document.createElement(tag),
      getState: () => container.getAttribute("data-state"),
      setState: (key, value) => container.setAttribute(`data-plugin-${pluginId}-${key}`, String(value)),
      getPluginState: (key) => container.getAttribute(`data-plugin-${pluginId}-${key}`),
      store: {
        get: (key) => {
          try {
            const data = storageInstance.getItem(`dsd-plugin-${pluginId}-${key}`);
            return data ? JSON.parse(data) : null;
          } catch {
            return null;
          }
        },
        set: (key, value) => {
          try {
            storageInstance.setItem(`dsd-plugin-${pluginId}-${key}`, JSON.stringify(value));
            return true;
          } catch {
            return false;
          }
        },
        remove: (key) => {
          try {
            storageInstance.removeItem(`dsd-plugin-${pluginId}-${key}`);
            return true;
          } catch {
            return false;
          }
        }
      },
      log: (...args) => pluginLogger.debug(String(args[0]), args[1]),
      warn: (...args) => pluginLogger.warn(String(args[0]), args[1]),
      error: (...args) => pluginLogger.error(String(args[0]), args[1]),
      debounce: (fn, delay) => {
        let timer;
        return (...args) => {
          clearTimeout(timer);
          timer = setTimeout(() => fn(...args), delay);
        };
      },
      throttle: (fn, delay) => {
        let lastCall = 0;
        return (...args) => {
          const now = Date.now();
          if (now - lastCall >= delay) {
            lastCall = now;
            fn(...args);
          }
        };
      }
    };
  }
  function _validatePlugin(plugin) {
    if (!plugin) throw new Error("Plugin is required");
    if (!plugin.id) throw new Error("Plugin must have an id");
    if (typeof plugin.id !== "string") throw new Error("Plugin id must be a string");
    if (!/^[a-zA-Z0-9_-]+$/.test(plugin.id)) throw new Error("Plugin id must contain only alphanumeric characters, underscores, and hyphens");
    if (!plugin.version) throw new Error("Plugin must have a version (P23 Contract)");
    if (typeof plugin.version !== "string") throw new Error("Plugin version must be a string");
    if (!plugin.init || typeof plugin.init !== "function") throw new Error("Plugin must have an init function");
    if (!plugin.destroy || typeof plugin.destroy !== "function") throw new Error("Plugin must have a destroy function (P23 Contract)");
    if (!plugin.healthCheck || typeof plugin.healthCheck !== "function") throw new Error("Plugin must have a healthCheck function (P23 Contract)");
    if (plugin.capabilities !== void 0 && !Array.isArray(plugin.capabilities)) throw new Error("Plugin capabilities must be an array");
    if (plugin.requiredPermissions !== void 0 && !Array.isArray(plugin.requiredPermissions)) throw new Error("Plugin requiredPermissions must be an array");
    if (plugin.dependencies !== void 0 && !Array.isArray(plugin.dependencies)) throw new Error("Plugin dependencies must be an array");
    if (plugin.priority !== void 0 && typeof plugin.priority !== "number") throw new Error("Plugin priority must be a number");
    if (_plugins.has(plugin.id)) throw new Error(`Plugin "${plugin.id}" is already registered`);
    if (_plugins.size >= maxPlugins) throw new Error(`Maximum number of plugins (${maxPlugins}) reached`);
    if (!allowDynamicPlugins && !plugin._trusted) throw new Error("Dynamic plugin registration is disabled in production");
    return true;
  }
  function _runInSandbox(fn, api) {
    if (!sandboxed && _isDebugModeEnabled()) {
      logger.warn("Running plugin without sandbox (debug mode only)");
      return fn(api);
    }
    try {
      const sandbox = { ...api, window: void 0, document: void 0, eval: void 0, Function: void 0, setTimeout: void 0, setInterval: void 0, fetch: void 0, XMLHttpRequest: void 0, WebSocket: void 0, importScripts: void 0 };
      return fn(sandbox);
    } catch (e) {
      _trackPlugin("sandbox", "error", "failed", e.message);
      throw new Error(`Sandbox error: ${e.message}`);
    }
  }
  const pluginSystem = {
    init() {
      if (_initialized) return this;
      _api = _createPluginAPI("system");
      _initialized = true;
      _trackPlugin("system", "init", "success", null);
      logger.info(`PluginSystem initialized (P23 Contract, sandbox=${sandboxed})`);
      return this;
    },
    register(plugin) {
      try {
        _validatePlugin(plugin);
        const pluginData = { ...plugin, status: PLUGIN_LIFECYCLE.REGISTERED, registeredAt: Date.now(), api: _createPluginAPI(String(plugin.id)), instance: null, error: null, sandboxed, capabilities: plugin.capabilities || [], requiredPermissions: plugin.requiredPermissions || [], dependencies: plugin.dependencies || [], priority: plugin.priority || 100 };
        _plugins.set(plugin.id, pluginData);
        _trackPlugin(String(plugin.id), "register", "success", null);
        _emitPluginEvent(PLUGIN_EVENTS.REGISTER, { pluginId: String(plugin.id), version: String(plugin.version), capabilities: pluginData.capabilities, sandboxed });
        if (autoInit) this.initPlugin(String(plugin.id));
        return true;
      } catch (e) {
        _trackPlugin(String(plugin?.id) || "unknown", "register", "error", e.message);
        onPluginError?.(plugin?.id || "unknown", e);
        return false;
      }
    },
    initPlugin(pluginId) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return false;
      if (plugin.status === PLUGIN_LIFECYCLE.ACTIVE) return true;
      try {
        plugin.status = PLUGIN_LIFECYCLE.INITIALIZING;
        _trackPlugin(pluginId, "init", "start", null);
        _emitPluginEvent(PLUGIN_EVENTS.INIT, { pluginId, status: "start" });
        const result = _runInSandbox(plugin.init, plugin.api);
        if (result instanceof Promise) {
          result.then((instance) => {
            plugin.instance = instance;
            plugin.status = PLUGIN_LIFECYCLE.ACTIVE;
            plugin.initializedAt = Date.now();
            _trackPlugin(pluginId, "init", "success", null);
            _emitPluginEvent(PLUGIN_EVENTS.INIT, { pluginId, status: "success" });
            onPluginLoad?.(pluginId, instance);
          }).catch((e) => {
            plugin.status = PLUGIN_LIFECYCLE.ERROR;
            plugin.error = e.message;
            _trackPlugin(pluginId, "init", "error", e.message);
            _emitPluginEvent(PLUGIN_EVENTS.ERROR, { pluginId, error: e.message });
            onPluginError?.(pluginId, e);
          });
        } else {
          plugin.instance = result;
          plugin.status = PLUGIN_LIFECYCLE.ACTIVE;
          plugin.initializedAt = Date.now();
          _trackPlugin(pluginId, "init", "success", null);
          _emitPluginEvent(PLUGIN_EVENTS.INIT, { pluginId, status: "success" });
          onPluginLoad?.(pluginId, result);
        }
        return true;
      } catch (e) {
        plugin.status = PLUGIN_LIFECYCLE.ERROR;
        plugin.error = e.message;
        _trackPlugin(pluginId, "init", "error", e.message);
        _emitPluginEvent(PLUGIN_EVENTS.ERROR, { pluginId, error: e.message });
        onPluginError?.(pluginId, e);
        return false;
      }
    },
    unregister(pluginId) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return false;
      try {
        if (plugin.destroy && typeof plugin.destroy === "function") plugin.destroy(plugin.api);
        _hooks.forEach((callbacks, hook) => {
          _hooks.set(hook, callbacks.filter((cb) => cb.pluginId !== pluginId));
        });
        Array.from(container.attributes).forEach((attr) => {
          if (attr.name.startsWith(`data-plugin-${pluginId}`)) container.removeAttribute(attr.name);
        });
        plugin.status = PLUGIN_LIFECYCLE.DESTROYED;
        _plugins.delete(pluginId);
        _trackPlugin(pluginId, "unregister", "success", null);
        _emitPluginEvent(PLUGIN_EVENTS.UNREGISTER, { pluginId });
        onPluginUnload?.(pluginId);
        return true;
      } catch (e) {
        _trackPlugin(pluginId, "unregister", "error", e.message);
        onPluginError?.(pluginId, e);
        return false;
      }
    },
    suspend(pluginId) {
      const plugin = _plugins.get(pluginId);
      if (!plugin || plugin.status !== PLUGIN_LIFECYCLE.ACTIVE) return false;
      if (plugin.suspend && typeof plugin.suspend === "function") plugin.suspend(plugin.api);
      plugin.status = PLUGIN_LIFECYCLE.SUSPENDED;
      _trackPlugin(pluginId, "suspend", "success", null);
      _emitPluginEvent(PLUGIN_EVENTS.SUSPEND, { pluginId });
      return true;
    },
    resume(pluginId) {
      const plugin = _plugins.get(pluginId);
      if (!plugin || plugin.status !== PLUGIN_LIFECYCLE.SUSPENDED) return false;
      if (plugin.resume && typeof plugin.resume === "function") plugin.resume(plugin.api);
      plugin.status = PLUGIN_LIFECYCLE.ACTIVE;
      _trackPlugin(pluginId, "resume", "success", null);
      _emitPluginEvent(PLUGIN_EVENTS.RESUME, { pluginId });
      return true;
    },
    addHook(hookName, callback, pluginId = "system") {
      if (!_hooks.has(hookName)) _hooks.set(hookName, []);
      _hooks.get(hookName).push({ callback, pluginId });
      return this;
    },
    removeHook(hookName, callback) {
      if (!_hooks.has(hookName)) return this;
      const callbacks = _hooks.get(hookName);
      _hooks.set(hookName, callbacks.filter((cb) => cb.callback !== callback));
      return this;
    },
    triggerHook(hookName, data = {}) {
      if (!_hooks.has(hookName)) return [];
      const results = [];
      const callbacks = _hooks.get(hookName);
      for (const { callback, pluginId } of callbacks) {
        try {
          const result = callback(data);
          results.push({ pluginId, result });
          _emitPluginEvent(PLUGIN_EVENTS.HOOK_TRIGGERED, { pluginId, hook: hookName });
        } catch (e) {
          results.push({ pluginId, error: e.message });
          _trackPlugin(pluginId, `hook:${hookName}`, "error", e.message);
          onPluginError?.(pluginId, e);
        }
      }
      return results;
    },
    getPlugin(pluginId) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return null;
      return { id: plugin.id, name: plugin.name, version: plugin.version, status: plugin.status, error: plugin.error, instance: plugin.instance, sandboxed: plugin.sandboxed, capabilities: plugin.capabilities, requiredPermissions: plugin.requiredPermissions };
    },
    getPlugins() {
      return Array.from(_plugins.values()).map((p) => ({ id: p.id, name: p.name, version: p.version, status: p.status, sandboxed: p.sandboxed, capabilities: p.capabilities }));
    },
    getActivePlugins() {
      return this.getPlugins().filter((p) => p.status === PLUGIN_LIFECYCLE.ACTIVE);
    },
    hasPlugin(pluginId) {
      return _plugins.has(pluginId);
    },
    isActive(pluginId) {
      const plugin = _plugins.get(pluginId);
      return plugin?.status === PLUGIN_LIFECYCLE.ACTIVE;
    },
    isInitialized() {
      return _initialized;
    },
    isSandboxed() {
      return sandboxed;
    },
    getPluginHealth(pluginId) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return null;
      if (plugin.healthCheck && typeof plugin.healthCheck === "function") {
        try {
          return plugin.healthCheck();
        } catch (e) {
          return { status: "ERROR", error: e.message, pluginId };
        }
      }
      return { status: "NO_HEALTHCHECK", pluginId };
    },
    getAllPluginsHealth() {
      const health = {};
      for (const [id] of _plugins) {
        health[id] = this.getPluginHealth(id);
      }
      return health;
    },
    destroy() {
      Array.from(_plugins.keys()).forEach((id) => this.unregister(id));
      _hooks.clear();
      _initialized = false;
      _trackPlugin("system", "destroy", "success", null);
    },
    healthCheck() {
      const plugins = this.getPlugins();
      const pluginsHealth = this.getAllPluginsHealth();
      const healthyPlugins = Object.values(pluginsHealth).filter((h) => h?.status === "HEALTHY" || h?.status === "ACTIVE").length;
      return {
        status: _initialized ? "HEALTHY" : "NOT_INITIALIZED",
        version: VERSION,
        moduleId: MODULE_ID,
        sandboxed,
        debugMode: _isDebugModeEnabled(),
        totalPlugins: plugins.length,
        activePlugins: plugins.filter((p) => p.status === PLUGIN_LIFECYCLE.ACTIVE).length,
        healthyPlugins,
        errorPlugins: plugins.filter((p) => p.status === PLUGIN_LIFECYCLE.ERROR).length,
        hooks: _hooks.size,
        portsInitialized: Ports.isInitialized(),
        hasInjectedStorage: !!_injectedStorage,
        diStrict: true,
        eventBusOnly: true,
        p23Contract: true,
        pluginsHealth
      };
    },
    getManifest() {
      return {
        registryId: MODULE_ID,
        version: VERSION,
        loadedAt: _initialized ? Date.now() : null,
        itemCount: _plugins.size,
        items: Array.from(_plugins.keys()),
        plugins: this.getPlugins(),
        contract: PLUGIN_CONTRACT,
        timestamp: Date.now()
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: _initialized,
        sandboxed,
        totalPlugins: _plugins.size,
        activePlugins: this.getActivePlugins().length,
        hooks: _hooks.size,
        contract: PLUGIN_CONTRACT,
        hasInjectedStorage: !!_injectedStorage,
        diStrict: true,
        p23Contract: true,
        portsInitialized: Ports.isInitialized()
      };
    }
  };
  return pluginSystem;
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    hasInjectedStorage: !!_injectedStorage,
    diStrict: true,
    eventBusOnly: true,
    p23Contract: true
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    hasInjectedStorage: !!_injectedStorage,
    diStrict: true,
    eventBusOnly: true,
    p23Contract: true,
    contract: PLUGIN_CONTRACT
  };
}
var plugin_system_default = { createPluginSystem, healthCheck, info, injectPorts, injectStorage, getPorts, VERSION, MODULE_ID, PLUGIN_LIFECYCLE, PLUGIN_CONTRACT };
export {
  MODULE_ID,
  PLUGIN_CONTRACT,
  PLUGIN_LIFECYCLE,
  VERSION,
  createPluginSystem,
  plugin_system_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  injectStorage
};
