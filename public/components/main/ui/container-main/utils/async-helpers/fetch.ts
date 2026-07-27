// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:fetch
// PURPOSE: Async Helpers - Fetch com Timeout
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_TIMEOUTS from ./constants.js
//   createAbortController from ./abort-controller.js
//   incrementTotal, incrementCompleted, incrementTimedOut, updateDurationMetrics ...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   fetchWithAbort — exported value
//   info() — exported function
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

import { DEFAULT_TIMEOUTS } from './constants.js';
import { createAbortController } from './abort-controller.js';
import { incrementTotal, incrementCompleted, incrementTimedOut, updateDurationMetrics } from './metrics.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:fetch';

// Fetch com timeout obrigatório e abort
export async function fetchWithTimeout(url: string, options: Record<string, any> = {}) {
  const { 
    timeout = DEFAULT_TIMEOUTS.FETCH,
    abortKey = null,
    onTimeout = null,
    ...fetchOptions 
  } = options;
  
  const { controller, signal, cleanup } = createAbortController(abortKey || `fetch-${url}`);
  const startTime = performance.now();
  incrementTotal();
  
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Fetch timeout after ${timeout}ms: ${url}`));
  }, timeout);
  
  try {
    const response = await fetch(url, { ...fetchOptions, signal });
    clearTimeout(timeoutId);
    cleanup();
    incrementCompleted();
    updateDurationMetrics(performance.now() - startTime);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    cleanup();
    
    if (error.name === 'AbortError') {
      incrementTimedOut();
      const timeoutError = new Error(`Request timeout: ${url}`);
      timeoutError.name = 'TimeoutError';

      // @ts-expect-error TS migration - TS2339
      timeoutError.url = url;
      onTimeout?.(timeoutError);
      throw timeoutError;
    }
    
    throw error;
  }
}

// Alias para compatibilidade
export const fetchWithAbort = fetchWithTimeout;

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['fetchWithTimeout', 'fetchWithAbort']
  };
}

function destroy() { }

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default {
  VERSION, MODULE_ID,
  fetchWithTimeout, fetchWithAbort,
  info
};
