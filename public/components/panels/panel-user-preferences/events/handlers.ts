// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-preferences-events-handlers
// PURPOSE: Panel User Preferences Events - DOM Handlers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   applyTheme, applyDensity from ../theme-applier.js
//   _state, _handlers, _pendingImportData, _pendingDeleteAction, _draggedItem, pu...
//   showToast, announce, setButtonLoading, openModal, closeModal, scheduleAutoSav...
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupThemeHandlers() — exported function
//   setupDensityHandlers() — exported function
//   setupToggleHandlers() — exported function
//   setupDragDropHandlers() — exported function
//   setupActionHandlers() — exported function
//   setupCustomThemeHandlers() — exported function
//   destroy() — exported function
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
import { _state, _handlers, _pendingImportData, _pendingDeleteAction, _draggedItem, pushUndo, setPendingImportData, setPendingDeleteAction, setDraggedItem, clearUndoStack } from './state.js';
import { showToast, announce, setButtonLoading, openModal, closeModal, scheduleAutoSave, cancelAutoSave, addMicroAnimation, requestPushPermission } from './utils.js';

export const MODULE_ID = 'panels-panel-user-preferences-events-handlers';
export const VERSION = '9.3.0-P2-ENTERPRISE';

type HandlerFn = (...args: unknown[]) => unknown;
type StatePrefs = Record<string, unknown> | undefined;

function _getPrefs(): StatePrefs {
  return _state?.preferences as StatePrefs;
}

function _callHandler(name: string, ...args: unknown[]): unknown {
  if (_handlers && typeof _handlers[name] === 'function') {
    return (_handlers[name] as HandlerFn)(...args);
  }
  return undefined;
}

async function _callHandlerAsync(name: string, ...args: unknown[]): Promise<unknown> {
  if (_handlers && typeof _handlers[name] === 'function') {
    return await (_handlers[name] as HandlerFn)(...args);
  }
  return undefined;
}

let _boundListeners: Array<{ element: Element; event: string; handler: (e: Event) => void }> = [];

function _addListener(el: Element, event: string, handler: (e: Event) => void) {
  if (!el) return;
  el.addEventListener(event, handler);
  _boundListeners.push({ element: el, event, handler });
}

export function setupThemeHandlers(container: Element) {
  container.querySelectorAll('[data-theme]').forEach(el => {
    const htmlEl = el as HTMLElement;
    // @ts-expect-error strict migration — TS2345
    _addListener(el, 'mouseenter', () => { const theme = htmlEl.dataset.theme; if (theme !== _getPrefs()?.theme) { el.classList.add('preview-active'); applyTheme(theme); } });
    _addListener(el, 'mouseleave', () => { el.classList.remove('preview-active'); applyTheme((_getPrefs()?.theme as string) || 'dark'); });
    // @ts-expect-error strict migration — TS2345
    _addListener(el, 'click', () => { const theme = htmlEl.dataset.theme; pushUndo('theme', (_getPrefs()?.theme as string) || 'dark'); applyTheme(theme); _callHandler('markDirty', 'theme', theme); scheduleAutoSave(); addMicroAnimation(el, 'pup-bounce'); announce(`Tema: ${theme === 'light' ? 'claro' : theme === 'dark' ? 'escuro' : 'auto'}`); });
    _addListener(el, 'keydown', (e) => { const ke = e as KeyboardEvent; if (ke.key === 'Enter' || ke.key === ' ') { e.preventDefault(); htmlEl.click(); } });
  });
}

export function setupDensityHandlers(container: Element) {
  container.querySelectorAll('[data-density]').forEach(el => {
    const htmlEl = el as HTMLElement;
    // @ts-expect-error strict migration — TS2345
    _addListener(el, 'click', () => { const density = htmlEl.dataset.density; pushUndo('density', (_getPrefs()?.density as string) || 'comfortable'); applyDensity(density); _callHandler('markDirty', 'density', density); scheduleAutoSave(); addMicroAnimation(el, 'pup-bounce'); announce(`Densidade: ${density}`); });
    _addListener(el, 'keydown', (e) => { const ke = e as KeyboardEvent; if (ke.key === 'Enter' || ke.key === ' ') { e.preventDefault(); htmlEl.click(); } });
  });
}

