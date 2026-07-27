// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine:clipboard
// PURPOSE: Table Engine - Clipboard
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   copyToClipboard() — exported function
//   copySelectionAsHTML() — exported function
//   copyCellValue() — exported function
//   renderCopyNotification() — exported function
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

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'table-engine:clipboard';

const CLIPBOARD_SVGS = {
  check: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
};

export function copyToClipboard(data: Record<string, unknown>[], columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const exportableCols = columns.filter(c => c.exportable !== false);
  const includeHeaders = opts.includeHeaders !== false;
  const format = opts.format || 'tsv';
  let text = '';
  if (includeHeaders) text += `${exportableCols.map(c => c.label || c.id).join(format === 'csv' ? ',' : '\t')}\n`;
  data.forEach(row => {
    const values = exportableCols.map(col => {
      const value = formatForClipboard(row[col.id as string], col.type);
      if (format === 'csv' && String(value).indexOf(',') >= 0) return `"${value}"`;
      return value;
    });
    text += `${values.join(format === 'csv' ? ',' : '\t')}\n`;
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

export function copySelectionAsHTML(data: Record<string, unknown>[], columns: Record<string, unknown>[], options: Record<string, unknown>) {
  const opts = options || {};
  const exportableCols = columns.filter(c => c.exportable !== false);
  let html = '<table><thead><tr>';
  exportableCols.forEach(col => { html += `<th>${escapeHtml(col.label || col.id)}</th>`; });
  html += '</tr></thead><tbody>';
  data.forEach(row => {
    html += '<tr>';
    exportableCols.forEach(col => {
      const value = formatForClipboard(row[col.id as string], col.type);
      html += `<td>${escapeHtml(value)}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  try {
    const blob = new Blob([html], { type: 'text/html' });
    return navigator.clipboard.write([new ClipboardItem({ 'text/html': blob })]).then(() => ({
      success: true,
      rowCount: data.length,
      format: 'html'
    }));
  } catch (e) {
    return copyToClipboard(data, columns, opts);
  }
}

export function copyCellValue(value: unknown, type: string) {
  const formatted = formatForClipboard(value, type);
  return navigator.clipboard.writeText(formatted).then(() => ({
    success: true,
    value: formatted
  })).catch(() => {
    const fallback = copyFallback(formatted);
    return { success: fallback, value: formatted, fallback: true };
  });
}

function formatForClipboard(value: unknown, type: unknown): string {
  if (value == null || value === '') return '';
  if (type === 'currency') return parseFloat(String(value)).toFixed(2);
  if (type === 'percent') return `${parseFloat(String(value)).toFixed(2)}%`;
  if (type === 'date') return new Date(value as string | number).toLocaleDateString('pt-BR');
  if (type === 'datetime') return new Date(value as string | number).toLocaleString('pt-BR');
  if (type === 'boolean') return value ? 'Sim' : 'Não';
  return String(value);
}

function copyFallback(text: string) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;';
  document.body.appendChild(textarea);
  textarea.select();
  let success = false;
  try { success = document.execCommand('copy'); } catch (e) {}
  document.body.removeChild(textarea);
  return success;
}

function escapeHtml(str: unknown) { const div = document.createElement('div'); div.textContent = (str as string) || ''; return div.innerHTML; }

export function renderCopyNotification(options: Record<string, unknown>) {
  const opts = options || {};
  const p = opts.cssPrefix || 'tbl-';
  const message = opts.message || 'Copiado para área de transferência!';
  return `<div class="${p}copy-notification ${p}show"><span class="${p}copy-icon">${CLIPBOARD_SVGS.check}</span><span class="${p}copy-message">${message}</span></div>`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { copyToClipboard, copySelectionAsHTML, copyCellValue, renderCopyNotification, info, healthCheck, VERSION, MODULE_ID };
