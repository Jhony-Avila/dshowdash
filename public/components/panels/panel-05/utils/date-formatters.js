function formatRelativeTime(date) {
  if (!date) return "\u2014";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "\u2014";
  const now = /* @__PURE__ */ new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1e3);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  if (diffSec < 60) return "agora";
  if (diffMin < 60) return `${diffMin}min atr\xE1s`;
  if (diffHour < 24) return `${diffHour}h atr\xE1s`;
  if (diffDay < 7) return `${diffDay}d atr\xE1s`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}sem atr\xE1s`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}m atr\xE1s`;
  return `${Math.floor(diffDay / 365)}a atr\xE1s`;
}
function formatDate(date, options = {}) {
  const { format = "short" } = options;
  if (!date) return "\u2014";
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) return "\u2014";
  switch (format) {
    case "full":
      return d.toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
    case "long":
      return d.toLocaleDateString("pt-BR", { year: "numeric", month: "long", day: "numeric" });
    case "medium":
      return d.toLocaleDateString("pt-BR", { year: "numeric", month: "short", day: "numeric" });
    case "iso":
      return d.toISOString().slice(0, 10);
    case "time":
      return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    case "datetime":
      return `${d.toLocaleDateString("pt-BR")} ${d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`;
    case "relative":
      return formatRelativeTime(d);
    default:
      return d.toLocaleDateString("pt-BR");
  }
}
var date_formatters_default = { formatDate, formatRelativeTime };
const MODULE_ID = "panel-05:utils:date-formatters";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dateFormattersReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  date_formatters_default as default,
  formatDate,
  formatRelativeTime,
  healthCheck,
  info
};
