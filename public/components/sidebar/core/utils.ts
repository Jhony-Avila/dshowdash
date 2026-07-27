// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-core-utils
// PURPOSE: Sidebar Core - Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RESILIENCE_CONFIG, CSS_PATH from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   withTimeout() — exported function
//   normalizeRoute() — exported function
//   isCSSLoaded() — exported function
//   resetCSSLoaded() — exported function
//   getMetrics() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.7.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar-core-utils';

import { RESILIENCE_CONFIG, CSS_PATH } from './constants.js';


let _cssLoaded = false;
let _metrics = { timeoutCalls: 0, retryCalls: 0, cssLoadAttempts: 0, cssLoadSuccess: 0, cssLoadFailed: 0 };

export function withTimeout(promise: DynObj, ms: number, errorMessage = 'Timeout') {
  _metrics.timeoutCalls++;
  return Promise.race([promise, new Promise((_, reject) => setTimeout(() => reject(new Error(errorMessage)), ms))]);
}

export async function withRetry(fn: DynObj, maxRetries = 3, delay = 1000) {
  _metrics.retryCalls++;
  let lastError;
  for (let i = 0; i < maxRetries; i++) {
    try { return await fn(); }
    catch (error) { lastError = error; if (i < maxRetries - 1) await new Promise(r => setTimeout(r, delay * Math.pow(2, i))); }
  }
  throw lastError;
}

export async function loadCSS() {
  _metrics.cssLoadAttempts++;
  if (_cssLoaded) return true;
  const existing = document.querySelector(`link[href="${CSS_PATH}"]`);
  if (existing) { _cssLoaded = true; _metrics.cssLoadSuccess++; return true; }
  try {
    const result = await withTimeout(
      new Promise((resolve) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CSS_PATH;
        link.onload = () => { _cssLoaded = true; _metrics.cssLoadSuccess++; resolve(true); };
        link.onerror = () => { _metrics.cssLoadFailed++; resolve(false); };
        document.head.appendChild(link);
      }),
      RESILIENCE_CONFIG.cssTimeout,
      'CSS load timeout'
    );
    return result;
  } catch (error) { _metrics.cssLoadFailed++; return false; }
}

export function normalizeRoute(route: string) { if (!route) return ''; return route.replace(/^[#/]+/, '').toLowerCase(); }
export function isCSSLoaded() { return _cssLoaded; }
export function resetCSSLoaded() { _cssLoaded = false; }
export function getMetrics() { return { ..._metrics, cssLoaded: _cssLoaded }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, cssLoaded: _cssLoaded, cssPath: CSS_PATH, metrics: getMetrics() }; }

export function healthCheck() {
  const checks = { cssLoaded: _cssLoaded, noLoadFailures: _metrics.cssLoadFailed === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 2 ? 'HEALTHY' : passed === 1 ? 'DEGRADED' : 'UNHEALTHY';
  return { status, score: passed, maxScore: 2, version: VERSION, moduleId: MODULE_ID, checks, metrics: getMetrics(), timestamp: Date.now() };
}

export default { withTimeout, withRetry, loadCSS, normalizeRoute, isCSSLoaded, resetCSSLoaded, healthCheck, info, getMetrics, VERSION, MODULE_ID };
