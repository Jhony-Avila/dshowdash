// ═════════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═════════════════════════════════════════════════════════════════
// MODULE: header/core/virtual-scroller
// PURPOSE: Virtual scrolling engine for long component lists,
//          rendering only visible items plus a configurable
//          buffer for optimal DOM performance.
// ─────────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   create(options) — factory to create a VirtualScroller
//   VirtualScroller(options) — constructor
//   .init() — create DOM structure and attach listeners
//   .setItems / .addItems / .removeItem / .updateItem
//   .scrollToIndex / .scrollToTop / .scrollToBottom
//   .getVisibleRange() / .getMetrics() / .refresh()
//   .healthCheck() / .destroy()
//   healthCheck() / info() — module-level diagnostics
//   injectPorts(p) / getPorts()
// LISTENS (eventos):
//   container scroll — triggers virtual render on scroll
//   ResizeObserver on container — triggers re-render on resize
// ═════════════════════════════════════════════════════════════════
// Header - Virtual Scroller
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B12: var → const/let
// Virtual scrolling para listas longas de componentes
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/virtual-scroller';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

function VirtualScroller(this: any, options: Record<string,unknown>) {
  options = options || {};
  this.container = options.container || null;
  this.itemHeight = options.itemHeight || 50;
  this.bufferSize = options.bufferSize || 5;
  this.renderItem = options.renderItem || (() => '');
  this.onRender = options.onRender || null;
  this.items = [];
  this._viewport = null;
  this._content = null;
  this._scrollTop = 0;
  this._visibleStart = 0;
  this._visibleEnd = 0;
  this._renderedItems = new Map();
  this._resizeObserver = null;
  this._scrollHandler = null;
  this._initialized = false;
  this._metrics = { renders: 0, recycled: 0, created: 0, scrollEvents: 0 };
}

VirtualScroller.prototype.init = function() {
  if (this._initialized) return this;
  if (!this.container) {
    _log('error', 'Container nao definido');
    return this;
  }
  this._createStructure();
  this._setupListeners();
  this._initialized = true;
  _log('info', 'VirtualScroller inicializado');
  return this;
};

VirtualScroller.prototype._createStructure = function() {
  this.container.style.overflow = 'auto';
  this.container.style.position = 'relative';
  this._viewport = document.createElement('div');
  this._viewport.className = 'virtual-scroller-viewport';
  this._viewport.style.position = 'relative';
  this._viewport.style.width = '100%';
  this._content = document.createElement('div');
  this._content.className = 'virtual-scroller-content';
  this._content.style.position = 'absolute';
  this._content.style.top = '0';
  this._content.style.left = '0';
  this._content.style.width = '100%';
  this._viewport.appendChild(this._content);
  this.container.appendChild(this._viewport);
};

VirtualScroller.prototype._setupListeners = function() {
  const self = this;
  this._scrollHandler = () => {
    self._metrics.scrollEvents++;
    self._onScroll();
  };
  this.container.addEventListener('scroll', this._scrollHandler, { passive: true });
  if (window.ResizeObserver) {
    this._resizeObserver = new ResizeObserver(() => {
      self._onResize();
    });
    this._resizeObserver.observe(this.container);
  }
};

VirtualScroller.prototype.setItems = function(items: unknown[]) {
  this.items = items || [];
  this._updateViewportHeight();
  this._render();
  return this;
};

VirtualScroller.prototype.addItems = function(newItems: unknown[]) {
  this.items = this.items.concat(newItems);
  this._updateViewportHeight();
  this._render();
  return this;
};

VirtualScroller.prototype.removeItem = function(index: number) {
  if (index >= 0 && index < this.items.length) {
    this.items.splice(index, 1);
    this._updateViewportHeight();
    this._render();
  }
  return this;
};

VirtualScroller.prototype.updateItem = function(index: number, item: Record<string,unknown>) {
  if (index >= 0 && index < this.items.length) {
    this.items[index] = item;
    if (index >= this._visibleStart && index <= this._visibleEnd) {
      this._renderItem(index);
    }
  }
  return this;
};

VirtualScroller.prototype._updateViewportHeight = function() {
  const totalHeight = this.items.length * this.itemHeight;
  this._viewport.style.height = `${totalHeight}px`;
};

VirtualScroller.prototype._onScroll = function() {
  this._scrollTop = this.container.scrollTop;
  this._render();
};

VirtualScroller.prototype._onResize = function() {
  this._render();
};

