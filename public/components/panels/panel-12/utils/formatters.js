import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-12-utils-formatters";
const Ports = createUiPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => _getPort("config")?.app?.debug ?? false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (level === "error") {
    logger?.error?.("[Formatters]", ...args);
    return;
  }
  if (level === "warn") {
    logger?.warn?.("[Formatters]", ...args);
    return;
  }
  if (_debug()) logger?.debug?.("[Formatters]", ...args);
};
const escapeHtml = (text) => {
  if (!text) return "";
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};
const formatDatetime = (datetime) => {
  if (!datetime) return "--";
  try {
    const date = new Date(datetime);
    if (isNaN(date.getTime())) return "--";
    return date.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  } catch (e) {
    _log("error", "Erro ao formatar data:", e);
    return "--";
  }
};
const formatNumber = (num) => !num || isNaN(Number(num)) ? "0" : parseInt(String(num)).toLocaleString("pt-BR");
const normalizeText = (text) => text ? String(text).toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "") : "";
const highlightText = (text, term) => {
  if (!term || !text) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const escapedTerm = escapeHtml(term).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapedText.replace(new RegExp(`(${escapedTerm})`, "gi"), '<span class="painel-12-highlight">$1</span>');
};
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const formatPercentage = (value, decimals = 2) => `${(parseFloat(String(value)) || 0).toFixed(decimals)}%`;
const formatDuration = (seconds) => {
  if (!seconds || isNaN(Number(seconds))) return "--";
  const num = parseFloat(String(seconds));
  if (num < 60) return `${num.toFixed(2)}s`;
  return `${Math.floor(num / 60)}m ${Math.floor(num % 60)}s`;
};
const truncate = (text, maxLength = 50, suffix = "...") => {
  if (!text) return "";
  const str = String(text);
  return str.length <= maxLength ? str : str.substring(0, maxLength - suffix.length) + suffix;
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.snapshot()._initialized, timestamp: Date.now() });
const healthCheck = () => ({ status: Ports.snapshot()._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { formattersReady: true, loggerReady: !!_getPort("logger"), portsInitialized: Ports.snapshot()._initialized }, timestamp: Date.now() });
function getVersion() {
  return VERSION;
}
export {
  MODULE_ID,
  VERSION,
  clamp,
  escapeHtml,
  formatDatetime,
  formatDuration,
  formatNumber,
  formatPercentage,
  getPorts,
  getVersion,
  healthCheck,
  highlightText,
  info,
  injectPorts,
  normalizeText,
  truncate
};
