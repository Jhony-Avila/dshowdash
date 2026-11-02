// Kernel Logger
// @version 1.2.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: MODULE_ID from constants-local.js
// PROVIDES: createLogger(loggerInstance)
// BROWSER-APIS: console (fallback)
'use strict';

import { MODULE_ID } from '../constants-local.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';

export function createLogger(loggerInstance: Record<string, Function> | null) {
  return function log(level: string, message: string, data?: Record<string, unknown>) {
    if (loggerInstance && loggerInstance[level]) {
      loggerInstance[level]('[' + MODULE_ID + '] ' + message, data);
    } else if (typeof console !== 'undefined' && (console as unknown as Record<string, Function>)[level]) {
      (console as unknown as Record<string, Function>)[level]('[' + MODULE_ID + '] ' + message, data || '');
    }
  };
}

export default { createLogger };
