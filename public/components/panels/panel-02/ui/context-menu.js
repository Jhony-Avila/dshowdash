const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02/ui/context-menu";
class ContextMenu {
  constructor(options = {}) {
    this.onAction = options.onAction || (() => {
    });
    this.element = null;
    this.currentJob = null;
    this._clickOutside = null;
    this._abortController = null;
  }
  init() {
    if (this.element) return;
    this.element = document.createElement("div");
    this.element.className = "p02-context-menu";
    this.element.innerHTML = '<div class="p02-context-item" data-action="view-details"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>Ver Detalhes</div><div class="p02-context-item" data-action="view-logs"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>Ver Logs</div><div class="p02-context-divider"></div><div class="p02-context-item" data-action="run-job"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>Executar Agora</div><div class="p02-context-item" data-action="pause-job"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>Pausar Job</div><div class="p02-context-divider"></div><div class="p02-context-item" data-action="copy-id"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>Copiar ID</div><div class="p02-context-item" data-action="export-job"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>Exportar Job</div>';
    document.body.appendChild(this.element);
    this.element.addEventListener("click", (e) => {
      const item = e.target.closest("[data-action]");
      if (item && this.currentJob) {
        this.onAction(item.dataset.action, this.currentJob);
        this.close();
      }
    });
    this._clickOutside = (e) => {
      if (!this.element.contains(e.target)) this.close();
    };
  }
  show(x, y, job) {
    if (!this.element) this.init();
    this.currentJob = job;
    this.element.style.left = `${x}px`;
    this.element.style.top = `${y}px`;
    this.element.classList.add("open");
    const rect = this.element.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      this.element.style.left = `${x - rect.width}px`;
    }
    if (rect.bottom > window.innerHeight) {
      this.element.style.top = `${y - rect.height}px`;
    }
    if (this._abortController) {
      this._abortController.abort();
    }
    this._abortController = new AbortController();
    setTimeout(() => document.addEventListener("click", this._clickOutside, { signal: this._abortController.signal }), 10);
  }
  close() {
    this.element?.classList.remove("open");
    this.currentJob = null;
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this.element?.remove();
    this.element = null;
  }
}
var context_menu_default = ContextMenu;
export {
  ContextMenu,
  MODULE_ID,
  VERSION,
  context_menu_default as default
};
