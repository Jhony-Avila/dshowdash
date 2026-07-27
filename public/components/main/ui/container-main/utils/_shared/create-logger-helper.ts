// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-SHARED)
// ═══════════════════════════════════════════════════════════════
// MODULE: _shared.create-logger-helper
// PURPOSE: Factory para helpers/logger.js dos managers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from /assets/js/core/logger-global/index.js
//
// PROVIDES:
//   createLoggerHelper(MODULE_ID, _listeners, incrementMetric)
//     returns { _log, _emit }
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

import { createLogger } from '/assets/js/core/logger-global/index.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils._shared.create-logger-helper';

export function createLoggerHelper(MODULE_ID: unknown, _listeners: Record<string, unknown>, incrementMetric: (key: string) => void) {
  const _logger = createLogger(MODULE_ID);

  function _log(level: string, ...args: unknown[]) {
    const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
    if (level === 'error') _logger.error(message);
    else if (level === 'warn') _logger.warn(message);
    else _logger.debug(message);
  }

  function _emit(event: string, data: Record<string, unknown>) {
    (_listeners.forEach as (...args: unknown[]) => unknown)((listener: (...args: unknown[]) => void) => {
      try {
        listener({ type: event, data, timestamp: Date.now() });
      } catch (e) {
        incrementMetric('errors');
      }
    });
  }

  return { _log, _emit };
}
