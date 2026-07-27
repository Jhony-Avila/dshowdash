import * as Renderer from "../ui/renderer.js";
import { localState } from "./state.js";
import { getCurrentLogs, delay, formatDateFilename } from "./helpers.js";
function exportCSV(logs, filename) {
  if (!logs?.length) return;
  const headers = Object.keys(logs[0]);
  const csvRows = [headers.join(",")];
  for (const log of logs) {
    const values = headers.map((h) => {
      let val = log[h];
      if (val === null || val === void 0) val = "";
      if (typeof val === "object") val = JSON.stringify(val);
      val = String(val).replace(/"/g, '""');
      return `"${val}"`;
    });
    csvRows.push(values.join(","));
  }
  const blob = new Blob([`\uFEFF${csvRows.join("\n")}`], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function exportJSON(logs, filename) {
  if (!logs?.length) return;
  const blob = new Blob([JSON.stringify(logs, null, 2)], { type: "application/json;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
async function handleExportCSV(state) {
  const logs = getCurrentLogs(state);
  if (!logs?.length) {
    Renderer.toast("Nenhum dado para exportar", "warning");
    return;
  }
  Renderer.showExportProgress(true, 10, "Preparando dados...");
  await delay(100);
  Renderer.showExportProgress(true, 30, "Formatando CSV...");
  await delay(100);
  Renderer.showExportProgress(true, 60, "Gerando arquivo...");
  await delay(100);
  exportCSV(logs, `audit-trail-${formatDateFilename()}.csv`);
  Renderer.showExportProgress(true, 100, "Conclu\xEDdo!");
  await delay(300);
  Renderer.showExportProgress(false);
  Renderer.toast(`${logs.length} registros exportados`, "success");
}
async function handleExportJSON(state) {
  const logs = getCurrentLogs(state);
  if (!logs?.length) {
    Renderer.toast("Nenhum dado para exportar", "warning");
    return;
  }
  Renderer.showExportProgress(true, 10, "Preparando dados...");
  await delay(100);
  Renderer.showExportProgress(true, 50, "Gerando JSON...");
  await delay(100);
  exportJSON(logs, `audit-trail-${formatDateFilename()}.json`);
  Renderer.showExportProgress(true, 100, "Conclu\xEDdo!");
  await delay(300);
  Renderer.showExportProgress(false);
  Renderer.toast(`${logs.length} registros exportados`, "success");
}
function handleExportClipboard(state) {
  const logs = getCurrentLogs(state);
  if (!logs?.length) {
    Renderer.toast("Nenhum dado para exportar", "warning");
    return;
  }
  const text = JSON.stringify(logs, null, 2);
  navigator.clipboard.writeText(text).then(() => {
    Renderer.toast(`${logs.length} registros copiados`, "success");
  }).catch(() => Renderer.toast("Erro ao copiar", "error"));
}
async function handleBulkExport(state) {
  const logs = getCurrentLogs(state)?.filter((l) => localState.selectedIds.has(String(l.id)));
  if (!logs?.length) {
    Renderer.toast("Nenhum item selecionado", "warning");
    return;
  }
  Renderer.showExportProgress(true, 50, `Exportando ${logs.length} itens...`);
  await delay(200);
  exportCSV(logs, `audit-trail-selection-${formatDateFilename()}.csv`);
  Renderer.showExportProgress(false);
  Renderer.toast(`${logs.length} itens exportados`, "success");
}
function handleBulkCopy(state) {
  const logs = getCurrentLogs(state)?.filter((l) => localState.selectedIds.has(String(l.id)));
  if (!logs?.length) {
    Renderer.toast("Nenhum item selecionado", "warning");
    return;
  }
  navigator.clipboard.writeText(JSON.stringify(logs, null, 2)).then(() => Renderer.toast(`${logs.length} itens copiados`, "success")).catch(() => Renderer.toast("Erro ao copiar", "error"));
}
function handleCopyLog(logId, state) {
  const logs = getCurrentLogs(state);
  const log = logs?.find((l) => String(l.id) === String(logId));
  if (log) {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2)).then(() => Renderer.toast("Log copiado", "success")).catch(() => Renderer.toast("Erro ao copiar", "error"));
  }
}
var export_default = { handleExportCSV, handleExportJSON, handleExportClipboard, handleBulkExport, handleBulkCopy, handleCopyLog };
const MODULE_ID = "panels-panel-audit-trail-core-export";
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
  handleBulkCopy,
  handleBulkExport,
  handleCopyLog,
  handleExportCSV,
  handleExportClipboard,
  handleExportJSON,
  healthCheck,
  info
};
