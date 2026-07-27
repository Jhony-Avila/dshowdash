
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:plugin-system
// PURPOSE: Plugin System - Sistema de plugins extensível
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//   TYPES from ../utils/validator.js
//   PLUGIN_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PLUGIN_STATES — exported value
//   PLUGIN_TYPES — exported value
//   PLUGIN_HOOKS — exported value
//   createPluginSystem() — exported function
//   getPluginSystem() — exported function
//   resetPluginSystem() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   PLUGIN_EVENT_NAMES.DISABLED
//   PLUGIN_EVENT_NAMES.INITIALIZED
//   PLUGIN_EVENT_NAMES.REGISTERED
//   PLUGIN_EVENT_NAMES.UNREGISTERED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';
import { TYPES } from '../utils/validator.js';
import { PLUGIN_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '1.1.0-EVENT-CONSTANTS';
export const MODULE_ID = 'container-main:plugin-system';

export const PLUGIN_STATES = Object.freeze({
  REGISTERED: 'registered',
  INITIALIZING: 'initializing',
  ACTIVE: 'active',
  PAUSED: 'paused',
  ERROR: 'error',
  DISABLED: 'disabled',
  DESTROYED: 'destroyed'
});

export const PLUGIN_TYPES = Object.freeze({
  CORE: 'core',
  UI: 'ui',
  DATA: 'data',
  INTEGRATION: 'integration',
  UTILITY: 'utility'
});

export const PLUGIN_HOOKS = Object.freeze({
  BEFORE_BOOT: 'beforeBoot',
  AFTER_BOOT: 'afterBoot',
  BEFORE_INIT: 'beforeInit',
  AFTER_INIT: 'afterInit',
  BEFORE_DESTROY: 'beforeDestroy',
  AFTER_DESTROY: 'afterDestroy',
  ON_ERROR: 'onError',
  ON_STATE_CHANGE: 'onStateChange',
  ON_SLOT_ACTIVATE: 'onSlotActivate',
  ON_PANEL_LOAD: 'onPanelLoad'
});

const PLUGIN_SCHEMA = {
  id: { type: TYPES.STRING, required: true, minLength: 1 },
  name: { type: TYPES.STRING, required: true },
  version: { type: TYPES.STRING, required: true },
  type: { type: TYPES.STRING, enum: Object.values(PLUGIN_TYPES), default: PLUGIN_TYPES.UTILITY },
  description: { type: TYPES.STRING, default: '' },
  author: { type: TYPES.STRING, default: '' },
  dependencies: { type: TYPES.ARRAY, default: [] as unknown[] },
  init: { type: TYPES.FUNCTION, required: false },
  destroy: { type: TYPES.FUNCTION, required: false },
  hooks: { type: TYPES.OBJECT, default: {} }
};

export function createPluginSystem(options: Record<string, any> = {}) {
  const { eventBus = null, maxPlugins = 50, debug = false } = options;

  const _logger = createLogger(MODULE_ID);
  let _eventBus = eventBus;
  let _plugins = new Map();
  let _hooks = new Map();
  let _context: unknown = null;

  Object.values(PLUGIN_HOOKS).forEach(hook => _hooks.set(hook, []));

  function _validatePlugin(plugin: Record<string, unknown>) {
    const errors = [];
    if (!plugin.id) errors.push('Missing plugin id');
    if (!plugin.name) errors.push('Missing plugin name');
    if (!plugin.version) errors.push('Missing plugin version');
    if (_plugins.has(plugin.id)) errors.push(`Plugin already registered: ${plugin.id}`);
    if (_plugins.size >= maxPlugins) errors.push('Max plugins limit reached');
    return { valid: errors.length === 0, errors };
  }

  function _checkDependencies(plugin: Record<string, unknown>) {
    const missing = [];
    if (plugin.dependencies && Array.isArray(plugin.dependencies)) {
      for (const dep of plugin.dependencies) {
        if (!_plugins.has(dep) || _plugins.get(dep).state !== PLUGIN_STATES.ACTIVE) {
          missing.push(dep);
        }
      }
    }
    return { satisfied: missing.length === 0, missing };
  }

  function _registerHooks(plugin: Record<string, unknown>) {
    if (!plugin.hooks) return;
    for (const [hookName, handler] of Object.entries(plugin.hooks)) {
      if (_hooks.has(hookName) && typeof handler === 'function') {
        _hooks.get(hookName).push({ pluginId: plugin.id, handler });
      }
    }
  }

  function _unregisterHooks(pluginId: string) {
    for (const [hookName, handlers] of _hooks) {
      _hooks.set(hookName, handlers.filter((h: { pluginId: string }) => h.pluginId !== pluginId));
    }
  }

  async function _executeHook(hookName: string, data = {}) {
    const handlers = _hooks.get(hookName) || [];
    const results = [];
    for (const { pluginId, handler } of handlers) {
      try {
        const result = await handler({ ...data, pluginId, context: _context });
        results.push({ pluginId, success: true, result });
      } catch (error: any) {
        _logger.error(`Hook ${hookName} failed for plugin ${pluginId}:`, error);
        results.push({ pluginId, success: false, error: error.message });
      }
    }
    return results;
  }

  const system = {
    setContext(ctx: Record<string, unknown>) { _context = ctx; },
    injectEventBus(bus: unknown) { _eventBus = bus; },

    register(plugin: Record<string, unknown>) {
      const validation = _validatePlugin(plugin);
      if (!validation.valid) {
        _logger.error('Plugin validation failed:', validation.errors);
        return { success: false, errors: validation.errors };
      }

      const pluginData = {
        ...plugin,
        state: PLUGIN_STATES.REGISTERED,
        registeredAt: Date.now(),
        error: null as Record<string, unknown> | null
      };

      _plugins.set(plugin.id, pluginData);
      _registerHooks(plugin);
      
      _logger.info(`Plugin registered: ${plugin.id} v${plugin.version}`, {});
      _eventBus?.emit(PLUGIN_EVENT_NAMES.REGISTERED, { pluginId: plugin.id });
      
      return { success: true, pluginId: plugin.id };
    },

    async init(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return { success: false, error: 'Plugin not found' };
      if (plugin.state === PLUGIN_STATES.ACTIVE) return { success: true, already: true };

      const deps = _checkDependencies(plugin);
      if (!deps.satisfied) {
        return { success: false, error: `Missing dependencies: ${deps.missing.join(', ')}` };
      }

      plugin.state = PLUGIN_STATES.INITIALIZING;

      try {
        if (typeof plugin.init === 'function') {
          await plugin.init({ context: _context, eventBus: _eventBus, logger: _logger });
        }
        
        plugin.state = PLUGIN_STATES.ACTIVE;
        plugin.activatedAt = Date.now();
        
        _logger.info(`Plugin initialized: ${pluginId}`, {});
        _eventBus?.emit(PLUGIN_EVENT_NAMES.INITIALIZED, { pluginId });
        
        return { success: true };
      } catch (error: any) {
        plugin.state = PLUGIN_STATES.ERROR;
        plugin.error = error.message;
        _logger.error(`Plugin init failed: ${pluginId}`, error);
        return { success: false, error: error.message };
      }
    },

    async initAll() {
      const results = [];
      const sorted = Array.from(_plugins.keys()).sort((a, b) => {
        const pA = _plugins.get(a);
        const pB = _plugins.get(b);
        if (pA.dependencies?.includes(b)) return 1;
        if (pB.dependencies?.includes(a)) return -1;
        return 0;
      });

      for (const pluginId of sorted) {
        const plugin = _plugins.get(pluginId);
        if (plugin.state === PLUGIN_STATES.REGISTERED) {
          results.push({ pluginId, ...(await this.init(pluginId)) });
        }
      }
      return results;
    },

    async disable(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return { success: false, error: 'Plugin not found' };

      try {
        if (typeof plugin.destroy === 'function') {
          await plugin.destroy({ context: _context });
        }
        
        plugin.state = PLUGIN_STATES.DISABLED;
        _logger.info(`Plugin disabled: ${pluginId}`, {});
        _eventBus?.emit(PLUGIN_EVENT_NAMES.DISABLED, { pluginId });
        
        return { success: true };
      } catch (error: any) {
        _logger.error(`Plugin disable failed: ${pluginId}`, error);
        return { success: false, error: error.message };
      }
    },

    async unregister(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return { success: false, error: 'Plugin not found' };

      const dependents = Array.from(_plugins.values()).filter(
        p => p.dependencies?.includes(pluginId) && p.state === PLUGIN_STATES.ACTIVE
      );
      
      if (dependents.length > 0) {
        return { success: false, error: `Cannot unregister: ${dependents.map(p => p.id).join(', ')} depend on it` };
      }

      await this.disable(pluginId);
      _unregisterHooks(pluginId);
      _plugins.delete(pluginId);
      
      _logger.info(`Plugin unregistered: ${pluginId}`, {});
      _eventBus?.emit(PLUGIN_EVENT_NAMES.UNREGISTERED, { pluginId });
      
      return { success: true };
    },

    async executeHook(hookName: string, data = {}) { return _executeHook(hookName, data); },

    get(pluginId: string) {
      const plugin = _plugins.get(pluginId);
      if (!plugin) return null;
      return { ...plugin };
    },

    list() {
      return Array.from(_plugins.values()).map(p => ({
        id: p.id, name: p.name, version: p.version, type: p.type, state: p.state
      }));
    },

    listActive() { return this.list().filter((p: { state: string }) => p.state === PLUGIN_STATES.ACTIVE); },
    has(pluginId: string) { return _plugins.has(pluginId); },
    isActive(pluginId: string) { return _plugins.get(pluginId)?.state === PLUGIN_STATES.ACTIVE; },
    getHookHandlers(hookName: string) { return (_hooks.get(hookName) || []).map((h: { pluginId: string }) => h.pluginId); },

    healthCheck() {
      const total = _plugins.size;
      const active = Array.from(_plugins.values()).filter(p => p.state === PLUGIN_STATES.ACTIVE).length;
      const errors = Array.from(_plugins.values()).filter(p => p.state === PLUGIN_STATES.ERROR).length;
      let status = 'HEALTHY';
      if (errors > 0) status = 'DEGRADED';
      if (errors > total / 2) status = 'UNHEALTHY';
      return { status, version: VERSION, moduleId: MODULE_ID, total, active, errors, plugins: this.list() };
    },

    info() {
      return {
        moduleId: MODULE_ID, version: VERSION, maxPlugins,
        totalPlugins: _plugins.size, activePlugins: this.listActive().length,
        availableHooks: Object.keys(PLUGIN_HOOKS), pluginTypes: Object.keys(PLUGIN_TYPES)
      };
    },

    async destroy() {
      for (const pluginId of _plugins.keys()) { await this.disable(pluginId); }
      _plugins.clear();
      Object.values(PLUGIN_HOOKS).forEach(hook => _hooks.set(hook, []));
      _logger.info('Plugin system destroyed', {});
    }
  };

  return system;
}

interface PluginSystemInstance {
  destroy: () => Promise<void>;
  healthCheck: () => Record<string, unknown>;
  [key: string]: unknown;
}

let _instance: PluginSystemInstance | null = null;

export function getPluginSystem(options: Record<string, any> = {}) {
  if (!_instance) { _instance = createPluginSystem(options) as PluginSystemInstance; }
  return _instance;
}

export function resetPluginSystem() {
  if (_instance) { _instance.destroy(); _instance = null; }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, hooks: Object.keys(PLUGIN_HOOKS), types: Object.keys(PLUGIN_TYPES) };
}

export function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID, PLUGIN_STATES, PLUGIN_TYPES, PLUGIN_HOOKS,
  createPluginSystem, getPluginSystem, resetPluginSystem, info, healthCheck
};
