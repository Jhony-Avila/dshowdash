// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-audit-trail.adapters.backend-api
// PURPOSE: Panel Audit Trail - Backend API Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   fetchAuditLogs() — exported function
//   fetchPermissionLogs() — exported function
//   fetchFrontendLogs() — exported function
//   fetchSecurityLogs() — exported function
//   fetchLogs() — exported function
//   fetchLogDetails() — exported function
//   exportLogs() — exported function
//   setAbortController() — exported function
//   createAbortController() — exported function
//   abort() — exported function
//   clearCache() — exported function
//   ... and 7 more exports
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   'abort'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';

const MODULE_ID = 'panel-audit-trail.adapters.backend-api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const API_ENDPOINTS = { audit: '/api/audit/', permissions: '/api/permission-audit/', frontend: '/api/logs/', security: '/api/security-events/' };
const CONFIG = { timeout: 15000, retryAttempts: 3, retryDelay: 1000, retryMultiplier: 2, cacheEnabled: true, cacheTTL: 30000, maxCacheSize: 50 };

let _abortController: AbortController | null = null;
const _cache = new Map<string, { data: unknown; timestamp: number }>();
const _metrics: { requests: number; successes: number; errors: number; retries: number; cacheHits: number; cacheMisses: number; totalDuration: number; lastRequestAt: number | null; lastError: { message: string; timestamp: number } | null; lastSuccessAt: number | null; avgResponseTime: number } = { requests: 0, successes: 0, errors: 0, retries: 0, cacheHits: 0, cacheMisses: 0, totalDuration: 0, lastRequestAt: null, lastError: null, lastSuccessAt: null, avgResponseTime: 0 };

function _emit(event: string, data: Record<string, unknown> = {}) { data = data || {}; try { const eb = _getPort('eventBus') as { emit?: (...a: unknown[]) => void } | null; if (eb && eb.emit) eb.emit(event, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data)); } catch (e) {} }
function _log(level: string, ...rest: any[]) { const logger = _getPort('logger'); if (logger && logger[level]) { const args = rest; logger[level](...[`[${MODULE_ID}]`].concat(args)); } }


// @ts-expect-error TS migration - TS2339
function _getCSRFToken() { const csrf = _getPort('securityCSRF'); if (csrf && csrf.getToken) return csrf.getToken(); const meta = document.querySelector('meta[name="csrf-token"]'); return meta ? meta.content : ''; }
function _buildCacheKey(url: string, params: URLSearchParams) { return `${url}?${params.toString()}`; }

function _getFromCache(key: string) { if (!CONFIG.cacheEnabled) return null; const cached = _cache.get(key); if (!cached) { _metrics.cacheMisses++; return null; } if (Date.now() - cached.timestamp > CONFIG.cacheTTL) { _cache.delete(key); _metrics.cacheMisses++; return null; } _metrics.cacheHits++; return cached.data; }
function _setCache(key: string, data: unknown) { if (!CONFIG.cacheEnabled) return; if (_cache.size >= CONFIG.maxCacheSize) { const firstKey = _cache.keys().next().value; _cache.delete(firstKey as string); } _cache.set(key, { data, timestamp: Date.now() }); }
function _clearCache(pattern?: string) { if (pattern) { const keys = _cache.keys(); let k = keys.next(); while (!k.done) { if ((k.value as string).indexOf(pattern) !== -1) _cache.delete(k.value as string); k = keys.next(); } } else { _cache.clear(); } }
function _delay(ms: number) { return new Promise(resolve => { setTimeout(resolve, ms); }); }

