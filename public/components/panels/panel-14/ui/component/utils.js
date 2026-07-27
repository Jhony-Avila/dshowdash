function formatNumber(val) {
  if (val == null) return "--";
  const n = parseInt(String(val));
  if (isNaN(n)) return val;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("pt-BR");
}
function formatDate(dateStr) {
  if (!dateStr) return "--";
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}
function formatErrorMessage(msg) {
  if (!msg) return "Erro desconhecido";
  if (msg.length > 80) return `${msg.substring(0, 80)}...`;
  return msg;
}
function hashData(data) {
  if (!data) return null;
  try {
    return JSON.stringify(data);
  } catch {
    return null;
  }
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
var utils_default = { formatNumber, formatDate, formatErrorMessage, hashData, downloadFile };
const MODULE_ID = "panel-14.ui.utils";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { utilsReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  utils_default as default,
  downloadFile,
  formatDate,
  formatErrorMessage,
  formatNumber,
  hashData,
  healthCheck,
  info
};
