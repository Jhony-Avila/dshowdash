// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: error-handler
// PURPOSE: Kernel Error Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ./constants.js
//   METRIC_TYPES from ../resources/metrics-persistence.js
//   KERNEL_UI_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createErrorHandler() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   KERNEL_UI_EVENT_NAMES.ERROR
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID } from './constants.js';
import { METRIC_TYPES } from '../resources/metrics-persistence.js';
import { KERNEL_UI_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '10.0.0-INTEGRATED';

export function createErrorHandler(options: Record<string, any> = {}) {
  const { metricsManager, eventBridge, onError } = options;

  const _errorMetrics = {
    totalErrors: 0,
    lastError: null as Record<string, unknown> | null
  };

  return {
    handle(error: Record<string, unknown>, context = '') {
      _errorMetrics.totalErrors++;
      _errorMetrics.lastError = { 
        error: error?.message || error, 
        context, 
        timestamp: Date.now() 
      };
      
      metricsManager?.record(MODULE_ID, 'error', 1, {
        type: METRIC_TYPES.COUNTER,
        tags: { context }
      });

      onError?.(error, context);
      eventBridge?.emit(KERNEL_UI_EVENT_NAMES.ERROR, { error: error?.message, context });
    },

    getMetrics() {
      return { ..._errorMetrics };
    },

    clearErrors() {
      _errorMetrics.totalErrors = 0;
      _errorMetrics.lastError = null;
    },

    getTotalErrors() {
      return _errorMetrics.totalErrors;
    },

    getLastError() {
      return _errorMetrics.lastError;
    }
  };
}

export default { createErrorHandler };
