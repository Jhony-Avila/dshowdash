// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-renderer:event-binders
// PURPOSE: UARPS Admin - Event Binders
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getPort from ../core/ports.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   UARPS_EVENTS — exported value
//   bindControlEvents() — exported function
//   bindUserGridEvents() — exported function
//   bindMatrixEvents() — exported function
//   bindUserFocusEvents() — exported function
//   bindViewToggleEvents() — exported function
//   bindBulkActionEvents() — exported function
//   bindModalEvents() — exported function
//   bindGlobalEvents() — exported function
//   unbindAll() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'change'
//   'click'
//   'input'
//   'keydown'
//   UARPS_EVENTS.MODAL_HIDE
//   UARPS_EVENTS.MODAL_SHOW
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup + unbindAll() (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPort } from '../core/ports.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-renderer:event-binders';

export const UARPS_EVENTS = Object.freeze({ MODAL_SHOW: 'uarps:modal:show', MODAL_HIDE: 'uarps:modal:hide' });

let _abortController: AbortController | null = null;
let _listenerCount = 0;
let _eventBusCleanups: Array<() => void> = [];

function _ensureAbortController() {
  if (!_abortController) {
    _abortController = new AbortController();
  }
  return _abortController.signal;
}

interface ControllerLike { [key: string]: unknown; setFilter?(f: Record<string, string>): void; setUserFilter?(f: Record<string, string>): void; undo?(): void; redo?(): void; syncInventoryFromDOM?(): void; refresh?(): void; selectUser?(id: unknown): void; toggleBulkItem?(id: string): void; selectAllInArea?(area: string): void; toggleTrigger?(id: string): void; toggleRegion?(id: string): void; grantAllTriggers?(): void; revokeAllTriggers?(): void; bulkGrant?(): void; bulkRevoke?(): void; clearBulk?(): void; setView?(v: string): void; cancelModal?(): void; confirmModal?(r: string): void; }
interface StoreLike { [key: string]: unknown; isBulkMode?(): boolean; }

export function bindControlEvents(elements: Record<string, HTMLElement | null>, controller: ControllerLike, store: StoreLike, updateBulkUI: () => void) {
  const signal = _ensureAbortController();
  if (elements.search) { elements.search.addEventListener('input', e => { if (controller.setFilter) controller.setFilter({ search: (e.target as HTMLInputElement).value }); }, { signal }); _listenerCount++; }
  if (elements.filterType) { elements.filterType.addEventListener('change', e => { if (controller.setFilter) controller.setFilter({ type: (e.target as HTMLSelectElement).value }); }, { signal }); _listenerCount++; }
  if (elements.filterStatus) { elements.filterStatus.addEventListener('change', e => { if (controller.setUserFilter) controller.setUserFilter({ status: (e.target as HTMLSelectElement).value }); }, { signal }); _listenerCount++; }
  if (elements.sortUsers) { elements.sortUsers.addEventListener('change', e => { if (controller.setUserFilter) controller.setUserFilter({ sort: (e.target as HTMLSelectElement).value }); }, { signal }); _listenerCount++; }
  if (elements.undoBtn) { elements.undoBtn.addEventListener('click', () => { if (controller.undo) controller.undo(); }, { signal }); _listenerCount++; }
  if (elements.redoBtn) { elements.redoBtn.addEventListener('click', () => { if (controller.redo) controller.redo(); }, { signal }); _listenerCount++; }
  if (elements.syncBtn) { elements.syncBtn.addEventListener('click', () => { if (controller.syncInventoryFromDOM) controller.syncInventoryFromDOM(); }, { signal }); _listenerCount++; }
  if (elements.refreshBtn) { elements.refreshBtn.addEventListener('click', () => { if (controller.refresh) controller.refresh(); }, { signal }); _listenerCount++; }
}

