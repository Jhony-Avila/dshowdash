// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:mutation-manager
// PURPOSE: Mutation Manager - Observador de mutações do DOM
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MUTATION_TYPES — exported value
//   createMutationManager() — exported function
//   getMutationManager() — exported function
//   resetMutationManager() — exported function
//   watchDOM() — exported function
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

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:mutation-manager';

export const MUTATION_TYPES = Object.freeze({ CHILD_LIST: 'childList', ATTRIBUTES: 'attributes', CHARACTER_DATA: 'characterData' });

export function createMutationManager(options: Record<string, unknown> = {}) {
  const { batchMs = 16, defaultOptions = { childList: true, subtree: true } } = options;

  const _logger = createLogger(MODULE_ID);
  const _observers = new Map();
  const _batchQueues = new Map();
  let _counter = 0;
  let _metrics = { observed: 0, mutations: 0, batches: 0 };

  function _processBatch(id: string) {
    const queue = _batchQueues.get(id);
    if (!queue || queue.mutations.length === 0) return;

    const config = _observers.get(id);
    if (config?.callback) {
      _metrics.batches++;
      (config.callback as (...args: unknown[]) => void)(queue.mutations, queue.target);
    }

    queue.mutations = [];
  }

  const manager = {
    observe(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      const id = `mut-${++_counter}`;
      const observerOptions = { ...(defaultOptions as Record<string, unknown>), ...(options as Record<string, unknown>) };
      const batch = options.batch !== false;

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

    unobserve(id: string) {
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
    watchAttributes(element: HTMLElement, attributes: Record<string, unknown>, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      return this.observe(element, (mutations: unknown) => {
        // @ts-expect-error TS migration - TS2339
        const filtered = (mutations as unknown[]).filter((m: unknown) => (m as Record<string, unknown>).type === 'attributes' && (!attributes.length || (attributes.includes as (...args: unknown[]) => unknown)(m.attributeName)));
        // @ts-expect-error TS migration - TS2339
        if (filtered.length > 0) callback(filtered.map((m: unknown) => ({ attribute: (m as Record<string, unknown>).attributeName, oldValue: m.oldValue, newValue: m.target.getAttribute(m.attributeName), target: m.target })));
      }, { attributes: true, attributeFilter: attributes.length ? attributes : undefined, attributeOldValue: true, ...options });
    },

    // Observar adição/remoção de elementos
    watchChildren(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      return this.observe(element, (mutations: unknown) => {
        const added: unknown[] = [];
        const removed: unknown[] = [];
        (mutations as unknown[]).forEach((m: unknown) => {
          if ((m as Record<string, unknown>).type === 'childList') {
            // @ts-expect-error TS migration - TS2769
            added.push(...Array.from((m as Record<string, unknown>).addedNodes).filter(n => (n as any).nodeType === 1));
            // @ts-expect-error TS migration - TS2769
            removed.push(...Array.from((m as Record<string, unknown>).removedNodes).filter(n => (n as any).nodeType === 1));
          }
        });
        if (added.length > 0 || removed.length > 0) callback({ added, removed });
      }, { childList: true, subtree: options.subtree ?? false, ...options });
    },

    // Observar texto
    watchText(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      return this.observe(element, (mutations: unknown) => {
        // @ts-expect-error TS migration - TS2339
        const changes = (mutations as unknown[]).filter((m: unknown) => (m as Record<string, unknown>).type === 'characterData').map((m: unknown) => ({ oldValue: m.oldValue, newValue: m.target.textContent, target: m.target }));
        if (changes.length > 0) callback(changes);
      }, { characterData: true, characterDataOldValue: true, subtree: true, ...options });
    },

    // Observar classe específica
    watchClass(element: HTMLElement, className: string, callback: (...args: unknown[]) => void, options: Record<string, unknown> = {}) {
      let hadClass = element.classList.contains(className);
      // @ts-expect-error strict migration — TS2345
      return this.watchAttributes(element, ['class'], (changes: Record<string, unknown>) => {
        const hasClass = element.classList.contains(className);
        if (hasClass !== hadClass) {
          callback({ className, added: hasClass, removed: !hasClass, target: element });
          hadClass = hasClass;
        }
      }, options);
    },

    // Pausar/resumir
    pause(id: string) {
      const config = _observers.get(id);
      if (config) { config.observer.disconnect(); config.paused = true; }
    },

    resume(id: string) {
      const config = _observers.get(id);
      if (config && config.paused) {
        config.observer.observe(config.element, config.options);
        config.paused = false;
      }
    },

    // Snapshot do DOM
    takeSnapshot(element: HTMLElement) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      // @ts-expect-error strict migration — TS7053
      return { html: element.innerHTML, attributes: Array.from(element.attributes).reduce((acc, attr) => { acc[attr.name] = attr.value; return acc; }, {}), childCount: element.children.length, timestamp: Date.now() };
    },

    getMetrics() { return { ..._metrics, activeObservers: _observers.size }; },
    resetMetrics() { _metrics = { observed: 0, mutations: 0, batches: 0 }; },

    healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, observers: _observers.size, metrics: _metrics }; },
    info() { return { moduleId: MODULE_ID, version: VERSION, observers: _observers.size, mutationTypes: Object.keys(MUTATION_TYPES) }; },

    destroy() {
      _observers.forEach(config => config.observer.disconnect());
      _batchQueues.forEach(queue => clearTimeout(queue.timer));
      _observers.clear();
      _batchQueues.clear();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getMutationManager(options: Record<string, unknown> = {}) { if (!_instance) _instance = createMutationManager(options); return _instance; }
export function resetMutationManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function watchDOM(element: HTMLElement, callback: (...args: unknown[]) => void, options: Record<string, unknown>) { return (getMutationManager().observe as (...args: unknown[]) => unknown)(element, callback, options); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, mutationTypes: Object.keys(MUTATION_TYPES) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, MUTATION_TYPES, createMutationManager, getMutationManager, resetMutationManager, watchDOM, info, healthCheck };
