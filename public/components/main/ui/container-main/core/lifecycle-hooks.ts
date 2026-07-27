
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:lifecycle-hooks
// PURPOSE: Lifecycle Hooks - Sistema de hooks de ciclo de vida
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ../utils/logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   HOOKS — exported value
//   PRIORITIES — exported value
//   createLifecycleHooks() — exported function
//   getLifecycleHooks() — exported function
//   resetLifecycleHooks() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   `lifecycle:${hookName}`
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from '../utils/logger.js';

export const VERSION = '1.0.0-PHASE4';
export const MODULE_ID = 'container-main:lifecycle-hooks';

// Hooks disponíveis
export const HOOKS = Object.freeze({
  // Boot
  BEFORE_BOOT: 'beforeBoot',
  AFTER_BOOT: 'afterBoot',
  BEFORE_SHUTDOWN: 'beforeShutdown',
  AFTER_SHUTDOWN: 'afterShutdown',
  
  // Kernel
  BEFORE_KERNEL_INIT: 'beforeKernelInit',
  AFTER_KERNEL_INIT: 'afterKernelInit',
  BEFORE_KERNEL_DESTROY: 'beforeKernelDestroy',
  AFTER_KERNEL_DESTROY: 'afterKernelDestroy',
  
  // Component
  BEFORE_COMPONENT_INIT: 'beforeComponentInit',
  AFTER_COMPONENT_INIT: 'afterComponentInit',
  BEFORE_COMPONENT_DESTROY: 'beforeComponentDestroy',
  AFTER_COMPONENT_DESTROY: 'afterComponentDestroy',
  
  // Slot
  BEFORE_SLOT_ACTIVATE: 'beforeSlotActivate',
  AFTER_SLOT_ACTIVATE: 'afterSlotActivate',
  BEFORE_SLOT_DEACTIVATE: 'beforeSlotDeactivate',
  AFTER_SLOT_DEACTIVATE: 'afterSlotDeactivate',
  
  // Panel
  BEFORE_PANEL_LOAD: 'beforePanelLoad',
  AFTER_PANEL_LOAD: 'afterPanelLoad',
  BEFORE_PANEL_UNLOAD: 'beforePanelUnload',
  AFTER_PANEL_UNLOAD: 'afterPanelUnload',
  
  // State
  ON_STATE_CHANGE: 'onStateChange',
  ON_ERROR: 'onError',
  ON_RECOVERY: 'onRecovery'
});

// Prioridades de execução
export const PRIORITIES = Object.freeze({
  HIGHEST: 0,
  HIGH: 25,
  NORMAL: 50,
  LOW: 75,
  LOWEST: 100
});

