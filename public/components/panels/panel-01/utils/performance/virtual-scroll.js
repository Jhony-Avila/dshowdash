const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/performance/virtual-scroll";
class VirtualScroll {
  constructor(container, options = {}) {
    this.container = container;
    this.rowHeight = options.rowHeight || 44;
    this.bufferSize = options.bufferSize || 5;
    this.items = [];
    this.visibleStart = 0;
    this.visibleEnd = 0;
    this._scrollHandler = null;
    this._resizeObserver = null;
    this.onRenderRows = options.onRenderRows || (() => {
    });
  }
  init() {
    if (!this.container) return;
    this._scrollHandler = this._onScroll.bind(this);
    this.container.addEventListener("scroll", this._scrollHandler, { passive: true });
    this._resizeObserver = new ResizeObserver(() => this._calculate());
    this._resizeObserver.observe(this.container);
  }
  setItems(items) {
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
    this.visibleEnd = Math.min(this.items.length, this.visibleStart + visibleCount + this.bufferSize * 2);
    this._render(totalHeight);
  }
  _render(totalHeight) {
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
  scrollToIndex(index) {
    if (!this.container) return;
    const scrollTop = index * this.rowHeight;
    this.container.scrollTop = scrollTop;
  }
  scrollToTop() {
    if (this.container) this.container.scrollTop = 0;
  }
  scrollToBottom() {
    if (this.container) this.container.scrollTop = this.items.length * this.rowHeight;
  }
  getVisibleRange() {
    return { start: this.visibleStart, end: this.visibleEnd, count: this.visibleEnd - this.visibleStart };
  }
  refresh() {
    this._calculate();
  }
  destroy() {
    if (this._scrollHandler && this.container) {
      this.container.removeEventListener("scroll", this._scrollHandler);
    }
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
    this.items = [];
  }
}
function createVirtualScroll(container, options = {}) {
  return new VirtualScroll(container, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var virtual_scroll_default = { VirtualScroll, createVirtualScroll };
export {
  MODULE_ID,
  VERSION,
  VirtualScroll,
  createVirtualScroll,
  virtual_scroll_default as default,
  healthCheck,
  info
};
