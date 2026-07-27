// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.export.xlsx
// PURPOSE: Export XLSX — Exportar itens de navegação em planilha Excel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none — SheetJS loaded dynamically from CDN)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   exportXLSX() — Generate and download XLSX file
//   info(), healthCheck()
//
// @origin Adapted from panel-01/utils/export-xlsx.js for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.6
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.export.xlsx';

/** @private SheetJS CDN URL */
const SHEETJS_CDN = 'https://cdn.sheetjs.com/xlsx-0.20.0/package/dist/xlsx.full.min.js';

/** @private SheetJS loaded flag */
let _sheetJSLoaded = false;

/**
 * Load SheetJS from CDN if not already loaded.
 * @private
 * @returns {Promise<void>}
 */
async function _loadSheetJS() {
  if (_sheetJSLoaded || (typeof window !== 'undefined' && (window as any).XLSX)) {
    _sheetJSLoaded = true;
    return;
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SHEETJS_CDN;

    // @ts-expect-error TS migration - TS2794
    script.onload = () => { _sheetJSLoaded = true; resolve(); };
    script.onerror = () => reject(new Error('Failed to load SheetJS from CDN'));
    document.head.appendChild(script);
  });
}

/**
 * Default columns for nav-admin XLSX export.
 * @type {Array<{label: string, field: string, formatter?: Function}>}
 */
export const DEFAULT_COLUMNS = [
  { label: 'ID', field: 'id' },
  { label: 'Label', field: 'label' },
  { label: 'Rota/Painel', field: 'href' },
  { label: 'Ícone', field: 'icon' },
  { label: 'Seção', field: 'section' },
  { label: 'Contexto', field: 'context', formatter: (v: unknown, item: Record<string, unknown>) => v || item.sourceTable || 'sidebar' },
  { label: 'Nível Mínimo', field: 'minLevel', formatter: (v: unknown) => v ?? 0 },
  { label: 'Ativo', field: 'isActive', formatter: (v: unknown) => v !== false ? 'Sim' : 'Não' },
  { label: 'Divisor', field: 'isDivider', formatter: (v: unknown) => v === true ? 'Sim' : 'Não' },
  { label: 'Ordem', field: 'order', formatter: (v: unknown) => v ?? 0 },
  { label: 'Roles', field: 'roles', formatter: (v: unknown) => Array.isArray(v) ? (v as string[]).join(', ') : '' },
  { label: 'Criado Em', field: 'createdAt' },
  { label: 'Atualizado Em', field: 'updatedAt' }
];

/**
 * Export items as an XLSX file.
 *
 * @param {Array<Object>} data — Items to export
 * @param {Object} [options]
 * @param {string} [options.filename] — Download filename (without .xlsx)
 * @param {string} [options.sheetName='Navegação'] — Excel sheet name
 * @param {Array<{label: string, field: string, formatter?: Function}>} [options.columns]
 * @returns {Promise<void>}
 */
type XlsxColumn = { label: string; field: string; formatter?: (v: unknown, item?: Record<string, unknown>) => unknown };
export async function exportXLSX(data: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  await _loadSheetJS();

  const filename = options.filename as string | undefined;
  const sheetName = (options.sheetName as string) || 'Navegação';
  const columns = (options.columns as XlsxColumn[]) || DEFAULT_COLUMNS;

  const XLSX = (window as any).XLSX;

  // Build array-of-arrays (header + rows)
  const header = columns.map((col: XlsxColumn) => col.label);
  const rows = data.map((item: Record<string, unknown>) => {
    return columns.map((col: XlsxColumn) => {
      let val = item[col.field];
      if (typeof col.formatter === 'function') {
        val = col.formatter(val, item);
      }
      return val ?? '';
    });
  });

  const aoa = [header, ...rows];

  // Create workbook
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(aoa);

  // Auto-width columns
  const colWidths = columns.map((col: XlsxColumn, i: number) => {
    let maxLen = col.label.length;
    for (const row of rows) {
      const cellLen = String(row[i] ?? '').length;
      if (cellLen > maxLen) maxLen = cellLen;
    }
    return { wch: Math.min(maxLen + 2, 50) };
  });
  ws['!cols'] = colWidths;

  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  // Download
  const fname = filename || `nav-admin-export_${_dateStamp()}`;
  XLSX.writeFile(wb, `${fname}.xlsx`);
}

/**
 * Export multiple sheets (e.g., one per context: sidebar, navrail, header, footer).
 *
 * @param {Object<string, Array<Object>>} sheets — Map of sheetName → items
 * @param {Object} [options]
 * @param {string} [options.filename]
 * @param {Array} [options.columns]
 * @returns {Promise<void>}
 */
export async function exportMultiSheetXLSX(sheets: Record<string, Record<string, unknown>[]>, options: Record<string, unknown> = {}) {
  await _loadSheetJS();

  const filename = options.filename as string | undefined;
  const columns = (options.columns as XlsxColumn[]) || DEFAULT_COLUMNS;
  const XLSX = (window as any).XLSX;
  const wb = XLSX.utils.book_new();

  for (const [sheetName, data] of Object.entries(sheets)) {
    const header = columns.map((col: XlsxColumn) => col.label);

    const rows = (data as Record<string, unknown>[]).map((item: Record<string, unknown>) => columns.map((col: XlsxColumn) => {
      let val = item[col.field];
      if (typeof col.formatter === 'function') val = col.formatter(val, item);
      return val ?? '';
    }));

    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);

    const colWidths = columns.map((col: XlsxColumn, i: number) => {
      let maxLen = col.label.length;
      for (const row of rows) {
        const cellLen = String(row[i] ?? '').length;
        if (cellLen > maxLen) maxLen = cellLen;
      }
      return { wch: Math.min(maxLen + 2, 50) };
    });
    ws['!cols'] = colWidths;

    XLSX.utils.book_append_sheet(wb, ws, sheetName.substring(0, 31));
  }

  const fname = filename || `nav-admin-multi_${_dateStamp()}`;
  XLSX.writeFile(wb, `${fname}.xlsx`);
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
  return { moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded, columnsCount: DEFAULT_COLUMNS.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded };
}

export default { exportXLSX, exportMultiSheetXLSX, DEFAULT_COLUMNS, info, healthCheck, VERSION, MODULE_ID };
