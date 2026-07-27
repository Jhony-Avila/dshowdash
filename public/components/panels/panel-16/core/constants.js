const MODULE_ID = "panel-16-core-constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PAINEL_ID = "panel-16";
const TITLE = "Fornecedores 360\xBA";
const API_ENDPOINT = "/api/modules/panels/panel-16/api.php";
const CSS_PATH = "/components/panels/panel-16/styles/index.css";
const REFRESH_INTERVAL_BASE = 12e4;
const REFRESH_INTERVAL_DEGRADED = 3e5;
const PERIODS = [
  { value: 30, label: "30d" },
  { value: 60, label: "60d" },
  { value: 90, label: "90d" },
  { value: 180, label: "6m" },
  { value: 365, label: "1a" },
  { value: 0, label: "Tudo" }
];
const COLUMNS = [
  { id: "checkbox", label: "", visible: true, locked: true },
  { id: "nome", label: "Fornecedor", visible: true, locked: true },
  { id: "cnpj", label: "CNPJ/CPF", visible: true },
  { id: "local", label: "Local", visible: true },
  { id: "total_pago", label: "Total Pago", visible: true },
  { id: "qtd_requisicoes", label: "Req.", visible: true },
  { id: "pix", label: "PIX", visible: true },
  { id: "status", label: "Status", visible: true },
  { id: "risco", label: "Risco", visible: true },
  { id: "action", label: "A\xE7\xE3o", visible: true, locked: true }
];
const DEFAULT_VIEWS = [
  { id: "default", name: "Vis\xE3o Padr\xE3o", icon: "grid", desc: "Todas as colunas", filters: {}, columns: COLUMNS.map((c) => c.id) },
  { id: "compact", name: "Compacto", icon: "list", desc: "Essencial apenas", filters: {}, columns: ["checkbox", "nome", "total_pago", "status", "action"] },
  { id: "finance", name: "Financeiro", icon: "wallet", desc: "Foco em valores", filters: {}, columns: ["checkbox", "nome", "total_pago", "qtd_requisicoes", "pix", "action"] },
  { id: "risk", name: "An\xE1lise de Risco", icon: "alertTriangle", desc: "Foco em riscos", filters: { status: "Desatualizado" }, columns: ["checkbox", "nome", "status", "risco", "action"] }
];
const GROUP_OPTIONS = [
  { value: "", label: "Sem agrupamento" },
  { value: "uf", label: "Por UF" },
  { value: "status", label: "Por Status" },
  { value: "tipo", label: "Por Tipo" },
  { value: "risco", label: "Por Risco" }
];
const RISCO_LEVELS = { baixo: { label: "Baixo", color: "#10b981" }, medio: { label: "M\xE9dio", color: "#f59e0b" }, alto: { label: "Alto", color: "#ef4444" } };
const STATUS_MAP = { Ativo: { label: "Ativo", color: "#10b981", bg: "rgba(16, 185, 129, 0.12)" }, Desatualizado: { label: "Desatualizado", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.12)" }, Inativo: { label: "Inativo", color: "#ef4444", bg: "rgba(239, 68, 68, 0.12)" } };
const TIPO_MAP = { PJ: { label: "Pessoa Jur\xEDdica", color: "#3b82f6" }, PF: { label: "Pessoa F\xEDsica", color: "#8b5cf6" } };
const ICONS = {
  building: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/></svg>',
  users: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  search: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
  filter: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>',
  download: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>',
  refresh: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M3 21v-5h5"/></svg>',
  eye: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
  alertTriangle: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  x: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
  chevronLeft: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
  chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>',
  grid: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
  list: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" x2="21" y1="6" y2="6"/><line x1="8" x2="21" y1="12" y2="12"/><line x1="8" x2="21" y1="18" y2="18"/><line x1="3" x2="3.01" y1="6" y2="6"/><line x1="3" x2="3.01" y1="12" y2="12"/><line x1="3" x2="3.01" y1="18" y2="18"/></svg>',
  wallet: '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>'
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
var constants_default = { MODULE_ID, VERSION, PAINEL_ID, TITLE, API_ENDPOINT, CSS_PATH, REFRESH_INTERVAL_BASE, REFRESH_INTERVAL_DEGRADED, PERIODS, COLUMNS, DEFAULT_VIEWS, GROUP_OPTIONS, RISCO_LEVELS, STATUS_MAP, TIPO_MAP, ICONS, info, healthCheck };
const MODULE_VERSION = VERSION;
const PANEL_TITLE = TITLE;
const REQUEST_TIMEOUT = 1e4;
const MAX_CONSECUTIVE_ERRORS = 3;
const CIRCUIT_BREAKER_THRESHOLD = 5;
const CIRCUIT_BREAKER_TIMEOUT = 3e4;
const STATES = Object.freeze({
  IDLE: "IDLE",
  MOUNTING: "MOUNTING",
  MOUNTED: "MOUNTED",
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
  DEGRADED: "DEGRADED",
  UNMOUNTING: "UNMOUNTING",
  DESTROYED: "DESTROYED"
});
export {
  API_ENDPOINT,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  COLUMNS,
  CSS_PATH,
  DEFAULT_VIEWS,
  GROUP_OPTIONS,
  ICONS,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  MODULE_VERSION,
  PAINEL_ID,
  PANEL_TITLE,
  PERIODS,
  REFRESH_INTERVAL_BASE,
  REFRESH_INTERVAL_DEGRADED,
  REQUEST_TIMEOUT,
  RISCO_LEVELS,
  STATES,
  STATUS_MAP,
  TIPO_MAP,
  TITLE,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
