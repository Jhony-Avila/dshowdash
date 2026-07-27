const SVGS = {
  barChart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  warning: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  arrowUp: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="18 15 12 9 6 15"/></svg>',
  arrowDown: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>',
  arrowRight: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="9 18 15 12 9 6"/></svg>'
};
class KpisComponent {
  constructor(container) {
    this.container = container;
    this.element = null;
  }
  render() {
    this.element = document.createElement("div");
    this.element.className = "p18-kpis-grid";
    this.container.appendChild(this.element);
    return this.element;
  }
  update(kpis) {
    if (!this.element) return;
    if (!kpis || kpis.length === 0) {
      this.element.innerHTML = '<div class="p18-empty">Nenhum KPI dispon\xEDvel</div>';
      return;
    }
    const html = kpis.map((kpi) => this.createKpiCard(kpi)).join("");
    this.element.innerHTML = html;
  }
  createKpiCard(kpi) {
    const label = this.escapeHtml(kpi.label || "N/A");
    const value = kpi.value !== void 0 ? kpi.value : "--";
    const unit = kpi.unit || "";
    const icon = kpi.icon || SVGS.barChart;
    const change = kpi.change || null;
    const changeValue = kpi.change_value || null;
    let changeHtml = "";
    if (change && changeValue !== null) {
      const changeClass = change === "up" ? "change-up" : change === "down" ? "change-down" : "change-neutral";
      const changeIcon = change === "up" ? SVGS.arrowUp : change === "down" ? SVGS.arrowDown : SVGS.arrowRight;
      changeHtml = `<div class="p18-kpi-change ${changeClass}"><span class="p18-change-icon">${changeIcon}</span><span class="p18-change-value">${Math.abs(Number(changeValue))}%</span></div>`;
    }
    return `<div class="p18-kpi-card"><div class="p18-kpi-header"><span class="p18-kpi-icon">${icon}</span><span class="p18-kpi-label">${label}</span></div><div class="p18-kpi-body"><div class="p18-kpi-value">${this.formatValue(value)}</div>${unit ? `<div class="p18-kpi-unit">${unit}</div>` : ""}</div>${changeHtml}</div>`;
  }
  formatValue(value) {
    if (typeof value === "number") {
      if (Number.isInteger(value)) return value.toLocaleString("pt-BR");
      return value.toLocaleString("pt-BR", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
    }
    return value;
  }
  showLoading() {
    if (!this.element) return;
    this.element.innerHTML = '<div class="p18-loading">Carregando KPIs...</div>';
  }
  showError(message) {
    if (!this.element) return;
    this.element.innerHTML = `<div class="p18-error">${SVGS.warning} ${message}</div>`;
  }
  escapeHtml(text) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }
  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
const MODULE_ID = "panels-panel-18-ui-kpis";
const VERSION = "9.3.0-P2-ENTERPRISE";
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { kpisReady: true } });
export {
  KpisComponent,
  MODULE_ID,
  VERSION,
  healthCheck,
  info
};
