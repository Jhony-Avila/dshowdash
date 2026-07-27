import { renderSkeleton } from "./render/skeleton.js";
import { renderEmpty } from "./render/empty.js";
import { renderError } from "./render/error.js";
import { ToastManager } from "./toast.js";
import { KeyboardNavigation } from "./keyboard.js";
import { DrawerComponent } from "./drawer.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-13:ui:component";
const ICONS = {
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>'
};
class UIComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.toastManager = null;
    this.availability = null;
    this.jobsSla = [];
    this.criticalJobs = [];
    this.summary = null;
    this.period = null;
  }
  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    this.drawerComponent = new DrawerComponent(this.logger, {});
    this.keyboardNav = new KeyboardNavigation(this.container, {});
    this._setupListeners();
    this.mounted = true;
  }
  _setupListeners() {
    this.container.addEventListener("click", (e) => this._handleClick(e));
  }
  _handleClick(e) {
    const t = e.target.closest("[data-action]");
    if (!t) return;
    if (t.dataset.action === "export-sla") this._exportSla();
    if (t.dataset.action === "export-critical") this._exportCritical();
  }
  showLoading() {
    if (this.hasData) {
      this.container.classList.add("p13-loading-overlay");
      return;
    }
    this.container.innerHTML = renderSkeleton();
  }
  hideLoading() {
    this.container.classList.remove("p13-loading-overlay");
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
      this.availability = p?.availability || {};
      this.jobsSla = p?.jobs_sla || [];
      this.criticalJobs = p?.critical_jobs || [];
      this.summary = p?.summary || {};
      this.period = p?.period || {};
      if (!this.availability.total_executions) {
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
    const a = this.availability;
    const s = this.summary;
    const statusClass = a.uptime_status === "excellent" ? "p13-kpi-icon--success" : a.uptime_status === "good" ? "p13-kpi-icon--info" : "p13-kpi-icon--warning";
    this.container.innerHTML = `
      <div class="p13-dashboard">
        <div class="p13-kpi-grid">
          <div class="p13-kpi-card p13-kpi-card--large">
            <div class="p13-kpi-icon ${statusClass}">${ICONS.shield}</div>
            <div class="p13-kpi-content">
              <span class="p13-kpi-value">${(a.availability_percent || 0).toFixed(2)}%</span>
              <span class="p13-kpi-label">Disponibilidade (${this.period?.days || 30}d)</span>
            </div>
          </div>
          <div class="p13-kpi-card">
            <div class="p13-kpi-icon p13-kpi-icon--primary">${ICONS.check}</div>
            <div class="p13-kpi-content">
              <span class="p13-kpi-value">${this._formatNumber(a.successful)}</span>
              <span class="p13-kpi-label">Sucesso</span>
            </div>
          </div>
          <div class="p13-kpi-card">
            <div class="p13-kpi-icon p13-kpi-icon--error">${ICONS.x}</div>
            <div class="p13-kpi-content">
              <span class="p13-kpi-value">${this._formatNumber(a.failed)}</span>
              <span class="p13-kpi-label">Falhas</span>
            </div>
          </div>
        </div>
        ${this._renderSummaryBar()}
        <div class="p13-tables-grid">
          ${this._renderSlaTable()}
          ${this._renderCriticalTable()}
        </div>
      </div>
    `;
  }
  _renderSummaryBar() {
    const s = this.summary;
    return `<div class="p13-summary-bar"><span class="p13-summary-item p13-summary--excellent">${ICONS.trophy} Excelentes: ${s.excellent_jobs || 0}</span><span class="p13-summary-item p13-summary--good">${ICONS.check} Bons: ${s.good_jobs || 0}</span><span class="p13-summary-item p13-summary--warning">${ICONS.alert} Aten\xE7\xE3o: ${s.warning_jobs || 0}</span><span class="p13-summary-item p13-summary--critical">${ICONS.x} Cr\xEDticos: ${s.critical_jobs || 0}</span></div>`;
  }
  _renderSlaTable() {
    const rows = this.jobsSla.slice(0, 15).map((j) => {
      const statusClass = j.status === "excellent" ? "p13-status--success" : j.status === "good" ? "p13-status--info" : j.status === "warning" ? "p13-status--warning" : "p13-status--error";
      return `<tr class="p13-tr"><td class="p13-td">${this._escape(j.job_name)}</td><td class="p13-td">${j.job_type || "--"}</td><td class="p13-td"><span class="p13-rate ${statusClass}">${j.success_rate?.toFixed(1)}%</span></td><td class="p13-td">${this._formatNumber(j.total_executions)}</td><td class="p13-td">${this._formatDuration(j.avg_execution_time)}</td></tr>`;
    }).join("") || '<tr><td colspan="5" class="p13-empty-table">Nenhum job</td></tr>';
    return `<div class="p13-section"><div class="p13-section-header"><h3 class="p13-section-title">${ICONS.trophy} <span>Jobs por SLA</span></h3><button class="p13-btn-icon" data-action="export-sla">${ICONS.download}</button></div><div class="p13-section-body"><table class="p13-table"><thead><tr><th class="p13-th">Job</th><th class="p13-th">Tipo</th><th class="p13-th">Taxa</th><th class="p13-th">Execu\xE7\xF5es</th><th class="p13-th">Tempo M\xE9dio</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  _renderCriticalTable() {
    const rows = this.criticalJobs.map((j) => `<tr class="p13-tr"><td class="p13-td">${this._escape(j.job_name)}</td><td class="p13-td"><span class="p13-badge p13-badge--error">${j.error_count}</span></td><td class="p13-td">${this._formatDateTime(j.last_error)}</td></tr>`).join("") || '<tr><td colspan="3" class="p13-empty-table">Nenhum job cr\xEDtico</td></tr>';
    return `<div class="p13-section"><div class="p13-section-header"><h3 class="p13-section-title">${ICONS.alert} <span>Jobs Cr\xEDticos (7d)</span></h3><button class="p13-btn-icon" data-action="export-critical">${ICONS.download}</button></div><div class="p13-section-body"><table class="p13-table"><thead><tr><th class="p13-th">Job</th><th class="p13-th">Erros</th><th class="p13-th">\xDAltimo Erro</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  _exportSla() {
    if (!this.jobsSla.length) {
      this.toastManager?.warning("Nenhum dado");
      return;
    }
    const rows = this.jobsSla.map((j) => [j.job_name, j.job_type, j.success_rate, j.total_executions, j.avg_execution_time]);
    this._downloadCSV(["Job", "Tipo", "Taxa (%)", "Execu\xE7\xF5es", "Tempo M\xE9dio"], rows, "sla-jobs");
    this.toastManager?.success("Exportado");
  }
  _exportCritical() {
    if (!this.criticalJobs.length) {
      this.toastManager?.warning("Nenhum dado");
      return;
    }
    const rows = this.criticalJobs.map((j) => [j.job_name, j.error_count, j.last_error]);
    this._downloadCSV(["Job", "Erros", "\xDAltimo Erro"], rows, "jobs-criticos");
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
  _formatDuration(s) {
    if (s == null) return "--";
    const n = parseFloat(String(s));
    if (isNaN(n)) return String(s);
    if (n < 60) return `${n.toFixed(1)}s`;
    return `${(n / 60).toFixed(1)}min`;
  }
  _formatDateTime(d) {
    if (!d) return "--";
    try {
      return new Date(String(d)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return String(d);
    }
  }
  _escape(s) {
    const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return String(s || "").replace(/[&<>"']/g, (m) => map[m]);
  }
  async destroy() {
    this.keyboardNav?.destroy();
    this.drawerComponent?.destroy();
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
