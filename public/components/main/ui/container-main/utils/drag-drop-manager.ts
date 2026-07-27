// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-PHASE6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:drag-drop-manager
// PURPOSE: Drag Drop Manager - Gerenciamento de drag and drop
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createLogger from ./logger.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DROP_EFFECTS — exported value
//   createDragDropManager() — exported function
//   getDragDropManager() — exported function
//   resetDragDropManager() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'dragend'
//   'dragenter'
//   'dragleave'
//   'dragover'
//   'dragstart'
//   'drop'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createLogger } from './logger.js';

export const VERSION = '1.0.0-PHASE6';
export const MODULE_ID = 'container-main:drag-drop-manager';

export const DROP_EFFECTS = Object.freeze({ NONE: 'none', COPY: 'copy', MOVE: 'move', LINK: 'link' });

export function createDragDropManager(options: Record<string, any> = {}) {
  const { onDragStart = null, onDragEnd = null, onDrop = null, onDropZoneEnter = null, onDropZoneLeave = null, draggingClass = 'cm-dragging', dropZoneActiveClass = 'cm-drop-active', dropZoneHoverClass = 'cm-drop-hover' } = options;

  const _logger = createLogger(MODULE_ID);
  const _draggables = new Map();
  const _dropZones = new Map();
  let _currentDrag: Record<string, unknown> | null = null;
  let _metrics = { drags: 0, drops: 0, cancelled: 0 };

  // Estilos
  const STYLES = `
    .cm-dragging { opacity: 0.5; cursor: grabbing !important; }
    .cm-drop-active { outline: 2px dashed #3b82f6; outline-offset: 2px; }
    .cm-drop-hover { background-color: rgba(59, 130, 246, 0.1) !important; outline-color: #2563eb; }
    .cm-drag-preview { position: fixed; pointer-events: none; z-index: 10000; opacity: 0.8; transform: rotate(2deg); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    [draggable="true"] { cursor: grab; user-select: none; }
  `;

  function _injectStyles() {
    if (document.getElementById('cm-drag-drop-styles')) return;
    const style = document.createElement('style');
    style.id = 'cm-drag-drop-styles';
    style.textContent = STYLES;
    document.head.appendChild(style);
  }

  const manager = {
    // Registra elemento arrastável
    makeDraggable(element: HTMLElement, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      _injectStyles();
      const id = options.id || `drag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.draggable = true;
      element.dataset.dragId = id;

      const handlers = {
        dragstart: (e: DragEvent) => {
          _currentDrag = { id, element, data: options.data, type: options.type || 'default' };
          // @ts-expect-error strict migration — TS18047
          e.dataTransfer.effectAllowed = options.effectAllowed || 'move';
          // @ts-expect-error strict migration — TS18047
          e.dataTransfer.setData('text/plain', JSON.stringify({ id, type: options.type, data: options.data }));
          if (options.dragImage) {
            // @ts-expect-error strict migration — TS18047
            e.dataTransfer.setDragImage(options.dragImage, options.dragImageX || 0, options.dragImageY || 0);
          }
          element.classList.add(draggingClass);
          _dropZones.forEach((zone) => zone.element.classList.add(dropZoneActiveClass));
          _metrics.drags++;
          onDragStart?.(_currentDrag);
          options.onDragStart?.(_currentDrag);
        },
        dragend: (e: DragEvent) => {
          element.classList.remove(draggingClass);
          _dropZones.forEach((zone) => {
            zone.element.classList.remove(dropZoneActiveClass, dropZoneHoverClass);
          });
          // @ts-expect-error strict migration — TS18047
          if (_currentDrag && !e.dataTransfer.dropEffect || e.dataTransfer.dropEffect === 'none') {
            _metrics.cancelled++;
          }
          onDragEnd?.(_currentDrag);
          options.onDragEnd?.(_currentDrag);
          _currentDrag = null;
        }
      };

      element.addEventListener('dragstart', handlers.dragstart);
      element.addEventListener('dragend', handlers.dragend);

      _draggables.set(id, { element, options, handlers });
      return id;
    },

    // Remove draggable
    removeDraggable(id: string) {
      const config = _draggables.get(id);
      if (!config) return;
      config.element.draggable = false;
      config.element.removeEventListener('dragstart', config.handlers.dragstart);
      config.element.removeEventListener('dragend', config.handlers.dragend);
      delete config.element.dataset.dragId;
      _draggables.delete(id);
    },

    // Registra zona de drop
    createDropZone(element: HTMLElement, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof element === 'string') element = document.querySelector(element);
      if (!element) return null;

      _injectStyles();
      const id = options.id || `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const handlers = {
        dragover: (e: DragEvent) => {
          if (options.accept && _currentDrag?.type && !options.accept.includes(_currentDrag.type)) return;
          e.preventDefault();
          // @ts-expect-error strict migration — TS18047
          e.dataTransfer.dropEffect = options.dropEffect || 'move';
        },
        dragenter: (e: DragEvent) => {
          if (options.accept && _currentDrag?.type && !options.accept.includes(_currentDrag.type)) return;
          e.preventDefault();
          element.classList.add(dropZoneHoverClass);
          onDropZoneEnter?.(id, _currentDrag);
          options.onEnter?.(id, _currentDrag);
        },
        dragleave: (e: DragEvent) => {
          // @ts-expect-error TS migration - TS2345
          if (!element.contains(e.relatedTarget)) {
            element.classList.remove(dropZoneHoverClass);
            onDropZoneLeave?.(id, _currentDrag);
            options.onLeave?.(id, _currentDrag);
          }
        },
        drop: (e: DragEvent) => {
          e.preventDefault();
          element.classList.remove(dropZoneHoverClass, dropZoneActiveClass);
          
          let dropData = _currentDrag;
          if (!dropData) {
            try {
              // @ts-expect-error strict migration — TS18047
              const text = e.dataTransfer.getData('text/plain');
              dropData = JSON.parse(text);
            // @ts-expect-error strict migration — TS18047
            } catch { dropData = { data: e.dataTransfer.getData('text/plain') }; }
          }

          // Arquivos
          // @ts-expect-error strict migration — TS18047
          if (e.dataTransfer.files?.length > 0) {
            // @ts-expect-error strict migration — TS18047
            dropData = { ...(dropData as Record<string, unknown>), files: Array.from(e.dataTransfer.files) };
          }

          _metrics.drops++;
          onDrop?.(id, dropData, e);
          options.onDrop?.(dropData, e);
        }
      };

      element.addEventListener('dragover', handlers.dragover);
      element.addEventListener('dragenter', handlers.dragenter);
      element.addEventListener('dragleave', handlers.dragleave);
      element.addEventListener('drop', handlers.drop);

      _dropZones.set(id, { element, options, handlers });
      return id;
    },

    // Remove drop zone
    removeDropZone(id: string) {
      const config = _dropZones.get(id);
      if (!config) return;
      config.element.removeEventListener('dragover', config.handlers.dragover);
      config.element.removeEventListener('dragenter', config.handlers.dragenter);
      config.element.removeEventListener('dragleave', config.handlers.dragleave);
      config.element.removeEventListener('drop', config.handlers.drop);
      _dropZones.delete(id);
    },

    // File drop zone (especializado)
    createFileDropZone(element: HTMLElement, options: Record<string, any> = {}) {
      return this.createDropZone(element, {
        ...options,
        onDrop: (data: Record<string, unknown>, e: Event) => {
          const files = data.files || [];
          if (options.accept) {
            // @ts-expect-error TS migration - TS2339
            const accepted = (files as unknown[]).filter((f: unknown) => options.accept.some((type: string) => (f as Record<string, unknown>).type.match(type) || f.name.endsWith(type)));
            if (accepted.length !== (files as unknown[]).length && options.onReject) {
              options.onReject((files as unknown[]).filter((f: unknown) => !accepted.includes(f)));
            }
            options.onFiles?.(accepted);
          } else {
            options.onFiles?.(files);
          }
        }
      });
    },

    // Sortable list
    makeSortable(container: HTMLElement, options: Record<string, any> = {}) {
      // @ts-expect-error strict migration — TS2322
      if (typeof container === 'string') container = document.querySelector(container);
      if (!container) return null;

      const items = container.querySelectorAll(options.itemSelector || ':scope > *');
      const ids: unknown[] = [];

      items.forEach((item: Record<string, unknown>, index: number) => {
        // @ts-expect-error strict migration — TS2345
        const id = this.makeDraggable(item, {
          type: 'sortable',
          data: { index, container: container.id },
          ...options.draggableOptions
        });
        ids.push(id);
      });

      this.createDropZone(container, {
        accept: ['sortable'],
        onDrop: (zoneId: unknown, data: Record<string, unknown>, e: Event) => {
          const dragged = document.querySelector(`[data-drag-id="${data.id}"]`);
          const target = (e.target as HTMLElement).closest(options.itemSelector || ':scope > *');
          if (dragged && target && dragged !== target) {
            const rect = target.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            // @ts-expect-error TS migration - TS2339
            if (e.clientY < midY) {
              container.insertBefore(dragged, target);
            } else {
              container.insertBefore(dragged, target.nextSibling);
            }
            options.onSort?.(Array.from(container.querySelectorAll(options.itemSelector || ':scope > *')));
          }
        }
      });

      return ids;
    },

    getCurrentDrag() { return _currentDrag; },
    getMetrics() { return { ..._metrics }; },
    resetMetrics() { _metrics = { drags: 0, drops: 0, cancelled: 0 }; },

    healthCheck() {
      return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, draggables: _draggables.size, dropZones: _dropZones.size, metrics: _metrics };
    },

    info() {
      return { moduleId: MODULE_ID, version: VERSION, draggables: _draggables.size, dropZones: _dropZones.size };
    },

    destroy() {
      _draggables.forEach((_, id) => this.removeDraggable(id));
      _dropZones.forEach((_, id) => this.removeDropZone(id));
      const styles = document.getElementById('cm-drag-drop-styles');
      if (styles) styles.remove();
    }
  };

  return manager;
}

let _instance: Record<string, unknown> | null = null;
export function getDragDropManager(options: Record<string, any> = {}) { if (!_instance) _instance = createDragDropManager(options); return _instance; }
export function resetDragDropManager() { if (_instance) { (_instance.destroy as (...args: unknown[]) => unknown)(); _instance = null; } }

export function info() { return { moduleId: MODULE_ID, version: VERSION, effects: Object.keys(DROP_EFFECTS) }; }
export function healthCheck() { if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)(); return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID }; }

export default { VERSION, MODULE_ID, DROP_EFFECTS, createDragDropManager, getDragDropManager, resetDragDropManager, info, healthCheck };
