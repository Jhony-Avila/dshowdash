// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/tooltips
// PURPOSE: Tooltips manager with mount/unmount lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   TooltipsManager(config, logger) — constructor for tooltips manager
//   injectPorts(p) — inject runtime ports
//   getPorts() — snapshot of current ports
//   getVersion() — returns VERSION
// ═══════════════════════════════════════════════════════════════
// Header - Tooltips Manager Enterprise AAA
// @version 2.4.0-ES6
// @changelog v2.4.0-ES6 - Task 10.1 B04: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '2.4.0-ES6';
export const MODULE_ID = 'header/ui/tooltips';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; };
const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; }
  if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; }
  if (level === 'info') { if (logger.info) logger.info.apply(logger, [prefix].concat(args)); return; }
  if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
};

export function TooltipsManager(this: any, config: Record<string,unknown>, logger: Record<string,unknown>) {
  this.config = config; this.logger = logger; this._debug = false;
  this._metrics = { mountCount: 0, unmountCount: 0, lastMountAt: null };
  this._isMounted = false; this._isDestroyed = false;
}

TooltipsManager.prototype.mount = function() {

  // @ts-expect-error TS migration - TS2554
  if (this._isDestroyed) { _log('warn', 'TooltipsManager destruido - mount ignorado'); return; }

  // @ts-expect-error TS migration - TS2554
  if (this._isMounted) { _log('warn', 'TooltipsManager ja montado'); return; }
  this._metrics.mountCount++; this._metrics.lastMountAt = Date.now(); this._isMounted = true;

  // @ts-expect-error TS migration - TS2554
  _log('info', 'Tooltips manager montado');
};

TooltipsManager.prototype.unmount = function() {

  // @ts-expect-error TS migration - TS2554
  if (!this._isMounted) { _log('warn', 'TooltipsManager nao esta montado'); return; }
  this._metrics.unmountCount++; this._isMounted = false;

  // @ts-expect-error TS migration - TS2554
  _log('info', 'Tooltips manager desmontado');
};

TooltipsManager.prototype.getMetrics = function() { return { mountCount: this._metrics.mountCount, unmountCount: this._metrics.unmountCount, lastMountAt: this._metrics.lastMountAt, isMounted: this._isMounted, isDestroyed: this._isDestroyed }; };
TooltipsManager.prototype.resetMetrics = function() { this._metrics = { mountCount: 0, unmountCount: 0, lastMountAt: null }; };

TooltipsManager.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this._isDestroyed, hasConfig: !!this.config };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
};

TooltipsManager.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, isMounted: this._isMounted, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };
TooltipsManager.prototype.setDebug = function(enabled: boolean) { this._debug = !!enabled; };
TooltipsManager.prototype.destroy = function() { if (this._isMounted) this.unmount(); this._isDestroyed = true; };

export function getVersion() { return VERSION; }
export default TooltipsManager;
