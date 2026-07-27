import Icons from "../../ui/icons.js";
const MODULE_ID = "app-shell.devtools.panel.helpers";
const VERSION = "1.1.0-AAA";
function icon(name, size) {
  return Icons.icon(name, size || 16);
}
function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
function formatTime(ms) {
  if (ms < 1e3) return `${Math.round(ms)}ms`;
  return `${(ms / 1e3).toFixed(2)}s`;
}
function formatDate(ts) {
  return new Date(ts).toLocaleString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}
function sanitizeAttr(str) {
  if (!str) return "";
  return String(str).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
function statusClass(status) {
  switch (status) {
    case "HEALTHY":
      return "dsd-ui-status--healthy";
    case "DEGRADED":
      return "dsd-ui-status--degraded";
    case "UNHEALTHY":
      return "dsd-ui-status--unhealthy";
    default:
      return "";
  }
}
function networkQualityClass(quality) {
  switch (quality) {
    case "excellent":
      return "dsd-ui-status--healthy";
    case "good":
      return "dsd-ui-status--healthy";
    case "fair":
      return "dsd-ui-status--degraded";
    case "poor":
      return "dsd-ui-status--unhealthy";
    default:
      return "";
  }
}
function getAppShell() {
  return typeof window !== "undefined" ? window.AppShell : null;
}
function getBootstrap() {
  return typeof window !== "undefined" && window.BootstrapV2 ? window.BootstrapV2 : null;
}
let _collapsedSections = {};
function setCollapsedSections(obj) {
  _collapsedSections = obj || {};
}
function getCollapsedSections() {
  return _collapsedSections;
}
function makeSectionHtml(id, titleIcon, titleText, innerHtml, defaultCollapsed) {
  const isCollapsed = _collapsedSections[id] !== void 0 ? _collapsedSections[id] : defaultCollapsed || false;
  const chevron = isCollapsed ? "chevronRight" : "chevronDown";
  return `<div class="dsd-ui-section${isCollapsed ? " collapsed" : ""}" data-section-id="${sanitizeAttr(id)}"><div class="dsd-ui-section__title dsd-ui-section__title--collapsible" data-toggle-section="${sanitizeAttr(id)}"><span class="dsd-ui-section__chevron">${icon(chevron, 12)}</span> ${icon(titleIcon)} ${titleText}</div><div class="dsd-ui-section__body"${isCollapsed ? ' style="display:none"' : ""}>${innerHtml}</div></div>`;
}
var helpers_default = {
  VERSION,
  icon,
  formatBytes,
  formatTime,
  formatDate,
  sanitizeAttr,
  statusClass,
  networkQualityClass,
  getAppShell,
  getBootstrap,
  makeSectionHtml,
  setCollapsedSections,
  getCollapsedSections
};
export {
  MODULE_ID,
  VERSION,
  helpers_default as default,
  formatBytes,
  formatDate,
  formatTime,
  getAppShell,
  getBootstrap,
  getCollapsedSections,
  icon,
  makeSectionHtml,
  networkQualityClass,
  sanitizeAttr,
  setCollapsedSections,
  statusClass
};
