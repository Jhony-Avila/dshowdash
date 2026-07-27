import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "1.3.0-STRICT-DIAGNOSTIC";
const MODULE_ID = "main-globals-adapter";
const _cache = /* @__PURE__ */ new Map();
const _cacheTimeout = 5e3;
const _metrics = {
  globalAccesses: 0,
  cacheHits: 0,
  cacheMisses: 0
};
function _hasWindow() {
  return typeof window !== "undefined";
}
function _hasDocument() {
  return typeof document !== "undefined";
}
function createGlobalsAdapter() {
  return {
    // Acesso a globais do window (INTENTIONAL for diagnostics)
    // Em strict mode, registra violação mas não bloqueia (é adapter de diagnóstico)
    getGlobal: (name) => {
      _metrics.globalAccesses++;
      if (!_hasWindow()) return null;
      if (isStrict()) {
        recordViolation("DIAGNOSTIC_WINDOW_ACCESS", { module: MODULE_ID, globalName: name, diagnostic: true });
      }
      const cacheKey = `global:${name}`;
      const cached = _cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < _cacheTimeout) {
        _metrics.cacheHits++;
        return cached.value;
      }
      _metrics.cacheMisses++;
      const value = window[name] || null;
      _cache.set(cacheKey, { value, timestamp: Date.now() });
      return value;
    },
    hasGlobal: (name) => {
      if (!_hasWindow()) return false;
      return name in window && window[name] !== void 0;
    },
    // Acesso ao document
    getDocument: () => _hasDocument() ? document : null,
    // Acesso ao body
    getBody: () => _hasDocument() && document.body ? document.body : null,
    // Acesso a atributos do body
    getBodyAttribute: (attr) => {
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
      if (document.body.getAttribute("data-auth-ready") === "true") return true;
      if (document.body.dataset && document.body.dataset.state === "authenticated") return true;
      return false;
    },
    // Acesso a módulos globais conhecidos (INTENTIONAL for diagnostics/observability)
    getSessionManager: () => {
      if (!_hasWindow()) return null;
      return window.SessionManager || null;
    },
    getAppContext: () => {
      if (!_hasWindow()) return null;
      return window.AppContext || null;
    },
    // NOTE: These getters are for DIAGNOSTIC purposes only
    // Components should use Ports pattern for actual EventBus/Router access
    getEventBus: () => {
      if (!_hasWindow()) return null;
      return window.EventBus || null;
    },
    // @contract DIAGNOSTIC_ONLY - Use Ports.get('router') for normal access
    getRouterGlobal: () => {
      if (!_hasWindow()) return null;
      return window.RouterGlobal || null;
    },
    // @contract DIAGNOSTIC_ONLY - Use Ports.get('globalState') for normal access
    getGlobalState: () => {
      if (!_hasWindow()) return null;
      return window.GlobalState || null;
    },
    getMain: () => {
      if (!_hasWindow()) return null;
      return window.Main || null;
    },
    getSidebar: () => {
      if (!_hasWindow()) return null;
      return window.Sidebar || null;
    },
    getSidebarRegistry: () => {
      if (!_hasWindow()) return null;
      return window.SidebarRegistry || null;
    },
    getLayoutManager: () => {
      if (!_hasWindow()) return null;
      return window.LayoutManager || null;
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
        status: hasWindow && hasDocument ? "HEALTHY" : "DEGRADED",
        version: VERSION,
        moduleId: MODULE_ID,
        contractType: "DIAGNOSTIC_AUTHORIZED",
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
      type: "real",
      contractType: "DIAGNOSTIC_AUTHORIZED",
      diagnosticAdapter: true,
      strictMode: isStrict(),
      note: "window.* access is INTENTIONAL for diagnostics only - violations are recorded in strict mode",
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
let _instance = null;
function getGlobalsAdapter() {
  if (!_instance) {
    _instance = createGlobalsAdapter();
  }
  return _instance;
}
function resetGlobalsAdapter() {
  if (_instance) {
    _instance.clearCache();
  }
  _instance = null;
}
var GlobalsAdapter_default = {
  createGlobalsAdapter,
  getGlobalsAdapter,
  resetGlobalsAdapter,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createGlobalsAdapter,
  GlobalsAdapter_default as default,
  getGlobalsAdapter,
  resetGlobalsAdapter
};
