// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: API Client - HTTP Core v3.0.2-P13-COMPLIANT
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG, REQUEST_PROFILES, RETRYABLE_STATUS_CODES, AUTH_ERROR_STATUS_CODES, ERROR_CODES, RESPONSE_SHAPE, TELEMETRY_ENDPOINT, MODULE_ID, VERSION from ./config.js
//   NetworkError, TimeoutError, HTTPError, AbortError, ParseError, AuthRequiredError, AccessDeniedError, createErrorFromStatus from ./errors.js
//   AuthAdapter from ./auth-adapter.js
//
// PROVIDES:
//   HTTPClient — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.TelemetryCore
// ═══════════════════════════════════════════════════════════════
'use strict';

import { DEFAULT_CONFIG, REQUEST_PROFILES, RETRYABLE_STATUS_CODES, AUTH_ERROR_STATUS_CODES, ERROR_CODES, RESPONSE_SHAPE, TELEMETRY_ENDPOINT, MODULE_ID, VERSION } from './config.js';
import { NetworkError, TimeoutError, HTTPError, AbortError, ParseError, AuthRequiredError, AccessDeniedError, createErrorFromStatus } from './errors.js';
import { AuthAdapter } from './auth-adapter.js';

const HTTP_MODULE_ID = 'api-client-http';
const HTTP_VERSION = '3.0.2-P13-COMPLIANT';

function generateTraceId() { return `trace-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`; }
function getTelemetry() { if (typeof window !== 'undefined' && (window as any).TelemetryCore) return (window as any).TelemetryCore; return null; }

export class HTTPClient {
  [key: string]: any;
  constructor(config: { baseURL?: string; timeout?: number; headers?: Record<string, string>; credentials?: RequestCredentials; authProvider?: unknown } = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.authProvider = config.authProvider || AuthAdapter;
    this.activeControllers = new Map();
    this.metrics = { total: 0, success: 0, errors: 0, retries: 0, authErrors: 0, networkErrors: 0, timeoutErrors: 0, totalTime: 0, avgTime: 0, byEndpoint: {} };
    this.isInitialized = true;
    this.destroyed = false;
    this.initTimestamp = Date.now();
  }

  getVersion() { return HTTP_VERSION; }

  _createResponse(ok: boolean, status: number, data: unknown = null, meta: Record<string, unknown> = {}, errors: unknown[] = []) { return { ok, success: ok && status >= 200 && status < 300, status, data, meta: { ...meta, timestamp: Date.now() }, errors: Array.isArray(errors) ? errors : [errors].filter(Boolean) }; }

  _updateEndpointMetrics(endpoint: string, success: boolean, latency: number, status: number) {
    if (!this.metrics.byEndpoint[endpoint]) this.metrics.byEndpoint[endpoint] = { total: 0, success: 0, errors: 0, lastStatus: null, lastDuration: null, avgTime: 0, totalTime: 0 };
    const ep = this.metrics.byEndpoint[endpoint];
    ep.total++; ep.totalTime += latency; ep.avgTime = Math.round(ep.totalTime / ep.total); ep.lastStatus = status; ep.lastDuration = latency;
    if (success) ep.success++; else ep.errors++;
  }

  _updateGlobalMetrics(success: boolean, latency: number) { this.metrics.total++; this.metrics.totalTime += latency; this.metrics.avgTime = Math.round(this.metrics.totalTime / this.metrics.total); if (success) this.metrics.success++; else this.metrics.errors++; }

  _track(event: string, data: Record<string, unknown> = {}) { const telemetry = getTelemetry(); if (telemetry?.track) { try { telemetry.track(`${HTTP_MODULE_ID}:${event}`, data); } catch (e: any) { } } }

  _getProfileConfig(profile = 'default') { return (REQUEST_PROFILES as Record<string, typeof REQUEST_PROFILES.default>)[profile] || REQUEST_PROFILES.default; }

  async _fetchWithTimeout(url: string, options: RequestInit, timeout: number) {
    const controller = new AbortController();
    const requestId = generateTraceId();
    this.activeControllers.set(requestId, controller);
    const timeoutId = setTimeout(() => { controller.abort(); }, timeout);
    try { const response = await fetch(url, { ...options, signal: controller.signal }); clearTimeout(timeoutId); return response; }
    catch (error: any) { clearTimeout(timeoutId); if ((error as Error).name === 'AbortError') throw new (TimeoutError as unknown as { new(timeout: number, details: Record<string, unknown>): Error })(timeout, { url, method: options.method }); throw error; }
    finally { this.activeControllers.delete(requestId); }
  }

