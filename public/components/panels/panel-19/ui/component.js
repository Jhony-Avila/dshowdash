import { renderSkeleton } from "./render/skeleton.js";
import { renderEmpty } from "./render/empty.js";
import { renderError } from "./render/error.js";
import { ToastManager } from "./toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-19:ui:component";
const ICONS = {
  trendingUp: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>',
  trendingDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
  activity: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>',
  percent: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="19" y1="5" x2="5" y2="19"/><circle cx="6.5" cy="6.5" r="2.5"/><circle cx="17.5" cy="17.5" r="2.5"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};
class UIComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.toastManager = null;
    this.chartData = [];
    this.summary = {};
    this.highlights = {};
    this.trend = {};
    this.period = {};
  }
  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    this._setupListeners();
    this.mounted = true;
  }
  _setupListeners() {
    this.container.addEventListener("click", (e) => this._handleClick(e));
  }
  _handleClick(e) {
    const t = e.target.closest("[data-action]");
    if (!t) return;
    if (t.dataset.action === "export") this._export();
  }
  showLoading() {
    if (this.hasData) {
      this.container.classList.add("p19-loading-overlay");
      return;
    }
    this.container.innerHTML = renderSkeleton();
  }
  hideLoading() {
    this.container.classList.remove("p19-loading-overlay");
  }
  showError(msg) {
    if (!this.hasData) this.container.innerHTML = renderError(msg);
    else this.toastManager?.error(msg);
    this.hideLoading();
  }
  showEmpty() {
    this.container.innerHTML = renderEmpty();
  }
  update(data) {
    if (!this.container) return;
    this.hideLoading();
    try {
      const p = data?.data || data?.payload || data;
      this.chartData = p?.chart_data || [];
      this.summary = p?.summary || {};
      this.highlights = p?.highlights || {};
      this.trend = p?.trend || {};
      this.period = p?.period || {};
      if (!this.chartData.length) {
        this.showEmpty();
        return;
      }
      this._renderDashboard();
      this.hasData = true;
    } catch (err) {
      this.showError("Erro ao renderizar");
    }
  }
  _renderDashboard() {
    const s = this.summary;
    const t = this.trend;
    const trendIcon = t.status === "improving" ? ICONS.trendingUp : t.status === "declining" ? ICONS.trendingDown : ICONS.activity;
    const trendClass = t.status === "improving" ? "p19-trend--up" : t.status === "declining" ? "p19-trend--down" : "p19-trend--stable";
    const trendText = t.status === "improving" ? "Melhorando" : t.status === "declining" ? "Caindo" : "Est\xE1vel";
    this.container.innerHTML = `
      <div class="p19-dashboard">
        <div class="p19-kpi-grid">
          <div class="p19-kpi-card">
            <div class="p19-kpi-icon p19-kpi-icon--primary">${ICONS.percent}</div>
            <div class="p19-kpi-content">
              <span class="p19-kpi-value">${(s.avg_success_rate || 0).toFixed(1)}%</span>
              <span class="p19-kpi-label">Taxa M\xE9dia (${this.period.days || 30}d)</span>
            </div>
          </div>
          <div class="p19-kpi-card">
            <div class="p19-kpi-icon p19-kpi-icon--info">${ICONS.activity}</div>
            <div class="p19-kpi-content">
              <span class="p19-kpi-value">${this._formatNumber(s.total_executions)}</span>
              <span class="p19-kpi-label">Execu\xE7\xF5es</span>
            </div>
          </div>
          <div class="p19-kpi-card ${trendClass}">
            <div class="p19-kpi-icon">${trendIcon}</div>
            <div class="p19-kpi-content">
              <span class="p19-kpi-value">${t.change >= 0 ? "+" : ""}${(t.change || 0).toFixed(1)}%</span>
              <span class="p19-kpi-label">${trendText} (7d)</span>
            </div>
          </div>
        </div>
        ${this._renderHighlights()}
        <div class="p19-chart-section">
          <div class="p19-section-header">
            <h3 class="p19-section-title">${ICONS.activity} <span>Evolu\xE7\xE3o da Taxa de Sucesso</span></h3>
            <button class="p19-btn-icon" data-action="export">${ICONS.download}</button>
          </div>
          <div class="p19-chart-container">${this._renderLineChart()}</div>
        </div>
      </div>
    `;
  }
  _renderHighlights() {
    const best = this.highlights.best_day;
    const worst = this.highlights.worst_day;
    if (!best && !worst) return "";
    return `<div class="p19-highlights"><div class="p19-highlight p19-highlight--best"><span class="p19-highlight-icon">${ICONS.star}</span><span class="p19-highlight-label">Melhor dia:</span><span class="p19-highlight-value">${best?.date || "--"} (${best?.success_rate?.toFixed(1) || 0}%)</span></div><div class="p19-highlight p19-highlight--worst"><span class="p19-highlight-icon">${ICONS.trendingDown}</span><span class="p19-highlight-label">Pior dia:</span><span class="p19-highlight-value">${worst?.date || "--"} (${worst?.success_rate?.toFixed(1) || 0}%)</span></div></div>`;
  }
  _renderLineChart() {
    if (!this.chartData.length) return '<div class="p19-empty">Sem dados</div>';
    const data = this.chartData;
    const maxRate = 100;
    const minRate = Math.min(...data.map((d) => d.success_rate)) - 5;
    const range = maxRate - minRate;
    const width = Math.max(data.length * 30, 600);
    const height = 200;
    const padding = 40;
    const points = data.map((d, i) => {
      const x = padding + i / (data.length - 1 || 1) * (width - padding * 2);
      const y = height - padding - (d.success_rate - minRate) / range * (height - padding * 2);
      return { x, y, data: d };
    });
    const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
    const areaD = pathD + ` L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;
    const gridLines = [100, 95, 90, 85, 80].filter((v) => v >= minRate).map((v) => {
      const y = height - padding - (v - minRate) / range * (height - padding * 2);
      return `<line x1="${padding}" y1="${y}" x2="${width - padding}" y2="${y}" class="p19-grid-line"/><text x="${padding - 5}" y="${y + 4}" class="p19-axis-label">${v}%</text>`;
    }).join("");
    const xLabels = points.filter((_, i) => i % Math.ceil(data.length / 8) === 0 || i === data.length - 1).map((p) => `<text x="${p.x}" y="${height - 10}" class="p19-axis-label">${String(p.data.date).slice(5)}</text>`).join("");
    const dots = points.map((p) => `<circle cx="${p.x}" cy="${p.y}" r="4" class="p19-dot" data-date="${p.data.date}" data-rate="${p.data.success_rate}"><title>${p.data.date}: ${p.data.success_rate}%</title></circle>`).join("");
    return `<svg class="p19-line-chart" viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet">${gridLines}<path d="${areaD}" class="p19-area"/><path d="${pathD}" class="p19-line"/>${dots}${xLabels}</svg>`;
  }
  _export() {
    if (!this.chartData.length) {
      this.toastManager?.warning("Nenhum dado");
      return;
    }
    const rows = this.chartData.map((d) => [d.date, d.total, d.success, d.errors, d.success_rate]);
    this._downloadCSV(["Data", "Total", "Sucesso", "Erros", "Taxa (%)"], rows, "taxa-sucesso-diaria");
    this.toastManager?.success("Exportado");
  }
  _downloadCSV(headers, rows, filename) {
    const csv = [headers.join(";"), ...rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(";"))].join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }
  _formatNumber(v) {
    if (v == null) return "--";
    return parseInt(String(v)).toLocaleString("pt-BR");
  }
  async destroy() {
    this.container && (this.container.innerHTML = "");
    this.mounted = false;
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION };
  }
}
var component_default = UIComponent;
export {
  MODULE_ID,
  UIComponent,
  VERSION,
  component_default as default
};
