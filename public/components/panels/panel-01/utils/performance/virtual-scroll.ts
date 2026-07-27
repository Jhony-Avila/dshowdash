// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/performance/virtual-scroll
// PURPOSE: Panel-01 - Virtualizacao de Tabela
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createVirtualScroll() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/performance/virtual-scroll';

export class VirtualScroll {
  [key: string]: any;
  constructor(container: HTMLElement, options: { rowHeight?: number; bufferSize?: number; onRenderRows?: Function } = {}) {
    this.container = container;
    this.rowHeight = options.rowHeight || 44;
    this.bufferSize = options.bufferSize || 5;
    this.items = [];
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this._scrollHandler = null;
    this._resizeObserver = null;
    this.onRenderRows = options.onRenderRows || (() => {});
  }

  init() {
    if (!this.container) return;
    this._scrollHandler = this._onScroll.bind(this);
    this.container.addEventListener('scroll', this._scrollHandler, { passive: true });
    this._resizeObserver = new ResizeObserver(() => this._calculate());
    this._resizeObserver.observe(this.container);
  }

  setItems(items: unknown[]) {
    this.items = items || [];
    this._calculate();
  }

  _calculate() {
    if (!this.container || !this.items.length) return;
    const containerHeight = this.container.clientHeight;
    const scrollTop = this.container.scrollTop;
    const totalHeight = this.items.length * this.rowHeight;
    const visibleCount = Math.ceil(containerHeight / this.rowHeight);
    this.visibleStart = Math.max(0, Math.floor(scrollTop / this.rowHeight) - this.bufferSize);
    this.visibleEnd = Math.min(this.items.length, this.visibleStart + visibleCount + (this.bufferSize * 2));
    this._render(totalHeight);
  }

  _render(totalHeight: number) {
    const visibleItems = this.items.slice(this.visibleStart, this.visibleEnd);
    const offsetY = this.visibleStart * this.rowHeight;
    this.onRenderRows({
      items: visibleItems,
      startIndex: this.visibleStart,
      endIndex: this.visibleEnd,
      offsetY,
      totalHeight,
      totalItems: this.items.length
    });
  }

  _onScroll() {
    requestAnimationFrame(() => this._calculate());
  }

  scrollToIndex(index: number) {
    if (!this.container) return;
    const scrollTop = index * this.rowHeight;
    this.container.scrollTop = scrollTop;
  }

  scrollToTop() { if (this.container) this.container.scrollTop = 0; }
  scrollToBottom() { if (this.container) this.container.scrollTop = this.items.length * this.rowHeight; }

  getVisibleRange() {
    return { start: this.visibleStart, end: this.visibleEnd, count: this.visibleEnd - this.visibleStart };
  }

  refresh() { this._calculate(); }

  destroy() {
    if (this._scrollHandler && this.container) {
      this.container.removeEventListener('scroll', this._scrollHandler);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    this.items = [];
  }
}

export function createVirtualScroll(container: HTMLElement, options: Record<string, unknown> = {}) { return new VirtualScroll(container, options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { VirtualScroll, createVirtualScroll };
