// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: _shared/api/fetch-base
// PURPOSE: Panel Fetch/Request Factory
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createModuleFetch() — exported function (factory)
//
// RECEIVES (via init/options): moduleId
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = '_shared/api/fetch-base';

export function createModuleFetch(moduleId: string) {
  const MODULE_ID = moduleId;

  const _config = {
    baseUrl: '',
    timeout: 30000,
    retries: 0,
    retryDelay: 1000
  };

  let _metrics: { requestCount: number; successCount: number; errorCount: number; abortCount: number; timeoutCount: number; retryCount: number; lastRequestAt: number | null } = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, timeoutCount: 0, retryCount: 0, lastRequestAt: null };

  async function request(method: string, url: string, options: Record<string, unknown> = {}) {
    const timeoutMs = options.timeoutMs || options.timeout || _config.timeout;
    const maxRetries = options.retries !== undefined ? options.retries : _config.retries;
    const retryDelay = options.retryDelayMs || options.retryDelay || _config.retryDelay;
    let lastError = null;

    for (let attempt = 0; attempt <= Number(maxRetries); attempt++) {
      let controller: AbortController | null = null;
      let timeoutId = null;
      let signal = options.signal || null;

      if (!signal) {
        controller = new AbortController();
        signal = controller.signal;
        timeoutId = setTimeout(() => controller!.abort(), Number(timeoutMs));
      }

      _metrics.requestCount++;
      _metrics.lastRequestAt = Date.now();
      const timestamp = Date.now();

      try {
        const fetchOptions: RequestInit = { method, signal: signal as AbortSignal, headers: { 'Content-Type': 'application/json', ...(options.headers as Record<string, string>) } };

        if (options.credentials) fetchOptions.credentials = options.credentials as RequestCredentials;
        if (options.body) fetchOptions.body = options.body as BodyInit;

        const response = await fetch(url, fetchOptions);
        if (timeoutId) clearTimeout(timeoutId);

        const statusCode = response.status;
        if (!response.ok) {
          const errorText = await response.text().catch(() => response.statusText);
          _metrics.errorCount++;
          return { ok: false, error: 'HTTP ' + statusCode + ': ' + errorText, statusCode, aborted: false, timeout: false, retryCount: attempt, timestamp, moduleId: MODULE_ID, version: VERSION };
        }

        const data = await response.json();
        _metrics.successCount++;
        return { ok: true, data, statusCode, aborted: false, timeout: false, retryCount: attempt, timestamp, moduleId: MODULE_ID, version: VERSION };

      } catch (error: any) {
        if (timeoutId) clearTimeout(timeoutId);
        lastError = error;
        const isAbort = error.name === 'AbortError';
        const isTimeout = isAbort && !!controller;

        if (isTimeout) _metrics.timeoutCount++;
        if (isAbort) {
          _metrics.abortCount++;
          _metrics.errorCount++;
          return { ok: false, error: isTimeout ? 'TIMEOUT' : 'ABORTED', aborted: true, timeout: isTimeout, retryCount: attempt, timestamp, moduleId: MODULE_ID, version: VERSION };
        }

        if (attempt < Number(maxRetries)) {
          _metrics.retryCount++;
          await new Promise(function(r) { setTimeout(r, Number(retryDelay) * (attempt + 1)); });
          continue;
        }

        _metrics.errorCount++;
        return { ok: false, error: error.message, aborted: false, timeout: false, retryCount: attempt, timestamp, moduleId: MODULE_ID, version: VERSION };
      }
    }

    _metrics.errorCount++;
    return { ok: false, error: lastError ? lastError.message : 'UNKNOWN', aborted: false, timeout: false, timestamp: Date.now(), moduleId: MODULE_ID, version: VERSION };
  }

  async function get(url: string, options: Record<string, unknown> = {}) {
    return request('GET', url, options);
  }

  async function post(url: string, data: unknown, options: Record<string, unknown> = {}) {
    return request('POST', url, { ...options, body: JSON.stringify(data) });
  }

  function configure(config: Record<string, unknown>) {
    Object.assign(_config, config);
  }

  function healthCheck() {
    return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics };
  }

  function info() {
    return { version: VERSION, moduleId: MODULE_ID, config: _config, metrics: _metrics, healthCheck: healthCheck() };
  }

  function getMetrics() { return { ..._metrics }; }
  function resetMetrics() { _metrics = { requestCount: 0, successCount: 0, errorCount: 0, abortCount: 0, timeoutCount: 0, retryCount: 0, lastRequestAt: null }; }

  return { request, get, post, configure, healthCheck, info, getMetrics, resetMetrics, MODULE_ID, VERSION };
}
