// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-helpers
// PURPOSE: Theme Manager - Helpers v2.0.0-ENTERPRISE-AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getSystemTheme() — exported function
//   applyThemeClass() — exported function
//   saveThemePreference() — exported function
//   loadThemePreference() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
// ═══════════════════════════════════════════════════════════════
'use strict';
export const VERSION = '2.0.0-ENTERPRISE-AAA';
export const MODULE_ID = 'theme-manager-helpers';
export function getSystemTheme() { return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
export function applyThemeClass(theme: string) { document.documentElement.classList.remove('theme-light', 'theme-dark'); document.documentElement.classList.add(`theme-${theme}`); }
export function saveThemePreference(theme: string) { try { localStorage.setItem('theme-preference', theme); } catch (e: unknown) {} }
export function loadThemePreference() { try { return localStorage.getItem('theme-preference'); } catch (e) { return null; } }
export function healthCheck() { return { status: 'HEALTHY', score: '1/1', checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, helpers: ['getSystemTheme', 'applyThemeClass', 'saveThemePreference', 'loadThemePreference'], timestamp: Date.now() }; }
export function createThemeVariables(theme: string) { return { "--theme-name": theme }; }
export default { getSystemTheme, applyThemeClass, saveThemePreference, loadThemePreference, healthCheck, info, VERSION, MODULE_ID };
