// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-weak-refs
// PURPOSE: Container-Main WeakMap/WeakRef Utilities
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   registerComponent() — exported function
//   getComponent() — exported function
//   hasComponent() — exported function
//   unregisterComponent() — exported function
//   setData() — exported function
//   getData() — exported function
//   hasData() — exported function
//   removeData() — exported function
//   clearData() — exported function
//   storeHandler() — exported function
//   getHandlers() — exported function
//   removeHandler() — exported function
//   clearHandlers() — exported function
//   createWeakRefCache() — exported function
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
export const MODULE_ID = 'container-weak-refs';

// WeakMap-based component registry (auto GC when DOM removed)
const _componentRegistry = new WeakMap();

export function registerComponent(element: HTMLElement, component: Record<string, unknown>) {
  if (!(element instanceof Element)) return false;
  _componentRegistry.set(element, component);
  return true;
}

export function getComponent(element: HTMLElement) {
  if (!(element instanceof Element)) return null;
  return _componentRegistry.get(element) || null;
}

export function hasComponent(element: HTMLElement) {
  if (!(element instanceof Element)) return false;
  return _componentRegistry.has(element);
}

export function unregisterComponent(element: HTMLElement) {
  if (!(element instanceof Element)) return false;
  return _componentRegistry.delete(element);
}

// WeakMap-based data storage for elements
const _elementData = new WeakMap();

export function setData(element: HTMLElement, key: string, value: unknown) {
  if (!(element instanceof Element)) return false;
  let data = _elementData.get(element);
  if (!data) {

    // @ts-expect-error TS migration - TS2693
    data: Record<string, unknown> = {};
    _elementData.set(element, data);
  }
  data[key] = value;
  return true;
}

// @ts-expect-error strict migration — TS2322
export function getData(element: HTMLElement, key: string, defaultValue: string = undefined) {
  if (!(element instanceof Element)) return defaultValue;
  const data = _elementData.get(element);
  return data && key in data ? data[key] : defaultValue;
}

export function hasData(element: HTMLElement, key: string) {
  if (!(element instanceof Element)) return false;
  const data = _elementData.get(element);
  return data && key in data;
}

export function removeData(element: HTMLElement, key: string) {
  if (!(element instanceof Element)) return false;
  const data = _elementData.get(element);
  if (data && key in data) {
    delete data[key];
    return true;
  }
  return false;
}

export function clearData(element: HTMLElement) {
  if (!(element instanceof Element)) return false;
  return _elementData.delete(element);
}

// WeakMap-based event handler storage
const _eventHandlers = new WeakMap();

export function storeHandler(element: HTMLElement, eventType: string, handler: (...args: unknown[]) => void) {
  if (!(element instanceof Element)) return false;
  let handlers = _eventHandlers.get(element);
  if (!handlers) {
    handlers = new Map();
    _eventHandlers.set(element, handlers);
  }
  let typeHandlers = handlers.get(eventType);
  if (!typeHandlers) {
    typeHandlers = new Set();
    handlers.set(eventType, typeHandlers);
  }
  typeHandlers.add(handler);
  return true;
}

export function getHandlers(element: HTMLElement, eventType: string) {
  if (!(element instanceof Element)) return [];
  const handlers = _eventHandlers.get(element);
  if (!handlers) return [];
  const typeHandlers = handlers.get(eventType);
  return typeHandlers ? [...typeHandlers] : [];
}

export function removeHandler(element: HTMLElement, eventType: string, handler: (...args: unknown[]) => void) {
  if (!(element instanceof Element)) return false;
  const handlers = _eventHandlers.get(element);
  if (!handlers) return false;
  const typeHandlers = handlers.get(eventType);
  if (!typeHandlers) return false;
  return typeHandlers.delete(handler);
}

// @ts-expect-error strict migration — TS2322
export function clearHandlers(element: HTMLElement, eventType: string = null) {
  if (!(element instanceof Element)) return false;
  const handlers = _eventHandlers.get(element);
  if (!handlers) return false;
  if (eventType) {
    return handlers.delete(eventType);
  }
  _eventHandlers.delete(element);
  return true;
}

// WeakRef-based cache with automatic cleanup
class WeakRefCache {
  [key: string]: any;
  constructor() {
    this._cache = new Map();
    this._finalizationRegistry = typeof FinalizationRegistry !== 'undefined' 
      ? new FinalizationRegistry(key => this._cache.delete(key))
      : null;
  }
  
  set(key: string, value: unknown) {
    if (typeof value !== 'object' || value === null) return false;
    const ref = new WeakRef(value);
    this._cache.set(key, ref);
    if (this._finalizationRegistry) {
      this._finalizationRegistry.register(value, key);
    }
    return true;
  }
  
  get(key: string) {
    const ref = this._cache.get(key);
    if (!ref) return undefined;
    const value = ref.deref();
    if (value === undefined) {
      this._cache.delete(key);
    }
    return value;
  }
  
  has(key: string) {
    return this.get(key) !== undefined;
  }
  
  delete(key: string) {
    return this._cache.delete(key);
  }
  
  clear() {
    this._cache.clear();
  }
  
  size() {
    return this._cache.size;
  }
}

export function createWeakRefCache() {
  return new WeakRefCache();
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, supportsFinalizationRegistry: typeof FinalizationRegistry !== 'undefined' };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, supportsFinalizationRegistry: typeof FinalizationRegistry !== 'undefined' };
}

export default {
  registerComponent, getComponent, hasComponent, unregisterComponent,
  setData, getData, hasData, removeData, clearData,
  storeHandler, getHandlers, removeHandler, clearHandlers,
  createWeakRefCache,
  info, healthCheck, VERSION, MODULE_ID
};
