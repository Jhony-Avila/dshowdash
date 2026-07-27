// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/helpers/logger
// PURPOSE: Logging utility for Header Events module with level-based output
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../constants.js
//   getPort from ../ports.js
// PROVIDES:
//   debugEnabled() — checks if debug mode is active via config port
//   log(level, msg, data) — logs messages with module prefix at specified level
// ═══════════════════════════════════════════════════════════════
// Header Events - Logger
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B06: var → const/let
'use strict';

import { MODULE_ID } from '../constants.js';
import { getPort } from '../ports.js';

export const VERSION = '1.1.0-ES6';

export function debugEnabled() {
  const cfg = getPort('config');
  return cfg && cfg.app && cfg.app.debug;
}

export function log(level: string, msg: string, data?: Record<string,unknown>) {
  const logger = getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  try {
    if (level === 'error' && logger.error) { logger.error(prefix, msg, data); return; }
    if (level === 'warn' && logger.warn) { logger.warn(prefix, msg, data); return; }
    if (level === 'info' && logger.info) { logger.info(prefix, msg, data); return; }
    if (debugEnabled() && logger.debug) { logger.debug(prefix, msg, data); }
  } catch (e) { }
}
