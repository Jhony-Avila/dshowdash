const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-reactive-proxy";
function createReactive(initialState = {}, options = {}) {
  const { onChange, onGet, deep = true, batch = true } = options;
  let _batchTimeout = null;
  let _pendingChanges = [];
  const _subscribers = /* @__PURE__ */ new Set();
  const _watchers = /* @__PURE__ */ new Map();
  function _notifyChange(path, newValue, oldValue) {
    const change = { path, newValue, oldValue, timestamp: Date.now() };
    if (batch) {
      _pendingChanges.push(change);
      if (!_batchTimeout) {
        _batchTimeout = setTimeout(() => {
          const changes = _pendingChanges;
          _pendingChanges = [];
          _batchTimeout = null;
          _subscribers.forEach((fn) => fn(changes));
          changes.forEach((c) => {
            const pathWatchers = _watchers.get(c.path);
            if (pathWatchers) pathWatchers.forEach((fn) => fn(c.newValue, c.oldValue));
          });
          onChange?.(changes);
        }, 0);
      }
    } else {
      _subscribers.forEach((fn) => fn([change]));
      const pathWatchers = _watchers.get(path);
      if (pathWatchers) pathWatchers.forEach((fn) => fn(newValue, oldValue));
      onChange?.([change]);
    }
  }
  function _createProxy(obj, path = "") {
    if (typeof obj !== "object" || obj === null) return obj;
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop];
        const fullPath = path ? `${path}.${String(prop)}` : String(prop);
        onGet?.(fullPath, value);
        if (deep && typeof value === "object" && value !== null) {
          return _createProxy(value, fullPath);
        }
        return value;
      },
      set(target, prop, value) {
        const fullPath = path ? `${path}.${String(prop)}` : String(prop);
        const oldValue = target[prop];
        if (oldValue === value) return true;
        target[prop] = value;
        _notifyChange(fullPath, value, oldValue);
        return true;
      },
      deleteProperty(target, prop) {
        const fullPath = path ? `${path}.${String(prop)}` : String(prop);
        const oldValue = target[prop];
        delete target[prop];
        _notifyChange(fullPath, void 0, oldValue);
        return true;
      }
    });
  }
  const state = { ...initialState };
  const proxy = _createProxy(state);
  return {
    state: proxy,
    subscribe(callback) {
      _subscribers.add(callback);
      return () => _subscribers.delete(callback);
    },
    watch(path, callback) {
      if (!_watchers.has(path)) _watchers.set(path, /* @__PURE__ */ new Set());
      _watchers.get(path).add(callback);
      return () => _watchers.get(path)?.delete(callback);
    },
    get(path) {
      const parts = path.split(".");
      let value = state;
      for (const part of parts) {
        if (value === void 0 || value === null) return void 0;
        value = value[part];
      }
      return value;
    },
    set(path, value) {
      const parts = path.split(".");
      let target = proxy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (target[parts[i]] === void 0) target[parts[i]] = {};
        target = target[parts[i]];
      }
      target[parts[parts.length - 1]] = value;
    },
    getSnapshot() {
      return JSON.parse(JSON.stringify(state));
    },
    reset(newState = initialState) {
      Object.keys(state).forEach((k) => delete proxy[k]);
      Object.assign(proxy, JSON.parse(JSON.stringify(newState)));
    },
    destroy() {
      _subscribers.clear();
      _watchers.clear();
      if (_batchTimeout) clearTimeout(_batchTimeout);
    }
  };
}
function computed(reactive, path, computeFn, dependencies = []) {
  let _cached = null;
  let _dirty = true;
  dependencies.forEach((dep) => {
    reactive.watch(dep, () => {
      _dirty = true;
    });
  });
  return {
    get value() {
      if (_dirty) {
        _cached = computeFn(reactive.state);
        _dirty = false;
      }
      return _cached;
    },
    invalidate() {
      _dirty = true;
    }
  };
}
function createStore(initialState, actions = {}) {
  const reactive = createReactive(initialState);
  const boundActions = {};
  Object.entries(actions).forEach(([name, action]) => {
    boundActions[name] = (...args) => action(reactive.state, ...args);
  });
  return {
    state: reactive.state,
    actions: boundActions,
    subscribe: reactive.subscribe,
    watch: reactive.watch,
    get: reactive.get,
    set: reactive.set,
    getSnapshot: reactive.getSnapshot,
    reset: reactive.reset,
    destroy: reactive.destroy
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var reactive_proxy_default = {
  createReactive,
  computed,
  createStore,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  computed,
  createReactive,
  createStore,
  reactive_proxy_default as default,
  healthCheck,
  info
};
