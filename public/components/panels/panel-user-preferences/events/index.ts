// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-preferences-events-index
// PURPOSE: Panel User Preferences Events - Enterprise Modular
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   setContainer, setState, setHandlers, setOriginalTheme, resetState from ./stat...
//   cancelAutoSave from ./utils.js
//   createKeyboardHandler from ./keyboard.js
//   setupThemeHandlers, setupDensityHandlers, setupToggleHandlers, setupDragDropH...
//
// PROVIDES:
//   setupEventHandlers() — exported function
//   cleanup() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { setContainer, setState, setHandlers, setOriginalTheme, resetState } from './state.js';
import { cancelAutoSave } from './utils.js';

import { createKeyboardHandler } from './keyboard.js';
import { setupThemeHandlers, setupDensityHandlers, setupToggleHandlers, setupDragDropHandlers, setupActionHandlers, setupCustomThemeHandlers } from './handlers.js';

let _abortController: AbortController | null = null;

export function setupEventHandlers(container: Element, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  if (!container) return;
  setContainer(container); setState(state); setHandlers(handlers);
  setOriginalTheme((state?.preferences as Record<string, unknown>)?.theme as string || 'dark');

  _abortController = new AbortController();
  const keyHandler = createKeyboardHandler();
  document.addEventListener('keydown', keyHandler, { signal: _abortController.signal });
  (container as HTMLElement & { _cleanupKeyHandler?: () => void })._cleanupKeyHandler = () => {
    if (_abortController) {
      _abortController.abort();
      _abortController = null;
    }
  };

  setupThemeHandlers(container);
  setupDensityHandlers(container);
  setupToggleHandlers(container);
  setupDragDropHandlers(container);
  setupActionHandlers(container);
  setupCustomThemeHandlers(container);
}

export function cleanup() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
  cancelAutoSave();
  resetState();
}

export default { setupEventHandlers, cleanup };

export const MODULE_ID = 'panels-panel-user-preferences-events-index';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } }; }
