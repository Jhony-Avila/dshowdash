import { VERSION, MODULE_ID } from "./constants.js";
import { hashData } from "./helpers.js";
import { injectStyles } from "./styles.js";
import { bindEvents, updateTabsUI, bindSummaryCardClicks, bindTooltips } from "./events.js";
import { renderStructure } from "./render/structure.js";
import { renderSuccessRate, renderMiniDonut, renderSparkline, renderSummaryCards } from "./render/summary.js";
import { renderLineChart, renderBarChart } from "./render/charts.js";
import { renderComparison } from "./render/comparison.js";
import { renderStatusDistribution, renderAlerts } from "./render/distribution.js";
const SVGS = {
  warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
class UIComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger || console;
    this.mounted = false;
    this.hasData = false;
    this._lastDataHash = null;
    this._activeTab = "today_vs_yesterday";
    this._data = null;
  }
  async init() {
    if (!this.container) {
      this.logger?.error?.("ui.no-container");
      return;
    }
    this.container.innerHTML = renderStructure();
    injectStyles();
    this._bindEvents();
    this.mounted = true;
    this.logger?.debug?.("ui.init", { version: VERSION });
  }
  _bindEvents() {
    const self = this;
    const stateProxy = { get activeTab() {
      return self._activeTab;
    }, set activeTab(v) {
      self._activeTab = v;
    }, get data() {
      return self._data;
    } };
    const handlers = { updateTabsUI() {
      updateTabsUI(self.container, self._activeTab);
    }, renderComparison() {
      renderComparison(self.container, self._data, self._activeTab);
    }, renderBarChart() {
      renderBarChart(self.container, self._data, self._activeTab);
    }, renderSummaryCards() {
      self._renderSummaryCards();
    } };
    bindEvents(this.container, stateProxy, handlers);
  }
  _rebindSummaryCardClicks() {
    const self = this;
    const handlers = { updateTabsUI() {
      updateTabsUI(self.container, self._activeTab);
    }, renderSummaryCards() {
      self._renderSummaryCards();
    }, renderComparison() {
      renderComparison(self.container, self._data, self._activeTab);
    }, renderBarChart() {
      renderBarChart(self.container, self._data, self._activeTab);
    } };
    const stateProxy = { get activeTab() {
      return self._activeTab;
    }, set activeTab(v) {
      self._activeTab = v;
    } };
    bindSummaryCardClicks(this.container, stateProxy, handlers);
  }
  _renderSummaryCards() {
    renderSummaryCards(this.container, this._data, this._activeTab);
    this._rebindSummaryCardClicks();
  }
  showLoading() {
    if (this.hasData) return;
    const compEl = this.container.querySelector("[data-comparison]");
    if (compEl) compEl.innerHTML = '<div style="grid-column:1/-1;padding:40px;text-align:center;color:#606070;">Carregando...</div>';
  }
  hideLoading() {
  }
  showError(message) {
    if (this.hasData) return;
    const compEl = this.container.querySelector("[data-comparison]");
    if (compEl) compEl.innerHTML = `<div style="grid-column:1/-1;padding:40px;text-align:center;color:#ef4444;">${SVGS.warning} ${message}</div>`;
  }
  update(payload) {
    if (!this.container) return;
    const newHash = hashData(payload);
    if (newHash === this._lastDataHash && this.hasData) return;
    this._lastDataHash = newHash;
    try {
      this._data = payload?.data || payload || {};
      renderSuccessRate(this.container, this._data);
      renderMiniDonut(this.container, this._data);
      renderSparkline(this.container, this._data);
      this._renderSummaryCards();
      renderLineChart(this.container, this._data);
      renderComparison(this.container, this._data, this._activeTab);
      renderBarChart(this.container, this._data, this._activeTab);
      renderStatusDistribution(this.container, this._data);
      renderAlerts(this.container, this._data);
      bindTooltips(this.container);
      this.hasData = true;
    } catch (error) {
      this.logger?.error?.("ui.update.error", { error: error.message });
      this.showError("Erro ao processar dados");
    }
  }
  healthCheck() {
    return { moduleId: MODULE_ID, version: VERSION, mounted: this.mounted, hasData: this.hasData };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, features: ["modular-architecture", "line-chart", "sparklines", "donut", "export-csv-json", "tooltips", "animations", "comparison", "alerts"], mounted: this.mounted, hasData: this.hasData, activeTab: this._activeTab };
  }
  async destroy() {
    if (this.container) this.container.innerHTML = "";
    this.mounted = false;
    this.hasData = false;
    this._data = null;
    this.logger?.debug?.("ui.destroy");
  }
}
var component_default = UIComponent;
export {
  MODULE_ID,
  UIComponent,
  VERSION,
  component_default as default
};
