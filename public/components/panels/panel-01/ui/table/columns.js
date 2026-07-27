import { COLUMNS } from "./constants.js";
import * as Storage from "../../utils/storage.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/columns";
class ColumnsManager {
  constructor(options = {}) {
    this.columns = options.columns || [...COLUMNS];
    this.onColumnsChange = options.onColumnsChange || (() => {
    });
    this._dropdown = null;
    this._visible = false;
    this._abortController = null;
  }
  init() {
    const saved = Storage.getColumns();
    if (saved) {
      const savedMap = saved;
      this.columns = this.columns.map((col) => ({
        ...col,
        visible: savedMap[col.id] !== void 0 ? savedMap[col.id] : col.visible
      }));
    }
  }
  toggle(columnId) {
    const col = this.columns.find((c) => c.id === columnId);
    if (col && col.id !== "select" && col.id !== "actions") {
      col.visible = !col.visible;
      this._save();
      this.onColumnsChange(this.columns);
    }
  }
  setVisible(columnId, visible) {
    const col = this.columns.find((c) => c.id === columnId);
    if (col) {
      col.visible = visible;
      this._save();
      this.onColumnsChange(this.columns);
    }
  }
  getVisible() {
    return this.columns.filter((c) => c.visible);
  }
  getAll() {
    return this.columns;
  }
  reset() {
    this.columns = this.columns.map((col) => ({
      ...col,
      visible: COLUMNS.find((c) => c.id === col.id)?.visible ?? true
    }));
    this._save();
    this.onColumnsChange(this.columns);
  }
  _save() {
    const state = {};
    this.columns.forEach((c) => {
      state[c.id] = c.visible;
    });
    Storage.setColumns(state);
  }
  renderDropdown(container) {
    if (!container) return;
    const toggleable = this.columns.filter((c) => c.id !== "select" && c.id !== "actions");
    container.innerHTML = `
      <div class="p01-columns-dropdown">
        <button class="p01-control-btn" data-action="toggle-columns" title="Colunas">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
        </button>
        <div class="p01-columns-menu">
          <div class="p01-columns-menu-header">Colunas vis\xEDveis</div>
          ${toggleable.map((col) => `
            <label class="p01-columns-item">
              <input type="checkbox" ${col.visible ? "checked" : ""} data-column="${col.id}">
              <span>${col.label}</span>
            </label>
          `).join("")}
          <div class="p01-columns-menu-footer">
            <button class="p01-btn p01-btn--sm p01-btn--ghost" data-action="reset-columns">Restaurar</button>
          </div>
        </div>
      </div>
    `;
    this._dropdown = container.querySelector(".p01-columns-menu");
    if (this._abortController) this._abortController.abort();
    this._abortController = new AbortController();
    const signal = this._abortController.signal;
    container.querySelector('[data-action="toggle-columns"]')?.addEventListener("click", () => {
      this._toggleDropdown();
    }, { signal });
    container.querySelectorAll("[data-column]").forEach((cb) => {
      cb.addEventListener("change", () => this.toggle(cb.dataset.column), { signal });
    });
    container.querySelector('[data-action="reset-columns"]')?.addEventListener("click", () => {
      this.reset();
      this._updateCheckboxes(container);
    }, { signal });
    document.addEventListener("click", (e) => {
      if (!container.contains(e.target)) this._hideDropdown();
    }, { signal });
  }
  _toggleDropdown() {
    this._visible = !this._visible;
    this._dropdown?.classList.toggle("open", this._visible);
  }
  _hideDropdown() {
    this._visible = false;
    this._dropdown?.classList.remove("open");
  }
  _updateCheckboxes(container) {
    this.columns.forEach((col) => {
      const cb = container.querySelector(`[data-column="${col.id}"]`);
      if (cb) cb.checked = col.visible;
    });
  }
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._dropdown = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var columns_default = ColumnsManager;
export {
  ColumnsManager,
  MODULE_ID,
  VERSION,
  columns_default as default,
  healthCheck,
  info
};
