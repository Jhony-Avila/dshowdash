import { PAINEL_ID, THRESHOLDS } from "../core/constants.js";
import { PANEL_EVENTS } from "/core/runtime/events/catalog/panels.events.js";
const MODULE_ID = "panel-10-helpers";
const VERSION = "9.3.0-P2-ENTERPRISE";
const ERROR_MESSAGES = {
  AUTH_REQUIRED: "Autentica\xE7\xE3o necess\xE1ria",
  REQUEST_ABORTED: "Requisi\xE7\xE3o cancelada",
  REQUEST_TIMEOUT: "Tempo esgotado",
  NETWORK_ERROR: "Erro de rede",
  HTTP_500: "Erro interno do servidor",
  HTTP_404: "Endpoint n\xE3o encontrado",
  CIRCUIT_BREAKER_OPEN: "Servi\xE7o temporariamente indispon\xEDvel"
};
function getErrorMessage(errorCode) {
  return ERROR_MESSAGES[errorCode] || "Erro ao carregar dados";
}
function createThresholdChecker(emit) {
  return (data) => {
    const d = data;
    const local = d?.data?.local || d?.local;
    if (!local) return;
    if (local.cpu_percent >= THRESHOLDS.CPU_CRITICAL) {
      emit(PANEL_EVENTS.METRIC_CPU_CRITICAL, { value: local.cpu_percent });
    } else if (local.cpu_percent >= THRESHOLDS.CPU_WARNING) {
      emit(PANEL_EVENTS.METRIC_CPU_WARNING, { value: local.cpu_percent });
    }
    if (local.ram_percent >= THRESHOLDS.RAM_CRITICAL) {
      emit(PANEL_EVENTS.METRIC_RAM_CRITICAL, { value: local.ram_percent });
    } else if (local.ram_percent >= THRESHOLDS.RAM_WARNING) {
      emit(PANEL_EVENTS.METRIC_RAM_WARNING, { value: local.ram_percent });
    }
    if (local.disk_percent >= THRESHOLDS.DISK_CRITICAL) {
      emit(PANEL_EVENTS.METRIC_DISK_CRITICAL, { value: local.disk_percent });
    } else if (local.disk_percent >= THRESHOLDS.DISK_WARNING) {
      emit(PANEL_EVENTS.METRIC_DISK_WARNING, { value: local.disk_percent });
    }
  };
}
function loadCSS(cssPath) {
  if (document.querySelector(`link[href*="${PAINEL_ID}/styles/index.css"]`)) return;
  if (window.AssetLoader?.loadCSS) {
    window.AssetLoader.loadCSS(cssPath);
  } else {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    link.setAttribute("data-panel", PAINEL_ID);
    document.head.appendChild(link);
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { helpersReady: true } };
}
var helpers_default = { getErrorMessage, createThresholdChecker, loadCSS, MODULE_ID, VERSION, ERROR_MESSAGES, info, healthCheck };
export {
  ERROR_MESSAGES,
  MODULE_ID,
  VERSION,
  createThresholdChecker,
  helpers_default as default,
  getErrorMessage,
  healthCheck,
  info,
  loadCSS
};
