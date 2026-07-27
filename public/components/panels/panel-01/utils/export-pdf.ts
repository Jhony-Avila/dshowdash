declare const jspdf: Record<string, any>;
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/utils/export-pdf
// PURPOSE: Panel-01 - Export PDF
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createPDFExporter() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).jspdf
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/utils/export-pdf';

export class PDFExporter {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    const opts = options || {};
    this.title = opts.title || 'Relatorio de Requisicoes';
    this.company = opts.company || 'DShow Dash';
    this.logo = opts.logo || null;
    this._jsPDFLoaded = false;
  }

  async _loadLib() {
    if (this._jsPDFLoaded) return;
    const self = this;
    const jspdfUrl = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
    return new Promise((resolve, reject) => {

      // @ts-expect-error TS migration - TS2794
      if (typeof jspdf !== 'undefined') { self._jsPDFLoaded = true; resolve(); return; }
      const script = document.createElement('script');
      script.src = jspdfUrl;

      // @ts-expect-error TS migration - TS2794
      script.onload = () => { self._jsPDFLoaded = true; resolve(); };
      script.onerror = () => { reject(new Error('Falha ao carregar jsPDF')); };
      document.head.appendChild(script);
    });
  }

  async exportTable(data: Record<string, unknown>[], columns: Record<string, unknown>[], filename: string) {
    await this._loadLib();
    const jsPDF = (window as any).jspdf.jsPDF;
    const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
    let y = 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(this.title, 14, y);
    y += 8;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`${this.company} - Gerado em ${new Date().toLocaleString('pt-BR')}`, 14, y);
    y += 10;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    const colWidths = columns.map((c: Record<string, unknown>) => (c.width as number) || 40);
    const pageWidth = 277;
    const totalWidth = colWidths.reduce((a: number, b: number) => a + b, 0);
    const scale = totalWidth > pageWidth ? pageWidth / totalWidth : 1;
    let x = 14;
    columns.forEach((col: Record<string, unknown>, i: number) => {
      doc.text(String(col.label || col.id), x, y);
      x += colWidths[i] * scale;
    });
    y += 2;
    doc.setDrawColor(200);
    doc.line(14, y, 283, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    data.forEach((row: Record<string, unknown>, idx: number) => {
      if (y > 190) { doc.addPage(); y = 15; }
      x = 14;
      columns.forEach((col: Record<string, unknown>, i: number) => {
        let val = row[col.id as string] || '-';
        if (typeof val === 'number') val = val.toLocaleString('pt-BR');
        val = String(val).substring(0, 30);
        doc.text(val, x, y);
        x += colWidths[i] * scale;
      });
      y += 6;
    });
    y += 5;
    doc.setFontSize(8);
    doc.text(`Total de registros: ${data.length}`, 14, y);
    doc.save(filename || 'relatorio.pdf');
    return true;
  }

  async exportSingle(item: Record<string, unknown>, filename: string) {
    await this._loadLib();
    const jsPDF = (window as any).jspdf.jsPDF;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    let y = 20;
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`Requisicao #${item.id || item.Id_Requisicao}`, 14, y);
    y += 15;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const fields = [
      { label: 'Descricao', value: item.descricao || item.Descricao_Requisicao },
      { label: 'Fornecedor', value: item.fornecedor || item.Fornecedor },
      { label: 'Centro de Custo', value: item.centro_custo || item.Centro_Custo },
      { label: 'Valor Total', value: this._formatCurrency(item.total || item.Total) },
      { label: 'Data', value: this._formatDate(item.data_requisicao || item.Data_Requisicao) },
      { label: 'Situacao', value: this._getSituacaoLabel(item.id_situacao || item.Id_Situacao) }
    ];
    const self = this;
    fields.forEach(f => {
      if (f.value) {
        doc.setFont('helvetica', 'bold');
        doc.text(`${f.label}:`, 14, y);
        doc.setFont('helvetica', 'normal');
        doc.text(String(f.value), 60, y);
        y += 8;
      }
    });
    y += 10;
    doc.setFontSize(8);
    doc.text(`Gerado em ${new Date().toLocaleString('pt-BR')} - ${this.company}`, 14, y);
    doc.save(filename || 'requisicao.pdf');
    return true;
  }

  _formatCurrency(val: unknown) {
    const num = parseFloat(String(val)) || 0;
    return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
  }

  _formatDate(d: unknown) {
    if (!d) return '-';
    const date = new Date(String(d));
    return isNaN(date.getTime()) ? '-' : date.toLocaleDateString('pt-BR');
  }

  _getSituacaoLabel(id: unknown) {
    const map: Record<number, string> = { 1304: 'Pendente Lancamento', 1305: 'Pendente Pagamento', 1306: 'Pago' };
    return map[id as number] || 'Desconhecido';
  }
}

export function createPDFExporter(options: Record<string, unknown> = {}) { return new PDFExporter(options); }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { PDFExporter, createPDFExporter };
