// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P25-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-session-admin-core-keyboard
// PURPOSE: Panel Session Admin - Keyboard Shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   localState from ./state.js
//   refresh from ./data.js
//   toggleAutoRefresh from ./auto-refresh.js
//   closeDetails from ./modals.js
//   deselectAll from ./selection.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setupKeyboardShortcuts() — exported function
//   removeKeyboardShortcuts() — exported function
//   destroy() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { localState } from './state.js';
import { refresh } from './data.js';
import { toggleAutoRefresh } from './auto-refresh.js';
import { closeDetails } from './modals.js';
import { deselectAll } from './selection.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panels-panel-session-admin-core-keyboard';

// P25: DOM listener cleanup registry
let _domCleanups: Array<{ el: EventTarget; event: string; handler: EventListener }> = [];
let _keyboardHandler: EventListener | null = null;

function _registerDomListener(el: EventTarget, event: string, handler: EventListener) {
  if (!el) return;
  el.addEventListener(event, handler);
  _domCleanups.push({ el, event, handler });
}

function _cleanupDomListeners() {
  _domCleanups.forEach(item => {
    try { item.el.removeEventListener(item.event, item.handler); } catch (e) {}
  });
  _domCleanups = [];
  _keyboardHandler = null;
}

export function setupKeyboardShortcuts(handlers: Record<string, unknown>) {
  // P25: Cleanup previous before setting up new
  _cleanupDomListeners();

  _keyboardHandler = (e: Event) => {
    const ke = e as KeyboardEvent;
    const target = ke.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') return;

    const key = ke.key.toLowerCase();

    if (key === 'r') { ke.preventDefault(); refresh(); }
    else if (key === 'a') { ke.preventDefault(); (toggleAutoRefresh as (cb?: unknown) => void)(handlers.onStateChange); }
    else if (key === 'f') { ke.preventDefault(); if (typeof handlers.toggleFullscreen === 'function') (handlers.toggleFullscreen as () => void)(); }
    else if (key === 'i') { ke.preventDefault(); if (typeof handlers.toggleInlineFilters === 'function') (handlers.toggleInlineFilters as () => void)(); }
    else if (key === 'c') { ke.preventDefault(); _toggleColumnsMenu(); }
    else if (key === 'e') { ke.preventDefault(); _toggleExportMenu(); }
    else if (key === '/') { ke.preventDefault(); const searchEl = localState.container ? localState.container.querySelector('[data-filter="search"]') : null; if (searchEl) (searchEl as HTMLElement).focus(); }
    else if (key === 'escape') {
      if (localState.detailsSession) closeDetails();
      else if (localState.isFullscreen && typeof handlers.toggleFullscreen === 'function') (handlers.toggleFullscreen as () => void)();
      else (deselectAll as (cb?: unknown) => void)(handlers.onStateChange);
    }
  };
  
  _registerDomListener(document, 'keydown', _keyboardHandler);
}

export function removeKeyboardShortcuts() {
  _cleanupDomListeners();
}

function _toggleExportMenu() {
  const menu = localState.container ? localState.container.querySelector('[data-export-menu]') : null;
  if (menu) menu.classList.toggle('psa__export-menu--open');
}

function _toggleColumnsMenu() {
  const menu = localState.container ? localState.container.querySelector('[data-columns-menu]') : null;
  if (menu) menu.classList.toggle('psa__columns-menu--open');
}

export function destroy() {
  _cleanupDomListeners();
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, listenersRegistered: _domCleanups.length, p25Compliant: true }; }

export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { keyboardReady: true, cleanupRegistryActive: true }, listenersRegistered: _domCleanups.length, p25Compliant: true }; }

export default { setupKeyboardShortcuts, removeKeyboardShortcuts, destroy, info, healthCheck };
