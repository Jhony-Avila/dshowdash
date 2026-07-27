const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin-formatters";
const TIMEZONE = "America/Sao_Paulo";
const LOCALE = "pt-BR";
function formatTimestamp(ts, options = {}) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const defaultOptions = { timeZone: TIMEZONE, day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit" };
    for (const k in options) {
      if (Object.prototype.hasOwnProperty.call(options, k)) defaultOptions[k] = options[k];
    }
    return date.toLocaleString(LOCALE, defaultOptions);
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
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1e3);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    if (diffSec < 10) return "Agora";
    if (diffSec < 60) return `${diffSec}s atr\xE1s`;
    if (diffMin < 60) return `${diffMin}min atr\xE1s`;
    if (diffHour < 24) return `${diffHour}h atr\xE1s`;
    if (diffDay < 7) return `${diffDay}d atr\xE1s`;
    return formatDateOnly(ts);
  } catch (e) {
    return String(ts);
  }
}
function formatExpiresAt(ts) {
  if (!ts) return "-";
  try {
    const date = new Date(ts);
    if (isNaN(date.getTime())) return String(ts);
    const now = /* @__PURE__ */ new Date();
    if (date < now) return "Expirada";
    const diffMs = date - now;
    const diffHour = Math.floor(diffMs / 36e5);
    const diffDay = Math.floor(diffHour / 24);
    if (diffHour < 1) return "Em breve";
    if (diffHour < 24) return `Em ${diffHour}h`;
    return `Em ${diffDay}d`;
  } catch (e) {
    return String(ts);
  }
}
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = String(str);
  return div.innerHTML;
}
function truncate(str, maxLen = 50, suffix = "...") {
  if (!str) return "";
  const s = String(str);
  if (s.length <= maxLen) return s;
  return s.substring(0, maxLen - suffix.length) + suffix;
}
function capitalize(str) {
  if (!str) return "";
  return String(str).charAt(0).toUpperCase() + String(str).slice(1).toLowerCase();
}
function formatDeviceType(deviceType) {
  const type = (deviceType || "desktop").toLowerCase();
  if (type.indexOf("mobile") !== -1 || type.indexOf("phone") !== -1) return "Mobile";
  if (type.indexOf("tablet") !== -1) return "Tablet";
  return "Desktop";
}
function formatBrowser(browser) {
  if (!browser) return "-";
  const b = String(browser).toLowerCase();
  if (b.indexOf("chrome") !== -1) return "Chrome";
  if (b.indexOf("firefox") !== -1) return "Firefox";
  if (b.indexOf("safari") !== -1) return "Safari";
  if (b.indexOf("edge") !== -1) return "Edge";
  if (b.indexOf("opera") !== -1) return "Opera";
  return capitalize(browser);
}
function formatOS(os) {
  if (!os) return "-";
  const o = String(os).toLowerCase();
  if (o.indexOf("windows") !== -1) return "Windows";
  if (o.indexOf("mac") !== -1 || o.indexOf("darwin") !== -1) return "macOS";
  if (o.indexOf("linux") !== -1) return "Linux";
  if (o.indexOf("android") !== -1) return "Android";
  if (o.indexOf("ios") !== -1 || o.indexOf("iphone") !== -1 || o.indexOf("ipad") !== -1) return "iOS";
  return capitalize(os);
}
function formatIP(ip) {
  if (!ip) return "-";
  return String(ip);
}
function maskIP(ip, level = "partial") {
  if (!ip) return "-";
  const parts = String(ip).split(".");
  if (parts.length !== 4) return ip;
  if (level === "full") return `***.***.***.${parts[3]}`;
  return `${parts[0]}.${parts[1]}.***.***`;
}
function formatStatus(isActive, isCurrent) {
  if (isCurrent) return "Atual";
  if (isActive) return "Ativa";
  return "Inativa";
}
function getStatusClass(isActive, isCurrent) {
  if (isCurrent) return "psa__badge--info";
  if (isActive) return "psa__badge--success";
  return "psa__badge--muted";
}
function formatSessionSummary(sessions) {
  const total = sessions ? sessions.length : 0;
  let active = 0, current = 0;
  if (sessions) {
    for (let i = 0; i < sessions.length; i++) {
      if (sessions[i].is_active) active++;
      if (sessions[i].is_current) current++;
    }
  }
  return { total, active, current, inactive: total - active };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { formatTimestampReady: typeof formatTimestamp === "function", escapeHtmlReady: typeof escapeHtml === "function" } };
}
var formatters_default = { VERSION, MODULE_ID, formatTimestamp, formatDateOnly, formatTimeOnly, formatRelativeTime, formatExpiresAt, escapeHtml, truncate, capitalize, formatDeviceType, formatBrowser, formatOS, formatIP, maskIP, formatStatus, getStatusClass, formatSessionSummary, getVersion, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  capitalize,
  formatters_default as default,
  escapeHtml,
  formatBrowser,
  formatDateOnly,
  formatDeviceType,
  formatExpiresAt,
  formatIP,
  formatOS,
  formatRelativeTime,
  formatSessionSummary,
  formatStatus,
  formatTimeOnly,
  formatTimestamp,
  getStatusClass,
  getVersion,
  healthCheck,
  info,
  maskIP,
  truncate
};
