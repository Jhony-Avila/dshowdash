// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-DI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-tab-manager-drag-drop
// PURPOSE: Tab Manager - Drag & Drop
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createDragDropHandler() — exported function
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

export const VERSION = '8.1.0-DI-STRICT';
export const MODULE_ID = 'container-tab-manager-drag-drop';

export function createDragDropHandler(state: Record<string, unknown>, callbacks: Record<string, any> = {}) {
  let _draggedTabId: string | null = null;
  let _dragOverTabId: string | null = null;
  const { onReorder, onRender } = callbacks;

  function onDragStart(e: DragEvent, tabId: string) {
    _draggedTabId = tabId;
    e.dataTransfer!.effectAllowed = 'move';
    (e.target as HTMLElement).classList.add('dsd-tab--dragging');
  }

  function onDragOver(e: DragEvent, tabId: string) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    if (_draggedTabId && _draggedTabId !== tabId) {
      _dragOverTabId = tabId;
      const tabEl = (state.tabBarEl as HTMLElement)?.querySelector(`[data-tab-id="${tabId}"]`);
      tabEl?.classList.add('dsd-tab--drag-over');
    }
  }

  function onDragLeave(e: Event) { (e.target as HTMLElement)?.classList.remove('dsd-tab--drag-over'); }

  function onDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    if (_draggedTabId && _draggedTabId !== targetId) {
      const fromIndex = (state as Record<string, (...args: unknown[]) => number>).findTabIndex(_draggedTabId);
      const toIndex = (state as Record<string, (...args: unknown[]) => number>).findTabIndex(targetId);
      if (fromIndex !== -1 && toIndex !== -1) {
        (state as Record<string, (...args: unknown[]) => void>).reorderTabs(fromIndex, toIndex);
        onRender?.();
        onReorder?.((state.tabs as Record<string, unknown>[]).map((t) => (t as Record<string, unknown>).id));
      }
    }
    cleanup();
  }

  function onDragEnd() { cleanup(); }

  function cleanup() {
    _draggedTabId = null;
    _dragOverTabId = null;
    ((state as Record<string, unknown>).tabBarEl as HTMLElement)?.querySelectorAll('.dsd-tab').forEach((el) => {
      (el as HTMLElement).classList.remove('dsd-tab--dragging', 'dsd-tab--drag-over');
    });
  }

  function attachListeners(tabEl: HTMLElement, tabId: string) {
    tabEl.addEventListener('dragstart', (e: DragEvent) => onDragStart(e, tabId));
    tabEl.addEventListener('dragover', (e: DragEvent) => onDragOver(e, tabId));
    tabEl.addEventListener('dragleave', onDragLeave);
    tabEl.addEventListener('drop', (e: DragEvent) => onDrop(e, tabId));
    tabEl.addEventListener('dragend', onDragEnd);
  }

  function detachListeners(tabEl: HTMLElement) {
    const clone = tabEl.cloneNode(true);
    tabEl.parentNode?.replaceChild(clone, tabEl);
    return clone;
  }

  return {
    attachListeners, detachListeners, cleanup,
    get draggedTabId() { return _draggedTabId; },
    get dragOverTabId() { return _dragOverTabId; }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { handlerReady: true } };
}

export default { createDragDropHandler, info, healthCheck, VERSION, MODULE_ID };
