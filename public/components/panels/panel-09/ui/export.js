import { downloadFile } from "./helpers.js";
function exportCSV(data) {
  if (!data) return alert("Sem dados para exportar");
  const rows = [["Per\xEDodo", "Atual Total", "Anterior Total", "Varia\xE7\xE3o %", "Atual Sucesso", "Anterior Sucesso", "Varia\xE7\xE3o %"]];
  ["today_vs_yesterday", "this_week_vs_last_week", "this_month_vs_last_month"].forEach((period) => {
    const d = data[period];
    if (d) {
      rows.push([
        period,
        d.current?.total || 0,
        d.previous?.total || 0,
        d.change?.total || 0,
        d.current?.success || 0,
        d.previous?.success || 0,
        d.change?.success || 0
      ]);
    }
  });
  const csv = rows.map((r) => r.join(",")).join("\n");
  downloadFile(csv, `analise_comparativa_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.csv`, "text/csv");
}
function exportJSON(data) {
  if (!data) return alert("Sem dados para exportar");
  const json = JSON.stringify({ exported: (/* @__PURE__ */ new Date()).toISOString(), data }, null, 2);
  downloadFile(json, `analise_comparativa_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}.json`, "application/json");
}
var export_default = { exportCSV, exportJSON };
const MODULE_ID = "panels-panel-09-ui-export";
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
