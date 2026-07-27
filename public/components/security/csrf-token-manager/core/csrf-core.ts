// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: csrf-token-manager-core
// PURPOSE: CSRF Token Manager - Core v2.1.0-ENTERPRISE-FIX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setMaxAge() — exported function
//   getToken() — exported function
//   setToken() — exported function
//   renewToken() — exported function
//   clearToken() — exported function
//   hasToken() — exported function
//   isFresh() — exported function
//   isStale() — exported function
//   getStatus() — exported function
//   getMetrics() — exported function
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
export const MODULE_ID = 'csrf-token-manager-core';

// Estado interno
let _token: string | null = null;
let _expiresAt: number | null = null;
let _lastRefresh: number | null = null;
let _metrics = { refreshes: 0, renewals: 0, errors: 0 };

// Configuração
const DEFAULT_MAX_AGE = 3600000; // 1 hora em ms
let _maxAge = DEFAULT_MAX_AGE;

// Configura max age
export function setMaxAge(ms: number) {
  _maxAge = ms || DEFAULT_MAX_AGE;
}

// Obtém token
export function getToken() { return _token; }

// Define token
export function setToken(token: string | null, expiresAt: number | null = null) {
  _token = token;
  _lastRefresh = Date.now();
  _expiresAt = expiresAt || (_lastRefresh + _maxAge);
  _metrics.refreshes++;
  
  // Atualiza (window as any).CSRF_TOKEN para compatibilidade
  if (typeof window !== 'undefined') {
    (window as any).CSRF_TOKEN = token;
  }
}

// Renova token (alias para setToken com novo valor)
export function renewToken(newToken: string | null = null) {
  if (newToken) {
    setToken(newToken);
    _metrics.renewals++;
    return true;
  }
  
  // Se não tem novo token, apenas atualiza timestamp
  if (_token) {
    _lastRefresh = Date.now();
    _expiresAt = _lastRefresh + _maxAge;
    _metrics.renewals++;
    return true;
  }
  
  return false;
}

// Limpa token
export function clearToken() {
  _token = null;
  _expiresAt = null;
  _lastRefresh = null;
  
  if (typeof window !== 'undefined') {
    (window as any).CSRF_TOKEN = null;
  }
}

// Verifica se tem token
export function hasToken() { return !!_token; }

// Verifica se token está fresco (não expirado)
export function isFresh() {
  if (!_token) return false;
  if (!_expiresAt) return true;
  return Date.now() < _expiresAt;
}

// Verifica se token está stale (próximo de expirar)
export function isStale() {
  if (!_token) return true;
  if (!_expiresAt) return false;
  
  // Considera stale se falta menos de 10% do tempo
  const remaining = _expiresAt - Date.now();
  return remaining < (_maxAge * 0.1);
}

// Status completo do CSRF
export function getStatus() {
  const now = Date.now();
  const age = _lastRefresh ? now - _lastRefresh : null;
  
  return {
    hasToken: !!_token,
    tokenPreview: _token ? `${_token.substring(0, 8)}...` : null,
    isFresh: isFresh(),
    isStale: isStale(),
    expiresAt: _expiresAt,
    lastRefresh: _lastRefresh,
    age,
    ageFormatted: age ? `${Math.round(age / 1000)}s` : 'N/A',
    remainingMs: _expiresAt ? Math.max(0, _expiresAt - now) : null
  };
}

// Métricas
export function getMetrics() { return { ..._metrics }; }

// Health check
export function healthCheck() {
  const checks = {
    hasToken: !!_token,
    tokenFresh: isFresh(),
    notStale: !isStale()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: `${passed}/${total}`,
    checks,
    metrics: getMetrics(),
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
    status: getStatus(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

export default {
  getToken,
  setToken,
  renewToken,
  clearToken,
  hasToken,
  isFresh,
  isStale,
  getStatus,
  setMaxAge,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
