const MODULE_ID = "panel-04/core/constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PAINEL_ID = "panel-04";
const PANEL_TITLE = "Tabela de Incidentes";
const REFRESH_INTERVAL_SECONDS = 60;
const REQUEST_TIMEOUT = 15e3;
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
const SEVERITY_SVGS = {
  critical: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#dc2626"/></svg>',
  high: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#ef4444"/></svg>',
  medium: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#f59e0b"/></svg>',
  low: '<svg width="12" height="12" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#22c55e"/></svg>'
};
const ALERT_TYPES = Object.freeze({
  "alert-critical": { label: "Cr\xEDtico", color: "#dc2626", bg: "rgba(220,38,38,0.15)", icon: SEVERITY_SVGS.critical, order: 0 },
  "alert-high": { label: "Alto", color: "#ef4444", bg: "rgba(239,68,68,0.15)", icon: SEVERITY_SVGS.high, order: 1 },
  "alert-medium": { label: "M\xE9dio", color: "#f59e0b", bg: "rgba(245,158,11,0.15)", icon: SEVERITY_SVGS.medium, order: 2 },
  "alert-low": { label: "Baixo", color: "#22c55e", bg: "rgba(34,197,94,0.15)", icon: SEVERITY_SVGS.low, order: 3 }
});
const DEFAULT_PERFORMANCE_METRICS = Object.freeze({
  mountTime: 0,
  avgLoadTime: 0,
  totalRequests: 0,
  failedRequests: 0,
  successRate: 100
});
function getErrorMessage(error) {
  if (!error) return "Erro desconhecido";
  if (typeof error === "string") return error;
  const e = error;
  return e.message || e.error || "Erro desconhecido";
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    constants: { statesCount: Object.keys(STATES).length, alertTypesCount: Object.keys(ALERT_TYPES).length }
  };
}
var constants_default = {
  MODULE_ID,
  VERSION,
  PAINEL_ID,
  PANEL_TITLE,
  REFRESH_INTERVAL_SECONDS,
  REQUEST_TIMEOUT,
  MAX_CONSECUTIVE_ERRORS,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  STATES,
  ALERT_TYPES,
  DEFAULT_PERFORMANCE_METRICS
};
export {
  ALERT_TYPES,
  CIRCUIT_BREAKER_THRESHOLD,
  CIRCUIT_BREAKER_TIMEOUT,
  DEFAULT_PERFORMANCE_METRICS,
  MAX_CONSECUTIVE_ERRORS,
  MODULE_ID,
  PAINEL_ID,
  PANEL_TITLE,
  REFRESH_INTERVAL_SECONDS,
  REQUEST_TIMEOUT,
  STATES,
  VERSION,
  constants_default as default,
  getErrorMessage,
  healthCheck,
  info
};