VirtualScroller.prototype._render = function() {
  const containerHeight = this.container.clientHeight;
  const startIndex = Math.floor(this._scrollTop / this.itemHeight);
  const visibleCount = Math.ceil(containerHeight / this.itemHeight);
  this._visibleStart = Math.max(0, startIndex - this.bufferSize);
  this._visibleEnd = Math.min(this.items.length - 1, startIndex + visibleCount + this.bufferSize);
  this._metrics.renders++;
  const fragment = document.createDocumentFragment();
  // @ts-expect-error strict migration — TS7034
  const toRemove = [];
  const self = this;
  this._renderedItems.forEach((el: HTMLElement|null, idx: unknown) => {
    // @ts-expect-error strict migration — TS18046
    if (idx < self._visibleStart || idx > self._visibleEnd) {
      toRemove.push(idx);
    }
  });
  // @ts-expect-error strict migration — TS7005
  toRemove.forEach(idx => {
    const el = self._renderedItems.get(idx);
    if (el && el.parentNode) {
      el.parentNode.removeChild(el);
    }
    self._renderedItems.delete(idx);
    self._metrics.recycled++;
  });
  for (let i = this._visibleStart; i <= this._visibleEnd; i++) {
    if (!this._renderedItems.has(i)) {
      const el = this._createItemElement(i);
      fragment.appendChild(el);
      this._renderedItems.set(i, el);
      this._metrics.created++;
    }
  }
  this._content.appendChild(fragment);
  this._content.style.transform = `translateY(${this._visibleStart * this.itemHeight}px)`;
  if (typeof this.onRender === 'function') {
    this.onRender({ start: this._visibleStart, end: this._visibleEnd, rendered: this._renderedItems.size });
  }
};

VirtualScroller.prototype._createItemElement = function(index: number) {
  const item = this.items[index];
  const el = document.createElement('div');
  el.className = 'virtual-scroller-item';
  el.style.height = `${this.itemHeight}px`;
  el.style.boxSizing = 'border-box';
  // @ts-expect-error TS migration - TS2345
  el.setAttribute('data-index', index);
  const content = this.renderItem(item, index);
  if (typeof content === 'string') {
    el.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    el.appendChild(content);
  }
  return el;
};

VirtualScroller.prototype._renderItem = function(index: number) {
  const el = this._renderedItems.get(index);
  if (!el) return;
  const item = this.items[index];
  const content = this.renderItem(item, index);
  if (typeof content === 'string') {
    el.innerHTML = content;
  }
};

VirtualScroller.prototype.scrollToIndex = function(index: number, behavior: unknown) {
  behavior = behavior || 'smooth';
  const top = index * this.itemHeight;
  this.container.scrollTo({ top, behavior });
  return this;
};

VirtualScroller.prototype.scrollToTop = function() {
  this.container.scrollTo({ top: 0, behavior: 'smooth' });
  return this;
};

VirtualScroller.prototype.scrollToBottom = function() {
  this.container.scrollTo({ top: this._viewport.offsetHeight, behavior: 'smooth' });
  return this;
};

VirtualScroller.prototype.getVisibleRange = function() {
  return { start: this._visibleStart, end: this._visibleEnd, count: this._visibleEnd - this._visibleStart + 1 };
};

VirtualScroller.prototype.getMetrics = function() {
  return Object.assign({}, this._metrics, { itemsTotal: this.items.length, itemsRendered: this._renderedItems.size });
};

VirtualScroller.prototype.refresh = function() {
  this._renderedItems.forEach((el: HTMLElement|null) => {
    // @ts-expect-error strict migration — TS2345
    if (el!.parentNode) el!.parentNode.removeChild(el);
  });
  this._renderedItems.clear();
  this._render();
  return this;
};

VirtualScroller.prototype.destroy = function() {
  if (this._scrollHandler) {
    this.container.removeEventListener('scroll', this._scrollHandler);
  }
  if (this._resizeObserver) {
    this._resizeObserver.disconnect();
  }
  this._renderedItems.clear();
  if (this._viewport && this._viewport.parentNode) {
    this._viewport.parentNode.removeChild(this._viewport);
  }
  this._initialized = false;
};

VirtualScroller.prototype.healthCheck = function() {
  const checks = { initialized: this._initialized, hasContainer: !!this.container, hasItems: this.items.length > 0, hasViewport: !!this._viewport };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, checks };
};

function create(options: Record<string,unknown>) {
  _initPorts();
  return (new (VirtualScroller as unknown as { new(..._args: unknown[]): {[k:string]:Function} })(options));
}

function healthCheck() {
  const checks = { portsInitialized: Ports.isInitialized() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() };
}

export { create, VirtualScroller, healthCheck, info };
export default { VERSION, MODULE_ID, create, VirtualScroller, healthCheck, info };
