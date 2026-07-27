// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-08.adapters.backend-api
// PURPOSE: Panel-08 Backend API Adapter Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS, AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   loadAlerts() — exported function
//   acknowledgeAlert() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS, AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-08.adapters.backend-api';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const API_BASE = '/api/modules/panels/panel-08';
const DEFAULT_TIMEOUT = 10000;
const MAX_RETRIES = 2;
const RETRY_DELAY = 1000;

const metrics: { requests: number; success: number; errors: number; authFails: number; avgResponseTime: number; responseTimes: number[] } = { requests: 0, success: 0, errors: 0, authFails: 0, avgResponseTime: 0, responseTimes: [] };

function _emit(event: string, data?: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && (eb as Record<string, unknown> & { emit?: (...a: unknown[]) => void }).emit) (eb as Record<string, unknown> & { emit: (...a: unknown[]) => void }).emit(event, Object.assign({}, data || {}, { source: MODULE_ID, timestamp: Date.now() })); }
function _isAuthenticated() { const auth = _getPort('auth'); return auth && auth.isAuthenticated ? auth.isAuthenticated() : false; }

function fetchWithTimeout(url: string, options: RequestInit, timeout: number) { timeout = timeout || DEFAULT_TIMEOUT; const controller = new AbortController(); const timeoutId = setTimeout(() => { controller.abort(); }, timeout); options = options || {}; if (!options.signal) options.signal = controller.signal; return fetch(url, options).then(response => { clearTimeout(timeoutId); return response; }).catch((err: unknown) => { clearTimeout(timeoutId); throw err; }); }

function fetchWithRetry(url: string, options: RequestInit & { timeout?: number }, retries: number): Promise<Response> {
  retries = retries != null ? retries : MAX_RETRIES;
  let lastError: unknown;
  function attempt(i: number): Promise<Response> { return fetchWithTimeout(url, options, options && options.timeout ? options.timeout : DEFAULT_TIMEOUT).catch((error: Error & { name?: string }) => { lastError = error; if (error.name === 'AbortError') throw error; if (i < retries) { return new Promise<void>(r => { setTimeout(r, RETRY_DELAY * (i + 1)); }).then(() => attempt(i + 1)); } throw lastError; }); }
  return attempt(0);
}

export function loadAlerts(options: { signal?: AbortSignal; timeout?: number } = {}): Promise<{ ok: boolean; error?: string; message?: string; data?: unknown[]; meta?: Record<string, unknown>; duration?: number }> {
  _initPorts();
  options = options || {};
  if (!_isAuthenticated()) { metrics.authFails++; _emit(AUTH_INTENTS.LOGIN, { reason: 'session-expired' }); return Promise.resolve({ ok: false, error: 'AUTH_REQUIRED' }); }
  const startTime = Date.now();
  metrics.requests++;

  type LoadResult = { ok: boolean; error?: string; message?: string; data?: unknown[]; meta?: Record<string, unknown>; duration?: number };
  return (fetchWithRetry(`${API_BASE}/api.php`, { method: 'GET', credentials: 'include', headers: { 'Content-Type': 'application/json', 'X-Panel-Id': 'panel-08' }, signal: options.signal, timeout: options.timeout || DEFAULT_TIMEOUT }, MAX_RETRIES).then((response: Response): Promise<LoadResult> | LoadResult => {

    if (response.status === 401) { metrics.authFails++; _emit(AUTH_EVENTS.SESSION_EXPIRED); return { ok: false, error: 'AUTH_REQUIRED' }; }
    if (!response.ok) { metrics.errors++; return { ok: false, error: `HTTP_${response.status}` }; }
    return response.json().then((data: { data?: unknown[]; meta?: Record<string, unknown> }): LoadResult => {
      const duration = Date.now() - startTime;
      metrics.success++;
      metrics.responseTimes.push(duration);
      if (metrics.responseTimes.length > 20) metrics.responseTimes.shift();
      metrics.avgResponseTime = Math.round(metrics.responseTimes.reduce((a, b) => a + b, 0) / metrics.responseTimes.length);
      return { ok: true, data: data.data || [], meta: data.meta || {}, duration };
    });
  }).catch((error: Error & { name?: string }): LoadResult => { metrics.errors++; if (error.name === 'AbortError') return { ok: false, error: 'ABORTED' }; return { ok: false, error: 'NETWORK_ERROR', message: error.message }; })) as Promise<LoadResult>;
}

export function acknowledgeAlert(alertId: number | string, options: { signal?: AbortSignal } = {}) {
  _initPorts();
  options = options || {};
  if (!_isAuthenticated()) return Promise.resolve({ ok: false, error: 'AUTH_REQUIRED' });

  return fetchWithTimeout(`${API_BASE}/api.php?action=acknowledge&id=${alertId}`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, signal: options.signal }, DEFAULT_TIMEOUT).then(response => { if (!response.ok) return { ok: false, error: `HTTP_${response.status}` }; return { ok: true }; }).catch((error: Error) => ({
    ok: false,
    error: error.message
  }));
}

export function getMetrics() { return Object.assign({}, metrics); }
export function resetMetrics() { metrics.requests = 0; metrics.success = 0; metrics.errors = 0; metrics.authFails = 0; metrics.avgResponseTime = 0; metrics.responseTimes = []; }
export function getVersion() { return VERSION; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }

export default { VERSION, MODULE_ID, loadAlerts, acknowledgeAlert, getMetrics, resetMetrics, getVersion, injectPorts, getPorts, info, healthCheck };
