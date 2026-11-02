
// Environment Adapter - Fallback SSR/Worker
// @version 1.2.0-HEALTH-CONTRACT
// @description Detecta ambiente e fornece fallbacks para SSR e Web Workers
// @changelog v1.2.0-HEALTH-CONTRACT: healthCheck migrado para HEALTH CONTRACT v1.0.0 (createHealthResult + HEALTH_STATUS)
// @changelog v1.1.0-DOMAIN-PURE - setupBootstrapEnvironment() usa EventBusAdapter como resolver (elimina window.EventBus direto)
// @changelog v1.0.0-FALLBACK - Sprint 10: Melhoria #11 - Fallback SSR/Worker
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
// PROVIDES: Environment detection, storage/DOM/EventBus/performance fallbacks
// NOTE: setupBootstrapEnvironment().eventBus agora resolve via
//       EventBusAdapter (se disponível) → createFallbackEventBus()
// BROWSER APIs (legítimo — detecção de ambiente):
//   window.localStorage, window.sessionStorage, window.isSecureContext,
//   window.location, window.navigator, typeof window, typeof document
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';

export var VERSION = '1.2.0-HEALTH-CONTRACT';
export var MODULE_ID = 'environment-adapter';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

type EnvironmentType = 'browser' | 'node' | 'worker' | 'unknown';

interface EnvironmentInfo {
  type: EnvironmentType;
  hasWindow: boolean;
  hasDocument: boolean;
  hasLocalStorage: boolean;
  hasSessionStorage: boolean;
  isSecureContext: boolean;
  isWorker: boolean;
  isNode: boolean;
  isBrowser: boolean;
  userAgent: string;
}

interface MockElementType {
  tagName: string;
  id: string;
  className: string;
  style: Record<string, string>;
  dataset: Record<string, string>;
  attributes: Record<string, string>;
  children: MockElementType[];
  childNodes: MockElementType[];
  parentNode: MockElementType | null;
  innerHTML: string;
  innerText: string;
  textContent: string;
  setAttribute: (name: string, value: string) => void;
  getAttribute: (name: string) => string | null;
  removeAttribute: (name: string) => void;
  hasAttribute: (name: string) => boolean;
  appendChild: (child: MockElementType) => MockElementType;
  removeChild: (child: MockElementType) => MockElementType;
  querySelector: () => null;
  querySelectorAll: () => MockElementType[];
  getElementById: () => null;
  getElementsByClassName: () => MockElementType[];
  getElementsByTagName: () => MockElementType[];
  addEventListener: () => void;
  removeEventListener: () => void;
  dispatchEvent: () => boolean;
  focus: () => void;
  blur: () => void;
  click: () => void;
  cloneNode: () => MockElementType;
}

type EventHandler = (data: unknown) => void;

interface FallbackEventBus {
  on: (event: string, handler: EventHandler) => () => void;
  off: (event: string, handler: EventHandler) => void;
  emit: (event: string, data: unknown) => void;
  once: (event: string, handler: EventHandler) => () => void;
  clear: () => void;
  listenerCount: (event: string) => number;
}

// ============================================================================
// ENVIRONMENT DETECTION
// ============================================================================

var _cachedEnv: EnvironmentInfo | null = null;

/**
 * Detecta o ambiente de execução atual
 * @returns {EnvironmentInfo}
 */
