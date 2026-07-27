// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   logDebug() — exported function
//   logInfo() — exported function
//   logWarn() — exported function
//   logError() — exported function
//   injectLogger() — exported function (for DI)
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Core?.windowAdapter (preferred)
//   window.Logger (fallback, non-strict only)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel Location - Telemetry Logger
 * @module panel-location/telemetry/logger
 * @version 1.2.0-AAA
 */

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-location/telemetry/logger';
const PANEL_NAME = 'panel-location';

// ─────────────────────────────────────────────────────────────────
// Ports Pattern - Logger Access
// ─────────────────────────────────────────────────────────────────
let _injectedLogger: Record<string, unknown> | null = null;

/**
 * Inject a logger instance (for testing/DI)
 * @param {Object} logger - Logger instance
 */
export function injectLogger(logger: Record<string, unknown>) {
    _injectedLogger = logger;
}

/**
 * Get logger through Ports pattern
 * Priority: Injected > Core.windowAdapter > window.Logger (non-strict only)
 * @returns {Object|null} Logger instance or null
 */
function _getLogger() {
    // 1. Injected logger (highest priority - for testing/DI)
    if (_injectedLogger) return _injectedLogger;

    // 2. Check if we're in browser environment
    if (typeof window === 'undefined') return null;

    const strictMode = isStrict();

    // 3. Try Core.windowAdapter (preferred method)
    if (window.Core?.windowAdapter?.get) {
        const wl = window.Core.windowAdapter.get('Logger');
        if (wl) return wl;
    }

    // 4. In strict mode, don't use window.Logger fallback
    if (strictMode) return null;

    // 5. Fallback to window.Logger (non-strict only, with violation record)

    return null;
}

export function logDebug(message: string, data: Record<string, unknown> = {}) {
    const logger = _getLogger();
    if (logger) {
        logger.debug(`[${PANEL_NAME}] ${message}`, data);
    }
}

export function logInfo(message: string, data: Record<string, unknown> = {}) {
    const logger = _getLogger();
    if (logger) {
        logger.info(`[${PANEL_NAME}] ${message}`, data);
    }
}

export function logWarn(message: string, data: Record<string, unknown> = {}) {
    const logger = _getLogger();
    if (logger) {
        logger.warn(`[${PANEL_NAME}] ${message}`, data);
    }
}

export function logError(message: string, error: unknown = null) {
    const logger = _getLogger();
    if (logger) {
        logger.error(`[${PANEL_NAME}] ${message}`, error);
    }
}

export default { logDebug, logInfo, logWarn, logError, injectLogger };

// Alias export for consumers expecting Logger
export const Logger = { logDebug, logInfo, logWarn, logError, injectLogger };
