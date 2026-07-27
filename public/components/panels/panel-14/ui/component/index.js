import { VERSION, MODULE_ID } from "./constants.js";
import { injectStyles } from "./styles.js";
import { hashData, downloadFile } from "./utils.js";
import { renderStructure } from "./template.js";
import { renderPeriod, renderSummaryCards, renderDailyChart, renderErrorsList, renderSeverityDonut, renderTopProcedures } from "./render.js";
const SVGS = { warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>' };
class UIComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger || console;
    this.mounted = false;
    this.hasData = false;
    this._lastDataHash = null;
    this._data = null;
    this._expandedErrors = /* @__PURE__ */ new Set();
    this._currentPage = 1;
    this._pageSize = 10;
  }
  async init() {
    if (!this.container) {
      this.logger?.error?.("ui.no-container");
      return;
    }
    injectStyles();
    this.container.innerHTML = renderStructure();
    this._bindEvents();
    this.mounted = true;
    this.logger?.debug?.("ui.init");
  }
  _bindEvents() {
    this.container.querySelector('[data-export="csv"]')?.addEventListener("click", () => this._exportCSV());
  }
  showLoading() {
    if (this.hasData) return;
    const el = this.container.querySelector("[data-total-errors]");
    if (el) el.innerHTML = '<span style="animation:p14-pulse 1s infinite;">...</span>';
  }
  hideLoading() {
  }
  showError(message) {
    if (this.hasData) return;
    const el = this.container.querySelector("[data-total-errors]");
    if (el) el.innerHTML = `<span style="color:#ef4444;">${SVGS.warning}</span>`;
  }
  update(payload) {
    if (!this.container) return;
    const newHash = hashData(payload);
    if (newHash === this._lastDataHash && this.hasData) return;
    this._lastDataHash = newHash;
    try {
      this._data = payload?.data || payload || {};
      renderPeriod(this.container, this._data);
      renderSummaryCards(this.container, this._data);
      renderDailyChart(this.container, this._data);
      this._renderErrorsList();
      renderSeverityDonut(this.container, this._data);
      renderTopProcedures(this.container, this._data);
      this.hasData = true;
    } catch (error) {
      this.logger?.error?.("ui.update.error", { error: error.message });
      this.showError("Erro ao processar dados");
    }
  }
  _renderErrorsList() {
    renderErrorsList(this.container, this._data, this._expandedErrors, this._currentPage, this._pageSize, (delta) => {
      this._currentPage += delta;
      this._renderErrorsList();
    }, (idx) => {
      if (this._expandedErrors.has(idx)) this._expandedErrors.delete(idx);
      else this._expandedErrors.add(idx);
      this._renderErrorsList();
    });
  }
  _exportCSV() {
    if (!this._data) return alert("Sem dados");
    const errors = this._data.top_errors || [];
    const rows = [["Severidade", "Mensagem", "Ocorr\xEAncias", "Primeira", "\xDAltima"]];
    errors.forEach((e) => {
      rows.push([String(e.severity || ""), `"${String(e.error_message || "").replace(/"/g, '""')}"`, e.occurrences || 0, String(e.first_occurrence || ""), String(e.last_occurrence || "")]);
    });
    const csv = rows.map((r) => r.join(",")).join("\n");
    downloadFile(csv, `top_erros_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`, "text/csv");
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      mounted: this.mounted,
      hasData: this.hasData,
      currentPage: this._currentPage,
      pageSize: this._pageSize,
      expandedErrorsCount: this._expandedErrors.size,
      errorsCount: this._data?.top_errors?.length || 0,
      timestamp: Date.now()
    };
  }
  healthCheck() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, hasData: this.hasData };
  }
  async destroy() {
    if (this.container) this.container.innerHTML = "";
    this.mounted = false;
    this.hasData = false;
    this._data = null;
    this._expandedErrors.clear();
  }
}
var component_default = UIComponent;
export {
  MODULE_ID,
  UIComponent,
  VERSION,
  component_default as default
};
