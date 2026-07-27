function hashData(data) {
  if (!data) return null;
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
}
function formatNumber(val) {
  if (val == null) return "--";
  const n = parseInt(val);
  if (isNaN(n)) return val;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}
function truncate(str, len) {
  if (!str) return "";
  return str.length > len ? `${str.substring(0, len)}...` : str;
}
function calculateHealthStatus(data) {
  const dataNode = data?.data || {};
  const exec = dataNode.executions || {};
  const total = parseInt(exec.total) || 1;
  const error = parseInt(exec.error) || 0;
  const errorRate = error / total * 100;
  if (errorRate > 20) return "critical";
  if (errorRate > 10) return "warning";
  return "healthy";
}
function calculateAvgRate(trend) {
  if (!trend || !trend.length) return 0;
  return trend.reduce((acc, t) => acc + (parseFloat(t.success_rate) || 0), 0) / trend.length;
}
function extractJobName(errorMsg) {
  if (!errorMsg) return null;
  const match = errorMsg.match(/PROCEDURE\s+[\w.]+\.(\w+)/i);
  return match ? match[1] : null;
}
function downloadFile(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
var helpers_default = { hashData, formatNumber, truncate, calculateHealthStatus, calculateAvgRate, extractJobName, downloadFile };
const MODULE_ID = "panels-panel-11-ui-helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  calculateAvgRate,
  calculateHealthStatus,
  helpers_default as default,
  downloadFile,
  extractJobName,
  formatNumber,
  hashData,
  healthCheck,
  info,
  truncate
};
