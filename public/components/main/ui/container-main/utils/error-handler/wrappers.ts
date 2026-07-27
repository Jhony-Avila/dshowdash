// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: wrappers
// PURPOSE: Error Handler Wrappers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ERROR_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createWrappers() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ERROR_EVENT_NAMES.RECOVERED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ERROR_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

declare const context: Record<string, unknown>;
export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.error-handler.wrappers';

export function createWrappers(options: Record<string, unknown> = {}) {
  const { errorStore, metricsTracker, emitter, globalInstaller } = options as Record<string, any>;

  function processError(this: any, error: unknown, processOptions: Record<string, unknown> = {}) {
    const { context: contextOpt = {}, onError, fallback, recover = false, rethrow = true } = processOptions as { context?: Record<string, unknown>; onError?: (info: unknown) => void; fallback?: unknown; recover?: boolean; rethrow?: boolean };

    const errorInfo = errorStore.createErrorInfo(error, contextOpt);
    errorInfo.handled = true;
    
    metricsTracker.incrementTotal();
    metricsTracker.incrementHandled();
    metricsTracker.trackCategory(errorInfo.category);
    metricsTracker.trackSeverity(errorInfo.severity);
    
    errorStore.log(errorInfo);
    
    onError?.(errorInfo);
    globalInstaller?.getGlobalHandler()?.(errorInfo);
    
    if (recover && fallback !== undefined) {
      errorInfo.recovered = true;
      errorInfo.recoveryAttempts++;
      metricsTracker.incrementRecovered();
      
      emitter?.emit(ERROR_EVENT_NAMES.RECOVERED, { errorInfo });
      return typeof fallback === 'function' ? fallback(error, errorInfo) : fallback;
    }
    
    if (rethrow) throw error;
    return undefined;
  }

  return {
    withErrorBoundary(fn: (...args: unknown[]) => unknown, wrapperOptions: Record<string, unknown> = {}) {
      const { onError, fallback, recover = false, context: contextOpt2 = {}, moduleId } = wrapperOptions as { onError?: (info: unknown) => void; fallback?: unknown; recover?: boolean; context?: Record<string, unknown>; moduleId?: string };
      
      return function(...args: unknown[]) {
        try {
          // @ts-expect-error strict migration — TS2683
          const result = fn.apply(this, args);
          
          if (result instanceof Promise) {
            return result.catch(error => processError(error, { context: { ...contextOpt2, moduleId }, onError, fallback, recover, rethrow: !recover }));
          }

          return result;
        } catch (error) {
          return processError(error, { context: { ...contextOpt2, moduleId }, onError, fallback, recover, rethrow: !recover });
        }
      };
    },

    withAsyncErrorBoundary(asyncFn: (...args: unknown[]) => unknown, wrapperOptions: Record<string, unknown> = {}) {
      return this.withErrorBoundary(asyncFn, wrapperOptions);
    },

    tryCatch(fn: () => unknown, tryCatchOptions: Record<string, unknown> = {}) {
      const { onError, defaultValue = undefined, rethrow = false, context: contextOpt3 = {} } = tryCatchOptions as { onError?: (info: unknown) => void; defaultValue?: unknown; rethrow?: boolean; context?: Record<string, unknown> };

      try {
        return fn();
      } catch (error) {
        const errorInfo = errorStore.createErrorInfo(error, contextOpt3);
        errorInfo.handled = true;
        
        metricsTracker.incrementTotal();
        metricsTracker.incrementHandled();
        metricsTracker.trackCategory(errorInfo.category);
        metricsTracker.trackSeverity(errorInfo.severity);
        
        errorStore.log(errorInfo);
        onError?.(errorInfo);
        
        if (rethrow) throw error;
        return defaultValue;
      }
    },

    async tryCatchAsync(asyncFn: () => Promise<unknown>, tryCatchOptions: Record<string, unknown> = {}) {
      const { onError, defaultValue = undefined, rethrow = false, context: contextOpt4 = {}, timeout = 0 } = tryCatchOptions as { onError?: (info: unknown) => void; defaultValue?: unknown; rethrow?: boolean; context?: Record<string, unknown>; timeout?: number };

      try {
        if (timeout > 0) {
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
          });
          return await Promise.race([asyncFn(), timeoutPromise]);
        }
        return await asyncFn();
      } catch (error) {
        const errorInfo = errorStore.createErrorInfo(error, { ...contextOpt4, timeout });
        errorInfo.handled = true;
        
        metricsTracker.incrementTotal();
        metricsTracker.incrementHandled();
        metricsTracker.trackCategory(errorInfo.category);
        metricsTracker.trackSeverity(errorInfo.severity);
        
        errorStore.log(errorInfo);
        onError?.(errorInfo);
        
        if (rethrow) throw error;
        return defaultValue;
      }
    }
  };
}

export default { createWrappers };
