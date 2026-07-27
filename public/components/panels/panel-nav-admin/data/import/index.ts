// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.import
// PURPOSE: Import Orchestrator — Coordena importações CSV, XLSX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../../config/feature-flags.js
//   parseCSV, readCSVFile, validateCSVRow from ./csv.js
//   readXLSXFile, parseXLSXSheet, getSheetNames from ./xlsx.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   importFrom() — Unified import dispatcher
//   validateRows() — Validate all parsed rows
//   IMPORT_FORMATS — Available import formats
//   info(), healthCheck()
//
// @origin New orchestrator for nav-admin import system
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.7
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../../config/feature-flags.js';
import { parseCSV, readCSVFile, validateCSVRow, REQUIRED_FIELDS } from './csv.js';
import { readXLSXFile, parseXLSXSheet, getSheetNames } from './xlsx.js';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.import';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[ImportOrchestrator]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Available import formats.
 * @type {Object}
 */
export const IMPORT_FORMATS = Object.freeze({
  JSON: 'json',
  CSV: 'csv',
  XLSX: 'xlsx'
});

/**
 * Unified import dispatcher.
 * Reads a file and returns parsed rows for preview before applying.
 *
 * @param {string} format — One of IMPORT_FORMATS values
 * @param {File} file — File object from file input
 * @param {Object} [options]
 * @param {string} [options.sheetName] — For XLSX: specific sheet name
 * @returns {Promise<{ rows: Array<Object>, headers: Array<string>, errors: Array<string>, format: string }>}
 */
export async function importFrom(format: string, file: File, options: Record<string, unknown> = {}) {
  if (!file) {
    return { rows: [], headers: [], errors: ['No file provided'], format };
  }

  _log('info', `Importing from ${format}: ${file.name}`);

  switch (format) {
    case IMPORT_FORMATS.JSON:
      return _importJSON(file);

    case IMPORT_FORMATS.CSV: {
      if (!isEnabled('importCSV')) {
        _log('warn', 'CSV import disabled by feature flag');
        return { rows: [], headers: [], errors: ['CSV import is disabled'], format };
      }
      const result = await readCSVFile(file, options);

      // @ts-expect-error TS migration - TS2698
      return { ...result, format };
    }

    case IMPORT_FORMATS.XLSX: {
      if (!isEnabled('importXLSX')) {
        _log('warn', 'XLSX import disabled by feature flag');
        return { rows: [], headers: [], errors: ['XLSX import is disabled'], format };
      }
      const result = await readXLSXFile(file, options);

      // @ts-expect-error TS migration - TS2698
      return { ...result, format };
    }

    default:
      return { rows: [], headers: [], errors: [`Unknown import format: ${format}`], format };
  }
}

/**
 * Import from JSON file (existing capability — always available).
 * @private
 * @param {File} file
 * @returns {Promise<{ rows: Array<Object>, headers: Array<string>, errors: Array<string>, format: string }>}
 */
function _importJSON(file: File) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {

        // @ts-expect-error TS migration - TS2345
        const parsed = JSON.parse(e.target.result);
        const rows = Array.isArray(parsed) ? parsed : [parsed];
        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];
        resolve({ rows, headers, errors: [], format: 'json' });
      } catch (err: any) {
        resolve({ rows: [], headers: [], errors: [`JSON parse error: ${err.message}`], format: 'json' });
      }
    };
    reader.onerror = () => resolve({ rows: [], headers: [], errors: ['Failed to read JSON file'], format: 'json' });
    reader.readAsText(file, 'UTF-8');
  });
}

/**
 * Validate all parsed rows against nav-admin schema.
 * Returns per-row validation results.
 *
 * @param {Array<Object>} rows — Parsed rows
 * @returns {{ validRows: Array<Object>, invalidRows: Array<{row: Object, index: number, errors: Array<string>}>, totalValid: number, totalInvalid: number }}
 */
export function validateRows(rows: Record<string, unknown>[]) {
  if (!Array.isArray(rows)) {
    return { validRows: [], invalidRows: [], totalValid: 0, totalInvalid: 0 };
  }

  const validRows: Record<string, unknown>[] = [];
  const invalidRows: { row: Record<string, unknown>; index: number; errors: string[] }[] = [];

  rows.forEach((row, index) => {
    const result = validateCSVRow(row);
    if (result.valid) {
      validRows.push(row);
    } else {
      invalidRows.push({ row, index: index + 1, errors: result.errors });
    }
  });

  return {
    validRows,
    invalidRows,
    totalValid: validRows.length,
    totalInvalid: invalidRows.length
  };
}

/**
 * Detect file format from File object.
 * @param {File} file
 * @returns {string|null} One of IMPORT_FORMATS values or null
 */
export function detectFormat(file: File) {
  if (!file || !file.name) return null;
  // @ts-expect-error strict migration — TS2532
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext === 'json') return IMPORT_FORMATS.JSON;
  if (ext === 'csv') return IMPORT_FORMATS.CSV;
  if (ext === 'xlsx' || ext === 'xls') return IMPORT_FORMATS.XLSX;
  return null;
}

/**
 * Get list of available import formats based on feature flags.
 * @returns {Array<{id: string, label: string, accept: string, enabled: boolean}>}
 */
export function getAvailableFormats() {
  return [
    { id: 'json', label: 'JSON', accept: '.json', enabled: true },
    { id: 'csv', label: 'CSV', accept: '.csv', enabled: isEnabled('importCSV') },
    { id: 'xlsx', label: 'Excel (XLSX)', accept: '.xlsx,.xls', enabled: isEnabled('importXLSX') }
  ];
}

// Re-export sub-modules
export { parseCSV, readCSVFile, validateCSVRow, REQUIRED_FIELDS } from './csv.js';
export { readXLSXFile, parseXLSXSheet, getSheetNames } from './xlsx.js';

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    formats: getAvailableFormats()
  };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default {
  importFrom, validateRows, detectFormat, getAvailableFormats, IMPORT_FORMATS,
  parseCSV, readCSVFile, validateCSVRow, readXLSXFile, parseXLSXSheet, getSheetNames,
  injectPorts, info, healthCheck, VERSION, MODULE_ID
};
