const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-uarps-monitor:utils/formatters";
function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}
function timeAgo(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const now = /* @__PURE__ */ new Date();
  const diff = Math.floor((now - d) / 1e3);
  if (diff < 60) return `${diff}s atr\xE1s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m atr\xE1s`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h atr\xE1s`;
  return `${Math.floor(diff / 86400)}d atr\xE1s`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
export {
  MODULE_ID,
  VERSION,
  formatDate,
  info,
  timeAgo
};
