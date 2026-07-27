const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "table-engine:export-pdf";
function exportToPDF(data, columns, options = {}) {
  const filename = options.filename || `export-${Date.now()}.pdf`;
  const title = options.title || "Relat\xF3rio";
  const orientation = options.orientation || "landscape";
  const html = createPrintableHTML(data, columns, { title, orientation, ...options });
  const printWindow = window.open("", "_blank", "width=800,height=600");
  if (!printWindow) {
    return { success: false, error: "Popup bloqueado. Permita popups para exportar PDF." };
  }
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  return { success: true, filename, rowCount: data.length };
}
function createPrintableHTML(data, columns, options = {}) {
  const exportableCols = columns.filter((c) => c.exportable !== false);
  const orientation = options.orientation || "landscape";
  let headerCells = exportableCols.map(
    (col) => `<th style="border:1px solid #333;padding:8px;background:#f0f0f0;text-align:left;">${escapeHtml(col.label || col.id)}</th>`
  ).join("");
  let bodyRows = data.map((row) => {
    const cells = exportableCols.map((col) => {
      const value = formatValueForPDF(row[col.id], col.type);
      const align = ["number", "currency", "percent"].includes(String(col.type)) ? "right" : "left";
      return `<td style="border:1px solid #ccc;padding:6px;text-align:${align};">${escapeHtml(String(value))}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  const now = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(options.title || "Relat\xF3rio")}</title>
  <style>
    @page { size: ${orientation}; margin: 15mm; }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
    body { font-family: Arial, sans-serif; font-size: 11px; margin: 0; padding: 20px; }
    .header { text-align: center; margin-bottom: 20px; }
    .header h1 { margin: 0 0 5px 0; font-size: 18px; }
    .header .meta { color: #666; font-size: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #666; }
  </style>
</head>
<body>
  <div class="header">
    <h1>${escapeHtml(options.title || "Relat\xF3rio")}</h1>
    <div class="meta">Gerado em ${now} | Total: ${data.length} registros</div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">
    P\xE1gina 1 | ${escapeHtml(options.title || "Relat\xF3rio")}
  </div>
</body>
</html>`;
}
function formatValueForPDF(value, type) {
  if (value == null || value === "") return "\u2014";
  switch (type) {
    case "currency":
      return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
    case "percent":
      return new Intl.NumberFormat("pt-BR", { style: "percent", minimumFractionDigits: 2 }).format(value / 100);
    case "date":
      return new Date(value).toLocaleDateString("pt-BR");
    case "datetime":
      return new Date(value).toLocaleString("pt-BR");
    case "boolean":
      return value ? "Sim" : "N\xE3o";
    default:
      return String(value);
  }
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var pdf_default = { exportToPDF, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  pdf_default as default,
  exportToPDF,
  healthCheck,
  info
};
