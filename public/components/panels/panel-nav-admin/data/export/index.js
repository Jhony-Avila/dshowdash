import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../../config/feature-flags.js";
import { toCSV, downloadCSV } from "./csv.js";
import { exportPDF, exportSingleItemPDF } from "./pdf.js";
import { exportXLSX, exportMultiSheetXLSX } from "./xlsx.js";
const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.export";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[ExportOrchestrator]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const EXPORT_FORMATS = Object.freeze({
  JSON: "json",
  CSV: "csv",
  PDF: "pdf",
  XLSX: "xlsx"
});
async function exportAs(format, data, options = {}) {
  if (!data || !Array.isArray(data)) {
    _log("error", "Invalid data for export");
    return;
  }
  _log("info", `Exporting ${data.length} items as ${format}`);
  switch (format) {
    case EXPORT_FORMATS.JSON:
      _exportJSON(data, options.filename);
      break;
    case EXPORT_FORMATS.CSV:
      if (!isEnabled("exportCSV")) {
        _log("warn", "CSV export disabled by feature flag");
        return;
      }
      downloadCSV(data, options.columns, options.filename);
      break;
    case EXPORT_FORMATS.PDF:
      if (!isEnabled("exportPDF")) {
        _log("warn", "PDF export disabled by feature flag");
        return;
      }
      await exportPDF(data, options);
      break;
    case EXPORT_FORMATS.XLSX:
      if (!isEnabled("exportXLSX")) {
        _log("warn", "XLSX export disabled by feature flag");
        return;
      }
      if (options.multiSheet) {
        await exportMultiSheetXLSX(options.multiSheet, options);
      } else {
        await exportXLSX(data, options);
      }
      break;
    default:
      _log("error", "Unknown export format:", format);
  }
}
function _exportJSON(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = String(filename || `nav-admin-export_${_dateStamp()}`) + ".json";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
function getAvailableFormats() {
  return [
    { id: "json", label: "JSON", enabled: true },
    { id: "csv", label: "CSV", enabled: isEnabled("exportCSV") },
    { id: "pdf", label: "PDF", enabled: isEnabled("exportPDF") },
    { id: "xlsx", label: "Excel (XLSX)", enabled: isEnabled("exportXLSX") }
  ];
}
function _dateStamp() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
import { toCSV as toCSV2, downloadCSV as downloadCSV2 } from "./csv.js";
import { exportPDF as exportPDF2, exportSingleItemPDF as exportSingleItemPDF2 } from "./pdf.js";
import { exportXLSX as exportXLSX2, exportMultiSheetXLSX as exportMultiSheetXLSX2 } from "./xlsx.js";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formats: getAvailableFormats()
  };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var export_default = {
  exportAs,
  getAvailableFormats,
  EXPORT_FORMATS,
  toCSV,
  downloadCSV,
  exportPDF,
  exportSingleItemPDF,
  exportXLSX,
  exportMultiSheetXLSX,
  injectPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  EXPORT_FORMATS,
  MODULE_ID,
  VERSION,
  export_default as default,
  downloadCSV2 as downloadCSV,
  exportAs,
  exportMultiSheetXLSX2 as exportMultiSheetXLSX,
  exportPDF2 as exportPDF,
  exportSingleItemPDF2 as exportSingleItemPDF,
  exportXLSX2 as exportXLSX,
  getAvailableFormats,
  healthCheck,
  info,
  injectPorts,
  toCSV2 as toCSV
};
