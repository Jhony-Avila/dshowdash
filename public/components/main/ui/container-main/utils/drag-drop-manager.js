import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:drag-drop-manager";
const DROP_EFFECTS = Object.freeze({ NONE: "none", COPY: "copy", MOVE: "move", LINK: "link" });
function createDragDropManager(options = {}) {
  const { onDragStart = null, onDragEnd = null, onDrop = null, onDropZoneEnter = null, onDropZoneLeave = null, draggingClass = "cm-dragging", dropZoneActiveClass = "cm-drop-active", dropZoneHoverClass = "cm-drop-hover" } = options;
  const _logger = createLogger(MODULE_ID);
  const _draggables = /* @__PURE__ */ new Map();
  const _dropZones = /* @__PURE__ */ new Map();
  let _currentDrag = null;
  let _metrics = { drags: 0, drops: 0, cancelled: 0 };
  const STYLES = `
    .cm-dragging { opacity: 0.5; cursor: grabbing !important; }
    .cm-drop-active { outline: 2px dashed #3b82f6; outline-offset: 2px; }
    .cm-drop-hover { background-color: rgba(59, 130, 246, 0.1) !important; outline-color: #2563eb; }
    .cm-drag-preview { position: fixed; pointer-events: none; z-index: 10000; opacity: 0.8; transform: rotate(2deg); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }
    [draggable="true"] { cursor: grab; user-select: none; }
  `;
  function _injectStyles() {
    if (document.getElementById("cm-drag-drop-styles")) return;
    const style = document.createElement("style");
    style.id = "cm-drag-drop-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  const manager = {
    // Registra elemento arrastável
    makeDraggable(element, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      _injectStyles();
      const id = options2.id || `drag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      element.draggable = true;
      element.dataset.dragId = id;
      const handlers = {
        dragstart: (e) => {
          _currentDrag = { id, element, data: options2.data, type: options2.type || "default" };
          e.dataTransfer.effectAllowed = options2.effectAllowed || "move";
          e.dataTransfer.setData("text/plain", JSON.stringify({ id, type: options2.type, data: options2.data }));
          if (options2.dragImage) {
            e.dataTransfer.setDragImage(options2.dragImage, options2.dragImageX || 0, options2.dragImageY || 0);
          }
          element.classList.add(draggingClass);
          _dropZones.forEach((zone) => zone.element.classList.add(dropZoneActiveClass));
          _metrics.drags++;
          onDragStart?.(_currentDrag);
          options2.onDragStart?.(_currentDrag);
        },
        dragend: (e) => {
          element.classList.remove(draggingClass);
          _dropZones.forEach((zone) => {
            zone.element.classList.remove(dropZoneActiveClass, dropZoneHoverClass);
          });
          if (_currentDrag && !e.dataTransfer.dropEffect || e.dataTransfer.dropEffect === "none") {
            _metrics.cancelled++;
          }
          onDragEnd?.(_currentDrag);
          options2.onDragEnd?.(_currentDrag);
          _currentDrag = null;
        }
      };
      element.addEventListener("dragstart", handlers.dragstart);
      element.addEventListener("dragend", handlers.dragend);
      _draggables.set(id, { element, options: options2, handlers });
      return id;
    },
    // Remove draggable
    removeDraggable(id) {
      const config = _draggables.get(id);
      if (!config) return;
      config.element.draggable = false;
      config.element.removeEventListener("dragstart", config.handlers.dragstart);
      config.element.removeEventListener("dragend", config.handlers.dragend);
      delete config.element.dataset.dragId;
      _draggables.delete(id);
    },
    // Registra zona de drop
    createDropZone(element, options2 = {}) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return null;
      _injectStyles();
      const id = options2.id || `drop-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const handlers = {
        dragover: (e) => {
          if (options2.accept && _currentDrag?.type && !options2.accept.includes(_currentDrag.type)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = options2.dropEffect || "move";
        },
        dragenter: (e) => {
          if (options2.accept && _currentDrag?.type && !options2.accept.includes(_currentDrag.type)) return;
          e.preventDefault();
          element.classList.add(dropZoneHoverClass);
          onDropZoneEnter?.(id, _currentDrag);
          options2.onEnter?.(id, _currentDrag);
        },
        dragleave: (e) => {
          if (!element.contains(e.relatedTarget)) {
            element.classList.remove(dropZoneHoverClass);
            onDropZoneLeave?.(id, _currentDrag);
            options2.onLeave?.(id, _currentDrag);
          }
        },
        drop: (e) => {
          e.preventDefault();
          element.classList.remove(dropZoneHoverClass, dropZoneActiveClass);
          let dropData = _currentDrag;
          if (!dropData) {
            try {
              const text = e.dataTransfer.getData("text/plain");
              dropData = JSON.parse(text);
            } catch {
              dropData = { data: e.dataTransfer.getData("text/plain") };
            }
          }
          if (e.dataTransfer.files?.length > 0) {
            dropData = { ...dropData, files: Array.from(e.dataTransfer.files) };
          }
          _metrics.drops++;
          onDrop?.(id, dropData, e);
          options2.onDrop?.(dropData, e);
        }
      };
      element.addEventListener("dragover", handlers.dragover);
      element.addEventListener("dragenter", handlers.dragenter);
      element.addEventListener("dragleave", handlers.dragleave);
      element.addEventListener("drop", handlers.drop);
      _dropZones.set(id, { element, options: options2, handlers });
      return id;
    },
    // Remove drop zone
    removeDropZone(id) {
      const config = _dropZones.get(id);
      if (!config) return;
      config.element.removeEventListener("dragover", config.handlers.dragover);
      config.element.removeEventListener("dragenter", config.handlers.dragenter);
      config.element.removeEventListener("dragleave", config.handlers.dragleave);
      config.element.removeEventListener("drop", config.handlers.drop);
      _dropZones.delete(id);
    },
    // File drop zone (especializado)
    createFileDropZone(element, options2 = {}) {
      return this.createDropZone(element, {
        ...options2,
        onDrop: (data, e) => {
          const files = data.files || [];
          if (options2.accept) {
            const accepted = files.filter((f) => options2.accept.some((type) => f.type.match(type) || f.name.endsWith(type)));
            if (accepted.length !== files.length && options2.onReject) {
              options2.onReject(files.filter((f) => !accepted.includes(f)));
            }
            options2.onFiles?.(accepted);
          } else {
            options2.onFiles?.(files);
          }
        }
      });
    },
    // Sortable list
    makeSortable(container, options2 = {}) {
      if (typeof container === "string") container = document.querySelector(container);
      if (!container) return null;
      const items = container.querySelectorAll(options2.itemSelector || ":scope > *");
      const ids = [];
      items.forEach((item, index) => {
        const id = this.makeDraggable(item, {
          type: "sortable",
          data: { index, container: container.id },
          ...options2.draggableOptions
        });
        ids.push(id);
      });
      this.createDropZone(container, {
        accept: ["sortable"],
        onDrop: (zoneId, data, e) => {
          const dragged = document.querySelector(`[data-drag-id="${data.id}"]`);
          const target = e.target.closest(options2.itemSelector || ":scope > *");
          if (dragged && target && dragged !== target) {
            const rect = target.getBoundingClientRect();
            const midY = rect.top + rect.height / 2;
            if (e.clientY < midY) {
              container.insertBefore(dragged, target);
            } else {
              container.insertBefore(dragged, target.nextSibling);
            }
            options2.onSort?.(Array.from(container.querySelectorAll(options2.itemSelector || ":scope > *")));
          }
        }
      });
      return ids;
    },
    getCurrentDrag() {
      return _currentDrag;
    },
    getMetrics() {
      return { ..._metrics };
    },
    resetMetrics() {
      _metrics = { drags: 0, drops: 0, cancelled: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, draggables: _draggables.size, dropZones: _dropZones.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, draggables: _draggables.size, dropZones: _dropZones.size };
    },
    destroy() {
      _draggables.forEach((_, id) => this.removeDraggable(id));
      _dropZones.forEach((_, id) => this.removeDropZone(id));
      const styles = document.getElementById("cm-drag-drop-styles");
      if (styles) styles.remove();
    }
  };
  return manager;
}
let _instance = null;
function getDragDropManager(options = {}) {
  if (!_instance) _instance = createDragDropManager(options);
  return _instance;
}
function resetDragDropManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, effects: Object.keys(DROP_EFFECTS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var drag_drop_manager_default = { VERSION, MODULE_ID, DROP_EFFECTS, createDragDropManager, getDragDropManager, resetDragDropManager, info, healthCheck };
export {
  DROP_EFFECTS,
  MODULE_ID,
  VERSION,
  createDragDropManager,
  drag_drop_manager_default as default,
  getDragDropManager,
  healthCheck,
  info,
  resetDragDropManager
};
