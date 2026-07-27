import { TABLE_COLUMNS } from "./constants.js";
import { downloadCSV } from "./utils.js";
import { formatCurrency } from "../../utils/dashboard-utils.js";
import { TABLE_EVENTS } from "/core/runtime/events/catalog/table.events.js";
import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:export";
const ExportMixin = {
  _exportCSV(selectedOnly = false) {
    const exportCols = TABLE_COLUMNS.filter((c) => c.exportKey);
    let dataToExport;
    if (selectedOnly) {
      dataToExport = this._state.getDisplayData().filter(
        (item) => (
          // @ts-expect-error strict migration — TS2339
          this._state.isSelected(String(item.id))
        )
      );
      if (!dataToExport.length) {
        this.emit(UI_INTENTS.SHOW_TOAST, { type: "warning", message: "Nenhum item selecionado" });
        return;
      }
    } else {
      dataToExport = this._state.getDisplayData();
    }
    const headers = exportCols.map((c) => c.label);
    const rows = dataToExport.map((item) => exportCols.map((col) => {
      let val = item[col.exportKey];
      if (col.type === "currency") {
        val = formatCurrency(val);
      } else if (col.id === "cidade") {
        val = `${item.cidade || ""}${item.uf ? `/${item.uf}` : ""}`;
      }
      val = String(val ?? "").replace(/"/g, '""');
      return `"${val}"`;
    }).join(";"));
    const csvContent = [headers.join(";"), ...rows].join("\n");
    const date = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
    const filename = `clientes_${selectedOnly ? "selecionados_" : ""}${date}.csv`;
    downloadCSV(csvContent, filename);
    this.emit(TABLE_EVENTS.EXPORTED, { type: "csv", count: dataToExport.length, selectedOnly });
    this.emit(UI_INTENTS.SHOW_TOAST, { type: "success", message: `${dataToExport.length} registros exportados` });
  },
  exportCSV(selectedOnly = false) {
    this._exportCSV(selectedOnly);
  }
};
var export_default = ExportMixin;
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { exportReady: true } };
}
export {
  ExportMixin,
  MODULE_ID,
  VERSION,
  export_default as default,
  healthCheck,
  info
};