export function detectEnvironment(): EnvironmentInfo {
  if (_cachedEnv) return _cachedEnv;

  var hasWindow = typeof window !== 'undefined';
  var hasDocument = typeof document !== 'undefined';
  var hasGlobalThis = typeof globalThis !== 'undefined';
  var hasProcess = typeof process !== 'undefined' && process.versions && process.versions.node;
  var hasSelf = typeof self !== 'undefined';
  var hasImportScripts = typeof (self as { importScripts?: Function }).importScripts === 'function';

  // Detectar tipo
  var type: EnvironmentType = 'unknown';
  if (hasWindow && hasDocument) {
    type = 'browser';
  } else if (hasProcess) {
    type = 'node';
  } else if (hasSelf && hasImportScripts) {
    type = 'worker';
  } else if (hasSelf && !hasWindow) {
    type = 'worker'; // Service Worker ou Shared Worker
  }

  // Verificar storages com try-catch (podem estar bloqueados)
  var hasLocalStorage = false;
  var hasSessionStorage = false;

  if (hasWindow) {
    try {
      hasLocalStorage = typeof window.localStorage !== 'undefined';
      window.localStorage.setItem('__env_test__', '1');
      window.localStorage.removeItem('__env_test__');
    } catch (e) {
      hasLocalStorage = false;
    }

    try {
      hasSessionStorage = typeof window.sessionStorage !== 'undefined';
      window.sessionStorage.setItem('__env_test__', '1');
      window.sessionStorage.removeItem('__env_test__');
    } catch (e) {
      hasSessionStorage = false;
    }
  }

  // Contexto seguro
  var isSecureContext = false;
  if (hasWindow && window.isSecureContext !== undefined) {
    isSecureContext = window.isSecureContext;
  } else if (hasWindow && window.location) {
    isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  }

  // User Agent
  var userAgent = 'N/A';
  if (hasWindow && window.navigator && window.navigator.userAgent) {
    userAgent = window.navigator.userAgent;
  }

  _cachedEnv = {
    type: type,
    hasWindow: hasWindow,
    hasDocument: hasDocument,
    hasLocalStorage: hasLocalStorage,
    hasSessionStorage: hasSessionStorage,
    isSecureContext: isSecureContext,
    isWorker: type === 'worker',
    isNode: type === 'node',
    isBrowser: type === 'browser',
    userAgent: userAgent
  };

  return _cachedEnv;
}

// ============================================================================
// STORAGE FALLBACKS
// ============================================================================

/**
 * In-memory storage fallback
 */
var _memoryStorage = new Map<string, string>();

var MemoryStorage = {
  getItem: function(key: string): string | null {
    return _memoryStorage.has(key) ? _memoryStorage.get(key)! : null;
  },
  setItem: function(key: string, value: string): void {
    _memoryStorage.set(key, String(value));
  },
  removeItem: function(key: string): void {
    _memoryStorage.delete(key);
  },
  clear: function(): void {
    _memoryStorage.clear();
  },
  get length(): number {
    return _memoryStorage.size;
  },
  key: function(index: number): string | null {
    var keys = Array.from(_memoryStorage.keys());
    return keys[index] || null;
  }
};

/**
 * Retorna storage seguro (com fallback para memória)
 * @param {'local'|'session'} type - Tipo de storage
 * @returns {Storage} Storage ou fallback
 */
export function getSafeStorage(type: 'local' | 'session') {
  var env = detectEnvironment();

  if (type === 'local' && env.hasLocalStorage) {
    return window.localStorage;
  }

  if (type === 'session' && env.hasSessionStorage) {
    return window.sessionStorage;
  }

  // Fallback para memória
  return MemoryStorage;
}

// ============================================================================
// DOM FALLBACKS
// ============================================================================

/**
 * Mock de elemento DOM para ambientes sem DOM
 */
function createMockElement(tagName: string): MockElementType {
  return {
    tagName: tagName.toUpperCase(),
    id: '',
    className: '',
    style: {},
    dataset: {},
    attributes: {},
    children: [] as MockElementType[],
    childNodes: [] as MockElementType[],
    parentNode: null as MockElementType | null,
    innerHTML: '',
    innerText: '',
    textContent: '',

    setAttribute: function(name: string, value: string): void {
      this.attributes[name] = value;
      if (name === 'id') this.id = value;
      if (name === 'class') this.className = value;
    },
    getAttribute: function(name: string): string | null {
      return this.attributes[name] || null;
    },
    removeAttribute: function(name: string): void {
      delete this.attributes[name];
    },
    hasAttribute: function(name: string): boolean {
      return name in this.attributes;
    },
    appendChild: function(child: MockElementType): MockElementType {
      child.parentNode = this;
      this.children.push(child);
      this.childNodes.push(child);
      return child;
    },
    removeChild: function(child: MockElementType): MockElementType {
      var idx = this.children.indexOf(child);
      if (idx > -1) {
        this.children.splice(idx, 1);
        this.childNodes.splice(idx, 1);
        child.parentNode = null;
      }
      return child;
    },
    querySelector: function(): null { return null; },
    querySelectorAll: function(): MockElementType[] { return []; },
    getElementById: function(): null { return null; },
    getElementsByClassName: function(): MockElementType[] { return []; },
    getElementsByTagName: function(): MockElementType[] { return []; },
    addEventListener: function(): void {},
    removeEventListener: function(): void {},
    dispatchEvent: function(): boolean { return true; },
    focus: function(): void {},
    blur: function(): void {},
    click: function(): void {},
    cloneNode: function(this: MockElementType): MockElementType { return createMockElement(this.tagName); }
  };
}

