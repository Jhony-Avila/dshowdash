// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-global-helpers
// PURPOSE: Logger Global - Helpers v3.3.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   generateCorrelationId() — exported function
//   setCorrelationId() — exported function
//   getCorrelationId() — exported function
//   ensureCorrelationId() — exported function
//   setUserId() — exported function
//   getUserId() — exported function
//   getUserRole() — exported function
//   clearUser() — exported function
//   setSessionId() — exported function
//   getSessionId() — exported function
//   sanitizeSensitiveData() — exported function
//   anonymizeId() — exported function
//   maskEmail() — exported function
//   getLocalTimeFormatted() — exported function
//   getLocalTimeWithOffset() — exported function
//   safeStringify() — exported function
//   extractComponentName() — exported function
//   getTimestamp() — exported function
//   generateId() — exported function
//   truncate() — exported function
//   isDebugMode() — exported function
//   getBootId() — exported function
//   getEnvironment() — exported function
//   getCurrentRoute() — exported function
//   getTraceId() — exported function
//   normalizeMessage() — exported function
//   mergeContext() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   sessionStorage
//   window.APP_CONFIG
//   (window as any).Environment
//   (window as any).Telemetry
//   (window as any).__BOOT_ID__
//   (window as any).__CORRELATION_ID__
//   (window as any).__CURRENT_ROUTE__
//   (window as any).__CURRENT_TRACE_ID__
//   (window as any).__SESSION_ID__
//   (window as any).__USER_ID__
//   (window as any).__USER_ROLE__
// ═══════════════════════════════════════════════════════════════
'use strict';

export var VERSION = '3.3.0-ENTERPRISE';
export var MODULE_ID = 'logger-global-helpers';

export function getVersion() { return VERSION; }

var _correlationId: string | null = null;

export function generateCorrelationId() { var timestamp = Date.now().toString(36); var random = Math.random().toString(36).substring(2, 10); return 'cid-' + timestamp + '-' + random; }
export function setCorrelationId(id?: string) { _correlationId = id || generateCorrelationId(); if (typeof window !== 'undefined') (window as any).__CORRELATION_ID__ = _correlationId; return _correlationId; }
export function getCorrelationId() { if (_correlationId) return _correlationId; if (typeof window !== 'undefined' && (window as any).__CORRELATION_ID__) return (window as any).__CORRELATION_ID__; return null; }
export function ensureCorrelationId() { if (!getCorrelationId()) return setCorrelationId(); return getCorrelationId(); }

var _userId: string | null = null;
var _userRole: string | null = null;

export function setUserId(id: string, role: string) { _userId = id ? anonymizeId(id) : null; _userRole = role || null; if (typeof window !== 'undefined') { (window as any).__USER_ID__ = _userId; (window as any).__USER_ROLE__ = _userRole; } return { userId: _userId, userRole: _userRole }; }
export function getUserId() { if (_userId) return _userId; if (typeof window !== 'undefined' && (window as any).__USER_ID__) return (window as any).__USER_ID__; return null; }
export function getUserRole() { if (_userRole) return _userRole; if (typeof window !== 'undefined' && (window as any).__USER_ROLE__) return (window as any).__USER_ROLE__; return null; }
export function clearUser() { _userId = null; _userRole = null; if (typeof window !== 'undefined') { delete (window as any).__USER_ID__; delete (window as any).__USER_ROLE__; } }

var _sessionId: string | null = null;

export function setSessionId(id: string) { _sessionId = id || null; if (typeof window !== 'undefined') (window as any).__SESSION_ID__ = _sessionId; return _sessionId; }
export function getSessionId() { if (_sessionId) return _sessionId; try { if (typeof window !== 'undefined') { if ((window as any).__SESSION_ID__) return (window as any).__SESSION_ID__; if (window.APP_CONFIG && window.APP_CONFIG.sessionId) return window.APP_CONFIG.sessionId; } if (typeof sessionStorage !== 'undefined') { var stored = sessionStorage.getItem('sessionId'); if (stored) return stored; } return null; } catch (e) { return null; } }

var SENSITIVE_KEYS = ['password', 'senha', 'pwd', 'pass', 'token', 'accessToken', 'refreshToken', 'authToken', 'csrfToken', 'csrf', 'secret', 'apiKey', 'api_key', 'privateKey', 'private_key', 'credit_card', 'creditCard', 'cardNumber', 'cvv', 'cvc', 'ssn', 'cpf', 'rg', 'cnpj', 'authorization', 'auth', 'bearer', 'cookie', 'session', 'sessionToken'];
var EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
var PHONE_REGEX = /(\+?55\s?)?(\(?\d{2}\)?[\s-]?)?\d{4,5}[\s-]?\d{4}/g;
var CPF_REGEX = /\d{3}\.?\d{3}\.?\d{3}-?\d{2}/g;
var CNPJ_REGEX = /\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}/g;
var TOKEN_REGEX = /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/g;

