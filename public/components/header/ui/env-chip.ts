// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/env-chip
// PURPOSE: Environment chip UI component (mount, update, destroy lifecycle)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   DOMHelpers from ../utils/dom.js
// PROVIDES:
//   EnvChipUI(elements, store, logger) — constructor for env chip component
//   injectPorts(p) — inject runtime ports
//   getPorts() — snapshot of current ports
//   getVersion() — returns VERSION
// ═══════════════════════════════════════════════════════════════
// Header - Environment Chip UI Enterprise AAA
// @version 2.4.0-ES6
// @changelog v2.4.0-ES6 - Task 10.1 B04: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { DOMHelpers } from '../utils/dom.js';

export const VERSION = '2.4.0-ES6';
export const MODULE_ID = 'header/ui/env-chip';

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

export function EnvChipUI(this: any, elements: Record<string,unknown>, store: Record<string,unknown>, logger: Record<string,unknown>) {
  this.elements = elements; this.store = store; this.logger = logger;
  this._debug = false; this._metrics = { mountCount: 0, updateCount: 0, lastUpdateAt: null };
  this._isMounted = false; this._isDestroyed = false; this._currentEnv = null;
}

EnvChipUI.prototype.mount = function() {

  // @ts-expect-error TS migration - TS2554
  if (this._isDestroyed) { _log('warn', 'EnvChipUI destruido - mount ignorado'); return; }

  // @ts-expect-error TS migration - TS2554
  if (this._isMounted) { _log('warn', 'EnvChipUI ja montado'); return; }
  this._metrics.mountCount++;
  const state = this.store.getState();
  this.update(state.environment);
  this._isMounted = true;

  // @ts-expect-error TS migration - TS2554
  _log('info', 'Env chip UI montado');
};

EnvChipUI.prototype.update = function(environment: string) {
  if (this._isDestroyed) return;
  const chip = this.elements.envChip;
  if (!chip) return;
  this._metrics.updateCount++; this._metrics.lastUpdateAt = Date.now(); this._currentEnv = environment;
  DOMHelpers.setAttributes(chip, { 'data-env': environment, 'aria-label': environment ? `Ambiente de ${environment.toLowerCase()}` : 'Ambiente' });
  chip.textContent = environment || 'PROD';

  // @ts-expect-error TS migration - TS2554
  _log('debug', 'Env chip atualizado:', environment);
};

EnvChipUI.prototype.getMetrics = function() { return { mountCount: this._metrics.mountCount, updateCount: this._metrics.updateCount, lastUpdateAt: this._metrics.lastUpdateAt, currentEnv: this._currentEnv, isMounted: this._isMounted, isDestroyed: this._isDestroyed }; };
EnvChipUI.prototype.resetMetrics = function() { this._metrics = { mountCount: 0, updateCount: 0, lastUpdateAt: null }; };

EnvChipUI.prototype.healthCheck = function() {
  const checks = { notDestroyed: !this._isDestroyed, hasElements: !!this.elements, hasStore: !!this.store, hasEnvChip: !!(this.elements && this.elements.envChip) || !this._isMounted };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, currentEnv: this._currentEnv, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
};

EnvChipUI.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, currentEnv: this._currentEnv, isMounted: this._isMounted, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };
EnvChipUI.prototype.setDebug = function(enabled: boolean) { this._debug = !!enabled; };
EnvChipUI.prototype.destroy = function() { this._isDestroyed = true; this._isMounted = false; };

export function getVersion() { return VERSION; }
export default EnvChipUI;
