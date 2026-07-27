// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.import.xlsx
// PURPOSE: Import XLSX — Importar itens de navegação a partir de planilha Excel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none — SheetJS loaded dynamically from CDN)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   readXLSXFile() — Read a File and parse as XLSX
//   parseXLSXSheet() — Parse a specific sheet into array of objects
//   getSheetNames() — Get list of sheet names from workbook
//   info(), healthCheck()
//
// @origin Adapted from panel-01 import utilities for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.7
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.import.xlsx';

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
 * Default field mappings: XLSX header → nav-admin field.
 * @type {Object<string, string>}
 */
export const FIELD_MAP = Object.freeze({
  'id': 'id',
  'label': 'label',
  'rota/painel': 'href',
  'rota': 'href',
  'href': 'href',
  'icone': 'icon',
  'ícone': 'icon',
  'icon': 'icon',
  'secao': 'section',
  'seção': 'section',
  'section': 'section',
  'contexto': 'context',
  'context': 'context',
  'nivel minimo': 'minLevel',
  'nível mínimo': 'minLevel',
  'minlevel': 'minLevel',
  'ativo': 'isActive',
  'isactive': 'isActive',
  'divisor': 'isDivider',
  'isdivider': 'isDivider',
  'ordem': 'order',
  'order': 'order',
  'roles': 'roles'
});

/**
 * Read an XLSX File and parse it.
 *
 * @param {File} file — XLSX file from file input
 * @param {Object} [options]
 * @param {string} [options.sheetName] — Specific sheet name (defaults to first)
 * @param {Object} [options.fieldMap] — Custom header→field mapping
 * @returns {Promise<{ rows: Array<Object>, headers: Array<string>, sheetNames: Array<string>, errors: Array<string> }>}
 */
export async function readXLSXFile(file: File, options: Record<string, unknown> = {}) {
  if (!file) {
    return { rows: [], headers: [], sheetNames: [], errors: ['No file provided'] };
  }

  await _loadSheetJS();
  const XLSX = (window as any).XLSX;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {

        // @ts-expect-error TS migration - TS2769
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetNames = workbook.SheetNames;

        const targetSheet = options.sheetName || sheetNames[0];
        if (!workbook.Sheets[targetSheet]) {
          resolve({ rows: [], headers: [], sheetNames, errors: [`Sheet "${targetSheet}" not found`] });
          return;
        }

        const result = parseXLSXSheet(workbook.Sheets[targetSheet], options);
        resolve({ ...result, sheetNames });
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read XLSX file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse a SheetJS worksheet into an array of objects.
 *
 * @param {Object} sheet — SheetJS worksheet object
 * @param {Object} [options]
 * @param {Object} [options.fieldMap] — Custom header→field mapping
 * @returns {{ rows: Array<Object>, headers: Array<string>, errors: Array<string> }}
 */
export function parseXLSXSheet(sheet: unknown, options: Record<string, unknown> = {}) {
  const XLSX = (window as any).XLSX;
  const fieldMap = (options.fieldMap || FIELD_MAP) as Record<string, string>;
  const errors: string[] = [];

  // Convert sheet to array of arrays
  const aoa = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  if (!aoa || aoa.length < 2) {
    return { rows: [], headers: [], errors: ['Sheet must have at least a header row and one data row'] };
  }

  const rawHeaders = (aoa[0] as unknown[]).map((h: unknown) => String(h || '').trim());
  const mappedHeaders = rawHeaders.map((h: string) => {
    const lower = h.toLowerCase().trim();
    return fieldMap[lower] || lower;
  });

  const rows: Record<string, unknown>[] = [];

  for (let i = 1; i < aoa.length; i++) {
    const rowData = aoa[i] as unknown[];
    if (!rowData || (rowData as unknown[]).every((cell: unknown) => cell == null || cell === '')) continue;

    const row: Record<string, unknown> = {};
    for (let j = 0; j < mappedHeaders.length; j++) {
      const field = mappedHeaders[j];
      let val = (j < rowData.length) ? rowData[j] : '';

      // Type coercion
      if (field === 'minLevel' || field === 'order') {
        val = val !== '' && val != null ? parseInt(String(val), 10) : 0;
        if (isNaN(val as number)) val = 0;
      } else if (field === 'isActive') {
        val = _parseBool(val, true);
      } else if (field === 'isDivider') {
        val = _parseBool(val, false);
      } else if (field === 'roles') {
        if (typeof val === 'string') {
          val = val.split(',').map(r => r.trim()).filter(Boolean);
        } else if (!Array.isArray(val)) {
          val = [];
        }
      } else {
        val = val != null ? String(val) : '';
      }

      (row as Record<string, unknown>)[field] = val;
    }

    rows.push(row);
  }

  return { rows, headers: rawHeaders, errors };
}

/**
 * Get sheet names from an XLSX File.
 *
 * @param {File} file
 * @returns {Promise<Array<string>>}
 */
export async function getSheetNames(file: File) {
  if (!file) return [];
  await _loadSheetJS();
  const XLSX = (window as any).XLSX;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {

        // @ts-expect-error TS migration - TS2769
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        resolve(workbook.SheetNames);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read XLSX file'));
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Parse boolean-like values.
 * @private
 */
function _parseBool(val: unknown, defaultValue: boolean) {
  if (val == null || val === '') return defaultValue;
  const lower = String(val).toLowerCase().trim();
  if (['sim', 'true', '1', 'yes', 's'].includes(lower)) return true;
  if (['não', 'nao', 'false', '0', 'no', 'n'].includes(lower)) return false;
  return defaultValue;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, sheetJSLoaded: _sheetJSLoaded };
}

export default { readXLSXFile, parseXLSXSheet, getSheetNames, FIELD_MAP, info, healthCheck, VERSION, MODULE_ID };
