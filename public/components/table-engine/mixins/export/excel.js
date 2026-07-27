const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:export-excel";
function exportToExcel(data, columns, options = {}) {
  const filename = options.filename || `export-${Date.now()}.xlsx`;
  const sheetName = options.sheetName || "Dados";
  const includeHeaders = options.includeHeaders !== false;
  const xml = createExcelXML(data, columns, { sheetName, includeHeaders, ...options });
  const blob = new Blob([xml], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  downloadBlob(blob, filename);
  return { success: true, filename, rowCount: data.length };
}
function createExcelXML(data, columns, options = {}) {
  const exportableCols = columns.filter((c) => c.exportable !== false);
  let rows = "";
  if (options.includeHeaders) {
    rows += "<Row>";
    exportableCols.forEach((col) => {
      rows += `<Cell><Data ss:Type="String">${escapeXml(col.label || col.id)}</Data></Cell>`;
    });
    rows += "</Row>\n";
  }
  data.forEach((row) => {
    rows += "<Row>";
    exportableCols.forEach((col) => {
      const value = row[col.id];
      const type = getExcelType(col.type, value);
      const formattedValue = formatValueForExcel(value, col.type);
      rows += `<Cell><Data ss:Type="${type}">${escapeXml(formattedValue)}</Data></Cell>`;
    });
    rows += "</Row>\n";
  });
  return `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Header">
   <Font ss:Bold="1"/>
   <Interior ss:Color="#E0E0E0" ss:Pattern="Solid"/>
  </Style>
  <Style ss:ID="Currency">
   <NumberFormat ss:Format="R$ #,##0.00"/>
  </Style>
  <Style ss:ID="Date">
   <NumberFormat ss:Format="dd/mm/yyyy"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(options.sheetName || "Dados")}">
  <Table>
   ${rows}
  </Table>
 </Worksheet>
</Workbook>`;
}
function getExcelType(colType, value) {
  if (value == null || value === "") return "String";
  switch (colType) {
    case "number":
    case "currency":
    case "percent":
    case "integer":
      return "Number";
    case "date":
    case "datetime":
      return "DateTime";
    default:
      return "String";
  }
}
function formatValueForExcel(value, type) {
  if (value == null) return "";
  switch (type) {
    case "date":
    case "datetime":
      const d = new Date(value);
      return isNaN(d.getTime()) ? String(value) : d.toISOString();
    case "boolean":
      return value ? "Sim" : "N\xE3o";
    default:
      return String(value);
  }
}
function escapeXml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var excel_default = { exportToExcel, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  excel_default as default,
  exportToExcel,
  healthCheck,
  info
};
