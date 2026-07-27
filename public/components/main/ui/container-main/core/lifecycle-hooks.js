import { createLogger } from "../utils/logger.js";
const VERSION = "1.0.0-PHASE4";
const MODULE_ID = "container-main:lifecycle-hooks";
const HOOKS = Object.freeze({
  // Boot
  BEFORE_BOOT: "beforeBoot",
  AFTER_BOOT: "afterBoot",
  BEFORE_SHUTDOWN: "beforeShutdown",
  AFTER_SHUTDOWN: "afterShutdown",
  // Kernel
  BEFORE_KERNEL_INIT: "beforeKernelInit",
  AFTER_KERNEL_INIT: "afterKernelInit",
  BEFORE_KERNEL_DESTROY: "beforeKernelDestroy",
  AFTER_KERNEL_DESTROY: "afterKernelDestroy",
  // Component
  BEFORE_COMPONENT_INIT: "beforeComponentInit",
  AFTER_COMPONENT_INIT: "afterComponentInit",
  BEFORE_COMPONENT_DESTROY: "beforeComponentDestroy",
  AFTER_COMPONENT_DESTROY: "afterComponentDestroy",
  // Slot
  BEFORE_SLOT_ACTIVATE: "beforeSlotActivate",
  AFTER_SLOT_ACTIVATE: "afterSlotActivate",
  BEFORE_SLOT_DEACTIVATE: "beforeSlotDeactivate",
  AFTER_SLOT_DEACTIVATE: "afterSlotDeactivate",
  // Panel
  BEFORE_PANEL_LOAD: "beforePanelLoad",
  AFTER_PANEL_LOAD: "afterPanelLoad",
  BEFORE_PANEL_UNLOAD: "beforePanelUnload",
  AFTER_PANEL_UNLOAD: "afterPanelUnload",
  // State
  ON_STATE_CHANGE: "onStateChange",
  ON_ERROR: "onError",
  ON_RECOVERY: "onRecovery"
});
const PRIORITIES = Object.freeze({
  HIGHEST: 0,
  HIGH: 25,
  NORMAL: 50,
  LOW: 75,
  LOWEST: 100
});
function createLifecycleHooks(options = {}) {
  const { eventBus = null, debug = false, timeout = 5e3 } = options;
  const _logger = createLogger(MODULE_ID);
  let _eventBus = eventBus;
  let _hooks = /* @__PURE__ */ new Map();
  let _executing = /* @__PURE__ */ new Set();
  let _metrics = {
    totalExecutions: 0,
    successful: 0,
    failed: 0,
    timedOut: 0,
    byHook: {}
  };
  Object.values(HOOKS).forEach((hook) => _hooks.set(hook, []));
  async function _executeWithTimeout(fn, timeoutMs, context) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Hook timeout after ${timeoutMs}ms`));
      }, timeoutMs);
      Promise.resolve(fn(context)).then((result) => {
        clearTimeout(timer);
        resolve(result);
      }).catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  }
  function _updateMetrics(hookName, success, timedOut = false) {
    _metrics.totalExecutions++;
    if (success) _metrics.successful++;
    else _metrics.failed++;
    if (timedOut) _metrics.timedOut++;
    if (!_metrics.byHook[hookName]) {
      _metrics.byHook[hookName] = { executions: 0, successful: 0, failed: 0 };
    }
    _metrics.byHook[hookName].executions++;
    if (success) _metrics.byHook[hookName].successful++;
    else _metrics.byHook[hookName].failed++;
  }
  const hooks = {
    // Injeta EventBus
    injectEventBus(bus) {
      _eventBus = bus;
    },
    // Registra hook
    register(hookName, handler, options2 = {}) {
      const { id = null, priority = PRIORITIES.NORMAL, once = false } = options2;
      if (!_hooks.has(hookName)) {
        _logger.warn(`Unknown hook: ${hookName}`);
        return null;
      }
      if (typeof handler !== "function") {
        _logger.error("Handler must be a function");
        return null;
      }
      const hookId = id || `hook-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      const hookEntry = { id: hookId, handler, priority, once, registeredAt: Date.now() };
      const hookList = _hooks.get(hookName);
      hookList.push(hookEntry);
      hookList.sort((a, b) => a.priority - b.priority);
      if (debug) _logger.debug(`Registered hook: ${hookName} (${hookId})`);
      return hookId;
    },
    // Remove hook
    unregister(hookName, hookId) {
      if (!_hooks.has(hookName)) return false;
      const hookList = _hooks.get(hookName);
      const index = hookList.findIndex((h) => h.id === hookId);
      if (index > -1) {
        hookList.splice(index, 1);
        if (debug) _logger.debug(`Unregistered hook: ${hookName} (${hookId})`);
        return true;
      }
      return false;
    },
    // Remove todos os hooks de um tipo
    unregisterAll(hookName) {
      if (_hooks.has(hookName)) {
        _hooks.set(hookName, []);
        return true;
      }
      return false;
    },
    // Executa hooks
    async execute(hookName, context = {}) {
      if (!_hooks.has(hookName)) {
        _logger.warn(`Unknown hook: ${hookName}`);
        return { success: false, error: "Unknown hook" };
      }
      if (_executing.has(hookName)) {
        _logger.warn(`Hook already executing: ${hookName}`);
        return { success: false, error: "Already executing" };
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
        } catch (error) {
          const timedOut = error.message.includes("timeout");
          results.push({ id: hook.id, success: false, error: error.message, timedOut });
          _updateMetrics(hookName, false, timedOut);
          _logger.error(`Hook ${hookName} (${hook.id}) failed:`, error.message);
        }
      }
      toRemove.forEach((id) => this.unregister(hookName, id));
      _executing.delete(hookName);
      _eventBus?.emit(`lifecycle:${hookName}`, { hookName, results, context });
      const allSuccess = results.every((r) => r.success);
      return { success: allSuccess, results, totalHooks: hookList.length };
    },
    // Executa hook sync (não espera)
    executeSync(hookName, context = {}) {
      this.execute(hookName, context).catch((e) => _logger.error(`Async hook error: ${e.message}`));
    },
    // Verifica se hook tem handlers
    hasHandlers(hookName) {
      return (_hooks.get(hookName)?.length || 0) > 0;
    },
    // Lista handlers de um hook
    getHandlers(hookName) {
      return (_hooks.get(hookName) || []).map((h) => ({
        id: h.id,
        priority: h.priority,
        once: h.once
      }));
    },
    // Lista todos os hooks
    listHooks() {
      const result = {};
      for (const [name, handlers] of _hooks) {
        result[name] = handlers.length;
      }
      return result;
    },
    // Helpers para hooks comuns
    beforeBoot(handler, options2) {
      return this.register(HOOKS.BEFORE_BOOT, handler, options2);
    },
    afterBoot(handler, options2) {
      return this.register(HOOKS.AFTER_BOOT, handler, options2);
    },
    beforeShutdown(handler, options2) {
      return this.register(HOOKS.BEFORE_SHUTDOWN, handler, options2);
    },
    afterShutdown(handler, options2) {
      return this.register(HOOKS.AFTER_SHUTDOWN, handler, options2);
    },
    onStateChange(handler, options2) {
      return this.register(HOOKS.ON_STATE_CHANGE, handler, options2);
    },
    onError(handler, options2) {
      return this.register(HOOKS.ON_ERROR, handler, options2);
    },
    // Getters
    getMetrics() {
      return { ..._metrics };
    },
    resetMetrics() {
      _metrics = { totalExecutions: 0, successful: 0, failed: 0, timedOut: 0, byHook: {} };
    },
    // Health check
    healthCheck() {
      const totalHandlers = Array.from(_hooks.values()).reduce((sum, h) => sum + h.length, 0);
      return {
        status: "HEALTHY",
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
      _logger.info("Lifecycle hooks destroyed");
    }
  };
  return hooks;
}
let _instance = null;
function getLifecycleHooks(options = {}) {
  if (!_instance) {
    _instance = createLifecycleHooks(options);
  }
  return _instance;
}
function resetLifecycleHooks() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hooks: Object.keys(HOOKS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var lifecycle_hooks_default = {
  VERSION,
  MODULE_ID,
  HOOKS,
  PRIORITIES,
  createLifecycleHooks,
  getLifecycleHooks,
  resetLifecycleHooks,
  info,
  healthCheck
};
export {
  HOOKS,
  MODULE_ID,
  PRIORITIES,
  VERSION,
  createLifecycleHooks,
  lifecycle_hooks_default as default,
  getLifecycleHooks,
  healthCheck,
  info,
  resetLifecycleHooks
};
