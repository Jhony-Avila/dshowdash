
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-plugin-system
// PURPOSE: Container Plugin System
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PLUGIN_EVENTS from /core/runtime/events/catalog/plugin.events.js
//   createCorePorts from /core/runtime/ports-profiles.js
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   injectStorage() — exported function
//   PLUGIN_LIFECYCLE — exported value
//   PLUGIN_CONTRACT — exported value
//   createPluginSystem() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PLUGIN_EVENTS.AUDIT
//   eventType
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { PLUGIN_EVENTS } from '/core/runtime/events/catalog/plugin.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { createLogger } from '../utils/logger.js';

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-plugin-system';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// DI-STRICT: Module-level injected storage
let _injectedStorage: { getItem: (key: string) => string | null; setItem: (key: string, value: string) => void; removeItem: (key: string) => void } | null = null;

export function injectStorage(storage: typeof _injectedStorage) {
  _injectedStorage = storage;
}

function _getStorage() {
  if (_injectedStorage) return _injectedStorage;
  if (typeof localStorage !== 'undefined') return localStorage;
  return { getItem: (): null => null, setItem: (): void => {}, removeItem: (): void => {} };
}

const logger = createLogger('PluginSystem');
const hasWindow = typeof window !== 'undefined';

function _isDebugModeEnabled() {
  if (!hasWindow) return false;
  const config = _getPort('config');
  if (config?.app?.debug === true) return true;
  if (config?.debug === true) return true;
  if (typeof window !== 'undefined' && window.location?.hostname === 'localhost') return true;
  if (typeof window !== 'undefined' && window.location?.hostname === '127.0.0.1') return true;
  return false;
}

function _trackPlugin(pluginId: string, action: string, status: string, details: Record<string, unknown> | string | null) {
  try {
    const eb = _getPort('eventBus');
    if (eb?.emit) {
      eb.emit(PLUGIN_EVENTS.AUDIT, { source: MODULE_ID, pluginId, action, status, timestamp: Date.now() });
    }
  } catch (e) {}
}

// P18EC: EventBus only (CustomEvents removed - zero listeners in codebase)
function _emitPluginEvent(eventType: string, payload: Record<string, unknown>) {
  try {
    const eb = _getPort('eventBus');
    if (eb?.emit) {
      eb.emit(eventType, { source: MODULE_ID, ...payload, timestamp: Date.now() });
    }
  } catch (e) {}
}

export const PLUGIN_LIFECYCLE = { REGISTERED: 'registered', INITIALIZING: 'initializing', ACTIVE: 'active', SUSPENDED: 'suspended', ERROR: 'error', DESTROYED: 'destroyed' };

// P23: Plugin Contract - Required fields
export const PLUGIN_CONTRACT = Object.freeze({
  REQUIRED: ['id', 'version', 'init', 'destroy', 'healthCheck'],
  OPTIONAL: ['name', 'capabilities', 'requiredPermissions', 'dependencies', 'priority', 'suspend', 'resume']
});

const TRUSTED_ORIGINS = ['dshowdash.com.br', 'localhost', '127.0.0.1'];

