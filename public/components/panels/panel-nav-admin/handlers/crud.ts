

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: crud
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ../state/store.js
//   tracker from ../telemetry/tracker.js
//   ui from ../ui/renderer.js
//   validateItem, validateSectionData from ../utils/validators.js
//   mapFormToItem, mapItemToForm, mapFormToSection, mapSectionToForm from ../util...
//   metrics from ../core/lifecycle.js
//
// PROVIDES:
//   getEditingItem() — exported function
//   getEditingSection() — exported function
//   getPendingDelete() — exported function
//   clearEditingItem() — exported function
//   clearEditingSection() — exported function
//   clearPendingDelete() — exported function
//   resetConfirmState() — exported function (v11.7.0)
//   openItemForm() — exported function
//   openSectionForm() — exported function
//   confirmDeleteItem() — exported function
//   confirmDeleteSection() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   CustomEvent 'navigation:items:changed' (on delete-item success)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
// Panel Nav Admin - CRUD Handlers v11.4.0
// @version 11.4.0-DELETE-TRACE
// CRUD operations for items and sections with undo-delete support + delete tracing

const MODULE_ID = 'panel-nav-admin/handlers/crud';
const VERSION = '11.7.0-CONFIRM-FIX';

import { state } from '../state/store.js';
import { tracker } from '../telemetry/tracker.js';
import { ui } from '../ui/renderer.js';
import * as navAdapter from '../core/nav-adapter.js';
import { validateItem, validateSectionData } from '../utils/validators.js';
import { mapFormToItem, mapItemToForm, mapFormToSection, mapSectionToForm } from '../utils/mappers.js';
import { metrics } from '../core/lifecycle.js';
import { showConfirmDialog } from '../ui/modals.js';

const _ui = ui as any;
const _navAdapter = navAdapter as any;
const _tracker = tracker as any;
const _validateItem = validateItem as any;
const _validateSectionData = validateSectionData as any;

let _editingItem: string | null = null;
let _editingSection: string | null = null;
let _pendingDelete: { type: string; id?: string; key?: string; sourceTable?: string; sourceId?: unknown } | null = null;
let _confirmInProgress = false;

export function getEditingItem() { return _editingItem; }
export function getEditingSection() { return _editingSection; }
export function getPendingDelete() { return _pendingDelete; }
export function clearEditingItem() { _editingItem = null; }
export function clearEditingSection() { _editingSection = null; }
export function clearPendingDelete() { _pendingDelete = null; }
export function resetConfirmState() { _confirmInProgress = false; _pendingDelete = null; }

export function openItemForm(container: HTMLElement, itemId: string | null = null) {
  const currentState = state.getState() as Record<string, unknown>;
  let item = null;

  if (itemId) {
    item = (currentState.items as Record<string, unknown>[])?.find((i: Record<string, unknown>) => i.id === itemId);
    if (item) item = mapItemToForm(item);
  }

  _editingItem = itemId;
  const modal = container?.querySelector('[data-modal="item-form"]') as HTMLElement | null;
  const backdrop = container?.querySelector('[data-modal-backdrop]') as HTMLElement | null;
  if (modal && backdrop) {
    modal.innerHTML = _ui.renderItemForm(item, (currentState as Record<string, unknown>).sections, (currentState as Record<string, unknown>).icons);
    modal.hidden = false;
    backdrop.hidden = false;
  }
}

export async function saveItem(data: Record<string, unknown>, callbacks: Record<string, unknown>) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks as { showToast: (msg: string, type: string) => void; showLoading: (v: boolean) => void; closeAllModals: () => void; loadData: () => Promise<void> };
  const currentState = state.getState() as Record<string, unknown>;
  const itemData = mapFormToItem(data);
  const isEdit = !!_editingItem;

  const validation = (_validateItem)(itemData, currentState.sections, currentState.items, isEdit);
  if (!validation.valid) {
    showToast(validation.errors[0], 'error');
    return;
  }

  state.markSaving();
  showLoading(true);

  try {
    let result;
    if (isEdit) {
      result = await (_navAdapter).updateItem(_editingItem, itemData);
      if (result.success) {
        metrics.itemsUpdated++;
        _tracker.trackItemUpdated(itemData);
        showToast('Item atualizado com sucesso', 'success');
      }
    } else {
      result = await (_navAdapter).createItem(itemData);
      if (result.success) {
        metrics.itemsCreated++;
        _tracker.trackItemCreated(itemData);
        showToast('Item criado com sucesso', 'success');

        if (data.scaffold) {
          await runScaffold(itemData, showToast);
        }
      }
    }

    if (result.success) {
      // Emitir evento global para re-render dos componentes de navegacao
      window.dispatchEvent(new CustomEvent('navigation:icons:updated', {
        detail: { source: 'panel-nav-admin', timestamp: Date.now() }
      }));
      closeAllModals();
      await loadData();
    } else {
      showToast(result.error || 'Erro ao salvar item', 'error');
      state.markReady();
    }
  } catch (error: any) {
    metrics.errorCount++;
    showToast(error.message, 'error');
    state.setError(error.message);
  }

  showLoading(false);
}

