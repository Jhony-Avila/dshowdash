// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: config.port
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   setConfig() — exported function
//   getConfig() — exported function
//   getConfigValue() — exported function
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

export const MODULE_ID = 'panel-16.ports.config.port';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 16 - Config Port
 * @module panel-16/ports/config.port
 * @version 1.1.0-AAA
 */

let configInstance: Record<string, unknown> | null = null;

export function setConfig(config: Record<string, unknown>) {
    configInstance = config;
}

export function getConfig() {
    return configInstance;
}

export function getConfigValue(key: string, defaultValue: unknown = null) {
    if (!configInstance) return defaultValue;
    return configInstance[key] ?? defaultValue;
}

export default { setConfig, getConfig, getConfigValue };

// Alias export — satisfies: import { ConfigPort } from './config.port'
export const ConfigPort = { setConfig, getConfig, getConfigValue };
