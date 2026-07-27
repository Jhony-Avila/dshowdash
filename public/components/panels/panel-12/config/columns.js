import * as formatters from "../utils/formatters.js";
import * as store from "../state/store.js";
const SVGS = {
  php: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/></svg>',
  python: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
  shell: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  api: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M12 22v-5"/><path d="M9 8V2"/><path d="M15 8V2"/><path d="M18 8v5a6 6 0 0 1-6 6v0a6 6 0 0 1-6-6V8Z"/></svg>',
  file: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>',
  refresh: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>',
  pause: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="20 6 9 17 4 12"/></svg>',
  circle: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><circle cx="12" cy="12" r="10"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};
const TYPE_ICONS = { php: SVGS.php, python: SVGS.python, shell: SVGS.shell, api: SVGS.api, other: SVGS.file };
const ALL_COLUMNS = {
  id: { key: "id", label: "ID", sortable: true, render: (job) => `<strong>#${job.id}</strong>`, className: "painel-12-col-id" },
  job_name: { key: "job_name", label: "Nome do Job", sortable: true, render: (job) => {
    const name = job.job_name || job.nome || "N/A";
    const searchTerm = store.getSearchTerm();
    return searchTerm ? formatters.highlightText(name, searchTerm) : formatters.escapeHtml(name);
  }, className: "painel-12-col-name" },
  job_type: { key: "job_type", label: "Tipo", sortable: true, render: (job) => {
    const type = (job.job_type || "other").toLowerCase();
    const icon = TYPE_ICONS[type] || TYPE_ICONS.other;
    const label = formatters.escapeHtml(job.job_type || "N/A");
    return `<span class="painel-12-badge" data-type="${type}" aria-label="Tipo de job: ${label}">${icon} ${label}</span>`;
  }, className: "painel-12-col-type" },
  is_active: { key: "is_active", label: "Status", sortable: true, render: (job) => {
    const isActive = parseInt(job.is_active) === 1;
    const status = isActive ? "Ativo" : "Inativo";
    const icon = isActive ? SVGS.check : SVGS.circle;
    return `<span class="painel-12-badge" data-status="${isActive ? "active" : "inactive"}" aria-label="Status: ${status}">${icon} ${status}</span>`;
  }, className: "painel-12-col-status" },
  is_running: { key: "is_running", label: "Rodando", sortable: true, render: (job) => {
    const isRunning = parseInt(job.is_running) === 1;
    const status = isRunning ? "Sim" : "N\xE3o";
    const icon = isRunning ? SVGS.refresh : SVGS.pause;
    return `<span class="painel-12-badge painel-12-badge-${isRunning ? "running" : "stopped"}" aria-label="Em execu\xE7\xE3o: ${status}">${icon} ${status}</span>`;
  }, className: "painel-12-col-running" },
  last_execution: { key: "last_execution", label: "\xDAltima Execu\xE7\xE3o", sortable: true, render: (job) => formatters.formatDatetime(job.last_execution), className: "painel-12-col-date" },
  total_executions: { key: "total_executions", label: "Total Execu\xE7\xF5es", sortable: true, render: (job) => formatters.formatNumber(job.total_executions || 0), className: "painel-12-col-number" },
  success_rate: { key: "success_rate", label: "Taxa Sucesso", sortable: true, render: (job) => {
    const rate = parseFloat(job.success_rate || "0");
    const clampedRate = formatters.clamp(rate, 0, 100);
    const status = rate >= 90 ? "success" : rate >= 70 ? "warning" : "error";
    const icon = rate >= 90 ? SVGS.check : rate >= 70 ? SVGS.warning : SVGS.x;
    return `<div class="painel-12-success-rate-container"><div class="painel-12-success-rate-bar" style="width: ${clampedRate}%;" data-status="${status}"></div><span class="painel-12-badge painel-12-success-rate-text" data-status="${status}" aria-label="Taxa de sucesso: ${rate.toFixed(2)}%">${icon} ${rate.toFixed(2)}%</span></div>`;
  }, className: "painel-12-col-rate" },
  error_count: { key: "error_count", label: "Erros", sortable: true, render: (job) => {
    const errors = parseInt(job.error_count || "0");
    const status = errors > 0 ? "error" : "success";
    return `<span class="painel-12-badge" data-status="${status}" aria-label="${errors} ${errors === 1 ? "erro" : "erros"}">${errors}</span>`;
  }, className: "painel-12-col-number" },
  avg_execution_time: { key: "avg_execution_time", label: "Tempo M\xE9dio", sortable: true, render: (job) => {
    const time = Number(job.avg_execution_time) || 0;
    return time > 0 ? `<span class="painel-12-monospace">${time.toFixed(2)}s</span>` : "--";
  }, className: "painel-12-col-time" },
  created_at: { key: "created_at", label: "Criado em", sortable: true, render: (job) => formatters.formatDatetime(job.created_at), className: "painel-12-col-date" }
};
const DEFAULT_VISIBLE_COLUMNS = ["id", "job_name", "job_type", "is_active", "last_execution", "success_rate", "error_count"];
const getColumn = (key) => ALL_COLUMNS[key] || null;
const getVisibleColumns = (keys) => keys.map((key) => ALL_COLUMNS[key]).filter(Boolean);
const getAllColumnKeys = () => Object.keys(ALL_COLUMNS);
const isColumnSortable = (key) => {
  const col = ALL_COLUMNS[key];
  return col ? col.sortable : false;
};
const MODULE_ID = "panels-panel-12-config-columns";
const VERSION = "9.3.0-P2-ENTERPRISE";
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { columnsReady: true } });
export {
  ALL_COLUMNS,
  DEFAULT_VISIBLE_COLUMNS,
  MODULE_ID,
  VERSION,
  getAllColumnKeys,
  getColumn,
  getVisibleColumns,
  healthCheck,
  info,
  isColumnSortable
};
