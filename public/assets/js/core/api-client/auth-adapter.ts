// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (4.0.0-FASE-B)
// ═══════════════════════════════════════════════════════════════
// MODULE: api-client-auth-adapter
// PURPOSE: Facade sobre SecurityCSRF e GlobalState para autenticação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   AuthAdapter — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core
// ═══════════════════════════════════════════════════════════════
'use strict';

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export var VERSION = '4.0.0-FASE-B';
export var MODULE_ID = 'api-client-auth-adapter';

export function getVersion() { return VERSION; }

// ============================================================================
// RESOLVERS (Core.windowAdapter only in strict mode)
// ============================================================================

/**
 * Resolve SecurityCSRF
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function getSecurityCSRF() {
  if (typeof window === 'undefined') return null;

  // Primary: Core.windowAdapter (único canal autorizado — Fase B)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var csrf = window.Core.windowAdapter.get('SecurityCSRF');
    if (csrf) return csrf;
  }

  return null;
}

/**
 * Resolve GlobalState via Core.windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function getGlobalState() {
  if (typeof window === 'undefined') return null;

  // Primary: Core.windowAdapter (único canal autorizado — Fase B)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var gs = window.Core.windowAdapter.get('GlobalState');
    if (gs) return gs;
  }

  return null;
}

/**
 * Resolve RouterGlobal via Core.windowAdapter
 * @contract STRICT_MODE - Em modo strict, sem fallback para window.*
 * @returns {Object|null}
 */
function getRouter() {
  if (typeof window === 'undefined') return null;

  // Primary: Core.windowAdapter (único canal autorizado — Fase B)
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var router = window.Core.windowAdapter.get('RouterGlobal');
    if (router) return router;
  }

  return null;
}

// ============================================================================
// AUTH HELPERS
// ============================================================================

function getAuthSource() {
  var gs = getGlobalState();
  if (gs && gs.isAuthenticated && gs.isAuthenticated()) return 'GlobalState';
  if (typeof document !== 'undefined' && document.body && document.body.dataset.authReady === 'true') return 'DOM';
  return 'none';
}

function getSessionData() {
  var gs = getGlobalState();
  if (!gs) return null;
  try {
    if (gs.getAuthContext) return gs.getAuthContext();
    if (gs.getSession) return gs.getSession();
  } catch (e) {}
  return null;
}

function isAuthenticated() {
  var gs = getGlobalState();
  if (gs && gs.isAuthenticated) return gs.isAuthenticated();
  if (typeof document !== 'undefined') return document.body && document.body.dataset.authReady === 'true';
  return false;
}

function getUserId() {
  var session = getSessionData();
  if (!session) return null;
  return session.userId || (session.user ? session.user.id : null) || null;
}

// ============================================================================
// NAVIGATION CONTEXT
// ============================================================================

function getNavigationContext() {
  var router = getRouter();
  if (router && router.current) {
    try {
      var route = router.current();
      return { currentRoute: (route && route.path) || '/', activePanel: (route && route.panel) || null };
    } catch (e) {}
  }
  var gs = getGlobalState();
  if (gs && gs.getState) {
    try {
      var state = gs.getState();
      return { currentRoute: (state && state.navigation && state.navigation.currentRoute) || '/', activePanel: (state && state.navigation && state.navigation.activePanel) || null };
    } catch (e) {}
  }
  return { currentRoute: '/', activePanel: null };
}

// ============================================================================
// CSRF / AUTH HEADERS
// ============================================================================

function getAuthHeaders() {
  var csrf = getSecurityCSRF();
  if (csrf && csrf.getAuthHeaders) {
    try { return csrf.getAuthHeaders(); }
    catch (e) {}
  }
  return {};
}

function getCSRFToken() {
  var csrf = getSecurityCSRF();
  if (csrf && csrf.getToken) return csrf.getToken();
  return null;
}

// ============================================================================
// AUTH ERROR HANDLING
// ============================================================================

function handleAuthError(status: number, meta: Record<string, unknown> = {}) {
  if (!meta) meta = {};
  var csrf = getSecurityCSRF();
  if (!csrf || !csrf.emitLoginRequired) return false;
  var navContext = getNavigationContext();
  var context = Object.assign({}, meta, navContext, { userId: getUserId(), timestamp: Date.now() });
  if (status === 401) { csrf.emitLoginRequired('api-401', context); return true; }
  if (status === 403) {
    if (!isAuthenticated()) { csrf.emitLoginRequired('api-403-unauthenticated', context); return true; }
  }
  return false;
}

function emitLoginRequired(reason: string, meta: Record<string, unknown> = {}) {
  if (!meta) meta = {};
  var csrf = getSecurityCSRF();
  if (csrf && csrf.emitLoginRequired) {
    var navContext = getNavigationContext();
    return csrf.emitLoginRequired(reason, Object.assign({}, meta, navContext, { source: MODULE_ID, timestamp: Date.now() }));
  }
  return false;
}

// ============================================================================
// PUBLIC API
// ============================================================================

export function info() {
  var csrf = getSecurityCSRF();
  var gs = getGlobalState();
  var router = getRouter();
  var strictMode = isStrict();
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    authSource: getAuthSource(),
    isAuthenticated: isAuthenticated(),
    userId: getUserId(),
    hasCSRF: !!getCSRFToken(),
    hasSecurityCSRF: !!csrf,
    hasGlobalState: !!gs,
    hasRouter: !!router,
    navigation: getNavigationContext(),
    strictMode: strictMode,
    // v3.3.0: Indica se está usando Core.windowAdapter (único em strict)
    resolutionMethod: (typeof window !== 'undefined' && window.Core && window.Core.windowAdapter) ? 'Core.windowAdapter' : (strictMode ? 'none (strict)' : 'window.fallback')
  };
}

export function healthCheck() {
  var strictMode = isStrict();
  var hasWindowAdapter = !!(typeof window !== 'undefined' && window.Core && window.Core.windowAdapter);
  return {
    status: hasWindowAdapter ? 'HEALTHY' : (strictMode ? 'DEGRADED' : 'HEALTHY'),
    moduleId: MODULE_ID,
    version: VERSION,
    strictMode: strictMode,
    checks: {
      getAuthSourceReady: typeof getAuthSource === 'function',
      isAuthenticatedReady: typeof isAuthenticated === 'function',
      getAuthHeadersReady: typeof getAuthHeaders === 'function',
      coreWindowAdapterAvailable: hasWindowAdapter,
      strictModeCompliant: !strictMode || hasWindowAdapter
    }
  };
}

export var AuthAdapter = {
  getVersion: getVersion,
  getAuthSource: getAuthSource,
  getSessionData: getSessionData,
  isAuthenticated: isAuthenticated,
  getUserId: getUserId,
  getNavigationContext: getNavigationContext,
  getAuthHeaders: getAuthHeaders,
  getCSRFToken: getCSRFToken,
  handleAuthError: handleAuthError,
  emitLoginRequired: emitLoginRequired,
  info: info,
  healthCheck: healthCheck
};

export default AuthAdapter;
