import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { NAVRAIL_EVENTS } from "/core/runtime/events/catalog/navrail.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-navrail-admin.handlers.drag-drop-enhanced";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn(`[${MODULE_ID}]`, ...args);
};
function _emitReorder(detail) {
  try {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(NAVRAIL_EVENTS.REORDER, { ...detail, source: MODULE_ID, timestamp: Date.now() });
  } catch (e) {
  }
}
let _container = null;
let _dragState = { isDragging: false, draggedEl: null, draggedId: null, sourceGroup: null, placeholder: null, initialIndex: -1, currentDropZone: null, preview: null };
let _options = { allowCrossGroup: true, animationDuration: 200, placeholderClass: "pna-card--placeholder", draggingClass: "pna-card--dragging", dropZoneClass: "pna-group--drop-zone", invalidDropClass: "pna-card--invalid-drop" };
function _createDragPreview(el) {
  if (!hasDocument) return null;
  const preview = el.cloneNode(true);
  preview.className = "pna-drag-preview";
  preview.style.cssText = `position: fixed; pointer-events: none; z-index: 10000; width: ${el.offsetWidth}px; opacity: 0.9; transform: rotate(2deg) scale(1.02); box-shadow: 0 12px 24px rgba(0,0,0,0.4); transition: transform 0.1s ease;`;
  document.body.appendChild(preview);
  return preview;
}
function _updatePreviewPosition(preview, e) {
  if (!preview) return;
  preview.style.left = `${e.clientX - preview.offsetWidth / 2}px`;
  preview.style.top = `${e.clientY - 20}px`;
}
function _removeDragPreview() {
  if (!hasDocument) return;
  document.querySelectorAll(".pna-drag-preview").forEach((p) => p.remove());
}
function _createPlaceholder(el) {
  if (!hasDocument) return null;
  const placeholder = document.createElement("div");
  placeholder.className = _options.placeholderClass;
  placeholder.style.cssText = `height: ${el.offsetHeight}px; background: rgba(59, 130, 246, 0.1); border: 2px dashed #3b82f6; border-radius: 8px; margin: 4px 0; transition: height 0.2s ease;`;
  placeholder.setAttribute("data-placeholder", "true");
  return placeholder;
}
function _highlightDropZones(currentGroup) {
  if (!hasDocument) return;
  document.querySelectorAll(".pna-group").forEach((group) => {
    if (_options.allowCrossGroup || group.dataset.group === currentGroup) group.classList.add(_options.dropZoneClass);
  });
}
function _clearDropZones() {
  if (!hasDocument) return;
  document.querySelectorAll(`.${_options.dropZoneClass}`).forEach((el) => {
    el.classList.remove(_options.dropZoneClass);
  });
}
function _onDragStart(e) {
  const card = e.target.closest('.pna-card[data-draggable="true"]');
  if (!card) return;
  e.dataTransfer.effectAllowed = "move";
  e.dataTransfer.setData("text/plain", card.dataset.itemId);
  const emptyImg = new Image();
  emptyImg.src = "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";
  e.dataTransfer.setDragImage(emptyImg, 0, 0);
  _dragState = { isDragging: true, draggedEl: card, draggedId: card.dataset.itemId, sourceGroup: card.dataset.group, placeholder: _createPlaceholder(card), initialIndex: Array.from(card.parentNode.children).indexOf(card), currentDropZone: null, preview: _createDragPreview(card) };
  requestAnimationFrame(() => {
    card.classList.add(_options.draggingClass);
    card.style.opacity = "0.4";
    _highlightDropZones(_dragState.sourceGroup);
  });
}
function _onDrag(e) {
  if (!_dragState.isDragging) return;
  _updatePreviewPosition(_dragState.preview, e);
}
function _onDragOver(e) {
  if (!_dragState.isDragging) return;
  e.preventDefault();
  e.dataTransfer.dropEffect = "move";
  const card = e.target.closest(".pna-card:not(.pna-card--placeholder)");
  const group = e.target.closest(".pna-group");
  if (!group) return;
  if (!_options.allowCrossGroup && group.dataset.group !== _dragState.sourceGroup) {
    e.dataTransfer.dropEffect = "none";
    return;
  }
  const itemsContainer = group.querySelector(".pna-group__items");
  if (!itemsContainer) return;
  if (card && card !== _dragState.draggedEl) {
    const rect = card.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    if (e.clientY < midY) card.parentNode.insertBefore(_dragState.placeholder, card);
    else card.parentNode.insertBefore(_dragState.placeholder, card.nextSibling);
  } else if (!card && itemsContainer) itemsContainer.appendChild(_dragState.placeholder);
}
function _onDragLeave(e) {
  const group = e.target.closest(".pna-group");
  if (group && !group.contains(e.relatedTarget)) {
  }
}
function _onDrop(e) {
  if (!_dragState.isDragging) return;
  e.preventDefault();
  const group = e.target.closest(".pna-group");
  if (!group) {
    _cancelDrag();
    return;
  }
  if (!_options.allowCrossGroup && group.dataset.group !== _dragState.sourceGroup) {
    _cancelDrag();
    return;
  }
  const newGroup = group.dataset.group;
  const itemsContainer = group.querySelector(".pna-group__items");
  if (_dragState.placeholder.parentNode) _dragState.placeholder.parentNode.insertBefore(_dragState.draggedEl, _dragState.placeholder);
  const newOrder = Array.from(itemsContainer.querySelectorAll(".pna-card")).map((card) => ({ id: card.dataset.dbId, itemKey: card.dataset.itemId, group: newGroup }));
  _finishDrag();
  return { itemId: _dragState.draggedId, newGroup, newOrder, crossGroup: newGroup !== _dragState.sourceGroup };
}
function _onDragEnd(_e) {
  if (_dragState.isDragging) _cancelDrag();
}
function _finishDrag() {
  if (_dragState.draggedEl) {
    _dragState.draggedEl.classList.remove(_options.draggingClass);
    _dragState.draggedEl.style.opacity = "";
  }
  _dragState.placeholder?.remove();
  _removeDragPreview();
  _clearDropZones();
  _dragState = { isDragging: false, draggedEl: null, draggedId: null, sourceGroup: null, placeholder: null, initialIndex: -1, currentDropZone: null, preview: null };
}
function _cancelDrag() {
  if (_dragState.draggedEl && _dragState.placeholder && hasDocument) {
    const originalParent = document.querySelector(`.pna-group[data-group="${_dragState.sourceGroup}"] .pna-group__items`);
    if (originalParent) {
      const children = Array.from(originalParent.children);
      if (_dragState.initialIndex < children.length) originalParent.insertBefore(_dragState.draggedEl, children[_dragState.initialIndex]);
      else originalParent.appendChild(_dragState.draggedEl);
    }
  }
  _finishDrag();
}
let _touchState = { startX: 0, startY: 0, longPressTimer: null, isLongPress: false };
function _onTouchStart(e) {
  const card = e.target.closest('.pna-card[data-draggable="true"]');
  if (!card) return;
  const touch = e.touches[0];
  _touchState.startX = touch.clientX;
  _touchState.startY = touch.clientY;
  _touchState.longPressTimer = setTimeout(() => {
    _touchState.isLongPress = true;
    card.classList.add("pna-card--touch-drag");
    if (navigator.vibrate) navigator.vibrate(50);
    _dragState = { isDragging: true, draggedEl: card, draggedId: card.dataset.itemId, sourceGroup: card.dataset.group, placeholder: _createPlaceholder(card), initialIndex: Array.from(card.parentNode.children).indexOf(card), currentDropZone: null, preview: _createDragPreview(card) };
    card.style.opacity = "0.4";
    _highlightDropZones(_dragState.sourceGroup);
  }, 500);
}
function _onTouchMove(e) {
  if (!_touchState.isLongPress || !_dragState.isDragging) {
    const touch2 = e.touches[0];
    const dx = Math.abs(touch2.clientX - _touchState.startX);
    const dy = Math.abs(touch2.clientY - _touchState.startY);
    if (dx > 10 || dy > 10) clearTimeout(_touchState.longPressTimer);
    return;
  }
  e.preventDefault();
  const touch = e.touches[0];
  _updatePreviewPosition(_dragState.preview, { clientX: touch.clientX, clientY: touch.clientY });
  _dragState.preview.style.display = "none";
  const elemBelow = hasDocument ? document.elementFromPoint(touch.clientX, touch.clientY) : null;
  _dragState.preview.style.display = "";
  if (elemBelow) {
    const card = elemBelow.closest(".pna-card:not(.pna-card--placeholder)");
    const group = elemBelow.closest(".pna-group");
    if (group && card && card !== _dragState.draggedEl) {
      const rect = card.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      if (touch.clientY < midY) card.parentNode.insertBefore(_dragState.placeholder, card);
      else card.parentNode.insertBefore(_dragState.placeholder, card.nextSibling);
    }
  }
}
function _onTouchEnd(e) {
  clearTimeout(_touchState.longPressTimer);
  if (!_touchState.isLongPress || !_dragState.isDragging) {
    _touchState.isLongPress = false;
    return;
  }
  const touch = e.changedTouches[0];
  _dragState.preview.style.display = "none";
  const elemBelow = hasDocument ? document.elementFromPoint(touch.clientX, touch.clientY) : null;
  _dragState.preview.style.display = "";
  const group = elemBelow?.closest(".pna-group");
  if (group && hasDocument) {
    const newGroup = group.dataset.group;
    const itemsContainer = group.querySelector(".pna-group__items");
    if (_dragState.placeholder.parentNode) _dragState.placeholder.parentNode.insertBefore(_dragState.draggedEl, _dragState.placeholder);
    const newOrder = Array.from(itemsContainer.querySelectorAll(".pna-card")).map((card) => ({ id: card.dataset.dbId, itemKey: card.dataset.itemId, group: newGroup }));
    _emitReorder({ itemId: _dragState.draggedId, newGroup, newOrder });
  }
  _finishDrag();
  _touchState.isLongPress = false;
  if (hasDocument) document.querySelectorAll(".pna-card--touch-drag").forEach((el) => {
    el.classList.remove("pna-card--touch-drag");
  });
}
function init(container, options = {}) {
  if (_container) destroy();
  _initPorts();
  _container = container;
  Object.assign(_options, options);
  _container.addEventListener("dragstart", _onDragStart);
  _container.addEventListener("drag", _onDrag);
  _container.addEventListener("dragover", _onDragOver);
  _container.addEventListener("dragleave", _onDragLeave);
  _container.addEventListener("drop", _onDrop);
  _container.addEventListener("dragend", _onDragEnd);
  _container.addEventListener("touchstart", _onTouchStart, { passive: true });
  _container.addEventListener("touchmove", _onTouchMove, { passive: false });
  _container.addEventListener("touchend", _onTouchEnd);
  if (hasDocument && !document.querySelector("#pna-dnd-enhanced-styles")) {
    const style = document.createElement("style");
    style.id = "pna-dnd-enhanced-styles";
    style.textContent = `.pna-card[data-draggable="true"] { cursor: grab; } .pna-card--dragging { cursor: grabbing !important; } .pna-card--placeholder { pointer-events: none; } .pna-group--drop-zone { outline: 2px dashed rgba(59, 130, 246, 0.5); outline-offset: -4px; border-radius: 8px; } .pna-card--touch-drag { animation: pna-touch-wiggle 0.3s ease; } @keyframes pna-touch-wiggle { 0%, 100% { transform: rotate(0); } 25% { transform: rotate(-1deg); } 75% { transform: rotate(1deg); } } .pna-drag-preview { border-radius: 8px; background: var(--pna-bg-card, #1a2234); border: 1px solid var(--pna-primary, #3b82f6); }`;
    document.head.appendChild(style);
  }
  _log("info", "Enhanced Drag & Drop initialized (EventBus only)");
}
function destroy() {
  if (!_container) return;
  _container.removeEventListener("dragstart", _onDragStart);
  _container.removeEventListener("drag", _onDrag);
  _container.removeEventListener("dragover", _onDragOver);
  _container.removeEventListener("dragleave", _onDragLeave);
  _container.removeEventListener("drop", _onDrop);
  _container.removeEventListener("dragend", _onDragEnd);
  _container.removeEventListener("touchstart", _onTouchStart);
  _container.removeEventListener("touchmove", _onTouchMove);
  _container.removeEventListener("touchend", _onTouchEnd);
  _container = null;
  _log("info", "Enhanced Drag & Drop destroyed");
}
function refresh(container, options) {
  destroy();
  init(container || _container, options);
}
function setOption(key, value) {
  if (key in _options) _options[key] = value;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), eventBusOnly: true, hasContainer: !!_container, p22Compliant: true, timestamp: Date.now() };
}
function healthCheck() {
  const logger = _getPort("logger");
  return { status: _container ? "HEALTHY" : "NOT_INITIALIZED", moduleId: MODULE_ID, version: VERSION, checks: { ready: !!_container, loggerReady: !!logger }, portsInitialized: Ports.isInitialized(), eventBusOnly: true, p22Compliant: true, timestamp: Date.now() };
}
var drag_drop_enhanced_default = { init, destroy, refresh, setOption, VERSION, MODULE_ID, injectPorts, getPorts, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  drag_drop_enhanced_default as default,
  destroy,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  refresh,
  setOption
};
