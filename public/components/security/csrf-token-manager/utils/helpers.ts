// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: csrf-token-manager-helpers
// PURPOSE: CSRF Token Manager - Helpers v2.1.0-ENTERPRISE-FIX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isBrowser() — exported function
//   getTimestamp() — exported function
//   maskToken() — exported function
//   extractTokenFromMeta() — exported function
//   isTokenExpired() — exported function
//   getTimeRemaining() — exported function
//   formatDuration() — exported function
//   generateId() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-ENTERPRISE-FIX';
export const MODULE_ID = 'csrf-token-manager-helpers';

// Verifica se está em ambiente browser
export function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

// Obtém timestamp atual
export function getTimestamp() {
  return Date.now();
}

// Mascara token para exibição segura
export function maskToken(token: string | null, visibleChars = 8) {
  if (!token || typeof token !== 'string') return null;
  if (token.length <= visibleChars) return '***';
  return `${token.substring(0, visibleChars)}...`;
}

// Extrai token da meta tag
export function extractTokenFromMeta() {
  if (!isBrowser()) return null;
  const meta = document.querySelector('meta[name="csrf-token"]');
  return (meta as HTMLMetaElement)?.content || null;
}

// Verifica se token expirou
export function isTokenExpired(expiresAt: number | null) {
  return expiresAt && Date.now() > expiresAt;
}

// Calcula tempo restante até expiração
export function getTimeRemaining(expiresAt: number | null) {
  if (!expiresAt) return null;
  const remaining = expiresAt - Date.now();
  return Math.max(0, remaining);
}

// Formata duração em ms para string legível
export function formatDuration(ms: number | null | undefined) {
  if (ms === null || ms === undefined) return 'N/A';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  return `${Math.round(ms / 60000)}m`;
}

// Gera ID único
export function generateId(prefix = 'csrf') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Health check
export function healthCheck() {
  const checks = {
    available: true,
    browserEnv: isBrowser()
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${total}`,
    checks,
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
    helpers: ['isBrowser', 'getTimestamp', 'maskToken', 'extractTokenFromMeta', 'isTokenExpired', 'getTimeRemaining', 'formatDuration', 'generateId'],
    timestamp: Date.now()
  };
}

export default {
  isBrowser,
  getTimestamp,
  maskToken,
  extractTokenFromMeta,
  isTokenExpired,
  getTimeRemaining,
  formatDuration,
  generateId,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
