import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:mutation-manager";
const MUTATION_TYPES = Object.freeze({ CHILD_LIST: "childList", ATTRIBUTES: "attributes", CHARACTER_DATA: "characterData" });
function createMutationManager(options = {}) {
  const { batchMs = 16, defaultOptions = { childList: true, subtree: true } } = options;
  const _logger = createLogger(MODULE_ID);
  const _observers = /* @__PURE__ */ new Map();
  const _batchQueues = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _metrics = { observed: 0, mutations: 0, batches: 0 };
  function _processBatch(id) {
    const queue = _batchQueues.get(id);
    if (!queue || queue.mutations.length === 0) return;
    const config = _observers.get(id);
    if (config?.callback) {
      _metrics.batches++;
      config.callback(queue.mutations, queue.target);
    }
    queue.mutations = [];
  }
  const manager = {
    observe(element, callback, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      const id = `mut-${++_counter}`;
      const observerOptions = { ...defaultOptions, ...options2 };
      const batch = options2.batch !== false;
      const observer = new MutationObserver((mutations) => {
        _metrics.mutations += mutations.length;
        if (batch) {
          const queue = _batchQueues.get(id);
          queue.mutations.push(...mutations);
          clearTimeout(queue.timer);
          queue.timer = setTimeout(() => _processBatch(id), Number(batchMs));
        } else {
          callback(mutations, element);
        }
      });
      _observers.set(id, { observer, callback, element, options: observerOptions });
      _batchQueues.set(id, { mutations: [], timer: null, target: element });
      observer.observe(element, observerOptions);
      _metrics.observed++;
      return id;
    },
    unobserve(id) {
      const config = _observers.get(id);
      if (!config) return false;
      config.observer.disconnect();
      const queue = _batchQueues.get(id);
      if (queue) clearTimeout(queue.timer);
      _observers.delete(id);
      _batchQueues.delete(id);
      return true;
    },
    // Observar atributos específicos
    watchAttributes(element, attributes, callback, options2 = {}) {
      return this.observe(element, (mutations) => {
        const filtered = mutations.filter((m) => m.type === "attributes" && (!attributes.length || attributes.includes(m.attributeName)));
        if (filtered.length > 0) callback(filtered.map((m) => ({ attribute: m.attributeName, oldValue: m.oldValue, newValue: m.target.getAttribute(m.attributeName), target: m.target })));
      }, { attributes: true, attributeFilter: attributes.length ? attributes : void 0, attributeOldValue: true, ...options2 });
    },
    // Observar adição/remoção de elementos
    watchChildren(element, callback, options2 = {}) {
      return this.observe(element, (mutations) => {
        const added = [];
        const removed = [];
        mutations.forEach((m) => {
          if (m.type === "childList") {
            added.push(...Array.from(m.addedNodes).filter((n) => n.nodeType === 1));
            removed.push(...Array.from(m.removedNodes).filter((n) => n.nodeType === 1));
          }
        });
        if (added.length > 0 || removed.length > 0) callback({ added, removed });
      }, { childList: true, subtree: options2.subtree ?? false, ...options2 });
    },
    // Observar texto
    watchText(element, callback, options2 = {}) {
      return this.observe(element, (mutations) => {
        const changes = mutations.filter((m) => m.type === "characterData").map((m) => ({ oldValue: m.oldValue, newValue: m.target.textContent, target: m.target }));
        if (changes.length > 0) callback(changes);
      }, { characterData: true, characterDataOldValue: true, subtree: true, ...options2 });
    },
    // Observar classe específica
    watchClass(element, className, callback, options2 = {}) {
      let hadClass = element.classList.contains(className);
      return this.watchAttributes(element, ["class"], (changes) => {
        const hasClass = element.classList.contains(className);
        if (hasClass !== hadClass) {
          callback({ className, added: hasClass, removed: !hasClass, target: element });
          hadClass = hasClass;
        }
      }, options2);
    },
    // Pausar/resumir
    pause(id) {
      const config = _observers.get(id);
      if (config) {
        config.observer.disconnect();
        config.paused = true;
      }
    },
    resume(id) {
      const config = _observers.get(id);
      if (config && config.paused) {
        config.observer.observe(config.element, config.options);
        config.paused = false;
      }
    },
    // Snapshot do DOM
    takeSnapshot(element) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      return { html: element.innerHTML, attributes: Array.from(element.attributes).reduce((acc, attr) => {
        acc[attr.name] = attr.value;
        return acc;
      }, {}), childCount: element.children.length, timestamp: Date.now() };
    },
    getMetrics() {
      return { ..._metrics, activeObservers: _observers.size };
    },
    resetMetrics() {
      _metrics = { observed: 0, mutations: 0, batches: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, observers: _observers.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, observers: _observers.size, mutationTypes: Object.keys(MUTATION_TYPES) };
    },
    destroy() {
      _observers.forEach((config) => config.observer.disconnect());
      _batchQueues.forEach((queue) => clearTimeout(queue.timer));
      _observers.clear();
      _batchQueues.clear();
    }
  };
  return manager;
}
let _instance = null;
function getMutationManager(options = {}) {
  if (!_instance) _instance = createMutationManager(options);
  return _instance;
}
function resetMutationManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function watchDOM(element, callback, options) {
  return getMutationManager().observe(element, callback, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, mutationTypes: Object.keys(MUTATION_TYPES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var mutation_manager_default = { VERSION, MODULE_ID, MUTATION_TYPES, createMutationManager, getMutationManager, resetMutationManager, watchDOM, info, healthCheck };
export {
  MODULE_ID,
  MUTATION_TYPES,
  VERSION,
  createMutationManager,
  mutation_manager_default as default,
  getMutationManager,
  healthCheck,
  info,
  resetMutationManager,
  watchDOM
};
