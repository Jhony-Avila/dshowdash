// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-dark
// PURPOSE: Theme Manager - Dark Theme v2.0.0-ENTERPRISE-AAA
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
export const MODULE_ID = 'theme-manager-dark';
export const THEME_NAME = 'dark';
export const THEME_CONFIG = Object.freeze({ name: 'dark', label: 'Escuro', background: '#0f172a', text: '#f1f5f9', primary: '#60a5fa', secondary: '#94a3b8' });
export function getConfig() { return { ...THEME_CONFIG }; }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { configValid: true }, themeName: THEME_NAME, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, themeName: THEME_NAME, config: THEME_CONFIG, timestamp: Date.now() }; }
export default { THEME_NAME, THEME_CONFIG, getConfig, healthCheck, info, VERSION, MODULE_ID };
