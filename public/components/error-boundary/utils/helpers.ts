// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.error-boundary.utils.helpers
// PURPOSE: Error utility functions for formatting, sanitizing, and categorizing errors
// ───────────────────────────────────────────────────────────────
// @contract FORMAT_ERROR - formatError(error) returns standardized error object
// @contract FORMAT_ERROR_FOR_DISPLAY - formatErrorForDisplay(error) returns display-ready error
// @contract CREATE_ERROR_ID - createErrorId() generates unique error identifier
// @contract IS_RECOVERABLE - isRecoverable(error) checks if error can be recovered
// @contract SANITIZE_ERROR - sanitizeError(error) removes sensitive data from error
// @contract CATEGORIZE_ERROR - categorizeError(error) returns error category
// @contract SHOULD_REPORT_ERROR - shouldReportError(error, options) checks if error should be reported
// @contract CREATE_ERROR_FINGERPRINT - createErrorFingerprint(error) creates deduplication key
// @contract MERGE_CONTEXT - mergeContext(...contexts) merges error contexts
// @contract SAFE_EXECUTE - safeExecute(fn, fallback) executes function safely
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// PROVIDES: formatError, formatErrorForDisplay, createErrorId, isRecoverable,
//           sanitizeError, categorizeError, shouldReportError, createErrorFingerprint,
//           mergeContext, safeExecute, ErrorHelpers, VERSION, MODULE_ID
// @changelog v2.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.1.0-ENTERPRISE: Fix substr deprecated -> substring
// @changelog v2.0.0: Added sanitizeError, categorizeError, createErrorFingerprint
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.error-boundary.utils.helpers';

export function formatError(error: Record<string, unknown> | null | undefined) {
  if (!error) {
    return {
      message: 'Unknown error',
      stack: '',
      name: 'Error',
      code: null as string | number | null,
      source: 'unknown',
      severity: 'error',
      timestamp: Date.now()
    };
  }

  return {
    message: (error.message as string) || String(error),
    stack: (error.stack as string) || '',
    name: (error.name as string) || 'Error',
    code: (error.code as string | number | null) || (error.statusCode as string | number | null) || null,
    source: (error.source as string) || 'unknown',
    severity: (error.severity as string) || (error.name === 'TypeError' ? 'critical' : 'error'),
    route: (error.route as string) || null,
    panel: (error.panel as string) || null,
    timestamp: Date.now()
  };
}

export function formatErrorForDisplay(error: Record<string, unknown> | null | undefined) {
  const formatted = formatError(error);
  return {
    title: formatted.name || 'Application Error',
    message: formatted.message || 'Something went wrong. Please try refreshing the page.',
    timestamp: new Date().toLocaleString(),
    code: formatted.code,
    severity: formatted.severity,
    route: formatted.route,
    panel: formatted.panel,
    actionable: isRecoverable(error)
  };
}

export function createErrorId(): string {
  return `err-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

export function isRecoverable(error: Record<string, unknown> | null | undefined): boolean {
  const nonRecoverable = ['SyntaxError', 'ReferenceError', 'TypeError', 'RangeError'];
  return !nonRecoverable.includes(error?.name as string);
}

export function sanitizeError(error: Record<string, unknown> | null | undefined) {
  if (!error) return { message: 'Unknown error', name: 'Error', stack: null as string | null };

  const sanitized = {
    message: String(error.message || error).substring(0, 1000),
    name: (error.name as string) || 'Error',
    stack: error.stack ? String(error.stack).substring(0, 2000) : null as string | null,
    code: (error.code as string | number | null) || (error.statusCode as string | number | null) || null,
    source: (error.source as string) || null as string | null
  };

  if (sanitized.message) {
    sanitized.message = sanitized.message.replace(/password[=:]\s*\S+/gi, 'password=[REDACTED]');
    sanitized.message = sanitized.message.replace(/token[=:]\s*\S+/gi, 'token=[REDACTED]');
    sanitized.message = sanitized.message.replace(/api[_-]?key[=:]\s*\S+/gi, 'apikey=[REDACTED]');
  }

  return sanitized;
}

export function categorizeError(error: Record<string, unknown> | null | undefined): string {
  if (!error) return 'unknown';

  const name = (error.name as string) || '';
  const message = ((error.message as string) || '').toLowerCase();

  if (name === 'NetworkError' || message.includes('network') || message.includes('fetch')) return 'network';
  if (name === 'TypeError' || name === 'ReferenceError') return 'runtime';
  if (name === 'SyntaxError') return 'syntax';
  if ((error.statusCode as number) >= 400 && (error.statusCode as number) < 500) return 'client';
  if ((error.statusCode as number) >= 500) return 'server';
  if (message.includes('timeout')) return 'timeout';
  if (message.includes('permission') || message.includes('unauthorized')) return 'auth';

  return 'general';
}

export function shouldReportError(error: Record<string, unknown> | null | undefined, options: Record<string, unknown> = {}): boolean {
  if (!error) return false;

  const ignoredMessages = (options.ignoredMessages as string[]) || ['ResizeObserver loop', 'Script error', 'Loading chunk'];
  const message = (error.message as string) || '';

  for (const ignored of ignoredMessages) {
    if (message.includes(ignored)) return false;
  }

  if (options.ignoredTypes && (options.ignoredTypes as string[]).includes(error.name as string)) return false;

  return true;
}

export function createErrorFingerprint(error: Record<string, unknown> | null | undefined): string {
  if (!error) return 'unknown';

  const parts = [(error.name as string) || 'Error', ((error.message as string) || '').substring(0, 100)];

  if (error.stack) {
    const firstLine = (error.stack as string).split('\n')[1] || '';
    const match = firstLine.match(/at\s+(.+?)\s+\((.+?):(\d+):\d+\)/);
    if (match) parts.push(match[1], match[2], match[3]);
  }

  return parts.join('|').replace(/\s+/g, '_').substring(0, 200);
}

export function mergeContext(...contexts: Record<string, unknown>[]): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const ctx of contexts) {
    if (ctx && typeof ctx === 'object') Object.assign(result, ctx);
  }
  return result;
}

export function safeExecute(fn: () => unknown, fallback: unknown = null): unknown {
  try {
    if (typeof fn !== 'function') return fallback;
    return fn();
  } catch {
    return fallback;
  }
}

export const ErrorHelpers = {
  formatError,
  formatErrorForDisplay,
  createErrorId,
  isRecoverable,
  sanitizeError,
  categorizeError,
  shouldReportError,
  createErrorFingerprint,
  mergeContext,
  safeExecute,
  VERSION,
  MODULE_ID,

  healthCheck() {
    const checks = {
      functionsAvailable: typeof formatError === 'function' && typeof sanitizeError === 'function',
      versionValid: typeof VERSION === 'string' && VERSION.length > 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;

    return {
      status: passed === total ? 'HEALTHY' : 'DEGRADED',
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: passed === total ? null : Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key),
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  },

  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      functions: [
        'formatError', 'formatErrorForDisplay', 'createErrorId', 'isRecoverable',
        'sanitizeError', 'categorizeError', 'shouldReportError', 'createErrorFingerprint',
        'mergeContext', 'safeExecute'
      ],
      healthCheck: this.healthCheck(),
      timestamp: Date.now()
    };
  }
};

export function healthCheck() {
  return ErrorHelpers.healthCheck();
}

export function info() {
  return ErrorHelpers.info();
}

export default ErrorHelpers;
