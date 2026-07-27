// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-reactive-proxy
// PURPOSE: Container-Main Reactive Proxy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createReactive() — exported function
//   computed() — exported function
//   createStore() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'container-reactive-proxy';

// Create reactive state with change tracking
export function createReactive(initialState: Record<string, any> = {}, options: Record<string, any> = {}) {
  const { onChange, onGet, deep = true, batch = true } = options;
  
  let _batchTimeout: unknown = null;
  let _pendingChanges: unknown[] = [];
  const _subscribers = new Set();
  const _watchers = new Map();
  
  function _notifyChange(path: string, newValue: string, oldValue: string) {
    const change = { path, newValue, oldValue, timestamp: Date.now() };
    
    if (batch) {
      _pendingChanges.push(change);
      if (!_batchTimeout) {
        _batchTimeout = setTimeout(() => {
          const changes = _pendingChanges;
          _pendingChanges = [];
          _batchTimeout = null;
          

          // @ts-expect-error TS migration - TS2349
          _subscribers.forEach(fn => fn(changes));
          changes.forEach(c => {
            const pathWatchers = _watchers.get((c as Record<string, unknown>).path);
            // @ts-expect-error TS migration - TS2339
            if (pathWatchers) pathWatchers.forEach((fn: (...args: unknown[]) => void) => fn((c as Record<string, unknown>).newValue, c.oldValue));
          });
          onChange?.(changes);
        }, 0);
      }
    } else {

      // @ts-expect-error TS migration - TS2349
      _subscribers.forEach(fn => fn([change]));
      const pathWatchers = _watchers.get(path);
      if (pathWatchers) pathWatchers.forEach((fn: (...args: unknown[]) => void) => fn(newValue, oldValue));
      onChange?.([change]);
    }
  }
  
  function _createProxy(obj: Record<string, unknown>, path = '') {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    return new Proxy(obj, {
      get(target, prop) {
        const value = target[prop as string];
        const fullPath = path ? `${path}.${String(prop)}` : String(prop);
        
        onGet?.(fullPath, value);
        
        if (deep && typeof value === 'object' && value !== null) {
          // @ts-expect-error TS migration - TS2345
          return _createProxy(value, fullPath);
        }
        return value;
      },
      
      set(target, prop, value) {
        const fullPath = path ? `${path}.${String(prop)}` : String(prop);
        const oldValue = target[prop as string];
        
        if (oldValue === value) return true;
        
        target[prop as string] = value;
        _notifyChange(fullPath, value, (oldValue as string));
        return true;
      },
      
      deleteProperty(target, prop) {
        const fullPath = path ? `${path}.${String(prop)}` : String(prop);
        const oldValue = target[prop as string];
        
        delete target[prop as string];
        // @ts-expect-error strict migration — TS2345
        _notifyChange(fullPath, undefined, (oldValue as string));
        return true;
      }
    });
  }
  
  const state = { ...initialState };
  const proxy = _createProxy(state);
  
  return {
    state: proxy,
    
    subscribe(callback: (...args: unknown[]) => void) {
      _subscribers.add(callback);
      return () => _subscribers.delete(callback);
    },
    
    watch(path: string, callback: (...args: unknown[]) => void) {
      if (!_watchers.has(path)) _watchers.set(path, new Set());
      _watchers.get(path).add(callback);
      return () => _watchers.get(path)?.delete(callback);
    },
    
    get(path: string) {
      const parts = path.split('.');
      let value = state;
      for (const part of parts) {
        if (value === undefined || value === null) return undefined;
        value = value[part];
      }
      return value;
    },
    
    set(path: string, value: unknown) {
      const parts = path.split('.');
      let target = proxy;
      for (let i = 0; i < parts.length - 1; i++) {
        if (target[parts[i]] === undefined) target[parts[i]] = {};
        target = target[parts[i]] as Record<string, unknown>;
      }
      target[parts[parts.length - 1]] = value;
    },
    
    getSnapshot() {
      return JSON.parse(JSON.stringify(state));
    },
    
    reset(newState = initialState) {
      Object.keys(state).forEach(k => delete proxy[k]);
      Object.assign(proxy, JSON.parse(JSON.stringify(newState)));
    },
    
    destroy() {
      _subscribers.clear();
      _watchers.clear();
      // @ts-expect-error TS migration - TS2769
      if (_batchTimeout) clearTimeout(_batchTimeout);
    }
  };
}

// Create computed property
// @ts-expect-error TS migration - TS2322
export function computed(reactive: Record<string, unknown>, path: string, computeFn: unknown, dependencies: Record<string, unknown> = []) {
  let _cached: unknown = null;
  let _dirty = true;
  
  (dependencies.forEach as (...args: unknown[]) => unknown)((dep: unknown) => {
    (reactive.watch as (...args: unknown[]) => unknown)(dep, () => { _dirty = true; });
  });
  
  return {
    get value() {
      if (_dirty) {
        _cached = (computeFn as (...args: unknown[]) => unknown)(reactive.state);
        _dirty = false;
      }
      return _cached;
    },
    invalidate() { _dirty = true; }
  };
}

// Create store with actions
export function createStore(initialState: unknown, actions: Record<string, any> = {}) {
  // @ts-expect-error strict migration — TS2345
  const reactive = createReactive(initialState);
  
  const boundActions: Record<string, any> = {};
  Object.entries(actions).forEach(([name, action]) => {
    boundActions[name] = (...args: unknown[]) => action(reactive.state, ...args);
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

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID };
}

export default {
  createReactive, computed, createStore,
  info, healthCheck, VERSION, MODULE_ID
};
