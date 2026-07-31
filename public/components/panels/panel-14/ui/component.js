import { renderSkeleton } from "./render/skeleton.js";
import { renderEmpty } from "./render/empty.js";
import { renderError } from "./render/error.js";
import { ToastManager } from "./toast.js";
import { KeyboardNavigation } from "./keyboard.js";
import { DrawerComponent } from "./drawer.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-14:ui:component";
const ICONS = {
  alertTriangle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  xCircle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  calendar: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  trendingDown: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>',
  download: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  hash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/></svg>'
};
class UIComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.toastManager = null;
    this.statistics = {};
    this.topErrors = [];
    this.jobsWithErrors = [];
    this.errorsByDay = [];
    this.period = {};
  }
  async init() {
    if (!this.container) return;
    this.toastManager = new ToastManager();
    // NAO instanciar drawer aqui: `DrawerComponent` e' um ALIAS de `openDrawer`
    // (ui/drawer.js: `export { openDrawer as DrawerComponent }`) — uma funcao que
    // ABRE um drawer dentro de um container. `new DrawerComponent(this.logger, {})`
    // a executava com o logger no lugar do container -> `container.appendChild is
    // not a function` -> mount.failed, painel 100% morto. A referencia so era usada
    // por um `?.destroy()` orfao. Para abrir um drawer: openDrawer(el, {title, content}).
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
    if (t.dataset.action === "export-errors") this._exportErrors();
    if (t.dataset.action === "export-jobs") this._exportJobs();
  }
  showLoading() {
    if (this.hasData) {
      this.container.classList.add("p14-loading-overlay");
      return;
    }
    this.container.innerHTML = renderSkeleton();
  }
  hideLoading() {
    this.container.classList.remove("p14-loading-overlay");
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
      this.statistics = p?.statistics || {};
      this.topErrors = p?.top_errors || [];
      this.jobsWithErrors = p?.jobs_with_most_errors || [];
      this.errorsByDay = p?.errors_by_day || [];
      this.period = p?.period || {};
      if (!this.statistics.total_errors) {
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
    const s = this.statistics;
    this.container.innerHTML = `
      <div class="p14-dashboard">
        <div class="p14-kpi-grid">
          <div class="p14-kpi-card">
            <div class="p14-kpi-icon p14-kpi-icon--error">${ICONS.xCircle}</div>
            <div class="p14-kpi-content">
              <span class="p14-kpi-value">${this._formatNumber(s.total_errors)}</span>
              <span class="p14-kpi-label">Total Erros (${this.period.days || 7}d)</span>
            </div>
          </div>
          <div class="p14-kpi-card">
            <div class="p14-kpi-icon p14-kpi-icon--warning">${ICONS.alertTriangle}</div>
            <div class="p14-kpi-content">
              <span class="p14-kpi-value">${this._formatNumber(s.jobs_with_errors)}</span>
              <span class="p14-kpi-label">Jobs Afetados</span>
            </div>
          </div>
          <div class="p14-kpi-card">
            <div class="p14-kpi-icon p14-kpi-icon--info">${ICONS.calendar}</div>
            <div class="p14-kpi-content">
              <span class="p14-kpi-value">${s.days_with_errors || 0}</span>
              <span class="p14-kpi-label">Dias com Erro</span>
            </div>
          </div>
          <div class="p14-kpi-card">
            <div class="p14-kpi-icon p14-kpi-icon--primary">${ICONS.trendingDown}</div>
            <div class="p14-kpi-content">
              <span class="p14-kpi-value">${s.avg_errors_per_day?.toFixed(1) || 0}</span>
              <span class="p14-kpi-label">M\xE9dia/Dia</span>
            </div>
          </div>
        </div>
        <div class="p14-tables-grid">
          ${this._renderTopErrorsTable()}
          ${this._renderJobsTable()}
        </div>
      </div>
    `;
  }
  _renderTopErrorsTable() {
    const rows = this.topErrors.slice(0, 10).map((e, i) => {
      const sevClass = e.severity === "critical" ? "p14-sev--critical" : e.severity === "high" ? "p14-sev--high" : e.severity === "medium" ? "p14-sev--medium" : "p14-sev--low";
      return `<tr class="p14-tr"><td class="p14-td p14-td--rank">#${i + 1}</td><td class="p14-td p14-td--msg" title="${this._escape(e.error_message)}">${this._truncate(String(e.error_message || ""), 60)}</td><td class="p14-td"><span class="p14-badge ${sevClass}">${e.occurrences}</span></td><td class="p14-td">${e.affected_jobs}</td><td class="p14-td">${this._formatDateTime(e.last_occurrence)}</td></tr>`;
    }).join("") || '<tr><td colspan="5" class="p14-empty-table">Nenhum erro</td></tr>';
    return `<div class="p14-section"><div class="p14-section-header"><h3 class="p14-section-title">${ICONS.xCircle} <span>Top Erros</span></h3><button class="p14-btn-icon" data-action="export-errors">${ICONS.download}</button></div><div class="p14-section-body"><table class="p14-table"><thead><tr><th class="p14-th">#</th><th class="p14-th">Mensagem</th><th class="p14-th">Qtd</th><th class="p14-th">Jobs</th><th class="p14-th">\xDAltimo</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  _renderJobsTable() {
    const rows = this.jobsWithErrors.slice(0, 10).map((j, i) => `<tr class="p14-tr"><td class="p14-td p14-td--rank">#${i + 1}</td><td class="p14-td">${this._escape(j.job_name)}</td><td class="p14-td"><span class="p14-badge p14-badge--error">${j.error_count}</span></td><td class="p14-td">${j.days_with_errors}d</td><td class="p14-td">${this._formatDateTime(j.last_error)}</td></tr>`).join("") || '<tr><td colspan="5" class="p14-empty-table">Nenhum job</td></tr>';
    return `<div class="p14-section"><div class="p14-section-header"><h3 class="p14-section-title">${ICONS.alertTriangle} <span>Jobs com Mais Erros</span></h3><button class="p14-btn-icon" data-action="export-jobs">${ICONS.download}</button></div><div class="p14-section-body"><table class="p14-table"><thead><tr><th class="p14-th">#</th><th class="p14-th">Job</th><th class="p14-th">Erros</th><th class="p14-th">Dias</th><th class="p14-th">\xDAltimo</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
  }
  _exportErrors() {
    if (!this.topErrors.length) {
      this.toastManager?.warning("Nenhum dado");
      return;
    }
    const rows = this.topErrors.map((e) => [e.error_message, e.occurrences, e.affected_jobs, e.last_occurrence, e.severity]);
    this._downloadCSV(["Mensagem", "Ocorr\xEAncias", "Jobs Afetados", "\xDAltima Ocorr\xEAncia", "Severidade"], rows, "top-erros");
    this.toastManager?.success("Exportado");
  }
  _exportJobs() {
    if (!this.jobsWithErrors.length) {
      this.toastManager?.warning("Nenhum dado");
      return;
    }
    const rows = this.jobsWithErrors.map((j) => [j.job_name, j.error_count, j.days_with_errors, j.last_error]);
    this._downloadCSV(["Job", "Erros", "Dias", "\xDAltimo Erro"], rows, "jobs-com-erros");
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
  _formatDateTime(d) {
    if (!d) return "--";
    try {
      return new Date(String(d)).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
    } catch {
      return d;
    }
  }
  _truncate(s, max) {
    if (!s) return "--";
    return s.length > max ? `${s.slice(0, max)}...` : s;
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
