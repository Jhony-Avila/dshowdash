// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences-keyboard
// PURPOSE: Panel User Preferences - Keyboard Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   applyTheme, applyDensity from ../theme-applier.js
//   announce, showToast from ./helpers.js
//   cancelAutoSave, popUndo from ./undo-autosave.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupKeyboardHandlers() — exported function
//   cleanupKeyboardHandlers() — exported function
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

import { applyTheme, applyDensity } from '../theme-applier.js';
import { announce, showToast } from './helpers.js';
import { cancelAutoSave, popUndo } from './undo-autosave.js';

export const MODULE_ID = 'panel-user-preferences-keyboard';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _keyHandler: ((e: KeyboardEvent) => Promise<void>) | null = null;
let _abortController: AbortController | null = null;

export const setupKeyboardHandlers = (container: Element, state: Record<string, unknown>, handlers: Record<string, unknown>) => {
  _abortController = new AbortController();
  _keyHandler = async (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      if (state?.isDirty) {
        cancelAutoSave();
        if (typeof handlers?.saveAllChanges === 'function') await (handlers.saveAllChanges as () => Promise<void>)();
        showToast('Preferências salvas', 'success');
        announce('Preferências salvas');
      }
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      const undo = popUndo();
      if (undo) {
        if (typeof handlers?.markDirty === 'function') (handlers.markDirty as (k: string, v: unknown) => void)(undo.key, undo.value);
        if (undo.key === 'theme') applyTheme(undo.value as string);
        if (undo.key === 'density') applyDensity(undo.value as string);
        showToast('Alteração desfeita', 'info');
        announce('Desfeito');
      } else {
        showToast('Nada para desfazer', 'info');
      }
      return;
    }
    if (e.key === 'Escape') {
      const openModal = container.querySelector('.pup-modal-overlay.visible');
      if (openModal) {
        openModal.classList.remove('visible');
      } else if (state?.isDirty) {
        cancelAutoSave();
        if (typeof handlers?.discardChanges === 'function') (handlers.discardChanges as () => void)();
        showToast('Alterações descartadas', 'info');
        announce('Alterações descartadas');
      }
      return;
    }
  };
  document.addEventListener('keydown', _keyHandler, { signal: _abortController.signal });
};

export const cleanupKeyboardHandlers = () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _keyHandler = null;
  }
};

export const createKeyboardHandler = (): ((e: KeyboardEvent) => Promise<void>) => {
  return async (e: KeyboardEvent) => {
    if (_keyHandler) await _keyHandler(e);
  };
};

export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION });

export default { MODULE_ID, VERSION, setupKeyboardHandlers, cleanupKeyboardHandlers, createKeyboardHandler, info, healthCheck };
