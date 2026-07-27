// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.3.0-INLINE-VALIDATION)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-inline-edit
// PURPOSE: Inline Edit Handler - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   startInlineEdit, endInlineEdit from ../renderer/items.js
//   shakeElement from ../renderer/effects.js
//
// PROVIDES:
//   createInlineEditHandlers() — exported function
//   getCurrentEditState() — exported function
//   clearEditState() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   'navigation:items:changed' (window CustomEvent on label save)
// LISTENS (eventos):
//   'click'
//   'keydown'
//   'blur'
// WINDOW ACCESS:
//   (none)
//
// @changelog
//   10.5.0-LABEL-INLINE-EDIT: Added handleLabelClick() for single-click inline
//     editing on ITEM column (.pna-item-label). Replaces label text with <input>,
//     saves on Enter/blur, cancels on Escape. Skips PATCH if value unchanged.
//   9.3.0-P2-ENTERPRISE: Previous version (double-click based)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { startInlineEdit, endInlineEdit } from '../renderer/items.js';
import { shakeElement } from '../renderer/effects.js';

export const MODULE_ID = 'panel-nav-admin-handlers-inline-edit';
export const VERSION = '12.1.0-TITLE-UX-ENHANCE';
interface EditState {
  itemId: string;
  field: string;
  originalValue: string;
  element: Element | null;
  wrapper?: HTMLElement;
  originalCell?: HTMLElement;
  [key: string]: unknown;
}
let _currentEditState: EditState | null = null;
let _labelEditActive = false;

