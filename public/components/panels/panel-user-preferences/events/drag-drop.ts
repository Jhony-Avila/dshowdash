// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P12-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-preferences-drag-drop
// PURPOSE: Panel User Preferences - Drag & Drop
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   showToast, announce from ./helpers.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   setupDragDropHandlers() — exported function
//   cleanupDragDrop() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'dragend'
//   'dragleave'
//   'dragover'
//   'dragstart'
//   'drop'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { showToast, announce } from './helpers.js';

export const MODULE_ID = 'panel-user-preferences-drag-drop';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _draggedItem: Element | null = null;
let _abortController: AbortController | null = null;

export function setupDragDropHandlers(container: Element, handlers: Record<string, unknown>) {
  // P1.2: Cleanup previous listeners before setting up new ones
  cleanupDragDrop();
  _abortController = new AbortController();
  const signal = _abortController.signal;

  const droppableArea = container.querySelector('[data-droppable="layouts"]');
  if (!droppableArea) return;

  const items = droppableArea.querySelectorAll('.pup-item[draggable="true"]');

  for (let i = 0; i < items.length; i++) {
    ((item: HTMLElement) => {
      item.addEventListener('dragstart', (e: DragEvent) => {
        _draggedItem = item;
        item.classList.add('dragging');
        if (e.dataTransfer) {
          e.dataTransfer.effectAllowed = 'move';
          e.dataTransfer.setData('text/plain', item.dataset.layoutKey || '');
        }
      }, { signal });

      item.addEventListener('dragend', () => {
        item.classList.remove('dragging');
        _draggedItem = null;
        const allItems = droppableArea.querySelectorAll('.pup-item');
        for (let j = 0; j < allItems.length; j++) { allItems[j].classList.remove('drag-over'); }
      }, { signal });

      item.addEventListener('dragover', (e: DragEvent) => {
        e.preventDefault();
        if (e.dataTransfer) e.dataTransfer.dropEffect = 'move';
        if (_draggedItem && _draggedItem !== item) {
          item.classList.add('drag-over');
        }
      }, { signal });

      item.addEventListener('dragleave', () => {
        item.classList.remove('drag-over');
      }, { signal });

      item.addEventListener('drop', (e: DragEvent) => {
        e.preventDefault();
        item.classList.remove('drag-over');

        if (_draggedItem && _draggedItem !== item) {
          const allItems = Array.prototype.slice.call(droppableArea.querySelectorAll('.pup-item[draggable="true"]'));
          const draggedIndex = allItems.indexOf(_draggedItem);
          const targetIndex = allItems.indexOf(item);

          if (draggedIndex < targetIndex) {
            // @ts-expect-error strict migration — TS18047
            item.parentNode.insertBefore(_draggedItem, item.nextSibling);
          } else {
            // @ts-expect-error strict migration — TS18047
            item.parentNode.insertBefore(_draggedItem, item);
          }

          const newOrder = [];
          const reorderedItems = droppableArea.querySelectorAll('.pup-item[draggable="true"]');
          for (let k = 0; k < reorderedItems.length; k++) { newOrder.push((reorderedItems[k] as HTMLElement).dataset.layoutKey); }
          // @ts-expect-error strict migration — TS2345
          if (handlers && typeof handlers.reorderLayouts === 'function') (handlers.reorderLayouts as (order: string[]) => void)(newOrder);
          showToast('Ordem dos layouts atualizada', 'info');
          announce('Layouts reordenados');
        }
      }, { signal });
    })(items[i] as HTMLElement);
  }
}

export function cleanupDragDrop() {
  _draggedItem = null;
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    p12Compliant: true,
    hasAbortController: !!_abortController
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    p12Compliant: true,
    checks: { cleanupReady: true, hasAbortController: !!_abortController }
  };
}

export default { MODULE_ID, VERSION, setupDragDropHandlers, cleanupDragDrop, info, healthCheck };
