import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../../config/feature-flags.js";
import { parseCSV, readCSVFile, validateCSVRow } from "./csv.js";
import { readXLSXFile, parseXLSXSheet, getSheetNames } from "./xlsx.js";
const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.import";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[ImportOrchestrator]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const IMPORT_FORMATS = Object.freeze({
  JSON: "json",
  CSV: "csv",
  XLSX: "xlsx"
});
async function importFrom(format, file, options = {}) {
  if (!file) {
    return { rows: [], headers: [], errors: ["No file provided"], format };
  }
  _log("info", `Importing from ${format}: ${file.name}`);
  switch (format) {
    case IMPORT_FORMATS.JSON:
      return _importJSON(file);
    case IMPORT_FORMATS.CSV: {
      if (!isEnabled("importCSV")) {
        _log("warn", "CSV import disabled by feature flag");
        return { rows: [], headers: [], errors: ["CSV import is disabled"], format };
      }
      const result = await readCSVFile(file, options);
      return { ...result, format };
    }
    case IMPORT_FORMATS.XLSX: {
      if (!isEnabled("importXLSX")) {
        _log("warn", "XLSX import disabled by feature flag");
        return { rows: [], headers: [], errors: ["XLSX import is disabled"], format };
      }
      const result = await readXLSXFile(file, options);
      return { ...result, format };
    }
    default:
      return { rows: [], headers: [], errors: [`Unknown import format: ${format}`], format };
  }
}
function _importJSON(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ rows, headers, errors: [], format: "json" });
      } catch (err) {
        resolve({ rows: [], headers: [], errors: [`JSON parse error: ${err.message}`], format: "json" });
      }
    };
    reader.onerror = () => resolve({ rows: [], headers: [], errors: ["Failed to read JSON file"], format: "json" });
    reader.readAsText(file, "UTF-8");
  });
}
function validateRows(rows) {
  if (!Array.isArray(rows)) {
    return { validRows: [], invalidRows: [], totalValid: 0, totalInvalid: 0 };
  }
  const validRows = [];
  const invalidRows = [];
  rows.forEach((row, index) => {
    const result = validateCSVRow(row);
    if (result.valid) {
      validRows.push(row);
    } else {
      invalidRows.push({ row, index: index + 1, errors: result.errors });
    }
  });
  return {
    validRows,
    invalidRows,
    totalValid: validRows.length,
    totalInvalid: invalidRows.length
  };
}
function detectFormat(file) {
  if (!file || !file.name) return null;
  const ext = file.name.split(".").pop().toLowerCase();
  if (ext === "json") return IMPORT_FORMATS.JSON;
  if (ext === "csv") return IMPORT_FORMATS.CSV;
  if (ext === "xlsx" || ext === "xls") return IMPORT_FORMATS.XLSX;
  return null;
}
function getAvailableFormats() {
  return [
    { id: "json", label: "JSON", accept: ".json", enabled: true },
    { id: "csv", label: "CSV", accept: ".csv", enabled: isEnabled("importCSV") },
    { id: "xlsx", label: "Excel (XLSX)", accept: ".xlsx,.xls", enabled: isEnabled("importXLSX") }
  ];
}
import { parseCSV as parseCSV2, readCSVFile as readCSVFile2, validateCSVRow as validateCSVRow2, REQUIRED_FIELDS as REQUIRED_FIELDS2 } from "./csv.js";
import { readXLSXFile as readXLSXFile2, parseXLSXSheet as parseXLSXSheet2, getSheetNames as getSheetNames2 } from "./xlsx.js";
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
var import_default = {
  importFrom,
  validateRows,
  detectFormat,
  getAvailableFormats,
  IMPORT_FORMATS,
  parseCSV,
  readCSVFile,
  validateCSVRow,
  readXLSXFile,
  parseXLSXSheet,
  getSheetNames,
  injectPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  IMPORT_FORMATS,
  MODULE_ID,
  REQUIRED_FIELDS2 as REQUIRED_FIELDS,
  VERSION,
  import_default as default,
  detectFormat,
  getAvailableFormats,
  getSheetNames2 as getSheetNames,
  healthCheck,
  importFrom,
  info,
  injectPorts,
  parseCSV2 as parseCSV,
  parseXLSXSheet2 as parseXLSXSheet,
  readCSVFile2 as readCSVFile,
  readXLSXFile2 as readXLSXFile,
  validateCSVRow2 as validateCSVRow,
  validateRows
};
