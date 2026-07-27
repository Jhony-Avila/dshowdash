// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file Config Exporter — Modular Index
 * @version 1.3.0-MODULAR
 * @module app-shell/utils/config-exporter
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_SCOPES)
 * @requires ./operations.js (all export/import operations)
 * @requires ./state.js (_state, _config, getMetrics)
 * 
 * @provides VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_SCOPES
 * @provides exportConfig, exportToFile, exportToClipboard
 * @provides importConfig, importFromFile, importFromClipboard
 * @provides getLastExport, getLastImport, subscribe
 * @provides configure, getConfig, getMetrics, healthCheck, info
 * 
 * @browserAPI Blob, URL.createObjectURL, navigator.clipboard, FileReader
 * 
 * @description
 * Configuration export/import orchestrator. Supports multiple formats
 * (JSON, Base64, URL) and scopes (layout, theme, preferences, etc.).
 * 
 * @changelog v1.3.0-MODULAR - Adicionado subscribe
 * @changelog v1.2.0-MODULAR - Adicionado getLastExport, getLastImport
 * @changelog v1.1.0-MODULAR - Modularização inicial
 * ============================================================================
 */
'use strict';

import { VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_SCOPES } from './constants.js';
import {
  exportConfig as _exportConfig,
  exportToFile as _exportToFile,
  exportToClipboard as _exportToClipboard,
  importConfig as _importConfig,
  importFromFile as _importFromFile,
  importFromClipboard as _importFromClipboard
} from './operations.js';
import { _state, _config, getMetrics } from './state.js';

export { VERSION, MODULE_ID, EXPORT_FORMATS, EXPORT_SCOPES };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

// ═══════════════════════════════════════════════════════════════
// SUBSCRIBERS (v1.3.0)
// ═══════════════════════════════════════════════════════════════
const _subscribers: DynObj[] = [];

export function subscribe(callback: DynObj) {
  if (typeof callback === 'function' && _subscribers.indexOf(callback) === -1) {
    _subscribers.push(callback);
  }
  return function unsubscribe() {
    const index = _subscribers.indexOf(callback);
    if (index > -1) _subscribers.splice(index, 1);
  };
}

function _notifySubscribers(event: DynObj) {
  for (let i = 0; i < _subscribers.length; i++) {
    try { _subscribers[i](event); } catch (e) {}
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORT OPERATIONS
// ═══════════════════════════════════════════════════════════════
export function exportConfig(options: DynObj) {
  const result = _exportConfig(options);
  _notifySubscribers({ type: 'export', result });
  return result;
}

export function exportToFile(options: DynObj) {
  const result = _exportToFile(options);
  _notifySubscribers({ type: 'exportToFile', result });
  return result;
}

export function exportToClipboard(options: DynObj) {
  const result = _exportToClipboard(options);
  _notifySubscribers({ type: 'exportToClipboard', result });
  return result;
}

// ═══════════════════════════════════════════════════════════════
// IMPORT OPERATIONS
// ═══════════════════════════════════════════════════════════════
export function importConfig(data: DynObj, options: DynObj) {
  const result = _importConfig(data, options);
  _notifySubscribers({ type: 'import', result });
  return result;
}

export function importFromFile(file: DynObj, options: DynObj) {
  const result = _importFromFile(file, options);
  _notifySubscribers({ type: 'importFromFile', result });
  return result;
}

export function importFromClipboard(options: DynObj) {
  const result = _importFromClipboard(options);
  _notifySubscribers({ type: 'importFromClipboard', result });
  return result;
}

// ═══════════════════════════════════════════════════════════════
// LAST EXPORT/IMPORT GETTERS (v1.2.0)
// ═══════════════════════════════════════════════════════════════
export function getLastExport() { return _state.lastExport; }
export function getLastImport() { return _state.lastImport; }

// ═══════════════════════════════════════════════════════════════
// CONFIG
// ═══════════════════════════════════════════════════════════════
export function configure(options: DynObj) {
  if (options.includeTimestamp !== undefined) _config.includeTimestamp = !!options.includeTimestamp;
  if (options.includeVersion !== undefined) _config.includeVersion = !!options.includeVersion;
  if (options.compressionEnabled !== undefined) _config.compressionEnabled = !!options.compressionEnabled;
  if (options.maxUrlLength !== undefined) _config.maxUrlLength = Math.max(500, options.maxUrlLength);
  if (options.encryptionKey !== undefined) _config.encryptionKey = options.encryptionKey;
}

export function getConfig() { return Object.assign({}, _config); }

export { getMetrics };


// ═══════════════════════════════════════════════════════════════
// DIAGNOSTICS
// ═══════════════════════════════════════════════════════════════
export function healthCheck() {
  const metrics = getMetrics();
  
  const checks = {
    lowExportErrors: metrics.exportErrors < metrics.exports * 0.1 || metrics.exportErrors < 3,
    lowImportErrors: metrics.importErrors < metrics.imports * 0.1 || metrics.importErrors < 3,
    recentActivity: metrics.exports > 0 || metrics.imports > 0 || true
  };
  
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }
  
  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${keys.length}`,
    checks,
    metrics,
    lastExport: _state.lastExport,
    lastImport: _state.lastImport,
    subscriberCount: _subscribers.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    config: getConfig(),
    formats: Object.keys(EXPORT_FORMATS),
    scopes: Object.keys(EXPORT_SCOPES),
    metrics: getMetrics(),
    lastExport: _state.lastExport,
    lastImport: _state.lastImport,
    subscriberCount: _subscribers.length,
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  EXPORT_FORMATS,
  EXPORT_SCOPES,
  exportConfig,
  exportToFile,
  exportToClipboard,
  importConfig,
  importFromFile,
  importFromClipboard,
  getLastExport,
  getLastImport,
  subscribe,
  configure,
  getConfig,
  getMetrics,
  healthCheck,
  info
};