export function createInlineEditHandlers(deps: Record<string, unknown>) {
  const container = deps.container as HTMLElement;
  const store = deps.store as Record<string, (...args: unknown[]) => unknown>;
  const navAdapter = deps.navAdapter as Record<string, (...args: unknown[]) => Promise<unknown>>;
  const showToast = deps.showToast as (msg: string, type: string) => void;
  const loadData = deps.loadData as () => void;

  function handleLabelClick(e: MouseEvent) {
    var el = e.target as HTMLElement;
    var labelSpan = el.closest('.pna-item-label') as HTMLElement | null;
    if (!labelSpan) return;
    // Ignore clicks on header
    if (el.closest('.pna-list-header')) return;
    // If already editing, do nothing
    if (_labelEditActive) return;

    var row = labelSpan.closest('[data-item-id]') as HTMLElement | null;
    if (!row) return;

    var itemId = row.dataset.itemId || '';
    var sourceTable = row.dataset.sourceTable || '';
    var sourceId = row.dataset.sourceId || '';
    var originalValue = (labelSpan.textContent || '').trim();

    _labelEditActive = true;

    // Create input element
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'pna-inline-edit-input';
    input.value = originalValue;

    // Store original content and replace with input
    var originalHtml = labelSpan.innerHTML;
    labelSpan.textContent = '';
    labelSpan.appendChild(input);
    labelSpan.classList.add('pna-item__field--editing');
    row.classList.add('pna-list-item--editing');

    // Focus and select
    input.focus();
    input.select();

    var _saved = false;

    function _finishEdit(save: boolean) {
      if (_saved) return;

      var newValue = input.value.trim();

      // v11.3.0: Inline validation before save
      if (save && newValue !== originalValue) {
        if (!newValue || newValue.length < 2) {
          // Show inline error
          input.classList.add('pna-input-invalid');
          var existingError = labelSpan!.querySelector('.pna-inline-error');
          if (!existingError) {
            var errSpan = document.createElement('span');
            errSpan.className = 'pna-inline-error';
            errSpan.textContent = 'Label deve ter pelo menos 2 caracteres';
            labelSpan!.appendChild(errSpan);
          }
          shakeElement(input as unknown as HTMLElement);
          input.focus();
          return; // Do NOT finish — let user correct
        }
      }

      _saved = true;
      _labelEditActive = false;

      // Remove input, restore label span
      labelSpan!.classList.remove('pna-item__field--editing');
      row!.classList.remove('pna-list-item--editing');

      if (!save || newValue === originalValue) {
        // Cancel or no change — restore original
        labelSpan!.innerHTML = originalHtml;
        return;
      }

      // Show new value in DOM immediately (optimistic) + saving indicator
      labelSpan!.textContent = newValue;
      var savingEl = document.createElement('span');
      savingEl.className = 'pna-saving-indicator';
      savingEl.textContent = ' Salvando...';
      labelSpan!.appendChild(savingEl);
      row!.classList.add('pna-list-item--saving');

      // Save via PATCH
      var updates: Record<string, unknown> = {
        sourceTable: sourceTable,
        sourceId: sourceId,
        label: newValue
      };

      navAdapter.updateItem(itemId, updates).then(function(result: Record<string, unknown>) {
        // Remove saving indicator
        if (savingEl.parentNode) savingEl.remove();
        row!.classList.remove('pna-list-item--saving');
        if (result && !result.success) {
          console.error('[inline-edit] updateItem FAILED — result.success is falsy:', result);
          labelSpan!.innerHTML = originalHtml;
          shakeElement(labelSpan as HTMLElement);
          showToast('Failed to update item: ' + (result.error || result.message || 'Unknown error'), 'error');
          return;
        }
        showToast('Item atualizado', 'success');
        window.dispatchEvent(new CustomEvent('navigation:items:changed', {
          detail: { source: 'panel-nav-admin', action: 'label-edit', itemId: itemId, newLabel: newValue, timestamp: Date.now() }
        }));
        loadData();
      }).catch(function(error: Error) {
        // Remove saving indicator + revert on error
        if (savingEl.parentNode) savingEl.remove();
        row!.classList.remove('pna-list-item--saving');
        labelSpan!.innerHTML = originalHtml;
        shakeElement(labelSpan as HTMLElement);
        showToast('Erro: ' + error.message, 'error');
      });
    }

    input.addEventListener('keydown', function(ev: KeyboardEvent) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        _finishEdit(true);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        _finishEdit(false);
      }
    });

    input.addEventListener('blur', function() {
      _finishEdit(true);
    });
  }

  function handleDisplayTitleClick(e: MouseEvent) {
    var el = e.target as HTMLElement;
    var titleSpan = el.closest('.pna-display-title') as HTMLElement | null;
    if (!titleSpan) return;
    if (el.closest('.pna-list-header')) return;
    if (_labelEditActive) return;

    var row = titleSpan.closest('[data-item-id]') as HTMLElement | null;
    if (!row) return;

    var itemId = row.dataset.itemId || '';
    var sourceTable = row.dataset.sourceTable || '';
    var sourceId = row.dataset.sourceId || '';

    // Get current displayTitle from store if available, fallback to span text
    var items = (store.get('items') as Record<string, unknown>[] | undefined) || [];
    var storeItem = items.find(function(i: Record<string, unknown>) { return i.id === itemId; });
    var originalValue = (storeItem && storeItem.displayTitle ? String(storeItem.displayTitle) : '').trim();
    var fallbackLabel = (storeItem && storeItem.label ? String(storeItem.label) : (titleSpan.textContent || '').trim());

    _labelEditActive = true;

    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'pna-inline-edit-input';
    // v12.1.0: When no custom title exists, start with empty input so user types fresh
    input.value = originalValue || '';
    input.placeholder = fallbackLabel;

    var originalHtml = titleSpan.innerHTML;
    titleSpan.textContent = '';
    titleSpan.appendChild(input);
    titleSpan.classList.add('pna-item__field--editing');
    row.classList.add('pna-list-item--editing');

    input.focus();
    input.select();

    var _saved = false;

    function _finishTitleEdit(save: boolean) {
      if (_saved) return;

      var newValue = input.value.trim();

      if (save && newValue.length > 0 && newValue.length < 2) {
        input.classList.add('pna-input-invalid');
        var existingError = titleSpan!.querySelector('.pna-inline-error');
        if (!existingError) {
          var errSpan = document.createElement('span');
          errSpan.className = 'pna-inline-error';
          errSpan.textContent = 'Titulo deve ter pelo menos 2 caracteres';
          titleSpan!.appendChild(errSpan);
        }
        shakeElement(input as unknown as HTMLElement);
        input.focus();
        return;
      }

      _saved = true;
      _labelEditActive = false;

      titleSpan!.classList.remove('pna-item__field--editing');
      row!.classList.remove('pna-list-item--editing');

      // If empty, treat as clearing the display_title (will use label as fallback)
      var valueToSave = newValue || '';

      if (!save || valueToSave === originalValue) {
        titleSpan!.innerHTML = originalHtml;
        return;
      }

      titleSpan!.textContent = valueToSave || fallbackLabel;
      var savingEl = document.createElement('span');
      savingEl.className = 'pna-saving-indicator';
      savingEl.textContent = ' Salvando...';
      titleSpan!.appendChild(savingEl);
      row!.classList.add('pna-list-item--saving');

      var updates: Record<string, unknown> = {
        sourceTable: sourceTable,
        sourceId: sourceId,
        displayTitle: valueToSave
      };

      navAdapter.updateItem(itemId, updates).then(function(result: Record<string, unknown>) {
        if (savingEl.parentNode) savingEl.remove();
        row!.classList.remove('pna-list-item--saving');
        if (result && !result.success) {
          titleSpan!.innerHTML = originalHtml;
          shakeElement(titleSpan as HTMLElement);
          showToast('Falha ao atualizar titulo: ' + (result.error || result.message || 'Erro desconhecido'), 'error');
          return;
        }
        showToast('Titulo atualizado', 'success');
        window.dispatchEvent(new CustomEvent('navigation:items:changed', {
          detail: { source: 'panel-nav-admin', action: 'display-title-edit', itemId: itemId, newDisplayTitle: valueToSave, timestamp: Date.now() }
        }));
        loadData();
      }).catch(function(error: Error) {
        if (savingEl.parentNode) savingEl.remove();
        row!.classList.remove('pna-list-item--saving');
        titleSpan!.innerHTML = originalHtml;
        shakeElement(titleSpan as HTMLElement);
        showToast('Erro: ' + error.message, 'error');
      });
    }

    input.addEventListener('keydown', function(ev: KeyboardEvent) {
      if (ev.key === 'Enter') {
        ev.preventDefault();
        _finishTitleEdit(true);
      } else if (ev.key === 'Escape') {
        ev.preventDefault();
        _finishTitleEdit(false);
      }
    });

    input.addEventListener('blur', function() {
      _finishTitleEdit(true);
    });
  }

  function handleDoubleClick(e: MouseEvent) {
    const el = e.target as HTMLElement;
    const labelCell = el.closest('[data-inline-edit]') as HTMLElement | null;
    if (!labelCell) return;
    const row = labelCell.closest('[data-item-id]') as HTMLElement | null;
    if (!row) return;
    const itemId = row.dataset.itemId;
    const field = labelCell.dataset.inlineEdit;
    // @ts-expect-error strict migration — TS2345
    const editState = startInlineEdit(itemId, field);
    if (!editState) return;
    _currentEditState = editState as EditState;

    // @ts-expect-error TS migration - TS2339
    const saveBtn = editState.wrapper.querySelector('[data-action="save-inline"]');

    // @ts-expect-error TS migration - TS2339
    const cancelBtn = editState.wrapper.querySelector('[data-action="cancel-inline"]');

    // @ts-expect-error TS migration - TS2339
    const input = editState.wrapper.querySelector('input');
    // @ts-expect-error strict migration — TS2345
    if (saveBtn) saveBtn.addEventListener('click', () => { const newValue = input ? input.value : ''; saveInlineEdit(itemId, field, newValue); });
    if (cancelBtn) cancelBtn.addEventListener('click', () => { cancelInlineEdit(); });
    // @ts-expect-error strict migration — TS2345
    if (input) { input.addEventListener('keydown', (ev: KeyboardEvent) => { if (ev.key === 'Enter') { ev.preventDefault(); saveInlineEdit(itemId, field, (ev.target as HTMLInputElement).value); } else if (ev.key === 'Escape') { ev.preventDefault(); cancelInlineEdit(); } }); input.focus(); input.select(); }
  }

  function saveInlineEdit(itemId: string, field: string, newValue: string) {
    if (!_currentEditState) return;
    const items = (store.get('items') as Record<string, unknown>[] | undefined) || [];
    const item = items.find((i: Record<string, unknown>) => i.id === itemId);
    if (!item) return;
    const updateData = Object.assign({}, item);
    updateData[field] = newValue;
    navAdapter.updateItem(itemId, updateData).then(() => {
      // @ts-expect-error strict migration — TS2532
      _currentEditState!.originalCell.textContent = newValue;

      // @ts-expect-error TS migration - TS2554
      endInlineEdit(_currentEditState.wrapper, _currentEditState.originalCell);
      _currentEditState = null;
      showToast('Item atualizado', 'success');
      loadData();
    }).catch((error: Error) => {
      // @ts-expect-error strict migration — TS2532
      const inp = _currentEditState!.wrapper.querySelector('input');

      // @ts-expect-error TS migration - TS2554
      if (inp) shakeElement(inp);
      showToast(`Erro: ${error.message}`, 'error');
    });
  }


  // @ts-expect-error TS migration - TS2554
  function cancelInlineEdit() { if (!_currentEditState) return; endInlineEdit(_currentEditState.wrapper, _currentEditState.originalCell); _currentEditState = null; }

  return { handleLabelClick, handleDisplayTitleClick, handleDoubleClick, saveInlineEdit, cancelInlineEdit };
}

export function getCurrentEditState() { return _currentEditState; }

// @ts-expect-error TS migration - TS2554
export function clearEditState() { if (_currentEditState) { endInlineEdit(_currentEditState.wrapper, _currentEditState.originalCell); _currentEditState = null; } _labelEditActive = false; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
