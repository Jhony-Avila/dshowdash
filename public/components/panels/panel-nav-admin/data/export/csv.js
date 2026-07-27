const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.export.csv";
const DEFAULT_COLUMNS = [
  { label: "ID", field: "id" },
  { label: "Label", field: "label" },
  { label: "Rota/Painel", field: "href" },
  { label: "\xCDcone", field: "icon" },
  { label: "Se\xE7\xE3o", field: "section" },
  { label: "Contexto", field: "context", formatter: (v, item) => v || item.sourceTable || "sidebar" },
  { label: "N\xEDvel M\xEDnimo", field: "minLevel", formatter: (v) => String(v ?? 0) },
  { label: "Ativo", field: "isActive", formatter: (v) => v !== false ? "Sim" : "N\xE3o" },
  { label: "Divisor", field: "isDivider", formatter: (v) => v === true ? "Sim" : "N\xE3o" },
  { label: "Ordem", field: "order", formatter: (v) => String(v ?? 0) },
  { label: "Criado Em", field: "createdAt" },
  { label: "Atualizado Em", field: "updatedAt" }
];
function toCSV(data, columns = DEFAULT_COLUMNS, options = {}) {
  const { delimiter = ";", bom = true } = options;
  const header = columns.map((col) => _quoteField(col.label, String(delimiter))).join(String(delimiter));
  const rows = data.map((item) => {
    return columns.map((col) => {
      let val = item[col.field];
      if (typeof col.formatter === "function") {
        val = col.formatter(val, item);
      }
      return _quoteField(val, String(delimiter));
    }).join(String(delimiter));
  });
  const csv = [header, ...rows].join("\n");
  return bom ? "\uFEFF" + csv : csv;
}
function downloadCSV(data, columns = DEFAULT_COLUMNS, filename, options = {}) {
  const csvContent = toCSV(data, columns, options);
  const fname = filename || `nav-admin-export_${_dateStamp()}`;
  _downloadBlob(csvContent, `${fname}.csv`, "text/csv;charset=utf-8;");
}
function _quoteField(value, delimiter) {
  const str = value == null ? "" : String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}
function _downloadBlob(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}
function _dateStamp() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, columnsCount: DEFAULT_COLUMNS.length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var csv_default = { toCSV, downloadCSV, DEFAULT_COLUMNS, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_COLUMNS,
  MODULE_ID,
  VERSION,
  csv_default as default,
  downloadCSV,
  healthCheck,
  info,
  toCSV
};
