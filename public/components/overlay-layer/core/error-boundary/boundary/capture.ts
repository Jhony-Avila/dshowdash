// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Capture
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SEVERITY from ../constants.js
//   config, errors, state, getErrorHandlers, metricsCollector from ../state.js
//   log from ../helpers/logger.js
//   createErrorRecord from ../helpers/record.js
//   attemptRecovery from ../recovery/attempt.js
//
// PROVIDES:
//   capture() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SEVERITY } from '../constants.js';
import { config, errors, state, getErrorHandlers, metricsCollector } from '../state.js';
import { log } from '../helpers/logger.js';
import { createErrorRecord } from '../helpers/record.js';
import { attemptRecovery } from '../recovery/attempt.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.boundary.capture';

export function capture(error: DynObj, context = {}) {
  if (!config.enabled) return null;
  
  const errorRecord = createErrorRecord(error, context);
  
  errors.push(errorRecord);
  state.totalErrors++;
  state.lastError = errorRecord;
  
  while (errors.length > config.maxErrors) {
    errors.shift();
  }
  
  log('error', `[${errorRecord.type}] ${errorRecord.message}`, {
    severity: errorRecord.severity,
    context: errorRecord.context
  });
  
  if (config.reportErrors && metricsCollector?.recordError) {
    metricsCollector.recordError(errorRecord.context.overlayType, error, errorRecord.context);
  }
  
  const handlers = getErrorHandlers();
  for (const handler of handlers) {
    try {
      handler(errorRecord);
    } catch (e: any) {
      log('warn', 'Error handler threw:', e.message);
    }
  }
  
  if (config.autoRecover && errorRecord.severity !== SEVERITY.CRITICAL) {
    attemptRecovery(errorRecord);
  }
  
  return errorRecord;
}