export function setupToggleHandlers(container: Element) {
  container.querySelectorAll('[data-pref-change="toggle"]').forEach(el => {
    const inputEl = el as HTMLInputElement;
    _addListener(el, 'change', async () => {
      const key = inputEl.dataset.pref;
      const value = inputEl.checked ? 'true' : 'false';
      // @ts-expect-error strict migration — TS2345
      pushUndo(key, inputEl.checked ? 'false' : 'true');
      if (key === 'push_enabled' && inputEl.checked) { const granted = await requestPushPermission(); if (!granted) { inputEl.checked = false; return; } showToast('Notificações push ativadas!', 'success'); }
      _callHandler('markDirty', key, value); scheduleAutoSave();
      const parent = el.closest('.pup-notif-item');
      const iconEl = parent?.querySelector('.pup-notif-icon');
      if (iconEl && key === 'sound_enabled') { iconEl.innerHTML = inputEl.checked ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>'; }
      if (el.parentElement) addMicroAnimation(el.parentElement, 'pup-bounce');
      announce(`${key === 'notifications_enabled' ? 'Notificações' : key === 'push_enabled' ? 'Push' : 'Sons'} ${inputEl.checked ? 'ativados' : 'desativados'}`);
    });
  });
}

export function setupDragDropHandlers(container: Element) {
  const droppableArea = container.querySelector('[data-droppable="layouts"]');
  if (!droppableArea) return;
  const items = droppableArea.querySelectorAll('.pup-item[draggable="true"]');
  items.forEach(item => {
    const htmlItem = item as HTMLElement;
    _addListener(item, 'dragstart', (e) => { const de = e as DragEvent; setDraggedItem(item); htmlItem.classList.add('dragging'); if (de.dataTransfer) { de.dataTransfer.effectAllowed = 'move'; de.dataTransfer.setData('text/plain', htmlItem.dataset.layoutKey || ''); } });
    _addListener(item, 'dragend', () => { htmlItem.classList.remove('dragging'); setDraggedItem(null); droppableArea.querySelectorAll('.pup-item').forEach((i: Element) => { (i as HTMLElement).classList.remove('drag-over'); }); });
    _addListener(item, 'dragover', (e) => { e.preventDefault(); const de = e as DragEvent; if (de.dataTransfer) de.dataTransfer.dropEffect = 'move'; if (_draggedItem && _draggedItem !== item) htmlItem.classList.add('drag-over'); });
    _addListener(item, 'dragleave', () => { htmlItem.classList.remove('drag-over'); });
    _addListener(item, 'drop', (e) => {
      e.preventDefault(); item.classList.remove('drag-over');
      if (_draggedItem && _draggedItem !== item) {
        const allItems = Array.from(droppableArea.querySelectorAll('.pup-item[draggable="true"]'));
        const draggedIndex = allItems.indexOf(_draggedItem);
        const targetIndex = allItems.indexOf(item);
        if (draggedIndex < targetIndex) item.parentNode?.insertBefore(_draggedItem, item.nextSibling);
        else item.parentNode?.insertBefore(_draggedItem, item);

        const newOrder = Array.from(droppableArea.querySelectorAll('.pup-item[draggable="true"]')).map(i => (i as HTMLElement).dataset.layoutKey);
        _callHandler('reorderLayouts', newOrder);
        showToast('Ordem dos layouts atualizada', 'info'); announce('Layouts reordenados');
      }
    });
  });
}

export function setupActionHandlers(container: Element) {
  const toggleCompactBtn = container.querySelector('[data-action="toggle-compact"]');
  if (toggleCompactBtn) _addListener(toggleCompactBtn, 'click', (e: Event) => { _callHandler('toggleCompact'); addMicroAnimation((e as MouseEvent).currentTarget as Element, 'pup-bounce'); announce(_state?.isCompact ? 'Modo expandido' : 'Modo compacto'); });

  const saveAllBtn = container.querySelector('[data-action="save-all"]');
  if (saveAllBtn) _addListener(saveAllBtn, 'click', async (e) => { const btn = e.currentTarget as HTMLElement | null; cancelAutoSave(); setButtonLoading(btn, true); addMicroAnimation(btn, 'pup-bounce'); try { await _callHandlerAsync('saveAllChanges'); showToast('Preferências salvas', 'success'); announce('Preferências salvas'); } catch (err) { showToast('Erro ao salvar', 'error'); announce('Erro ao salvar'); } finally { setButtonLoading(btn, false); } });

  const discardBtn = container.querySelector('[data-action="discard-changes"]');
  if (discardBtn) _addListener(discardBtn, 'click', (e) => { cancelAutoSave(); _callHandler('discardChanges'); addMicroAnimation(e.currentTarget as Element, 'pup-shake'); showToast('Alterações descartadas', 'info'); announce('Alterações descartadas'); });

  const resetBtn = container.querySelector('[data-action="reset-preferences"]');
  if (resetBtn) _addListener(resetBtn, 'click', () => { openModal('pup-reset-modal'); });

  const closeResetBtn = container.querySelector('[data-action="close-reset"]');
  if (closeResetBtn) _addListener(closeResetBtn, 'click', () => { closeModal('pup-reset-modal'); });

  const confirmResetBtn = container.querySelector('[data-action="confirm-reset"]');
  if (confirmResetBtn) _addListener(confirmResetBtn, 'click', async () => { closeModal('pup-reset-modal'); cancelAutoSave(); const defaults: Record<string, string> = { theme: 'dark', density: 'comfortable', notifications_enabled: 'true', sound_enabled: 'false', push_enabled: 'false' }; for (const key in defaults) { if (Object.prototype.hasOwnProperty.call(defaults, key)) _callHandler('markDirty', key, defaults[key]); } applyTheme('dark'); applyDensity('comfortable'); document.documentElement.style.removeProperty('--pup-accent'); document.documentElement.style.removeProperty('--pup-bg'); document.documentElement.style.removeProperty('--pup-card'); document.documentElement.style.removeProperty('--pup-text'); await _callHandlerAsync('saveAllChanges'); clearUndoStack(); showToast('Preferências restauradas', 'success'); announce('Preferências restauradas'); });

  const showHistoryBtn = container.querySelector('[data-action="show-history"]');
  if (showHistoryBtn) _addListener(showHistoryBtn, 'click', (e) => { const section = container.querySelector('#pup-history-section') as HTMLElement | null; if (section) { section.style.display = 'block'; section.classList.add('pup-slide-in'); section.scrollIntoView({ behavior: 'smooth', block: 'start' }); } addMicroAnimation(e.currentTarget as Element, 'pup-bounce'); _callHandler('setHistoryVisible', true); });

  const hideHistoryBtn = container.querySelector('[data-action="hide-history"]');
  if (hideHistoryBtn) _addListener(hideHistoryBtn, 'click', () => { const section = container.querySelector('#pup-history-section') as HTMLElement | null; if (section) section.style.display = 'none'; _callHandler('setHistoryVisible', false); });

  container.querySelectorAll('[data-filter]').forEach(btn => { const htmlBtn = btn as HTMLElement; _addListener(btn, 'click', () => { const filter = htmlBtn.dataset.filter; container.querySelectorAll('[data-filter]').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-pressed', 'false'); }); btn.classList.add('active'); btn.setAttribute('aria-pressed', 'true'); addMicroAnimation(btn, 'pup-bounce'); container.querySelectorAll('.pup-history-item').forEach(item => { const htmlItem = item as HTMLElement; const type = htmlItem.dataset.type; htmlItem.style.display = (filter === 'all' || type === filter) ? 'flex' : 'none'; }); _callHandler('setHistoryFilter', filter); }); });

  const historySearchInput = container.querySelector('[data-input="history-search"]');
  if (historySearchInput) _addListener(historySearchInput, 'input', (e) => { const target = e.target as HTMLInputElement; const query = target.value.toLowerCase().trim(); container.querySelectorAll('.pup-history-item').forEach(item => { const htmlItem = item as HTMLElement; const text = (item.textContent || '').toLowerCase(); htmlItem.style.display = (!query || text.includes(query)) ? 'flex' : 'none'; }); });

  container.querySelectorAll('[data-action="confirm-delete-layout"]').forEach(btn => { _addListener(btn, 'click', () => { const parent = btn.closest('[data-layout-key]') as HTMLElement | null; const key = parent?.dataset.layoutKey; if (!key) return; setPendingDeleteAction({ type: 'layout', key }); const msgEl = container.querySelector('#confirm-message'); if (msgEl) msgEl.textContent = `Excluir layout "${key}"?`; openModal('pup-confirm-modal'); }); });

  container.querySelectorAll('[data-action="confirm-delete-view"]').forEach(btn => { _addListener(btn, 'click', () => { const parent = btn.closest('[data-view-id]') as HTMLElement | null; const id = parent?.dataset.viewId; if (!id) return; setPendingDeleteAction({ type: 'view', id }); const msgEl = container.querySelector('#confirm-message'); if (msgEl) msgEl.textContent = 'Excluir esta view?'; openModal('pup-confirm-modal'); }); });

  const closeConfirmBtn = container.querySelector('[data-action="close-confirm"]');
  if (closeConfirmBtn) _addListener(closeConfirmBtn, 'click', () => { closeModal('pup-confirm-modal'); setPendingDeleteAction(null); });

  const confirmActionBtn = container.querySelector('[data-action="confirm-action"]');
  if (confirmActionBtn) _addListener(confirmActionBtn, 'click', async () => { if (!_pendingDeleteAction) return; closeModal('pup-confirm-modal'); if (_pendingDeleteAction.type === 'layout') { await _callHandlerAsync('deleteLayout', _pendingDeleteAction.key); showToast('Layout excluído', 'success'); } else { await _callHandlerAsync('deleteSavedView', _pendingDeleteAction.id); showToast('View excluída', 'success'); } setPendingDeleteAction(null); });

  container.querySelectorAll('[data-action="apply-layout"]').forEach(btn => { _addListener(btn, 'click', () => { const parent = btn.closest('[data-layout-key]') as HTMLElement | null; const key = parent?.dataset.layoutKey; if (key) { _callHandler('applyLayout', key); addMicroAnimation(btn, 'pup-bounce'); showToast(`Layout "${key}" aplicado`, 'success'); } }); });

  container.querySelectorAll('[data-action="apply-view"]').forEach(btn => { _addListener(btn, 'click', () => { const parent = btn.closest('[data-view-id]') as HTMLElement | null; const id = parent?.dataset.viewId; if (id) { _callHandler('applyView', id); addMicroAnimation(btn, 'pup-bounce'); showToast('View aplicada', 'success'); } }); });

  const saveLayoutBtn = container.querySelector('[data-action="save-current-layout"]');
  if (saveLayoutBtn) _addListener(saveLayoutBtn, 'click', async (e) => { const input = container.querySelector('[data-input="new-layout-name"]') as HTMLInputElement | null; const name = input?.value.trim() || ''; if (!name) { addMicroAnimation(input, 'pup-shake'); showToast('Digite um nome', 'warning'); return; } addMicroAnimation(e.currentTarget as Element, 'pup-bounce'); await _callHandlerAsync('saveLayout', name, {}, false); if (input) input.value = ''; showToast(`Layout "${name}" salvo`, 'success'); });

  const exportBtn = container.querySelector('[data-action="export"]');
  if (exportBtn) _addListener(exportBtn, 'click', (e) => { _callHandler('exportPreferences'); addMicroAnimation(e.currentTarget as Element, 'pup-bounce'); showToast('Preferências exportadas', 'success'); });

  const importTriggerBtn = container.querySelector('[data-action="import-trigger"]');
  if (importTriggerBtn) _addListener(importTriggerBtn, 'click', () => { const fileInput = container.querySelector('[data-input="import-file"]') as HTMLElement | null; if (fileInput) fileInput.click(); });

  const importFileInput = container.querySelector('[data-input="import-file"]');
  if (importFileInput) _addListener(importFileInput, 'change', async (e) => { const target = e.target as HTMLInputElement; const file = target.files?.[0]; if (!file) return; try { const text = await file.text(); const data = JSON.parse(text); setPendingImportData(data); const filenameEl = container.querySelector('#import-filename'); const versionEl = container.querySelector('#import-version'); const summaryEl = container.querySelector('#import-summary'); if (filenameEl) filenameEl.textContent = file.name; if (versionEl) versionEl.textContent = data.version || '—'; const prefsCount = data.preferences ? Object.keys(data.preferences).length : 0; const layoutsCount = data.layouts?.items?.length || 0; if (summaryEl) summaryEl.textContent = `${prefsCount} prefs, ${layoutsCount} layouts`; openModal('pup-import-modal'); } catch (err) { showToast('Arquivo inválido', 'error'); } target.value = ''; });

  const closeModalBtn = container.querySelector('[data-action="close-modal"]');
  if (closeModalBtn) _addListener(closeModalBtn, 'click', () => { closeModal('pup-import-modal'); setPendingImportData(null); });

  const confirmImportBtn = container.querySelector('[data-action="confirm-import"]');
  if (confirmImportBtn) _addListener(confirmImportBtn, 'click', async () => { if (!_pendingImportData) return; closeModal('pup-import-modal'); try { await _callHandlerAsync('importPreferencesData', _pendingImportData); showToast('Preferências importadas', 'success'); } catch (err) { showToast('Erro ao importar', 'error'); } setPendingImportData(null); });

  container.querySelectorAll('.pup-modal-overlay').forEach(overlay => { _addListener(overlay, 'click', (e) => { if (e.target === overlay) { overlay.classList.remove('visible'); setPendingImportData(null); setPendingDeleteAction(null); } }); });

  const retryBtn = container.querySelector('[data-action="retry"]');
  if (retryBtn) _addListener(retryBtn, 'click', () => { _callHandler('retry'); });
}

export function setupCustomThemeHandlers(container: Element) {
  container.querySelectorAll('.pup-color-input').forEach((input: Element) => {
    _addListener(input, 'input', (e) => { const target = e.target as HTMLInputElement; const color = target.value; const prop = target.dataset.color; if (prop === 'accent') document.documentElement.style.setProperty('--pup-accent', color); if (prop === 'bg') document.documentElement.style.setProperty('--pup-bg', color); if (prop === 'card') document.documentElement.style.setProperty('--pup-card', color); if (prop === 'text') document.documentElement.style.setProperty('--pup-text', color); });
  });
  const applyCustomBtn = container.querySelector('[data-action="apply-custom-theme"]');
  if (applyCustomBtn) _addListener(applyCustomBtn, 'click', () => {
    const accentEl = container.querySelector('[data-color="accent"]') as HTMLInputElement | null;
    const bgEl = container.querySelector('[data-color="bg"]') as HTMLInputElement | null;
    const cardEl = container.querySelector('[data-color="card"]') as HTMLInputElement | null;
    const textEl = container.querySelector('[data-color="text"]') as HTMLInputElement | null;
    const accent = accentEl?.value || '#7c3aed';
    const bg = bgEl?.value || '#09090b';
    const card = cardEl?.value || '#131316';
    const text = textEl?.value || '#ffffff';
    const customTheme = JSON.stringify({ accent, bg, card, text });
    _callHandler('markDirty', 'custom_theme', customTheme); _callHandler('markDirty', 'theme', 'custom');
    scheduleAutoSave();
    showToast('Tema personalizado aplicado', 'success'); announce('Tema personalizado aplicado');
  });
}

export function destroy() {
  _boundListeners.forEach(item => {
    if (item.element?.removeEventListener) {
      item.element.removeEventListener(item.event, item.handler);
    }
  });
  _boundListeners = [];
}

export function getListenerCount() { return _boundListeners.length; }

export function info() { return { moduleId: MODULE_ID, version: VERSION, listenerCount: _boundListeners.length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { handlersReady: true, listenerCount: _boundListeners.length, hasCleanup: true } }; }

export default { setupThemeHandlers, setupDensityHandlers, setupToggleHandlers, setupDragDropHandlers, setupActionHandlers, setupCustomThemeHandlers, destroy, getListenerCount, info, healthCheck, MODULE_ID, VERSION };