  async request(url: string, options: { method?: string; profile?: string; timeout?: number; headers?: Record<string, string>; body?: unknown; credentials?: RequestCredentials; cache?: RequestCache; retries?: number; retryDelay?: number; backoffMultiplier?: number; maxRetryDelay?: number } = {}) {
    if (this.destroyed) return this._createResponse(false, 0, null, {}, ['Client destroyed']);
    const startTime = Date.now();
    const traceId = generateTraceId();
    const method = options.method || 'GET';
    const profile = options.profile || 'default';
    const profileConfig = this._getProfileConfig(profile);
    const timeout = options.timeout || profileConfig.timeout;
    const maxRetries = options.retries ?? profileConfig.retries;
    const retryDelay = options.retryDelay || profileConfig.retryDelay;
    const backoffMultiplier = options.backoffMultiplier || profileConfig.backoffMultiplier;
    const maxRetryDelay = options.maxRetryDelay || profileConfig.maxRetryDelay;
    const authHeaders = this.authProvider?.getAuthHeaders?.() || {};
    const headers = { ...this.config.headers, ...authHeaders, ...options.headers };
    let body = options.body;
    if (body && typeof body === 'object' && !(body instanceof FormData)) body = JSON.stringify(body);
    const fetchOptions = { method, headers, body: ['GET', 'HEAD'].includes(method) ? undefined : body, credentials: options.credentials || this.config.credentials, cache: options.cache || this.config.cache };
    const endpoint = new URL(url, window.location.origin).pathname; // CONTRACT_OK_P13: Read-only (URL building)
    let lastError = null;
    let attempt = 0;
    let currentDelay = retryDelay;

    while (attempt <= maxRetries) {
      try {
        this._track('request:start', { url: endpoint, method, attempt, profile, traceId });
        const response = await this._fetchWithTimeout(url, fetchOptions as RequestInit, timeout);
        const latency = Date.now() - startTime;
        const result = await this._processResponse(response, { url, endpoint, method, traceId, latency, attempt, profile });
        this._updateEndpointMetrics(endpoint, result.ok, latency, result.status);
        this._updateGlobalMetrics(result.ok, latency);
        this._track('request:complete', { url: endpoint, method, status: result.status, ok: result.ok, latency, attempt, traceId });
        return result;
      } catch (error: any) {
        lastError = error;
        const latency = Date.now() - startTime;
        if (error instanceof TimeoutError) { this.metrics.timeoutErrors++; this._track('request:timeout', { url: endpoint, method, timeout, attempt, traceId }); }
        else if ((error as Error).name === 'TypeError' || (error as Error).message?.includes('fetch')) { this.metrics.networkErrors++; this._track('request:network-error', { url: endpoint, method, error: (error as Error).message, attempt, traceId }); lastError = new (NetworkError as unknown as { new(message: string, details: Record<string, unknown>): Error })((error as Error).message, { url, method, traceId }); }
        const canRetry = attempt < maxRetries && (error instanceof TimeoutError || error instanceof NetworkError || (error.status && RETRYABLE_STATUS_CODES.has(error.status)));
        if (canRetry) { this.metrics.retries++; this._track('request:retry', { url: endpoint, method, attempt, delay: currentDelay, traceId }); await new Promise(resolve => setTimeout(resolve, currentDelay)); currentDelay = Math.min(currentDelay * backoffMultiplier, maxRetryDelay); attempt++; continue; }
        this._updateEndpointMetrics(endpoint, false, latency, lastError.status || 0);
        this._updateGlobalMetrics(false, latency);
        this._track('request:error', { url: endpoint, method, error: lastError.message, code: lastError.code, status: lastError.status, attempt, traceId });
        return this._createResponse(false, lastError.status || 0, null, { traceId, latency, error: lastError.toJSON?.() || { message: lastError.message } }, [lastError.message]);
      }
    }
    const latency = Date.now() - startTime;
    this._updateEndpointMetrics(endpoint, false, latency, lastError?.status || 0);
    this._updateGlobalMetrics(false, latency);
    return this._createResponse(false, lastError?.status || 0, null, { traceId, latency, retriesExhausted: true }, [lastError?.message || 'Max retries exceeded']);
  }

