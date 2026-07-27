// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: logger.port
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// @contract STRICT_MODE - Em modo strict, sem fallback para window.*
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   setLogger() — exported function
//   getLogger() — exported function
//   debug() — exported function
//   info() — exported function
//   warn() — exported function
//   error() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   Core.windowAdapter.get('Logger') - único canal autorizado
//   window.Logger fallback removido em modo strict
// @changelog v1.2.0-STRICT-MODE: Migração completa para strict mode (NR-FULL)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Logger Port
 * @module panel-16/ports/logger.port
 * @version 1.2.0-STRICT-MODE
 */

import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const MODULE_ID = 'panel-16/ports/logger.port';
const PANEL_NAME = 'panel-16';
let loggerInstance: Record<string, unknown> | null = null;

export function setLogger(logger: Record<string, unknown>) {
    loggerInstance = logger;
}

export function getLogger() {
    // Primary: Injected logger
    if (loggerInstance) return loggerInstance;

    // Secondary: Core.windowAdapter
    if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
        const logger = (window as any).Core.windowAdapter.get('Logger');
        if (logger) return logger;
    }

    // Em modo strict, não usa fallback
    const strictMode = isStrict();
    if (strictMode) return null;

    // Fallback: window.Logger (legacy, apenas em non-strict)

    return null;
}

export function debug(message: string, data: Record<string, unknown> = {}) {
    const logger = getLogger();
    if (logger?.debug) logger.debug(`[${PANEL_NAME}] ${message}`, data);
}

export function info(message: string, data: Record<string, unknown> = {}) {
    const logger = getLogger();
    if (logger?.info) logger.info(`[${PANEL_NAME}] ${message}`, data);
}

export function warn(message: string, data: Record<string, unknown> = {}) {
    const logger = getLogger();
    if (logger?.warn) logger.warn(`[${PANEL_NAME}] ${message}`, data);
}

export function error(message: string, err: unknown = null) {
    const logger = getLogger();
    if (logger?.error) logger.error(`[${PANEL_NAME}] ${message}`, err);
}

export default { setLogger, getLogger, debug, info, warn, error };

// Alias export — satisfies: import { LoggerPort } from './logger.port'
export const LoggerPort = { setLogger, getLogger, debug, info, warn, error };
