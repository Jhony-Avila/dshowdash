// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05.services.api
// PURPOSE: Panel-05 API Client
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   API_PATH, REQUEST_TIMEOUT from ../core/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   apiClient — exported value
//   API_EVENTS — exported value
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventKey
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { API_PATH, REQUEST_TIMEOUT } from '../core/constants.js';

const MODULE_ID = 'panel-05.services.api';
const VERSION = '9.3.0-P2-ENTERPRISE';

const API_EVENTS = {
    SUCCESS: 'panel-05:api:success',
    ERROR: 'panel-05:api:error',
    BATCH_COMPLETE: 'panel-05:api:batch-complete'
};

const Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _getBaseUrl() {
    const cfg = _getPort('config');
    if (cfg?.app?.baseUrl) return cfg.app.baseUrl;
    if (cfg?.baseUrl) return cfg.baseUrl;
    const rs = _getPort('routeState');
    if (rs?.getBaseUrl) return rs.getBaseUrl();
    if (typeof window !== 'undefined' && window.location?.origin) { return window.location.origin; }
    return '';
}

const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug || false; };

const _log = (level: string, ...args: unknown[]) => {
    const logger = _getPort('logger');
    if (!logger) return;
    const prefix = `[${MODULE_ID}]`;
    if (level === 'error') { logger.error?.(prefix, ...args); return; }
    if (level === 'warn') { logger.warn?.(prefix, ...args); return; }
    if (level === 'info') { logger.info?.(prefix, ...args); return; }
    if (_debug() && logger.debug) logger.debug(prefix, ...args);
};

const RETRY_CONFIG = { maxRetries: 3, baseDelay: 1000, maxDelay: 10000, backoffFactor: 2, retryableErrors: ['NETWORK_ERROR', 'REQUEST_TIMEOUT', 'HTTP_502', 'HTTP_503', 'HTTP_504'] };

function ApiClient(this: any) {
    this._baseUrl = API_PATH;
    this._timeout = REQUEST_TIMEOUT;
    this._cache = new Map();
    this._cacheTTL = 30000;
    this._controller = null;
    this._metrics = { calls: 0, successes: 0, failures: 0, retries: 0, cacheHits: 0 };
}

ApiClient.prototype._getRetryDelay = (attempt: number) => {
    const delay = Math.min(RETRY_CONFIG.baseDelay * Math.pow(RETRY_CONFIG.backoffFactor, attempt), RETRY_CONFIG.maxDelay);
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
};

ApiClient.prototype._isRetryable = (error: string) => RETRY_CONFIG.retryableErrors.some(e => error.includes(e));
ApiClient.prototype._sleep = (ms: number) => new Promise((resolve) => { setTimeout(resolve, ms); });

ApiClient.prototype._buildUrl = function(params: Record<string, unknown>) {
    const base = _getBaseUrl();
    const fullUrl = base ? base + this._baseUrl : this._baseUrl;
    const url = new URL(fullUrl, window.location.origin);
    Object.keys(params).forEach((k) => { const v = params[k]; if (v !== '' && v !== null && v !== undefined) url.searchParams.append(k, String(v)); });
    return url;
};

