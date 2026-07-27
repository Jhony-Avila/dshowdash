// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-ui-actions
// PURPOSE: Panel Nav Admin - UI Actions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   state from ../state/store.js
//   tracker from ../telemetry/tracker.js
//   ui from ../ui/renderer.js
//
// PROVIDES:
//   switchTab() — exported function
//   renderItemsList() — exported function
//   closeAllModals() — exported function
//   showLoading() — exported function
//   showToast() — exported function
//   setupDragAndDrop() — exported function
//   saveNewOrder() — exported function
//   reattachEventListeners() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'dragend'
//   'dragover'
//   'dragstart'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { state } from '../state/store.js';
import { tracker } from '../telemetry/tracker.js';
import { ui } from '../ui/renderer.js';
import * as navAdapter from '../core/nav-adapter.js';
import * as crud from './crud.js';

const MODULE_ID = 'panel-nav-admin-handlers-ui-actions';
const VERSION = '9.3.0-P2-ENTERPRISE';

export function switchTab(container: HTMLElement, tabName: string) {
  if (!container) return;
  container.querySelectorAll('.pna-tab').forEach((t: Element) => {
    t.classList.toggle('pna-tab-active', (t as HTMLElement).dataset.tab === tabName);
  });
  container.querySelectorAll('.pna-tab-content').forEach((c: Element) => {
    c.classList.toggle('pna-tab-content-active', (c as HTMLElement).dataset.tabContent === tabName);
  });
}

export function renderItemsList(container: HTMLElement) {
  const itemsContainer = container ? container.querySelector('[data-tab-content="items"]') : null;
  if (!itemsContainer) return;
  const currentState = state.getState() as Record<string, unknown>;
  const filteredItems = state.getFilteredItems() as Record<string, unknown>[];
  const sectionsVM = Object.entries((currentState.sections as Record<string, unknown>) || {}).map(entry => {
    const key = entry[0];
    const sec = entry[1];
    return Object.assign({ key }, sec);
  });
  // v9.8.0-HEADER-FIX: Nunca fazer innerHTML no tabContent — atualizar apenas a <ul>
  var itemsMapped = filteredItems.map((item: Record<string, unknown>, idx: number) => Object.assign({}, item, {
    order: idx,
    minLevelLabel: '',
    minLevelDescription: '',
    displayHref: item.isDivider ? '(divisor)' : (item.href || '-'),
    isAdmin: item.section === 'admin'
  }));
  var existingUl = (itemsContainer as HTMLElement).querySelector('ul.pna-list[data-sortable]');
  if (existingUl) {
    // Apenas atualizar as linhas — header permanece intacto
    var rowsHtml = (ui as unknown as Record<string, (...args: unknown[]) => string>).renderItemsList(
      itemsMapped, sectionsVM, currentState.phase
    );
    // Extrair apenas as linhas do HTML gerado (sem o header)
    var tmp = document.createElement('div');
    tmp.innerHTML = rowsHtml;
    var newUl = tmp.querySelector('ul.pna-list');
    if (newUl) {
      existingUl.innerHTML = newUl.innerHTML;
    }
  } else {
    // Primeira renderização — inserir tudo
    (itemsContainer as HTMLElement).innerHTML = (ui as unknown as Record<string, (...args: unknown[]) => string>).renderItemsList(
      itemsMapped, sectionsVM, currentState.phase
    );
  }
  setupDragAndDrop(container);
}

export function closeAllModals(container: HTMLElement) {
  if (!container) return;
  container.querySelectorAll('.pna-modal').forEach((m: Element) => { (m as HTMLElement).hidden = true; });
  const backdrop = container.querySelector('[data-modal-backdrop]');
  if (backdrop) backdrop.setAttribute('hidden', '');
  crud.clearEditingItem();
  crud.clearEditingSection();
}

export function showLoading(container: HTMLElement, show: boolean) {
  const overlay = container ? container.querySelector('[data-loading]') : null;
  if (overlay) (overlay as HTMLElement).hidden = !show;
}

export function showToast(container: HTMLElement, message: string, type: string) {
  if (type === undefined) type = 'success';
  const toastContainer = container ? container.querySelector('[data-toast-container]') : null;
  if (!toastContainer) return;
  const toast = document.createElement('div');
  toast.innerHTML = ui.renderToast(message, type);
  // @ts-expect-error strict migration — TS2345
  toastContainer.appendChild(toast.firstElementChild);
  setTimeout(() => { if (toast.firstElementChild) toast.firstElementChild.remove(); }, 4000);
}

export function setupDragAndDrop(container: HTMLElement) {
  const list = container ? container.querySelector('[data-sortable="items"]') : null;
  if (!list) return;
  let draggedItem: Element | null = null;
  list.querySelectorAll('.pna-list-item').forEach((item: Element) => {
    item.addEventListener('dragstart', (e: Event) => {
      draggedItem = item;
      item.classList.add('pna-dragging');
      (e as DragEvent).dataTransfer!.effectAllowed = 'move';
    });
    item.addEventListener('dragend', () => {
      if (draggedItem) draggedItem.classList.remove('pna-dragging');
      draggedItem = null;
      saveNewOrder(container);
    });
    item.addEventListener('dragover', (e: Event) => {
      e.preventDefault();
      if (!draggedItem || draggedItem === item) return;
      const rect = item.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if ((e as DragEvent).clientY < midY) {
        item.parentNode!.insertBefore(draggedItem, item);
      } else {
        item.parentNode!.insertBefore(draggedItem, item.nextSibling);
      }
    });
  });
}

export function saveNewOrder(container: HTMLElement) {
  const list = container ? container.querySelector('[data-sortable="items"]') : null;
  if (!list) return Promise.resolve();

  const orderedIds = Array.from(list.querySelectorAll('.pna-list-item')).map(item => (item as HTMLElement).dataset.itemId);

  return navAdapter.reorderItems(orderedIds as unknown as Record<string, unknown>[]).then((result: Record<string, unknown>) => {
    if (result.success) {
      tracker.trackItemReordered({ orderedIds });
      showToast(container, 'Ordem atualizada', 'success');
    }
  }).catch(error => {
    showToast(container, 'Erro ao reordenar', 'error');
  });
}

export function reattachEventListeners(container: HTMLElement) {
  if (!container) return;
  container.querySelectorAll('.pna-tab').forEach((tab: Element) => {
    tab.addEventListener('click', () => { switchTab(container, (tab as HTMLElement).dataset.tab || ''); });
  });
  setupDragAndDrop(container);
}

export { MODULE_ID, VERSION };
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { uiActionsReady: true } }; }