export function bindUserGridEvents(userGrid: HTMLElement | null, controller: ControllerLike) {
  if (!userGrid) return;
  const signal = _ensureAbortController();
  userGrid.addEventListener('click', e => { const userCard = (e.target as Element).closest('[data-user-id]'); if (userCard && controller.selectUser) controller.selectUser((userCard as HTMLElement).dataset.userId); }, { signal });
  _listenerCount++;
  userGrid.addEventListener('keydown', e => { const ke = e as KeyboardEvent; if (ke.key === 'Enter' || ke.key === ' ') { const userCard = (ke.target as Element).closest('[data-user-id]'); if (userCard) { ke.preventDefault(); if (controller.selectUser) controller.selectUser((userCard as HTMLElement).dataset.userId); } } }, { signal });
  _listenerCount++;
}

export function bindMatrixEvents(matrix: HTMLElement | null, controller: ControllerLike, store: StoreLike, updateBulkUI: () => void) {
  if (!matrix) return;
  const signal = _ensureAbortController();
  matrix.addEventListener('click', e => {
    const checkbox = (e.target as Element).closest('.uarps-checkbox') as HTMLElement | null;
    if (checkbox && checkbox.dataset.triggerId) { if (controller.toggleBulkItem) controller.toggleBulkItem(checkbox.dataset.triggerId); updateBulkUI(); return; }
    if (checkbox && checkbox.dataset.area) { if (controller.selectAllInArea) controller.selectAllInArea(checkbox.dataset.area); updateBulkUI(); return; }
    const dot = (e.target as Element).closest('.uarps-minimap__dot') as HTMLElement | null;
    if (dot && dot.dataset.triggerId) { if (controller.toggleTrigger) controller.toggleTrigger(dot.dataset.triggerId); return; }
    const cell = (e.target as Element).closest('[data-trigger-id]') as HTMLElement | null;
    if (cell && !checkbox) { if (store.isBulkMode && store.isBulkMode()) { if (controller.toggleBulkItem) controller.toggleBulkItem(cell.dataset.triggerId || ''); updateBulkUI(); } else { if (controller.toggleTrigger) controller.toggleTrigger(cell.dataset.triggerId || ''); } return; }
    const regionCell = (e.target as Element).closest('[data-region-id]') as HTMLElement | null;
    if (regionCell && controller.toggleRegion) controller.toggleRegion(regionCell.dataset.regionId || '');
  }, { signal });
  _listenerCount++;
  matrix.addEventListener('keydown', e => { const ke = e as KeyboardEvent; if (ke.key === 'Enter' || ke.key === ' ') { const cell = (ke.target as Element).closest('[data-trigger-id]') as HTMLElement | null; if (cell) { ke.preventDefault(); if (controller.toggleTrigger) controller.toggleTrigger(cell.dataset.triggerId || ''); } } }, { signal });
  _listenerCount++;
}

export function bindUserFocusEvents(userFocus: HTMLElement | null, controller: ControllerLike) {
  if (!userFocus) return;
  const signal = _ensureAbortController();
  userFocus.addEventListener('click', e => { const actionEl = (e.target as Element).closest('[data-action]') as HTMLElement | null; const action = actionEl ? actionEl.dataset.action : null; if (action === 'grant-all-triggers') { if (controller.grantAllTriggers) controller.grantAllTriggers(); } else if (action === 'revoke-all-triggers') { if (controller.revokeAllTriggers) controller.revokeAllTriggers(); } }, { signal });
  _listenerCount++;
}

export function bindViewToggleEvents(container: HTMLElement, controller: ControllerLike, updateViewToggle: (view: string) => void, renderMatrix: () => void) {
  const viewBtns = container.querySelectorAll('[data-view]');
  const signal = _ensureAbortController();
  for (let i = 0; i < viewBtns.length; i++) {
    (btn => {
      btn.addEventListener('click', () => { const view = (btn as HTMLElement).dataset.view || ''; if (controller.setView) controller.setView(view); updateViewToggle(view); renderMatrix(); }, { signal });
      _listenerCount++;
    })(viewBtns[i]);
  }
}

