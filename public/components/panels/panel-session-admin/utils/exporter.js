import { mapSessionsForCSV, mapSessionsForJSON, mapSessionForExport } from "./mappers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin-exporter";
function exportToCSV(sessions, filename = "sessoes") {
  if (!sessions || !sessions.length) return { ok: false, error: "NO_DATA" };
  try {
    const csv = mapSessionsForCSV(sessions);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${_getTimestamp()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, format: "csv", count: sessions.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
function exportToJSON(sessions, filename = "sessoes") {
  if (!sessions || !sessions.length) return { ok: false, error: "NO_DATA" };
  try {
    const json = mapSessionsForJSON(sessions);
    const blob = new Blob([json], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${filename}_${_getTimestamp()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { ok: true, format: "json", count: sessions.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
function copyToClipboard(sessions, format = "text") {
  if (!sessions || !sessions.length) return Promise.resolve({ ok: false, error: "NO_DATA" });
  return new Promise((resolve) => {
    try {
      let content;
      if (format === "json") {
        content = mapSessionsForJSON(sessions);
      } else if (format === "csv") {
        content = mapSessionsForCSV(sessions);
      } else {
        const texts = [];
        for (let i = 0; i < sessions.length; i++) {
          const mapped = mapSessionForExport(sessions[i]);
          const lines = [];
          for (const k in mapped) {
            if (Object.prototype.hasOwnProperty.call(mapped, k)) lines.push(`${k}: ${mapped[k]}`);
          }
          texts.push(lines.join("\n"));
        }
        content = texts.join("\n\n---\n\n");
      }
      navigator.clipboard.writeText(content).then(() => {
        resolve({ ok: true, format, count: sessions.length });
      }).catch(() => {
        const textarea = document.createElement("textarea");
        textarea.value = content;
        textarea.style.position = "fixed";
        textarea.style.opacity = "0";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
        resolve({ ok: true, format, count: sessions.length, fallback: true });
      });
    } catch (e) {
      resolve({ ok: false, error: e.message });
    }
  });
}
function print(sessions, title = "Relat\xF3rio de Sess\xF5es") {
  if (!sessions || !sessions.length) return { ok: false, error: "NO_DATA" };
  try {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return { ok: false, error: "POPUP_BLOCKED" };
    const html = _generatePrintHTML(sessions, title);
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
    return { ok: true, count: sessions.length };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
function _getTimestamp() {
  const now = /* @__PURE__ */ new Date();
  return now.toISOString().slice(0, 19).replace(/[-:T]/g, "");
}
function _generatePrintHTML(sessions, title) {
  const mapped = [];
  for (let i = 0; i < sessions.length; i++) mapped.push(mapSessionForExport(sessions[i]));
  const headers = mapped[0] ? Object.keys(mapped[0]) : [];
  let headerCells = "";
  for (let h = 0; h < headers.length; h++) headerCells += `<th>${headers[h]}</th>`;
  let rows = "";
  for (let j = 0; j < mapped.length; j++) {
    const row = mapped[j];
    rows += "<tr>";
    for (let c = 0; c < headers.length; c++) rows += `<td>${row[headers[c]] || "-"}</td>`;
    rows += "</tr>";
  }
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${title}</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:11pt;padding:20px}h1{font-size:16pt;margin-bottom:10px;color:#333}.meta{font-size:9pt;color:#666;margin-bottom:20px}table{width:100%;border-collapse:collapse;margin-top:10px}th,td{border:1px solid #ddd;padding:6px 8px;text-align:left;font-size:9pt}th{background:#f5f5f5;font-weight:bold}tr:nth-child(even){background:#fafafa}.footer{margin-top:20px;font-size:9pt;color:#666;text-align:right}@media print{@page{size:A4 landscape;margin:1cm}body{padding:0}}</style></head><body><h1>${title}</h1><div class="meta">Gerado em: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} | Total: ${sessions.length} sess\xE3o(\xF5es)</div><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table><div class="footer">DshowDash - Gerenciamento de Sess\xF5es</div></body></html>`;
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { exportToCSVReady: typeof exportToCSV === "function", exportToJSONReady: typeof exportToJSON === "function" } };
}
var exporter_default = { VERSION, MODULE_ID, exportToCSV, exportToJSON, copyToClipboard, print, getVersion, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  copyToClipboard,
  exporter_default as default,
  exportToCSV,
  exportToJSON,
  getVersion,
  healthCheck,
  info,
  print
};
