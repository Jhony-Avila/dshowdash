import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { apiClient } from "../services/api.js";
import { store } from "../state/store.js";
import * as Toast from "../ui/toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01.handlers.export";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
function exportCSV(ctx) {
  const state = store.getState();
  const url = apiClient.getExportUrl(state.filters);
  if (hasWindow) window.open(url, "_blank");
  if (ctx.telemetry) ctx.telemetry.trackInteraction("export");
  Toast.success("Exportacao iniciada");
}
async function exportPDF(ctx) {
  if (!ctx.pdfExporter) return;
  const state = store.getState();
  const columns = [{ id: "id", label: "ID", width: 20 }, { id: "descricao", label: "Descricao", width: 80 }, { id: "fornecedor", label: "Fornecedor", width: 50 }, { id: "total", label: "Valor", width: 30 }, { id: "data_requisicao", label: "Data", width: 25 }];
  await ctx.pdfExporter.exportTable(state.requisicoes, columns, "requisicoes.pdf");
  Toast.success("PDF exportado");
  if (ctx.haptic) ctx.haptic.success();
}
async function exportSinglePDF(ctx, id) {
  if (!ctx.pdfExporter) return;
  const state = store.getState();
  const item = state.requisicoes.find((r) => String(r.id || r.Id_Requisicao) === String(id));
  if (item) {
    await ctx.pdfExporter.exportSingle(item, `requisicao_${id}.pdf`);
    Toast.success("PDF exportado");
  }
}
function print(ctx) {
  if (hasWindow) window.print();
  if (ctx.telemetry) ctx.telemetry.trackInteraction("print");
}
function printSingle(ctx, id) {
  _log("debug", "Print single", JSON.stringify({ id }));
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() };
}
var export_default = { exportCSV, exportPDF, exportSinglePDF, print, printSingle, info, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  export_default as default,
  exportCSV,
  exportPDF,
  exportSinglePDF,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  print,
  printSingle
};
