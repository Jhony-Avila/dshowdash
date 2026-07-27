// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-DEBUG-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger
// PURPOSE: Offline Mode Manager - Logger
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../constants.js
//   _listeners, incrementMetric from ../state.js
//   createLogger from ../../logger.js
//
// PROVIDES:
//   _log() — exported function
//   _emit() — exported function
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

import { MODULE_ID } from '../constants.js';
import { _listeners, incrementMetric } from '../state.js';
import { createLogger } from '../../logger.js';

export const VERSION = '15.2.0-MODULAR';

const logger = createLogger(MODULE_ID);

export function _log(level: string, ...args: unknown[]) {
  const message = args[0];
  const data = args.length > 1 ? args.slice(1) : undefined;
  
  if (level === 'error') logger.error((message as string), data);
  // @ts-expect-error TS migration - TS2345
  else if (level === 'warn') logger.warn((message as string), (data as Record<string, unknown>[]));
  // @ts-expect-error TS migration - TS2345
  else if (level === 'debug') logger.debug((message as string), (data as Record<string, unknown>[]));
  // @ts-expect-error TS migration - TS2345
  else logger.info((message as string), (data as Record<string, unknown>[]));
}

export function _emit(event: string, data: Record<string, unknown>) {
  _listeners.forEach(listener => {
    try {
      listener({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      incrementMetric('errors');
    }
  });
}
