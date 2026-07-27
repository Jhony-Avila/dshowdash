// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-keyboard-shortcuts-extended
// PURPOSE: Sidebar Features - Extended Keyboard Shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   getMetrics() — exported function
//   enable() — exported function
//   disable() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   capabilities — exported value
//   init() — exported function
//   cleanup() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   registerShortcut() — exported function
//   showShortcutsHelp() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.SHORTCUTS_INITIALIZED
//   SIDEBAR_EVENTS.SHORTCUT_TRIGGERED
// LISTENS (eventos):
//   'click'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


const MODULE_ID = 'sidebar-keyboard-shortcuts-extended';
const VERSION = '7.1.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, ctx: null as DynObj, shortcuts: new Map(), enabled: true, triggered: 0, errors: 0, cleanups: [] as DynObj[] };

function _envelope(ok: DynObj, data?: DynObj, errors?: Error[]) {
  return { ok, data: data || null, meta: { moduleId: MODULE_ID, version: VERSION, timestamp: new Date().toISOString() }, errors: errors || [] };
}

const DEFAULT_SHORTCUTS = [
  { keys: 'Alt+1', action: 'gotoSection1', description: 'Ir para seção 1' },
  { keys: 'Alt+2', action: 'gotoSection2', description: 'Ir para seção 2' },
  { keys: 'Alt+M', action: 'toggleMiniMode', description: 'Alternar modo mini' },
  { keys: 'Alt+B', action: 'toggleSidebar', description: 'Alternar sidebar' },
  { keys: 'Alt+T', action: 'toggleTheme', description: 'Alternar tema' },
  { keys: 'Shift+?', action: 'showHelp', description: 'Mostrar atalhos' },
  { keys: 'Escape', action: 'closeOverlays', description: 'Fechar overlays' }
];

function gotoSection(index: number) {
  const sections = document.querySelectorAll(`.${C.SECTION}`);
  if (sections[index]) {
    const item = sections[index].querySelector(`.${C.LINK}`);
    if (item) (item as HTMLElement).focus();
  }
}

const ACTIONS = {
  gotoSection1() { gotoSection(0); },
  gotoSection2() { gotoSection(1); },
  toggleMiniMode() { const s = _getPort('sidebar'); if (s && s.toggleMiniMode) s.toggleMiniMode(); },
  toggleSidebar() { const s = _getPort('sidebar'); if (s && s.toggle) s.toggle(); },
  toggleTheme() { const s = _getPort('sidebar'); if (s && s.toggleTheme) s.toggleTheme(); },
  showHelp() { showShortcutsHelp(); },
  closeOverlays() { const s = _getPort('sidebar'); if (s) { if (s.hideCommandPalette) s.hideCommandPalette(); if (s.hideQuickSwitcher) s.hideQuickSwitcher(); } }
};

function parseKeys(keysStr: DynObj) {
  const parts = keysStr.split('+');
  return {
    ctrl: parts.indexOf('Ctrl') >= 0,
    alt: parts.indexOf('Alt') >= 0,
    shift: parts.indexOf('Shift') >= 0,
    meta: parts.indexOf('Meta') >= 0,
    key: parts[parts.length - 1].toLowerCase()
  };
}

function matchEvent(e: DynObj, parsed: DynObj) {
  return e.ctrlKey === parsed.ctrl && e.altKey === parsed.alt && e.shiftKey === parsed.shift && e.metaKey === parsed.meta && e.key.toLowerCase() === parsed.key;
}

function globalKeydownHandler(e: DynObj) {
  if (!_state.enabled) return;
  _state.shortcuts.forEach(shortcut => {
    if (matchEvent(e, shortcut.parsed)) {
      e.preventDefault();
      _state.triggered++;
      if ((ACTIONS as DynObj)[shortcut.action]) (ACTIONS as DynObj)[shortcut.action]();
      const eb = _getPort('eventBus');
      if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SHORTCUT_TRIGGERED, { action: shortcut.action, keys: shortcut.keys });
    }
  });
}

