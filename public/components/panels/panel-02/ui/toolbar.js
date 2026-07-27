const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02/ui/toolbar";
class ToolbarComponent {
  constructor(container, options = {}) {
    this.container = container;
    this.rootContainer = container.closest(".p02-wrapper") || container.closest('[data-painel-id="panel-02"]');
    this.options = options;
    this.columns = options.columns || [];
    this.onDensityChange = options.onDensityChange || (() => {
    });
    this.onColumnToggle = options.onColumnToggle || (() => {
    });
    this.onGroupByChange = options.onGroupByChange || (() => {
    });
    this.onInlineFiltersToggle = options.onInlineFiltersToggle || (() => {
    });
    this.onPrint = options.onPrint || (() => {
    });
    this.onShare = options.onShare || (() => {
    });
    this._densityHandler = null;
    this._groupHandler = null;
    this._columnsHandler = null;
    this._inlineFilterHandler = null;
    this._printHandler = null;
    this._shareHandler = null;
    this._outsideClickHandler = null;
    this._abortController = null;
    this.showInlineFilters = false;
  }
  render() {
    if (!this.rootContainer) return;
    this.populateColumnsMenu();
    this.setupDensityListeners();
    this.setupGroupByListener();
    this.setupColumnsListener();
    this.setupInlineFiltersListener();
    this.setupPrintShareListeners();
  }
  populateColumnsMenu() {
    const menu = this.rootContainer.querySelector('[data-dropdown="columns"]');
    if (!menu || !this.columns.length) return;
    const existingItems = menu.querySelectorAll(".p02-columns-item");
    if (existingItems.length > 0) return;
    this.columns.forEach((col) => {
      const item = document.createElement("label");
      item.className = "p02-columns-item";
      item.innerHTML = `<input type="checkbox" data-col-toggle="${col.id}" ${col.visible !== false ? "checked" : ""}><span>${col.label}</span>`;
      menu.appendChild(item);
    });
  }
  setupDensityListeners() {
    const densityBtns = this.rootContainer.querySelectorAll("[data-density]");
    if (!densityBtns.length) return;
    this._densityHandler = (e) => {
      const btn = e.target.closest("[data-density]");
      if (!btn) return;
      densityBtns.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      this.onDensityChange(btn.dataset.density);
    };
    densityBtns.forEach((btn) => btn.addEventListener("click", this._densityHandler));
  }
  setupGroupByListener() {
    const groupSelect = this.rootContainer.querySelector('[data-action="group-by"]');
    if (!groupSelect) return;
    this._groupHandler = (e) => {
      this.onGroupByChange(e.target.value || null);
    };
    groupSelect.addEventListener("change", this._groupHandler);
  }
  setupColumnsListener() {
    const toggleBtn = this.rootContainer.querySelector('[data-action="toggle-columns"]');
    const menu = this.rootContainer.querySelector('[data-dropdown="columns"]');
    if (!toggleBtn || !menu) return;
    this._columnsHandler = (e) => {
      e.stopPropagation();
      menu.classList.toggle("open");
    };
    toggleBtn.addEventListener("click", this._columnsHandler);
    menu.addEventListener("change", (e) => {
      const checkbox = e.target.closest("[data-col-toggle]");
      if (checkbox) {
        this.onColumnToggle(checkbox.dataset.colToggle, checkbox.checked);
      }
    });
    this._abortController = new AbortController();
    this._outsideClickHandler = (e) => {
      if (!menu.contains(e.target) && !toggleBtn.contains(e.target)) {
        menu.classList.remove("open");
      }
    };
    document.addEventListener("click", this._outsideClickHandler, { signal: this._abortController.signal });
  }
  setupInlineFiltersListener() {
    const btn = this.rootContainer.querySelector('[data-action="toggle-inline-filters"]');
    if (!btn) return;
    this._inlineFilterHandler = () => {
      this.showInlineFilters = !this.showInlineFilters;
      btn.classList.toggle("active", this.showInlineFilters);
      this.onInlineFiltersToggle(this.showInlineFilters);
    };
    btn.addEventListener("click", this._inlineFilterHandler);
  }
  setupPrintShareListeners() {
    const printBtn = this.rootContainer.querySelector('[data-action="print"]');
    const shareBtn = this.rootContainer.querySelector('[data-action="share"]');
    if (printBtn) {
      this._printHandler = () => this.onPrint();
      printBtn.addEventListener("click", this._printHandler);
    }
    if (shareBtn) {
      this._shareHandler = () => this.onShare();
      shareBtn.addEventListener("click", this._shareHandler);
    }
  }
  destroy() {
    if (!this.rootContainer) return;
    const densityBtns = this.rootContainer.querySelectorAll("[data-density]");
    densityBtns.forEach((btn) => {
      if (this._densityHandler) btn.removeEventListener("click", this._densityHandler);
    });
    const groupSelect = this.rootContainer.querySelector('[data-action="group-by"]');
    if (groupSelect && this._groupHandler) {
      groupSelect.removeEventListener("change", this._groupHandler);
    }
    const toggleBtn = this.rootContainer.querySelector('[data-action="toggle-columns"]');
    if (toggleBtn && this._columnsHandler) {
      toggleBtn.removeEventListener("click", this._columnsHandler);
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    const inlineBtn = this.rootContainer.querySelector('[data-action="toggle-inline-filters"]');
    if (inlineBtn && this._inlineFilterHandler) {
      inlineBtn.removeEventListener("click", this._inlineFilterHandler);
    }
    const printBtn = this.rootContainer.querySelector('[data-action="print"]');
    if (printBtn && this._printHandler) {
      printBtn.removeEventListener("click", this._printHandler);
    }
    const shareBtn = this.rootContainer.querySelector('[data-action="share"]');
    if (shareBtn && this._shareHandler) {
      shareBtn.removeEventListener("click", this._shareHandler);
    }
  }
}
var toolbar_default = ToolbarComponent;
export {
  MODULE_ID,
  ToolbarComponent,
  VERSION,
  toolbar_default as default
};
