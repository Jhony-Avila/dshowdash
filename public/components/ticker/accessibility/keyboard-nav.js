import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.3.0-P17WI";
const MODULE_ID = "ticker.accessibility.keyboard-nav";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
};
class KeyboardNavigator {
  constructor(options = {}) {
    this.itemSelector = options.itemSelector || ".ticker-item";
    this.loop = options.loop ?? true;
    this.onNavigate = options.onNavigate || null;
    this.onSelect = options.onSelect || null;
    this.onEscape = options.onEscape || null;
    this._container = null;
    this._items = [];
    this._currentIndex = -1;
    this._enabled = true;
    this._focused = false;
    this._keyboardActive = false;
    this._metrics = { navigations: 0, selections: 0, escapes: 0 };
    this._boundKeyHandler = this._onKeyDown.bind(this);
    this._boundFocusIn = this._onFocusIn.bind(this);
    this._boundFocusOut = this._onFocusOut.bind(this);
  }
  init(container) {
    if (!container) return this;
    this._container = container;
    this._container.setAttribute("role", "list");
    this._container.setAttribute("tabindex", "0");
    this._container.setAttribute("aria-label", "Ticker de noticias - Use as setas para navegar");
    this._attachEvents();
    this.refresh();
    _log("debug", "KeyboardNavigator initialized");
    return this;
  }
  _attachEvents() {
    this._container.addEventListener("keydown", this._boundKeyHandler);
    this._container.addEventListener("focusin", this._boundFocusIn);
    this._container.addEventListener("focusout", this._boundFocusOut);
  }
  _onKeyDown(e) {
    if (!this._enabled || !this._items.length) return;
    const navigationKeys = ["ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown", "Home", "End", "Enter", " ", "Escape"];
    if (navigationKeys.includes(e.key)) {
      this._keyboardActive = true;
    }
    switch (e.key) {
      case "ArrowLeft":
      case "ArrowUp":
        e.preventDefault();
        this._navigatePrevious();
        break;
      case "ArrowRight":
      case "ArrowDown":
        e.preventDefault();
        this._navigateNext();
        break;
      case "Home":
        e.preventDefault();
        this._navigateFirst();
        break;
      case "End":
        e.preventDefault();
        this._navigateLast();
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        this._selectCurrent();
        break;
      case "Escape":
        this._onEscapePressed();
        break;
    }
  }
  _onFocusIn() {
    this._focused = true;
    if (this._currentIndex === -1 && this._items.length > 0) {
      this._currentIndex = 0;
      this._items[0]?.setAttribute("tabindex", "0");
    }
  }
  _onFocusOut(e) {
    if (!this._container.contains(e.relatedTarget)) {
      this._focused = false;
      this._keyboardActive = false;
      this._clearAllHighlights();
    }
  }
  _clearAllHighlights() {
    this._items.forEach((item) => {
      item.classList.remove("ticker-item--focused");
      item.setAttribute("aria-selected", "false");
    });
  }
  _navigateNext() {
    if (this._currentIndex >= this._items.length - 1) {
      if (this.loop) this._setCurrentIndex(0);
    } else {
      this._setCurrentIndex(this._currentIndex + 1);
    }
    this._metrics.navigations++;
  }
  _navigatePrevious() {
    if (this._currentIndex <= 0) {
      if (this.loop) this._setCurrentIndex(this._items.length - 1);
    } else {
      this._setCurrentIndex(this._currentIndex - 1);
    }
    this._metrics.navigations++;
  }
  _navigateFirst() {
    this._setCurrentIndex(0);
    this._metrics.navigations++;
  }
  _navigateLast() {
    this._setCurrentIndex(this._items.length - 1);
    this._metrics.navigations++;
  }
  _setCurrentIndex(index) {
    if (index < 0 || index >= this._items.length) return;
    this._items.forEach((item, i) => {
      item.setAttribute("tabindex", i === index ? "0" : "-1");
      const shouldHighlight = this._keyboardActive && i === index;
      item.classList.toggle("ticker-item--focused", shouldHighlight);
      item.setAttribute("aria-selected", i === index ? "true" : "false");
    });
    const oldIndex = this._currentIndex;
    this._currentIndex = index;
    const currentItem = this._items[index];
    if (currentItem && this._keyboardActive) {
      currentItem.focus();
      currentItem.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
    if (this.onNavigate) {
      this.onNavigate({ oldIndex, newIndex: index, item: currentItem });
    }
    _log("debug", `Navigated to item ${index}`, { keyboardActive: this._keyboardActive });
  }
  _selectCurrent() {
    if (this._currentIndex < 0) return;
    const item = this._items[this._currentIndex];
    if (!item) return;
    this._metrics.selections++;
    const link = item.querySelector("a");
    if (link) {
      link.click();
    } else if (this.onSelect) {
      this.onSelect({ index: this._currentIndex, item });
    }
    _log("debug", `Selected item ${this._currentIndex}`);
  }
  _onEscapePressed() {
    this._metrics.escapes++;
    this._keyboardActive = false;
    this._clearAllHighlights();
    this._container.blur();
    if (this.onEscape) this.onEscape();
    _log("debug", "Escape pressed");
  }
  refresh() {
    this._items = Array.from(this._container.querySelectorAll(this.itemSelector));
    this._items.forEach((item, i) => {
      item.setAttribute("role", "listitem");
      item.setAttribute("tabindex", i === this._currentIndex ? "0" : "-1");
      item.setAttribute("aria-selected", "false");
      item.classList.remove("ticker-item--focused");
    });
    _log("debug", `Refreshed: ${this._items.length} items`);
  }
  getCurrentIndex() {
    return this._currentIndex;
  }
  getCurrentItem() {
    return this._items[this._currentIndex] || null;
  }
  getItemCount() {
    return this._items.length;
  }
  isFocused() {
    return this._focused;
  }
  isKeyboardActive() {
    return this._keyboardActive;
  }
  enable() {
    this._enabled = true;
  }
  disable() {
    this._enabled = false;
  }
  destroy() {
    if (this._container) {
      this._container.removeEventListener("keydown", this._boundKeyHandler);
      this._container.removeEventListener("focusin", this._boundFocusIn);
      this._container.removeEventListener("focusout", this._boundFocusOut);
      this._container.removeAttribute("tabindex");
      this._container.removeAttribute("role");
      this._container.removeAttribute("aria-label");
    }
    this._items.forEach((item) => {
      item.removeAttribute("tabindex");
      item.removeAttribute("role");
      item.removeAttribute("aria-selected");
      item.classList.remove("ticker-item--focused");
    });
    this._container = null;
    this._items = [];
    this._keyboardActive = false;
  }
  healthCheck() {
    const logger = _getPort("logger");
    const checks = { hasContainer: !!this._container, hasItems: this._items.length > 0, enabled: this._enabled, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 5 ? "HEALTHY" : "DEGRADED", score: `${passed}/5`, itemCount: this._items.length, currentIndex: this._currentIndex, focused: this._focused, keyboardActive: this._keyboardActive, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this._enabled, itemCount: this._items.length, currentIndex: this._currentIndex, focused: this._focused, keyboardActive: this._keyboardActive, loop: this.loop, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var keyboard_nav_default = KeyboardNavigator;
export {
  KeyboardNavigator,
  MODULE_ID,
  VERSION,
  keyboard_nav_default as default,
  getPorts,
  getVersion,
  injectPorts
};
