import { downloadFile } from "./helpers.js";
function exportCSV(data) {
  if (!data) return;
  const dataNode = data.data || {};
  const exec = dataNode.executions || {};
  const rows = [
    ["M\xE9trica", "Valor"],
    ["Total Execu\xE7\xF5es", exec.total || 0],
    ["Sucessos", exec.success || 0],
    ["Erros", exec.error || 0]
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadFile(csv, `resumo_geral_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`, "text/csv");
}
function exportJSON(data) {
  if (!data) return;
  const json = JSON.stringify({ exported: (/* @__PURE__ */ new Date()).toISOString(), data }, null, 2);
  downloadFile(json, `resumo_geral_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`, "application/json");
}
var export_default = { exportCSV, exportJSON };
const MODULE_ID = "panels-panel-11-ui-export";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  export_default as default,
  exportCSV,
  exportJSON,
  healthCheck,
  info
};
