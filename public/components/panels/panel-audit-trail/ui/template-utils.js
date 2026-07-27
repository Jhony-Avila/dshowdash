const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-template-utils";
function formatTimestamp(ts) {
  if (!ts) return "-";
  try {
    return new Date(ts).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch (e) {
    return ts;
  }
}
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}
function truncate(str, maxLen = 100) {
  if (!str) return "";
  str = String(str);
  return str.length > maxLen ? `${str.substring(0, maxLen)}...` : str;
}
function getToastIcon(type) {
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  return icons[type] || '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>';
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      templateUtilsReady: true
    },
    timestamp: Date.now()
  };
}
var template_utils_default = {
  VERSION,
  MODULE_ID,
  formatTimestamp,
  escapeHtml,
  truncate,
  getToastIcon,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  template_utils_default as default,
  escapeHtml,
  formatTimestamp,
  getToastIcon,
  healthCheck,
  info,
  truncate
};
