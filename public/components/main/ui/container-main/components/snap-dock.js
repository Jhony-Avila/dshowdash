import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-snap-dock";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.enabled !== void 0 && typeof options.enabled !== "boolean") errors.push("enabled must be a boolean");
  if (options.threshold !== void 0 && (typeof options.threshold !== "number" || options.threshold < 1)) errors.push("threshold must be a positive number");
  if (options.showGuides !== void 0 && typeof options.showGuides !== "boolean") errors.push("showGuides must be a boolean");
  if (options.snapZones !== void 0 && !Array.isArray(options.snapZones)) errors.push("snapZones must be an array");
  if (options.onSnap !== void 0 && typeof options.onSnap !== "function") errors.push("onSnap must be a function");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const SNAP_ZONE = { TOP: "top", BOTTOM: "bottom", LEFT: "left", RIGHT: "right", TOP_LEFT: "top-left", TOP_RIGHT: "top-right", BOTTOM_LEFT: "bottom-left", BOTTOM_RIGHT: "bottom-right", CENTER: "center", MAXIMIZE: "maximize" };
function createSnapDock(container, options = {}) {
  _validateOptions(options);
  const { enabled = true, threshold = 30, showGuides = true, snapZones = Object.values(SNAP_ZONE), onSnap, onUnsnap, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _enabled = enabled;
  let _currentZone = null;
  let _originalRect = null;
  let _guideEl = null;
  let _isDragging = false;
  let _eventUnsubscriber = null;
  let _boundDragMove = null;
  let _boundDragEnd = null;
  function _createGuideElement() {
    if (!showGuides) return null;
    let existing = document.querySelector(".dsd-snap-guide");
    if (existing) return existing;
    const guide = document.createElement("div");
    guide.className = "dsd-snap-guide";
    guide.setAttribute("aria-hidden", "true");
    guide.setAttribute("role", "presentation");
    document.body.appendChild(guide);
    return guide;
  }
  function _getZoneForPosition(x, y) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const t = threshold;
    if (x <= t && y <= t) return SNAP_ZONE.TOP_LEFT;
    if (x >= vw - t && y <= t) return SNAP_ZONE.TOP_RIGHT;
    if (x <= t && y >= vh - t) return SNAP_ZONE.BOTTOM_LEFT;
    if (x >= vw - t && y >= vh - t) return SNAP_ZONE.BOTTOM_RIGHT;
    if (y <= t) return SNAP_ZONE.TOP;
    if (y >= vh - t) return SNAP_ZONE.BOTTOM;
    if (x <= t) return SNAP_ZONE.LEFT;
    if (x >= vw - t) return SNAP_ZONE.RIGHT;
    return null;
  }
  function _getZoneRect(zone) {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const zones = {
      [SNAP_ZONE.TOP]: { x: 0, y: 0, width: vw, height: vh / 2 },
      [SNAP_ZONE.BOTTOM]: { x: 0, y: vh / 2, width: vw, height: vh / 2 },
      [SNAP_ZONE.LEFT]: { x: 0, y: 0, width: vw / 2, height: vh },
      [SNAP_ZONE.RIGHT]: { x: vw / 2, y: 0, width: vw / 2, height: vh },
      [SNAP_ZONE.TOP_LEFT]: { x: 0, y: 0, width: vw / 2, height: vh / 2 },
      [SNAP_ZONE.TOP_RIGHT]: { x: vw / 2, y: 0, width: vw / 2, height: vh / 2 },
      [SNAP_ZONE.BOTTOM_LEFT]: { x: 0, y: vh / 2, width: vw / 2, height: vh / 2 },
      [SNAP_ZONE.BOTTOM_RIGHT]: { x: vw / 2, y: vh / 2, width: vw / 2, height: vh / 2 },
      [SNAP_ZONE.MAXIMIZE]: { x: 0, y: 0, width: vw, height: vh },
      [SNAP_ZONE.CENTER]: { x: vw / 4, y: vh / 4, width: vw / 2, height: vh / 2 }
    };
    return zones[zone] || null;
  }
  function _showGuide(zone) {
    if (!_guideEl || !zone) return;
    const rect = _getZoneRect(zone);
    if (!rect) return;
    _guideEl.style.left = `${rect.x}px`;
    _guideEl.style.top = `${rect.y}px`;
    _guideEl.style.width = `${rect.width}px`;
    _guideEl.style.height = `${rect.height}px`;
    _guideEl.classList.add("dsd-snap-guide--visible");
  }
  function _hideGuide() {
    _guideEl?.classList.remove("dsd-snap-guide--visible");
  }
  function _applySnap(zone) {
    const rect = _getZoneRect(zone);
    if (!rect) return;
    container.style.position = "fixed";
    container.style.left = `${rect.x}px`;
    container.style.top = `${rect.y}px`;
    container.style.width = `${rect.width}px`;
    container.style.height = `${rect.height}px`;
    container.style.transform = "none";
    container.classList.add("dsd-container--snapped", `dsd-container--snapped-${String(zone)}`);
    container.setAttribute("data-snap-zone", String(zone));
  }
  function _handleDragMove(e) {
    if (!_enabled || !_isDragging) return;
    const zone = _getZoneForPosition(e.clientX, e.clientY);
    if (zone && snapZones.includes(zone)) _showGuide(zone);
    else _hideGuide();
  }
  function _handleDragEnd(e) {
    if (!_enabled || !_isDragging) return;
    _isDragging = false;
    _hideGuide();
    const zone = _getZoneForPosition(e.clientX, e.clientY);
    if (zone && snapZones.includes(zone)) snapApi.snapTo(zone);
    document.removeEventListener("mousemove", _boundDragMove);
    document.removeEventListener("mouseup", _boundDragEnd);
  }
  function _handleDragStart(data) {
    const containerId = container.id;
    if (containerId && data.containerId && data.containerId !== containerId) return;
    if (!_enabled) return;
    _isDragging = true;
    _originalRect = container.getBoundingClientRect();
    _boundDragMove = _handleDragMove;
    _boundDragEnd = _handleDragEnd;
    document.addEventListener("mousemove", _boundDragMove);
    document.addEventListener("mouseup", _boundDragEnd);
  }
  const snapApi = {
    init() {
      if (_initialized) return this;
      _guideEl = _createGuideElement();
      const eb = _getEventBus();
      if (eb?.on) _eventUnsubscriber = eb.on(CONTAINER_EVENTS.DRAG_START, _handleDragStart);
      _initialized = true;
      return this;
    },
    enable() {
      _enabled = true;
      return this;
    },
    disable() {
      _enabled = false;
      return this;
    },
    isEnabled() {
      return _enabled;
    },
    snapTo(zone) {
      if (!snapZones.includes(zone)) return false;
      if (!_currentZone) _originalRect = container.getBoundingClientRect();
      if (_currentZone) container.classList.remove(`dsd-container--snapped-${_currentZone}`);
      _currentZone = zone;
      _applySnap(zone);
      onSnap?.(zone);
      _emitEvent(MAIN_EVENTS.SNAP_CHANGE, { zone, containerId: container.id });
      return true;
    },
    unsnap() {
      if (!_currentZone) return false;
      container.classList.remove("dsd-container--snapped", `dsd-container--snapped-${_currentZone}`);
      container.removeAttribute("data-snap-zone");
      if (_originalRect) {
        container.style.left = `${_originalRect.left}px`;
        container.style.top = `${_originalRect.top}px`;
        container.style.width = `${_originalRect.width}px`;
        container.style.height = `${_originalRect.height}px`;
      }
      const prevZone = _currentZone;
      _currentZone = null;
      onUnsnap?.(prevZone);
      _emitEvent(MAIN_EVENTS.SNAP_UNSNAP, { prevZone, containerId: container.id });
      return true;
    },
    getCurrentZone() {
      return _currentZone;
    },
    isSnapped() {
      return _currentZone !== null;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _guideEl?.remove();
      _guideEl = null;
      if (typeof _eventUnsubscriber === "function") _eventUnsubscriber();
      _eventUnsubscriber = null;
      if (_boundDragMove) document.removeEventListener("mousemove", _boundDragMove);
      if (_boundDragEnd) document.removeEventListener("mouseup", _boundDragEnd);
      _boundDragMove = null;
      _boundDragEnd = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, enabled: _enabled, currentZone: _currentZone, isSnapped: _currentZone !== null, hasInjectedEventBus: !!_injectedEventBus, listenerViaEventBus: !!_eventUnsubscriber, hasValidation: true };
    }
  };
  return snapApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var snap_dock_default = { createSnapDock, injectEventBus, info, healthCheck, VERSION, MODULE_ID, SNAP_ZONE };
export {
  MODULE_ID,
  SNAP_ZONE,
  VERSION,
  createSnapDock,
  snap_dock_default as default,
  healthCheck,
  info,
  injectEventBus
};
