import { renderFlags, renderLoading, renderError, renderEmpty } from "./renderer.js";
const MODULE_ID = "panel-feature-flags-admin/ui/component";
const VERSION = "9.3.0-P2-ENTERPRISE";
class UIComponent {
  constructor(container, logger, options = {}) {
    this.container = container;
    this.logger = logger;
    this.onToggle = options.onToggle || (() => {
    });
    this.onEdit = options.onEdit || (() => {
    });
    this.onDelete = options.onDelete || (() => {
    });
    this.mounted = false;
  }
  async init() {
    if (!this.container) {
      this.logger?.error?.("ui.no-container");
      return;
    }
    this.mounted = true;
    this.logger?.debug?.("ui.init");
  }
  showLoading() {
    if (!this.container) return;
    this.container.innerHTML = renderLoading();
  }
  showError(message) {
    if (!this.container) return;
    this.container.innerHTML = renderError(message);
  }
  showEmpty() {
    if (!this.container) return;
    this.container.innerHTML = renderEmpty();
  }
  update(flags) {
    if (!this.container || !flags) return;
    if (flags.length === 0) {
      this.showEmpty();
      return;
    }
    this.container.innerHTML = renderFlags(flags);
    this._bindCardEvents();
  }
  _bindCardEvents() {
    this.container.querySelectorAll('[data-action="toggle"]').forEach((el) => {
      el.addEventListener("change", () => this.onToggle(el.dataset.flag));
    });
    this.container.querySelectorAll('[data-action="edit"]').forEach((el) => {
      el.addEventListener("click", () => this.onEdit(el.dataset.flag));
    });
    this.container.querySelectorAll('[data-action="delete"]').forEach((el) => {
      el.addEventListener("click", () => this.onDelete(el.dataset.flag));
    });
  }
  async destroy() {
    this.container = null;
    this.mounted = false;
  }
  healthCheck() {
    return { status: this.mounted ? "HEALTHY" : "NOT_MOUNTED", moduleId: MODULE_ID, version: VERSION };
  }
}
var component_default = UIComponent;
export {
  MODULE_ID,
  UIComponent,
  VERSION,
  component_default as default
};
