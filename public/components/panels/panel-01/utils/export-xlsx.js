const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/export-xlsx";
function ExcelExporter(options = {}) {
  options = options || {};
  this.filename = options.filename || "export";
  this.sheetName = options.sheetName || "Dados";
  this.columns = options.columns || [];
  this.formatters = options.formatters || {};
}
ExcelExporter.prototype.export = async function(data) {
  if (typeof XLSX === "undefined") await this._loadSheetJS();
  const wb = XLSX.utils.book_new();
  const wsData = this._prepareData(data);
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  XLSX.utils.book_append_sheet(wb, ws, this.sheetName);
  const filename = `${this.filename}_${this._getDateString()}.xlsx`;
  XLSX.writeFile(wb, filename);
  return filename;
};
ExcelExporter.prototype._loadSheetJS = () => new Promise((resolve, reject) => {
  if (typeof XLSX !== "undefined") {
    resolve();
    return;
  }
  const script = document.createElement("script");
  script.src = "https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js";
  script.onload = resolve;
  script.onerror = reject;
  document.head.appendChild(script);
});
ExcelExporter.prototype._prepareData = function(data) {
  const self = this;
  const result = [];
  const headers = this.columns.map((col) => col.label || col.field);
  result.push(headers);
  data.forEach((item) => {
    const row = self.columns.map((col) => {
      let value = item[col.field] || "";
      if (self.formatters[col.field]) value = self.formatters[col.field](value, item);
      return value;
    });
    result.push(row);
  });
  return result;
};
ExcelExporter.prototype._getDateString = () => {
  const d = /* @__PURE__ */ new Date();
  return d.getFullYear() + String(d.getMonth() + 1).padStart(2, "0") + String(d.getDate()).padStart(2, "0");
};
ExcelExporter.prototype.destroy = () => {
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var export_xlsx_default = { ExcelExporter, info, healthCheck };
export {
  ExcelExporter,
  MODULE_ID,
  VERSION,
  export_xlsx_default as default,
  healthCheck,
  info
};
