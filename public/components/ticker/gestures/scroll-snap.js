import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.gestures.scroll-snap";
const hasWindow = typeof window !== "undefined";
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
}
const STYLES = `.ticker-scroll-snap { scroll-snap-type: x mandatory; scroll-behavior: smooth; -webkit-overflow-scrolling: touch; } .ticker-scroll-snap-item { scroll-snap-align: start; scroll-snap-stop: normal; } .ticker-scroll-snap--center .ticker-scroll-snap-item { scroll-snap-align: center; } .ticker-scroll-snap--end .ticker-scroll-snap-item { scroll-snap-align: end; }`;
class ScrollSnap {
  constructor(options = {}) {
    this.alignment = options.alignment || "start";
    this.itemSelector = options.itemSelector || ".ticker-item";
    this.debounceMs = options.debounceMs || 100;
    this._container = null;
    this._currentIndex = 0;
    this._items = [];
    this._enabled = true;
    this._scrollTimeout = null;
    this._metrics = { snaps: 0, scrolls: 0 };
    this._boundScrollHandler = this._onScroll.bind(this);
    this._subscribers = /* @__PURE__ */ new Set();
  }
  init(container) {
    if (!container) return this;
    this._container = container;
    this._injectStyles();
    this._applyClasses();
    this._attachEvents();
    this.refresh();
    _log("debug", "ScrollSnap initialized");
    return this;
  }
  _injectStyles() {
    if (document.getElementById("ticker-scroll-snap-styles")) return;
    const style = document.createElement("style");
    style.id = "ticker-scroll-snap-styles";
    style.textContent = STYLES;
    document.head.appendChild(style);
  }
  _applyClasses() {
    this._container.classList.add("ticker-scroll-snap");
    if (this.alignment !== "start") {
      this._container.classList.add(`ticker-scroll-snap--${this.alignment}`);
    }
  }
  _attachEvents() {
    this._container.addEventListener("scroll", this._boundScrollHandler, { passive: true });
  }
  _onScroll() {
    this._metrics.scrolls++;
    if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
    this._scrollTimeout = setTimeout(() => {
      this._detectCurrentItem();
    }, this.debounceMs);
  }
  _detectCurrentItem() {
    if (!this._items.length) return;
    const containerRect = this._container.getBoundingClientRect();
    const containerCenter = containerRect.left + containerRect.width / 2;
    let closestIndex = 0;
    let closestDistance = Infinity;
    this._items.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const itemCenter = rect.left + rect.width / 2;
      const distance = Math.abs(containerCenter - itemCenter);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });
    if (closestIndex !== this._currentIndex) {
      const oldIndex = this._currentIndex;
      this._currentIndex = closestIndex;
      this._metrics.snaps++;
      this._notifySubscribers({ oldIndex, newIndex: closestIndex, item: this._items[closestIndex] });
      _log("debug", `Snapped to item ${closestIndex}`);
    }
  }
  refresh() {
    this._items = Array.from(this._container.querySelectorAll(this.itemSelector));
    this._items.forEach((item) => item.classList.add("ticker-scroll-snap-item"));
    _log("debug", `Refreshed: ${this._items.length} items`);
  }
  scrollToIndex(index, behavior = "smooth") {
    if (index < 0 || index >= this._items.length) return;
    const item = this._items[index];
    if (!item) return;
    item.scrollIntoView({ behavior, block: "nearest", inline: this.alignment });
    this._currentIndex = index;
  }
  next() {
    const newIndex = Math.min(this._currentIndex + 1, this._items.length - 1);
    this.scrollToIndex(newIndex);
  }
  previous() {
    const newIndex = Math.max(this._currentIndex - 1, 0);
    this.scrollToIndex(newIndex);
  }
  first() {
    this.scrollToIndex(0);
  }
  last() {
    this.scrollToIndex(this._items.length - 1);
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
  subscribe(callback) {
    this._subscribers.add(callback);
    return () => this._subscribers.delete(callback);
  }
  _notifySubscribers(data) {
    this._subscribers.forEach((cb) => {
      try {
        cb(data);
      } catch (e) {
      }
    });
  }
  enable() {
    this._enabled = true;
    this._container?.classList.add("ticker-scroll-snap");
  }
  disable() {
    this._enabled = false;
    this._container?.classList.remove("ticker-scroll-snap");
  }
  destroy() {
    if (this._scrollTimeout) clearTimeout(this._scrollTimeout);
    if (this._container) {
      this._container.removeEventListener("scroll", this._boundScrollHandler);
      this._container.classList.remove("ticker-scroll-snap", `ticker-scroll-snap--${this.alignment}`);
    }
    this._items.forEach((item) => item.classList.remove("ticker-scroll-snap-item"));
    this._container = null;
    this._items = [];
    this._subscribers.clear();
  }
  healthCheck() {
    const checks = { hasContainer: !!this._container, hasItems: this._items.length > 0, enabled: this._enabled, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 4 ? "HEALTHY" : "DEGRADED", score: `${passed}/4`, itemCount: this._items.length, currentIndex: this._currentIndex, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this._enabled, itemCount: this._items.length, currentIndex: this._currentIndex, alignment: this.alignment, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var scroll_snap_default = ScrollSnap;
export {
  MODULE_ID,
  ScrollSnap,
  VERSION,
  scroll_snap_default as default,
  getPorts,
  getVersion,
  injectPorts
};
