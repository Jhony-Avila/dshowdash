// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-12.services.http
// PURPOSE: HTTP Service - Camada de baixo nível para requisições
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   SecurityCSRF from /components/security/csrf-token-manager/index.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   get() — exported function
//   post() — exported function
//   put() — exported function
//   del() — exported function
//   createAbortController() — exported function
//   isSessionExpired() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { SecurityCSRF } from '/components/security/csrf-token-manager/index.js';

export const MODULE_ID = 'panel-12.services.http';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const MAX_RETRIES = 3;
const RETRY_DELAY = 2000;

function getCommonHeaders(includeContentType = false) {
  const securityHeaders = SecurityCSRF.getHeaders();
  // @ts-expect-error strict migration — TS2322
  const headers: Record<string, string> = { 'Accept': 'application/json', 'X-Requested-With': 'XMLHttpRequest', ...securityHeaders };
  if (includeContentType) headers['Content-Type'] = 'application/json';
  return headers;
}

async function request(url: string, options: Record<string, unknown> = {}, retryCount = 0) {
  const signal = (options.signal as AbortSignal | null) || null;
  const startTime = Date.now();
  const method = (options.method as string) || 'GET';
  const reqOptions = { credentials: 'include', cache: 'no-store', method, headers: { ...getCommonHeaders(method !== 'GET'), ...((options.headers as Record<string, string>) || {}) } };

  // @ts-expect-error TS migration - TS2339
  if (signal) (reqOptions.signal as any) = signal;
  if (options.body) (reqOptions as any).body = options.body;
  try {

    // @ts-expect-error TS migration - TS2769
    const response = await fetch(url, reqOptions);
    const duration = Date.now() - startTime;
    if (response.status === 401 || response.status === 403) { SecurityCSRF.emitLoginRequired(response.status === 401 ? 'api-401' : 'api-403', { url, method: options.method || 'GET', status: response.status }); return { success: false, error: 'SESSION_EXPIRED', status: response.status, duration }; }
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) throw new Error('Invalid content-type (expected JSON)');
    const data = await response.json();
    if (!data || typeof data !== 'object') throw new Error('Invalid response payload');
    return { success: true, data, status: response.status, duration };
  } catch (error: any) {
    if (error.name === 'AbortError') return { success: false, error: 'ABORTED', duration: Date.now() - startTime };
    const duration = Date.now() - startTime;
    if (retryCount < MAX_RETRIES && (!signal || !signal.aborted)) { const retryDelay = RETRY_DELAY * (retryCount + 1); await new Promise(r => setTimeout(r, retryDelay)); return request(url, { ...options, signal }, retryCount + 1); }
    return { success: false, error: error.message, duration, retriesExhausted: true };
  }
}

export function get(url: string, options: Record<string, unknown> = {}) { return request(url, { method: 'GET', ...options }); }
export function post(url: string, body: unknown, options: Record<string, unknown> = {}) { return request(url, { method: 'POST', body: JSON.stringify(body), ...options }); }
export function put(url: string, body: unknown, options: Record<string, unknown> = {}) { return request(url, { method: 'PUT', body: JSON.stringify(body), ...options }); }
export function del(url: string, options: Record<string, unknown> = {}) { return request(url, { method: 'DELETE', ...options }); }
export function createAbortController() { return new AbortController(); }
export function isSessionExpired(result: Record<string, unknown>) { return result.error === 'SESSION_EXPIRED'; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, securityCSRF: SecurityCSRF.isReady(), maxRetries: MAX_RETRIES, retryDelay: RETRY_DELAY, portsInitialized: Ports.isInitialized() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { httpReady: true, portsInitialized: Ports.isInitialized() } }; }