  async _processResponse(response: Response, context: { url: string; endpoint: string; method: string; traceId: string; latency: number; attempt?: number; profile?: string }) {
    const { status, statusText, ok: httpOk } = response;
    const { url, endpoint, method, traceId, latency } = context;
    if (AUTH_ERROR_STATUS_CODES.has(status)) {
      this.metrics.authErrors++;
      this.authProvider?.handleAuthError?.(status, { url, endpoint, method, traceId });
      const error = status === 401 ? new (AuthRequiredError as unknown as { new(d: Record<string, unknown>): Error })({ url, method, traceId }) : new (AccessDeniedError as unknown as { new(d: Record<string, unknown>): Error })({ url, method, traceId });
      return this._createResponse(false, status, null, { traceId, latency }, [error.message]);
    }
    let data = null;
    let parseError = null;
    try { const contentType = response.headers.get('content-type') || ''; if (contentType.includes('application/json')) data = await response.json(); else data = await response.text(); }
    catch (e: any) { parseError = e; this._track('response:parse-error', { url: endpoint, error: e.message, traceId }); }
    if (!httpOk) { const error = createErrorFromStatus(status, statusText, { url, method, traceId, retryable: RETRYABLE_STATUS_CODES.has(status) }); const errors = data?.errors || data?.error || [error.message]; return this._createResponse(false, status, data, { traceId, latency, statusText }, Array.isArray(errors) ? errors : [errors]); }
    return this._createResponse(true, status, data, { traceId, latency }, []);
  }

  cancelAll() { this.activeControllers.forEach((controller: AbortController, id: string) => { try { controller.abort(); } catch (e: any) { } }); this.activeControllers.clear(); this._track('requests:cancelled-all', { count: this.activeControllers.size }); }

  getMetrics() { const successRate = this.metrics.total > 0 ? (this.metrics.success / this.metrics.total * 100).toFixed(2) : '0.00'; const authErrorRate = this.metrics.total > 0 ? (this.metrics.authErrors / this.metrics.total * 100).toFixed(2) : '0.00'; return { total: this.metrics.total, success: this.metrics.success, errors: this.metrics.errors, successRate: parseFloat(successRate), authErrors: this.metrics.authErrors, authErrorRate: parseFloat(authErrorRate), networkErrors: this.metrics.networkErrors, timeoutErrors: this.metrics.timeoutErrors, retries: this.metrics.retries, avgTime: this.metrics.avgTime, endpointsTracked: Object.keys(this.metrics.byEndpoint).length, uptime: Date.now() - this.initTimestamp }; }

  getEndpointMetrics(endpoint: string | null = null) { if (endpoint) return this.metrics.byEndpoint[endpoint] || null; return { ...this.metrics.byEndpoint }; }

  resetMetrics() { this.metrics = { total: 0, success: 0, errors: 0, retries: 0, authErrors: 0, networkErrors: 0, timeoutErrors: 0, totalTime: 0, avgTime: 0, byEndpoint: {} }; this._track('metrics:reset'); }

  healthCheck() { const metrics = this.getMetrics(); const issues = []; if (metrics.authErrorRate > 30) issues.push('High auth error rate'); if (metrics.networkErrors > 10) issues.push('Multiple network errors'); if (metrics.avgTime > 5000) issues.push('High average response time'); return { healthy: issues.length === 0 && !this.destroyed, version: HTTP_VERSION, moduleId: HTTP_MODULE_ID, isInitialized: this.isInitialized, destroyed: this.destroyed, activeRequests: this.activeControllers.size, successRate: metrics.successRate, authErrorRate: metrics.authErrorRate, networkErrors: metrics.networkErrors, retries: metrics.retries, avgTime: metrics.avgTime, endpointsTracked: metrics.endpointsTracked, issues: issues.length > 0 ? issues : null, uptime: metrics.uptime }; }

  destroy() { this.cancelAll(); this.destroyed = true; this._track('client:destroyed'); }
}

export default HTTPClient;
