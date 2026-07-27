import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
import { ICONS } from "../utils/icons.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-split-view";
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
  if (options.direction !== void 0 && !["horizontal", "vertical"].includes(options.direction)) errors.push("direction must be horizontal|vertical");
  if (options.initialSizes !== void 0 && !Array.isArray(options.initialSizes)) errors.push("initialSizes must be an array");
  if (options.minSize !== void 0 && (typeof options.minSize !== "number" || options.minSize < 0)) errors.push("minSize must be a positive number");
  if (options.gutterSize !== void 0 && (typeof options.gutterSize !== "number" || options.gutterSize < 1)) errors.push("gutterSize must be a positive number");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const SPLIT_DIRECTION = { HORIZONTAL: "horizontal", VERTICAL: "vertical" };
function createSplitView(container, options = {}) {
  _validateOptions(options);
  const { direction = SPLIT_DIRECTION.HORIZONTAL, initialSizes = [50, 50], minSize = 100, gutterSize = 6, snapThreshold = 50, onResize, onCollapse, onExpand, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _direction = direction;
  let _sizes = [...initialSizes];
  let _panels = [];
  let _gutters = [];
  let _splitViewEl = null;
  let _isDragging = false;
  let _activeGutterIndex = -1;
  let _startPos = 0;
  let _startSizes = [];
  let _panelHandlers = [];
  function _createSplitView() {
    const content = container.querySelector(".dsd-container__content");
    if (!content) return null;
    let existing = content.querySelector(".dsd-split-view");
    if (existing) return existing;
    const splitView = document.createElement("div");
    splitView.className = `dsd-split-view dsd-split-view--${_direction}`;
    splitView.setAttribute("role", "group");
    splitView.setAttribute("aria-label", "Pain\xE9is redimension\xE1veis");
    _sizes.forEach((size, index) => {
      const panel = _createPanel(index, size);
      splitView.appendChild(panel);
      _panels.push(panel);
      if (index < _sizes.length - 1) {
        const gutter = _createGutter(index);
        splitView.appendChild(gutter);
        _gutters.push(gutter);
      }
    });
    content.appendChild(splitView);
    return splitView;
  }
  function _createPanel(index, size) {
    const panel = document.createElement("div");
    panel.className = "dsd-split-panel";
    panel.dataset.panelIndex = String(index);
    panel.setAttribute("role", "region");
    panel.setAttribute("aria-label", `Painel ${index + 1}`);
    panel.style.flexBasis = `${size}%`;
    panel.innerHTML = `<div class="dsd-split-panel__header"><span class="dsd-split-panel__title">Painel ${index + 1}</span><div class="dsd-split-panel__actions"><button type="button" class="dsd-split-panel__btn dsd-split-panel__btn--collapse" aria-label="Colapsar painel ${index + 1}" title="Colapsar">${ICONS.chevronDown}</button><button type="button" class="dsd-split-panel__btn dsd-split-panel__btn--close" aria-label="Fechar painel ${index + 1}" title="Fechar">${ICONS.closeSmall}</button></div></div><div class="dsd-split-panel__content" data-slot="content"></div>`;
    const collapseBtn = panel.querySelector(".dsd-split-panel__btn--collapse");
    const closeBtn = panel.querySelector(".dsd-split-panel__btn--close");
    const collapseHandler = () => splitViewApi.toggleCollapse(index);
    const closeHandler = () => splitViewApi.removePanel(index);
    collapseBtn?.addEventListener("click", collapseHandler);
    closeBtn?.addEventListener("click", closeHandler);
    _panelHandlers.push({ el: collapseBtn, handler: collapseHandler }, { el: closeBtn, handler: closeHandler });
    return panel;
  }
  function _createGutter(index) {
    const gutter = document.createElement("div");
    gutter.className = "dsd-split-gutter";
    gutter.dataset.gutterIndex = String(index);
    gutter.setAttribute("role", "separator");
    gutter.setAttribute("aria-orientation", _direction === SPLIT_DIRECTION.HORIZONTAL ? "vertical" : "horizontal");
    gutter.setAttribute("aria-label", `Separador entre painel ${index + 1} e ${index + 2}`);
    gutter.setAttribute("aria-valuenow", String(_sizes[index]));
    gutter.setAttribute("aria-valuemin", "0");
    gutter.setAttribute("aria-valuemax", "100");
    gutter.tabIndex = 0;
    gutter.innerHTML = `<div class="dsd-split-gutter__handle"><div class="dsd-split-gutter__dots"></div></div>`;
    gutter.addEventListener("mousedown", (e) => _onGutterMouseDown(e, index));
    gutter.addEventListener("keydown", (e) => _onGutterKeydown(e, index));
    gutter.addEventListener("dblclick", () => _resetSizes());
    return gutter;
  }
  function _onGutterMouseDown(e, index) {
    e.preventDefault();
    _isDragging = true;
    _activeGutterIndex = index;
    _startPos = _direction === SPLIT_DIRECTION.HORIZONTAL ? e.clientX : e.clientY;
    _startSizes = [..._sizes];
    document.body.style.cursor = _direction === SPLIT_DIRECTION.HORIZONTAL ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
    _splitViewEl?.classList.add("dsd-split-view--dragging");
    _gutters[index]?.classList.add("dsd-split-gutter--active");
    document.addEventListener("mousemove", _onMouseMove);
    document.addEventListener("mouseup", _onMouseUp);
  }
  function _onMouseMove(e) {
    if (!_isDragging || _activeGutterIndex === -1) return;
    const currentPos = _direction === SPLIT_DIRECTION.HORIZONTAL ? e.clientX : e.clientY;
    const delta = currentPos - _startPos;
    const containerSize = _direction === SPLIT_DIRECTION.HORIZONTAL ? _splitViewEl.offsetWidth : _splitViewEl.offsetHeight;
    const deltaPercent = delta / containerSize * 100;
    let newSize1 = _startSizes[_activeGutterIndex] + deltaPercent;
    let newSize2 = _startSizes[_activeGutterIndex + 1] - deltaPercent;
    const minPercent = minSize / containerSize * 100;
    if (newSize1 < minPercent) {
      newSize1 = minPercent;
      newSize2 = _startSizes[_activeGutterIndex] + _startSizes[_activeGutterIndex + 1] - minPercent;
    }
    if (newSize2 < minPercent) {
      newSize2 = minPercent;
      newSize1 = _startSizes[_activeGutterIndex] + _startSizes[_activeGutterIndex + 1] - minPercent;
    }
    if (newSize1 < snapThreshold / containerSize * 100) {
      newSize1 = 0;
      newSize2 = _startSizes[_activeGutterIndex] + _startSizes[_activeGutterIndex + 1];
    }
    if (newSize2 < snapThreshold / containerSize * 100) {
      newSize2 = 0;
      newSize1 = _startSizes[_activeGutterIndex] + _startSizes[_activeGutterIndex + 1];
    }
    _sizes[_activeGutterIndex] = newSize1;
    _sizes[_activeGutterIndex + 1] = newSize2;
    _applyPanelSizes();
    onResize?.([..._sizes]);
  }
  function _onMouseUp() {
    _isDragging = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    _splitViewEl?.classList.remove("dsd-split-view--dragging");
    _gutters[_activeGutterIndex]?.classList.remove("dsd-split-gutter--active");
    _activeGutterIndex = -1;
    document.removeEventListener("mousemove", _onMouseMove);
    document.removeEventListener("mouseup", _onMouseUp);
    _emitEvent(MAIN_EVENTS.SPLIT_RESIZE, { sizes: [..._sizes], containerId: container.id });
  }
  function _onGutterKeydown(e, index) {
    const step = e.shiftKey ? 10 : 2;
    let handled = false;
    if (_direction === SPLIT_DIRECTION.HORIZONTAL) {
      if (e.key === "ArrowLeft") {
        _adjustSize(index, -step);
        handled = true;
      } else if (e.key === "ArrowRight") {
        _adjustSize(index, step);
        handled = true;
      }
    } else {
      if (e.key === "ArrowUp") {
        _adjustSize(index, -step);
        handled = true;
      } else if (e.key === "ArrowDown") {
        _adjustSize(index, step);
        handled = true;
      }
    }
    if (e.key === "Home") {
      _sizes[index] = 0;
      _sizes[index + 1] = initialSizes[index] + initialSizes[index + 1];
      _applyPanelSizes();
      handled = true;
    } else if (e.key === "End") {
      _sizes[index] = initialSizes[index] + initialSizes[index + 1];
      _sizes[index + 1] = 0;
      _applyPanelSizes();
      handled = true;
    }
    if (handled) {
      e.preventDefault();
      _gutters[index]?.setAttribute("aria-valuenow", String(_sizes[index]));
      onResize?.([..._sizes]);
    }
  }
  function _adjustSize(index, delta) {
    _sizes[index] = Math.max(0, _sizes[index] + delta);
    _sizes[index + 1] = Math.max(0, _sizes[index + 1] - delta);
    _applyPanelSizes();
  }
  function _applyPanelSizes() {
    _panels.forEach((panel, index) => {
      panel.style.flexBasis = `${_sizes[index]}%`;
      const isCollapsed = _sizes[index] === 0;
      panel.classList.toggle("dsd-split-panel--collapsed", isCollapsed);
      panel.setAttribute("aria-hidden", String(isCollapsed));
    });
    _gutters.forEach((gutter, index) => gutter.setAttribute("aria-valuenow", String(_sizes[index])));
  }
  function _resetSizes() {
    _sizes = [...initialSizes];
    _applyPanelSizes();
    onResize?.([..._sizes]);
  }
  function _clearPanelHandlers() {
    _panelHandlers.forEach(({ el, handler }) => el?.removeEventListener("click", handler));
    _panelHandlers = [];
  }
  const splitViewApi = {
    init() {
      if (_initialized) return this;
      _splitViewEl = _createSplitView();
      _initialized = true;
      return this;
    },
    addPanel(opts = {}) {
      if (!_splitViewEl) return null;
      const index = _panels.length;
      const size = opts.size || 100 / (_panels.length + 1);
      const factor = (100 - size) / 100;
      _sizes = _sizes.map((s) => s * factor);
      _sizes.push(size);
      if (_panels.length > 0) {
        const gutter = _createGutter(index - 1);
        _splitViewEl.appendChild(gutter);
        _gutters.push(gutter);
      }
      const panel = _createPanel(index, size);
      _splitViewEl.appendChild(panel);
      _panels.push(panel);
      _applyPanelSizes();
      return panel;
    },
    removePanel(index) {
      if (index < 0 || index >= _panels.length || _panels.length <= 1) return false;
      const removedSize = _sizes[index];
      _panels[index].remove();
      _panels.splice(index, 1);
      if (_gutters[index]) {
        _gutters[index].remove();
        _gutters.splice(index, 1);
      } else if (_gutters[index - 1]) {
        _gutters[index - 1].remove();
        _gutters.splice(index - 1, 1);
      }
      _sizes.splice(index, 1);
      const factor = 100 / (100 - removedSize);
      _sizes = _sizes.map((s) => s * factor);
      _panels.forEach((panel, i) => {
        panel.dataset.panelIndex = String(i);
        panel.setAttribute("aria-label", `Painel ${i + 1}`);
      });
      _gutters.forEach((gutter, i) => {
        gutter.dataset.gutterIndex = String(i);
        gutter.setAttribute("aria-label", `Separador entre painel ${i + 1} e ${i + 2}`);
      });
      _applyPanelSizes();
      return true;
    },
    toggleCollapse(index) {
      if (index < 0 || index >= _panels.length) return;
      const isCollapsed = _sizes[index] === 0;
      if (isCollapsed) {
        _sizes[index] = initialSizes[index] || 50;
        const total = _sizes.reduce((a, b) => a + b, 0);
        _sizes = _sizes.map((s) => s / total * 100);
        onExpand?.(index);
      } else {
        const collapsedSize = _sizes[index];
        _sizes[index] = 0;
        const remaining = _sizes.filter((_, i) => i !== index && _sizes[i] > 0);
        if (remaining.length > 0) {
          const addEach = collapsedSize / remaining.length;
          _sizes = _sizes.map((s, i) => i !== index && s > 0 ? s + addEach : s);
        }
        onCollapse?.(index);
      }
      _applyPanelSizes();
    },
    setDirection(dir) {
      if (dir !== SPLIT_DIRECTION.HORIZONTAL && dir !== SPLIT_DIRECTION.VERTICAL) return;
      _direction = dir;
      _splitViewEl?.classList.remove("dsd-split-view--horizontal", "dsd-split-view--vertical");
      _splitViewEl?.classList.add(`dsd-split-view--${dir}`);
      _gutters.forEach((gutter) => gutter.setAttribute("aria-orientation", dir === SPLIT_DIRECTION.HORIZONTAL ? "vertical" : "horizontal"));
    },
    getDirection() {
      return _direction;
    },
    setSizes(sizes) {
      if (!Array.isArray(sizes) || sizes.length !== _sizes.length) return;
      _sizes = [...sizes];
      _applyPanelSizes();
    },
    getSizes() {
      return [..._sizes];
    },
    getPanelContent(index) {
      return _panels[index]?.querySelector('[data-slot="content"]') || null;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _clearPanelHandlers();
      document.removeEventListener("mousemove", _onMouseMove);
      document.removeEventListener("mouseup", _onMouseUp);
      _splitViewEl?.remove();
      _splitViewEl = null;
      _panels = [];
      _gutters = [];
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, direction: _direction, panelCount: _panels.length, sizes: [..._sizes], hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
    }
  };
  return splitViewApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, usesCentralizedIcons: true, hasValidation: true };
}
var split_view_default = { createSplitView, injectEventBus, info, healthCheck, VERSION, MODULE_ID, SPLIT_DIRECTION };
export {
  MODULE_ID,
  SPLIT_DIRECTION,
  VERSION,
  createSplitView,
  split_view_default as default,
  healthCheck,
  info,
  injectEventBus
};
