// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-STRICT-DIAGNOSTIC)
// ═══════════════════════════════════════════════════════════════
// MODULE: main-globals-adapter
// PURPOSE: GlobalsAdapter - Adapter de diagnóstico para acesso a globals
// ───────────────────────────────────────────────────────────────
// @contract ADAPTER_AUTHORIZED - Este é um adapter autorizado
// @contract DIAGNOSTIC_ONLY - Uso somente para diagnóstico/observabilidade
// @contract STRICT_AWARE - Registra violações em modo strict (não bloqueia)
// @note window.* access is INTENTIONAL for diagnostics - NÃO usar em UI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createGlobalsAdapter() — exported function
//   getGlobalsAdapter() — exported function
//   resetGlobalsAdapter() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS (authorized diagnostic - registra em strict):
//   (window as any).AppContext
//   (window as any).EventBus
//   (window as any).GlobalState
//   (window as any).RouterGlobal
//   (window as any).LayoutManager
//   (window as any).Main
// @changelog v1.3.0-STRICT-DIAGNOSTIC: Strict mode awareness, registra violações (NR-FULL)
// @changelog v1.2.0-DIAGNOSTIC-AUTHORIZED: Documentação contrato NR-FULL
// @changelog v1.1.0-P03-AAA: Task P03 documentation
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '1.3.0-STRICT-DIAGNOSTIC';
export const MODULE_ID = 'main-globals-adapter';

// Cache de referências para performance
const _cache = new Map();
const _cacheTimeout = 5000;

// Métricas
const _metrics = {
  globalAccesses: 0,
  cacheHits: 0,
  cacheMisses: 0
};

// Helper para verificar ambiente
function _hasWindow() {
  return typeof window !== 'undefined';
}

function _hasDocument() {
  return typeof document !== 'undefined';
}

// Implementação real
export function createGlobalsAdapter() {
  return {
    // Acesso a globais do window (INTENTIONAL for diagnostics)
    // Em strict mode, registra violação mas não bloqueia (é adapter de diagnóstico)
    getGlobal: (name: string) => {
      _metrics.globalAccesses++;

      if (!_hasWindow()) return null;

      // Registra violação em strict mode (para auditoria)
      if (isStrict()) {
        recordViolation('DIAGNOSTIC_WINDOW_ACCESS', { module: MODULE_ID, globalName: name, diagnostic: true });
      }

      // Cache para globais frequentes
      const cacheKey = `global:${name}`;
      const cached = _cache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp < _cacheTimeout)) {
        _metrics.cacheHits++;
        return cached.value;
      }

      _metrics.cacheMisses++;
      const value = (window as unknown as Record<string, unknown>)[name] || null;
      _cache.set(cacheKey, { value, timestamp: Date.now() });
      return value;
    },

    hasGlobal: (name: string) => {
      if (!_hasWindow()) return false;
      return name in window && (window as unknown as Record<string, unknown>)[name] !== undefined;
    },

    // Acesso ao document
    getDocument: () => _hasDocument() ? document : null,

    // Acesso ao body
    getBody: () => _hasDocument() && document.body ? document.body : null,

    // Acesso a atributos do body
    getBodyAttribute: (attr: string) => {
      if (!_hasDocument() || !document.body) return null;
      return document.body.getAttribute(attr);
    },

    // Acesso ao dataset do body
    getBodyDataset: () => {
      if (!_hasDocument() || !document.body) return {};
      return { ...document.body.dataset };
    },

    // Verificação de autenticação via body attributes
    isAuthenticatedViaBody: () => {
      if (!_hasDocument() || !document.body) return false;
      if (document.body.getAttribute('data-auth-ready') === 'true') return true;
      if (document.body.dataset && document.body.dataset.state === 'authenticated') return true;
      return false;
    },

    // Acesso a módulos globais conhecidos (INTENTIONAL for diagnostics/observability)
    getSessionManager: () => {
      if (!_hasWindow()) return null;
      return (window as any).SessionManager || null;
    },

    getAppContext: () => {
      if (!_hasWindow()) return null;
      return (window as any).AppContext || null;
    },

    // NOTE: These getters are for DIAGNOSTIC purposes only
    // Components should use Ports pattern for actual EventBus/Router access
    getEventBus: () => {
      if (!_hasWindow()) return null;
      return (window as any).EventBus || null;
    },

    // @contract DIAGNOSTIC_ONLY - Use Ports.get('router') for normal access
    getRouterGlobal: () => {
      if (!_hasWindow()) return null;
      return (window as any).RouterGlobal || null;
    },

    // @contract DIAGNOSTIC_ONLY - Use Ports.get('globalState') for normal access
    getGlobalState: () => {
      if (!_hasWindow()) return null;
      return (window as any).GlobalState || null;
    },

    getMain: () => {
      if (!_hasWindow()) return null;
      return (window as any).Main || null;
    },

    getSidebar: () => {
      if (!_hasWindow()) return null;
      return (window as any).Sidebar || null;
    },

    getSidebarRegistry: () => {
      if (!_hasWindow()) return null;
      return (window as any).SidebarRegistry || null;
    },

    getLayoutManager: () => {
      if (!_hasWindow()) return null;
      return (window as any).LayoutManager || null;
    },

    // Limpar cache
    clearCache: () => {
      _cache.clear();
      return { ok: true };
    },

    // Diagnósticos
    getMetrics: () => ({ ..._metrics }),

    healthCheck: () => {
      const hasWindow = _hasWindow();
      const hasDocument = _hasDocument();
      const hasBody = _hasDocument() && !!document.body;
      const strictMode = isStrict();

      return {
        status: hasWindow && hasDocument ? 'HEALTHY' : 'DEGRADED',
        version: VERSION,
        moduleId: MODULE_ID,
        contractType: 'DIAGNOSTIC_AUTHORIZED',
        diagnosticAdapter: true,
        strictMode,
        checks: {
          hasWindow,
          hasDocument,
          hasBody,
          cacheSize: _cache.size
        },
        metrics: { ..._metrics }
      };
    },

    info: () => ({
      version: VERSION,
      moduleId: MODULE_ID,
      type: 'real',
      contractType: 'DIAGNOSTIC_AUTHORIZED',
      diagnosticAdapter: true,
      strictMode: isStrict(),
      note: 'window.* access is INTENTIONAL for diagnostics only - violations are recorded in strict mode',
      environment: {
        hasWindow: _hasWindow(),
        hasDocument: _hasDocument(),
        hasBody: _hasDocument() && !!document.body
      },
      cacheSize: _cache.size,
      metrics: { ..._metrics }
    })
  };
}

// Singleton para uso global
let _instance: ReturnType<typeof createGlobalsAdapter> | null = null;

export function getGlobalsAdapter() {
  if (!_instance) {
    _instance = createGlobalsAdapter();
  }
  return _instance;
}

export function resetGlobalsAdapter() {
  if (_instance) {
    _instance.clearCache();
  }
  _instance = null;
}

export default {
  createGlobalsAdapter,
  getGlobalsAdapter,
  resetGlobalsAdapter,
  VERSION,
  MODULE_ID
};
