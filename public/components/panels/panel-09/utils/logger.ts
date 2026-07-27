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
//   log() — exported function
//   warn() — exported function
//   error() — exported function
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
 * Panel 09 - Logger Utility
 * @module panel-09/utils/logger
 * @version 1.2.0-AAA
 */

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-09/utils/logger';
const PANEL_NAME = 'panel-09';

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

export function log(message: string, data: Record<string, unknown> = {}) {
    const logger = _getLogger();
    if (logger) {
        logger.debug(`[${PANEL_NAME}] ${message}`, data);
    } else {
        console.log(`[${PANEL_NAME}] ${message}`, data);
    }
}

export function warn(message: string, data: Record<string, unknown> = {}) {
    const logger = _getLogger();
    if (logger) {
        logger.warn(`[${PANEL_NAME}] ${message}`, data);
    } else {
        console.warn(`[${PANEL_NAME}] ${message}`, data);
    }
}

export function error(message: string, err: unknown = null) {
    const logger = _getLogger();
    if (logger) {
        logger.error(`[${PANEL_NAME}] ${message}`, err);
    } else {
        console.error(`[${PANEL_NAME}] ${message}`, err);
    }
}

export default { log, warn, error, injectLogger };
