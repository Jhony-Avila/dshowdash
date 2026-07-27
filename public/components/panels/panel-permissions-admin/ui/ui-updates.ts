// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-renderer:ui-updates
// PURPOSE: UARPS Admin - UI Updates
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Icons from ./icons.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   updateUndoRedoButtons() — exported function
//   updateBulkUI() — exported function
//   updateViewToggle() — exported function
//   updateCacheIndicator() — exported function
//   showModal() — exported function
//   hideModal() — exported function
//   info() — exported function
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

import { Icons } from './icons.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-renderer:ui-updates';

interface UIStore { [key: string]: unknown; canUndo?(): boolean; canRedo?(): boolean; getUndoCount?(): number; getRedoCount?(): number; getBulkCount?(): number; getCacheAge?(): number; }

export function updateUndoRedoButtons(elements: Record<string, HTMLElement | null>, store: UIStore) {
  if (elements.undoBtn) {
    (elements.undoBtn as HTMLButtonElement).disabled = store.canUndo ? !store.canUndo() : true;
    const undoCount = store.getUndoCount ? store.getUndoCount() : 0;
    elements.undoBtn.dataset.tooltip = undoCount > 0 ? `Desfazer (${undoCount})` : 'Nada para desfazer';
  }
  if (elements.redoBtn) {
    (elements.redoBtn as HTMLButtonElement).disabled = store.canRedo ? !store.canRedo() : true;
    const redoCount = store.getRedoCount ? store.getRedoCount() : 0;
    elements.redoBtn.dataset.tooltip = redoCount > 0 ? `Refazer (${redoCount})` : 'Nada para refazer';
  }
}

export function updateBulkUI(elements: Record<string, HTMLElement | null>, store: UIStore) {
  const count = store.getBulkCount ? store.getBulkCount() : 0;
  
  if (elements.bulkActions) {
    elements.bulkActions.style.display = count > 0 ? 'flex' : 'none';
    const countEl = elements.bulkActions.querySelector('.uarps-bulk-count');
    if (countEl) countEl.textContent = `${count} selecionado${count !== 1 ? 's' : ''}`;
  }
}

export function updateViewToggle(container: HTMLElement | null, activeView: string) {
  if (!container) return;
  const btns = container.querySelectorAll('[data-view]');
  for (let i = 0; i < btns.length; i++) {
    const btn = btns[i] as HTMLElement;
    if (btn.dataset.view === activeView) btn.classList.add('uarps-btn--active');
    else btn.classList.remove('uarps-btn--active');
  }
}

export function updateCacheIndicator(elements: Record<string, HTMLElement | null>, store: UIStore) {
  if (!elements.cache) return;
  const age = store.getCacheAge ? store.getCacheAge() : 0;
  if (age) {
    const mins = Math.floor(age / 60000);
    elements.cache.textContent = mins < 1 ? 'Cache: agora' : `Cache: ${mins}m atrás`;
  } else {
    elements.cache.textContent = '';
  }
}

export function showModal(elements: Record<string, HTMLElement | null>, title: string, message: string, requireReason: boolean) {
  if (!elements.modal) return;
  
  if (elements.modalTitle) elements.modalTitle.innerHTML = `${Icons.alertTriangle || ''} ${title}`;
  if (elements.modalBody) elements.modalBody.innerHTML = `<p>${message}</p>`;
  if (elements.modalReason) {
    (elements.modalReason as HTMLInputElement).value = '';
    if (elements.modalReason.parentElement) elements.modalReason.parentElement.style.display = requireReason ? 'block' : 'none';
  }
  if (elements.modalConfirm) (elements.modalConfirm as HTMLButtonElement).disabled = requireReason;
  
  elements.modal.style.display = 'flex';
}

export function hideModal(elements: Record<string, HTMLElement | null>) {
  if (elements.modal) elements.modal.style.display = 'none';
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export default { updateUndoRedoButtons, updateBulkUI, updateViewToggle, updateCacheIndicator, showModal, hideModal };
