// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.export.csv
// PURPOSE: Export CSV — Exportar itens de navegação em formato CSV
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   toCSV() — Convert items to CSV string
//   downloadCSV() — Generate and download CSV file
//   DEFAULT_COLUMNS — Default column config for nav-admin export
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/export.js toCSV/downloadCSV
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.6
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.export.csv';

/**
 * Default columns for nav-admin CSV export.
 * @type {Array<{label: string, field: string, formatter?: Function}>}
 */
export const DEFAULT_COLUMNS = [
  { label: 'ID', field: 'id' },
  { label: 'Label', field: 'label' },
  { label: 'Rota/Painel', field: 'href' },
  { label: 'Ícone', field: 'icon' },
  { label: 'Seção', field: 'section' },
  { label: 'Contexto', field: 'context', formatter: (v: unknown, item: Record<string, unknown>) => v || item.sourceTable || 'sidebar' },
  { label: 'Nível Mínimo', field: 'minLevel', formatter: (v: unknown) => String(v ?? 0) },
  { label: 'Ativo', field: 'isActive', formatter: (v: unknown) => v !== false ? 'Sim' : 'Não' },
  { label: 'Divisor', field: 'isDivider', formatter: (v: unknown) => v === true ? 'Sim' : 'Não' },
  { label: 'Ordem', field: 'order', formatter: (v: unknown) => String(v ?? 0) },
  { label: 'Criado Em', field: 'createdAt' },
  { label: 'Atualizado Em', field: 'updatedAt' }
];

/**
 * Convert an array of items to a CSV string.
 * Uses semicolon delimiter (common in pt-BR locale) and UTF-8 BOM for Excel compatibility.
 *
 * @param {Array<Object>} data — Items to export
 * @param {Array<{label: string, field: string, formatter?: Function}>} [columns] — Column definitions
 * @param {Object} [options]
 * @param {string} [options.delimiter=';'] — Field delimiter
 * @param {boolean} [options.bom=true] — Include UTF-8 BOM
 * @returns {string} CSV content
 */
type CsvColumn = { label: string; field: string; formatter?: (v: unknown, item?: Record<string, unknown>) => unknown };
export function toCSV(data: Record<string, unknown>[], columns: CsvColumn[] = DEFAULT_COLUMNS as CsvColumn[], options: Record<string, unknown> = {}) {
  const { delimiter = ';', bom = true } = options;

  const header = columns.map(col => _quoteField(col.label, String(delimiter))).join(String(delimiter));

  const rows = data.map((item: Record<string, unknown>) => {
    return columns.map((col: CsvColumn) => {
      let val = item[col.field];
      if (typeof col.formatter === 'function') {
        val = col.formatter(val, item);
      }
      return _quoteField(val, String(delimiter));
    }).join(String(delimiter));
  });

  const csv = [header, ...rows].join('\n');
  return bom ? '\uFEFF' + csv : csv;
}

/**
 * Generate and download a CSV file.
 *
 * @param {Array<Object>} data — Items to export
 * @param {Array<{label: string, field: string, formatter?: Function}>} [columns] — Column definitions
 * @param {string} [filename] — Download filename (without extension)
 * @param {Object} [options] — Options for toCSV
 */
export function downloadCSV(data: Record<string, unknown>[], columns: CsvColumn[] = DEFAULT_COLUMNS as CsvColumn[], filename?: string, options: Record<string, unknown> = {}) {
  const csvContent = toCSV(data, columns, options);
  const fname = filename || `nav-admin-export_${_dateStamp()}`;
  _downloadBlob(csvContent, `${fname}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Quote a field value for CSV.
 * @private
 * @param {*} value
 * @param {string} delimiter
 * @returns {string}
 */
function _quoteField(value: unknown, delimiter: string) {
  const str = value == null ? '' : String(value);
  if (str.includes(delimiter) || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Trigger a file download from string content.
 * @private
 * @param {string} content
 * @param {string} filename
 * @param {string} mimeType
 */
function _downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

/**
 * Generate date stamp for filenames.
 * @private
 * @returns {string} YYYYMMDD
 */
function _dateStamp() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, columnsCount: DEFAULT_COLUMNS.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { toCSV, downloadCSV, DEFAULT_COLUMNS, info, healthCheck, VERSION, MODULE_ID };
