const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:print";
function printTable(data, columns, options) {
  const opts = options || {};
  const title = opts.title || "Impress\xE3o";
  const orientation = opts.orientation || "landscape";
  const pageSize = opts.pageSize || "A4";
  const showDate = opts.showDate !== false;
  const showPageNumbers = opts.showPageNumbers !== false;
  const html = createPrintHTML(data, columns, { title, orientation, pageSize, showDate, showPageNumbers });
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) return { success: false, error: "Popup bloqueado" };
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => {
    setTimeout(() => {
      printWindow.focus();
      printWindow.print();
    }, 250);
  };
  return { success: true, rowCount: data.length };
}
function createPrintHTML(data, columns, options) {
  const opts = options || {};
  const exportableCols = columns.filter((c) => c.exportable !== false && c.printable !== false);
  const now = (/* @__PURE__ */ new Date()).toLocaleString("pt-BR");
  const styles = `@page { size: ${opts.pageSize || "A4"} ${opts.orientation || "landscape"}; margin: 12mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } thead { display: table-header-group; } tr { page-break-inside: avoid; } } * { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; color: #333; } .print-header { text-align: center; padding: 10px 0 15px; border-bottom: 2px solid #333; margin-bottom: 15px; } .print-header h1 { margin: 0 0 5px; font-size: 16px; font-weight: bold; } .print-meta { color: #666; font-size: 9px; } table { width: 100%; border-collapse: collapse; } th { background: #f5f5f5; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: bold; font-size: 9px; white-space: nowrap; } td { border: 1px solid #ddd; padding: 5px 8px; font-size: 9px; } tr:nth-child(even) { background: #fafafa; } .text-right { text-align: right; } .text-center { text-align: center; } .print-footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 8px; color: #666; } .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; } @media print { .print-btn { display: none; } }`;
  const headerRow = exportableCols.map((col) => `<th>${escapeHtml(col.label || col.id)}</th>`).join("");
  const dataRows = data.map((row) => {
    const cells = exportableCols.map((col) => {
      const value = formatForPrint(row[col.id], col.type);
      const align = ["number", "currency", "percent"].indexOf(col.type) >= 0 ? "text-right" : "";
      return `<td class="${align}">${escapeHtml(value)}</td>`;
    }).join("");
    return `<tr>${cells}</tr>`;
  }).join("");
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${escapeHtml(opts.title)}</title><style>${styles}</style></head><body><button class="print-btn no-print" onclick="window.print()">Imprimir</button><div class="print-header"><h1>${escapeHtml(opts.title)}</h1>${opts.showDate ? `<div class="print-meta">Impresso em: ${now} | Total: ${data.length} registros</div>` : ""}</div><table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table><div class="print-footer">${escapeHtml(opts.title)} | ${data.length} registros</div></body></html>`;
}
function formatForPrint(value, type) {
  if (value == null || value === "") return "\u2014";
  if (type === "currency") return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
  if (type === "percent") return `${parseFloat(value).toFixed(2)}%`;
  if (type === "number") return new Intl.NumberFormat("pt-BR").format(value);
  if (type === "date") return new Date(value).toLocaleDateString("pt-BR");
  if (type === "datetime") return new Date(value).toLocaleString("pt-BR");
  if (type === "boolean") return value ? "Sim" : "N\xE3o";
  return String(value);
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
var print_default = { printTable, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  print_default as default,
  healthCheck,
  info,
  printTable
};
