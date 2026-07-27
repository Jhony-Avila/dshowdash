const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/export-pdf";
class PDFExporter {
  constructor(options = {}) {
    const opts = options || {};
    this.title = opts.title || "Relatorio de Requisicoes";
    this.company = opts.company || "DShow Dash";
    this.logo = opts.logo || null;
    this._jsPDFLoaded = false;
  }
  async _loadLib() {
    if (this._jsPDFLoaded) return;
    const self = this;
    const jspdfUrl = "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js";
    return new Promise((resolve, reject) => {
      if (typeof jspdf !== "undefined") {
        self._jsPDFLoaded = true;
        resolve();
        return;
      }
      const script = document.createElement("script");
      script.src = jspdfUrl;
      script.onload = () => {
        self._jsPDFLoaded = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error("Falha ao carregar jsPDF"));
      };
      document.head.appendChild(script);
    });
  }
  async exportTable(data, columns, filename) {
    await this._loadLib();
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    let y = 15;
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(this.title, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${this.company} - Gerado em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")}`, 14, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    const colWidths = columns.map((c) => c.width || 40);
    const pageWidth = 277;
    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    const scale = totalWidth > pageWidth ? pageWidth / totalWidth : 1;
    let x = 14;
    columns.forEach((col, i) => {
      doc.text(String(col.label || col.id), x, y);
      x += colWidths[i] * scale;
    });
    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y, 283, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    data.forEach((row, idx) => {
      if (y > 190) {
        doc.addPage();
        y = 15;
      }
      x = 14;
      columns.forEach((col, i) => {
        let val = row[col.id] || "-";
        if (typeof val === "number") val = val.toLocaleString("pt-BR");
        val = String(val).substring(0, 30);
        doc.text(val, x, y);
        x += colWidths[i] * scale;
      });
      y += 6;
    });
    y += 5;
    doc.setFontSize(8);
    doc.text(`Total de registros: ${data.length}`, 14, y);
    doc.save(filename || "relatorio.pdf");
    return true;
  }
  async exportSingle(item, filename) {
    await this._loadLib();
    const jsPDF = window.jspdf.jsPDF;
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    let y = 20;
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`Requisicao #${item.id || item.Id_Requisicao}`, 14, y);
    y += 15;
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    const fields = [
      { label: "Descricao", value: item.descricao || item.Descricao_Requisicao },
      { label: "Fornecedor", value: item.fornecedor || item.Fornecedor },
      { label: "Centro de Custo", value: item.centro_custo || item.Centro_Custo },
      { label: "Valor Total", value: this._formatCurrency(item.total || item.Total) },
      { label: "Data", value: this._formatDate(item.data_requisicao || item.Data_Requisicao) },
      { label: "Situacao", value: this._getSituacaoLabel(item.id_situacao || item.Id_Situacao) }
    ];
    const self = this;
    fields.forEach((f) => {
      if (f.value) {
        doc.setFont("helvetica", "bold");
        doc.text(`${f.label}:`, 14, y);
        doc.setFont("helvetica", "normal");
        doc.text(String(f.value), 60, y);
        y += 8;
      }
    });
    y += 10;
    doc.setFontSize(8);
    doc.text(`Gerado em ${(/* @__PURE__ */ new Date()).toLocaleString("pt-BR")} - ${this.company}`, 14, y);
    doc.save(filename || "requisicao.pdf");
    return true;
  }
  _formatCurrency(val) {
    const num = parseFloat(String(val)) || 0;
    return `R$ ${num.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
  }
  _formatDate(d) {
    if (!d) return "-";
    const date = new Date(String(d));
    return isNaN(date.getTime()) ? "-" : date.toLocaleDateString("pt-BR");
  }
  _getSituacaoLabel(id) {
    const map = { 1304: "Pendente Lancamento", 1305: "Pendente Pagamento", 1306: "Pago" };
    return map[id] || "Desconhecido";
  }
}
function createPDFExporter(options = {}) {
  return new PDFExporter(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var export_pdf_default = { PDFExporter, createPDFExporter };
export {
  MODULE_ID,
  PDFExporter,
  VERSION,
  createPDFExporter,
  export_pdf_default as default,
  healthCheck,
  info
};
