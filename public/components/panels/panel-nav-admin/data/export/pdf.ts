// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.export.pdf
// PURPOSE: Export PDF — Exportar relatório visual de itens de navegação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none — jsPDF loaded dynamically from CDN)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   exportPDF() — Generate and download PDF report
//   exportSingleItemPDF() — Export single item detail
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/export-pdf.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.6
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.export.pdf';

/** @private jsPDF CDN URL */
const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

/** @private jsPDF loaded flag */
let _jsPDFLoaded = false;

/**
 * Load jsPDF from CDN if not already loaded.
 * @private
 * @returns {Promise<void>}
 */
async function _loadJsPDF() {
  if (_jsPDFLoaded || (typeof window !== 'undefined' && (window as any).jspdf)) {
    _jsPDFLoaded = true;
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = JSPDF_CDN;

    // @ts-expect-error TS migration - TS2794
    script.onload = () => { _jsPDFLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load jsPDF from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Permission level labels for display.
 * @private
 */
const LEVEL_LABELS = {
  0: 'Público',
  20: 'Usuário',
  40: 'Avançado',
  60: 'Supervisor',
  80: 'Admin',
  100: 'Super Admin'
};

/**
 * Export items as a PDF table report.
 *
 * @param {Array<Object>} data — Items to export
 * @param {Object} [options]
 * @param {string} [options.title='Relatório de Navegação - Admin']
 * @param {string} [options.company='DShowDash']
 * @param {string} [options.filename] — Download filename (without .pdf)
 * @param {Array<{label: string, field: string, width?: number, formatter?: Function}>} [options.columns]
 * @returns {Promise<void>}
 */
type PdfColumn = { label: string; field: string; width?: number; formatter?: (v: unknown, item?: Record<string, unknown>) => string };
export async function exportPDF(data: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  await _loadJsPDF();

  const title = (options.title as string) || 'Relatório de Navegação - Admin';
  const company = (options.company as string) || 'DShowDash';
  const filename = options.filename as string | undefined;
  const columns = (options.columns as PdfColumn[]) || _defaultColumns();

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;

  // Header
  doc.setFontSize(16);
  doc.setFont(undefined, 'bold');
  doc.text(title, margin, 15);

  doc.setFontSize(9);
  doc.setFont(undefined, 'normal');
  doc.text(`${company} | Gerado em: ${new Date().toLocaleString('pt-BR')} | Total: ${data.length} itens`, margin, 22);

  // Table header
  let y = 30;
  const colWidths = _calcColumnWidths(columns, usableWidth);
  _drawTableHeader(doc, columns, colWidths, margin, y);
  y += 8;

  // Table rows
  doc.setFontSize(8);
  doc.setFont(undefined, 'normal');

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
      doc.rect(margin, y - 4, usableWidth, 7, 'F');
    }

    let x = margin;
    for (let c = 0; c < columns.length; c++) {
      let val = item[columns[c].field];
      if (typeof columns[c].formatter === 'function') {
        // @ts-expect-error strict migration — TS2722
        val = columns[c].formatter(val, item);
      }
      const text = String(val ?? '');
      doc.text(text.substring(0, 40), x + 1, y);
      x += colWidths[c];
    }
    y += 7;
  }

  // Footer
  const totalPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(7);
    doc.setTextColor(128);
    doc.text(`Página ${p} de ${totalPages}`, pageWidth - margin - 25, pageHeight - 5);
    doc.text(company, margin, pageHeight - 5);
    doc.setTextColor(0);
  }

  const fname = filename || `nav-admin-report_${_dateStamp()}`;
  doc.save(`${fname}.pdf`);
}

/**
 * Export a single item as a detailed PDF page.
 *
 * @param {Object} item — Navigation item
 * @param {Object} [options]
 * @param {string} [options.filename]
 * @returns {Promise<void>}
 */