/**
 * Mock de document para ambientes sem DOM
 */
var MockDocument = {
  body: createMockElement('body'),
  head: createMockElement('head'),
  documentElement: createMockElement('html'),
  readyState: 'complete',

  createElement: function(tagName: string) {
    return createMockElement(tagName);
  },
  createTextNode: function(text: string) {
    return { nodeType: 3, textContent: text, data: text };
  },
  createDocumentFragment: function() {
    return createMockElement('fragment');
  },
  getElementById: function(): null { return null; },
  getElementsByClassName: function(): MockElementType[] { return []; },
  getElementsByTagName: function(): MockElementType[] { return []; },
  querySelector: function(): null { return null; },
  querySelectorAll: function(): MockElementType[] { return []; },
  addEventListener: function(): void {},
  removeEventListener: function(): void {}
};

/**
 * Retorna document seguro (com fallback)
 * @returns {Document} Document ou mock
 */
export function getSafeDocument() {
  var env = detectEnvironment();
  if (env.hasDocument) {
    return document;
  }
  return MockDocument;
}

/**
 * Retorna window seguro (com fallback parcial)
 * @returns {Object} Window ou mock parcial
 */
export function getSafeWindow() {
  var env = detectEnvironment();
  if (env.hasWindow) {
    return window;
  }

  // Mock parcial de window
  return {
    document: MockDocument,
    location: { href: '', protocol: 'https:', hostname: 'localhost', pathname: '/', search: '', hash: '' },
    navigator: { userAgent: 'Node.js', language: 'en-US', onLine: true },
    localStorage: MemoryStorage,
    sessionStorage: MemoryStorage,
    setTimeout: typeof setTimeout !== 'undefined' ? setTimeout : function(fn: () => void) { fn(); return 0; },
    clearTimeout: typeof clearTimeout !== 'undefined' ? clearTimeout : function() {},
    setInterval: typeof setInterval !== 'undefined' ? setInterval : function() { return 0; },
    clearInterval: typeof clearInterval !== 'undefined' ? clearInterval : function() {},
    requestAnimationFrame: typeof requestAnimationFrame !== 'undefined' ? requestAnimationFrame.bind(globalThis) : function(fn: FrameRequestCallback) { return setTimeout(fn, 16); },
    cancelAnimationFrame: typeof cancelAnimationFrame !== 'undefined' ? cancelAnimationFrame.bind(globalThis) : function(id: number) { clearTimeout(id); },
    addEventListener: function() {},
    removeEventListener: function() {},
    dispatchEvent: function() { return true; },
    console: typeof console !== 'undefined' ? console : { log: function() {}, warn: function() {}, error: function() {} }
  };
}

// ============================================================================
// EVENT BUS FALLBACK
// ============================================================================

/**
 * Cria EventBus simples para ambientes sem EventBus
 * @returns {FallbackEventBus} EventBus
 */
export function createFallbackEventBus(): FallbackEventBus {
  var listeners = new Map<string, EventHandler[]>();

  return {
    on: function(event: string, handler: EventHandler): () => void {
      if (!listeners.has(event)) {
        listeners.set(event, []);
      }
      listeners.get(event)!.push(handler);
      return function() {
        var handlers = listeners.get(event);
        if (handlers) {
          var idx = handlers.indexOf(handler);
          if (idx > -1) handlers.splice(idx, 1);
        }
      };
    },

    off: function(event: string, handler: EventHandler): void {
      var handlers = listeners.get(event);
      if (handlers) {
        var idx = handlers.indexOf(handler);
        if (idx > -1) handlers.splice(idx, 1);
      }
    },

    emit: function(event: string, data: unknown): void {
      var handlers = listeners.get(event);
      if (handlers) {
        handlers.forEach(function(handler: EventHandler) {
          try {
            handler(data);
          } catch (e) {
            console.error('[FallbackEventBus] Error in handler:', e);
          }
        });
      }
    },

    once: function(event: string, handler: EventHandler): () => void {
      var self = this;
      var wrapper: EventHandler = function(data: unknown) {
        self.off(event, wrapper);
        handler(data);
      };
      return this.on(event, wrapper);
    },

    clear: function(): void {
      listeners.clear();
    },

    listenerCount: function(event: string): number {
      var handlers = listeners.get(event);
      return handlers ? handlers.length : 0;
    }
  };
}

