import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
const VERSION = "1.1.0-P18EC";
const MODULE_ID = "table-engine:export";
const ExportMixin = {
  _exportCSV(selectedOnly = false) {
    const columns = this._state.get("columns") || [];
    const exportCols = columns.filter((c) => c.exportable !== false);
    let dataToExport;
    if (selectedOnly) {
      const selection = this._state.getSelection();
      dataToExport = this._state.getFilteredData().filter((item) => selection.has(String(item.id)));
      if (!dataToExport.length) {
        this.emit(TABLE_EVENTS.TOAST, { type: "warning", message: "Nenhum item selecionado" });
        return;
      }
    } else {
      dataToExport = this._state.getFilteredData();
    }
    const fmt = this._formatters || {};
    const headers = exportCols.map((c) => c.label || c.id);
    const rows = dataToExport.map((item) => exportCols.map((col) => {
      let val = item[col.id];
      if (col.type === "currency" && fmt.formatCurrency) val = fmt.formatCurrency(val);
      else if (col.type === "date" && fmt.formatDate) val = fmt.formatDate(val);
      val = String(val ?? "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(";"));
    const csvContent = [headers.join(";"), ...rows].join("\n");
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `export_${selectedOnly ? "selected_" : ""}${date}.csv`;
    this._downloadFile(csvContent, filename, "text/csv;charset=utf-8;");
    this.emit(TABLE_EVENTS.EXPORTED, { type: "csv", count: dataToExport.length, selectedOnly });
  },
  _exportJSON(selectedOnly = false) {
    let dataToExport;
    if (selectedOnly) {
      const selection = this._state.getSelection();
      dataToExport = this._state.getFilteredData().filter((item) => selection.has(String(item.id)));
      if (!dataToExport.length) {
        this.emit(TABLE_EVENTS.TOAST, { type: "warning", message: "Nenhum item selecionado" });
        return;
      }
    } else {
      dataToExport = this._state.getFilteredData();
    }
    const jsonContent = JSON.stringify(dataToExport, null, 2);
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `export_${selectedOnly ? "selected_" : ""}${date}.json`;
    this._downloadFile(jsonContent, filename, "application/json;charset=utf-8;");
    this.emit(TABLE_EVENTS.EXPORTED, { type: "json", count: dataToExport.length, selectedOnly });
  },
  _downloadFile(content, filename, mimeType) {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
  exportCSV(selectedOnly = false) {
    this._exportCSV(selectedOnly);
  },
  exportJSON(selectedOnly = false) {
    this._exportJSON(selectedOnly);
  }
};
var export_default = ExportMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
export {
  ExportMixin,
  MODULE_ID,
  VERSION,
  export_default as default,
  healthCheck,
  info
};
