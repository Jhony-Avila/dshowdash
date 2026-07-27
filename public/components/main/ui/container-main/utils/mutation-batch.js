const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-mutation-batch";
const _observers = /* @__PURE__ */ new WeakMap();
let _observerCount = 0;
const DEFAULT_DEBOUNCE = 16;
function createBatchedObserver(callback, options = {}) {
  const { debounceMs = DEFAULT_DEBOUNCE, maxWait = 100, filterEmpty = true } = options;
  let pendingMutations = [];
  let timeoutId = null;
  let lastFlush = 0;
  function flush() {
    if (pendingMutations.length === 0) return;
    const mutations = pendingMutations;
    pendingMutations = [];
    lastFlush = Date.now();
    const grouped = {
      childList: [],
      attributes: [],
      characterData: []
    };
    mutations.forEach((mutation) => {
      grouped[mutation.type]?.push(mutation);
    });
    if (filterEmpty) {
      Object.keys(grouped).forEach((key) => {
        if (grouped[key].length === 0) delete grouped[key];
      });
    }
    callback(mutations, grouped);
  }
  function scheduleFlush() {
    if (timeoutId) clearTimeout(timeoutId);
    const timeSinceLastFlush = Date.now() - lastFlush;
    if (timeSinceLastFlush >= Number(maxWait)) {
      flush();
      return;
    }
    timeoutId = setTimeout(flush, Number(debounceMs));
  }
  const observer = new MutationObserver((mutations) => {
    pendingMutations.push(...mutations);
    scheduleFlush();
  });
  return {
    observer,
    observe: (target, config) => observer.observe(target, config),
    disconnect: () => {
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
      pendingMutations = [];
    },
    flush,
    getPendingCount: () => pendingMutations.length
  };
}
function observe(element, callback, options = {}) {
  if (!(element instanceof Element)) return null;
  const {
    childList = true,
    attributes = true,
    characterData = false,
    subtree = true,
    attributeFilter = null,
    attributeOldValue = false,
    characterDataOldValue = false,
    debounceMs = DEFAULT_DEBOUNCE,
    maxWait = 100
  } = options;
  const batchedObserver = createBatchedObserver(callback, { debounceMs, maxWait });
  const config = { childList, attributes, characterData, subtree };
  if (attributeFilter) config.attributeFilter = attributeFilter;
  if (attributeOldValue) config.attributeOldValue = true;
  if (characterDataOldValue) config.characterDataOldValue = true;
  batchedObserver.observe(element, config);
  _observers.set(element, batchedObserver);
  _observerCount++;
  return () => {
    batchedObserver.disconnect();
    _observers.delete(element);
    _observerCount--;
  };
}
function observeAttributes(element, callback, attributeNames = null, options = {}) {
  return observe(element, (mutations, grouped) => {
    if (grouped.attributes) callback(grouped.attributes);
  }, {
    childList: false,
    attributes: true,
    characterData: false,
    subtree: false,
    attributeFilter: attributeNames,
    attributeOldValue: true,
    ...options
  });
}
function observeChildren(element, callback, options = {}) {
  return observe(element, (mutations, grouped) => {
    if (grouped.childList) callback(grouped.childList);
  }, {
    childList: true,
    attributes: false,
    characterData: false,
    subtree: options.deep || false,
    ...options
  });
}
function observeText(element, callback, options = {}) {
  return observe(element, (mutations, grouped) => {
    if (grouped.characterData) callback(grouped.characterData);
  }, {
    childList: false,
    attributes: false,
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
    ...options
  });
}
function waitForElement(parent, selector, options = {}) {
  const { timeout = 5e3 } = options;
  return new Promise((resolve, reject) => {
    const existing = parent.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    let timeoutId = null;
    const disconnect = observe(parent, (mutations) => {
      const element = parent.querySelector(selector);
      if (element) {
        if (timeoutId) clearTimeout(timeoutId);
        disconnect();
        resolve(element);
      }
    }, { childList: true, subtree: true });
    if (Number(timeout) > 0) {
      timeoutId = setTimeout(() => {
        disconnect();
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
      }, Number(timeout));
    }
  });
}
function waitForRemoval(element, options = {}) {
  const { timeout = 5e3 } = options;
  return new Promise((resolve, reject) => {
    if (!element.parentNode) {
      resolve();
      return;
    }
    let timeoutId = null;
    const disconnect = observe(element.parentNode, (mutations) => {
      const removed = mutations.some(
        (m) => (
          // @ts-expect-error TS migration - TS2339
          m.type === "childList" && Array.from(m.removedNodes).includes(element)
        )
      );
      if (removed) {
        if (timeoutId) clearTimeout(timeoutId);
        disconnect();
        resolve();
      }
    }, { childList: true, subtree: false });
    if (Number(timeout) > 0) {
      timeoutId = setTimeout(() => {
        disconnect();
        reject(new Error(`Element removal timeout after ${timeout}ms`));
      }, Number(timeout));
    }
  });
}
function getObserverCount() {
  return _observerCount;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, observerCount: _observerCount };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, observerCount: _observerCount };
}
var mutation_batch_default = {
  createBatchedObserver,
  observe,
  observeAttributes,
  observeChildren,
  observeText,
  waitForElement,
  waitForRemoval,
  getObserverCount,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createBatchedObserver,
  mutation_batch_default as default,
  getObserverCount,
  healthCheck,
  info,
  observe,
  observeAttributes,
  observeChildren,
  observeText,
  waitForElement,
  waitForRemoval
};
