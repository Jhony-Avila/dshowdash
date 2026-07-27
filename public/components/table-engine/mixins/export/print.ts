// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:print
// PURPOSE: Table Engine - Print Mode
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   printTable() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.print
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:print';

export function printTable(data: Record<string, unknown>[], columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const title = opts.title || 'Impressão';
  const orientation = opts.orientation || 'landscape';
  const pageSize = opts.pageSize || 'A4';
  const showDate = opts.showDate !== false;
  const showPageNumbers = opts.showPageNumbers !== false;
  const html = createPrintHTML(data, columns, { title, orientation, pageSize, showDate, showPageNumbers });
  const printWindow = window.open('', '_blank', 'width=900,height=700');
  if (!printWindow) return { success: false, error: 'Popup bloqueado' };
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.onload = () => { setTimeout(() => { printWindow.focus(); printWindow.print(); }, 250); };
  return { success: true, rowCount: data.length };
}

function createPrintHTML(data: Record<string, unknown>[], columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const exportableCols = columns.filter(c => c.exportable !== false && c.printable !== false);
  const now = new Date().toLocaleString('pt-BR');
  const styles = `@page { size: ${opts.pageSize || 'A4'} ${opts.orientation || 'landscape'}; margin: 12mm; } @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } .no-print { display: none !important; } thead { display: table-header-group; } tr { page-break-inside: avoid; } } * { box-sizing: border-box; } body { font-family: Arial, sans-serif; font-size: 10px; line-height: 1.3; margin: 0; padding: 0; color: #333; } .print-header { text-align: center; padding: 10px 0 15px; border-bottom: 2px solid #333; margin-bottom: 15px; } .print-header h1 { margin: 0 0 5px; font-size: 16px; font-weight: bold; } .print-meta { color: #666; font-size: 9px; } table { width: 100%; border-collapse: collapse; } th { background: #f5f5f5; border: 1px solid #ccc; padding: 6px 8px; text-align: left; font-weight: bold; font-size: 9px; white-space: nowrap; } td { border: 1px solid #ddd; padding: 5px 8px; font-size: 9px; } tr:nth-child(even) { background: #fafafa; } .text-right { text-align: right; } .text-center { text-align: center; } .print-footer { margin-top: 15px; padding-top: 10px; border-top: 1px solid #ccc; text-align: center; font-size: 8px; color: #666; } .print-btn { position: fixed; top: 10px; right: 10px; padding: 10px 20px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; } @media print { .print-btn { display: none; } }`;
  const headerRow = exportableCols.map(col => `<th>${escapeHtml(col.label || col.id)}</th>`).join('');
  const dataRows = data.map(row => {
    const cells = exportableCols.map(col => {
      const value = formatForPrint(row[col.id as string], col.type);
      const align = ['number', 'currency', 'percent'].indexOf(col.type as string) >= 0 ? 'text-right' : '';
      return `<td class="${align}">${escapeHtml(value)}</td>`;
    }).join('');
    return `<tr>${cells}</tr>`;
  }).join('');
  return `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><title>${escapeHtml(opts.title)}</title><style>${styles}</style></head><body><button class="print-btn no-print" onclick="window.print()">Imprimir</button><div class="print-header"><h1>${escapeHtml(opts.title)}</h1>${opts.showDate ? `<div class="print-meta">Impresso em: ${now} | Total: ${data.length} registros</div>` : ''}</div><table><thead><tr>${headerRow}</tr></thead><tbody>${dataRows}</tbody></table><div class="print-footer">${escapeHtml(opts.title)} | ${data.length} registros</div></body></html>`;
}

function formatForPrint(value: unknown, type: unknown): string {
  if (value == null || value === '') return '—';
  if (type === 'currency') return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
  if (type === 'percent') return `${parseFloat(value as string).toFixed(2)}%`;
  if (type === 'number') return new Intl.NumberFormat('pt-BR').format(value as number);
  if (type === 'date') return new Date(value as string | number).toLocaleDateString('pt-BR');
  if (type === 'datetime') return new Date(value as string | number).toLocaleString('pt-BR');
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function escapeHtml(str: unknown) { const div = document.createElement('div'); div.textContent = (str as string) || ''; return div.innerHTML; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { printTable, info, healthCheck, VERSION, MODULE_ID };
