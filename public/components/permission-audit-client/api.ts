// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.1-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components-permission-audit-client-api
// PURPOSE: PermissionAuditClient - API Module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG, logger from ./config.js
//
// PROVIDES:
//   getAbortController() — exported function
//   createAbortController() — exported function
//   abortAll() — exported function
//   fetchWithRetry() — exported function
//   list() — exported function
//   getStats() — exported function
//   getUserHistory() — exported function
//   log() — exported function
//   sendBatch() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { CONFIG as _CONFIG, logger } from './config.js';
const CONFIG = _CONFIG as any;

const MODULE_ID = 'components-permission-audit-client-api';
const VERSION = '2.0.1-P18EC';
type Metrics = Record<string, number>;
type TrackTelemetry = (action: string, data?: Record<string, unknown>) => void;
type Emit = (event: string, data?: Record<string, unknown>) => void;

let _abortController: AbortController | null = null;

export function getAbortController(): AbortController | null { return _abortController; }
export function createAbortController(): AbortController { _abortController = new AbortController(); return _abortController; }
export function abortAll(): void { if (_abortController) { _abortController.abort(); _abortController = null; } }

function sleep(ms: number): Promise<void> { return new Promise(resolve => { setTimeout(resolve, ms); }); }

export function fetchWithRetry(url: string, options: RequestInit = {}, attempt = 1): Promise<Response> {
  const maxAttempts = CONFIG.retry.maxAttempts;
  const baseDelay = CONFIG.retry.baseDelay;
  const maxDelay = CONFIG.retry.maxDelay;
  if (!_abortController || _abortController.signal.aborted) _abortController = new AbortController();
  const fetchOptions = Object.assign({}, options, { credentials: 'include' as RequestCredentials, signal: _abortController.signal });
  const timeoutId = setTimeout(() => { _abortController!.abort(); }, CONFIG.timeout);
  return fetch(url, fetchOptions as RequestInit).then((response: Response) => {
    clearTimeout(timeoutId);
    if (!response.ok && attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
      return sleep(delay).then(() => fetchWithRetry(url, options, attempt + 1));
    }
    return response;
  }).catch((error: Error) => {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') throw new Error('REQUEST_TIMEOUT');
    if (attempt < maxAttempts) {
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      logger.warn(`Request error, retry ${attempt}/${maxAttempts} in ${delay}ms: ${error.message}`);
      return sleep(delay).then(() => { _abortController = new AbortController(); return fetchWithRetry(url, options, attempt + 1); });
    }
    throw error;
  });
}

export function list(options: Record<string, string>, metrics: Metrics, trackTelemetry: TrackTelemetry, emit: Emit): Promise<Record<string, unknown>> {
  const params = new URLSearchParams();
  if (options.limit) params.append('limit', options.limit);
  if (options.offset) params.append('offset', options.offset);
  if (options.user_id) params.append('user_id', options.user_id);
  if (options.permission) params.append('permission', options.permission);
  if (options.action_type) params.append('action_type', options.action_type);
  if (options.days) params.append('days', options.days);
  const url = CONFIG.endpoints.list + (params.toString() ? `&${params.toString()}` : '');
  return fetchWithRetry(url).then((response: Response) => response.json()).then((data: Record<string, unknown>) => {
    if (data.ok) { trackTelemetry('list', { count: (Array.isArray(data.logs) ? data.logs.length : 0) }); emit('list', { logs: data.logs as Record<string, unknown>[], total: data.total as number }); return data; }
    throw new Error((data.error as string) || 'FETCH_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'list', error: error.message }); emit('error', { action: 'list', error: error.message }); throw error; });
}

export function getStats(days: number, metrics: Metrics, trackTelemetry: TrackTelemetry, emit: Emit): Promise<Record<string, unknown>> {
  return fetchWithRetry(`${CONFIG.endpoints.stats}&days=${days}`).then((response: Response) => response.json()).then((data: Record<string, unknown>) => {
    if (data.ok) { trackTelemetry('stats', { days }); emit('stats', data); return data; }
    throw new Error((data.error as string) || 'FETCH_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'stats', error: error.message }); emit('error', { action: 'stats', error: error.message }); throw error; });
}

export function getUserHistory(userId: string | null, limit: number, metrics: Metrics, trackTelemetry: TrackTelemetry, emit: Emit): Promise<Record<string, unknown>> {
  let url = `${CONFIG.endpoints.userHistory}&limit=${limit}`;
  if (userId) url += `&user_id=${userId}`;
  return fetchWithRetry(url).then((response: Response) => response.json()).then((data: Record<string, unknown>) => {
    if (data.ok) { trackTelemetry('user-history', { userId: data.user_id as string, count: (Array.isArray(data.logs) ? data.logs.length : 0) }); emit('user-history', { user_id: data.user_id as string, logs: data.logs as Record<string, unknown>[] }); return data; }
    throw new Error((data.error as string) || 'FETCH_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'userHistory', error: error.message }); emit('error', { action: 'userHistory', error: error.message }); throw error; });
}

export function log(permissionKey: string, action: string, options: Record<string, unknown>, metrics: Metrics, trackTelemetry: TrackTelemetry, emit: Emit): Promise<Record<string, unknown>> {
  return fetchWithRetry(CONFIG.endpoints.log, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ permission_key: permissionKey, action, resource_type: options.resourceType || null, resource_id: options.resourceId || null, context: options.context || null }) }).then((response: Response) => response.json()).then((data: Record<string, unknown>) => {
    if (data.ok) { metrics.logCount++; trackTelemetry('logged', { permissionKey, action }); emit('logged', { log_id: data.log_id as string, permission_key: permissionKey, action }); return data; }
    throw new Error((data.error as string) || 'LOG_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'log', error: error.message }); emit('error', { action: 'log', error: error.message }); throw error; });
}

export function sendBatch(entries: Record<string, unknown>[], metrics: Metrics, trackTelemetry: TrackTelemetry, emit: Emit): Promise<Record<string, unknown>> {
  return fetchWithRetry(CONFIG.endpoints.batch, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entries }) }).then((response: Response) => response.json()).then((data: Record<string, unknown>) => {
    if (data.ok) { metrics.flushCount++; trackTelemetry('flushed', { count: entries.length }); emit('flushed', { inserted: data.inserted as number, errors: data.errors as number }); return data; }
    throw new Error((data.error as string) || 'BATCH_ERROR');
  }).catch((error: Error) => { metrics.errorCount++; trackTelemetry('error', { action: 'flush', error: error.message }); emit('error', { action: 'flush', error: error.message }); throw error; });
}

export { MODULE_ID, VERSION };
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
