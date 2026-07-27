// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-mutation-batch
// PURPOSE: Container-Main Mutation Observer Batch
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createBatchedObserver() — exported function
//   observe() — exported function
//   observeAttributes() — exported function
//   observeChildren() — exported function
//   observeText() — exported function
//   waitForElement() — exported function
//   waitForRemoval() — exported function
//   getObserverCount() — exported function
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
export const MODULE_ID = 'container-mutation-batch';

const _observers = new WeakMap();
let _observerCount = 0;

// Default debounce for mutation callbacks
const DEFAULT_DEBOUNCE = 16; // ~1 frame

// Create optimized mutation observer with batching
export function createBatchedObserver(callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  const { debounceMs = DEFAULT_DEBOUNCE, maxWait = 100, filterEmpty = true } = options;
  
  let pendingMutations: unknown[] = [];
  let timeoutId: unknown = null;
  let lastFlush = 0;
  
  function flush() {
    if (pendingMutations.length === 0) return;
    
    const mutations = pendingMutations;
    pendingMutations = [];
    lastFlush = Date.now();
    
    // Group mutations by type
    const grouped = {
      childList: [] as unknown[],
      attributes: [] as unknown[],
      characterData: [] as unknown[]
    };
    
    mutations.forEach(mutation => {
      // @ts-expect-error TS migration - TS2538
      (grouped as Record<string, unknown>)[(mutation as Record<string, unknown>).type]?.push(mutation);
    });
    
    // Remove empty groups if filterEmpty
    if (filterEmpty) {
      Object.keys(grouped).forEach(key => {
        // @ts-expect-error TS migration - TS2339
        if ((grouped as Record<string, unknown>)[key].length === 0) delete (grouped as Record<string, unknown>)[key];
      });
    }
    
    callback(mutations, grouped);
  }
  
  function scheduleFlush() {
    // @ts-expect-error TS migration - TS2769
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
    observe: (target: HTMLElement, config: Record<string, unknown>) => observer.observe(target, config),
    disconnect: () => {
      // @ts-expect-error TS migration - TS2769
      if (timeoutId) clearTimeout(timeoutId);
      observer.disconnect();
      pendingMutations = [];
    },
    flush,
    getPendingCount: () => pendingMutations.length
  };
}

// Observe element with standard config
export function observe(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
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
  if (attributeFilter) (config as any).attributeFilter = attributeFilter;
  if (attributeOldValue) (config as any).attributeOldValue = true;

  // @ts-expect-error TS migration - TS2339
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

// Observe only attribute changes
export function observeAttributes(element: HTMLElement, callback: (...args: unknown[]) => void, attributeNames: unknown = null, options: Record<string, unknown> = {}) {
  return observe(element, (mutations: unknown, grouped: unknown) => {
    // @ts-expect-error TS migration - TS2339
    if ((grouped as Record<string, unknown>).attributes) callback(grouped.attributes);
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

// Observe only child changes
export function observeChildren(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  return observe(element, (mutations: unknown, grouped: unknown) => {
    // @ts-expect-error TS migration - TS2339
    if ((grouped as Record<string, unknown>).childList) callback(grouped.childList);
  }, {
    childList: true,
    attributes: false,
    characterData: false,
    subtree: options.deep || false,
    ...options
  });
}

// Observe text content changes
export function observeText(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
  return observe(element, (mutations: unknown, grouped: unknown) => {
    // @ts-expect-error TS migration - TS2339
    if ((grouped as Record<string, unknown>).characterData) callback(grouped.characterData);
  }, {
    childList: false,
    attributes: false,
    characterData: true,
    characterDataOldValue: true,
    subtree: true,
    ...options
  });
}

// Watch for element addition
export function waitForElement(parent: HTMLElement, selector: string, options: Record<string, unknown> = {}) {
  const { timeout = 5000 } = options;
  
  return new Promise((resolve, reject) => {
    // Check if already exists
    const existing = parent.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }
    
    let timeoutId: unknown = null;
    
    const disconnect = observe(parent, (mutations: unknown) => {
      const element = parent.querySelector(selector);
      if (element) {
        // @ts-expect-error TS migration - TS2769
        if (timeoutId) clearTimeout(timeoutId);
        // @ts-expect-error strict migration — TS2721
        disconnect();
        resolve(element);
      }
    }, { childList: true, subtree: true });
    
    if (Number(timeout) > 0) {
      timeoutId = setTimeout(() => {
        // @ts-expect-error strict migration — TS2721
        disconnect();
        reject(new Error(`Element "${selector}" not found within ${timeout}ms`));
      }, Number(timeout));
    }
  });
}

// Watch for element removal
export function waitForRemoval(element: HTMLElement, options: Record<string, unknown> = {}) {
  const { timeout = 5000 } = options;
  
  return new Promise((resolve, reject) => {
    if (!element.parentNode) {

      // @ts-expect-error TS migration - TS2794
      resolve();
      return;
    }
    
    let timeoutId: unknown = null;
    
    // @ts-expect-error TS migration - TS2345
    const disconnect = observe(element.parentNode, (mutations: unknown) => {
      const removed = (mutations as unknown[]).some((m: unknown) => 
        // @ts-expect-error TS migration - TS2339
        (m as Record<string, unknown>).type === 'childList' && Array.from(m.removedNodes).includes(element)
      );
      if (removed) {
        // @ts-expect-error TS migration - TS2769
        if (timeoutId) clearTimeout(timeoutId);
        // @ts-expect-error strict migration — TS2721
        disconnect();

        // @ts-expect-error TS migration - TS2794
        resolve();
      }
    }, { childList: true, subtree: false });
    
    if (Number(timeout) > 0) {
      timeoutId = setTimeout(() => {
        // @ts-expect-error strict migration — TS2721
        disconnect();
        reject(new Error(`Element removal timeout after ${timeout}ms`));
      }, Number(timeout));
    }
  });
}

// Get observer count
export function getObserverCount() {
  return _observerCount;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, observerCount: _observerCount };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, observerCount: _observerCount };
}

export default {
  createBatchedObserver, observe, observeAttributes, observeChildren, observeText,
  waitForElement, waitForRemoval, getObserverCount,
  info, healthCheck, VERSION, MODULE_ID
};
