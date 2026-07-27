// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.5.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/ui/ripple
// PURPOSE: Click ripple effect manager for header buttons
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   RippleManager(logger) — constructor for ripple effect manager
//   injectPorts(p) — inject runtime ports
//   getPorts() — snapshot of current ports
//   getVersion() — returns VERSION
// ═══════════════════════════════════════════════════════════════
// Header - Ripple Effect Manager Enterprise AAA
// @version 2.5.0-ES6
// @changelog v2.5.0-ES6 - Task 10.1 B04: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
export const VERSION = '2.5.0-ES6';
export const MODULE_ID = 'header/ui/ripple';
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }
const _debugEnabled = () => { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; } if (level === 'info') { if (logger.info) logger.info.apply(logger, [prefix].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [prefix].concat(args)); };

export function RippleManager(this: any, logger: Record<string,unknown>) {
  const self = this;
  // @ts-expect-error strict migration — TS2345
  this.logger = logger || { debug() { _log.apply(null, ['debug'].concat(Array.prototype.slice.call(arguments))); }, info() { _log.apply(null, ['info'].concat(Array.prototype.slice.call(arguments))); }, warn() { _log.apply(null, ['warn'].concat(Array.prototype.slice.call(arguments))); }, error() { _log.apply(null, ['error'].concat(Array.prototype.slice.call(arguments))); } };
  this._isMounted = false; this._isDestroyed = false; this.clickHandlers = new Map(); this._metrics = { mountCount: 0, unmountCount: 0, ripplesCreated: 0, buttonsRegistered: 0, lastRippleAt: null };
}

RippleManager.prototype.mount = function() {
  const self = this;

  // @ts-expect-error TS migration - TS2554
  if (this._isDestroyed) { _log('warn', 'RippleManager destruido - mount ignorado'); return; }

  // @ts-expect-error TS migration - TS2554
  if (this._isMounted) { _log('warn', 'RippleManager ja montado'); return; }
  this._metrics.mountCount++;
  const selectors = ['.status-icon', '.info-icon', '.header-action-btn', '.header-user-menu'];
  const buttons = document.querySelectorAll(selectors.join(', '));
  buttons.forEach(button => { const handler = (e: Event) => { self.createRipple(e, button); }; button.addEventListener('click', handler); self.clickHandlers.set(button, handler); });
  this._metrics.buttonsRegistered = buttons.length; this._isMounted = true;

  // @ts-expect-error TS migration - TS2554
  _log('info', `Ripple montado em ${buttons.length} botoes`);
};

RippleManager.prototype.createRipple = function(event: string, button: unknown) {
  if (this._isDestroyed) return;
  // @ts-expect-error TS migration - TS2339
  if (button.disabled || button.classList.contains('info-icon--loading')) return;
  // @ts-expect-error TS migration - TS2339
  const oldRipples = button.querySelectorAll('.header-ripple');
  // @ts-expect-error TS migration - TS2339
  oldRipples.forEach((r: unknown) => { r.remove(); });
  const ripple = document.createElement('span');
  ripple.className = 'header-ripple'; ripple.style.pointerEvents = 'none';
  // @ts-expect-error TS migration - TS2339
  const rect = button.getBoundingClientRect();
  const size = Math.max(rect.width, rect.height);
  // @ts-expect-error TS migration - TS2339
  const x = event.clientX - rect.left - size / 2;
  // @ts-expect-error TS migration - TS2339
  const y = event.clientY - rect.top - size / 2;
  ripple.style.width = ripple.style.height = `${size}px`;
  ripple.style.left = `${x}px`; ripple.style.top = `${y}px`;
  // @ts-expect-error TS migration - TS2339
  button.appendChild(ripple);
  this._metrics.ripplesCreated++; this._metrics.lastRippleAt = Date.now();
  setTimeout(() => { if (ripple.parentNode) ripple.remove(); }, 600);
};

RippleManager.prototype.unmount = function() {
  const self = this;

  // @ts-expect-error TS migration - TS2554
  if (!this._isMounted) { _log('warn', 'RippleManager nao esta montado'); return; }
  this._metrics.unmountCount++;
  // @ts-expect-error TS migration - TS2339
  this.clickHandlers.forEach((handler: Function, button: unknown) => { button.removeEventListener('click', handler); });
  this.clickHandlers.clear(); this.cleanup(); this._isMounted = false;

  // @ts-expect-error TS migration - TS2554
  _log('info', 'Ripple desmontado');
};

RippleManager.prototype.cleanup = () => { let count = 0; document.querySelectorAll('.header-ripple').forEach(r => { r.remove(); count++; }); return count; };

RippleManager.prototype.getMetrics = function() { return { mountCount: this._metrics.mountCount, unmountCount: this._metrics.unmountCount, ripplesCreated: this._metrics.ripplesCreated, buttonsRegistered: this._metrics.buttonsRegistered, lastRippleAt: this._metrics.lastRippleAt, isMounted: this._isMounted, isDestroyed: this._isDestroyed, activeHandlers: this.clickHandlers.size }; };
RippleManager.prototype.resetMetrics = function() { this._metrics = { mountCount: 0, unmountCount: 0, ripplesCreated: 0, buttonsRegistered: 0, lastRippleAt: null }; };

RippleManager.prototype.healthCheck = function() {
  const logger = _getPort('logger');
  const checks = { notDestroyed: !this._isDestroyed, hasHandlers: this._isMounted ? this.clickHandlers.size > 0 : true, loggerAvailable: !!logger, noLeakedRipples: document.querySelectorAll('.header-ripple').length < 50 };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
};

RippleManager.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, isMounted: this._isMounted, portsInitialized: Ports.isInitialized(), metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };
RippleManager.prototype.setDebug = function(enabled: boolean) { this._debug = !!enabled; };
RippleManager.prototype.destroy = function() { if (this._isMounted) this.unmount(); this._isDestroyed = true; };

export function getVersion() { return VERSION; }
export default RippleManager;
