import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "10.1.0-MIGRATION-PHASE3";
const MODULE_ID = "panel-nav-admin.ui.virtual-scroll";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const DEFAULT_THRESHOLD = 50;
class VirtualScroll {
  /**
   * @param {HTMLElement} container — Scrollable container
   * @param {Object} [options]
   * @param {number} [options.rowHeight=56] — Height of each row in px
   * @param {number} [options.bufferSize=5] — Extra rows rendered above/below viewport
   * @param {number} [options.threshold=50] — Minimum items to activate virtualization
   * @param {Function} [options.renderRow] — (item, index) => HTML string
   */
  constructor(container, options = {}) {
    this._container = container;
    this._rowHeight = options.rowHeight || 56;
    this._bufferSize = options.bufferSize || 5;
    this._threshold = options.threshold || DEFAULT_THRESHOLD;
    this._renderRow = options.renderRow || ((item) => '<div class="pna-virtual-row">' + (item.label || item.id || "") + "</div>");
    this._data = [];
    this._viewport = null;
    this._spacer = null;
    this._content = null;
    this._scrollHandler = null;
    this._lastStart = -1;
    this._lastEnd = -1;
    this._active = false;
  }
  /**
   * Initialize the virtual scroll DOM structure.
   */
  init() {
    if (!this._container) return;
    this._viewport = document.createElement("div");
    this._viewport.className = "pna-virtual-viewport";
    this._viewport.style.overflow = "auto";
    this._viewport.style.position = "relative";
    this._spacer = document.createElement("div");
    this._spacer.className = "pna-virtual-spacer";
    this._content = document.createElement("div");
    this._content.className = "pna-virtual-content";
    this._content.style.position = "relative";
    this._viewport.appendChild(this._spacer);
    this._viewport.appendChild(this._content);
    this._scrollHandler = () => this._onScroll();
    this._viewport.addEventListener("scroll", this._scrollHandler, { passive: true });
  }
  /**
   * Set data and render. If below threshold, renders all items normally.
   * @param {Array<Object>} data
   */
  setData(data) {
    this._data = data || [];
    this._active = this._data.length >= this._threshold;
    this._lastStart = -1;
    this._lastEnd = -1;
    if (!this._container) return;
    if (!this._active) {
      this._renderAll();
      return;
    }
    if (!this._viewport) this.init();
    this._container.innerHTML = "";
    this._container.appendChild(this._viewport);
    const totalHeight = this._data.length * this._rowHeight;
    this._spacer.style.height = totalHeight + "px";
    this._render();
  }
  /**
   * Update the renderRow function.
   * @param {Function} fn — (item, index) => HTML
   */
  setRenderRow(fn) {
    this._renderRow = fn;
    if (this._active) {
      this._lastStart = -1;
      this._render();
    }
  }
  /** @private Render all items without virtualization */
  _renderAll() {
    if (!this._container) return;
    let html = "";
    for (let i = 0; i < this._data.length; i++) {
      html += this._renderRow(this._data[i], i);
    }
    this._container.innerHTML = html;
  }
  /** @private Handle scroll events */
  _onScroll() {
    if (!this._active) return;
    requestAnimationFrame(() => this._render());
  }
  /** @private Render visible rows */
  _render() {
    if (!this._viewport || !this._content) return;
    const scrollTop = this._viewport.scrollTop;
    const viewportHeight = this._viewport.clientHeight;
    const startIdx = Math.max(0, Math.floor(scrollTop / this._rowHeight) - this._bufferSize);
    const endIdx = Math.min(
      this._data.length,
      Math.ceil((scrollTop + viewportHeight) / this._rowHeight) + this._bufferSize
    );
    if (startIdx === this._lastStart && endIdx === this._lastEnd) return;
    this._lastStart = startIdx;
    this._lastEnd = endIdx;
    let html = "";
    for (let i = startIdx; i < endIdx; i++) {
      html += '<div class="pna-virtual-item" style="position:absolute;top:' + i * this._rowHeight + "px;width:100%;height:" + this._rowHeight + 'px;" data-index="' + i + '">' + this._renderRow(this._data[i], i) + "</div>";
    }
    this._content.innerHTML = html;
  }
  /**
   * Scroll to a specific item by index.
   * @param {number} index
   */
  scrollToIndex(index) {
    if (!this._viewport || !this._active) return;
    this._viewport.scrollTop = index * this._rowHeight;
  }
  /** @returns {boolean} Whether virtual scroll is active */
  isActive() {
    return this._active;
  }
  /** @returns {number} Total items count */
  getCount() {
    return this._data.length;
  }
  /** @returns {{ start: number, end: number }} Currently visible range */
  getVisibleRange() {
    return { start: Math.max(0, this._lastStart), end: Math.max(0, this._lastEnd) };
  }
  /** Cleanup */
  destroy() {
    if (this._viewport && this._scrollHandler) {
      this._viewport.removeEventListener("scroll", this._scrollHandler);
    }
    if (this._viewport && this._viewport.parentNode) {
      this._viewport.remove();
    }
    this._container = null;
    this._viewport = null;
    this._spacer = null;
    this._content = null;
    this._data = [];
    this._scrollHandler = null;
  }
}
function createVirtualScroll(container, options = {}) {
  return new VirtualScroll(container, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, defaultThreshold: DEFAULT_THRESHOLD };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION };
}
var virtual_scroll_default = { VirtualScroll, createVirtualScroll, DEFAULT_THRESHOLD, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  DEFAULT_THRESHOLD,
  MODULE_ID,
  VERSION,
  VirtualScroll,
  createVirtualScroll,
  virtual_scroll_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
