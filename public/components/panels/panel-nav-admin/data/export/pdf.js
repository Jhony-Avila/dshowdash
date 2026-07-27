const VERSION = "10.2.0-MIGRATION-PHASE6";
const MODULE_ID = "panel-nav-admin.data.export.pdf";
const JSPDF_CDN = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
let _jsPDFLoaded = false;
async function _loadJsPDF() {
  if (_jsPDFLoaded || typeof window !== "undefined" && window.jspdf) {
    _jsPDFLoaded = true;
    return;
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = JSPDF_CDN;
    script.onload = () => {
      _jsPDFLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error("Failed to load jsPDF from CDN"));
    document.head.appendChild(script);
  });
}
const LEVEL_LABELS = {
  0: "P\xFAblico",
  20: "Usu\xE1rio",
  40: "Avan\xE7ado",
  60: "Supervisor",
  80: "Admin",
  100: "Super Admin"
};
async function exportPDF(data, options = {}) {
  await _loadJsPDF();
  const title = options.title || "Relat\xF3rio de Navega\xE7\xE3o - Admin";
  const company = options.company || "DShowDash";
  const filename = options.filename;
  const columns = options.columns || _defaultColumns();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  doc.setFontSize(16);
  doc.setFont(void 0, "bold");
  doc.text(title, margin, 15);
  doc.setFontSize(9);
  doc.setFont(void 0, "normal");
  doc.text(`${company} | Gerado em: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} | Total: ${data.length} itens`, margin, 22);
  let y = 30;
  const colWidths = _calcColumnWidths(columns, usableWidth);
  _drawTableHeader(doc, columns, colWidths, margin, y);
  y += 8;
  doc.setFontSize(8);
  doc.setFont(void 0, "normal");
  for (let i = 0; i < data.length; i++) {
    if (y > pageHeight - 20) {
      doc.addPage();
      y = 15;
      _drawTableHeader(doc, columns, colWidths, margin, y);
      y += 8;
    }
    const item = data[i];
    const isOdd = i % 2 === 1;
    if (isOdd) {
      doc.setFillColor(245, 245, 245);
      doc.rect(margin, y - 4, usableWidth, 7, "F");
    }
    let x = margin;
    for (let c = 0; c < columns.length; c++) {
      let val = item[columns[c].field];
      if (typeof columns[c].formatter === "function") {
        val = columns[c].formatter(val, item);
      }
      const text = String(val ?? "");
      doc.text(text.substring(0, 40), x + 1, y);
      x += colWidths[c];
    }
    y += 7;
  }
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(128);
    doc.text(`P\xE1gina ${p} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 5);
    doc.text(company, margin, pageHeight - 5);
    doc.setTextColor(0);
  }
  const fname = filename || `nav-admin-report_${_dateStamp()}`;
  doc.save(`${fname}.pdf`);
}
async function exportSingleItemPDF(item, options = {}) {
  await _loadJsPDF();
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 15;
  let y = 20;
  doc.setFontSize(18);
  doc.setFont(void 0, "bold");
  doc.text("Detalhes do Item de Navega\xE7\xE3o", margin, y);
  y += 12;
  const fields = [
    ["ID", item.id],
    ["Label", item.label],
    ["Rota/Painel", item.href || "\u2014"],
    ["\xCDcone", item.icon || "default"],
    ["Se\xE7\xE3o", item.section || "\u2014"],
    ["Contexto", item.context || item.sourceTable || "sidebar"],
    ["N\xEDvel M\xEDnimo", `${item.minLevel ?? 0} (${LEVEL_LABELS[item.minLevel] || "Personalizado"})`],
    ["Status", item.isActive !== false ? "Ativo" : "Inativo"],
    ["Divisor", item.isDivider ? "Sim" : "N\xE3o"],
    ["Ordem", String(item.order ?? 0)],
    ["Roles", Array.isArray(item.roles) ? item.roles.join(", ") : "\u2014"],
    ["Criado Em", item.createdAt || "\u2014"],
    ["Atualizado Em", item.updatedAt || "\u2014"]
  ];
  doc.setFontSize(10);
  for (const [label, value] of fields) {
    doc.setFont(void 0, "bold");
    doc.text(`${label}:`, margin, y);
    doc.setFont(void 0, "normal");
    doc.text(String(value), margin + 40, y);
    y += 7;
  }
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Gerado em: ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} | DShowDash`, margin, y);
  const fname = options.filename || `nav-item_${item.id}_${_dateStamp()}`;
  doc.save(`${fname}.pdf`);
}
function _drawTableHeader(doc, columns, colWidths, startX, y) {
  doc.setFillColor(52, 73, 94);
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont(void 0, "bold");
  const totalWidth = colWidths.reduce((sum, w) => sum + w, 0);
  doc.rect(startX, y - 5, totalWidth, 7, "F");
  let x = startX;
  for (let i = 0; i < columns.length; i++) {
    doc.text(columns[i].label, x + 1, y);
    x += colWidths[i];
  }
  doc.setTextColor(0);
  doc.setFont(void 0, "normal");
}
function _calcColumnWidths(columns, totalWidth) {
  const customWidths = columns.filter((c) => c.width);
  const fixedWidth = customWidths.reduce((sum, c) => sum + (c.width || 0), 0);
  const autoCount = columns.length - customWidths.length;
  const autoWidth = autoCount > 0 ? (totalWidth - fixedWidth) / autoCount : 0;
  return columns.map((c) => c.width || autoWidth);
}
function _defaultColumns() {
  return [
    { label: "ID", field: "id", width: 30 },
    { label: "Label", field: "label", width: 40 },
    { label: "Rota", field: "href", width: 45 },
    { label: "Contexto", field: "context", width: 25, formatter: (v, item) => v || item?.sourceTable || "sidebar" },
    { label: "Se\xE7\xE3o", field: "section", width: 25 },
    { label: "N\xEDvel", field: "minLevel", width: 20, formatter: (v) => String(v ?? 0) },
    { label: "Ativo", field: "isActive", width: 15, formatter: (v) => v !== false ? "Sim" : "N\xE3o" },
    { label: "Ordem", field: "order", width: 15, formatter: (v) => String(v ?? 0) }
  ];
}
function _dateStamp() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, jsPDFLoaded: _jsPDFLoaded };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, jsPDFLoaded: _jsPDFLoaded };
}
var pdf_default = { exportPDF, exportSingleItemPDF, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  pdf_default as default,
  exportPDF,
  exportSingleItemPDF,
  healthCheck,
  info
};
