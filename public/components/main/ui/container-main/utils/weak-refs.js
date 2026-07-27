const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-weak-refs";
const _componentRegistry = /* @__PURE__ */ new WeakMap();
function registerComponent(element, component) {
  if (!(element instanceof Element)) return false;
  _componentRegistry.set(element, component);
  return true;
}
function getComponent(element) {
  if (!(element instanceof Element)) return null;
  return _componentRegistry.get(element) || null;
}
function hasComponent(element) {
  if (!(element instanceof Element)) return false;
  return _componentRegistry.has(element);
}
function unregisterComponent(element) {
  if (!(element instanceof Element)) return false;
  return _componentRegistry.delete(element);
}
const _elementData = /* @__PURE__ */ new WeakMap();
function setData(element, key, value) {
  if (!(element instanceof Element)) return false;
  let data = _elementData.get(element);
  if (!data) {
    data: Record = {};
    _elementData.set(element, data);
  }
  data[key] = value;
  return true;
}
function getData(element, key, defaultValue = void 0) {
  if (!(element instanceof Element)) return defaultValue;
  const data = _elementData.get(element);
  return data && key in data ? data[key] : defaultValue;
}
function hasData(element, key) {
  if (!(element instanceof Element)) return false;
  const data = _elementData.get(element);
  return data && key in data;
}
function removeData(element, key) {
  if (!(element instanceof Element)) return false;
  const data = _elementData.get(element);
  if (data && key in data) {
    delete data[key];
    return true;
  }
  return false;
}
function clearData(element) {
  if (!(element instanceof Element)) return false;
  return _elementData.delete(element);
}
const _eventHandlers = /* @__PURE__ */ new WeakMap();
function storeHandler(element, eventType, handler) {
  if (!(element instanceof Element)) return false;
  let handlers = _eventHandlers.get(element);
  if (!handlers) {
    handlers = /* @__PURE__ */ new Map();
    _eventHandlers.set(element, handlers);
  }
  let typeHandlers = handlers.get(eventType);
  if (!typeHandlers) {
    typeHandlers = /* @__PURE__ */ new Set();
    handlers.set(eventType, typeHandlers);
  }
  typeHandlers.add(handler);
  return true;
}
function getHandlers(element, eventType) {
  if (!(element instanceof Element)) return [];
  const handlers = _eventHandlers.get(element);
  if (!handlers) return [];
  const typeHandlers = handlers.get(eventType);
  return typeHandlers ? [...typeHandlers] : [];
}
function removeHandler(element, eventType, handler) {
  if (!(element instanceof Element)) return false;
  const handlers = _eventHandlers.get(element);
  if (!handlers) return false;
  const typeHandlers = handlers.get(eventType);
  if (!typeHandlers) return false;
  return typeHandlers.delete(handler);
}
function clearHandlers(element, eventType = null) {
  if (!(element instanceof Element)) return false;
  const handlers = _eventHandlers.get(element);
  if (!handlers) return false;
  if (eventType) {
    return handlers.delete(eventType);
  }
  _eventHandlers.delete(element);
  return true;
}
class WeakRefCache {
  constructor() {
    this._cache = /* @__PURE__ */ new Map();
    this._finalizationRegistry = typeof FinalizationRegistry !== "undefined" ? new FinalizationRegistry((key) => this._cache.delete(key)) : null;
  }
  set(key, value) {
    if (typeof value !== "object" || value === null) return false;
    const ref = new WeakRef(value);
    this._cache.set(key, ref);
    if (this._finalizationRegistry) {
      this._finalizationRegistry.register(value, key);
    }
    return true;
  }
  get(key) {
    const ref = this._cache.get(key);
    if (!ref) return void 0;
    const value = ref.deref();
    if (value === void 0) {
      this._cache.delete(key);
    }
    return value;
  }
  has(key) {
    return this.get(key) !== void 0;
  }
  delete(key) {
    return this._cache.delete(key);
  }
  clear() {
    this._cache.clear();
  }
  size() {
    return this._cache.size;
  }
}
function createWeakRefCache() {
  return new WeakRefCache();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, supportsFinalizationRegistry: typeof FinalizationRegistry !== "undefined" };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, supportsFinalizationRegistry: typeof FinalizationRegistry !== "undefined" };
}
var weak_refs_default = {
  registerComponent,
  getComponent,
  hasComponent,
  unregisterComponent,
  setData,
  getData,
  hasData,
  removeData,
  clearData,
  storeHandler,
  getHandlers,
  removeHandler,
  clearHandlers,
  createWeakRefCache,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearData,
  clearHandlers,
  createWeakRefCache,
  weak_refs_default as default,
  getComponent,
  getData,
  getHandlers,
  hasComponent,
  hasData,
  healthCheck,
  info,
  registerComponent,
  removeData,
  removeHandler,
  setData,
  storeHandler,
  unregisterComponent
};
