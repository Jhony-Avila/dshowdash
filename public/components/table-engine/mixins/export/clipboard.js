const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "table-engine:clipboard";
const CLIPBOARD_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};
function copyToClipboard(data, columns, options) {
  const opts = options || {};
  const exportableCols = columns.filter((c) => c.exportable !== false);
  const includeHeaders = opts.includeHeaders !== false;
  const format = opts.format || "tsv";
  let text = "";
  if (includeHeaders) text += `${exportableCols.map((c) => c.label || c.id).join(format === "csv" ? "," : "	")}
`;
  data.forEach((row) => {
    const values = exportableCols.map((col) => {
      const value = formatForClipboard(row[col.id], col.type);
      if (format === "csv" && String(value).indexOf(",") >= 0) return `"${value}"`;
      return value;
    });
    text += `${values.join(format === "csv" ? "," : "	")}
`;
  });
  return navigator.clipboard.writeText(text.trim()).then(() => ({
    success: true,
    rowCount: data.length,
    format
  })).catch(() => {
    const fallback = copyFallback(text.trim());
    return { success: fallback, rowCount: data.length, format, fallback: true };
  });
}
function copySelectionAsHTML(data, columns, options) {
  const opts = options || {};
  const exportableCols = columns.filter((c) => c.exportable !== false);
  let html = "<table><thead><tr>";
  exportableCols.forEach((col) => {
    html += `<th>${escapeHtml(col.label || col.id)}</th>`;
  });
  html += "</tr></thead><tbody>";
  data.forEach((row) => {
    html += "<tr>";
    exportableCols.forEach((col) => {
      const value = formatForClipboard(row[col.id], col.type);
      html += `<td>${escapeHtml(value)}</td>`;
    });
    html += "</tr>";
  });
  html += "</tbody></table>";
  try {
    const blob = new Blob([html], { type: "text/html" });
    return navigator.clipboard.write([new ClipboardItem({ "text/html": blob })]).then(() => ({
      success: true,
      rowCount: data.length,
      format: "html"
    }));
  } catch (e) {
    return copyToClipboard(data, columns, opts);
  }
}
function copyCellValue(value, type) {
  const formatted = formatForClipboard(value, type);
  return navigator.clipboard.writeText(formatted).then(() => ({
    success: true,
    value: formatted
  })).catch(() => {
    const fallback = copyFallback(formatted);
    return { success: fallback, value: formatted, fallback: true };
  });
}
function formatForClipboard(value, type) {
  if (value == null || value === "") return "";
  if (type === "currency") return parseFloat(String(value)).toFixed(2);
  if (type === "percent") return `${parseFloat(String(value)).toFixed(2)}%`;
  if (type === "date") return new Date(value).toLocaleDateString("pt-BR");
  if (type === "datetime") return new Date(value).toLocaleString("pt-BR");
  if (type === "boolean") return value ? "Sim" : "N\xE3o";
  return String(value);
}
function copyFallback(text) {
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.cssText = "position:fixed;left:-9999px;top:-9999px;";
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try {
    success = document.execCommand("copy");
  } catch (e) {
  }
  document.body.removeChild(textarea);
  return success;
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str || "";
  return div.innerHTML;
}
function renderCopyNotification(options) {
  const opts = options || {};
  const p = opts.cssPrefix || "tbl-";
  const message = opts.message || "Copiado para \xE1rea de transfer\xEAncia!";
  return `<div class="${p}copy-notification ${p}show"><span class="${p}copy-icon">${CLIPBOARD_SVGS.check}</span><span class="${p}copy-message">${message}</span></div>`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var clipboard_default = { copyToClipboard, copySelectionAsHTML, copyCellValue, renderCopyNotification, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  copyCellValue,
  copySelectionAsHTML,
  copyToClipboard,
  clipboard_default as default,
  healthCheck,
  info,
  renderCopyNotification
};
