// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:timeout
// PURPOSE: Async Helpers - Timeout Wrappers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_TIMEOUTS from ./constants.js
//   incrementTotal, incrementCompleted, incrementTimedOut, updateDurationMetrics ...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   withTimeout() — exported function
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
import { incrementTotal, incrementCompleted, incrementTimedOut, updateDurationMetrics } from './metrics.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:timeout';

// Executa Promise com timeout obrigatório
export function withTimeout(promise: unknown, timeoutMs: number = DEFAULT_TIMEOUTS.MEDIUM, options: Record<string, any> = {}) {
  const { 
    timeoutError = null, 
    onTimeout = null,
    operation = 'async operation'
  } = options;
  
  if (!(promise instanceof Promise)) {
    return Promise.resolve(promise);
  }
  
  incrementTotal();
  const startTime = performance.now();
  
  return new Promise((resolve, reject) => {
    let settled = false;
    
    const timeoutId = setTimeout(() => {
      if (!settled) {
        settled = true;
        incrementTimedOut();
        
        const error = timeoutError || new Error(`Timeout: ${operation} exceeded ${timeoutMs}ms`);
        error.name = 'TimeoutError';
        error.timeout = timeoutMs;
        error.operation = operation;
        
        onTimeout?.(error);
        reject(error);
      }
    }, timeoutMs);
    
    promise
      .then(result => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          incrementCompleted();
          updateDurationMetrics(performance.now() - startTime);
          resolve(result);
        }
      })
      .catch(error => {
        if (!settled) {
          settled = true;
          clearTimeout(timeoutId);
          reject(error);
        }
      });
  });
}

// Executa função async com timeout
export async function executeWithTimeout(asyncFn: Record<string, unknown>, timeoutMs = DEFAULT_TIMEOUTS.MEDIUM, options: Record<string, any> = {}) {
  const { args = [], context = null, operation = 'function execution' } = options;
  
  return withTimeout(
    (asyncFn.apply as (...args: unknown[]) => unknown)(context, args),
    timeoutMs,
    { ...options, operation }
  );
}

// Executa com AbortController e timeout
export async function withAbortAndTimeout(asyncFn: Record<string, unknown>, options: Record<string, any> = {}) {
  const { 
    key = null, 
    timeoutMs = DEFAULT_TIMEOUTS.MEDIUM, 
    onAbort = null,
    onTimeout = null,
    operation = 'async operation',
    createAbortController
  } = options;
  
  if (!createAbortController) {
    throw new Error('createAbortController is required');
  }
  
  const { controller, signal, cleanup } = createAbortController(key);
  const startTime = performance.now();
  incrementTotal();
  
  const timeoutId = setTimeout(() => {
    controller.abort(new Error(`Timeout after ${timeoutMs}ms`));
  }, timeoutMs);
  
  try {
    const result = await (asyncFn as unknown as (...args: unknown[]) => unknown)(signal);
    clearTimeout(timeoutId);
    cleanup();
    incrementCompleted();
    updateDurationMetrics(performance.now() - startTime);
    return result;
  } catch (error: any) {
    clearTimeout(timeoutId);
    cleanup();
    
    if (error.name === 'AbortError' || signal.aborted) {
      if (error.message?.includes('Timeout')) {
        incrementTimedOut();
        onTimeout?.(error);
      } else {
        onAbort?.(error);
      }
      return null;
    }
    
    throw error;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['withTimeout', 'executeWithTimeout', 'withAbortAndTimeout']
  };
}

export default {
  VERSION, MODULE_ID,
  withTimeout, executeWithTimeout, withAbortAndTimeout,
  info
};
