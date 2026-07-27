const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "login-modal-skeleton";
class LoadingSkeleton {
  constructor(config = {}) {
    this.config = config;
    this.container = null;
    this.mounted = false;
    this._metrics = { shows: 0, hides: 0 };
  }
  getHTML() {
    return `
      <div class="lm-skeleton" data-skeleton="root" aria-hidden="true" aria-label="Carregando...">
        <div class="lm-skeleton-brand">
          <div class="lm-skeleton-logo lm-skeleton-pulse"></div>
        </div>
        <div class="lm-skeleton-form">
          <div class="lm-skeleton-input lm-skeleton-pulse"></div>
          <div class="lm-skeleton-input lm-skeleton-pulse"></div>
          <div class="lm-skeleton-options">
            <div class="lm-skeleton-checkbox lm-skeleton-pulse"></div>
            <div class="lm-skeleton-link lm-skeleton-pulse"></div>
          </div>
          <div class="lm-skeleton-button lm-skeleton-pulse"></div>
        </div>
      </div>
    `;
  }
  getCSS() {
    return `
      .lm-skeleton { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem; background: rgba(15, 23, 42, 0.95); z-index: 10; }
      .lm-skeleton-brand { margin-bottom: 2rem; }
      .lm-skeleton-logo { width: 120px; height: 40px; border-radius: 8px; background: rgba(255,255,255,0.1); }
      .lm-skeleton-form { width: 100%; max-width: 320px; display: flex; flex-direction: column; gap: 1rem; }
      .lm-skeleton-input { height: 56px; border-radius: 12px; background: rgba(255,255,255,0.08); }
      .lm-skeleton-options { display: flex; justify-content: space-between; align-items: center; }
      .lm-skeleton-checkbox { width: 100px; height: 20px; border-radius: 4px; background: rgba(255,255,255,0.08); }
      .lm-skeleton-link { width: 120px; height: 16px; border-radius: 4px; background: rgba(255,255,255,0.08); }
      .lm-skeleton-button { height: 48px; border-radius: 12px; background: linear-gradient(135deg, rgba(139,92,246,0.3), rgba(168,85,247,0.3)); }
      .lm-skeleton-pulse { animation: lm-skeleton-pulse 1.5s ease-in-out infinite; }
      @keyframes lm-skeleton-pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 0.8; } }
      .lm-skeleton.lm-skeleton-hidden { opacity: 0; pointer-events: none; transition: opacity 0.3s ease; }
    `;
  }
  mount(container) {
    if (!container) return false;
    this.container = container;
    if (!document.querySelector("style[data-skeleton-css]")) {
      const style = document.createElement("style");
      style.setAttribute("data-skeleton-css", "true");
      style.textContent = this.getCSS();
      document.head.appendChild(style);
    }
    this.mounted = true;
    return true;
  }
  show(container) {
    this._metrics.shows++;
    const target = container || this.container;
    if (!target) return;
    let skeleton = target.querySelector('[data-skeleton="root"]');
    if (!skeleton) {
      target.insertAdjacentHTML("afterbegin", this.getHTML());
      skeleton = target.querySelector('[data-skeleton="root"]');
    }
    skeleton?.classList.remove("lm-skeleton-hidden");
  }
  hide(container, delay = 300) {
    this._metrics.hides++;
    const target = container || this.container;
    if (!target) return;
    const skeleton = target.querySelector('[data-skeleton="root"]');
    if (skeleton) {
      skeleton.classList.add("lm-skeleton-hidden");
      setTimeout(() => skeleton.remove(), delay);
    }
  }
  unmount() {
    if (this.container) {
      const skeleton = this.container.querySelector('[data-skeleton="root"]');
      skeleton?.remove();
    }
    this.mounted = false;
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, metrics: { ...this._metrics }, timestamp: Date.now() };
  }
  healthCheck() {
    const checks = { mounted: this.mounted, hasContainer: !!this.container };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  }
}
var skeleton_default = LoadingSkeleton;
export {
  LoadingSkeleton,
  MODULE_ID,
  VERSION,
  skeleton_default as default
};
