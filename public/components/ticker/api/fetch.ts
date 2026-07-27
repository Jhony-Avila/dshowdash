// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.api.fetch
// PURPOSE: Ticker Data API (Enterprise AAA)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'abort'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '7.3.0-P17WI';
export const MODULE_ID = 'ticker.api.fetch';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debug = () => { const cfg = _getPort('config'); return cfg?.app?.debug ?? false; };
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (!logger) return; if (!_debug() && level === 'debug') return; const fn = logger[level] || logger.info; if (typeof fn === 'function') fn(`[${MODULE_ID}]`, ...args); };
export class NewsAPI {
  [key: string]: any;
  constructor(options: { baseURL?: string; timeout?: number } = {}) { this.baseURL = options.baseURL || '/api/news'; this.timeout = options.timeout || 8000; this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, lastRequestAt: null }; }
  async fetchNews(externalSignal: AbortSignal | null = null) { this._metrics.requestCount++; this._metrics.lastRequestAt = Date.now(); const timeoutController = new AbortController(); const timeoutId = setTimeout(() => timeoutController.abort(), this.timeout); const combinedSignal = externalSignal ? this._combineSignals(externalSignal, timeoutController.signal) : timeoutController.signal; try { const url = `${this.baseURL}/get_ticker_data.php`; const response = await fetch(url, { signal: combinedSignal, headers: { 'Content-Type': 'application/json' } }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (!data.ok || !Array.isArray(data.data)) throw new Error('Invalid response format'); this._metrics.successCount++; _log('debug', `Fetched ${data.data.length} items`); return data.data; } catch (error: any) { clearTimeout(timeoutId); if (error.name === 'AbortError') { this._metrics.abortCount++; _log('debug', 'Fetch aborted'); throw error; } this._metrics.errorCount++; _log('error', 'Fetch error:', error.message); try { return await this.fetchNewsOnly(externalSignal); } catch (fallbackError) { throw error; } } }
  async fetchNewsOnly(externalSignal: AbortSignal | null = null) { const timeoutController = new AbortController(); const timeoutId = setTimeout(() => timeoutController.abort(), this.timeout); const combinedSignal = externalSignal ? this._combineSignals(externalSignal, timeoutController.signal) : timeoutController.signal; try { const url = `${this.baseURL}/get_news.php`; const response = await fetch(url, { signal: combinedSignal, headers: { 'Content-Type': 'application/json' } }); clearTimeout(timeoutId); if (!response.ok) throw new Error(`HTTP ${response.status}`); const data = await response.json(); if (!data.ok || !Array.isArray(data.data)) throw new Error('Invalid response format'); return data.data.map((item: Record<string, unknown>) => ({ ...item, type: 'news' })); } catch (error: any) { clearTimeout(timeoutId); throw error; } }
  _combineSignals(signal1: AbortSignal, signal2: AbortSignal) { const controller = new AbortController(); const abort = () => controller.abort(); if (signal1.aborted || signal2.aborted) { controller.abort(); return controller.signal; } signal1.addEventListener('abort', abort, { once: true }); signal2.addEventListener('abort', abort, { once: true }); return controller.signal; }
  healthCheck() { const logger = _getPort('logger'); const checks = { hasEndpoint: !!this.baseURL, goodSuccessRate: this._metrics.requestCount === 0 || (this._metrics.successCount / this._metrics.requestCount) > 0.5, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 4 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, baseURL: this.baseURL, endpoint: '/get_ticker_data.php', metrics: this._metrics, portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; }
  getMetrics() { return { ...this._metrics }; }
  resetMetrics() { this._metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, lastRequestAt: null }; }
  destroy() { this.resetMetrics?.(); }
}
export function getVersion() { return VERSION; }
export default NewsAPI;
