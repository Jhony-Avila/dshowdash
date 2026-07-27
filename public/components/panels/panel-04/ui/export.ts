// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.1-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04.ui.export
// PURPOSE: Panel-04 UI - Export Functions
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   ALERT_TYPES from ../core/constants.js
//   downloadFile from ./helpers.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   exportCSV() — exported function
//   exportJSON() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { ALERT_TYPES } from '../core/constants.js';

// @ts-expect-error TS migration - TS2614
import { downloadFile } from './helpers.js';

export const MODULE_ID = 'panel-04.ui.export';
export const VERSION = '9.3.0-P2-ENTERPRISE';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debug = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debug() && logger.debug) logger.debug(prefix, args.join(' ')); };

export function exportCSV(data: Record<string, unknown>[], currentPeriod: string) {
  _initPorts();
  if (!data || !data.length) { showNotification('Nenhum dado para exportar', 'warning'); return false; }
  try {
    const headers = ['ID', 'Tipo', 'Severidade', 'Job', 'Mensagem', 'Data/Hora'];
    const rows = data.map((d: Record<string, unknown>) => { const alertConfig = (ALERT_TYPES as Record<string, Record<string, unknown>>)[d.type as string] || {}; return [d.id || '', d.type || '', alertConfig.label || d.type || '', escapeCSV(String(d.job_name || '')), escapeCSV(String(d.message || '')), d.created_at || '']; });
    const BOM = '\uFEFF';
    const csv = BOM + [headers.join(';'), rows.map(r => r.join(';')).join('\r\n')].join('\r\n');
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `incidentes_${currentPeriod}_${timestamp}.csv`;
    const success = downloadFile(csv, filename, 'text/csv;charset=utf-8');
    if (success) showNotification(`Exportado: ${data.length} registros`, 'success');
    return success;

  // @ts-expect-error TS migration - TS2554
  } catch (error) { _log('error', 'Export CSV error:', error.message); showNotification('Erro ao exportar CSV', 'error'); return false; }
}

export function exportJSON(data: Record<string, unknown>[], currentPeriod: string) {
  _initPorts();
  if (!data || !data.length) { showNotification('Nenhum dado para exportar', 'warning'); return false; }
  try {
    const exportData = { metadata: { period: currentPeriod, exported: new Date().toISOString(), totalRecords: data.length, version: VERSION }, summary: generateSummary(data), data: data.map((d: Record<string, unknown>) => ({
      id: d.id,
      type: d.type,
      severity: ((ALERT_TYPES as Record<string, Record<string, unknown>>)[d.type as string] || {}).label || d.type,
      job_name: d.job_name,
      message: d.message,
      created_at: d.created_at
    })) };
    const json = JSON.stringify(exportData, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `incidentes_${currentPeriod}_${timestamp}.json`;
    const success = downloadFile(json, filename, 'application/json');
    if (success) showNotification(`Exportado: ${data.length} registros`, 'success');
    return success;

  // @ts-expect-error TS migration - TS2554
  } catch (error) { _log('error', 'Export JSON error:', error.message); showNotification('Erro ao exportar JSON', 'error'); return false; }
}

function escapeCSV(value: string) { if (value == null) return ''; const str = String(value); if (str.indexOf('"') !== -1 || str.indexOf(';') !== -1 || str.indexOf('\n') !== -1 || str.indexOf('\r') !== -1) return `"${str.replace(/"/g, '""')}"`; return str; }

// @ts-expect-error TS migration - TS2322
function generateSummary(data) { const summary = { total: data.length, critical: 0, high: 0, medium: 0, low: 0, unique_jobs: new Set() }; data.forEach(d => { if (d.type === 'alert-critical') summary.critical++; else if (d.type === 'alert-high') summary.high++; else if (d.type === 'alert-medium') summary.medium++; else if (d.type === 'alert-low') summary.low++; if (d.job_name) summary.unique_jobs.add(d.job_name); }); summary.unique_jobs = summary.unique_jobs.size; return summary; }

// @ts-expect-error TS migration - TS2554
function showNotification(message, type) { type = type || 'info'; const toast = _getPort('toast'); if (toast && toast.show) { toast.show(message, type); return; } if (type === 'error') _log('error', message); else if (type === 'warning') _log('warn', message); else _log('info', message); }

export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, formats: ['csv', 'json'], portsInitialized: Ports.isInitialized() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized() }; }
export default { exportCSV, exportJSON, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
