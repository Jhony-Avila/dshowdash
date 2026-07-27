const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/context-menu";
class ContextMenu {
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {
    });
    this.element = null;
    this.currentItem = null;
    this._clickOutside = null;
    this._showTimeout = null;
    this._abortController = null;
  }
  init() {
    if (this.element) return;
    this.element = document.createElement("div");
    this.element.className = "p01-context-menu";
    this.element.innerHTML = `
      <div class="p01-context-item" data-action="view">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
        Ver Detalhes
      </div>
      <div class="p01-context-item" data-action="copy-id">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>
        Copiar ID
      </div>
      <div class="p01-context-divider"></div>
      <div class="p01-context-item" data-action="export-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
        Exportar
      </div>
      <div class="p01-context-item" data-action="print-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
        Imprimir
      </div>
    `;
    document.body.appendChild(this.element);
    this.element.addEventListener("click", (e) => {
      const item = e.target.closest("[data-action]");
      if (item && this.currentItem) {
        this.onAction(item.dataset.action, this.currentItem);
        this.close();
      }
    });
    this._clickOutside = (e) => {
      if (!this.element.contains(e.target)) this.close();
    };
  }
  show(x, y, item) {
    if (!this.element) this.init();
    this.currentItem = item;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.classList.add("open");
    const rect = this.element.getBoundingClientRect();
    if (rect.right > window.innerWidth) this.element.style.left = `${x - rect.width}px`;
    if (rect.bottom > window.innerHeight) this.element.style.top = `${y - rect.height}px`;
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    this._showTimeout = setTimeout(() => {
      document.addEventListener("click", this._clickOutside, { signal: this._abortController.signal });
    }, 10);
  }
  close() {
    this.element?.classList.remove("open");
    this.currentItem = null;
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }
  destroy() {
    if (this._showTimeout) {
      clearTimeout(this._showTimeout);
      this._showTimeout = null;
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this.element?.remove();
    this.element = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var context_menu_default = ContextMenu;
export {
  ContextMenu,
  MODULE_ID,
  VERSION,
  context_menu_default as default,
  healthCheck,
  info
};