// @ts-expect-error strict migration — TS7023
export function sanitizeSensitiveData(obj: unknown, depth?: number) {
  if (depth === undefined) depth = 0;
  if (depth > 10) return '[Max Depth]';
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeString(obj);
  if (Array.isArray(obj)) { var arr = []; for (var i = 0; i < obj.length; i++) { arr.push(sanitizeSensitiveData(obj[i], depth + 1)); } return arr; }
  if (typeof obj === 'object') {
    var sanitized = {};
    for (var key in obj) {
      if (!Object.prototype.hasOwnProperty.call(obj, key)) continue;
      var lowerKey = key.toLowerCase();
      var isSensitive = false;
      for (var s = 0; s < SENSITIVE_KEYS.length; s++) { if (lowerKey.indexOf(SENSITIVE_KEYS[s].toLowerCase()) > -1) { isSensitive = true; break; } }
      // @ts-expect-error strict migration — TS7053
      if (isSensitive) sanitized[key] = '[REDACTED]';
      // @ts-expect-error strict migration — TS7053
      else sanitized[key] = sanitizeSensitiveData(obj[key], depth + 1);
    }
    return sanitized;
  }
  return obj;
}

function sanitizeString(str: string) {
  if (typeof str !== 'string') return str;
  var sanitized = str;
  sanitized = sanitized.replace(EMAIL_REGEX, function(email) { var parts = email.split('@'); if (!parts[1]) return '[EMAIL]'; var domParts = parts[1].split('.'); return parts[0][0] + '***@' + domParts[0][0] + '***.' + domParts[1]; });
  sanitized = sanitized.replace(PHONE_REGEX, '[PHONE]');
  sanitized = sanitized.replace(CPF_REGEX, '***.***.***-**');
  sanitized = sanitized.replace(CNPJ_REGEX, '**.***.***/****.--');
  sanitized = sanitized.replace(TOKEN_REGEX, '[JWT_TOKEN]');
  return sanitized;
}

export function anonymizeId(id: string) { if (!id) return null; var str = String(id); if (str.length <= 4) return '****'; return str.substring(0, 2) + '****' + str.substring(str.length - 2); }
export function maskEmail(email: unknown) { if (!email || typeof email !== 'string') return '[EMAIL]'; var parts = email.split('@'); if (!parts[1]) return '[EMAIL]'; return parts[0][0] + '***@' + parts[1]; }

