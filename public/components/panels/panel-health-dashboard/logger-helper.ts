// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger-helper
// PURPOSE: Panel Health Dashboard - Logger Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   debug() — exported function
//   info() — exported function
//   warn() — exported function
//   error() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 1.2.0-STRICT-MODE
// @changelog v1.2.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v1.1.0-AAA - Initial AAA contract

'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-health-dashboard:logger-helper';
export const VERSION = '9.3.0-P2-ENTERPRISE';
const PANEL_NAME = 'panel-health-dashboard';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

export function debug(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger?.debug) {
    logger.debug(`[${PANEL_NAME}] ${message}`, data);
  } else if (!isStrict()) {
    console.log(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function info(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger?.info) {
    logger.info(`[${PANEL_NAME}] ${message}`, data);
  } else if (!isStrict()) {
    console.info(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function warn(message: string, data: Record<string, unknown> = {}) {
  const logger = _getLogger();
  if (logger?.warn) {
    logger.warn(`[${PANEL_NAME}] ${message}`, data);
  } else if (!isStrict()) {
    console.warn(`[${PANEL_NAME}] ${message}`, data);
  }
}

export function error(message: string, err: Error | unknown | null = null) {
  const logger = _getLogger();
  if (logger?.error) {
    logger.error(`[${PANEL_NAME}] ${message}`, err);
  } else if (!isStrict()) {
    console.error(`[${PANEL_NAME}] ${message}`, err);
  }
}

export function healthCheck() {
  return {
    status: _getLogger() ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    strictMode: isStrict(),
    timestamp: Date.now()
  };
}

// ── Alias exports (compatibility) ──────────────────────────────
/**
 * createLogger — factory alias used by consumers that import { createLogger }.
 * Returns a logger-like object bound to an optional namespace prefix.
 */
export function createLogger(namespace?: string) {
    const prefix = namespace ? `[${namespace}]` : `[${PANEL_NAME}]`;
    return {
        debug: (msg: string, data: Record<string, unknown> = {}) => {
            const logger = _getLogger();
            if (logger?.debug) { logger.debug(`${prefix} ${msg}`, data); }
            else if (!isStrict()) { console.log(`${prefix} ${msg}`, data); }
        },
        info: (msg: string, data: Record<string, unknown> = {}) => {
            const logger = _getLogger();
            if (logger?.info) { logger.info(`${prefix} ${msg}`, data); }
            else if (!isStrict()) { console.info(`${prefix} ${msg}`, data); }
        },
        warn: (msg: string, data: Record<string, unknown> = {}) => {
            const logger = _getLogger();
            if (logger?.warn) { logger.warn(`${prefix} ${msg}`, data); }
            else if (!isStrict()) { console.warn(`${prefix} ${msg}`, data); }
        },
        error: (msg: string, err: Error | unknown | null = null) => {
            const logger = _getLogger();
            if (logger?.error) { logger.error(`${prefix} ${msg}`, err); }
            else if (!isStrict()) { console.error(`${prefix} ${msg}`, err); }
        }
    };
}

export default { debug, info, warn, error, healthCheck, injectPorts, getPorts, createLogger, VERSION, MODULE_ID };