// Cria o sistema de hooks
export function createLifecycleHooks(options: Record<string, any> = {}) {
  const { eventBus = null, debug = false, timeout = 5000 } = options;

  const _logger = createLogger(MODULE_ID) as any;
  let _eventBus = eventBus;
  let _hooks = new Map();
  let _executing = new Set();
  
  // Métricas
  let _metrics = {
    totalExecutions: 0,
    successful: 0,
    failed: 0,
    timedOut: 0,
    byHook: {}
  };

  // Inicializa mapa de hooks
  Object.values(HOOKS).forEach(hook => _hooks.set(hook, []));

  // Executa com timeout
  async function _executeWithTimeout(fn: (...args: unknown[]) => void, timeoutMs: number, context: Record<string, unknown>) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Hook timeout after ${timeoutMs}ms`));
      }, timeoutMs);

      Promise.resolve(fn(context))
        .then(result => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch(error => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  // Atualiza métricas
  function _updateMetrics(hookName: string, success: boolean, timedOut = false) {
    _metrics.totalExecutions++;
    if (success) _metrics.successful++;
    else _metrics.failed++;
    if (timedOut) _metrics.timedOut++;

    if (!(_metrics.byHook as Record<string, Record<string, number>>)[hookName]) {
      (_metrics.byHook as Record<string, Record<string, number>>)[hookName] = { executions: 0, successful: 0, failed: 0 };
    }
    (_metrics.byHook as Record<string, Record<string, number>>)[hookName].executions++;
    if (success) (_metrics.byHook as Record<string, Record<string, number>>)[hookName].successful++;
    else (_metrics.byHook as Record<string, Record<string, number>>)[hookName].failed++;
  }

  const hooks = {
    // Injeta EventBus
    injectEventBus(bus: unknown) {
      _eventBus = bus;
    },

    // Registra hook
    register(hookName: string, handler: Function, options: Record<string, any> = {}) {
      const { id = null, priority = PRIORITIES.NORMAL, once = false } = options;

      if (!_hooks.has(hookName)) {
        _logger.warn(`Unknown hook: ${hookName}`);
        return null;
      }

      if (typeof handler !== 'function') {
        _logger.error('Handler must be a function');
        return null;
      }

      const hookId = id || `hook-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const hookEntry = { id: hookId, handler, priority, once, registeredAt: Date.now() };

      const hookList = _hooks.get(hookName);
      hookList.push(hookEntry);
      hookList.sort((a: { priority: number }, b: { priority: number }) => a.priority - b.priority);

      if (debug) _logger.debug(`Registered hook: ${hookName} (${hookId})`);

      return hookId;
    },

    // Remove hook
    unregister(hookName: string, hookId: unknown) {
      if (!_hooks.has(hookName)) return false;

      const hookList = _hooks.get(hookName);
      const index = hookList.findIndex((h: { id: string }) => h.id === hookId);
      
      if (index > -1) {
        hookList.splice(index, 1);
        if (debug) _logger.debug(`Unregistered hook: ${hookName} (${hookId})`);
        return true;
      }

      return false;
    },

    // Remove todos os hooks de um tipo
    unregisterAll(hookName: string) {
      if (_hooks.has(hookName)) {
        _hooks.set(hookName, []);
        return true;
      }
      return false;
    },

    // Executa hooks
    async execute(hookName: string, context = {}) {
      if (!_hooks.has(hookName)) {
        _logger.warn(`Unknown hook: ${hookName}`);
        return { success: false, error: 'Unknown hook' };
      }

      if (_executing.has(hookName)) {
        _logger.warn(`Hook already executing: ${hookName}`);
        return { success: false, error: 'Already executing' };
      }

      _executing.add(hookName);
      const hookList = _hooks.get(hookName);
      const results = [];
      const toRemove = [];

      for (const hook of hookList) {
        try {
          const startTime = performance.now();
          const result = await _executeWithTimeout(hook.handler, timeout, {
            ...context,
            hookName,
            hookId: hook.id
          });
          
          const duration = performance.now() - startTime;
          results.push({ id: hook.id, success: true, result, duration });
          _updateMetrics(hookName, true);

          if (hook.once) toRemove.push(hook.id);

        } catch (error: any) {
          const timedOut = error.message.includes('timeout');
          results.push({ id: hook.id, success: false, error: error.message, timedOut });
          _updateMetrics(hookName, false, timedOut);
          _logger.error(`Hook ${hookName} (${hook.id}) failed:`, error.message);
        }
      }

      // Remove hooks once
      toRemove.forEach(id => this.unregister(hookName, id));

      _executing.delete(hookName);

      // Emite evento
      _eventBus?.emit(`lifecycle:${hookName}`, { hookName, results, context });

      const allSuccess = results.every(r => r.success);
      return { success: allSuccess, results, totalHooks: hookList.length };
    },

    // Executa hook sync (não espera)
    executeSync(hookName: string, context = {}) {
      this.execute(hookName, context).catch((e: Error) => _logger.error(`Async hook error: ${e.message}`));
    },

    // Verifica se hook tem handlers
    hasHandlers(hookName: string) {
      return (_hooks.get(hookName)?.length || 0) > 0;
    },

    // Lista handlers de um hook
    getHandlers(hookName: string) {
      return (_hooks.get(hookName) || []).map((h: { id: string; priority: number; once: boolean }) => ({
        id: h.id,
        priority: h.priority,
        once: h.once
      }));
    },

    // Lista todos os hooks
    listHooks() {
      const result = {};
      for (const [name, handlers] of _hooks) {
        (result as Record<string, unknown>)[name] = handlers.length;
      }
      return result;
    },

    // Helpers para hooks comuns
    beforeBoot(handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return this.register(HOOKS.BEFORE_BOOT, handler, options); },
    afterBoot(handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return this.register(HOOKS.AFTER_BOOT, handler, options); },
    beforeShutdown(handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return this.register(HOOKS.BEFORE_SHUTDOWN, handler, options); },
    afterShutdown(handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return this.register(HOOKS.AFTER_SHUTDOWN, handler, options); },
    onStateChange(handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return this.register(HOOKS.ON_STATE_CHANGE, handler, options); },
    onError(handler: (...args: unknown[]) => void, options: Record<string, unknown>) { return this.register(HOOKS.ON_ERROR, handler, options); },

    // Getters
    getMetrics() { return { ..._metrics }; },
    resetMetrics() {
      _metrics = { totalExecutions: 0, successful: 0, failed: 0, timedOut: 0, byHook: {} };
    },

    // Health check
    healthCheck() {
      const totalHandlers = Array.from(_hooks.values()).reduce((sum, h) => sum + h.length, 0);
      
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        totalHooks: Object.keys(HOOKS).length,
        totalHandlers,
        metrics: _metrics
      };
    },

    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        availableHooks: Object.keys(HOOKS),
        priorities: Object.keys(PRIORITIES),
        timeout,
        totalHandlers: Array.from(_hooks.values()).reduce((sum, h) => sum + h.length, 0)
      };
    },

    // Destroy
    destroy() {
      for (const hookName of _hooks.keys()) {
        _hooks.set(hookName, []);
      }
      _executing.clear();
      _logger.info('Lifecycle hooks destroyed');
    }
  };

  return hooks;
}

// Singleton
interface LifecycleHooksInstance {
  destroy: () => void;
  healthCheck: () => Record<string, unknown>;
  [key: string]: unknown;
}

let _instance: LifecycleHooksInstance | null = null;

export function getLifecycleHooks(options = {}) {
  if (!_instance) {
    _instance = createLifecycleHooks(options) as LifecycleHooksInstance;
  }
  return _instance;
}

export function resetLifecycleHooks() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, hooks: Object.keys(HOOKS) };
}

export function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  HOOKS, PRIORITIES,
  createLifecycleHooks, getLifecycleHooks, resetLifecycleHooks,
  info, healthCheck
};
