// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: versioning
// PURPOSE: Main module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, STATE_VERSION, STORAGE_KEYS from ./constants.js
//   createLogger from /assets/js/core/logger-global/index.js
//   metrics from ./state.js
//
// PROVIDES:
//   setLogLevel() — exported function
//   wrapWithVersion() — exported function
//   unwrapVersioned() — exported function
//   migrateData() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
/**
 * Persistence Sync - Versioning
 * @module persistence-sync/versioning
 * @version 1.2.0-LOGGER-AAA-ES6
 * @changelog v1.2.0-LOGGER - Migrado console.log/error/warn para createLogger()
 * @changelog v1.1.0-LOGGING - Convertido console.log para _log interno
 */
'use strict';

import { VERSION, STATE_VERSION, STORAGE_KEYS } from './constants.js';
import { createLogger } from '/assets/js/core/logger-global/index.js';
import { metrics } from './state.js';

export const MODULE_ID = 'main.domain.features.persistence-sync.versioning';

const _logger = createLogger('PersistenceSync');

let _logLevel = 1;
const LOG_LEVELS: Record<string, number> = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

function _log(level: string, msg: string) {
  const levelNum = LOG_LEVELS[level] || 1;
  if (levelNum < _logLevel) return;

  if (level === 'warn') _logger.warn(msg);
  else if (level === 'error') _logger.error(msg);
  else if (level === 'debug') _logger.debug(msg);
  else _logger.info(msg);
}

export function setLogLevel(level: string) {
  if (typeof level === 'string') {
    _logLevel = LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : 1;
  } else if (typeof level === 'number') {
    _logLevel = level;
  }
  return _logLevel;
}

export function wrapWithVersion(data: Record<string, unknown>) {
  return {
    _version: STATE_VERSION,
    _savedAt: Date.now(),
    _moduleVersion: VERSION,
    data
  };
}

export function unwrapVersioned(wrapped: unknown) {
  if (!wrapped) return { data: null, needsMigration: false };

// @ts-expect-error TS migration - TS2339
  if (wrapped._version === undefined) {
    return { data: wrapped, needsMigration: true, fromVersion: 0 };
  }

// @ts-expect-error TS migration - TS2339
  if (wrapped._version !== STATE_VERSION) {
    return {
// @ts-expect-error TS migration - TS2339
      data: wrapped.data,
      needsMigration: true,
// @ts-expect-error TS migration - TS2339
      fromVersion: wrapped._version
    };
  }

// @ts-expect-error TS migration - TS2339
  return { data: wrapped.data, needsMigration: false };
}

export function migrateData(data: Record<string, unknown>, fromVersion: unknown, key: string) {
  let migrated = data;

  if (fromVersion === 0 || fromVersion === undefined) {
    migrated = data;
  }

  if (fromVersion === 1) {
    if (key === STORAGE_KEYS.NAVIGATION_STATE && migrated) {
      migrated.migratedAt = Date.now();
    }
  }

  metrics.migrations++;
  _log('info', `Migrated data from v${fromVersion} to v${STATE_VERSION}`);

  return migrated;
}
