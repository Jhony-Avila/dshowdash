// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:export-pdf
// PURPOSE: Table Engine - PDF Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   exportToPDF() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:export-pdf';

// Exportar para PDF via print ou biblioteca externa
export function exportToPDF(data: Array<Record<string, unknown>>, columns: Array<Record<string, unknown>>, options: { filename?: string; title?: string; orientation?: string } = {}) {
  const filename = options.filename || `export-${Date.now()}.pdf`;
  const title = options.title || 'Relatório';
  const orientation = options.orientation || 'landscape';
  
  // Criar HTML para impressão/PDF
  const html = createPrintableHTML(data, columns, { title, orientation, ...options });
  
  // Abrir janela de impressão
  const printWindow = window.open('', '_blank', 'width=800,height=600');
  
  if (!printWindow) {
    return { success: false, error: 'Popup bloqueado. Permita popups para exportar PDF.' };
  }
  
  printWindow.document.write(html);
  printWindow.document.close();
  
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
  
  return { success: true, filename, rowCount: data.length };
}

function createPrintableHTML(data: Array<Record<string, unknown>>, columns: Array<Record<string, unknown>>, options: { title?: string; orientation?: string } = {}) {
  const exportableCols = columns.filter(c => c.exportable !== false);
  const orientation = options.orientation || 'landscape';
  
  let headerCells = exportableCols.map(col => 
    `<th style="border:1px solid #333;padding:8px;background:#f0f0f0;text-align:left;">${escapeHtml(col.label || col.id)}</th>`
  ).join('');
  
  let bodyRows = data.map(row => {
    const cells = exportableCols.map(col => {
      const value = formatValueForPDF(row[col.id as string], col.type);
      const align = ['number', 'currency', 'percent'].includes(String(col.type)) ? 'right' : 'left';
      return `<td style="border:1px solid #ccc;padding:6px;text-align:${align};">${escapeHtml(String(value))}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  
  const now = new Date().toLocaleString('pt-BR');
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(options.title || 'Relatório')}</title>
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
    <h1>${escapeHtml(options.title || 'Relatório')}</h1>
    <div class="meta">Gerado em ${now} | Total: ${data.length} registros</div>
  </div>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
  <div class="footer">
    Página 1 | ${escapeHtml(options.title || 'Relatório')}
  </div>
</body>
</html>`;
}

function formatValueForPDF(value: unknown, type: unknown): string {
  if (value == null || value === '') return '—';

  switch (type) {
    case 'currency':
      return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
    case 'percent':
      return new Intl.NumberFormat('pt-BR', { style: 'percent', minimumFractionDigits: 2 }).format((value as number) / 100);
    case 'date':
      return new Date(value as string | number).toLocaleDateString('pt-BR');
    case 'datetime':
      return new Date(value as string | number).toLocaleString('pt-BR');
    case 'boolean':
      return value ? 'Sim' : 'Não';
    default:
      return String(value);
  }
}

function escapeHtml(str: unknown) {
  const div = document.createElement('div');
  div.textContent = (str as string) || '';
  return div.innerHTML;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { exportToPDF, info, healthCheck, VERSION, MODULE_ID };
