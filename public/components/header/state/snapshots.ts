// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.4.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/state/snapshots
// PURPOSE: State snapshot history and rollback management
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   StateSnapshots (class) — snapshot capture, rollback, history
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
// ═══════════════════════════════════════════════════════════════
// State Snapshots - History and Rollback Enterprise AAA
// @version 5.4.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.4.0-P17WI';
export const MODULE_ID = 'header/state/snapshots';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { logger.error?.(prefix, ...args); return; }
  if (level === 'warn') { logger.warn?.(prefix, ...args); return; }
  if (level === 'info') { logger.info?.(prefix, ...args); return; }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};

export class StateSnapshots {
  [key: string]: any;
  constructor(maxSnapshots = 10) { this.snapshots = []; this.maxSnapshots = maxSnapshots; this._debug = false; this._metrics = { captureCount: 0, rollbackCount: 0, lastCaptureAt: null }; }

  capture(state: Record<string,unknown>) {
    this._metrics.captureCount++; this._metrics.lastCaptureAt = Date.now();
    const snapshot = { state: JSON.parse(JSON.stringify(state)), timestamp: Date.now() };
    this.snapshots.push(snapshot);
    if (this.snapshots.length > this.maxSnapshots) this.snapshots.shift();
    _log('debug', `Snapshot capturado (${this.snapshots.length}/${this.maxSnapshots})`);
    return snapshot;
  }

  getLatest() { if (this.snapshots.length === 0) return null; return this.snapshots[this.snapshots.length - 1]; }
  getAll() { return [...this.snapshots]; }

  rollback(index = -1) {
    if (this.snapshots.length === 0) { _log('error', 'Nenhum snapshot disponível para rollback'); throw new Error('Nenhum snapshot disponível para rollback'); }
    const targetIndex = index < 0 ? this.snapshots.length + index : index;
    if (targetIndex < 0 || targetIndex >= this.snapshots.length) { _log('error', `Índice de snapshot inválido: ${index}`); throw new RangeError(`Índice de snapshot inválido: ${index}`); }
    this._metrics.rollbackCount++;
    _log('info', `Rollback para snapshot ${targetIndex}`);
    return this.snapshots[targetIndex].state;
  }

  clear() { this.snapshots = []; _log('info', 'Snapshots limpos'); }
  getCount() { return this.snapshots.length; }
  getMetrics() { return { ...this._metrics, snapshotCount: this.snapshots.length }; }
  resetMetrics() { this._metrics = { captureCount: 0, rollbackCount: 0, lastCaptureAt: null }; }

  healthCheck() {
    const logger = _getPort('logger');
    const checks = { belowLimit: this.snapshots.length <= this.maxSnapshots, loggerAvailable: !!logger };
    const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), snapshotCount: this.snapshots.length, maxSnapshots: this.maxSnapshots, timestamp: new Date().toISOString() };
  }

  info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), snapshotCount: this.snapshots.length, maxSnapshots: this.maxSnapshots, metrics: this.getMetrics(), healthCheck: this.healthCheck() }; }
  setDebug(enabled: boolean) { this._debug = !!enabled; }
}

export function getVersion() { return VERSION; }
export default StateSnapshots;