export function bindBulkActionEvents(container: HTMLElement, controller: ControllerLike, updateBulkUI: () => void) {
  const signal = _ensureAbortController();
  const bulkGrantBtn = container.querySelector('[data-action="bulk-grant"]');
  if (bulkGrantBtn) { bulkGrantBtn.addEventListener('click', () => { if (controller.bulkGrant) controller.bulkGrant(); }, { signal }); _listenerCount++; }
  const bulkRevokeBtn = container.querySelector('[data-action="bulk-revoke"]');
  if (bulkRevokeBtn) { bulkRevokeBtn.addEventListener('click', () => { if (controller.bulkRevoke) controller.bulkRevoke(); }, { signal }); _listenerCount++; }
  const bulkClearBtn = container.querySelector('[data-action="bulk-clear"]');
  if (bulkClearBtn) { bulkClearBtn.addEventListener('click', () => { if (controller.clearBulk) controller.clearBulk(); updateBulkUI(); }, { signal }); _listenerCount++; }
}

export function bindModalEvents(container: HTMLElement, elements: Record<string, HTMLElement | null>, controller: ControllerLike) {
  const signal = _ensureAbortController();
  const closeModalBtns = container.querySelectorAll('[data-action="modal-close"], [data-action="modal-cancel"]');
  for (let j = 0; j < closeModalBtns.length; j++) {
    closeModalBtns[j].addEventListener('click', () => { if (controller.cancelModal) controller.cancelModal(); }, { signal });
    _listenerCount++;
  }
  const confirmBtn = container.querySelector('[data-action="modal-confirm"]');
  if (confirmBtn) {
    confirmBtn.addEventListener('click', () => { const reason = elements.modalReason ? (elements.modalReason as HTMLInputElement).value : ''; if (controller.confirmModal) controller.confirmModal(reason); }, { signal });
    _listenerCount++;
  }
  if (elements.modalReason) {
    elements.modalReason.addEventListener('input', e => { const hasReason = (e.target as HTMLInputElement).value.trim().length > 0; if (elements.modalConfirm) (elements.modalConfirm as HTMLButtonElement).disabled = !hasReason; }, { signal });
    _listenerCount++;
  }
}

export function bindGlobalEvents(showModal: (opts: Record<string, unknown>) => void, hideModal: () => void) {
  const eventBus = getPort('eventBus');
  if (!eventBus || !eventBus.on) return [];
  eventBus.on(UARPS_EVENTS.MODAL_SHOW, showModal);
  eventBus.on(UARPS_EVENTS.MODAL_HIDE, hideModal);
  const cleanupShow = () => { const eb = getPort('eventBus'); if (eb && eb.off) eb.off(UARPS_EVENTS.MODAL_SHOW, showModal); };
  const cleanupHide = () => { const eb = getPort('eventBus'); if (eb && eb.off) eb.off(UARPS_EVENTS.MODAL_HIDE, hideModal); };
  _eventBusCleanups.push(cleanupShow, cleanupHide);
  return [cleanupShow, cleanupHide];
}

export function unbindAll() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
  _eventBusCleanups.forEach(fn => { try { fn(); } catch (e) { /* cleanup best-effort */ } });
  _eventBusCleanups = [];
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, eventBusCleanups: _eventBusCleanups.length, hasAbortController: _abortController !== null }; }

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      bindersReady: typeof bindControlEvents === 'function',
      cleanupAvailable: typeof unbindAll === 'function',
      listenersTracked: _abortController !== null || _listenerCount === 0
    }
  };
}

export default { bindControlEvents, bindUserGridEvents, bindMatrixEvents, bindUserFocusEvents, bindViewToggleEvents, bindBulkActionEvents, bindModalEvents, bindGlobalEvents, unbindAll, UARPS_EVENTS, info, healthCheck };
