// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger
// PURPOSE: Logger Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from /assets/js/core/logger-global/index.js
//   MODULE_ID from ../constants.js
//   _listeners, incrementMetric from ../state.js
//
// PROVIDES:
//   log() — exported function
//   emit() — exported function
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
import { MODULE_ID } from '../constants.js';
import { _listeners, incrementMetric } from '../state.js';

export const VERSION = '15.2.0-MODULAR';

const _logger = createLogger(MODULE_ID);

export function log(level: string, ...args: unknown[]) {
  const message = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
  if (level === 'error') _logger.error(message);
  else if (level === 'warn') _logger.warn(message);
  else _logger.debug(message);
}

export function emit(event: string, data: Record<string, unknown>) {
  _listeners.forEach(listener => {
    try {
      listener({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      incrementMetric('errors');
    }
  });
}