ApiClient.prototype._requestWithRetry = function(params: Record<string, unknown>, cacheKey: string | null = null, cacheTTL: number | null = null, attempt: number = 0) {
    if (cacheKey) { const cached = this._getCache(cacheKey); if (cached) { this._metrics.cacheHits++; return Promise.resolve(cached); } }
    this._metrics.calls++;
    const startTime = performance.now();
    this._controller = new AbortController();
    const controller = this._controller;
    const timeoutId = setTimeout(() => { controller.abort(); }, this._timeout);
    const url = this._buildUrl(params);
    return fetch(url.toString(), { method: 'GET', headers: { 'Accept': 'application/json' }, credentials: 'same-origin', signal: controller.signal }).then((response) => {
        clearTimeout(timeoutId);
        if (!response.ok) throw new Error(`HTTP_${response.status}`);
        return response.json();
    }).then((data) => {
        const duration = performance.now() - startTime;
        if (cacheKey && data.ok !== false) this._setCache(cacheKey, data, cacheTTL || this._cacheTTL);
        this._metrics.successes++;
        this._emitEvent(API_EVENTS.SUCCESS, { endpoint: params.action, duration });
        return data;
    }).catch((error) => {
        clearTimeout(timeoutId);
        const duration = performance.now() - startTime;
        const errorCode = error.name === 'AbortError' ? 'REQUEST_TIMEOUT' : (error.message || 'NETWORK_ERROR');
        if (attempt < RETRY_CONFIG.maxRetries && this._isRetryable(errorCode)) {
            this._metrics.retries++;
            const delay = this._getRetryDelay(attempt);
            _log('warn', `Retry ${attempt + 1}/${RETRY_CONFIG.maxRetries} for ${params.action} in ${delay}ms`);
            return this._sleep(delay).then(() => this._requestWithRetry(params, cacheKey, cacheTTL, attempt + 1));
        }
        this._metrics.failures++;
        this._emitEvent(API_EVENTS.ERROR, { endpoint: params.action, error: errorCode, duration, attempts: attempt + 1 });
        return { ok: false, error: errorCode };
    });
};

ApiClient.prototype._emitEvent = (eventKey: string, data: Record<string, unknown> = {}) => {
    _initPorts();
    const eventBus = _getPort('eventBus');
    if (eventBus?.emit) { eventBus.emit(eventKey, { moduleId: MODULE_ID, timestamp: Date.now(), ...data }); }
};

ApiClient.prototype.fetchKPIs = function() { return this._requestWithRetry({ action: 'kpis' }, 'kpis'); };
ApiClient.prototype.fetchClientes = function(params: Record<string, unknown> = {}) { return this._requestWithRetry({ action: 'list', ...params }, null); };
ApiClient.prototype.fetchCliente360 = function(id: unknown) { return this._requestWithRetry({ id }, `cliente360_${id}`, 60000); };
ApiClient.prototype.fetchCharts = function() { return this._requestWithRetry({ action: 'charts' }, 'charts', 60000); };
ApiClient.prototype.fetchTopClientes = function(limit = 10) { return this._requestWithRetry({ action: 'top', limit }, 'top', 60000); };
ApiClient.prototype.fetchVendedores = function() { return this._requestWithRetry({ action: 'vendedores' }, 'vendedores', 60000); };
ApiClient.prototype.fetchInsights = function() { return this._requestWithRetry({ action: 'insights' }, 'insights', 30000); };
ApiClient.prototype.fetchComparativo = function(periodo = 'mes') { return this._requestWithRetry({ action: 'compare', periodo }, `compare_${periodo}`, 60000); };
ApiClient.prototype.fetchFunil = function() { return this._requestWithRetry({ action: 'funil' }, 'funil', 60000); };
ApiClient.prototype.fetchMetrics = function() { return this._requestWithRetry({ action: 'metrics' }, 'metrics', 60000); };
ApiClient.prototype.fetchChurn = function() { return this._requestWithRetry({ action: 'churn' }, 'churn', 60000); };
ApiClient.prototype.fetchRanking = function(tipo = 'receita', periodo = '12m') { return this._requestWithRetry({ action: 'ranking', tipo, periodo }, `ranking_${tipo}_${periodo}`, 60000); };
ApiClient.prototype.fetchHeatmap = function() { return this._requestWithRetry({ action: 'heatmap' }, 'heatmap', 120000); };

ApiClient.prototype.searchClientes = function(query: string, limit = 8) { if (query.length < 2) return Promise.resolve({ ok: true, data: [] }); return this._requestWithRetry({ action: 'search', q: query, limit }, null); };

ApiClient.prototype.getExportUrl = function(params: Record<string, unknown> = {}) {
    const url = this._buildUrl({ action: 'export' });
    Object.keys(params).forEach((k) => { const v = params[k]; if (v && v !== 'all') url.searchParams.append(k, v); });
    return url.toString();
};

