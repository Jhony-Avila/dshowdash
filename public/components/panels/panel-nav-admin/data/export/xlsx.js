const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.export.xlsx";
const SHEETJS_CDN = "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js";
let _sheetJSLoaded = false;
async function _loadSheetJS() {
  if (_sheetJSLoaded || typeof window !== "undefined" && window.XLSX) {
    _sheetJSLoaded = true;
    return;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SHEETJS_CDN;
    script.onload = () => {
      _sheetJSLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load SheetJS from CDN"));
    document.head.appendChild(script);
  });
}
const DEFAULT_COLUMNS = [
  { label: "ID", field: "id" },
  { label: "Label", field: "label" },
  { label: "Rota/Painel", field: "href" },
  { label: "\xCDcone", field: "icon" },
  { label: "Se\xE7\xE3o", field: "section" },
  { label: "Contexto", field: "context", formatter: (v, item) => v || item.sourceTable || "sidebar" },
  { label: "N\xEDvel M\xEDnimo", field: "minLevel", formatter: (v) => v ?? 0 },
  { label: "Ativo", field: "isActive", formatter: (v) => v !== false ? "Sim" : "N\xE3o" },
  { label: "Divisor", field: "isDivider", formatter: (v) => v === true ? "Sim" : "N\xE3o" },
  { label: "Ordem", field: "order", formatter: (v) => v ?? 0 },
  { label: "Roles", field: "roles", formatter: (v) => Array.isArray(v) ? v.join(", ") : "" },
  { label: "Criado Em", field: "createdAt" },
  { label: "Atualizado Em", field: "updatedAt" }
];
async function exportXLSX(data, options = {}) {
  await _loadSheetJS();
  const filename = options.filename;
  const sheetName = options.sheetName || "Navega\xE7\xE3o";
  const columns = options.columns || DEFAULT_COLUMNS;
  const XLSX = window.XLSX;
  const header = columns.map((col) => col.label);
  const rows = data.map((item) => {
    return columns.map((col) => {
      let val = item[col.field];
      if (typeof col.formatter === "function") {
        val = col.formatter(val, item);
      }
      return val ?? "";
    });
  });
  const aoa = [header, ...rows];
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const colWidths = columns.map((col, i) => {
    let maxLen = col.label.length;
    for (const row of rows) {
      const cellLen = String(row[i] ?? "").length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws["!cols"] = colWidths;
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const fname = filename || `nav-admin-export_${_dateStamp()}`;
  XLSX.writeFile(wb, `${fname}.xlsx`);
}
async function exportMultiSheetXLSX(sheets, options = {}) {
  await _loadSheetJS();
  const filename = options.filename;
  const columns = options.columns || DEFAULT_COLUMNS;
  const XLSX = window.XLSX;
  const wb = XLSX.utils.book_new();
  for (const [sheetName, data] of Object.entries(sheets)) {
    const header = columns.map((col) => col.label);
    const rows = data.map((item) => columns.map((col) => {
      let val = item[col.field];
      if (typeof col.formatter === "function") val = col.formatter(val, item);
      return val ?? "";
    }));
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const colWidths = columns.map((col, i) => {
      let maxLen = col.label.length;
      for (const row of rows) {
        const cellLen = String(row[i] ?? "").length;
        if (cellLen > maxLen) maxLen = cellLen;
      }
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  }
  const fname = filename || `nav-admin-multi_${_dateStamp()}`;
  XLSX.writeFile(wb, `${fname}.xlsx`);
}
function _dateStamp() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded, columnsCount: DEFAULT_COLUMNS.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded };
}
var xlsx_default = { exportXLSX, exportMultiSheetXLSX, DEFAULT_COLUMNS, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_COLUMNS,
  MODULE_ID,
  VERSION,
  xlsx_default as default,
  exportMultiSheetXLSX,
  exportXLSX,
  healthCheck,
  info
};