export async function exportSingleItemPDF(item: Record<string, unknown>, options: Record<string, unknown> = {}) {
  await _loadJsPDF();

  const { jsPDF } = (window as any).jspdf;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const margin = 15;
  let y = 20;

  // Title
  doc.setFontSize(18);
  doc.setFont(undefined, 'bold');
  doc.text('Detalhes do Item de Navegação', margin, y);
  y += 12;

  // Item details
  const fields = [
    ['ID', item.id],
    ['Label', item.label],
    ['Rota/Painel', item.href || '—'],
    ['Ícone', item.icon || 'default'],
    ['Seção', item.section || '—'],
    ['Contexto', item.context || item.sourceTable || 'sidebar'],
    ['Nível Mínimo', `${item.minLevel ?? 0} (${(LEVEL_LABELS as Record<number, string>)[item.minLevel as number] || 'Personalizado'})`],
    ['Status', item.isActive !== false ? 'Ativo' : 'Inativo'],
    ['Divisor', item.isDivider ? 'Sim' : 'Não'],
    ['Ordem', String(item.order ?? 0)],
    ['Roles', Array.isArray(item.roles) ? item.roles.join(', ') : '—'],
    ['Criado Em', item.createdAt || '—'],
    ['Atualizado Em', item.updatedAt || '—']
  ];

  doc.setFontSize(10);
  for (const [label, value] of fields) {
    doc.setFont(undefined, 'bold');
    doc.text(`${label}:`, margin, y);
    doc.setFont(undefined, 'normal');
    doc.text(String(value), margin + 40, y);
    y += 7;
  }

  // Footer
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(128);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')} | DShowDash`, margin, y);

  const fname = options.filename || `nav-item_${item.id}_${_dateStamp()}`;
  doc.save(`${fname}.pdf`);
}

/**
 * Draw table header row.
 * @private
 */
function _drawTableHeader(doc: Record<string, (...args: unknown[]) => unknown>, columns: PdfColumn[], colWidths: number[], startX: number, y: number) {
  doc.setFillColor(52, 73, 94);
  doc.setTextColor(255);
  doc.setFontSize(8);
  doc.setFont(undefined, 'bold');

  const totalWidth = colWidths.reduce((sum: number, w: number) => sum + w, 0);
  doc.rect(startX, y - 5, totalWidth, 7, 'F');

  let x = startX;
  for (let i = 0; i < columns.length; i++) {
    doc.text(columns[i].label, x + 1, y);
    x += colWidths[i];
  }

  doc.setTextColor(0);
  doc.setFont(undefined, 'normal');
}

/**
 * Calculate column widths proportionally.
 * @private
 */
function _calcColumnWidths(columns: PdfColumn[], totalWidth: number) {
  const customWidths = columns.filter((c: PdfColumn) => c.width);
  const fixedWidth = customWidths.reduce((sum: number, c: PdfColumn) => sum + (c.width || 0), 0);
  const autoCount = columns.length - customWidths.length;
  const autoWidth = autoCount > 0 ? (totalWidth - fixedWidth) / autoCount : 0;

  return columns.map((c: PdfColumn) => c.width || autoWidth);
}

/**
 * Default columns for PDF table.
 * @private
 */
function _defaultColumns() {
  return [
    { label: 'ID', field: 'id', width: 30 },
    { label: 'Label', field: 'label', width: 40 },
    { label: 'Rota', field: 'href', width: 45 },
    { label: 'Contexto', field: 'context', width: 25, formatter: (v: unknown, item?: Record<string, unknown>) => (v || item?.sourceTable || 'sidebar') as string },
    { label: 'Seção', field: 'section', width: 25 },
    { label: 'Nível', field: 'minLevel', width: 20, formatter: (v: unknown) => String(v ?? 0) },
    { label: 'Ativo', field: 'isActive', width: 15, formatter: (v: unknown) => v !== false ? 'Sim' : 'Não' },
    { label: 'Ordem', field: 'order', width: 15, formatter: (v: unknown) => String(v ?? 0) }
  ];
}

/**
 * Date stamp for filenames.
 * @private
 */
function _dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, jsPDFLoaded: _jsPDFLoaded };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, jsPDFLoaded: _jsPDFLoaded };
}

export default { exportPDF, exportSingleItemPDF, info, healthCheck, VERSION, MODULE_ID };
