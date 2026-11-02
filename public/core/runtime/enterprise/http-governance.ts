// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0-HTTP-GOVERNANCE)
// ═══════════════════════════════════════════════════════════════
// MODULE: enterprise/http-governance
// PURPOSE: Governance enforcement for HTTP requests — ensures
//          AbortController signals, timeouts, and compliance
//          recording via strict-mode violations.
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   recordViolation, isStrict from ./strict-mode.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   governedFetch(url, options, moduleId) — fetch wrapper with governance
//   createGovernedClient(moduleId, config) — factory for governed HTTP client
//   info() — module metadata
//   healthCheck() — module health
//
// RECEIVES (via init/options): (none — stateless utility)
// EMITS (eventos): (none — uses recordViolation pipeline)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { recordViolation, isStrict } from './strict-mode.js';

export const VERSION: string = '1.0.0-HTTP-GOVERNANCE';
export const MODULE_ID: string = 'enterprise/http-governance';

const DEFAULT_TIMEOUT: number = 10000;

interface HttpMetrics {
  totalRequests: number;
  withSignal: number;
  withoutSignal: number;
  withTimeout: number;
  withoutTimeout: number;
  violations: number;
}

interface FetchOptions extends RequestInit {
  timeout?: number;
}

interface GovernedClientConfig {
  timeout?: number;
}

interface GovernedClient {
  moduleId: string;
  get: (url: string, options?: FetchOptions) => Promise<Response>;
  post: (url: string, body?: unknown, options?: FetchOptions) => Promise<Response>;
  put: (url: string, body?: unknown, options?: FetchOptions) => Promise<Response>;
  patch: (url: string, body?: unknown, options?: FetchOptions) => Promise<Response>;
  delete: (url: string, options?: FetchOptions) => Promise<Response>;
  getMetrics: () => HttpMetrics;
  healthCheck: () => HttpHealthCheck;
  info: () => HttpInfo;
}

interface HttpHealthCheck {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  complianceRate: string;
  metrics: HttpMetrics;
  version: string;
  moduleId: string;
  timestamp: string;
}

interface HttpInfo {
  version: string;
  moduleId: string;
  defaultTimeout: number;
  metrics: HttpMetrics;
}

const _metrics: HttpMetrics = {
  totalRequests: 0,
  withSignal: 0,
  withoutSignal: 0,
  withTimeout: 0,
  withoutTimeout: 0,
  violations: 0
};

/**
 * Governed fetch — wraps native fetch with AbortController enforcement.
 * Records FETCH_WITHOUT_SIGNAL if no signal is provided.
 * Records API_CLIENT_NO_TIMEOUT if no timeout mechanism is detected.
 */
export function governedFetch(url: string, options: FetchOptions = {}, moduleId: string = 'unknown'): Promise<Response> {
  _metrics.totalRequests++;

  const hasSignal: boolean = !!(options.signal);
  const hasTimeout: boolean = !!(options.timeout || options.signal);

  if (hasSignal) {
    _metrics.withSignal++;
  } else {
    _metrics.withoutSignal++;
    _metrics.violations++;
    recordViolation('FETCH_WITHOUT_SIGNAL', {
      module: moduleId,
      url: _sanitizeUrl(url),
      recommendation: 'Pass AbortController signal via options.signal'
    });
  }

  if (!hasTimeout && !hasSignal) {
    _metrics.withoutTimeout++;
    _metrics.violations++;
    recordViolation('API_CLIENT_NO_TIMEOUT', {
      module: moduleId,
      url: _sanitizeUrl(url),
      recommendation: 'Use AbortController with setTimeout for timeout enforcement'
    });
  } else {
    _metrics.withTimeout++;
  }

  // If caller already provided signal, pass through directly
  if (hasSignal) {
    return fetch(url, options);
  }

  // Auto-inject AbortController with default timeout
  const controller = new AbortController();
  const timeout: number = options.timeout || DEFAULT_TIMEOUT;
  const timeoutId: ReturnType<typeof setTimeout> = setTimeout(() => controller.abort(), timeout);

  const mergedOptions: FetchOptions = Object.assign({}, options, { signal: controller.signal });
  delete mergedOptions.timeout;

  return fetch(url, mergedOptions).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Creates a governed HTTP client for a specific module.
 */
export function createGovernedClient(moduleId: string, config: GovernedClientConfig = {}): GovernedClient {
  const clientTimeout: number = config.timeout || DEFAULT_TIMEOUT;

  function _request(url: string, options: FetchOptions = {}): Promise<Response> {
    if (!options.timeout) {
      options.timeout = clientTimeout;
    }
    return governedFetch(url, options, moduleId);
  }

  function _jsonRequest(method: string, url: string, body?: unknown, options: FetchOptions = {}): Promise<Response> {
    const opts: FetchOptions = Object.assign({
      method,
      headers: Object.assign({ 'Content-Type': 'application/json' }, (options.headers as Record<string, string>) || {})
    }, options);

    if (body !== undefined && body !== null) {
      opts.body = JSON.stringify(body);
    }

    return _request(url, opts);
  }

  return {
    moduleId,
    get(url: string, options?: FetchOptions): Promise<Response> { return _request(url, Object.assign({ method: 'GET' }, options)); },
    post(url: string, body?: unknown, options?: FetchOptions): Promise<Response> { return _jsonRequest('POST', url, body, options); },
    put(url: string, body?: unknown, options?: FetchOptions): Promise<Response> { return _jsonRequest('PUT', url, body, options); },
    patch(url: string, body?: unknown, options?: FetchOptions): Promise<Response> { return _jsonRequest('PATCH', url, body, options); },
    delete(url: string, options?: FetchOptions): Promise<Response> { return _request(url, Object.assign({ method: 'DELETE' }, options)); },
    getMetrics(): HttpMetrics { return Object.assign({}, _metrics); },
    healthCheck(): HttpHealthCheck { return healthCheck(); },
    info(): HttpInfo { return info(); }
  };
}

/**
 * Sanitizes URL for logging (removes query params that might contain sensitive data)
 */
function _sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');
    return parsed.pathname;
  } catch {
    return String(url).split('?')[0];
  }
}

export function getMetrics(): HttpMetrics {
  return Object.assign({}, _metrics);
}

export function resetMetrics(): void {
  _metrics.totalRequests = 0;
  _metrics.withSignal = 0;
  _metrics.withoutSignal = 0;
  _metrics.withTimeout = 0;
  _metrics.withoutTimeout = 0;
  _metrics.violations = 0;
}

export function info(): HttpInfo {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    defaultTimeout: DEFAULT_TIMEOUT,
    metrics: getMetrics()
  };
}

export function healthCheck(): HttpHealthCheck {
  const complianceRate: string = _metrics.totalRequests > 0
    ? (_metrics.withSignal / _metrics.totalRequests * 100).toFixed(1)
    : '100';

  return {
    status: parseFloat(complianceRate) >= 80 ? 'HEALTHY' : parseFloat(complianceRate) >= 50 ? 'DEGRADED' : 'UNHEALTHY',
    complianceRate: `${complianceRate}%`,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export default {
  VERSION,
  MODULE_ID,
  governedFetch,
  createGovernedClient,
  getMetrics,
  resetMetrics,
  info,
  healthCheck
};