export function openSectionForm(container: HTMLElement, sectionKey: string | null = null) {
  const currentState = state.getState() as Record<string, unknown>;
  let section = null;
  const sections = currentState.sections as Record<string, unknown>;

  if (sectionKey && sections[sectionKey]) {
    section = mapSectionToForm(sectionKey, sections[sectionKey] as Record<string, unknown>);
  }

  _editingSection = sectionKey;
  const modal = container?.querySelector('[data-modal="section-form"]') as HTMLElement | null;
  const backdrop = container?.querySelector('[data-modal-backdrop]') as HTMLElement | null;
  if (modal && backdrop) {
    modal.innerHTML = _ui.renderSectionForm(section);
    modal.hidden = false;
    backdrop.hidden = false;
  }
}

export async function saveSection(data: Record<string, unknown>, callbacks: Record<string, unknown>) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks as { showToast: (msg: string, type: string) => void; showLoading: (v: boolean) => void; closeAllModals: () => void; loadData: () => Promise<void> };
  const currentState = state.getState() as Record<string, unknown>;
  const sectionData = mapFormToSection(data);
  const isEdit = !!_editingSection;

  const validation = (_validateSectionData)(sectionData, currentState.sections, isEdit);
  if (!validation.valid) {
    showToast(validation.errors[0], 'error');
    return;
  }

  state.markSaving();
  showLoading(true);

  try {
    let result;
    if (isEdit) {
      result = await (_navAdapter).updateSection(_editingSection, sectionData);
      if (result.success) {
        _tracker.trackSectionUpdated(sectionData);
        showToast('Seção atualizada com sucesso', 'success');
      }
    } else {
      result = await (_navAdapter).createSection(sectionData);
      if (result.success) {
        metrics.sectionsCreated++;
        _tracker.trackSectionCreated(sectionData);
        showToast('Seção criada com sucesso', 'success');
      }
    }

    if (result.success) {
      closeAllModals();
      await loadData();
    } else {
      showToast(result.error || 'Erro ao salvar seção', 'error');
      state.markReady();
    }
  } catch (error: any) {
    metrics.errorCount++;
    showToast(error.message, 'error');
  }

  showLoading(false);
}

export async function confirmDeleteItem(container: HTMLElement, itemId: string, callbacks: Record<string, unknown>, triggerElement?: HTMLElement) {
  if (_confirmInProgress) return;
  _confirmInProgress = true;
  try {
  const items = (state.get('items') as Record<string, unknown>[]) || [];
  // v1.1.0-FIX: Use String() coercion — itemId from DOM dataset is always string,
  // but item.id (from _mapApiItem's item_key) may be number in some DB rows
  const item = items.find((i: Record<string, unknown>) => String(i.id) === String(itemId));
  const label = (item?.label as string) || itemId;

  const confirmed = await showConfirmDialog(
    'Excluir ' + label,
    'Tem certeza que deseja excluir este item?',
    'Excluir',
    triggerElement
  );
  if (!confirmed) {
    return;
  }

  if (!item?.sourceTable || !item?.sourceId) {
    console.error('[crud] ERRO: sourceTable ou sourceId ausentes no item! item:', JSON.stringify(item));
  }

  _pendingDelete = { type: 'item', id: itemId, sourceTable: (item as Record<string, unknown>)?.sourceTable as string, sourceId: (item as Record<string, unknown>)?.sourceId };
  // v11.7.0-CONFIRM-FIX: Reset _confirmInProgress ANTES de executeDeleteItem
  // para evitar que o flag fique stuck se executeDeleteItem falhar de forma inesperada.
  // O guard ja cumpriu seu papel (impedir dialogs concorrentes durante o showConfirmDialog).
  _confirmInProgress = false;
  await executeDeleteItem(callbacks);
  } catch (err) { console.error('[crud] ERRO em confirmDeleteItem:', err); _confirmInProgress = false; }
}

