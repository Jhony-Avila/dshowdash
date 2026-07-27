const MODULE_ID = "panel-16.ui.export";
const VERSION = "9.3.0-P2-ENTERPRISE";
function exportToCSV(data, filename = "export.csv") {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(","),
    ...data.map((row) => headers.map((h) => `"${row[h] ?? ""}"`).join(","))
  ].join("\n");
  downloadFile(csvContent, filename, "text/csv");
}
function exportToJSON(data, filename = "export.json") {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, "application/json");
}
function downloadFile(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
const exportCSV = exportToCSV;
function exportSelected(data, filename = "export-selected.csv") {
  return exportToCSV(data, filename);
}
function exportXLSX(data, filename = "export.xlsx") {
  return exportToCSV(data, filename);
}
function exportPDF(_data, _filename = "export.pdf") {
  console.warn("[panel-16/export] exportPDF: not yet implemented");
}
var export_default = { exportToCSV, exportToJSON, exportCSV, exportSelected, exportXLSX, exportPDF };
export {
  MODULE_ID,
  VERSION,
  export_default as default,
  exportCSV,
  exportPDF,
  exportSelected,
  exportToCSV,
  exportToJSON,
  exportXLSX
};
