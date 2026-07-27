// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.4.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-dom-adapter
// PURPOSE: DOMAdapter - Gerenciamento de DOM Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createDOMAdapter() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 3.4.0-STRICT-MODE
// @changelog v3.4.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v3.3.0-P0-ENTERPRISE - Logger via Ports (elimina window.Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '3.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'main-dom-adapter';

// P0 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

// v3.1.0: SAFE selectors only - no generic 'main' or '.main-content' that could match wrong elements
const MAIN_SELECTORS = [
  '#shell-main-region',
  '[data-region="main"]',
  '[data-shell-region="main"]'
  // REMOVED: 'main' - too generic, could match any <main> tag
  // REMOVED: '.main-content' - too generic, could match wrong element
];

const QUERY_CACHE_TTL_MS = 500;
const MAX_POOL_SIZE = 50;

export function createDOMAdapter(deps: Record<string, unknown> = {}) {
  const _document = (deps.document || (typeof document !== 'undefined' ? document : null)) as Document | null;
  let _container: HTMLElement | null = null;

  // Element pool para reutilização
  const _elementPool = new Map();

  // Query cache com TTL
  const _queryCache = new Map();

  // Métricas enriquecidas
  const _metrics = {
    elementsCreated: 0,
    elementsPooled: 0,
    elementsReused: 0,
    queriesExecuted: 0,
    queriesCached: 0,
    renders: 0,
    fragmentsCreated: 0,
    errors: 0,
    unsafeRendersPrevented: 0
  };

  function _getFromPool(tagName: string) {
    const pool = _elementPool.get(tagName);
    if (pool && pool.length > 0) {
      _metrics.elementsReused++;
      const el = pool.pop();
      el.className = '';
      el.id = '';
      el.textContent = '';
      el.innerHTML = '';
      while (el.attributes.length > 0) {
        el.removeAttribute(el.attributes[0].name);
      }
      return el;
    }
    return null;
  }

  function _returnToPool(element: HTMLElement) {
    if (!element || !element.tagName) return;

    const tagName = element.tagName.toLowerCase();
    if (!_elementPool.has(tagName)) {
      _elementPool.set(tagName, []);
    }

    const pool = _elementPool.get(tagName);
    if (pool.length < MAX_POOL_SIZE) {
      pool.push(element);
      _metrics.elementsPooled++;
    }
  }

  function _getCachedQuery(selector: string, context: HTMLElement | null) {
    const cacheKey = `${selector}:${context?.id || 'doc'}`;
    const cached = _queryCache.get(cacheKey);

    if (cached && (Date.now() - cached.timestamp) < QUERY_CACHE_TTL_MS) {
      if (_document!.contains(cached.element)) {
        _metrics.queriesCached++;
        return cached.element;
      }
    }

    return null;
  }

  function _setCachedQuery(selector: string, context: HTMLElement | null, element: HTMLElement) {
    const cacheKey = `${selector}:${context?.id || 'doc'}`;
    _queryCache.set(cacheKey, { element, timestamp: Date.now() });
  }

  // v3.1.0: Check if element is safe to render into (not #app, not body, not document)
  function _isSafeRenderTarget(element: HTMLElement | null) {
    if (!element) return false;
    if (element === _document?.body) return false;
    if (element === _document?.documentElement) return false;
    if (element.id === 'app') return false;
    if (element.id === 'app-shell') return false;
    // Must be inside shell-main-region or have specific data attributes
    const isShellRegion = ['shell-main-region', 'main'].includes(element.id) ||
                          element.dataset.region === 'main' ||
                          element.getAttribute('data-shell-region') === 'main';
    const isInsideShellRegion = element.closest('#shell-main-region, [data-region="main"], #main') !== null;
    return isShellRegion || isInsideShellRegion;
  }

  return {
    selectMainContainer() {
      if (!_document) return null;
      if (_container && _document.contains(_container)) return _container;

      for (const selector of MAIN_SELECTORS) {
        const el = _document.querySelector(selector);
        if (el && _isSafeRenderTarget(el as HTMLElement)) {
          _container = el as HTMLElement;
          return el as HTMLElement;
        }
      }
      return null;
    },

    createElement(tagName: string, options: Record<string, unknown> = {}) {
      if (!_document) return null;

      // Tentar reutilizar do pool
      let el = options.usePool !== false ? _getFromPool(tagName) : null;

      if (!el) {
        el = _document.createElement(tagName);
        _metrics.elementsCreated++;
      }

      if (options.className) el.className = options.className;
      if (options.id) el.id = options.id;
      if (options.textContent) el.textContent = options.textContent;
      if (options.innerHTML) el.innerHTML = options.innerHTML;
      if (options.type) el.type = options.type;
      if (options.title) el.title = options.title;
      if (options.style) Object.assign(el.style, options.style);

      if (options.attributes) {
        for (const [key, value] of Object.entries(options.attributes)) {
          el.setAttribute(key, value);
        }
      }

      if (options.dataset) {
        for (const [key, value] of Object.entries(options.dataset)) {
          el.dataset[key] = value;
        }
      }

      if (options.events) {
        for (const [event, handler] of Object.entries(options.events)) {
          el.addEventListener(event, handler);
        }
      }

      return el;
    },

    // Criar DocumentFragment para batch DOM operations
    createFragment() {
      if (!_document) return null;
      _metrics.fragmentsCreated++;
      return _document.createDocumentFragment();
    },

    // Builder para criar estruturas complexas
    buildElement(config: Record<string, unknown>) {
      if (!config || !config.tag) return null;

      // @ts-expect-error strict migration — TS2345
      const el = this.createElement(config.tag, config);

      if (config.children) {
        const fragment = this.createFragment();
        (config.children as Record<string, unknown>[]).forEach((childConfig: Record<string, unknown>) => {
          const child = this.buildElement(childConfig);
          if (child) fragment!.appendChild(child);
        });
        el.appendChild(fragment);
      }

      return el;
    },

    querySelector(selector: string, context: HTMLElement | null = null) {
      if (!_document) return null;

      // Verificar cache
      const cached = _getCachedQuery(selector, context);
      if (cached) return cached;

      _metrics.queriesExecuted++;
      const root = context || _document;
      const result = root.querySelector(selector);

      if (result) {
        _setCachedQuery(selector, context, result as HTMLElement);
      }

      return result;
    },

    querySelectorAll(selector: string, context: HTMLElement | null = null) {
      if (!_document) return [];
      _metrics.queriesExecuted++;
      const root = context || _document;
      return Array.from(root.querySelectorAll(selector));
    },

    render(html: string | HTMLElement | DocumentFragment) {
      const container = this.selectMainContainer();
      const logger = _getLogger();

      // v3.1.0: CRITICAL safety check
      if (!container) {
        _metrics.errors++;
        if (logger?.warn) {
          logger.warn('[DOMAdapter] render() called but no safe container found - preventing unsafe render');
        } else if (!isStrict()) {
          console.warn('[DOMAdapter] render() called but no safe container found - preventing unsafe render');
        }
        return null;
      }

      if (!_isSafeRenderTarget(container)) {
        _metrics.unsafeRendersPrevented++;
        if (!isStrict()) {
          console.error('[DOMAdapter] BLOCKED: Attempted to render into unsafe target:', container.id || container.tagName);
        }
        return null;
      }

      _metrics.renders++;

      if (typeof html === 'string') {
        container.innerHTML = html;
      } else if (html instanceof HTMLElement || html instanceof DocumentFragment) {
        container.innerHTML = '';
        container.appendChild(html);
      }
      return container;
    },

    appendChild(parent: HTMLElement, child: HTMLElement | DocumentFragment) {
      if (!parent || !child) return false;
      parent.appendChild(child);
      return true;
    },

    insertBefore(parent: HTMLElement, newNode: HTMLElement, referenceNode: HTMLElement | null) {
      if (!parent || !newNode) return false;
      parent.insertBefore(newNode, referenceNode || null);
      return true;
    },

    // Remove e retorna ao pool
    removeElement(element: HTMLElement, returnToPool = true) {
      if (!element?.parentNode) return false;
      element.parentNode.removeChild(element);
      if (returnToPool) _returnToPool(element);
      return true;
    },

    // Substituir elemento
    replaceElement(oldElement: HTMLElement, newElement: HTMLElement) {
      if (!oldElement?.parentNode || !newElement) return false;
      oldElement.parentNode.replaceChild(newElement, oldElement);
      _returnToPool(oldElement);
      return true;
    },

    contains(element: HTMLElement) {
      if (!_document || !element) return false;
      return _document.contains(element);
    },

    clear() {
      const container = this.selectMainContainer();
      if (container && _isSafeRenderTarget(container)) {
        // Pool elements antes de limpar
        Array.from(container.children).forEach(child => _returnToPool(child as HTMLElement));
        container.innerHTML = '';
      }
    },

    // Limpar caches
    clearCache() {
      _queryCache.clear();
    },

    // Limpar pool
    clearPool() {
      _elementPool.clear();
    },

    getContainer() { return _container; },
    getDocument() { return _document; },

    getMetrics() {
      const reuseRate = (_metrics.elementsCreated + _metrics.elementsReused) > 0
        ? Math.round((_metrics.elementsReused / (_metrics.elementsCreated + _metrics.elementsReused)) * 100)
        : 0;
      const cacheHitRate = (_metrics.queriesExecuted + _metrics.queriesCached) > 0
        ? Math.round((_metrics.queriesCached / (_metrics.queriesExecuted + _metrics.queriesCached)) * 100)
        : 0;

      let poolSize = 0;
      _elementPool.forEach(pool => poolSize += pool.length);

      return {
        ..._metrics,
        poolSize,
        queryCacheSize: _queryCache.size,
        reuseRate: `${reuseRate}%`,
        cacheHitRate: `${cacheHitRate}%`
      };
    },

    info() {
      return {
        version: VERSION, moduleId: MODULE_ID,
        hasDocument: !!_document, hasContainer: !!_container,
        containerSelector: _container?.id || _container?.className || null,
        metrics: this.getMetrics(),
        safeSelectorsOnly: true,
        strictMode: isStrict()
      };
    },

    healthCheck() {
      const hasDocument = !!_document;
      const hasContainer = !!this.selectMainContainer();
      const errorRate = _metrics.renders > 0 ? (_metrics.errors / _metrics.renders) * 100 : 0;

      let status = 'HEALTHY';
      if (!hasContainer) status = 'DEGRADED';
      if (!hasDocument) status = 'UNHEALTHY';
      if (errorRate > 10) status = 'DEGRADED';

      return {
        status, version: VERSION, moduleId: MODULE_ID,
        checks: {
          hasDocument,
          hasContainer,
          containerInDOM: hasContainer && _document?.contains(_container),
          errorRate: `${Math.round(errorRate)}%`,
          unsafeRendersPrevented: _metrics.unsafeRendersPrevented
        },
        metrics: this.getMetrics(),
        strictMode: isStrict()
      };
    },

    destroy() {
      _queryCache.clear();
      _elementPool.clear();
      _container = null;
    }
  };
}

export default { createDOMAdapter, VERSION, MODULE_ID };
