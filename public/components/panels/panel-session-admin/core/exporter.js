import * as Exporter from "../utils/exporter.js";
import tracker from "../telemetry/tracker.js";
import { showToast } from "./helpers.js";
import { getFilteredWithInline } from "./filters.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels-panel-session-admin-core-exporter";
function exportCSV() {
  const sessions = getFilteredWithInline();
  const result = Exporter.exportToCSV(sessions);
  if (result.ok) {
    showToast(`Exportado ${result.count} sess\xE3o(\xF5es)`);
    tracker.exportCSV(result.count);
  } else {
    showToast("Erro ao exportar", "error");
  }
  return result;
}
function exportJSON() {
  const sessions = getFilteredWithInline();
  const result = Exporter.exportToJSON(sessions);
  if (result.ok) {
    showToast(`Exportado ${result.count} sess\xE3o(\xF5es)`);
    tracker.exportJSON(result.count);
  } else {
    showToast("Erro ao exportar", "error");
  }
  return result;
}
async function copyToClipboard() {
  const sessions = getFilteredWithInline();
  const result = await Exporter.copyToClipboard(sessions, "text");
  if (result.ok) {
    showToast("Copiado!");
    tracker.exportClipboard(result.count);
  } else {
    showToast("Erro ao copiar", "error");
  }
  return result;
}
function printSessions() {
  const sessions = getFilteredWithInline();
  const result = Exporter.print(sessions, "Relat\xF3rio de Sess\xF5es");
  if (result.ok) {
    tracker.exportPrint(result.count);
  } else if (result.error === "POPUP_BLOCKED") {
    showToast("Popup bloqueado", "warning");
  }
  return result;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { exporterReady: true }, p25Compliant: true };
}
var exporter_default = { exportCSV, exportJSON, copyToClipboard, printSessions, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  copyToClipboard,
  exporter_default as default,
  exportCSV,
  exportJSON,
  healthCheck,
  info,
  printSessions
};
