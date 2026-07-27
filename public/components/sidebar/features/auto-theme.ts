// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-auto-theme
// PURPOSE: Sidebar Features - Auto Theme
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
//   setupAutoTheme() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   getCurrentTheme() — exported function
//   getSystemPreference() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.AUTO_THEME_INITIALIZED
//   SIDEBAR_EVENTS.THEME_CHANGED
// LISTENS (eventos):
//   'change'
// WINDOW ACCESS:
//   window.matchMedia
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-auto-theme';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STORAGE_KEY = 'dsd-sidebar-auto-theme';
const THEME_CLASSES = { 'dark': C.MOD_DARK, 'light': C.MOD_LIGHT, 'high-contrast': C.MOD_HIGH_CONTRAST };
let _container: HTMLElement | null = null;
let _autoEnabled = true;
let _mediaQuery: DynObj | null = null;
let _mediaHandler: DynObj = null;
let _cleanups: (() => void)[] = [];
let _currentTheme = 'dark';
let _metrics = { themeChanges: 0, toggles: 0, errors: 0 };

function getSystemTheme() { if (window.matchMedia?.('(prefers-color-scheme: light)').matches) return 'light'; if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'; return 'dark'; }
function loadConfig() { try { const saved = localStorage.getItem(STORAGE_KEY); _autoEnabled = saved !== 'false'; } catch(e) { _autoEnabled = true; } }
function saveConfig() { try { localStorage.setItem(STORAGE_KEY, String(_autoEnabled)); } catch(e) { } }

function applyTheme(container: HTMLElement, theme: string) {
  if (!container) return;
  Object.values(THEME_CLASSES).forEach(cls => { if (cls) container.classList.remove(cls); });
  if (theme !== 'dark') { const cls = (THEME_CLASSES as DynObj)[theme]; if (cls) container.classList.add(cls); }
  _currentTheme = theme;
  _metrics.themeChanges++;
}

export function init(eventBus: DynObj, container: HTMLElement) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  loadConfig();
  if (!_autoEnabled) return;
  const systemTheme = getSystemTheme();
  applyTheme(container, systemTheme);
  _mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  _mediaHandler = (e: DynObj) => {
    if (_autoEnabled) {
      const newTheme = e.matches ? 'dark' : 'light';
      // @ts-expect-error strict migration — TS2345
      applyTheme(_container, newTheme);
      const eb = _getPort('eventBus');
      if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.THEME_CHANGED, { theme: newTheme, auto: true });
    }
  };
  _mediaQuery.addEventListener('change', _mediaHandler as DynObj);
  _cleanups.push(() => { _mediaQuery.removeEventListener('change', _mediaHandler as DynObj); });
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.AUTO_THEME_INITIALIZED);
}

export function setupAutoTheme(container: HTMLElement, eventBus: DynObj) { init(eventBus, container); return () => { destroy(); }; }

export function enable(container: HTMLElement) { _autoEnabled = true; _metrics.toggles++; saveConfig(); const theme = getSystemTheme(); applyTheme(container || _container, theme); return theme; }
export function disable() { _autoEnabled = false; _metrics.toggles++; saveConfig(); }
export function isEnabled() { return _autoEnabled; }
export function getCurrentTheme() { return _currentTheme; }
export function getSystemPreference() { return getSystemTheme(); }

export function destroy() { _cleanups.forEach(fn => { try { fn(); } catch(e) { } }); _cleanups = []; _mediaHandler = null; _container = null; }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), autoEnabled: _autoEnabled, currentTheme: _currentTheme, systemTheme: getSystemTheme(), cleanups: _cleanups.length, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { autoEnabled: _autoEnabled, currentTheme: _currentTheme }, metrics: getMetrics() }; }

export default { init, setupAutoTheme, enable, disable, isEnabled, getCurrentTheme, getSystemPreference, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
