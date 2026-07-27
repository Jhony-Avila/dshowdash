import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-ENTERPRISE";
const MODULE_ID = "router.hooks.index";
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
const HOOK_TYPES = { BEFORE_RESOLVE: "beforeResolve", AFTER_RESOLVE: "afterResolve", BEFORE_GUARD: "beforeGuard", AFTER_GUARD: "afterGuard", BEFORE_NAVIGATE: "beforeNavigate", AFTER_NAVIGATE: "afterNavigate", ON_ERROR: "onError", ON_NOT_FOUND: "onNotFound" };
const _hooks = {};
Object.values(HOOK_TYPES).forEach((t) => {
  _hooks[t] = [];
});
const _metrics = { registered: 0, executed: 0, errors: 0, aborted: 0 };
let _hookIdCounter = 0;
function _generateHookId() {
  return `hook_${++_hookIdCounter}_${Date.now()}`;
}
const RouterHooks = {
  register(type, callback, options) {
    if (!options) options = {};
    if (!_hooks[type]) {
      _log("warn", "Invalid hook type", { type });
      return null;
    }
    const hook = { id: _generateHookId(), type, callback, priority: options.priority || 10, once: options.once || false, name: options.name || "anonymous", enabled: true };
    _hooks[type].push(hook);
    _hooks[type].sort((a, b) => a.priority - b.priority);
    _metrics.registered++;
    _log("debug", "Hook registered", { id: hook.id, type, name: hook.name, priority: hook.priority });
    const self = this;
    return () => {
      self.unregister(hook.id);
    };
  },
  beforeResolve(callback, options) {
    return this.register(HOOK_TYPES.BEFORE_RESOLVE, callback, options);
  },
  afterResolve(callback, options) {
    return this.register(HOOK_TYPES.AFTER_RESOLVE, callback, options);
  },
  beforeGuard(callback, options) {
    return this.register(HOOK_TYPES.BEFORE_GUARD, callback, options);
  },
  afterGuard(callback, options) {
    return this.register(HOOK_TYPES.AFTER_GUARD, callback, options);
  },
  beforeNavigate(callback, options) {
    return this.register(HOOK_TYPES.BEFORE_NAVIGATE, callback, options);
  },
  afterNavigate(callback, options) {
    return this.register(HOOK_TYPES.AFTER_NAVIGATE, callback, options);
  },
  onError(callback, options) {
    return this.register(HOOK_TYPES.ON_ERROR, callback, options);
  },
  onNotFound(callback, options) {
    return this.register(HOOK_TYPES.ON_NOT_FOUND, callback, options);
  },
  unregister(hookId) {
    let found = false;
    Object.keys(_hooks).forEach((type) => {
      let index = -1;
      for (let i = 0; i < _hooks[type].length; i++) {
        if (_hooks[type][i].id === hookId) {
          index = i;
          break;
        }
      }
      if (index !== -1) {
        _hooks[type].splice(index, 1);
        _log("debug", "Hook unregistered", { id: hookId, type });
        found = true;
      }
    });
    return found;
  },
  execute(type, context) {
    const self = this;
    if (!context) context = {};
    if (!_hooks[type]) return Promise.resolve({ success: true, aborted: false });
    const hooks = _hooks[type].filter((h) => h.enabled);
    const results = [];
    let aborted = false;
    let i = 0;
    function runNext() {
      if (i >= hooks.length || aborted) {
        return Promise.resolve({ success: !aborted, aborted, results });
      }
      const hook = hooks[i++];
      _metrics.executed++;
      return Promise.resolve().then(() => hook.callback(context)).then((result) => {
        results.push({ hookId: hook.id, name: hook.name, result });
        if (result === false) {
          aborted = true;
          _metrics.aborted++;
          _log("debug", "Hook chain aborted", { hookId: hook.id, type });
        }
        if (hook.once) self.unregister(hook.id);
        return runNext();
      }).catch((error) => {
        _metrics.errors++;
        _log("error", "Hook execution error", { hookId: hook.id, type, error: error.message });
        results.push({ hookId: hook.id, name: hook.name, error: error.message });
        return runNext();
      });
    }
    return runNext();
  },
  // @ts-expect-error strict migration — TS2345
  executeSync(type, context) {
    if (!context) context = {};
    if (!_hooks[type]) return { success: true, aborted: false };
    const hooks = _hooks[type].filter((h) => h.enabled);
    let aborted = false;
    const self = this;
    for (let i = 0; i < hooks.length; i++) {
      const hook = hooks[i];
      try {
        _metrics.executed++;
        const result = hook.callback(context);
        if (result === false) {
          aborted = true;
          _metrics.aborted++;
          break;
        }
        if (hook.once) self.unregister(hook.id);
      } catch (error) {
        _metrics.errors++;
        _log("error", "Hook sync error", { hookId: hook.id, error: error.message });
      }
    }
    return { success: !aborted, aborted };
  },
  list(type) {
    if (type) {
      return (_hooks[type] || []).map((h) => ({
        id: h.id,
        name: h.name,
        type: h.type,
        priority: h.priority,
        enabled: h.enabled,
        once: h.once
      }));
    }
    const all = {};
    Object.keys(_hooks).forEach((t) => {
      all[t] = _hooks[t].map((h) => ({
        id: h.id,
        name: h.name,
        priority: h.priority
      }));
    });
    return all;
  },
  enable(hookId) {
    let found = false;
    Object.values(_hooks).forEach((hooks) => {
      hooks.forEach((h) => {
        if (h.id === hookId) {
          h.enabled = true;
          found = true;
        }
      });
    });
    return found;
  },
  disable(hookId) {
    let found = false;
    Object.values(_hooks).forEach((hooks) => {
      hooks.forEach((h) => {
        if (h.id === hookId) {
          h.enabled = false;
          found = true;
        }
      });
    });
    return found;
  },
  clear(type) {
    if (type && _hooks[type]) {
      const count = _hooks[type].length;
      _hooks[type] = [];
      return count;
    }
    let total = 0;
    Object.keys(_hooks).forEach((t) => {
      total += _hooks[t].length;
      _hooks[t] = [];
    });
    return total;
  },
  getMetrics() {
    const counts = {};
    Object.keys(_hooks).forEach((type) => {
      counts[type] = _hooks[type].length;
    });
    return Object.assign({}, _metrics, { hookCounts: counts });
  },
  getStatus() {
    let total = 0;
    Object.values(_hooks).forEach((h) => {
      total += h.length;
    });
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), hookTypes: Object.keys(HOOK_TYPES), totalHooks: total, metrics: this.getMetrics() };
  },
  healthCheck() {
    return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), checks: { hookTypesConfigured: Object.keys(_hooks).length === Object.keys(HOOK_TYPES).length, noExcessiveErrors: _metrics.errors < 100 } };
  },
  info() {
    return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hookTypes: Object.keys(HOOK_TYPES), status: this.getStatus(), healthCheck: this.healthCheck(), timestamp: Date.now() };
  }
};
var hooks_default = RouterHooks;
export {
  HOOK_TYPES,
  MODULE_ID,
  RouterHooks,
  VERSION,
  hooks_default as default,
  getPorts,
  injectPorts
};