export async function executeDeleteItem(callbacks: Record<string, unknown>) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks as { showToast: (msg: string, type: string) => void; showLoading: (v: boolean) => void; closeAllModals: () => void; loadData: () => Promise<void> };
  const showToastWithAction = (callbacks as Record<string, unknown>).showToastWithAction as ((msg: string, type: string, actionLabel: string, onAction: () => void, duration?: number) => void) | undefined;
  if (!_pendingDelete || _pendingDelete.type !== 'item') {
    console.warn('[crud] executeDeleteItem ABORTADO — _pendingDelete invalido:', JSON.stringify(_pendingDelete));
    return;
  }

  if (!_pendingDelete.sourceTable || !_pendingDelete.sourceId) {
    console.error('[crud] executeDeleteItem ABORTADO — sourceTable/sourceId ausentes:', { sourceTable: _pendingDelete.sourceTable, sourceId: _pendingDelete.sourceId });
    showToast('Erro: dados de origem do item não encontrados (sourceTable/sourceId)', 'error');
    _pendingDelete = null;
    showLoading(false);
    return;
  }

  // v11.3.0: Save delete context for undo
  const deletedSourceTable = _pendingDelete.sourceTable;
  const deletedSourceId = _pendingDelete.sourceId;
  const deletedItemId = _pendingDelete.id;

  state.markSaving();
  showLoading(true);

  try {
    const result = await (_navAdapter).deleteItem(_pendingDelete.id, _pendingDelete.sourceTable, _pendingDelete.sourceId);
    if (result.success) {
      metrics.itemsDeleted++;
      _tracker.trackItemDeleted(_pendingDelete.id);

      // v11.6.0: Fade-out animation (300ms) then remove from DOM for instant visual feedback
      const deletedRow = document.querySelector(`[data-item-id="${_pendingDelete.id}"]`) as HTMLElement | null;
      if (deletedRow) {
        deletedRow.style.transition = 'opacity 300ms ease-out';
        deletedRow.style.opacity = '0';
        await new Promise<void>(resolve => {
          setTimeout(() => { deletedRow.remove(); resolve(); }, 300);
        });
      }

      closeAllModals();

      // v11.5.0: Emit navigation:items:changed so sidebar/nav-rail sync
      window.dispatchEvent(new CustomEvent('navigation:items:changed', {
        detail: { source: 'panel-nav-admin', action: 'delete-item', itemId: _pendingDelete.id, timestamp: Date.now() }
      }));

      await loadData();

      // v11.3.0: Show undo toast instead of plain success toast
      if (showToastWithAction) {
        showToastWithAction('Item excluído com sucesso', 'success', 'Desfazer', function() {
          (_navAdapter).restoreItem(deletedSourceTable, deletedSourceId).then(function(restoreResult: Record<string, unknown>) {
            if (restoreResult.success) {
              showToast('Item restaurado com sucesso', 'success');
              loadData();
            } else {
              showToast(restoreResult.error as string || 'Erro ao restaurar item', 'error');
            }
          }).catch(function(err: Error) {
            showToast('Erro ao restaurar: ' + err.message, 'error');
          });
        }, 5000);
      } else {
        showToast('Item excluído com sucesso', 'success');
      }
    } else {
      showToast(result.error || 'Erro ao excluir item', 'error');
      state.markReady();
    }
  } catch (error: any) {
    metrics.errorCount++;
    showToast(error.message, 'error');
  }

  _pendingDelete = null;
  showLoading(false);
}

export function confirmDeleteSection(container: HTMLElement, sectionKey: string) {
  const currentState = state.getState() as Record<string, unknown>;
  const itemsInSection = (currentState.items as Record<string, unknown>[])?.filter((i: Record<string, unknown>) => i.section === sectionKey).length || 0;

  _pendingDelete = { type: 'section', key: sectionKey };
  const modal = container?.querySelector('[data-modal="confirm"]') as HTMLElement | null;
  const backdrop = container?.querySelector('[data-modal-backdrop]') as HTMLElement | null;
  if (modal && backdrop) {
    modal.innerHTML = _ui.renderConfirmModal(
      'Excluir Seção',
      `Deseja realmente excluir a seção "${sectionKey}"?${itemsInSection > 0 ? ` Os ${itemsInSection} itens serão movidos para "operacional".` : ''}`,
      'Excluir',
      'confirm-delete-section'
    );
    modal.hidden = false;
    backdrop.hidden = false;
  }
}

export async function executeDeleteSection(callbacks: Record<string, unknown>) {
  const { showToast, showLoading, closeAllModals, loadData } = callbacks as { showToast: (msg: string, type: string) => void; showLoading: (v: boolean) => void; closeAllModals: () => void; loadData: () => Promise<void> };
  if (!_pendingDelete || _pendingDelete.type !== 'section') return;

  state.markSaving();
  showLoading(true);

  try {
    const result = await (_navAdapter).deleteSection(_pendingDelete.key, 'operacional');
    if (result.success) {
      _tracker.trackSectionDeleted(_pendingDelete.key);
      showToast('Seção excluída com sucesso', 'success');
      closeAllModals();
      await loadData();
    } else {
      showToast(result.error || 'Erro ao excluir seção', 'error');
      state.markReady();
    }
  } catch (error: any) {
    metrics.errorCount++;
    showToast(error.message, 'error');
  }

  _pendingDelete = null;
  showLoading(false);
}

export async function runScaffold(item: Record<string, unknown>, showToast: (msg: string, type: string) => void) {
  _tracker.trackScaffoldStarted({ id: item.id });
  try {
    const result = await (_navAdapter).scaffoldPage({
      id: item.id,
      label: item.label,
      href: item.href,
      section: item.section
    });
    if (result.success) {
      _tracker.trackScaffoldCompleted({ id: item.id });
      showToast('Estrutura da página criada com sucesso', 'success');
    } else {
      _tracker.trackScaffoldError(result.error);
      showToast(`Erro ao criar estrutura da página: ${result.error || 'Erro desconhecido'}`, 'error');
    }
  } catch (error: any) {
    _tracker.trackScaffoldError(error);
    showToast('Erro ao criar estrutura da página', 'error');
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { crudReady: true } }; }
