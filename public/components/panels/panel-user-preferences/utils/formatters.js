const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences/utils/formatters";
function formatDate(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "--";
  }
}
function formatDateTime(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  } catch {
    return "--";
  }
}
function formatRelativeTime(dateStr) {
  if (!dateStr) return "--";
  try {
    const date = new Date(dateStr);
    const now = /* @__PURE__ */ new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 6e4);
    const hours = Math.floor(diff / 36e5);
    const days = Math.floor(diff / 864e5);
    if (mins < 1) return "agora";
    if (mins < 60) return `${mins} min atr\xE1s`;
    if (hours < 24) return `${hours}h atr\xE1s`;
    if (days < 7) return `${days}d atr\xE1s`;
    return date.toLocaleDateString("pt-BR");
  } catch {
    return "--";
  }
}
function formatTheme(theme) {
  const map = { light: "\u2600\uFE0F Claro", dark: "\u{1F319} Escuro", system: "\u{1F5A5}\uFE0F Sistema", auto: "\u{1F504} Autom\xE1tico" };
  return map[theme] || theme || "--";
}
function formatDensity(density) {
  const map = { compact: "Compacto", comfortable: "Confort\xE1vel", spacious: "Espa\xE7oso" };
  return map[density] || density || "--";
}
function formatLanguage(lang) {
  const map = { "pt-BR": "\u{1F1E7}\u{1F1F7} Portugu\xEAs", "en-US": "\u{1F1FA}\u{1F1F8} English", "es-ES": "\u{1F1EA}\u{1F1F8} Espa\xF1ol" };
  return map[lang] || lang || "--";
}
function formatFontSize(size) {
  const map = { small: "Pequeno", medium: "M\xE9dio", large: "Grande", "x-large": "Extra Grande" };
  return map[size] || size || "--";
}
function formatBoolean(value, trueText = "Sim", falseText = "N\xE3o") {
  return value ? trueText : falseText;
}
function formatToggle(value) {
  return value ? "\u2713 Ativo" : "\u2717 Inativo";
}
function escapeHtml(text) {
  if (!text) return "";
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
function truncate(text, maxLength = 50) {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
}
function debounce(fn, delay = 300) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var formatters_default = { formatDate, formatDateTime, formatRelativeTime, formatTheme, formatDensity, formatLanguage, formatFontSize, formatBoolean, formatToggle, escapeHtml, truncate, debounce };
export {
  MODULE_ID,
  VERSION,
  debounce,
  formatters_default as default,
  escapeHtml,
  formatBoolean,
  formatDate,
  formatDateTime,
  formatDensity,
  formatFontSize,
  formatLanguage,
  formatRelativeTime,
  formatTheme,
  formatToggle,
  healthCheck,
  info,
  truncate
};
