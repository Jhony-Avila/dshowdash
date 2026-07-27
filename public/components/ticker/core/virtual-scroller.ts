// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ticker.core.virtual-scroller
// PURPOSE: Virtual Scroller - Ticker Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'scroll'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'ticker.core.virtual-scroller';
const hasWindow = typeof window !== 'undefined';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _log = (level: string, ...args: unknown[]) => { const logger = _getPort('logger'); if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args); };
export class VirtualScroller {
  [key: string]: any;
  constructor(options: { container?: HTMLElement | null; itemWidth?: number; buffer?: number } = {}) { this.container = options.container || null; this.itemWidth = options.itemWidth || 300; this.buffer = options.buffer || 2; this.items = []; this._visibleItems = []; this._startIndex = 0; this._endIndex = 0; this._scrollLeft = 0; this._containerWidth = 0; this._totalWidth = 0; this._rafId = null; this._resizeObserver = null; this._scrollHandler = this._onScroll.bind(this); this._metrics = { renders: 0, recycled: 0, created: 0 }; this._initialized = false; this._renderCallback = null; }
  init(container: unknown, renderCallback: (...args: unknown[]) => void) { if (this._initialized) return this; this.container = container || this.container; this._renderCallback = renderCallback; if (!this.container) { _log('error', 'Container required'); return this; } this._containerWidth = this.container.offsetWidth; this.container.style.overflow = 'hidden'; this.container.style.position = 'relative'; this._setupResizeObserver(); this._setupScrollListener(); this._initialized = true; _log('info', 'VirtualScroller initialized', { containerWidth: this._containerWidth }); return this; }
  setItems(items: unknown[]) { this.items = Array.isArray(items) ? items : []; this._totalWidth = this.items.length * this.itemWidth; this._calculateVisibleRange(); this._render(); _log('debug', `Items set: ${this.items.length}, totalWidth: ${this._totalWidth}px`); }
  _setupResizeObserver() { if (typeof ResizeObserver === 'undefined') return; this._resizeObserver = new ResizeObserver(entries => { for (const entry of entries) { this._containerWidth = entry.contentRect.width; this._calculateVisibleRange(); this._render(); } }); this._resizeObserver.observe(this.container); }
  _setupScrollListener() { this.container.addEventListener('scroll', this._scrollHandler, { passive: true }); }
  _onScroll() { if (this._rafId) return; this._rafId = requestAnimationFrame(() => { this._scrollLeft = this.container.scrollLeft; this._calculateVisibleRange(); this._render(); this._rafId = null; }); }
  _calculateVisibleRange() { const visibleStart = this._scrollLeft; const visibleEnd = this._scrollLeft + this._containerWidth; this._startIndex = Math.max(0, Math.floor(visibleStart / this.itemWidth) - this.buffer); this._endIndex = Math.min(this.items.length - 1, Math.ceil(visibleEnd / this.itemWidth) + this.buffer); }
  _render() { if (!this._renderCallback) return; const visibleItems = []; for (let i = this._startIndex; i <= this._endIndex && i < this.items.length; i++) { visibleItems.push({ index: i, item: this.items[i], offset: i * this.itemWidth }); } this._visibleItems = visibleItems; this._renderCallback(visibleItems, { totalWidth: this._totalWidth, startIndex: this._startIndex, endIndex: this._endIndex }); this._metrics.renders++; }
  getVisibleItems() { return this._visibleItems; }
  getVisibleRange() { return { start: this._startIndex, end: this._endIndex }; }
  scrollToIndex(index: number, behavior: string = 'smooth') { if (!this.container || index < 0 || index >= this.items.length) return; const offset = index * this.itemWidth; this.container.scrollTo({ left: offset, behavior }); }
  scrollToStart(behavior: string = 'smooth') { this.scrollToIndex(0, behavior); }
  scrollToEnd(behavior: string = 'smooth') { this.scrollToIndex(this.items.length - 1, behavior); }
  refresh() { this._containerWidth = this.container?.offsetWidth || 0; this._calculateVisibleRange(); this._render(); }
  destroy() { if (this._rafId) { cancelAnimationFrame(this._rafId); this._rafId = null; } if (this._resizeObserver) { this._resizeObserver.disconnect(); this._resizeObserver = null; } if (this.container) { this.container.removeEventListener('scroll', this._scrollHandler); } this.container = null; this.items = []; this._visibleItems = []; this._initialized = false; _log('debug', 'VirtualScroller destroyed'); }
  healthCheck() { const logger = _getPort('logger'); const checks = { initialized: this._initialized, hasContainer: !!this.container, hasItems: this.items.length > 0, loggerReady: !!logger, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed === 5 ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/5`, visibleCount: this._visibleItems.length, totalItems: this.items.length, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, itemCount: this.items.length, visibleCount: this._visibleItems.length, visibleRange: this.getVisibleRange(), itemWidth: this.itemWidth, containerWidth: this._containerWidth, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() }; }
}
export function getVersion() { return VERSION; }
export default VirtualScroller;
