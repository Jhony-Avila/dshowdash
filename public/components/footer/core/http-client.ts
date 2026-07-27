// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.http-client
// PURPOSE: Footer HTTP Client - Fetch with retry and abort support
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract FETCH_WITH_RETRY - fetchWithRetry() fetches with exponential backoff
// @contract ABORT_PENDING - abortPendingRequests() aborts pending requests
// @contract GET_ABORT_CONTROLLER - getAbortController() returns abort controller
// @contract CREATE_ABORT_CONTROLLER - createAbortController() creates new abort controller
// @contract GET_METRICS - getMetrics() returns HTTP metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   fetchWithRetry() — exported function
//   abortPendingRequests() — exported function
//   getAbortController() — exported function
//   createAbortController() — exported function
//   isAbortControllerActive() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v9.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v9.3.0-ENTERPRISE: Previous enterprise version
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

const VERSION = '9.4.0-P2-ENTERPRISE';
const MODULE_ID = 'footer-http-client';

const _log = createLogger(MODULE_ID);

const CONFIG = {
  retry: { maxAttempts: 3, baseDelay: 1000, maxDelay: 5000 },
  timeout: 10000
};

let _abortController: AbortController|null = null;
let _metrics = { requests: 0, retries: 0, errors: 0, aborts: 0 };

function sleep(ms: unknown) {
  // @ts-expect-error TS migration - TS2769
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function fetchWithRetry(url: string, options = {}, attempt = 1) {
  _metrics.requests++;
  const { maxAttempts, baseDelay, maxDelay } = CONFIG.retry;

  if (!_abortController || _abortController.signal.aborted) {
    _abortController = new AbortController();
  }

  const fetchOptions = { ...options, signal: _abortController.signal };

  try {
    const timeoutId = setTimeout(() => _abortController!.abort(), CONFIG.timeout);
    const response = await fetch(url, fetchOptions);
    clearTimeout(timeoutId);

    if (!response.ok && attempt < maxAttempts) {
      _metrics.retries++;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      _log.warn(`Request failed (${response.status}), retry ${attempt}/${maxAttempts} in ${delay}ms`);
      await sleep(delay);
      return fetchWithRetry(url, options, attempt + 1);
    }
    return response;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      _metrics.aborts++;
      throw new Error('REQUEST_TIMEOUT');
    }
    if (attempt < maxAttempts) {
      _metrics.retries++;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      _log.warn(`Request error, retry ${attempt}/${maxAttempts} in ${delay}ms:`, error.message);
      await sleep(delay);
      _abortController = new AbortController();
      return fetchWithRetry(url, options, attempt + 1);
    }
    _metrics.errors++;
    throw error;
  }
}

export function abortPendingRequests() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}

export function getAbortController() { return _abortController; }
export function createAbortController() { _abortController = new AbortController(); return _abortController; }
export function isAbortControllerActive() { return !!_abortController && !_abortController.signal.aborted; }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, config: CONFIG, metrics: getMetrics() }; }
export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { httpReady: true }, metrics: getMetrics() };
}

export { MODULE_ID, VERSION };
export default { fetchWithRetry, abortPendingRequests, getAbortController, createAbortController, isAbortControllerActive, getMetrics, info, healthCheck, VERSION, MODULE_ID };
