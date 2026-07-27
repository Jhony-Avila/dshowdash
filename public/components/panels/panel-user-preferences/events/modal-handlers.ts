


// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences-modal-handlers
// PURPOSE: Panel User Preferences - Modal Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   applyTheme, applyDensity from ../theme-applier.js
//   announce, showToast, setButtonLoading, openModal, closeModal, addMicroAnimati...
//   cancelAutoSave, clearUndoStack from ./undo-autosave.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupModalHandlers() — exported function
//   destroy() — exported function
//   cleanupModalState() — exported function
//   getListenerCount() — exported function
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

import { applyTheme, applyDensity } from '../theme-applier.js';
import { announce, showToast, setButtonLoading, openModal, closeModal, addMicroAnimation } from './helpers.js';
import { cancelAutoSave, clearUndoStack } from './undo-autosave.js';

export const MODULE_ID = 'panel-user-preferences-modal-handlers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

type HandlerFn = (...args: unknown[]) => unknown;

function _callHandler(handlers: Record<string, unknown>, name: string, ...args: unknown[]): unknown {
  if (handlers && typeof handlers[name] === 'function') {
    return (handlers[name] as HandlerFn)(...args);
  }
  return undefined;
}

async function _callHandlerAsync(handlers: Record<string, unknown>, name: string, ...args: unknown[]): Promise<unknown> {
  if (handlers && typeof handlers[name] === 'function') {
    return await (handlers[name] as HandlerFn)(...args);
  }
  return undefined;
}

let _pendingImportData: Record<string, unknown> | null = null;
let _pendingDeleteAction: Record<string, unknown> | null = null;
let _boundListeners: Array<{ element: Element; event: string; handler: (e: Event) => void }> = [];

function _addListener(el: Element, event: string, handler: (e: Event) => void) {
  if (!el) return;
  el.addEventListener(event, handler);
  _boundListeners.push({ element: el, event, handler });
}