ApiClient.prototype.fetchAllData = function(params: Record<string, unknown> = {}) {
    const startTime = performance.now();
    return Promise.all([this.fetchKPIs(), this.fetchClientes(params), this.fetchCharts(), this.fetchTopClientes(10), this.fetchVendedores(), this.fetchInsights(), this.fetchComparativo('mes'), this.fetchFunil(), this.fetchMetrics(), this.fetchChurn(), this.fetchRanking('receita', '12m'), this.fetchHeatmap()]).then((results) => {
        const duration = performance.now() - startTime;
        this._emitEvent(API_EVENTS.BATCH_COMPLETE, { duration, endpoints: 12 });
        return { ok: true, kpis: results[0].ok ? results[0].data : null, clientes: results[1].ok ? results[1].data : null, charts: results[2].ok ? results[2].data : null, topClientes: results[3].ok ? results[3].data : null, vendedores: results[4].ok ? results[4].data : null, insights: results[5].ok ? results[5].data : null, comparativo: results[6].ok ? results[6].data : null, funil: results[7].ok ? results[7].data : null, metrics: results[8].ok ? results[8].data : null, churn: results[9].ok ? results[9].data : null, ranking: results[10].ok ? results[10].data : null, heatmap: results[11].ok ? results[11].data : null };
    });
};

ApiClient.prototype._getCache = function(key: string) { const item = this._cache.get(key); if (!item) return null; if (Date.now() > item.expires) { this._cache.delete(key); return null; } return item.data; };
ApiClient.prototype._setCache = function(key: string, data: unknown, ttl: number) { this._cache.set(key, { data, expires: Date.now() + ttl }); };
ApiClient.prototype.clearCache = function() { const size = this._cache.size; this._cache.clear(); return { ok: true, cleared: size }; };
ApiClient.prototype.cancel = function() { if (this._controller) this._controller.abort(); };
ApiClient.prototype.getMetrics = function() { return { ...this._metrics, cacheSize: this._cache.size, successRate: this._metrics.calls > 0 ? (this._metrics.successes / this._metrics.calls) : 1 }; };
ApiClient.prototype.resetMetrics = function() { this._metrics = { calls: 0, successes: 0, failures: 0, retries: 0, cacheHits: 0 }; return { ok: true }; };
ApiClient.prototype.info = function() { return { moduleId: MODULE_ID, version: VERSION, cacheSize: this._cache.size, metrics: this.getMetrics(), retryConfig: RETRY_CONFIG }; };

ApiClient.prototype.healthCheck = function() {
    const metrics = this.getMetrics();
    const checks = { lowFailureRate: metrics.successRate >= 0.8, cacheOperational: true, retriesReasonable: metrics.retries < metrics.calls * 0.3 };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, metrics, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
};

type ApiClientType = {
  fetchAllData: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
  fetchClientes: (params: Record<string, unknown>) => Promise<Record<string, unknown>>;
  fetchCliente360: (id: unknown) => Promise<Record<string, unknown>>;
  fetchKPIs: () => Promise<Record<string, unknown>>;
  fetchCharts: () => Promise<Record<string, unknown>>;
  fetchTopClientes: (limit?: number) => Promise<Record<string, unknown>>;
  fetchVendedores: () => Promise<Record<string, unknown>>;
  fetchInsights: () => Promise<Record<string, unknown>>;
  fetchComparativo: (periodo?: string) => Promise<Record<string, unknown>>;
  fetchFunil: () => Promise<Record<string, unknown>>;
  fetchMetrics: () => Promise<Record<string, unknown>>;
  fetchChurn: () => Promise<Record<string, unknown>>;
  fetchRanking: (tipo?: string, periodo?: string) => Promise<Record<string, unknown>>;
  fetchHeatmap: () => Promise<Record<string, unknown>>;
  searchClientes: (query: string, limit?: number) => Promise<Record<string, unknown>>;
  getExportUrl: (params?: Record<string, unknown>) => string;
  cancel: () => void;
  clearCache: () => { ok: boolean; cleared: number };
  getMetrics: () => Record<string, unknown>;
  resetMetrics: () => { ok: boolean };
  healthCheck: () => { status: string; [key: string]: unknown };
  info: () => Record<string, unknown>;
};
const apiClient = new (ApiClient as unknown as { new(): ApiClientType })();

export { apiClient, API_EVENTS, VERSION, MODULE_ID };
export default apiClient;
