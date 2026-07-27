// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:async-helpers:utils
// PURPOSE: Async Helpers - Utilitários
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_TIMEOUTS from ./constants.js
//   createAbortController, abortByKey from ./abort-controller.js
//   withTimeout, withAbortAndTimeout from ./timeout.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   delay() — exported function
//   createDebouncedAsync() — exported function
//   info() — exported function
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

import { DEFAULT_TIMEOUTS } from './constants.js';
import { createAbortController, abortByKey } from './abort-controller.js';
import { withTimeout, withAbortAndTimeout } from './timeout.js';

export const VERSION = '2.0.0-MODULAR';
export const MODULE_ID = 'container-main:async-helpers:utils';

// Delay com abort support
export function delay(ms: number, signal: AbortSignal | null = null) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('Delay aborted'));
      return;
    }
    
    const timeoutId = setTimeout(resolve, ms);
    
    signal?.addEventListener('abort', () => {
      clearTimeout(timeoutId);
      reject(new Error('Delay aborted'));
    });
  });
}

// Debounced async com abort automático
export function createDebouncedAsync(asyncFn: unknown, delayMs = 300, options: Record<string, unknown> = {}) {
  const { timeoutMs = DEFAULT_TIMEOUTS.MEDIUM } = options;
  let timeoutId: unknown = null;
  let currentKey: unknown = null;
  
  const debounced = async (...args: unknown[]) => {
    if (currentKey) {
      abortByKey((currentKey as string));
    }
    
    if (timeoutId) {
      // @ts-expect-error TS migration - TS2769
      clearTimeout(timeoutId);
    }
    
    return new Promise((resolve, reject) => {
      timeoutId = setTimeout(async () => {
        currentKey = `debounced-${Date.now()}`;
        try {
          const result = await withAbortAndTimeout(
            // @ts-expect-error TS migration - TS2345
            (signal: AbortSignal) => (asyncFn as (...args: unknown[]) => unknown)(...args, signal),
            { key: currentKey, timeoutMs, createAbortController }
          );
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }, delayMs);
    });
  };
  
  debounced.cancel = () => {
    // @ts-expect-error TS migration - TS2769
    if (timeoutId) clearTimeout(timeoutId);
    if (currentKey) abortByKey((currentKey as string));
  };
  
  return debounced;
}

// Race com abort dos perdedores
export async function raceWithAbort(asyncFns: Record<string, unknown>, options: Record<string, unknown> = {}) {
  const { key = `race-${Date.now()}`, timeoutMs = DEFAULT_TIMEOUTS.MEDIUM } = options;
  const controllers = (asyncFns.map as (...args: unknown[]) => unknown)((_: unknown, i: number) => createAbortController(`${key}-${i}`));
  
  try {
    const result = await withTimeout(
      // @ts-expect-error TS migration - TS2769, TS7053
      Promise.race((asyncFns.map as (...args: unknown[]) => unknown)((fn: (...args: unknown[]) => void, i: number) => fn(controllers[i].signal))),
      timeoutMs as number,
      { operation: 'race operation' }
    );
    
    (controllers as unknown[]).forEach((c: unknown) => ((c as Record<string, unknown>).abort as (...args: unknown[]) => unknown)('Race completed'));
    return result;
  } catch (error) {
    (controllers as unknown[]).forEach((c: unknown) => ((c as Record<string, unknown>).abort as (...args: unknown[]) => unknown)('Race failed'));
    throw error;
  }
}

// Executa em paralelo com limite de concorrência
export async function parallelLimit(asyncFns: Record<string, unknown>, limit = 5, options: Record<string, unknown> = {}) {
  const { timeoutMs = DEFAULT_TIMEOUTS.LONG } = options;
  const results = [];
  const executing = [];
  
  // @ts-expect-error TS migration - TS2488
  for (const [index, fn] of (asyncFns.entries as (...args: unknown[]) => unknown)()) {
    const promise = withTimeout(fn(), timeoutMs as number, { operation: `parallel task ${index}` })
      .then(result => ({ status: 'fulfilled', value: result, index }))
      .catch(error => ({ status: 'rejected', reason: error, index }));
    
    results.push(promise);
    executing.push(promise);
    
    if (executing.length >= limit) {
      await Promise.race(executing);
      executing.splice(executing.findIndex(p => p === promise), 1);
    }
  }
  
  return Promise.all(results);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ['delay', 'createDebouncedAsync', 'raceWithAbort', 'parallelLimit']
  };
}

export default {
  VERSION, MODULE_ID,
  delay, createDebouncedAsync, raceWithAbort, parallelLimit,
  info
};