function _request(url: string, options: Record<string, unknown>): Promise<Record<string, unknown>> {
  options = options || {};
  const retries = options.retries !== undefined ? (options.retries as number) : CONFIG.retryAttempts;
  const useCache = options.useCache !== false;
  const cacheKey = (options.cacheKey as string) || null;
  if (useCache && cacheKey) { const cached = _getFromCache(cacheKey); if (cached) { _log('debug', 'Cache hit:', cacheKey); return Promise.resolve(cached as Record<string, unknown>); } }
  const startTime = performance.now(); _metrics.requests++; _metrics.lastRequestAt = Date.now();
  let lastError: Error | null = null; let attempt = 0;
  function tryRequest(): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => { controller.abort(); }, CONFIG.timeout);
    if (_abortController) { _abortController.signal.addEventListener('abort', () => { controller.abort(); }); }
    return fetch(url, { method: (options.method as string) || 'GET', credentials: 'include', headers: Object.assign({ 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-Token': _getCSRFToken(), 'X-Request-ID': `pat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}` }, options.headers as Record<string, string>), signal: controller.signal, body: options.body as BodyInit }).then(response => {
      clearTimeout(timeoutId);

      if (response.status === 401) { _emit(AUTH_EVENTS.SESSION_EXPIRED); throw new Error('SESSION_EXPIRED'); }
      if (response.status === 403) throw new Error('ACCESS_DENIED');

      if (response.status === 429) { const retryAfter = response.headers.get('Retry-After') || '5'; return _delay(parseInt(retryAfter as string, 10) * 1000).then(() => { attempt++; return tryRequest(); }); }
      if (!response.ok) throw new Error(`HTTP_${response.status}`);
      return response.json();
    }).then(data => {
      if (data.ok === false || data.success === false) throw new Error(data.error || data.message || 'API_ERROR');
      const duration = performance.now() - startTime; _metrics.successes++; _metrics.totalDuration += duration; _metrics.avgResponseTime = _metrics.totalDuration / _metrics.successes; _metrics.lastSuccessAt = Date.now();
      if (useCache && cacheKey) _setCache(cacheKey as string, data);
      return data;
    }).catch(error => {
      lastError = error;
      if (['SESSION_EXPIRED', 'ACCESS_DENIED'].indexOf(error.message) !== -1) throw error;
      if (error.name === 'AbortError') throw new Error('REQUEST_ABORTED');
      if (attempt < (retries as number)) { _metrics.retries++; const d = CONFIG.retryDelay * Math.pow(CONFIG.retryMultiplier, attempt); _log('warn', `Request failed, retrying in ${d}ms (attempt ${attempt + 1}/${retries})`, error.message); return _delay(d).then(() => { attempt++; return tryRequest(); }); }
      _metrics.errors++; _metrics.lastError = { message: lastError!.message, timestamp: Date.now() }; _log('error', 'Request failed after retries:', lastError!.message); throw lastError;
    });
  }
  return tryRequest();
}

function _buildParams(filters: Record<string, unknown>, defaults: Record<string, unknown> = {}) {
  filters = filters || {}; defaults = defaults || {};
  const params = new URLSearchParams({ action: 'list', limit: String(filters.limit || defaults.limit || 50), offset: String(filters.offset || defaults.offset || 0) });
  if (filters.days) params.append('days', String(filters.days)); if (filters.userId) params.append('user_id', String(filters.userId)); if (filters.search) params.append('search', String(filters.search)); if (filters.startDate) params.append('start_date', String(filters.startDate)); if (filters.endDate) params.append('end_date', String(filters.endDate)); if (filters.sortBy) params.append('sort_by', String(filters.sortBy)); if (filters.sortDir) params.append('sort_dir', String(filters.sortDir));
  const keys = Object.keys(filters); for (let i = 0; i < keys.length; i++) { const key = keys[i]; if (filters[key] && !params.has(key) && ['limit', 'offset', 'useCache'].indexOf(key) === -1) params.append(key, String(filters[key])); }
  for (let j = 0; j < keys.length; j++) { const k = keys[j]; if (k.indexOf('inline_') === 0 && filters[k]) { const col = k.replace('inline_', ''); params.append(col, String(filters[k])); } }
  return params;
}


