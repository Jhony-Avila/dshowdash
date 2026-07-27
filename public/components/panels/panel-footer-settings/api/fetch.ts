// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels/panel-footer-settings/api/fetch
// PURPOSE: Footer  - API Fetch
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   configure() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels/panel-footer-settings/api/fetch';

const _config = {
  baseUrl: '',
  timeout: 30000,
  retries: 3,
  retryDelay: 1000
};

let _metrics: { requestCount: number; successCount: number; errorCount: number; lastRequestAt: number | null } = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null };

export async function request(url: string, options: RequestInit & { timeout?: number } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeout || _config.timeout);
  
  _metrics.requestCount++;
  _metrics.lastRequestAt = Date.now();
  
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    
    clearTimeout(timeout);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    _metrics.successCount++;
    return await response.json();
    
  } catch (error) {
    clearTimeout(timeout);
    _metrics.errorCount++;
    throw error;
  }
}

export async function get(url: string, options: RequestInit & { timeout?: number } = {}) {
  return request(url, { ...options, method: 'GET' });
}

export async function post(url: string, data: unknown, options: RequestInit & { timeout?: number } = {}) {
  return request(url, { ...options, method: 'POST', body: JSON.stringify(data) });
}

export function configure(config: Partial<typeof _config>) {
  Object.assign(_config, config);
}

export function healthCheck() {
  return { status: 'healthy', version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics };
}

export function info() {
  return { version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics, healthCheck: healthCheck() };
}

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics = { requestCount: 0, successCount: 0, errorCount: 0, lastRequestAt: null }; }

export default { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics, VERSION, MODULE_ID };
