import { TYPE_ICONS } from "./constants.js";
function getTypeIcon(type) {
  return TYPE_ICONS[type] || TYPE_ICONS["API"];
}
function getTypeClass(type) {
  const map = { "PYTHON": "type-python", "SHELL": "type-shell", "PHP": "type-php", "API": "type-api", "CRON": "type-shell" };
  return map[type] || "type-api";
}
function getStatusFromHealth(healthStatus, isRunning) {
  if (isRunning) return { className: "status-running", text: "Rodando" };
  const statusMap = {
    "healthy": { className: "status-active", text: "Saudavel" },
    "warning": { className: "status-warning", text: "Atencao" },
    "critical": { className: "status-error", text: "Critico" },
    "inactive": { className: "status-inactive", text: "Inativo" }
  };
  return statusMap[healthStatus] || statusMap["inactive"];
}
function getRateClass(rate, sla) {
  const threshold = sla?.success_rate?.threshold || 95;
  if (rate >= threshold) return "high";
  if (rate >= 80) return "medium";
  return "low";
}
function getRowClass(healthStatus) {
  const classMap = { "critical": "row-error", "warning": "row-warning", "inactive": "row-inactive", "healthy": "" };
  return classMap[healthStatus] || "";
}
function inferHealthStatus(job) {
  const isActive = job.is_active == 1;
  const errors = parseInt(String(job.error_count || 0));
  const successRate = parseFloat(String(job.success_rate || 100));
  if (!isActive) return "inactive";
  if (errors > 5 || successRate < 80) return "critical";
  if (errors > 0 || successRate < 95) return "warning";
  return "healthy";
}
var formatters_default = { getTypeIcon, getTypeClass, getStatusFromHealth, getRateClass, getRowClass, inferHealthStatus };
const MODULE_ID = "panel-02/ui/table/formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  formatters_default as default,
  getRateClass,
  getRowClass,
  getStatusFromHealth,
  getTypeClass,
  getTypeIcon,
  healthCheck,
  inferHealthStatus,
  info
};
