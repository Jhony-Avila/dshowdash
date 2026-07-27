import { VERSION } from "../index.js";
const MODULE_ID = "panel-nav-admin-handlers-export-import";
function createExportImportHandlers(deps) {
  const store = deps.store;
  const showToast = deps.showToast;
  function exportJSON() {
    try {
      const state = store.getState();
      const items = state.items || [];
      const itemsWithTitle = items.map((item) => ({ ...item, display_title: item.displayTitle || item.display_title || "" }));
      const exportData = { version: VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), items: itemsWithTitle, sections: state.sections };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      downloadBlob(blob, `nav-config-${getDateStamp()}.json`);
      showToast("Exporta\xE7\xE3o conclu\xEDda", "success");
    } catch (error) {
      showToast(`Erro ao exportar: ${error.message}`, "error");
    }
  }
  function exportCSV() {
    try {
      const items = store.get("items") || [];
      const headers = ["id", "label", "display_title", "href", "section", "minLevel", "order", "isActive"];
      const rows = items.map((item) => headers.map((h) => {
        const val = h === "display_title" ? item.displayTitle || item.display_title || "" : item[h];
        return escapeCSV(val != null ? val : "");
      }).join(","));
      const csv = [headers.join(",")].concat(rows).join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      downloadBlob(blob, `nav-items-${getDateStamp()}.csv`);
      showToast("CSV exportado", "success");
    } catch (error) {
      showToast(`Erro: ${error.message}`, "error");
    }
  }
  function handleImport() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = e.target.files && e.target.files[0];
      if (!file) return;
      file.text().then((text) => {
        const data = JSON.parse(text);
        if (!validateImportData(data)) {
          showToast("Formato inv\xE1lido", "error");
          return;
        }
        showToast(`Importado: ${data.items && data.items.length || 0} itens`, "success");
      }).catch((error) => {
        showToast(`Erro ao importar: ${error.message}`, "error");
      });
    };
    input.click();
  }
  return { exportJSON, exportCSV, handleImport };
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
function getDateStamp() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
function escapeCSV(value) {
  const str = String(value);
  if (str.indexOf(",") !== -1 || str.indexOf('"') !== -1 || str.indexOf("\n") !== -1) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}
function validateImportData(data) {
  if (!data || typeof data !== "object") return false;
  if (!Array.isArray(data.items)) return false;
  return true;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { ready: true } };
}
export {
  MODULE_ID,
  createExportImportHandlers,
  healthCheck,
  info
};
