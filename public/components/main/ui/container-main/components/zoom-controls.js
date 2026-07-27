import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { ICONS } from "../utils/icons.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-zoom-controls";
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
  if (options.minZoom !== void 0 && (typeof options.minZoom !== "number" || options.minZoom < 10)) errors.push("minZoom must be a number >= 10");
  if (options.maxZoom !== void 0 && (typeof options.maxZoom !== "number" || options.maxZoom > 500)) errors.push("maxZoom must be a number <= 500");
  if (options.step !== void 0 && (typeof options.step !== "number" || options.step < 1)) errors.push("step must be a number >= 1");
  if (options.defaultZoom !== void 0 && typeof options.defaultZoom !== "number") errors.push("defaultZoom must be a number");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
function createZoomControls(container, options = {}) {
  _validateOptions(options);
  const { minZoom = 25, maxZoom = 200, step = 10, defaultZoom = 100, showControls = true, persistZoom = true, onZoomChange, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _zoom = defaultZoom;
  let _controlsEl = null;
  const _storageKey = `dsd-zoom-${container?.id || "default"}`;
  let _boundKeydown = null;
  let _boundWheel = null;
  let _boundZoomOut = null;
  let _boundZoomIn = null;
  let _boundReset = null;
  function _createControlsElement() {
    if (!showControls) return null;
    const header = container.querySelector(".dsd-container__header");
    if (!header) return null;
    let existing = container.querySelector(".dsd-zoom-controls");
    if (existing) return existing;
    const controls = document.createElement("div");
    controls.className = "dsd-zoom-controls";
    controls.setAttribute("role", "group");
    controls.setAttribute("aria-label", "Controles de zoom");
    controls.innerHTML = `<button type="button" class="dsd-zoom-controls__btn dsd-zoom-controls__btn--out" aria-label="Diminuir zoom para ${Math.max(minZoom, _zoom - step)}%" title="Diminuir (Ctrl+-)">${ICONS.minus}</button><button type="button" class="dsd-zoom-controls__value" aria-label="Zoom atual: ${_zoom}%" aria-live="polite" title="Clique para resetar">${_zoom}%</button><button type="button" class="dsd-zoom-controls__btn dsd-zoom-controls__btn--in" aria-label="Aumentar zoom para ${Math.min(maxZoom, _zoom + step)}%" title="Aumentar (Ctrl++)">${ICONS.plus}</button>`;
    const controlsSection = header.querySelector(".dsd-container__controls");
    if (controlsSection) controlsSection.insertAdjacentElement("beforebegin", controls);
    else header.appendChild(controls);
    return controls;
  }
  function _applyZoom() {
    const content = container.querySelector(".dsd-container__content");
    if (content) {
      content.style.transform = `scale(${_zoom / 100})`;
      content.style.transformOrigin = "top left";
      content.style.width = `${100 / (_zoom / 100)}%`;
      content.style.height = `${100 / (_zoom / 100)}%`;
    }
    if (_controlsEl) {
      const valueEl = _controlsEl.querySelector(".dsd-zoom-controls__value");
      const outBtn = _controlsEl.querySelector(".dsd-zoom-controls__btn--out");
      const inBtn = _controlsEl.querySelector(".dsd-zoom-controls__btn--in");
      if (valueEl) {
        valueEl.textContent = `${_zoom}%`;
        valueEl.setAttribute("aria-label", `Zoom atual: ${_zoom}%`);
      }
      if (outBtn) {
        outBtn.disabled = _zoom <= minZoom;
        outBtn.setAttribute("aria-label", `Diminuir zoom para ${Math.max(minZoom, _zoom - step)}%`);
      }
      if (inBtn) {
        inBtn.disabled = _zoom >= maxZoom;
        inBtn.setAttribute("aria-label", `Aumentar zoom para ${Math.min(maxZoom, _zoom + step)}%`);
      }
    }
    container.setAttribute("data-zoom", String(_zoom));
    if (persistZoom) {
      try {
        localStorage.setItem(_storageKey, String(_zoom));
      } catch (e) {
      }
    }
    onZoomChange?.(_zoom);
    _emitEvent(MAIN_EVENTS.ZOOM_CHANGE, { zoom: _zoom, containerId: container.id });
  }
  function _loadPersistedZoom() {
    if (!persistZoom) return;
    try {
      const saved = localStorage.getItem(_storageKey);
      if (saved) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= minZoom && parsed <= maxZoom) _zoom = parsed;
      }
    } catch (e) {
    }
  }
  function _setupKeyboardShortcuts() {
    _boundKeydown = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.key === "=" || e.key === "+") {
        e.preventDefault();
        zoomApi.zoomIn();
      } else if (e.key === "-") {
        e.preventDefault();
        zoomApi.zoomOut();
      } else if (e.key === "0") {
        e.preventDefault();
        zoomApi.reset();
      }
    };
    _boundWheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      if (e.deltaY < 0) zoomApi.zoomIn();
      else zoomApi.zoomOut();
    };
    container.addEventListener("keydown", _boundKeydown);
    container.addEventListener("wheel", _boundWheel, { passive: false });
  }
  function _setupControlEvents() {
    if (!_controlsEl) return;
    const outBtn = _controlsEl.querySelector(".dsd-zoom-controls__btn--out");
    const inBtn = _controlsEl.querySelector(".dsd-zoom-controls__btn--in");
    const valueBtn = _controlsEl.querySelector(".dsd-zoom-controls__value");
    _boundZoomOut = () => zoomApi.zoomOut();
    _boundZoomIn = () => zoomApi.zoomIn();
    _boundReset = () => zoomApi.reset();
    outBtn?.addEventListener("click", _boundZoomOut);
    inBtn?.addEventListener("click", _boundZoomIn);
    valueBtn?.addEventListener("click", _boundReset);
  }
  function _removeEvents() {
    if (_boundKeydown) container.removeEventListener("keydown", _boundKeydown);
    if (_boundWheel) container.removeEventListener("wheel", _boundWheel);
    if (_controlsEl) {
      const outBtn = _controlsEl.querySelector(".dsd-zoom-controls__btn--out");
      const inBtn = _controlsEl.querySelector(".dsd-zoom-controls__btn--in");
      const valueBtn = _controlsEl.querySelector(".dsd-zoom-controls__value");
      if (outBtn && _boundZoomOut) outBtn.removeEventListener("click", _boundZoomOut);
      if (inBtn && _boundZoomIn) inBtn.removeEventListener("click", _boundZoomIn);
      if (valueBtn && _boundReset) valueBtn.removeEventListener("click", _boundReset);
    }
    _boundKeydown = null;
    _boundWheel = null;
    _boundZoomOut = null;
    _boundZoomIn = null;
    _boundReset = null;
  }
  const zoomApi = {
    init() {
      if (_initialized) return this;
      _loadPersistedZoom();
      _controlsEl = _createControlsElement();
      _setupKeyboardShortcuts();
      _setupControlEvents();
      _applyZoom();
      _initialized = true;
      return this;
    },
    zoomIn(amount = step) {
      return this.setZoom(_zoom + amount);
    },
    zoomOut(amount = step) {
      return this.setZoom(_zoom - amount);
    },
    setZoom(value) {
      if (typeof value !== "number") return this;
      _zoom = Math.max(minZoom, Math.min(maxZoom, Math.round(value)));
      _applyZoom();
      return this;
    },
    getZoom() {
      return _zoom;
    },
    reset() {
      return this.setZoom(defaultZoom);
    },
    fit() {
      const content = container.querySelector(".dsd-container__content");
      if (!content) return this;
      const containerRect = container.getBoundingClientRect();
      const contentRect = content.scrollWidth ? { width: content.scrollWidth, height: content.scrollHeight } : content.getBoundingClientRect();
      const scaleX = (containerRect.width - 40) / contentRect.width;
      const scaleY = (containerRect.height - 100) / contentRect.height;
      const scale = Math.min(scaleX, scaleY, 1) * 100;
      return this.setZoom(Math.round(scale));
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _removeEvents();
      _controlsEl?.remove();
      _controlsEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, zoom: _zoom, minZoom, maxZoom, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return zoomApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
var zoom_controls_default = { createZoomControls, injectEventBus, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createZoomControls,
  zoom_controls_default as default,
  healthCheck,
  info,
  injectEventBus
};
