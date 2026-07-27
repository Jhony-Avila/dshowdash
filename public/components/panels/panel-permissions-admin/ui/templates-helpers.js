const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-permissions-admin:templates-helpers";
function getLevelBadgeClass(level) {
  if (level >= 100) return "ppa-badge--super-admin";
  if (level >= 80) return "ppa-badge--admin";
  if (level >= 60) return "ppa-badge--moderator";
  if (level >= 40) return "ppa-badge--advanced";
  if (level >= 20) return "ppa-badge--user";
  return "ppa-badge--guest";
}
function getLevelLabel(level) {
  if (level >= 100) return "Super Admin";
  if (level >= 80) return "Admin";
  if (level >= 60) return "Moderador";
  if (level >= 40) return "Avan\xE7ado";
  if (level >= 20) return "Usu\xE1rio";
  return "Visitante";
}
function getLevelColor(level) {
  if (level >= 100) return "#9c27b0";
  if (level >= 80) return "#f44336";
  if (level >= 60) return "#ff9800";
  if (level >= 40) return "#4caf50";
  if (level >= 20) return "#2196f3";
  return "#9e9e9e";
}
function getLevelIcon(level) {
  if (level >= 100) return "crown";
  if (level >= 80) return "shield-check";
  if (level >= 60) return "shield";
  if (level >= 40) return "user-check";
  if (level >= 20) return "user";
  return "user-x";
}
function formatDate(dateString, options = {}) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const defaultOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    };
    return date.toLocaleString("pt-BR", { ...defaultOptions, ...options });
  } catch (e) {
    return dateString;
  }
}
function formatRelativeDate(dateString) {
  if (!dateString) return "-";
  try {
    const date = new Date(dateString);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffMins < 1) return "agora";
    if (diffMins < 60) return `${diffMins}m atr\xE1s`;
    if (diffHours < 24) return `${diffHours}h atr\xE1s`;
    if (diffDays < 7) return `${diffDays}d atr\xE1s`;
    return formatDate(dateString, { hour: void 0, minute: void 0 });
  } catch (e) {
    return dateString;
  }
}
function formatPermissionState(state) {
  const stateMap = {
    "allow": "Permitido",
    "deny": "Negado",
    "inherit": "Herdado"
  };
  return stateMap[state] || state || "-";
}
function getStateIcon(state) {
  const iconMap = {
    "allow": '<svg class="ppa-icon ppa-icon--allow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>',
    "deny": '<svg class="ppa-icon ppa-icon--deny" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    "inherit": '<svg class="ppa-icon ppa-icon--inherit" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>'
  };
  return iconMap[state] || "";
}
function getStateBadgeClass(state) {
  const classMap = {
    "allow": "ppa-state--allow",
    "deny": "ppa-state--deny",
    "inherit": "ppa-state--inherit"
  };
  return classMap[state] || "ppa-state--unknown";
}
function truncateText(text, maxLength = 50) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength - 3)}...`;
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function getInitials(name) {
  if (!name) return "?";
  return name.split(" ").map((n) => n[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}
function getLevelClass(level) {
  if (level >= 100) return "super-admin";
  if (level >= 80) return "admin";
  if (level >= 60) return "moderator";
  if (level >= 40) return "advanced";
  if (level >= 20) return "user";
  return "guest";
}
function groupByArea(triggers) {
  const grouped = {};
  (triggers || []).forEach((t) => {
    const area = String(t.area || t.region || "other");
    if (!grouped[area]) grouped[area] = [];
    grouped[area].push(t);
  });
  return grouped;
}
function formatArea(area) {
  const areaMap = {
    "navrail": "Nav Rail",
    "sidebar": "Sidebar",
    "footer": "Footer",
    "header": "Header",
    "panel": "Painel",
    "other": "Outros"
  };
  return areaMap[area] || area || "Outros";
}
function formatTimeAgo(timestamp) {
  if (!timestamp) return "-";
  try {
    const date = typeof timestamp === "number" ? new Date(timestamp) : new Date(timestamp);
    const now = /* @__PURE__ */ new Date();
    const diffMs = now - date;
    const diffSecs = Math.floor(diffMs / 1e3);
    const diffMins = Math.floor(diffMs / 6e4);
    const diffHours = Math.floor(diffMs / 36e5);
    const diffDays = Math.floor(diffMs / 864e5);
    if (diffSecs < 60) return "agora";
    if (diffMins < 60) return `${diffMins}m atr\xE1s`;
    if (diffHours < 24) return `${diffHours}h atr\xE1s`;
    if (diffDays < 7) return `${diffDays}d atr\xE1s`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)}sem atr\xE1s`;
    return formatDate(String(date), { hour: void 0, minute: void 0 });
  } catch (e) {
    return "-";
  }
}
function calculatePercentage(part, total) {
  if (!total || total <= 0) return 0;
  return Math.round(part / total * 100);
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    note: "UI visual helpers only - not access control"
  };
}
function getVersion() {
  return VERSION;
}
var templates_helpers_default = {
  VERSION,
  MODULE_ID,
  getLevelBadgeClass,
  getLevelLabel,
  getLevelColor,
  getLevelIcon,
  formatDate,
  formatRelativeDate,
  formatPermissionState,
  getStateIcon,
  getStateBadgeClass,
  truncateText,
  escapeHtml,
  getInitials,
  getLevelClass,
  groupByArea,
  formatArea,
  formatTimeAgo,
  calculatePercentage,
  healthCheck,
  getVersion
};
export {
  MODULE_ID,
  VERSION,
  calculatePercentage,
  templates_helpers_default as default,
  escapeHtml,
  formatArea,
  formatDate,
  formatPermissionState,
  formatRelativeDate,
  formatTimeAgo,
  getInitials,
  getLevelBadgeClass,
  getLevelClass,
  getLevelColor,
  getLevelIcon,
  getLevelLabel,
  getStateBadgeClass,
  getStateIcon,
  getVersion,
  groupByArea,
  healthCheck,
  truncateText
};
