const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-02/ui/table/constants";
const TYPE_ICONS = {
  API: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><path d="M22 6l-10 7L2 6"/></svg>',
  PYTHON: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.373 0 5.373 2.667 5.373 4v2.667h6.627v.666H4C1.787 7.333 0 9.12 0 12s1.787 4.667 4 4.667h2v-2.334c0-2.213 1.787-4 4-4h6c1.107 0 2-.893 2-2V4c0-2.213-2.24-4-6-4zm-3.373 2.667a1 1 0 110 2 1 1 0 010-2z"/><path d="M12 24c6.627 0 6.627-2.667 6.627-4v-2.667h-6.627v-.666H20c2.213 0 4-1.787 4-4.667s-1.787-4.667-4-4.667h-2v2.334c0 2.213-1.787 4-4 4H8c-1.107 0-2 .893-2 2V20c0 2.213 2.24 4 6 4zm3.373-2.667a1 1 0 110-2 1 1 0 010 2z"/></svg>',
  PHP: '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 5.5c-5.523 0-10 2.91-10 6.5s4.477 6.5 10 6.5 10-2.91 10-6.5-4.477-6.5-10-6.5zM6.5 14.5c-.828 0-1.5-.672-1.5-1.5V10h1.5v3h1V10H9v3c0 .828-.672 1.5-1.5 1.5H6.5zm5.5 0h-1.5v-4.5H9V8.5h4.5v1.5h-1.5v4.5zm4.5 0c-.828 0-1.5-.672-1.5-1.5V10H16.5v3h1V10H19v3c0 .828-.672 1.5-1.5 1.5H16.5z"/></svg>',
  SHELL: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M6 9l4 3-4 3"/><path d="M12 15h6"/></svg>',
  CRON: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>'
};
const COLUMNS = [
  { id: "select", label: "", sortable: false, visible: true, width: 40, filterable: false },
  { id: "expand", label: "", sortable: false, visible: true, width: 30, filterable: false },
  { id: "job_name", label: "Job", sortable: true, visible: true, width: null, filterable: true, filterType: "text" },
  { id: "job_type", label: "Tipo", sortable: true, visible: true, width: 100, filterable: true, filterType: "select", options: ["api", "python", "php", "shell"] },
  { id: "health_status", label: "Status", sortable: true, visible: true, width: 100, align: "center", filterable: true, filterType: "select", options: ["healthy", "warning", "critical", "inactive"] },
  { id: "last_execution", label: "Ultima Exec", sortable: true, visible: true, width: 120, filterable: false },
  { id: "total_executions", label: "Execucoes", sortable: true, visible: true, width: 90, align: "right", filterable: false },
  { id: "success_rate", label: "Sucesso", sortable: true, visible: true, width: 80, align: "center", filterable: false },
  { id: "avg_execution_time", label: "Tempo", sortable: true, visible: true, width: 80, align: "right", filterable: false },
  { id: "error_count", label: "Erros", sortable: true, visible: true, width: 60, align: "right", filterable: false },
  { id: "actions", label: "", sortable: false, visible: true, width: 100, filterable: false }
];
const STATUS_ORDER = { "critical": 0, "warning": 1, "healthy": 2, "inactive": 3 };
const GROUP_LABELS = {
  "api": "API",
  "python": "Python",
  "php": "PHP",
  "shell": "Shell",
  "healthy": "Saudavel",
  "warning": "Atencao",
  "critical": "Critico",
  "inactive": "Inativo"
};
var constants_default = { VERSION, MODULE_ID, TYPE_ICONS, COLUMNS, STATUS_ORDER, GROUP_LABELS };
function info() {
  return { moduleId: "panels-ui-table-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-ui-table-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  COLUMNS,
  GROUP_LABELS,
  MODULE_ID,
  STATUS_ORDER,
  TYPE_ICONS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