function showShortcutsHelp() {
  let modal = document.querySelector('.dsd-shortcuts-modal');
  if (modal) { modal.classList.toggle('dsd-shortcuts-modal--visible'); return; }
  modal = document.createElement('div');
  modal.className = 'dsd-shortcuts-modal dsd-shortcuts-modal--visible';
  let html = '<div class="dsd-shortcuts-modal__overlay" data-close></div><div class="dsd-shortcuts-modal__content"><h2>Atalhos de Teclado</h2><dl>';
  _state.shortcuts.forEach(s => { html += `<div><dt><kbd>${s.keys}</kbd></dt><dd>${s.description}</dd></div>`; });
  html += '</dl><button class="dsd-shortcuts-modal__close" data-close>Fechar</button></div>';
  modal.innerHTML = html;
  document.body.appendChild(modal);
  modal.querySelectorAll('[data-close]').forEach(el => { el.addEventListener('click', () => { modal.classList.remove('dsd-shortcuts-modal--visible'); }); });
}

function registerShortcut(shortcut: DynObj) {
  if (!shortcut || !shortcut.keys || !shortcut.action) return _envelope(false, null, [{ code: 'INVALID', message: 'Shortcut must have keys and action' } as DynObj]);
  const parsed = parseKeys(shortcut.keys);
  _state.shortcuts.set(shortcut.keys, { keys: shortcut.keys, action: shortcut.action, description: shortcut.description || '', parsed });
  return _envelope(true, { keys: shortcut.keys });
}

function init(ctx: DynObj) {
  if (_state.initialized) return _envelope(true, { alreadyInitialized: true });
  try {
    _state.ctx = ctx;
    if (ctx && ctx.ports) Ports.inject(ctx.ports);
    _initPorts();
    DEFAULT_SHORTCUTS.forEach(s => { registerShortcut(s); });
    document.addEventListener('keydown', globalKeydownHandler);
    _state.cleanups.push(() => { document.removeEventListener('keydown', globalKeydownHandler); });
    _state.initialized = true;
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.SHORTCUTS_INITIALIZED, { version: VERSION });
    return _envelope(true, { initialized: true });
  } catch (e: any) {
    _state.errors++;
    return _envelope(false, null, [{ code: 'INIT_ERROR', message: e.message } as DynObj]);
  }
}

function cleanup() {
  for (let i = 0; i < _state.cleanups.length; i++) { try { _state.cleanups[i](); } catch (e: any) { } }
  _state.cleanups = [];
  _state.shortcuts.clear();
  _state.initialized = false;
  return _envelope(true, { cleanedUp: true });
}

function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    shortcutsRegistered: _state.shortcuts.size > 0,
    enabled: _state.enabled,
    noErrors: _state.errors === 0
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!_state.initialized) status = 'NOT_INITIALIZED';
  else if (passed < total) status = 'DEGRADED';
  
  return {
    status,
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    checks,
    metrics: { triggered: _state.triggered, shortcutsCount: _state.shortcuts.size, errors: _state.errors },
    timestamp: Date.now()
  };
}

function info() {
  return _envelope(true, {
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    initialized: _state.initialized,
    shortcutsCount: _state.shortcuts.size,
    triggered: _state.triggered
  });
}

const capabilities = { singleton: true, critical: false, rendersUI: false, category: 'accessibility', priority: 'normal' };

export function getMetrics() { return { triggered: _state.triggered, shortcutsCount: _state.shortcuts.size, errors: _state.errors }; }
export function enable() { _state.enabled = true; }
export function disable() { _state.enabled = false; }

export { MODULE_ID, VERSION, capabilities, init, cleanup, healthCheck, info, registerShortcut, showShortcutsHelp };
export default { id: MODULE_ID, version: VERSION, capabilities, init, cleanup, healthCheck, info, getMetrics, registerShortcut };
