// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:export-manager
// PURPOSE: Panel-05 Export Manager - Enterprise Premium AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IconRegistry from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   exportManager — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.open
// ═══════════════════════════════════════════════════════════════
'use strict';

import { IconRegistry } from '/components/icon-registry/index.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:export-manager';

const icon = (name: string) => IconRegistry.get(name) || '';

const EXPORT_FORMATS = {
  csv: { id: 'csv', label: 'CSV', mime: 'text/csv', ext: '.csv', description: 'Arquivo separado por vírgulas' },
  excel: { id: 'excel', label: 'Excel', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx', description: 'Planilha Microsoft Excel' },
  pdf: { id: 'pdf', label: 'PDF', mime: 'application/pdf', ext: '.pdf', description: 'Documento PDF' }
};

class ExportManager {
  [key: string]: any;
  constructor() { this._processing = false; this._abortController = null; }

  getFormats() { return Object.values(EXPORT_FORMATS).map(f => ({ ...f, icon: f.id === 'csv' ? icon('business:file-text') : f.id === 'excel' ? icon('table:file-spreadsheet') : icon('table:file-pdf') })); }
  isProcessing() { return this._processing; }
  cancel() { if (this._abortController) { this._abortController.abort(); this._abortController = null; } this._processing = false; }

  async exportCSV(data: Array<Record<string, unknown>>, options: Record<string, unknown> = {}) {
    const { filename = 'export', columns = null, includeHeaders = true } = options;
    if (!data?.length) throw new Error('Nenhum dado para exportar');
    this._processing = true;
    try { const csv = this._dataToCSV(data, columns as string[] | null, includeHeaders as boolean); this._downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8'); return { success: true, rows: data.length, format: 'csv' }; } finally { this._processing = false; }
  }

  async exportExcel(data: Array<Record<string, unknown>>, options: Record<string, unknown> = {}) {
    const { filename = 'export', sheetName = 'Dados', columns = null, apiEndpoint = null } = options;
    if (!data?.length) throw new Error('Nenhum dado para exportar');
    this._processing = true;
    this._abortController = new AbortController();
    try {
      if (apiEndpoint) { const response = await fetch(String(apiEndpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, sheetName, columns }), signal: this._abortController.signal }); if (!response.ok) throw new Error('Erro ao gerar Excel'); const blob = await response.blob(); this._downloadBlob(blob, `${filename}.xlsx`); }
      else { const csv = this._dataToCSV(data, columns as string[] | null, true); this._downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8'); }
      return { success: true, rows: data.length, format: 'excel' };
    } finally { this._processing = false; this._abortController = null; }
  }

  async exportPDF(data: Array<Record<string, unknown>>, options: Record<string, unknown> = {}) {
    const { filename = 'export', title = 'Relatório', apiEndpoint = null, orientation = 'portrait', columns = null } = options;
    if (!data?.length) throw new Error('Nenhum dado para exportar');
    this._processing = true;
    this._abortController = new AbortController();
    try {
      if (apiEndpoint) { const response = await fetch(String(apiEndpoint), { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ data, title, orientation, columns }), signal: this._abortController.signal }); if (!response.ok) throw new Error('Erro ao gerar PDF'); const blob = await response.blob(); this._downloadBlob(blob, `${filename}.pdf`); }
      else { this._printData(data, String(title), columns as string[] | null); }
      return { success: true, rows: data.length, format: 'pdf' };
    } finally { this._processing = false; this._abortController = null; }
  }

  async export(format: string, data: Array<Record<string, unknown>>, options: Record<string, unknown> = {}) { switch (format) { case 'csv': return this.exportCSV(data, options); case 'excel': return this.exportExcel(data, options); case 'pdf': return this.exportPDF(data, options); default: throw new Error(`Formato não suportado: ${format}`); } }

  renderExportButton(options: Record<string, unknown> = {}) {
    const { disabled = false, loading = false, compact = false } = options;
    const disabledAttr = disabled || loading ? 'disabled' : '';
    const iconSvg = loading ? icon('system:loader') : icon('ui:download');
    return `<button class="p05-btn p05-btn-export ${compact ? 'p05-btn-sm' : ''}" data-action="export-menu" ${disabledAttr} aria-label="Exportar dados" aria-haspopup="menu"><span class="p05-btn-icon ${loading ? 'p05-spin' : ''}">${iconSvg}</span>${!compact ? '<span class="p05-btn-label">Exportar</span>' : ''}</button>`;
  }

  renderExportMenu(options: Record<string, unknown> = {}) {
    const { position = 'bottom-end', selectedFormat = null } = options;
    const formats = this.getFormats();
    return `<div class="p05-export-menu p05-dropdown-menu" data-position="${position}" role="menu"><div class="p05-dropdown-header">Exportar como</div>${formats.map(f => `<button class="p05-dropdown-item ${selectedFormat === f.id ? 'p05-selected' : ''}" data-action="export" data-format="${f.id}" role="menuitem"><span class="p05-dropdown-icon">${f.icon}</span><span class="p05-dropdown-label">${f.label}</span><span class="p05-dropdown-desc">${f.description}</span>${selectedFormat === f.id ? `<span class="p05-dropdown-check">${icon('ui:check')}</span>` : ''}</button>`).join('')}</div>`;
  }

  renderExportModal(options: Record<string, unknown> = {}) {
    const { title = 'Exportar Dados', rowCount = 0, filters = {} } = options;
    const formats = this.getFormats();
    // @ts-expect-error strict migration — TS2769
    const activeFilters = Object.entries(filters).filter(([k, v]) => v).length;
    return `<div class="p05-modal p05-export-modal" role="dialog" aria-modal="true" aria-labelledby="export-modal-title"><div class="p05-modal-backdrop" data-action="close-modal"></div><div class="p05-modal-content"><div class="p05-modal-header"><h3 id="export-modal-title">${title}</h3><button class="p05-modal-close" data-action="close-modal" aria-label="Fechar">${icon('ui:x')}</button></div><div class="p05-modal-body"><div class="p05-export-info"><div class="p05-export-stat"><span class="p05-export-stat-value">${this._formatNumber(rowCount)}</span><span class="p05-export-stat-label">registros</span></div>${activeFilters > 0 ? `<div class="p05-export-stat"><span class="p05-export-stat-value">${activeFilters}</span><span class="p05-export-stat-label">filtros ativos</span></div>` : ''}</div><div class="p05-export-formats"><label class="p05-label">Formato</label><div class="p05-format-grid">${formats.map((f, i) => `<label class="p05-format-option ${i === 0 ? 'p05-selected' : ''}"><input type="radio" name="export-format" value="${f.id}" ${i === 0 ? 'checked' : ''}><span class="p05-format-card"><span class="p05-format-icon">${f.icon}</span><span class="p05-format-label">${f.label}</span><span class="p05-format-desc">${f.description}</span></span></label>`).join('')}</div></div></div><div class="p05-modal-footer"><button class="p05-btn p05-btn-ghost" data-action="close-modal">Cancelar</button><button class="p05-btn p05-btn-primary" data-action="confirm-export"><span class="p05-btn-icon">${icon('ui:download')}</span>Exportar</button></div></div></div>`;
  }

  _dataToCSV(data: Array<Record<string, unknown>>, columns: string[] | null, includeHeaders: boolean) { if (!data?.length) return ''; const keys: string[] = columns || Object.keys(data[0]); const rows: string[] = []; if (includeHeaders) rows.push(keys.map((k: string) => this._escapeCSV(this._formatHeader(k))).join(';')); for (const item of data) { const row = keys.map((k: string) => { const val = item[k]; return this._escapeCSV(this._formatValue(val)); }); rows.push(row.join(';')); } return `\uFEFF${rows.join('\n')}`; }
  _escapeCSV(val: unknown) { if (val === null || val === undefined) return ''; const str = String(val); if (str.includes(';') || str.includes('"') || str.includes('\n')) return `"${str.replace(/"/g, '""')}"`; return str; }
  _formatHeader(key: string) { return key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1').replace(/^\w/, (c: string) => c.toUpperCase()).trim(); }
  _formatValue(val: unknown) { if (val === null || val === undefined) return ''; if (typeof val === 'number') return new Intl.NumberFormat('pt-BR').format(val); if (val instanceof Date) return val.toLocaleDateString('pt-BR'); return String(val); }
  _formatNumber(n: unknown) { return new Intl.NumberFormat('pt-BR').format(Number(n) || 0); }
  _downloadFile(content: string, filename: string, mimeType: string) { const blob = new Blob([content], { type: mimeType }); this._downloadBlob(blob, filename); }
  _downloadBlob(blob: Blob, filename: string) { const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = filename; a.style.display = 'none'; document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url); }
  _printData(data: Array<Record<string, unknown>>, title: string, columns: string[] | null) { const keys: string[] = columns || Object.keys(data[0] || {}); const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${this._escapeHtml(title)}</title><style>body { font-family: Arial, sans-serif; font-size: 12px; margin: 20px; } h1 { font-size: 18px; margin-bottom: 16px; } table { width: 100%; border-collapse: collapse; } th, td { border: 1px solid #ddd; padding: 8px; text-align: left; } th { background: #f5f5f5; font-weight: 600; } tr:nth-child(even) { background: #fafafa; } .footer { margin-top: 20px; font-size: 10px; color: #666; }</style></head><body><h1>${this._escapeHtml(title)}</h1><table><thead><tr>${keys.map((k: string) => `<th>${this._escapeHtml(this._formatHeader(k))}</th>`).join('')}</tr></thead><tbody>${data.map((row: Record<string, unknown>) => `<tr>${keys.map((k: string) => `<td>${this._escapeHtml(this._formatValue(row[k]))}</td>`).join('')}</tr>`).join('')}</tbody></table><div class="footer">Gerado em ${new Date().toLocaleString('pt-BR')} | Total: ${data.length} registros</div></body></html>`; const printWindow = window.open('', '_blank'); if (printWindow) { printWindow.document.write(html); printWindow.document.close(); printWindow.focus(); setTimeout(() => printWindow.print(), 250); } }
  _escapeHtml(str: unknown) { if (!str) return ''; return String(str).replace(/[&<>"']/g, (m: string) => (({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[m] || m)); }
  info() { return { moduleId: MODULE_ID, version: VERSION, formats: Object.keys(EXPORT_FORMATS), processing: this._processing, source: 'IconRegistry' }; }
  healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }
}

export const exportManager = new ExportManager();
export default exportManager;