function fetchAuditLogs(filters: Record<string, unknown>) { filters = filters || {}; const params = _buildParams(filters); const cacheKey = _buildCacheKey(API_ENDPOINTS.audit, params); return _request(`${API_ENDPOINTS.audit}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then(data => ({
  logs: data.entries || data.logs || data.data || [],
  total: data.total || data.count || 0,
  page: data.page || Math.floor(((filters.offset as number) || 0) / ((filters.limit as number) || 50)) + 1,
  hasMore: data.hasMore !== undefined ? data.hasMore : ((data.total as number) > ((filters.offset as number) || 0) + ((data.entries as unknown[]) || []).length)
})); }

function fetchPermissionLogs(filters: Record<string, unknown>) { filters = filters || {}; const params = _buildParams(filters); if (filters.actionType) params.append('action_type', String(filters.actionType)); if (filters.permissionKey) params.append('permission_key', String(filters.permissionKey)); const cacheKey = _buildCacheKey(API_ENDPOINTS.permissions, params); return _request(`${API_ENDPOINTS.permissions}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then(data => ({
  logs: data.logs || data.data || [],
  total: data.total || 0,
  hasMore: data.hasMore || false
})); }

function fetchFrontendLogs(filters: Record<string, unknown>) { filters = filters || {}; const params = _buildParams(filters); if (filters.level) params.append('level', String(filters.level)); if (filters.logger) params.append('logger', String(filters.logger)); const cacheKey = _buildCacheKey(API_ENDPOINTS.frontend, params); return _request(`${API_ENDPOINTS.frontend}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then(data => ({
  logs: data.logs || data.data || [],
  total: data.total || 0,
  hasMore: data.hasMore || false
})); }

function fetchSecurityLogs(filters: Record<string, unknown>) { filters = filters || {}; const params = _buildParams(filters); if (filters.severity) params.append('severity', String(filters.severity)); if (filters.eventType) params.append('event_type', String(filters.eventType)); const cacheKey = _buildCacheKey(API_ENDPOINTS.security, params); return _request(`${API_ENDPOINTS.security}?${params}`, { useCache: filters.useCache !== false, cacheKey }).then(data => ({
  logs: data.logs || data.events || data.data || [],
  total: data.total || 0,
  hasMore: data.hasMore || false
})); }
function fetchLogs(tab: string, filters: Record<string, unknown>) { const fetchers: Record<string, (f: Record<string, unknown>) => Promise<Record<string, unknown>>> = { audit: fetchAuditLogs, permissions: fetchPermissionLogs, frontend: fetchFrontendLogs, security: fetchSecurityLogs }; const fetcher = fetchers[tab] || fetchers.audit; return fetcher(filters); }
function exportLogs(tab: string, filters: Record<string, unknown>, format?: string) { format = format || 'csv'; const endpoint = (API_ENDPOINTS as Record<string, string>)[tab] || API_ENDPOINTS.audit; const params = new URLSearchParams(Object.assign({ action: 'export', format, limit: 10000 }, filters) as Record<string, string>); return _request(`${endpoint}?${params}`, { useCache: false }); }
function fetchLogDetails(tab: string, logId: string) { const endpoint = (API_ENDPOINTS as Record<string, string>)[tab] || API_ENDPOINTS.audit; const params = new URLSearchParams({ action: 'detail', id: logId }); return _request(`${endpoint}?${params}`, { useCache: true, cacheKey: `detail-${tab}-${logId}` }); }

function setAbortController(controller: AbortController | null) { _abortController = controller; }
function abort() { if (_abortController) { _abortController.abort(); _abortController = null; } }
function createAbortController() { abort(); _abortController = new AbortController(); return _abortController; }

function clearCache(tab?: string) { if (tab) _clearCache((API_ENDPOINTS as Record<string, string>)[tab]); else _clearCache(); }
function getCacheStats() { return { size: _cache.size, maxSize: CONFIG.maxCacheSize, ttl: CONFIG.cacheTTL, hits: _metrics.cacheHits, misses: _metrics.cacheMisses, hitRate: _metrics.cacheHits + _metrics.cacheMisses > 0 ? `${((_metrics.cacheHits / (_metrics.cacheHits + _metrics.cacheMisses)) * 100).toFixed(1)}%` : '0%' }; }
function getMetrics() { return Object.assign({ successRate: _metrics.requests > 0 ? `${((_metrics.successes / _metrics.requests) * 100).toFixed(1)}%` : '0%', cache: getCacheStats() }, _metrics); }
function resetMetrics() { _metrics.requests = 0; _metrics.successes = 0; _metrics.errors = 0; _metrics.retries = 0; _metrics.cacheHits = 0; _metrics.cacheMisses = 0; _metrics.totalDuration = 0; _metrics.avgResponseTime = 0; }
function getLastError() { return _metrics.lastError; }

function healthCheck() {
  const errorRate = _metrics.requests > 0 ? _metrics.errors / _metrics.requests : 0;
  let status = 'HEALTHY'; if (errorRate > 0.5) status = 'UNHEALTHY'; else if (errorRate > 0.2 || _metrics.avgResponseTime > 5000) status = 'DEGRADED';
  return { status, metrics: getMetrics(), config: { timeout: CONFIG.timeout, retryAttempts: CONFIG.retryAttempts, cacheEnabled: CONFIG.cacheEnabled, cacheTTL: CONFIG.cacheTTL }, endpoints: Object.keys(API_ENDPOINTS), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function getVersion() { return VERSION; }
function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export { VERSION, MODULE_ID, fetchAuditLogs, fetchPermissionLogs, fetchFrontendLogs, fetchSecurityLogs, fetchLogs, fetchLogDetails, exportLogs, setAbortController, createAbortController, abort, clearCache, getCacheStats, getMetrics, resetMetrics, getLastError, healthCheck, getVersion, info };
export default { VERSION, MODULE_ID, fetchAuditLogs, fetchPermissionLogs, fetchFrontendLogs, fetchSecurityLogs, fetchLogs, fetchLogDetails, exportLogs, setAbortController, createAbortController, abort, clearCache, getCacheStats, getMetrics, resetMetrics, getLastError, healthCheck, getVersion, info, injectPorts, getPorts };
