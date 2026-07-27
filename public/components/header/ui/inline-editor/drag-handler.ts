// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/inline-editor/drag-handler
// PURPOSE: Drag-and-drop handler for reordering header components
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   createDragHandler(callbacks) — factory returning drag event handler
// ═══════════════════════════════════════════════════════════════
// Inline Editor - Drag Handler
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B05: var → const/let
// Gerencia drag and drop dos componentes
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/ui/inline-editor/drag-handler';

export function createDragHandler(callbacks: unknown) {
  let _draggedElement: HTMLElement|null = null;
  let _dragStartIndex = -1;
  let _placeholderIndex = -1;
  
  function _onDragStart(e: Event) {
    // @ts-expect-error TS migration - TS2740
    _draggedElement = e.currentTarget;
    // @ts-expect-error TS migration - TS2339
    _dragStartIndex = Array.from(callbacks.getHeaderRight().children).indexOf(_draggedElement);
    _draggedElement!.classList.add('hie-dragging');
    // @ts-expect-error TS migration - TS2339
    e.dataTransfer.effectAllowed = 'move';
    // @ts-expect-error TS migration - TS2339
    e.dataTransfer.setData('text/plain', _draggedElement.dataset.componentKey || '');
    // @ts-expect-error TS migration - TS2339
    callbacks.pushToUndoStack();
  }
  
  function _onDragOver(e: Event) {
    e.preventDefault();
    // @ts-expect-error TS migration - TS2339
    e.dataTransfer.dropEffect = 'move';
    
    // @ts-expect-error TS migration - TS2339
    const headerRight = callbacks.getHeaderRight();
    // @ts-expect-error TS migration - TS2339
    const dropIndicator = callbacks.getDropIndicator();
    if (!headerRight || !dropIndicator) return;
    
    // @ts-expect-error TS migration - TS2339
    const wrappers = callbacks.getEditableItems().map((item: Record<string,unknown>) => item.element);
    // @ts-expect-error TS migration - TS2339
    const mouseX = e.clientX;
    
    let insertIndex = wrappers.length;
    for (let i = 0; i < wrappers.length; i++) {
      const rect = wrappers[i].getBoundingClientRect();
      const midX = rect.left + rect.width / 2;
      if (mouseX < midX) {
        insertIndex = i;
        break;
      }
    }
    
    _placeholderIndex = insertIndex;
    
    if (wrappers.length > 0) {
      const targetWrapper = wrappers[insertIndex] || wrappers[wrappers.length - 1];
      const targetRect = targetWrapper.getBoundingClientRect();
      const headerRect = headerRight.getBoundingClientRect();
      
      dropIndicator.style.height = `${targetRect.height}px`;
      dropIndicator.style.top = `${targetRect.top}px`;
      
      if (insertIndex < wrappers.length) {
        dropIndicator.style.left = `${targetRect.left - 2}px`;
      } else {
        dropIndicator.style.left = `${targetRect.right + 2}px`;
      }
      
      dropIndicator.classList.add('hie-visible');
    }
  }
  
  function _onDragLeave(e: Event) {
    // @ts-expect-error TS migration - TS2339
    const dropIndicator = callbacks.getDropIndicator();
    // @ts-expect-error TS migration - TS2339
    if (dropIndicator && !e.currentTarget.contains(e.relatedTarget)) {
      dropIndicator.classList.remove('hie-visible');
    }
  }
  
  function _onDrop(e: Event) {
    e.preventDefault();
    
    // @ts-expect-error TS migration - TS2339
    const dropIndicator = callbacks.getDropIndicator();
    if (dropIndicator) dropIndicator.classList.remove('hie-visible');
    
    if (!_draggedElement) return;
    
    // @ts-expect-error TS migration - TS2339
    const headerRight = callbacks.getHeaderRight();
    // @ts-expect-error TS migration - TS2339
    const wrappers = callbacks.getEditableItems().map((item: Record<string,unknown>) => item.element);
    
    if (_placeholderIndex >= 0 && _placeholderIndex !== _dragStartIndex) {
      if (_placeholderIndex >= wrappers.length) {
        headerRight.appendChild(_draggedElement);
      } else {
        const targetElement = wrappers[_placeholderIndex];
        if (targetElement !== _draggedElement) {
          headerRight.insertBefore(_draggedElement, targetElement);
        }
      }
      
      // @ts-expect-error TS migration - TS2339
      callbacks.onDragCountIncrement();
      // @ts-expect-error TS migration - TS2339
      callbacks.markUnsavedChanges();
      // @ts-expect-error TS migration - TS2339
      callbacks.updatePositionBadges();
      // @ts-expect-error TS migration - TS2339
      callbacks.scheduleAutoSave();
      // @ts-expect-error TS migration - TS2339
      callbacks.playDropSound();
      // @ts-expect-error TS migration - TS2339
      callbacks.announceToScreenReader(`Item movido para posição ${_placeholderIndex + 1}`);
    }
  }
  
  function _onDragEnd(e: Event) {
    if (_draggedElement) {
      _draggedElement.classList.remove('hie-dragging');
    }
    _draggedElement = null;
    _dragStartIndex = -1;
    _placeholderIndex = -1;
    
    // @ts-expect-error TS migration - TS2339
    const dropIndicator = callbacks.getDropIndicator();
    if (dropIndicator) dropIndicator.classList.remove('hie-visible');
  }
  
  return {
    setupWrapper(wrapper: HTMLElement) {
      wrapper.setAttribute('draggable', 'true');
      
      const handlers = {
        dragstart: _onDragStart,
        dragover: _onDragOver,
        dragleave: _onDragLeave,
        drop: _onDrop,
        dragend: _onDragEnd
      };
      
      Object.keys(handlers).forEach(event => {
        // @ts-expect-error TS migration - TS2769
        wrapper.addEventListener(event, (handlers as Record<string,unknown>)[event]);
      });
      
      return handlers;
    },
    
    cleanupWrapper(wrapper: HTMLElement, handlers: unknown) {
      wrapper.removeAttribute('draggable');
      if (handlers) {
        Object.keys(handlers).forEach(event => {
          // @ts-expect-error TS migration - TS2769
          wrapper.removeEventListener(event, (handlers as Record<string,unknown>)[event]);
        });
      }
    }
  };
}

export default { VERSION, createDragHandler };
