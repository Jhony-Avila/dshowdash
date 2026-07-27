/**
 * @file Config Exporter — State Management
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/config-exporter/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides _state, _config, getMetrics, incrementMetric
 * 
 * @description
 * State management for config exporter including metrics tracking.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.config-exporter.state';

export const _state = {
  lastExport: null as DynObj,
  lastImport: null as DynObj
};

export const _config = {
  includeTimestamp: true,
  includeVersion: true,
  compressionEnabled: false,
  maxUrlLength: 2000,
  encryptionKey: null as DynObj
};

const _metrics = {
  exports: 0,
  imports: 0,
  exportErrors: 0,
  importErrors: 0
};

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function incrementMetric(name: string) {
  if ((_metrics as DynObj)[name] !== undefined) {
    (_metrics as DynObj)[name]++;
  }
}