export function getLocalTimeFormatted(timestampMs: number) {
  if (timestampMs === undefined) timestampMs = Date.now();
  if (typeof window !== 'undefined' && (window as any).Telemetry && (window as any).Telemetry.buildTimestamp) { var ts = (window as any).Telemetry.buildTimestamp(timestampMs); return ts.localTimeFormatted || ts.localTime; }
  var date = new Date(timestampMs);
  var timeZone = (window && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.timeZone) || 'America/Sao_Paulo';
  var locale = (window && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.locale) || 'pt-BR';
  try { return new Intl.DateTimeFormat(locale as string, { timeZone: timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', fractionalSecondDigits: 3, hour12: false } as any).format(date); } catch (e) { return date.toLocaleTimeString(locale as string); }
}

export function getLocalTimeWithOffset(timestampMs: number) {
  if (timestampMs === undefined) timestampMs = Date.now();
  var date = new Date(timestampMs);
  var timeZone = (window && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.timeZone) || 'America/Sao_Paulo';
  var locale = (window && window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.locale) || 'pt-BR';
  try { return new Intl.DateTimeFormat(locale as string, { timeZone: timeZone, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZoneName: 'shortOffset' } as any).format(date); } catch (e) { return date.toLocaleTimeString(locale as string); }
}

export function safeStringify(obj: unknown, maxDepth?: number) {
  if (maxDepth === undefined) maxDepth = 5;
  if (obj === null) return 'null';
  if (obj === undefined) return 'undefined';
  if (typeof obj === 'string') return obj;
  if (typeof obj === 'number' || typeof obj === 'boolean') return String(obj);
  var seen: unknown[] = [];
  // @ts-expect-error strict migration — TS7023
  function stringify(value: unknown, depth: number) {
    if (depth > maxDepth!) return '[Max Depth]';
    if (value === null) return null;
    if (value === undefined) return undefined;
    if (typeof value === 'object') {
      if (seen.indexOf(value) > -1) return '[Circular]';
      seen.push(value);
      if (value instanceof Error) return { name: value.name, message: value.message, stack: value.stack ? value.stack.split('\n').slice(0, 5).join('\n') : '' };
      if (Array.isArray(value)) { var arr = []; for (var i = 0; i < Math.min(value.length, 100); i++) { arr.push(stringify(value[i], depth + 1)); } return arr; }
      if (value instanceof Date) return value.toISOString();
      var result = {};
      var keys = Object.keys(value).slice(0, 50);
      // @ts-expect-error strict migration — TS7053
      for (var k = 0; k < keys.length; k++) { try { result[keys[k]] = stringify(value[keys[k]], depth + 1); } catch (e) { result[keys[k]] = '[Unserializable]'; } }
      return result;
    }
    if (typeof value === 'function') return '[Function: ' + (value.name || 'anonymous') + ']';
    return value;
  }
  try { var safe = stringify(obj, 0); return JSON.stringify(safe, null, 0); } catch (e) { return '[Stringify Error]'; }
}

export function extractComponentName(context: string | Record<string, unknown>) { if (!context) return 'app'; if (typeof context === 'string') return context; if ((context as Record<string, unknown>).component) return (context as Record<string, unknown>).component; if ((context as Record<string, unknown>).componentName) return (context as Record<string, unknown>).componentName; if ((context as Record<string, unknown>).name) return (context as Record<string, unknown>).name; if ((context as Record<string, unknown>).id) return (context as Record<string, unknown>).id; return 'app'; }
export function getTimestamp() { return Date.now(); }
export function generateId() { return Math.random().toString(36).substring(2, 10); }
export function truncate(str: string, maxLength: number) { if (maxLength === undefined) maxLength = 1000; if (typeof str !== 'string') return str; if (str.length <= maxLength) return str; return str.substring(0, maxLength) + '... [truncated]'; }

export function isDebugMode() { try { if (typeof window !== 'undefined' && window.APP_CONFIG) { if (window.APP_CONFIG.app && window.APP_CONFIG.app.debug === true) return true; if (window.APP_CONFIG.app && window.APP_CONFIG.app.environment === 'development') return true; } if (typeof localStorage !== 'undefined') { if (localStorage.getItem('LOGGER_DEBUG') === 'true') return true; } return false; } catch (e) { return false; } }

export function getBootId() { try { if (typeof window !== 'undefined') { if (window.APP_CONFIG && window.APP_CONFIG.bootId) return window.APP_CONFIG.bootId; if ((window as any).__BOOT_ID__) return (window as any).__BOOT_ID__; } return null; } catch (e) { return null; } }

export function getEnvironment() { try { if (typeof window !== 'undefined') { if ((window as any).Environment && (window as any).Environment.get) return (window as any).Environment.get('environment'); if (window.APP_CONFIG && window.APP_CONFIG.app && window.APP_CONFIG.app.environment) return window.APP_CONFIG.app.environment; } return 'unknown'; } catch (e) { return 'unknown'; } }

export function getCurrentRoute() { try { if (typeof window !== 'undefined') { if ((window as any).__CURRENT_ROUTE__) return (window as any).__CURRENT_ROUTE__; return (window.location && window.location.pathname) || '/'; } return '/'; } catch (e) { return '/'; } }

export function getTraceId(context: string | Record<string, unknown>) { if (context && (context as Record<string, unknown>).traceId) return (context as Record<string, unknown>).traceId; if (context && (context as Record<string, unknown>).trace_id) return (context as Record<string, unknown>).trace_id; try { if (typeof window !== 'undefined' && (window as any).__CURRENT_TRACE_ID__) return (window as any).__CURRENT_TRACE_ID__; return null; } catch (e) { return null; } }

export function normalizeMessage(message: string | Error | unknown) { if (typeof message === 'string') return message; if (message instanceof Error) return message.message; if (typeof message === 'object') return safeStringify(message); return String(message); }

// @ts-expect-error strict migration — TS7053
export function mergeContext() { var result = {}; for (var i = 0; i < arguments.length; i++) { var ctx = arguments[i]; if (ctx && typeof ctx === 'object' && !Array.isArray(ctx)) { for (var k in ctx) { if (Object.prototype.hasOwnProperty.call(ctx, k)) result[k] = ctx[k]; } } } return result; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { correlationIdReady: typeof generateCorrelationId === 'function', sanitizeReady: typeof sanitizeSensitiveData === 'function' } }; }