// ============================================================================
// PERFORMANCE FALLBACK
// ============================================================================

/**
 * Retorna performance API segura
 * @returns {Object} Performance ou mock
 */
export function getSafePerformance() {
  // @ts-expect-error strict migration — TS2774
  if (typeof performance !== 'undefined' && performance.now) {
    return performance;
  }

  var startTime = Date.now();

  return {
    now: function() {
      return Date.now() - startTime;
    },
    mark: function() {},
    measure: function() {},
    getEntriesByName: function(): PerformanceEntry[] { return []; },
    getEntriesByType: function(): PerformanceEntry[] { return []; },
    clearMarks: function() {},
    clearMeasures: function() {}
  };
}

// ============================================================================
// BOOTSTRAP ENVIRONMENT SETUP
// ============================================================================

// v1.1.0: resolve EventBus via adapter chain (não window.EventBus direto)
function _resolveEventBus(env: EnvironmentInfo) {
  // 1. Tentar via EventBusAdapter (se já importado/registrado)
  if (env.hasWindow && window.Core && window.Core.EventBusAdapter && (window.Core.EventBusAdapter as { getEventBus?: () => unknown }).getEventBus) {
    var resolved = (window.Core.EventBusAdapter as { getEventBus: () => unknown }).getEventBus();
    if (resolved) return resolved;
  }
  // 2. Tentar via windowAdapter
  if (env.hasWindow && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var fromAdapter = window.Core.windowAdapter.get('EventBus');
    if (fromAdapter) return fromAdapter;
  }
  // 3. Fallback: criar EventBus interno
  return createFallbackEventBus();
}

/**
 * Configura ambiente para bootstrap
 * @returns {Object} Ambiente configurado
 */
export function setupBootstrapEnvironment() {
  var env = detectEnvironment();

  return {
    env: env,
    window: getSafeWindow(),
    document: getSafeDocument(),
    localStorage: getSafeStorage('local'),
    sessionStorage: getSafeStorage('session'),
    performance: getSafePerformance(),
    eventBus: _resolveEventBus(env),

    // Helpers
    canUseDOM: env.isBrowser && env.hasDocument,
    canPersist: env.hasLocalStorage || env.hasSessionStorage,
    isProduction: env.isBrowser && env.isSecureContext,

    // Logging
    log: function(level: string, msg: string, data?: unknown) {
      if (typeof console !== 'undefined' && (console as unknown as Record<string, Function>)[level]) {
        if (data) {
          (console as unknown as Record<string, Function>)[level]('[Bootstrap:' + env.type + ']', msg, data);
        } else {
          (console as unknown as Record<string, Function>)[level]('[Bootstrap:' + env.type + ']', msg);
        }
      }
    }
  };
}

// ============================================================================
// HEALTH CHECK & INFO
// ============================================================================

export function healthCheck() {
  var env = detectEnvironment();

  return createHealthResult({
    status: HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      environmentDetected: !!env.type,
      domAvailable: env.hasDocument,
      storageAvailable: env.hasLocalStorage || env.hasSessionStorage
    },
    details: {
      environment: env.type,
      dom: env.hasDocument,
      storage: env.hasLocalStorage || env.hasSessionStorage,
      secureContext: env.isSecureContext
    }
  });
}

export function info() {
  var env = detectEnvironment();

  return {
    version: VERSION,
    moduleId: MODULE_ID,
    environment: env,
    fallbacksAvailable: [
      'MemoryStorage',
      'MockDocument',
      'MockWindow',
      'FallbackEventBus',
      'MockPerformance'
    ]
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  detectEnvironment: detectEnvironment,
  getSafeStorage: getSafeStorage,
  getSafeDocument: getSafeDocument,
  getSafeWindow: getSafeWindow,
  getSafePerformance: getSafePerformance,
  createFallbackEventBus: createFallbackEventBus,
  setupBootstrapEnvironment: setupBootstrapEnvironment,
  healthCheck: healthCheck,
  info: info
};
