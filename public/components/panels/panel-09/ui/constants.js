const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-09-ui";
const ALERT_THRESHOLD = 10;
const SVGS = {
  calendar: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  calendarDays: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>',
  calendarRange: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/><path d="M7 14h.01"/><path d="M17 18h.01"/></svg>'
};
const PERIODS = {
  today_vs_yesterday: { label: "Di\xE1rio", icon: SVGS.calendar, tabLabel: "Hoje vs Ontem" },
  this_week_vs_last_week: { label: "Semanal", icon: SVGS.calendarDays, tabLabel: "Semana" },
  this_month_vs_last_month: { label: "Mensal", icon: SVGS.calendarRange, tabLabel: "M\xEAs" }
};
const STATUS_COLORS = {
  success: "#22c55e",
  error: "#ef4444",
  timeout: "#f59e0b",
  running: "#6366f1"
};
const STATUS_LABELS = {
  success: "Sucesso",
  error: "Erro",
  timeout: "Timeout",
  running: "Executando"
};
var constants_default = { VERSION, MODULE_ID, ALERT_THRESHOLD, PERIODS, STATUS_COLORS, STATUS_LABELS };
function info() {
  return { moduleId: "panels-panel-09-ui-constants", version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-09-ui-constants", version: VERSION, checks: { constantsLoaded: true } };
}
export {
  ALERT_THRESHOLD,
  MODULE_ID,
  PERIODS,
  STATUS_COLORS,
  STATUS_LABELS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
