const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/filters";
class FiltersManager {
  constructor(container, options = {}) {
    this.container = container;
    this.onFilterChange = options.onFilterChange || (() => {
    });
    this.onClear = options.onClear || (() => {
    });
    this._debounceTimer = null;
  }
  init() {
    if (!this.container) return;
    this.container.querySelectorAll("[data-filter]").forEach((el) => {
      const filter = el.dataset.filter;
      const inputEl = el;
      if (inputEl.tagName === "INPUT" && inputEl.type === "text") {
        inputEl.addEventListener("input", () => this._debounce(() => this.onFilterChange(filter, inputEl.value)));
      } else {
        inputEl.addEventListener("change", () => this.onFilterChange(filter, inputEl.value));
      }
    });
    this.container.querySelector('[data-action="clear-filters"]')?.addEventListener("click", () => {
      this.clear();
      this.onClear();
    });
  }
  _debounce(fn, delay = 400) {
    clearTimeout(this._debounceTimer);
    this._debounceTimer = setTimeout(fn, delay);
  }
  setValues(filters) {
    if (!this.container || !filters) return;
    Object.entries(filters).forEach(([key, value]) => {
      const el = this.container.querySelector(`[data-filter="${key}"]`);
      if (el) el.value = value || "";
    });
  }
  clear() {
    if (!this.container) return;
    this.container.querySelectorAll("[data-filter]").forEach((el) => {
      el.value = "";
    });
  }
  getValues() {
    const values = {};
    this.container?.querySelectorAll("[data-filter]").forEach((el) => {
      const inputEl = el;
      if (inputEl.value) values[inputEl.dataset.filter] = inputEl.value;
    });
    return values;
  }
  hasActiveFilters() {
    return Object.keys(this.getValues()).length > 0;
  }
  destroy() {
    clearTimeout(this._debounceTimer);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var filters_default = FiltersManager;
export {
  FiltersManager,
  MODULE_ID,
  VERSION,
  filters_default as default,
  healthCheck,
  info
};
