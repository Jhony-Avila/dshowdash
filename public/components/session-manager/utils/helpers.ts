// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-helpers
// PURPOSE: Session Manager - Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   log from ../ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   deepClone() — exported function
//   generateSessionId() — exported function
//   calculateExpiresAt() — exported function
//   isSessionExpired() — exported function
//   isTokenExpiringSoon() — exported function
//   isTokenExpired() — exported function
//   parseJWT() — exported function
//   getJWTExpiration() — exported function
//   sanitizeUser() — exported function
//   formatSessionDuration() — exported function
//   safeCall() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { log } from '../ports.js';

export const VERSION = '5.2.0-ENTERPRISE';
export const MODULE_ID = 'session-helpers';

const _metrics = { deepClones: 0, sessionIdsGenerated: 0, jwtParses: 0, jwtParseErrors: 0, sanitizations: 0, safeCallErrors: 0 };

export function deepClone(obj: unknown) { _metrics.deepClones++; if (obj === null || typeof obj !== 'object') return obj; try { return JSON.parse(JSON.stringify(obj)); } catch (e) { return obj; } }
export function generateSessionId() { _metrics.sessionIdsGenerated++; return `sess-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`; }
export function calculateExpiresAt(expiresInSeconds: number = 604800) { return Date.now() + (expiresInSeconds * 1000); }
export function isSessionExpired(lastActivity: number | null, timeoutMs: number = 1800000) { if (!lastActivity) return true; return (Date.now() - lastActivity) > timeoutMs; }
export function isTokenExpiringSoon(expiresAt: number | null, thresholdMs: number = 300000) { if (!expiresAt) return false; return (expiresAt - Date.now()) < thresholdMs; }
export function isTokenExpired(expiresAt: number | null) { if (!expiresAt) return true; return Date.now() >= expiresAt; }

export function parseJWT(token: string | null) {
  _metrics.jwtParses++;
  if (!token || typeof token !== 'string') return null;
  try { const parts = token.split('.'); if (parts.length !== 3) return null; return JSON.parse(atob(parts[1])); }
  catch (e) { _metrics.jwtParseErrors++; return null; }
}

export function getJWTExpiration(token: string | null) { const payload: any = parseJWT(token); if (!payload || !payload.exp) return null; return payload.exp * 1000; }

export function sanitizeUser(user: unknown) {
  _metrics.sanitizations++;
  if (!user) return null;
  const sanitized: Record<string, unknown> = Object.assign({}, user as Record<string, unknown>);
  delete sanitized.password; delete sanitized.senha; delete sanitized.hash; delete sanitized.secret;
  return sanitized;
}

export function formatSessionDuration(startTime: number | null) {
  if (!startTime) return '0s';
  const durationMs = Date.now() - startTime;
  const seconds = Math.floor(durationMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  if (hours > 0) return `${hours}h ${minutes % 60}m`;
  if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
  return `${seconds}s`;
}

export function safeCall(fn: () => unknown, fallback: unknown = null) { try { return fn(); } catch (e) { _metrics.safeCallErrors++; log.warn('safeCall error', { error: (e as Error).message }); return fallback; } }
export function getVersion() { return VERSION; }

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), jwtParseSuccessRate: _metrics.jwtParses > 0 ? `${(((_metrics.jwtParses - _metrics.jwtParseErrors) / _metrics.jwtParses) * 100).toFixed(1)}%` : 'N/A', timestamp: Date.now() };
}

export function healthCheck() {
  const checks = { functionsAvailable: typeof deepClone === 'function' && typeof parseJWT === 'function', lowJwtParseErrors: _metrics.jwtParses === 0 || (_metrics.jwtParseErrors / _metrics.jwtParses) < 0.3, lowSafeCallErrors: _metrics.safeCallErrors < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export default { deepClone, generateSessionId, calculateExpiresAt, isSessionExpired, isTokenExpiringSoon, isTokenExpired, parseJWT, getJWTExpiration, sanitizeUser, formatSessionDuration, safeCall, getVersion, info, healthCheck, VERSION, MODULE_ID };
