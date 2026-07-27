// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-light
// PURPOSE: Theme Manager - Light Theme v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   THEME_NAME — exported value
//   THEME_CONFIG — exported value
//   getConfig() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'theme-manager-light';
export const THEME_NAME = 'light';
export const THEME_CONFIG = Object.freeze({ name: 'light', label: 'Claro', background: '#ffffff', text: '#1a1a1a', primary: '#3b82f6', secondary: '#64748b' });
export function getConfig() { return { ...THEME_CONFIG }; }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { configValid: true }, themeName: THEME_NAME, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, themeName: THEME_NAME, config: THEME_CONFIG, timestamp: Date.now() }; }
export default { THEME_NAME, THEME_CONFIG, getConfig, healthCheck, info, VERSION, MODULE_ID };
