// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-ui-inline-editor-drag-handler
// PURPOSE: Inline Editor - Drag Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createDragHandler() — exported function
//   getMetrics() — exported function
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

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header-ui-inline-editor-drag-handler';

let _metrics = { dragStarts: 0, drops: 0, setups: 0 };

export function createDragHandler(deps: unknown) {
  // @ts-expect-error TS migration - TS2339
  const { getHeaderRight, getDropIndicator, getEditableItems, pushToUndoStack, markUnsavedChanges, updatePositionBadges, scheduleAutoSave, playDropSound, announceToScreenReader, onDragCountIncrement } = deps;
  let isDragging = false;
  let draggedElement: HTMLElement|null = null;

  function onDragStart(e: Event, wrapper: HTMLElement) {
    if (wrapper.dataset.draggable === 'false') { e.preventDefault(); wrapper.classList.add('hie-shake'); setTimeout(() => wrapper.classList.remove('hie-shake'), 400); announceToScreenReader?.('Este item não pode ser movido'); return; }
    _metrics.dragStarts++; pushToUndoStack?.(); isDragging = true; draggedElement = wrapper; onDragCountIncrement?.();
    // @ts-expect-error TS migration - TS2339
    wrapper.classList.add('hie-dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', wrapper.dataset.componentKey || '');
    // @ts-expect-error TS migration - TS2339
    const ghost = wrapper.cloneNode(true); ghost.style.cssText = 'opacity: 0.7; transform: scale(1.05); position: absolute; top: -9999px; pointer-events: none;'; ghost.classList.remove('hie-dragging'); document.body.appendChild(ghost); e.dataTransfer.setDragImage(ghost, wrapper.offsetWidth / 2, wrapper.offsetHeight / 2); setTimeout(() => ghost.remove(), 0);
    announceToScreenReader?.(`Arrastando ${wrapper.dataset.componentLabel}`);
  }

  // @ts-expect-error TS migration - TS2339
  function onDragEnd(e: Event, wrapper: HTMLElement) { isDragging = false; draggedElement = null; wrapper.classList.remove('hie-dragging'); getEditableItems?.().forEach(({ element }: Record<string,unknown>) => { element.classList.remove('hie-drag-over'); }); const dropIndicator = getDropIndicator?.(); dropIndicator?.classList.remove('hie-visible'); }
  // @ts-expect-error TS migration - TS2339
  function onDragOver(e: Event, wrapper: HTMLElement) { if (!isDragging || wrapper === draggedElement) return; e.preventDefault(); e.dataTransfer.dropEffect = 'move'; const rect = wrapper.getBoundingClientRect(); const midX = rect.left + rect.width / 2; const insertBefore = e.clientX < midX; const dropIndicator = getDropIndicator?.(); if (dropIndicator) { dropIndicator.style.top = `${rect.top + (rect.height - 36) / 2}px`; dropIndicator.style.left = insertBefore ? `${rect.left - 6}px` : `${rect.right + 2}px`; dropIndicator.classList.add('hie-visible'); } }
  function onDragEnter(e: Event, wrapper: HTMLElement) { if (!isDragging || wrapper === draggedElement) return; e.preventDefault(); wrapper.classList.add('hie-drag-over'); }
  // @ts-expect-error TS migration - TS2339
  function onDragLeave(e: Event, wrapper: HTMLElement) { if (!wrapper.contains(e.relatedTarget)) wrapper.classList.remove('hie-drag-over'); }

  function onDrop(e: Event, targetWrapper: HTMLElement|null) {
    e.preventDefault(); if (!draggedElement || targetWrapper === draggedElement) return; _metrics.drops++;
    targetWrapper!.classList.remove('hie-drag-over'); const dropIndicator = getDropIndicator?.(); dropIndicator?.classList.remove('hie-visible');
    const headerRight = getHeaderRight?.(); if (!headerRight) return;
    // @ts-expect-error TS migration - TS2339
    const rect = targetWrapper.getBoundingClientRect(); const insertBefore = e.clientX < rect.left + rect.width / 2;

    // @ts-expect-error TS migration - TS2339
    if (insertBefore) { headerRight.insertBefore(draggedElement, targetWrapper); } else { const nextSibling = targetWrapper.nextElementSibling; if (nextSibling && nextSibling.classList.contains('header-component-wrapper')) { headerRight.insertBefore(draggedElement, nextSibling); } else { const firstNonWrapper = Array.from(headerRight.children).find(el => !el.classList.contains('header-component-wrapper') && el !== draggedElement); if (firstNonWrapper) { headerRight.insertBefore(draggedElement, firstNonWrapper); } else { headerRight.appendChild(draggedElement); } } }
    updatePositionBadges?.(); markUnsavedChanges?.(); playDropSound?.(); announceToScreenReader?.(`${draggedElement.dataset.componentLabel} movido`); scheduleAutoSave?.();
  }

  function setupWrapper(wrapper: HTMLElement) {
    _metrics.setups++; const isDraggable = wrapper.dataset.draggable !== 'false'; if (isDraggable) { wrapper.setAttribute('draggable', 'true'); } else { wrapper.classList.add('hie-locked'); }
    const handlers = { dragstart: (e: Event) => onDragStart(e, wrapper), dragend: (e: Event) => onDragEnd(e, wrapper), dragover: (e: Event) => onDragOver(e, wrapper), dragenter: (e: Event) => onDragEnter(e, wrapper), dragleave: (e: Event) => onDragLeave(e, wrapper), drop: (e: Event) => onDrop(e, wrapper) };
    Object.entries(handlers).forEach(([event, handler]) => { wrapper.addEventListener(event, handler); });
    return handlers;
  }

  // @ts-expect-error strict migration — TS2769
  function cleanupWrapper(wrapper: HTMLElement, handlers: unknown) { wrapper.removeAttribute('draggable'); wrapper.classList.remove('hie-dragging', 'hie-drag-over', 'hie-locked'); Object.entries(handlers).forEach(([event, handler]) => { wrapper.removeEventListener(event, handler); }); }
  function getState() { return { isDragging, draggedElement }; }

  return { setupWrapper, cleanupWrapper, getState };
}

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() }; }
export function healthCheck() { return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, checks: { dragReady: true }, metrics: getMetrics() }; }

export default { createDragHandler, getMetrics, info, healthCheck };
