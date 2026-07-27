// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-theme-handler
// PURPOSE: Sidebar Features - Theme Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   setTheme() — exported function
//   getTheme() — exported function
//   toggleTheme() — exported function
//   initTheme() — exported function
//   getAvailableThemes() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.THEME_HANDLER_INITIALIZED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-theme-handler';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STORAGE_KEY = 'dsd-sidebar-theme';
const THEMES = ['dark', 'light', 'high-contrast'];
const THEME_CLASSES = { 'dark': C.MOD_DARK, 'light': C.MOD_LIGHT, 'high-contrast': C.MOD_HIGH_CONTRAST };
let _currentTheme = 'dark';
let _container: HTMLElement | null = null;
let _metrics = { sets: 0, toggles: 0 };

// @ts-expect-error strict migration — TS2345
function getSavedTheme() { try { const saved = localStorage.getItem(STORAGE_KEY); return THEMES.includes(saved) ? saved : 'dark'; } catch(e) { return 'dark'; } }
function saveTheme(theme: string) { try { localStorage.setItem(STORAGE_KEY, theme); } catch(e) { } }

export function init(eventBus: DynObj, container: HTMLElement) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const saved = getSavedTheme();
  // @ts-expect-error strict migration — TS2345
  setTheme(container, saved);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.THEME_HANDLER_INITIALIZED);
}

export function setTheme(container: HTMLElement, theme: string) {
  if (!container || !THEMES.includes(theme)) return false;
  _container = container;
  _metrics.sets++;
  THEMES.forEach(t => { const cls = (THEME_CLASSES as Record<string, DynObj>)[t]; if (cls) container.classList.remove(cls); });
  if (theme !== 'dark') { const cls = (THEME_CLASSES as DynObj)[theme]; if (cls) container.classList.add(cls); }
  _currentTheme = theme;
  saveTheme(theme);
  return true;
}

export function getTheme() { return _currentTheme; }

export function toggleTheme(container: HTMLElement) {
  _metrics.toggles++;
  const currentIndex = THEMES.indexOf(_currentTheme);
  const nextIndex = (currentIndex + 1) % THEMES.length;
  return setTheme(container, THEMES[nextIndex]);
}

// @ts-expect-error strict migration — TS2345
export function initTheme(container: HTMLElement) { _container = container; const saved = getSavedTheme(); return setTheme(container, saved); }
// @ts-expect-error strict migration — TS2769
export function getAvailableThemes() { return [].concat(THEMES); }

export function destroy() { if (_container) THEMES.forEach(t => { const cls = (THEME_CLASSES as Record<string, DynObj>)[t]; if (cls) _container!.classList.remove(cls); }); _container = null; _currentTheme = 'dark'; }

export function getMetrics() { return { ..._metrics, currentTheme: _currentTheme }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), currentTheme: _currentTheme, availableThemes: THEMES, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { currentTheme: _currentTheme, availableThemes: THEMES.length }, metrics: getMetrics() }; }

export default { init, setTheme, getTheme, toggleTheme, initTheme, getAvailableThemes, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID, THEMES };