export function createPluginSystem(container: HTMLElement, options: Record<string, any> = {}) {
  const requestedSandbox = options.sandboxed !== undefined ? options.sandboxed : true;
  const effectiveSandbox = requestedSandbox === false && _isDebugModeEnabled() ? false : true;
  const { autoInit = true, maxPlugins = 50, onPluginLoad, onPluginError, onPluginUnload, allowDynamicPlugins = _isDebugModeEnabled(), strictContract = true, storage } = options;
  const sandboxed = effectiveSandbox;

  // DI: Accept storage via options
  if (storage && !_injectedStorage) _injectedStorage = storage;

  let _initialized = false;
  let _plugins: Map<string, any> = new Map();
  let _hooks = new Map();
  let _api = null;

  function _createPluginAPI(pluginId: string) {
    const pluginLogger = createLogger(`Plugin:${pluginId}`);
    const storageInstance = _getStorage();
    return {
      container,
      containerId: container.id,
      pluginId,
      on: (hook: string, callback: (...args: unknown[]) => void) => pluginSystem.addHook(hook, callback, pluginId),
      off: (hook: string, callback: (...args: unknown[]) => void) => pluginSystem.removeHook(hook, callback),
      emit: (hook: string, data: Record<string, unknown>) => pluginSystem.triggerHook(hook, data),
      querySelector: (selector: string) => container.querySelector(selector),
      querySelectorAll: (selector: string) => container.querySelectorAll(selector),
      createElement: (tag: string) => document.createElement(tag),
      getState: () => container.getAttribute('data-state'),
      setState: (key: string, value: unknown) => container.setAttribute(`data-plugin-${pluginId}-${key}`, String(value)),
      getPluginState: (key: string) => container.getAttribute(`data-plugin-${pluginId}-${key}`),
      store: {
        get: (key: string) => { try { const data = storageInstance.getItem(`dsd-plugin-${pluginId}-${key}`); return data ? JSON.parse(data) : null; } catch { return null; } },
        set: (key: string, value: unknown) => { try { storageInstance.setItem(`dsd-plugin-${pluginId}-${key}`, JSON.stringify(value)); return true; } catch { return false; } },
        remove: (key: string) => { try { storageInstance.removeItem(`dsd-plugin-${pluginId}-${key}`); return true; } catch { return false; } }
      },
      log: (...args: unknown[]) => pluginLogger.debug(String(args[0]), args[1] as Record<string, unknown>),
      warn: (...args: unknown[]) => pluginLogger.warn(String(args[0]), args[1] as Record<string, unknown>),
      error: (...args: unknown[]) => pluginLogger.error(String(args[0]), args[1] as Record<string, unknown>),
      debounce: (fn: (...args: unknown[]) => void, delay: number) => { let timer: ReturnType<typeof setTimeout> | undefined; return (...args: unknown[]) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), delay); }; },
      throttle: (fn: (...args: unknown[]) => void, delay: number) => { let lastCall = 0; return (...args: unknown[]) => { const now = Date.now(); if (now - lastCall >= delay) { lastCall = now; fn(...args); } }; }
    };
  }

  // P23: Enhanced plugin validation with full contract
  function _validatePlugin(plugin: Record<string, unknown>) {
    if (!plugin) throw new Error('Plugin is required');
    if (!plugin.id) throw new Error('Plugin must have an id');
    if (typeof plugin.id !== 'string') throw new Error('Plugin id must be a string');
    if (!/^[a-zA-Z0-9_-]+$/.test(plugin.id)) throw new Error('Plugin id must contain only alphanumeric characters, underscores, and hyphens');
    if (!plugin.version) throw new Error('Plugin must have a version (P23 Contract)');
    if (typeof plugin.version !== 'string') throw new Error('Plugin version must be a string');
    if (!plugin.init || typeof plugin.init !== 'function') throw new Error('Plugin must have an init function');
    if (!plugin.destroy || typeof plugin.destroy !== 'function') throw new Error('Plugin must have a destroy function (P23 Contract)');
    if (!plugin.healthCheck || typeof plugin.healthCheck !== 'function') throw new Error('Plugin must have a healthCheck function (P23 Contract)');
    if (plugin.capabilities !== undefined && !Array.isArray(plugin.capabilities)) throw new Error('Plugin capabilities must be an array');
    if (plugin.requiredPermissions !== undefined && !Array.isArray(plugin.requiredPermissions)) throw new Error('Plugin requiredPermissions must be an array');
    if (plugin.dependencies !== undefined && !Array.isArray(plugin.dependencies)) throw new Error('Plugin dependencies must be an array');
    if (plugin.priority !== undefined && typeof plugin.priority !== 'number') throw new Error('Plugin priority must be a number');
    if (_plugins.has(plugin.id)) throw new Error(`Plugin "${plugin.id}" is already registered`);
    if (_plugins.size >= maxPlugins) throw new Error(`Maximum number of plugins (${maxPlugins}) reached`);
    if (!allowDynamicPlugins && !plugin._trusted) throw new Error('Dynamic plugin registration is disabled in production');
    return true;
  }

  function _runInSandbox(fn: (api: Record<string, unknown>) => unknown, api: Record<string, unknown>) {
    if (!sandboxed && _isDebugModeEnabled()) {
      logger.warn('Running plugin without sandbox (debug mode only)');
      return fn(api);
    }
    try {
      const sandbox: Record<string, unknown> = { ...api, window: undefined, document: undefined, eval: undefined, Function: undefined, setTimeout: undefined, setInterval: undefined, fetch: undefined, XMLHttpRequest: undefined, WebSocket: undefined, importScripts: undefined };
      return fn(sandbox);
    } catch (e) {
      _trackPlugin('sandbox', 'error', 'failed', (e as Error).message);
      throw new Error(`Sandbox error: ${(e as Error).message}`);
    }
  }

  const pluginSystem = {
    init() {
      if (_initialized) return this;
      _api = _createPluginAPI('system');
      _initialized = true;
      _trackPlugin('system', 'init', 'success', null);
      logger.info(`PluginSystem initialized (P23 Contract, sandbox=${sandboxed})`);
      return this;
    },

    register(plugin: Record<string, unknown>) {
      try {
        _validatePlugin(plugin);
        const pluginData = { ...plugin, status: PLUGIN_LIFECYCLE.REGISTERED, registeredAt: Date.now(), api: _createPluginAPI(String(plugin.id)), instance: null as Record<string, unknown> | null, error: null as Record<string, unknown> | null, sandboxed, capabilities: plugin.capabilities || [], requiredPermissions: plugin.requiredPermissions || [], dependencies: plugin.dependencies || [], priority: plugin.priority || 100 };
        _plugins.set(plugin.id as string, pluginData);
        _trackPlugin(String(plugin.id), 'register', 'success', null);
        _emitPluginEvent(PLUGIN_EVENTS.REGISTER, { pluginId: String(plugin.id), version: String(plugin.version), capabilities: pluginData.capabilities, sandboxed });
        if (autoInit) this.initPlugin(String(plugin.id));
        return true;
      } catch (e) {
        _trackPlugin(String(plugin?.id) || 'unknown', 'register', 'error', (e as Error).message);
        onPluginError?.(plugin?.id as string || 'unknown', e);
        return false;
      }
    },

    initPlugin(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return false;
      if (plugin.status === PLUGIN_LIFECYCLE.ACTIVE) return true;
      try {
        plugin.status = PLUGIN_LIFECYCLE.INITIALIZING;
        _trackPlugin(pluginId, 'init', 'start', null);
        _emitPluginEvent(PLUGIN_EVENTS.INIT, { pluginId, status: 'start' });
        const result = _runInSandbox(plugin.init, plugin.api);
        if (result instanceof Promise) {
          result.then((instance) => {
            plugin.instance = instance;
            plugin.status = PLUGIN_LIFECYCLE.ACTIVE;
            plugin.initializedAt = Date.now();
            _trackPlugin(pluginId, 'init', 'success', null);
            _emitPluginEvent(PLUGIN_EVENTS.INIT, { pluginId, status: 'success' });
            onPluginLoad?.(pluginId, instance);
          }).catch((e) => {
            plugin.status = PLUGIN_LIFECYCLE.ERROR;
            plugin.error = (e as Error).message;
            _trackPlugin(pluginId, 'init', 'error', (e as Error).message);
            _emitPluginEvent(PLUGIN_EVENTS.ERROR, { pluginId, error: (e as Error).message });
            onPluginError?.(pluginId, e);
          });
        } else {
          plugin.instance = result;
          plugin.status = PLUGIN_LIFECYCLE.ACTIVE;
          plugin.initializedAt = Date.now();
          _trackPlugin(pluginId, 'init', 'success', null);
          _emitPluginEvent(PLUGIN_EVENTS.INIT, { pluginId, status: 'success' });
          onPluginLoad?.(pluginId, result);
        }
        return true;
      } catch (e) {
        plugin.status = PLUGIN_LIFECYCLE.ERROR;
        plugin.error = (e as Error).message;
        _trackPlugin(pluginId, 'init', 'error', (e as Error).message);
        _emitPluginEvent(PLUGIN_EVENTS.ERROR, { pluginId, error: (e as Error).message });
        onPluginError?.(pluginId, e);
        return false;
      }
    },

    unregister(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return false;
      try {
        if (plugin.destroy && typeof plugin.destroy === 'function') plugin.destroy(plugin.api);
        _hooks.forEach((callbacks, hook) => { _hooks.set(hook, callbacks.filter((cb: Record<string, unknown>) => cb.pluginId !== pluginId)); });
        Array.from(container.attributes).forEach((attr) => { if (attr.name.startsWith(`data-plugin-${pluginId}`)) container.removeAttribute(attr.name); });
        plugin.status = PLUGIN_LIFECYCLE.DESTROYED;
        _plugins.delete(pluginId);
        _trackPlugin(pluginId, 'unregister', 'success', null);
        _emitPluginEvent(PLUGIN_EVENTS.UNREGISTER, { pluginId });
        onPluginUnload?.(pluginId);
        return true;
      } catch (e) {
        _trackPlugin(pluginId, 'unregister', 'error', (e as Error).message);
        onPluginError?.(pluginId, e);
        return false;
      }
    },

    suspend(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin || plugin.status !== PLUGIN_LIFECYCLE.ACTIVE) return false;
      if (plugin.suspend && typeof plugin.suspend === 'function') plugin.suspend(plugin.api);
      plugin.status = PLUGIN_LIFECYCLE.SUSPENDED;
      _trackPlugin(pluginId, 'suspend', 'success', null);
      _emitPluginEvent(PLUGIN_EVENTS.SUSPEND, { pluginId });
      return true;
    },

    resume(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin || plugin.status !== PLUGIN_LIFECYCLE.SUSPENDED) return false;
      if (plugin.resume && typeof plugin.resume === 'function') plugin.resume(plugin.api);
      plugin.status = PLUGIN_LIFECYCLE.ACTIVE;
      _trackPlugin(pluginId, 'resume', 'success', null);
      _emitPluginEvent(PLUGIN_EVENTS.RESUME, { pluginId });
      return true;
    },

    addHook(hookName: string, callback: (...args: unknown[]) => void, pluginId = 'system') {
      if (!_hooks.has(hookName)) _hooks.set(hookName, []);
      _hooks.get(hookName).push({ callback, pluginId });
      return this;
    },

    removeHook(hookName: string, callback: (...args: unknown[]) => void) {
      if (!_hooks.has(hookName)) return this;
      const callbacks = _hooks.get(hookName);
      _hooks.set(hookName, callbacks.filter((cb: Record<string, unknown>) => cb.callback !== callback));
      return this;
    },

    triggerHook(hookName: string, data = {}) {
      if (!_hooks.has(hookName)) return [];
      const results = [];
      const callbacks = _hooks.get(hookName);
      for (const { callback, pluginId } of callbacks) {
        try {
          const result = callback(data);
          results.push({ pluginId, result });
          _emitPluginEvent(PLUGIN_EVENTS.HOOK_TRIGGERED, { pluginId, hook: hookName });
        } catch (e) {
          results.push({ pluginId, error: (e as Error).message });
          _trackPlugin(pluginId, `hook:${hookName}`, 'error', (e as Error).message);
          onPluginError?.(pluginId, e);
        }
      }
      return results;
    },

    getPlugin(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return null;
      return { id: plugin.id, name: plugin.name, version: plugin.version, status: plugin.status, error: plugin.error, instance: plugin.instance, sandboxed: plugin.sandboxed, capabilities: plugin.capabilities, requiredPermissions: plugin.requiredPermissions };
    },

    getPlugins() { return Array.from(_plugins.values()).map(p => ({ id: p.id, name: p.name, version: p.version, status: p.status, sandboxed: p.sandboxed, capabilities: p.capabilities })); },
    getActivePlugins() { return this.getPlugins().filter((p: Record<string, unknown>) => p.status === PLUGIN_LIFECYCLE.ACTIVE); },
    hasPlugin(pluginId: string) { return _plugins.has(pluginId); },
    isActive(pluginId: string) { const plugin = _plugins.get(pluginId); return plugin?.status === PLUGIN_LIFECYCLE.ACTIVE; },
    isInitialized() { return _initialized; },
    isSandboxed() { return sandboxed; },

    getPluginHealth(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return null;
      if (plugin.healthCheck && typeof plugin.healthCheck === 'function') {
        try { return plugin.healthCheck(); } catch (e) { return { status: 'ERROR', error: (e as Error).message, pluginId }; }
      }
      return { status: 'NO_HEALTHCHECK', pluginId };
    },

    getAllPluginsHealth() {
      const health = {};
      for (const [id] of _plugins) { (health as Record<string, unknown>)[id] = this.getPluginHealth(id); }
      return health;
    },

    destroy() {
      Array.from(_plugins.keys()).forEach(id => this.unregister(id));
      _hooks.clear();
      _initialized = false;
      _trackPlugin('system', 'destroy', 'success', null);
    },

    healthCheck() {
      const plugins = this.getPlugins();
      const pluginsHealth = this.getAllPluginsHealth();
      const healthyPlugins = Object.values(pluginsHealth).filter((h: unknown) => (h as Record<string, unknown>)?.status === 'HEALTHY' || (h as Record<string, unknown>)?.status === 'ACTIVE').length;
      return {
        status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
        version: VERSION,
        moduleId: MODULE_ID,
        sandboxed,
        debugMode: _isDebugModeEnabled(),
        totalPlugins: plugins.length,
        activePlugins: plugins.filter((p: Record<string, unknown>) => p.status === PLUGIN_LIFECYCLE.ACTIVE).length,
        healthyPlugins,
        errorPlugins: plugins.filter((p: Record<string, unknown>) => p.status === PLUGIN_LIFECYCLE.ERROR).length,
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

export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    hasInjectedStorage: !!_injectedStorage,
    diStrict: true,
    eventBusOnly: true,
    p23Contract: true
  };
}

export function info() {
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

export default { createPluginSystem, healthCheck, info, injectPorts, injectStorage, getPorts, VERSION, MODULE_ID, PLUGIN_LIFECYCLE, PLUGIN_CONTRACT };
