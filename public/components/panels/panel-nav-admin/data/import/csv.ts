// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.import.csv
// PURPOSE: Import CSV — Importar itens de navegação a partir de CSV
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   parseCSV() — Parse CSV string into array of objects
//   readCSVFile() — Read a File object and parse as CSV
//   validateCSVRow() — Validate a parsed row against nav-admin schema
//   REQUIRED_FIELDS — Minimum fields for a valid row
//   info(), healthCheck()
//
// @origin Adapted from panel-01 import utilities for nav-admin domain
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.7
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.import.csv';

/**
 * Minimum required fields for a valid nav-admin item row.
 * @type {Array<string>}
 */
export const REQUIRED_FIELDS = ['label'];

/**
 * Default field mappings: CSV header → nav-admin field.
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
  'order': 'order'
});

/**
 * Parse a CSV string into an array of objects.
 * Supports semicolon and comma delimiters, quoted fields, UTF-8 BOM.
 *
 * @param {string} csvText — Raw CSV text
 * @param {Object} [options]
 * @param {string} [options.delimiter] — Auto-detect if omitted
 * @param {Object} [options.fieldMap] — Custom header→field mapping
 * @returns {{ rows: Array<Object>, headers: Array<string>, errors: Array<string> }}
 */
export function parseCSV(csvText: string, options: Record<string, unknown> = {}) {
  if (!csvText || typeof csvText !== 'string') {
    return { rows: [], headers: [], errors: ['CSV text is empty or invalid'] };
  }

  // Strip BOM
  let text = csvText;
  if (text.charCodeAt(0) === 0xFEFF) text = text.substring(1);

  const delimiter = (options.delimiter as string) || _detectDelimiter(text);
  const fieldMap: Record<string, string> = (options.fieldMap as Record<string, string>) || FIELD_MAP;
  const lines = _splitLines(text);

  if (lines.length < 2) {
    return { rows: [], headers: [], errors: ['CSV must have at least a header row and one data row'] };
  }

  const rawHeaders = _parseLine(lines[0], delimiter);
  const headers = rawHeaders.map(h => h.trim());
  const mappedHeaders = headers.map(h => {
    const lower = h.toLowerCase().trim();
    return fieldMap[lower] || lower;
  });

  const rows: Record<string, unknown>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const values = _parseLine(line, delimiter);
    const row: Record<string, unknown> = {};

    for (let j = 0; j < mappedHeaders.length; j++) {
      const field = mappedHeaders[j];
      let strVal = (j < values.length) ? values[j].trim() : '';
      let val: unknown = strVal;

      // Type coercion for known fields
      if (field === 'minLevel' || field === 'order') {
        const num = strVal !== '' ? parseInt(strVal, 10) : 0;
        val = isNaN(num) ? 0 : num;
      } else if (field === 'isActive') {
        val = _parseBool(strVal, true);
      } else if (field === 'isDivider') {
        val = _parseBool(strVal, false);
      }

      row[field] = val;
    }

    rows.push(row);
  }

  return { rows, headers, errors };
}

/**
 * Read a File object and parse its content as CSV.
 *
 * @param {File} file — CSV file from file input
 * @param {Object} [options] — Options for parseCSV
 * @returns {Promise<{ rows: Array<Object>, headers: Array<string>, errors: Array<string> }>}
 */
export function readCSVFile(file: File, options: Record<string, unknown> = {}) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve({ rows: [], headers: [], errors: ['No file provided'] });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = parseCSV(e.target!.result as string, options);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('Failed to read CSV file'));
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Validate a parsed row against nav-admin schema.
 *
 * @param {Object} row — Parsed row
 * @returns {{ valid: boolean, errors: Array<string> }}
 */
export function validateCSVRow(row: Record<string, unknown>) {
  const errors = [];

  if (!row) {
    return { valid: false, errors: ['Row is null or undefined'] };
  }

  for (const field of REQUIRED_FIELDS) {
    if (!row[field] || (typeof row[field] === 'string' && (row[field] as string).trim() === '')) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (row.minLevel !== undefined && row.minLevel !== null) {
    const level = Number(row.minLevel);
    if (isNaN(level) || level < 0 || level > 99) {
      errors.push('minLevel must be between 0 and 99');
    }
  }

  if (row.context && !['sidebar', 'navrail', 'header', 'footer'].includes(row.context as string)) {
    errors.push(`Invalid context: ${row.context as string}. Must be sidebar, navrail, header, or footer`);
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Auto-detect CSV delimiter (semicolon or comma).
 * @private
 * @param {string} text
 * @returns {string}
 */
function _detectDelimiter(text: string) {
  const firstLine = text.split('\n')[0] || '';
  const semicolons = (firstLine.match(/;/g) || []).length;
  const commas = (firstLine.match(/,/g) || []).length;
  return semicolons >= commas ? ';' : ',';
}

/**
 * Split text into lines, respecting quoted newlines.
 * @private
 * @param {string} text
 * @returns {Array<string>}
 */
function _splitLines(text: string) {
  const lines = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if ((ch === '\n' || ch === '\r') && !inQuotes) {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      lines.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) lines.push(current);
  return lines;
}

/**
 * Parse a single CSV line into an array of values.
 * @private
 * @param {string} line
 * @param {string} delimiter
 * @returns {Array<string>}
 */
function _parseLine(line: string, delimiter: string) {
  const values = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  values.push(current);
  return values;
}

/**
 * Parse boolean-like values (Sim/Não, true/false, 1/0).
 * @private
 * @param {*} val
 * @param {boolean} defaultValue
 * @returns {boolean}
 */
function _parseBool(val: unknown, defaultValue: boolean) {
  if (val == null || val === '') return defaultValue;
  const lower = String(val).toLowerCase().trim();
  if (['sim', 'true', '1', 'yes', 's'].includes(lower)) return true;
  if (['não', 'nao', 'false', '0', 'no', 'n'].includes(lower)) return false;
  return defaultValue;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, requiredFields: REQUIRED_FIELDS };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default { parseCSV, readCSVFile, validateCSVRow, REQUIRED_FIELDS, FIELD_MAP, info, healthCheck, VERSION, MODULE_ID };