export function setupModalHandlers(container: Element, state: Record<string, unknown>, handlers: Record<string, unknown>) {
  // Save All
  const saveAllBtn = container.querySelector('[data-action="save-all"]');
  if (saveAllBtn) {
    _addListener(saveAllBtn, 'click', async (e) => {
      const btn = e.currentTarget as HTMLElement | null;
      cancelAutoSave();
      setButtonLoading(btn, true);
      addMicroAnimation(btn, 'pup-bounce');
      try {
        await _callHandlerAsync(handlers, 'saveAllChanges');
        showToast('Preferências salvas', 'success');
        announce('Preferências salvas');
      } catch (err) {
        showToast('Erro ao salvar', 'error');
        announce('Erro ao salvar');
      } finally {
        setButtonLoading(btn, false);
      }
    });
  }

  // Discard
  const discardBtn = container.querySelector('[data-action="discard-changes"]');
  if (discardBtn) {
    _addListener(discardBtn, 'click', (e) => {
      cancelAutoSave();
      _callHandler(handlers, 'discardChanges');
      addMicroAnimation(e.currentTarget as Element, 'pup-shake');
      showToast('Alterações descartadas', 'info');
      announce('Alterações descartadas');
    });
  }

  // Reset Preferences
  const resetBtn = container.querySelector('[data-action="reset-preferences"]');
  if (resetBtn) _addListener(resetBtn, 'click', () => { openModal('pup-reset-modal'); });

  const closeResetBtn = container.querySelector('[data-action="close-reset"]');
  if (closeResetBtn) _addListener(closeResetBtn, 'click', () => { closeModal('pup-reset-modal'); });

  const confirmResetBtn = container.querySelector('[data-action="confirm-reset"]');
  if (confirmResetBtn) {
    _addListener(confirmResetBtn, 'click', async () => {
      closeModal('pup-reset-modal');
      cancelAutoSave();
      const defaults: Record<string, string> = { theme: 'dark', density: 'comfortable', notifications_enabled: 'true', sound_enabled: 'false', push_enabled: 'false' };
      for (const key in defaults) {
        if (Object.prototype.hasOwnProperty.call(defaults, key)) _callHandler(handlers, 'markDirty', key, defaults[key]);
      }
      applyTheme('dark');
      applyDensity('comfortable');
      document.documentElement.style.removeProperty('--pup-accent');
      document.documentElement.style.removeProperty('--pup-bg');
      document.documentElement.style.removeProperty('--pup-card');
      document.documentElement.style.removeProperty('--pup-text');
      await _callHandlerAsync(handlers, 'saveAllChanges');
      clearUndoStack();
      showToast('Preferências restauradas', 'success');
      announce('Preferências restauradas');
    });
  }

  // History show/hide
  const showHistoryBtn = container.querySelector('[data-action="show-history"]');
  if (showHistoryBtn) {
    _addListener(showHistoryBtn, 'click', (e) => {
      const section = container.querySelector('#pup-history-section') as HTMLElement | null;
      if (section) {
        section.style.display = 'block';
        section.classList.add('pup-slide-in');
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      addMicroAnimation(e.currentTarget as Element, 'pup-bounce');
      _callHandler(handlers, 'setHistoryVisible', true);
    });
  }

  const hideHistoryBtn = container.querySelector('[data-action="hide-history"]');
  if (hideHistoryBtn) {
    _addListener(hideHistoryBtn, 'click', () => {
      const section = container.querySelector('#pup-history-section') as HTMLElement | null;
      if (section) section.style.display = 'none';
      _callHandler(handlers, 'setHistoryVisible', false);
    });
  }

  // History filters
  const filterBtns = container.querySelectorAll('[data-filter]');
  filterBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      const filter = (btn as HTMLElement).dataset.filter;
      const allFilterBtns = container.querySelectorAll('[data-filter]');
      allFilterBtns.forEach((b: Element) => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      btn.classList.add('active');
      btn.setAttribute('aria-pressed', 'true');
      addMicroAnimation(btn, 'pup-bounce');
      const historyItems = container.querySelectorAll('.pup-history-item');
      historyItems.forEach((item: Element) => {
        const type = (item as HTMLElement).dataset.type;
        (item as HTMLElement).style.display = (filter === 'all' || type === filter) ? 'flex' : 'none';
      });
      _callHandler(handlers, 'setHistoryFilter', filter);
    });
  });

  // History search
  const historySearch = container.querySelector('[data-input="history-search"]');
  if (historySearch) {
    _addListener(historySearch, 'input', (e) => {
      const target = e.target as HTMLInputElement;
      const query = target.value.toLowerCase().trim();
      const historyItems = container.querySelectorAll('.pup-history-item');
      historyItems.forEach(item => {
        const htmlItem = item as HTMLElement;
        const text = (item.textContent || '').toLowerCase();
        htmlItem.style.display = (!query || text.includes(query)) ? 'flex' : 'none';
      });
    });
  }

  // Delete confirmations - layouts
  const deleteLayoutBtns = container.querySelectorAll('[data-action="confirm-delete-layout"]');
  deleteLayoutBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      const parent = btn.closest('[data-layout-key]');
      const key = (parent as HTMLElement)?.dataset.layoutKey;
      if (!key) return;
      _pendingDeleteAction = { type: 'layout', key };
      const msgEl = container.querySelector('#confirm-message');
      if (msgEl) msgEl.textContent = `Excluir layout "${key}"?`;
      openModal('pup-confirm-modal');
    });
  });

  // Delete confirmations - views
  const deleteViewBtns = container.querySelectorAll('[data-action="confirm-delete-view"]');
  deleteViewBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      const parent = btn.closest('[data-view-id]');
      const id = (parent as HTMLElement)?.dataset.viewId;
      if (!id) return;
      _pendingDeleteAction = { type: 'view', id };
      const msgEl = container.querySelector('#confirm-message');
      if (msgEl) msgEl.textContent = 'Excluir esta view?';
      openModal('pup-confirm-modal');
    });
  });

  const closeConfirmBtn = container.querySelector('[data-action="close-confirm"]');
  if (closeConfirmBtn) {
    _addListener(closeConfirmBtn, 'click', () => {
      closeModal('pup-confirm-modal');
      _pendingDeleteAction = null;
    });
  }

  const confirmActionBtn = container.querySelector('[data-action="confirm-action"]');
  if (confirmActionBtn) {
    _addListener(confirmActionBtn, 'click', async () => {
      if (!_pendingDeleteAction) return;
      closeModal('pup-confirm-modal');
      if (_pendingDeleteAction.type === 'layout') {
        await _callHandlerAsync(handlers, 'deleteLayout', _pendingDeleteAction.key);
        showToast('Layout excluído', 'success');
      } else {
        await _callHandlerAsync(handlers, 'deleteSavedView', _pendingDeleteAction.id);
        showToast('View excluída', 'success');
      }
      _pendingDeleteAction = null;
    });
  }

  // Apply layout/view
  const applyLayoutBtns = container.querySelectorAll('[data-action="apply-layout"]');
  applyLayoutBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      const parent = btn.closest('[data-layout-key]');
      const key = (parent as HTMLElement)?.dataset.layoutKey;
      if (key) {
        _callHandler(handlers, 'applyLayout', key);
        addMicroAnimation(btn, 'pup-bounce');
        showToast(`Layout "${key}" aplicado`, 'success');
      }
    });
  });

  const applyViewBtns = container.querySelectorAll('[data-action="apply-view"]');
  applyViewBtns.forEach((btn: Element) => {
    _addListener(btn, 'click', () => {
      const parent = btn.closest('[data-view-id]');
      const id = (parent as HTMLElement)?.dataset.viewId;
      if (id) {
        _callHandler(handlers, 'applyView', id);
        addMicroAnimation(btn, 'pup-bounce');
        showToast('View aplicada', 'success');
      }
    });
  });

  // Save layout
  const saveLayoutBtn = container.querySelector('[data-action="save-current-layout"]');
  if (saveLayoutBtn) {
    _addListener(saveLayoutBtn, 'click', async (e) => {
      const input = container.querySelector('[data-input="new-layout-name"]') as HTMLInputElement | null;
      const name = input?.value.trim() || '';
      if (!name) {
        addMicroAnimation(input, 'pup-shake');
        showToast('Digite um nome', 'warning');
        return;
      }
      addMicroAnimation(e.currentTarget as Element, 'pup-bounce');
      await _callHandlerAsync(handlers, 'saveLayout', name, {}, false);
      if (input) input.value = '';
      showToast(`Layout "${name}" salvo`, 'success');
    });
  }

  // Export
  const exportBtn = container.querySelector('[data-action="export"]');
  if (exportBtn) {
    _addListener(exportBtn, 'click', (e) => {
      _callHandler(handlers, 'exportPreferences');
      addMicroAnimation(e.currentTarget as Element, 'pup-bounce');
      showToast('Preferências exportadas', 'success');
    });
  }

  // Import
  const importTriggerBtn = container.querySelector('[data-action="import-trigger"]');
  if (importTriggerBtn) {
    _addListener(importTriggerBtn, 'click', () => {
      const fileInput = container.querySelector('[data-input="import-file"]') as HTMLElement | null;
      if (fileInput) fileInput.click();
    });
  }

  const importFileInput = container.querySelector('[data-input="import-file"]');
  if (importFileInput) {
    _addListener(importFileInput, 'change', async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        _pendingImportData = data;
        const filenameEl = container.querySelector('#import-filename');
        const versionEl = container.querySelector('#import-version');
        const summaryEl = container.querySelector('#import-summary');
        if (filenameEl) filenameEl.textContent = file.name;
        if (versionEl) versionEl.textContent = data.version || '—';
        const prefsCount = data.preferences ? Object.keys(data.preferences).length : 0;
        const layoutsCount = data.layouts?.items?.length || 0;
        if (summaryEl) summaryEl.textContent = `${prefsCount} prefs, ${layoutsCount} layouts`;
        openModal('pup-import-modal');
      } catch (err) { showToast('Arquivo inválido', 'error'); }
      target.value = '';
    });
  }

  const closeModalBtn = container.querySelector('[data-action="close-modal"]');
  if (closeModalBtn) {
    _addListener(closeModalBtn, 'click', () => {
      closeModal('pup-import-modal');
      _pendingImportData = null;
    });
  }

  const confirmImportBtn = container.querySelector('[data-action="confirm-import"]');
  if (confirmImportBtn) {
    _addListener(confirmImportBtn, 'click', async () => {
      if (!_pendingImportData) return;
      closeModal('pup-import-modal');
      try {
        await _callHandlerAsync(handlers, 'importPreferencesData', _pendingImportData);
        showToast('Preferências importadas', 'success');
      } catch (err) { showToast('Erro ao importar', 'error'); }
      _pendingImportData = null;
    });
  }

  // Click outside modals
  const overlays = container.querySelectorAll('.pup-modal-overlay');
  overlays.forEach(overlay => {
    _addListener(overlay, 'click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('visible');
        _pendingImportData = null;
        _pendingDeleteAction = null;
      }
    });
  });

  // Retry
  const retryBtn = container.querySelector('[data-action="retry"]');
  if (retryBtn) {
    _addListener(retryBtn, 'click', () => {
      _callHandler(handlers, 'retry');
    });
  }
}

export function destroy() {
  _boundListeners.forEach(item => {
    if (item.element?.removeEventListener) {
      item.element.removeEventListener(item.event, item.handler);
    }
  });
  _boundListeners = [];
}

export function cleanupModalState() {
  _pendingImportData = null;
  _pendingDeleteAction = null;
}

export function getListenerCount() { return _boundListeners.length; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, listenerCount: _boundListeners.length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { hasCleanup: true, listenerCount: _boundListeners.length } }; }

export default { MODULE_ID, VERSION, setupModalHandlers, destroy, cleanupModalState, getListenerCount, info, healthCheck };
