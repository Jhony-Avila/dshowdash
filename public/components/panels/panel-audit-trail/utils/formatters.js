const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-formatters";
const TIMEZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";
function formatTimestamp(ts, options = {}) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const defaultOptions = {
      timeZone: TIMEZONE,
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    };
    return date.toLocaleString(LOCALE, { ...defaultOptions, ...options });
  } catch (e) {
    return String(ts);
  }
}
function formatDateOnly(ts) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE });
  } catch (e) {
    return String(ts);
  }
}
function formatTimeOnly(ts) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    return date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE });
  } catch (e) {
    return String(ts);
  }
}
function formatRelativeTime(ts) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1e3);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 10) return "agora";
    if (diffSec < 60) return `${diffSec}s atr\xE1s`;
    if (diffMin < 60) return `${diffMin} min atr\xE1s`;
    if (diffHour < 24) return `${diffHour}h atr\xE1s`;
    if (diffDay < 7) return `${diffDay}d atr\xE1s`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} sem atr\xE1s`;
    return formatDateOnly(ts);
  } catch (e) {
    return String(ts);
  }
}
function formatCompactDate(ts) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const now = /* @__PURE__ */ new Date();
    const isToday = date.toDateString() === now.toDateString();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    if (isToday) {
      return date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" });
    }
    if (isYesterday) {
      return `Ontem ${date.toLocaleTimeString(LOCALE, { timeZone: TIMEZONE, hour: "2-digit", minute: "2-digit" })}`;
    }
    return date.toLocaleDateString(LOCALE, { timeZone: TIMEZONE, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    return String(ts);
  }
}
function formatJson(obj, pretty = true) {
  if (obj === null || obj === void 0) return "-";
  try {
    if (typeof obj === "string") {
      try {
        const parsed = JSON.parse(obj);
        return pretty ? JSON.stringify(parsed, null, 2) : JSON.stringify(parsed);
      } catch (e) {
        return obj;
      }
    }
    return pretty ? JSON.stringify(obj, null, 2) : JSON.stringify(obj);
  } catch (e) {
    return String(obj);
  }
}
function truncate(str, maxLen = 100, suffix = "...") {
  if (!str) return "";
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.substring(0, maxLen - suffix.length) + suffix;
}
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}
function slugify(str) {
  if (!str) return "";
  return String(str).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function capitalize(str) {
  if (!str) return "";
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}
function formatBytes(bytes, decimals = 2) {
  if (!bytes || bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}
function formatNumber(num, options = {}) {
  if (num === null || num === void 0) return "-";
  return new Intl.NumberFormat(LOCALE, options).format(num);
}
function formatPercent(num, decimals = 1) {
  if (num === null || num === void 0) return "-";
  return `${num.toFixed(decimals)}%`;
}
function formatDuration(ms) {
  if (!ms || ms < 0) return "-";
  if (ms < 1e3) return `${ms}ms`;
  if (ms < 6e4) return `${(ms / 1e3).toFixed(1)}s`;
  if (ms < 36e5) return `${Math.floor(ms / 6e4)}m ${Math.floor(ms % 6e4 / 1e3)}s`;
  const hours = Math.floor(ms / 36e5);
  const minutes = Math.floor(ms % 36e5 / 6e4);
  return `${hours}h ${minutes}m`;
}
function maskSensitiveData(str, visibleStart = 4, visibleEnd = 0) {
  if (!str) return "";
  const s = String(str);
  if (s.length <= visibleStart + visibleEnd) {
    return "*".repeat(s.length);
  }
  const start = s.substring(0, visibleStart);
  const end = visibleEnd > 0 ? s.substring(s.length - visibleEnd) : "";
  const maskLen = Math.min(s.length - visibleStart - visibleEnd, 8);
  return start + "*".repeat(maskLen) + end;
}
function maskEmail(email) {
  if (!email || !email.includes("@")) return maskSensitiveData(email);
  const [local, domain] = email.split("@");
  let maskedLocal;
  if (local.length > 2) {
    const maskLen = Math.min(local.length - 2, 5);
    maskedLocal = local[0] + "*".repeat(maskLen) + local[local.length - 1];
  } else {
    maskedLocal = "*".repeat(local.length);
  }
  return `${maskedLocal}@${domain}`;
}
function maskIP(ip) {
  if (!ip) return "-";
  const parts = String(ip).split(".");
  if (parts.length !== 4) return maskSensitiveData(ip);
  return `${parts[0]}.${parts[1]}.***.***`;
}
function getSeverityLabel(severity) {
  const labels = {
    "INFO": "Info",
    "WARNING": "Warning",
    "WARN": "Warning",
    "ERROR": "Error",
    "CRITICAL": "Critical",
    "SECURITY": "Security"
  };
  return labels[(severity || "").toUpperCase()] || severity || "-";
}
function getActionLabel(action) {
  const labels = {
    "CREATE": "Criar",
    "READ": "Ler",
    "UPDATE": "Atualizar",
    "DELETE": "Excluir",
    "LOGIN": "Login",
    "LOGOUT": "Logout",
    "GRANT": "Conceder",
    "REVOKE": "Revogar",
    "EXECUTE": "Executar"
  };
  return labels[(action || "").toUpperCase()] || action || "-";
}
function getVersion() {
  return VERSION;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formattersCount: 18
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      formatTimestampReady: typeof formatTimestamp === "function",
      formatJsonReady: typeof formatJson === "function",
      maskSensitiveDataReady: typeof maskSensitiveData === "function"
    }
  };
}
var formatters_default = {
  VERSION,
  MODULE_ID,
  formatTimestamp,
  formatDateOnly,
  formatTimeOnly,
  formatRelativeTime,
  formatCompactDate,
  formatJson,
  truncate,
  escapeHtml,
  slugify,
  capitalize,
  formatBytes,
  formatNumber,
  formatPercent,
  formatDuration,
  maskSensitiveData,
  maskEmail,
  maskIP,
  getSeverityLabel,
  getActionLabel,
  getVersion,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  capitalize,
  formatters_default as default,
  escapeHtml,
  formatBytes,
  formatCompactDate,
  formatDateOnly,
  formatDuration,
  formatJson,
  formatNumber,
  formatPercent,
  formatRelativeTime,
  formatTimeOnly,
  formatTimestamp,
  getActionLabel,
  getSeverityLabel,
  getVersion,
  healthCheck,
  info,
  maskEmail,
  maskIP,
  maskSensitiveData,
  slugify,
  truncate
};
