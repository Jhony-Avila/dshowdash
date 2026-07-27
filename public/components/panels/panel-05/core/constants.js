const PANEL_ID = "panel-05";
const MODULE_ID = "panel-05.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_TITLE = "Clientes 360\xBA";
const PANEL_DESCRIPTION = "Gest\xE3o estrat\xE9gica de clientes e relacionamentos";
const API_PATH = "/api/modules/panels/panel-05/api.php";
const CSS_PATH = "/components/panels/panel-05/styles/main.css";
const REFRESH_INTERVAL = 6e4;
const REQUEST_TIMEOUT = 2e4;
const ITEMS_PER_PAGE = 25;
const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  ERROR: "error",
  DETAIL: "detail"
};
const STATUS_CONFIG = {
  ativo: { label: "Ativo", color: "#22C55E", bg: "rgba(34,197,94,0.12)" },
  inativo: { label: "Inativo", color: "#6B7280", bg: "rgba(107,114,128,0.12)" }
};
const RISCO_CONFIG = {
  baixo: { label: "Baixo", color: "#22C55E", bg: "rgba(34,197,94,0.12)", icon: "shieldCheck" },
  medio: { label: "M\xE9dio", color: "#F59E0B", bg: "rgba(245,158,11,0.12)", icon: "alertTriangle" },
  alto: { label: "Alto", color: "#EF4444", bg: "rgba(239,68,68,0.12)", icon: "alertCircle" },
  critico: { label: "Cr\xEDtico", color: "#DC2626", bg: "rgba(220,38,38,0.15)", icon: "xCircle" }
};
const TIPO_NEGOCIO_CONFIG = {
  "Venda": { color: "#3B82F6", icon: "shoppingCart" },
  "Loca\xE7\xE3o": { color: "#8B5CF6", icon: "calendar" },
  "Servi\xE7o": { color: "#10B981", icon: "wrench" },
  "POC": { color: "#F59E0B", icon: "flask" },
  "Digital Signage": { color: "#EC4899", icon: "monitor" }
};
const UF_LIST = [
  "AC",
  "AL",
  "AM",
  "AP",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MG",
  "MS",
  "MT",
  "PA",
  "PB",
  "PE",
  "PI",
  "PR",
  "RJ",
  "RN",
  "RO",
  "RR",
  "RS",
  "SC",
  "SE",
  "SP",
  "TO"
];
const PORTE_LIST = [
  "Microempresa (me)",
  "Micro Empresa",
  "Pequena Empresa",
  "Empresa de Pequeno Porte (epp)",
  "Demais",
  "Demais Empresas"
];
const EXPORT_FORMATS = ["csv", "excel", "pdf"];
const THEME_OPTIONS = ["light", "dark", "system"];
var constants_default = {
  PANEL_ID,
  MODULE_ID,
  VERSION,
  PANEL_TITLE,
  PANEL_DESCRIPTION,
  API_PATH,
  CSS_PATH,
  REFRESH_INTERVAL,
  REQUEST_TIMEOUT,
  ITEMS_PER_PAGE,
  STATES,
  STATUS_CONFIG,
  RISCO_CONFIG,
  TIPO_NEGOCIO_CONFIG,
  UF_LIST,
  PORTE_LIST,
  EXPORT_FORMATS,
  THEME_OPTIONS
};
function info() {
  return { moduleId: "panels-panel-05-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-05-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  API_PATH,
  CSS_PATH,
  EXPORT_FORMATS,
  ITEMS_PER_PAGE,
  MODULE_ID,
  PANEL_DESCRIPTION,
  PANEL_ID,
  PANEL_TITLE,
  PORTE_LIST,
  REFRESH_INTERVAL,
  REQUEST_TIMEOUT,
  RISCO_CONFIG,
  STATES,
  STATUS_CONFIG,
  THEME_OPTIONS,
  TIPO_NEGOCIO_CONFIG,
  UF_LIST,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
