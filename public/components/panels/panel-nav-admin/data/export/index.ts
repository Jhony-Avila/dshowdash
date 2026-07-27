// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-MIGRATION-PHASE6)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.data.export
// PURPOSE: Export Orchestrator — Coordena exportações CSV, PDF, XLSX
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../../config/feature-flags.js
//   toCSV, downloadCSV from ./csv.js
//   exportPDF, exportSingleItemPDF from ./pdf.js
//   exportXLSX, exportMultiSheetXLSX from ./xlsx.js
//
// PROVIDES:
//   VERSION, MODULE_ID
//   exportAs() — Unified export dispatcher
//   EXPORT_FORMATS — Available formats
//   info(), healthCheck()
//
// @origin New orchestrator for nav-admin export system
// @changelog
//   10.2.0-MIGRATION-PHASE6: Initial creation — FASE 6 C.6
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../../config/feature-flags.js';
import { toCSV, downloadCSV, DEFAULT_COLUMNS as CSV_COLUMNS } from './csv.js';
import { exportPDF, exportSingleItemPDF } from './pdf.js';
import { exportXLSX, exportMultiSheetXLSX } from './xlsx.js';

export const VERSION = '10.2.0-MIGRATION-PHASE6';
export const MODULE_ID = 'panel-nav-admin.data.export';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
export function injectPorts(p: unknown) { return Ports.inject(p); }

const _log = (level: string, ...args: unknown[]) => {
  const logger = Ports.get('logger');
  if (!logger) return;
  const prefix = '[ExportOrchestrator]';
  if (level === 'error') logger.error?.(prefix, ...args);
  else if (level === 'debug') logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};

/**
 * Available export formats.
 * @type {Object}
 */
export const EXPORT_FORMATS = Object.freeze({
  JSON: 'json',
  CSV: 'csv',
  PDF: 'pdf',
  XLSX: 'xlsx'
});

/**
 * Unified export dispatcher.
 * Routes to the appropriate export module based on format.
 *
 * @param {string} format — One of EXPORT_FORMATS values
 * @param {Array<Object>} data — Items to export
 * @param {Object} [options]
 * @param {string} [options.filename] — Custom filename (without extension)
 * @param {Array} [options.columns] — Custom column config
 * @param {string} [options.title] — PDF report title
 * @param {Object} [options.multiSheet] — For XLSX multi-sheet: {sheetName: items[]}
 * @returns {Promise<void>}
 */
export async function exportAs(format: string, data: Record<string, unknown>[], options: Record<string, unknown> = {}) {
  if (!data || !Array.isArray(data)) {
    _log('error', 'Invalid data for export');
    return;
  }

  _log('info', `Exporting ${data.length} items as ${format}`);

  switch (format) {
    case EXPORT_FORMATS.JSON:
      _exportJSON(data, options.filename);
      break;

    case EXPORT_FORMATS.CSV:
      if (!isEnabled('exportCSV')) {
        _log('warn', 'CSV export disabled by feature flag');
        return;
      }
      // @ts-expect-error strict migration — TS2345
      downloadCSV(data, options.columns as typeof import('./csv.js').DEFAULT_COLUMNS, options.filename as string);
      break;

    case EXPORT_FORMATS.PDF:
      if (!isEnabled('exportPDF')) {
        _log('warn', 'PDF export disabled by feature flag');
        return;
      }
      await exportPDF(data, options);
      break;

    case EXPORT_FORMATS.XLSX:
      if (!isEnabled('exportXLSX')) {
        _log('warn', 'XLSX export disabled by feature flag');
        return;
      }
      if (options.multiSheet) {
        await exportMultiSheetXLSX(options.multiSheet as Record<string, Record<string, unknown>[]>, options);
      } else {
        await exportXLSX(data, options);
      }
      break;

    default:
      _log('error', 'Unknown export format:', format);
  }
}

/**
 * Export data as JSON (existing capability — always available).
 * @private
 * @param {Array<Object>} data
 * @param {string} [filename]
 */
function _exportJSON(data: Record<string, unknown>[], filename: unknown) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = String(filename || `nav-admin-export_${_dateStamp()}`) + '.json';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }, 100);
}

/**
 * Get list of available export formats based on feature flags.
 * @returns {Array<{id: string, label: string, enabled: boolean}>}
 */
export function getAvailableFormats() {
  return [
    { id: 'json', label: 'JSON', enabled: true },
    { id: 'csv', label: 'CSV', enabled: isEnabled('exportCSV') },
    { id: 'pdf', label: 'PDF', enabled: isEnabled('exportPDF') },
    { id: 'xlsx', label: 'Excel (XLSX)', enabled: isEnabled('exportXLSX') }
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

// Re-export sub-modules
export { toCSV, downloadCSV } from './csv.js';
export { exportPDF, exportSingleItemPDF } from './pdf.js';
export { exportXLSX, exportMultiSheetXLSX } from './xlsx.js';

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
  exportAs, getAvailableFormats, EXPORT_FORMATS,
  toCSV, downloadCSV, exportPDF, exportSingleItemPDF, exportXLSX, exportMultiSheetXLSX,
  injectPorts, info, healthCheck, VERSION, MODULE_ID
};
