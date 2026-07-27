const MODULE_ID = "panel-09.ui.helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
function createButton(text, options = {}) {
  const { type = "default", icon = null, disabled = false, onClick } = options;
  const btn = document.createElement("button");
  btn.className = `btn btn-${type}`;
  btn.disabled = disabled;
  btn.innerHTML = icon ? `<i class="fas ${icon}"></i> ${text}` : text;
  if (onClick) btn.addEventListener("click", onClick);
  return btn;
}
function createBadge(text, type = "info") {
  return `<span class="badge badge-${type}">${text}</span>`;
}
function createTooltip(element, text) {
  element.setAttribute("title", text);
  element.setAttribute("data-toggle", "tooltip");
}
function formatCellValue(value, type = "text") {
  if (value == null) return "-";
  if (type === "date") return new Date(value).toLocaleDateString("pt-BR");
  if (type === "currency") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  return String(value);
}
var helpers_default = { createButton, createBadge, createTooltip, formatCellValue };
const ARROW_SVGS = {
  up: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M5 2l4 6H1z" fill="currentColor"/></svg>',
  down: '<svg viewBox="0 0 10 10" width="10" height="10"><path d="M5 8L1 2h8z" fill="currentColor"/></svg>',
  neutral: '<svg viewBox="0 0 10 10" width="10" height="10"><rect x="1" y="4" width="8" height="2" fill="currentColor"/></svg>'
};
function downloadFile(content, filename, mimeType = "text/plain") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function formatNumber(value, decimals = 2, locale = "pt-BR") {
  if (value == null || isNaN(value)) return "-";
  return new Intl.NumberFormat(locale, { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(value);
}
function getChangeArrow(value) {
  if (value > 0) return ARROW_SVGS.up;
  if (value < 0) return ARROW_SVGS.down;
  return ARROW_SVGS.neutral;
}
function getChangeColor(value) {
  if (value > 0) return "text-success";
  if (value < 0) return "text-danger";
  return "text-muted";
}
function getRateColor(rate, thresholdWarn = 80, thresholdDanger = 95) {
  if (rate >= thresholdDanger) return "text-danger";
  if (rate >= thresholdWarn) return "text-warning";
  return "text-success";
}
function formatTime(value, locale = "pt-BR") {
  if (value == null) return "-";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return String(value);
  return d.toLocaleTimeString(locale);
}
function hashData(data) {
  const str = typeof data === "string" ? data : JSON.stringify(data);
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return (hash >>> 0).toString(16);
}
export {
  ARROW_SVGS,
  MODULE_ID,
  VERSION,
  createBadge,
  createButton,
  createTooltip,
  helpers_default as default,
  downloadFile,
  formatCellValue,
  formatNumber,
  formatTime,
  getChangeArrow,
  getChangeColor,
  getRateColor,
  hashData
};
