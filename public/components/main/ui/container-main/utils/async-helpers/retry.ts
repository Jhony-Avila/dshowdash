// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:retry
// PURPOSE: Async Helpers - Retry com Backoff
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_TIMEOUTS from ./constants.js
//   createAbortController from ./abort-controller.js
//   withTimeout from ./timeout.js
//   incrementRetried from ./metrics.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
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
import { withTimeout } from './timeout.js';
import { incrementRetried } from './metrics.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:retry';

// Retry com backoff exponencial e timeout por tentativa
export async function retryWithBackoff(asyncFn: unknown, options: Record<string, any> = {}) {
  const { 
    maxRetries = 3, 
    baseDelay = 1000, 
    maxDelay = 30000, 
    factor = 2,
    timeoutPerAttempt = DEFAULT_TIMEOUTS.MEDIUM,
    key = null,
    shouldRetry = (error: Record<string, unknown>, attempt: number) => attempt < maxRetries,
    onRetry = null
  } = options;
  
  const { signal, cleanup } = createAbortController(key);
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (signal.aborted) {
      cleanup();
      throw new Error('Operation aborted');
    }
    
    try {
      const result = await withTimeout(
        (asyncFn as (...args: unknown[]) => unknown)(signal, attempt),
        timeoutPerAttempt,
        { operation: `retry attempt ${attempt + 1}/${maxRetries + 1}` }
      );
      cleanup();
      return result;
    } catch (error) {
      lastError = error;
      
      if (signal.aborted || !shouldRetry(error, attempt)) {
        cleanup();
        throw error;
      }
      
      if (attempt < maxRetries) {
        incrementRetried();
        const delay = Math.min(baseDelay * Math.pow(factor, attempt), maxDelay);
        const jitter = delay * 0.1 * Math.random(); // 10% jitter
        
        onRetry?.(error, attempt + 1, delay + jitter);
        
        await new Promise(resolve => setTimeout(resolve, delay + jitter));
      }
    }
  }
  
  cleanup();
  throw lastError;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['retryWithBackoff']
  };
}

export default {
  VERSION, MODULE_ID,
  retryWithBackoff,
  info
};
