// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-RESIZE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-installer
// PURPOSE: Error Handler Global Installer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ERROR_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createGlobalInstaller() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ERROR_EVENT_NAMES.REJECTION
//   ERROR_EVENT_NAMES.UNHANDLED
// LISTENS (eventos):
//   'error'
//   'unhandledrejection'
// WINDOW ACCESS:
//   window.addEventListener
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ERROR_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.error-handler.global-installer';

// Benign browser errors that should be silently ignored
const IGNORED_ERROR_PATTERNS = [
  'ResizeObserver loop completed with undelivered notifications',
  'ResizeObserver loop limit exceeded'
];

function isBenignError(message: string) {
  if (!message) return false;
  return IGNORED_ERROR_PATTERNS.some(pattern => message.includes(pattern));
}

export function createGlobalInstaller(options: Record<string, any> = {}) {
  const { errorStore, metricsTracker, emitter, logger } = options;

  let _globalHandler: unknown = null;
  let _installed = false;

  return {
    install(installOptions: Record<string, any> = {}) {
      const { onError, captureUnhandled = true, captureRejections = true } = installOptions;
      
      _globalHandler = onError;
      
      if (typeof window === 'undefined') return;
      if (_installed) return;
      
      if (captureUnhandled) {
        window.addEventListener('error', (event) => {
          // Skip benign browser errors (ResizeObserver, etc.)
          const errorMessage = event.error?.message || event.message || '';
          if (isBenignError(errorMessage)) {
            return;
          }

          const errorInfo = errorStore.createErrorInfo(event.error || new Error(event.message), {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            type: 'uncaught',
            operation: 'global'
          });
          
          metricsTracker.incrementTotal();
          metricsTracker.incrementUnhandled();
          metricsTracker.trackCategory(errorInfo.category);
          metricsTracker.trackSeverity(errorInfo.severity);
          
          errorStore.log(errorInfo);
          
          // @ts-expect-error TS migration - TS2349
          _globalHandler?.(errorInfo);
          emitter?.emit(ERROR_EVENT_NAMES.UNHANDLED, { errorInfo });
        });
      }
      
      if (captureRejections) {
        window.addEventListener('unhandledrejection', (event) => {
          // Skip benign promise rejections
          const rejectMessage = event.reason?.message || String(event.reason || '');
          if (isBenignError(rejectMessage)) {
            return;
          }

          const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
          const errorInfo = errorStore.createErrorInfo(error, {
            type: 'unhandledrejection',
            operation: 'promise'
          });
          
          metricsTracker.incrementTotal();
          metricsTracker.incrementUnhandled();
          metricsTracker.trackCategory(errorInfo.category);
          metricsTracker.trackSeverity(errorInfo.severity);
          
          errorStore.log(errorInfo);
          
          // @ts-expect-error TS migration - TS2349
          _globalHandler?.(errorInfo);
          emitter?.emit(ERROR_EVENT_NAMES.REJECTION, { errorInfo });
        });
      }
      
      _installed = true;
      logger?.debug('Error handler installed', { captureUnhandled, captureRejections });
    },

    getGlobalHandler() { return _globalHandler; },
    setGlobalHandler(handler: (...args: unknown[]) => void) { _globalHandler = handler; },
    isInstalled() { return _installed; }
  };
}

export default { createGlobalInstaller };
