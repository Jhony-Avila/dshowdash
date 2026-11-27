const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/export";
const FORMULA_PERIGOSA = /^[\s\u00a0\u2000-\u200b\u3000\ufeff]*[=+\-@\uff1d\uff0b\uff0d\uff20\t\r\n]/u;
function celulaCsv(v) {
  if (v === null || v === void 0) return "";
  if (typeof v === "number" || typeof v === "bigint" || typeof v === "boolean") return String(v);
  let s = String(v);
  if (FORMULA_PERIGOSA.test(s)) s = `'${s}`;
  return /[";\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function toCSV(data, columns) {
  if (!data || !data.length) return "";
  const cols = columns || Object.keys(data[0]);
  const header = cols.map(celulaCsv).join(";");
  const rows = data.map(
    (row) => cols.map((col) => celulaCsv(row[col])).join(";")
  );
  return `\uFEFF${header}
${rows.join("\n")}`;
}
function downloadCSV(data, columns, filename = "export.csv") {
  const csv = toCSV(data, columns);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function toJSON(data, pretty = true) {
  return JSON.stringify(data, null, pretty ? 2 : 0);
}
function downloadJSON(data, filename = "export.json") {
  const json = toJSON(data);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
function printData(data, title = "Relat\xF3rio") {
  const printWindow = window.open("", "_blank");
  if (!printWindow) return;
  const html = `
    <!DOCTYPE html>
    <html><head><title>${title}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; }
      h1 { font-size: 18px; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
      th { background: #f5f5f5; }
      @media print { body { padding: 0; } }
    </style></head><body>
    <h1>${title}</h1>
    <table><thead><tr>${Object.keys(data[0] || {}).map((k) => `<th>${k}</th>`).join("")}</tr></thead>
    <tbody>${data.map((row) => `<tr>${Object.values(row).map((v) => `<td>${v ?? ""}</td>`).join("")}</tr>`).join("")}</tbody></table>
    <script>window.print();window.close();<\/script>
    </body></html>
  `;
  printWindow.document.write(html);
  printWindow.document.close();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var export_default = { toCSV, downloadCSV, toJSON, downloadJSON, printData };
export {
  MODULE_ID,
  VERSION,
  celulaCsv,
  export_default as default,
  downloadCSV,
  downloadJSON,
  healthCheck,
  info,
  printData,
  toCSV,
  toJSON
};
