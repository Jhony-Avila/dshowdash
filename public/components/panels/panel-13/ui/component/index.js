import { SORT_OPTIONS, ICONS } from "../../core/constants.js";
import { VERSION as _VERSION, MODULE_ID as _MODULE_ID } from "./constants.js";
import { applyFilters } from "./utils.js";
import { renderKPIs, renderCriticalAlert, renderFiltersBar, renderJobsTable, renderPeriodInfo } from "./render.js";
const VERSION = _VERSION;
const MODULE_ID = _MODULE_ID;
class UIComponent {
  constructor(container, logger) {
    this.container = container;
    this.logger = logger;
    this.mounted = false;
    this.hasData = false;
    this.rawData = null;
    this.filters = { search: "", status: "all", sort: "SUCCESS_RATE_DESC" };
  }
  async init() {
    if (!this.container) {
      this.logger.error("ui.no-container");
      return;
    }
    this.mounted = true;
    this.logger.debug("ui.init");
  }
  showLoading() {
    if (!this.container) return;
    if (this.hasData) {
      this.container.classList.add("p13-loading-overlay");
    } else {
      this.container.innerHTML = `<div class="p13-loading"><div class="p13-skeleton-header"></div><div class="p13-skeleton-kpis"><div class="p13-skeleton-kpi"></div><div class="p13-skeleton-kpi"></div><div class="p13-skeleton-kpi"></div><div class="p13-skeleton-kpi"></div></div><div class="p13-skeleton-filters"></div><div class="p13-skeleton-table">${Array(8).fill('<div class="p13-skeleton-row"></div>').join("")}</div></div>`;
    }
  }
  hideLoading() {
    if (this.container) this.container.classList.remove("p13-loading-overlay");
  }
  showError(message) {
    if (!this.container) return;
    this.hideLoading();
    if (this.hasData) {
      const badge = document.createElement("div");
      badge.className = "p13-error-badge";
      badge.innerHTML = `${ICONS.alert} ${message || "Erro"}`;
      this.container.insertBefore(badge, this.container.firstChild);
      setTimeout(() => {
        badge.remove();
      }, 5e3);
    } else {
      this.container.innerHTML = `<div class="p13-error"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg><h3>Erro ao carregar</h3><p>${message || "N\xE3o foi poss\xEDvel carregar os dados de SLA"}</p></div>`;
    }
  }
  update(data) {
    const self = this;
    if (!this.container || !data) return;
    this.hideLoading();
    try {
      this.rawData = data;
      this._render();
      this.hasData = true;
      this.logger.debug("ui.render-success", { jobs: data.jobs_sla?.length });
    } catch (error) {
      this.logger.error("ui.render-error", { error: error.message });
      this.showError("Erro ao renderizar dados");
    }
  }
  _render() {
    const self = this;
    const availability = this.rawData.availability;
    const jobs_sla = this.rawData.jobs_sla;
    const critical_jobs = this.rawData.critical_jobs;
    const summary = this.rawData.summary;
    const period = this.rawData.period;
    const filteredJobs = applyFilters(jobs_sla || [], this.filters, SORT_OPTIONS);
    this.container.innerHTML = renderKPIs(availability, summary) + renderCriticalAlert(critical_jobs) + renderFiltersBar(jobs_sla?.length || 0, filteredJobs.length, this.filters) + renderJobsTable(filteredJobs, this.filters) + renderPeriodInfo(period);
    this._setupEventListeners();
  }
  _setupEventListeners() {
    const self = this;
    const searchInput = this.container.querySelector("[data-search]");
    if (searchInput) {
      searchInput.value = this.filters.search;
      searchInput.addEventListener("input", (e) => {
        self.filters.search = e.target.value;
        self._render();
      });
    }
    const statusSelect = this.container.querySelector("[data-filter-status]");
    if (statusSelect) {
      statusSelect.value = this.filters.status;
      statusSelect.addEventListener("change", (e) => {
        self.filters.status = e.target.value;
        self._render();
      });
    }
    const sortSelect = this.container.querySelector("[data-sort]");
    if (sortSelect) {
      sortSelect.value = this.filters.sort;
      sortSelect.addEventListener("change", (e) => {
        self.filters.sort = e.target.value;
        self._render();
      });
    }
    const exportBtn = this.container.querySelector("[data-export]");
    if (exportBtn) exportBtn.addEventListener("click", () => {
      self._exportCSV();
    });
    this.container.querySelectorAll("[data-sort-col]").forEach((th) => {
      th.addEventListener("click", () => {
        const col = th.dataset.sortCol;
        const currentSort = self.filters.sort;
        if (col === "success_rate") self.filters.sort = currentSort === "SUCCESS_RATE_DESC" ? "SUCCESS_RATE_ASC" : "SUCCESS_RATE_DESC";
        else if (col === "total_executions") self.filters.sort = "EXECUTIONS_DESC";
        else if (col === "job_name") self.filters.sort = "NAME_ASC";
        self._render();
      });
    });
  }
  _exportCSV() {
    if (!this.rawData?.jobs_sla) return;
    const jobs = applyFilters(this.rawData.jobs_sla, this.filters, SORT_OPTIONS);
    const headers = ["Job", "Tipo", "Taxa SLA (%)", "Recentes OK", "Recentes Erro", "Tempo M\xE9dio (s)", "Total Execu\xE7\xF5es", "Status"];
    const rows = jobs.map((job) => [job.job_name, job.job_type || "", job.success_rate, job.recent_success, job.recent_errors, job.avg_execution_time, job.total_executions, job.status]);
    const csv = [headers].concat(rows).map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `sla-report-${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    this.logger.info("export.csv", { rows: rows.length });
  }
  async destroy() {
    if (this.container) {
      this.container.innerHTML = "";
      this.container.classList.remove("p13-loading-overlay");
    }
    this.mounted = false;
    this.hasData = false;
    this.rawData = null;
    this.logger.debug("ui.destroyed");
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { indexReady: true } };
}
var component_default = UIComponent;
export {
  MODULE_ID,
  UIComponent,
  VERSION,
  component_default as default,
  healthCheck,
  info
};
