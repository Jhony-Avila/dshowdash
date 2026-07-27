const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/toolbar";
class ToolbarComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.onAction = options.onAction || (() => {
    });
    this._listener = null;
  }
  render(state = {}) {
    if (!this.container) return;
    const { loading, autoRefresh, countdown } = state;
    this.container.innerHTML = `
      <div class="p01-toolbar">
        <div class="p01-toolbar-left">
          <div class="p01-auto-refresh">
            <button class="p01-auto-toggle ${autoRefresh ? "active" : ""}" data-action="toggle-auto-refresh" title="Auto-refresh">
              <span class="p01-sr-only">Auto-refresh</span>
            </button>
            <span class="p01-countdown ${autoRefresh ? "active" : ""}" data-countdown>${countdown || 30}s</span>
          </div>
        </div>
        
        <div class="p01-toolbar-center">
          <div class="p01-density-cluster">
            <button class="p01-density-btn ${state.density === "compact" ? "active" : ""}" data-density="compact" title="Compacto">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="10" x2="20" y2="10"/><line x1="4" y1="14" x2="20" y2="14"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
            </button>
            <button class="p01-density-btn ${state.density === "normal" ? "active" : ""}" data-density="normal" title="Normal">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="5" x2="20" y2="5"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="19" x2="20" y2="19"/></svg>
            </button>
            <button class="p01-density-btn ${state.density === "comfortable" ? "active" : ""}" data-density="comfortable" title="Confort\xE1vel">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" y1="4" x2="20" y2="4"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="20" x2="20" y2="20"/></svg>
            </button>
          </div>
        </div>
        
        <div class="p01-toolbar-right">
          <div class="p01-actions-cluster">
            <button class="p01-action-btn p01-action-btn--refresh ${loading ? "p01-action-btn--loading" : ""}" data-action="refresh" title="Atualizar (R)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>
            </button>
            <button class="p01-action-btn p01-action-btn--export" data-action="export" title="Exportar (E)">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            </button>
            <button class="p01-action-btn p01-action-btn--print" data-action="print" title="Imprimir">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            </button>
          </div>
        </div>
      </div>
    `;
    this._bindEvents();
  }
  _bindEvents() {
    if (this._listener) this.container.removeEventListener("click", this._listener);
    this._listener = (e) => {
      const btn = e.target.closest("[data-action]");
      if (btn) {
        this.onAction(btn.dataset.action);
        return;
      }
      const density = e.target.closest("[data-density]");
      if (density) {
        this.onAction("set-density", density.dataset.density);
      }
    };
    this.container.addEventListener("click", this._listener);
  }
  updateCountdown(seconds) {
    const el = this.container?.querySelector("[data-countdown]");
    if (el) el.textContent = `${seconds}s`;
  }
  setLoading(loading) {
    const btn = this.container?.querySelector('[data-action="refresh"]');
    btn?.classList.toggle("p01-action-btn--loading", loading);
  }
  setAutoRefresh(active) {
    this.container?.querySelector(".p01-auto-toggle")?.classList.toggle("active", active);
    this.container?.querySelector(".p01-countdown")?.classList.toggle("active", active);
  }
  setDensity(density) {
    this.container?.querySelectorAll("[data-density]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.density === density);
    });
  }
  destroy() {
    if (this._listener && this.container) {
      this.container.removeEventListener("click", this._listener);
    }
    this._listener = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var toolbar_default = ToolbarComponent;
export {
  MODULE_ID,
  ToolbarComponent,
  VERSION,
  toolbar_default as default,
  healthCheck,
  info
};
