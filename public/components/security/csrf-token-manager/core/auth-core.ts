// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: csrf-token-manager-auth-core
// PURPOSE: CSRF Token Manager - Auth Core v2.1.0-ENTERPRISE-FIX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setTokenStore() — exported function
//   isAuthenticated() — exported function
//   setAuthenticated() — exported function
//   getUser() — exported function
//   setBearerToken() — exported function
//   getBearerToken() — exported function
//   logout() — exported function
//   getHeaders() — exported function
//   getAuthHeaders() — exported function
//   hasValidAuthHeaders() — exported function
//   getHeadersInfo() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).CSRF_TOKEN
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-ENTERPRISE-FIX';
export const MODULE_ID = 'csrf-token-manager-auth-core';

// Estado interno
let _authenticated = false;
let _user: Record<string, unknown> | null = null;
let _bearerToken: string | null = null;

// Referência ao store (será injetado)
let _tokenStore: Record<string, unknown> | null = null;

// Configura store de token
export function setTokenStore(store: Record<string, unknown> | null) {
  _tokenStore = store;
}

// Autenticação básica
export function isAuthenticated() { return _authenticated; }

export function setAuthenticated(val: boolean, user: Record<string, unknown> | null = null) {
  _authenticated = val;
  _user = user;
}

export function getUser() { return _user; }

export function setBearerToken(token: string | null) {
  _bearerToken = token;
}

export function getBearerToken() {
  // Tenta obter do tokenStore primeiro, depois do estado local
  if (_tokenStore && typeof _tokenStore.get === 'function') {
    return _tokenStore.get('bearerToken') || _bearerToken;
  }
  return _bearerToken;
}

export function logout() {
  _authenticated = false;
  _user = null;
  _bearerToken = null;
}

// Obtém CSRF token do store global ou window
function _getCsrfToken() {
  // Tenta várias fontes
  if (_tokenStore && typeof _tokenStore.get === 'function') {
    const token = _tokenStore.get('csrfToken');
    if (token) return token;
  }
  
  // Tenta (window as any).CSRF_TOKEN
  if (typeof window !== 'undefined' && (window as any).CSRF_TOKEN) {
    return (window as any).CSRF_TOKEN;
  }
  
  // Tenta meta tag
  if (typeof document !== 'undefined') {
    const meta = document.querySelector('meta[name="csrf-token"]');
    if (meta) return meta.getAttribute('content');
  }
  
  return null;
}

// Headers apenas com CSRF
export function getHeaders(): Record<string, string> {
  const csrfToken = _getCsrfToken();

  if (!csrfToken) {
    return {};
  }

  return {
    'X-CSRF-TOKEN': csrfToken,
    'X-Requested-With': 'XMLHttpRequest'
  };
}

// Headers com CSRF + Authorization Bearer
export function getAuthHeaders(): Record<string, string> {
  const headers = getHeaders();
  const bearer = getBearerToken();

  if (bearer) {
    headers['Authorization'] = `Bearer ${bearer}`;
  }

  return headers;
}

// Verifica se tem headers válidos
export function hasValidAuthHeaders() {
  const headers = getAuthHeaders();
  return !!headers['X-CSRF-TOKEN'] || !!headers['Authorization'];
}

// Info sobre headers disponíveis
export function getHeadersInfo() {
  const csrfToken = _getCsrfToken();
  const bearer = getBearerToken();
  
  return {
    hasCsrfToken: !!csrfToken,
    hasBearerToken: !!bearer,
    csrfTokenPreview: csrfToken ? `${csrfToken.substring(0, 8)}...` : null,
    bearerTokenPreview: bearer ? `${bearer.substring(0, 8)}...` : null,
    headersAvailable: hasValidAuthHeaders()
  };
}

// Health check
export function healthCheck() {
  const checks = {
    hasState: true,
    hasCsrfToken: !!_getCsrfToken(),
    hasBearerToken: !!getBearerToken()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= 2 ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
    authenticated: _authenticated,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

// Info
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    authenticated: _authenticated,
    hasUser: !!_user,
    headersInfo: getHeadersInfo(),
    timestamp: Date.now()
  };
}

export default {
  isAuthenticated,
  setAuthenticated,
  getUser,
  setBearerToken,
  getBearerToken,
  logout,
  setTokenStore,
  getHeaders,
  getAuthHeaders,
  hasValidAuthHeaders,
  getHeadersInfo,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
