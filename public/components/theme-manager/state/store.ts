// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: theme-manager-store
// PURPOSE: Theme Manager - Store v2.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getState() — exported function
//   getCurrentTheme() — exported function
//   setTheme() — exported function
//   getAvailableThemes() — exported function
//   subscribe() — exported function
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
export const VERSION = '2.1.0-ENTERPRISE';
export const MODULE_ID = 'theme-manager-store';
let _state = { currentTheme: 'light', availableThemes: ['light', 'dark'], preferences: {} };
let _subscribers: Array<(state: unknown) => void> = [];
export function getState() { return { ..._state }; }
export function getCurrentTheme() { return _state.currentTheme; }
export function setTheme(theme: string) { if (!_state.availableThemes.includes(theme)) return false; _state.currentTheme = theme; _notify(); return true; }
export function getAvailableThemes() { return [..._state.availableThemes]; }
export function subscribe(fn: (state: unknown) => void) { if (typeof fn === 'function') _subscribers.push(fn); return () => { _subscribers = _subscribers.filter(s => s !== fn); }; }
function _notify() { _subscribers.forEach(s => { try { s(_state); } catch (e: unknown) {} }); }
export function healthCheck() { const checks = { hasState: true, validTheme: _state.availableThemes.includes(_state.currentTheme) }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 2 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/2`, checks, currentTheme: _state.currentTheme, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, currentTheme: _state.currentTheme, availableThemes: _state.availableThemes, timestamp: Date.now() }; }
export const themeStore = { getState, getCurrentTheme, setTheme, getAvailableThemes, subscribe, healthCheck, info };
export default { getState, getCurrentTheme, setTheme, getAvailableThemes, subscribe, healthCheck, info, VERSION, MODULE_ID };
