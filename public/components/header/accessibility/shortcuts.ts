// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.4.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/accessibility/shortcuts
// PURPOSE: Keyboard shortcuts for header (refresh, fullscreen)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   KeyboardShortcuts (constructor) — mount/unmount keyboard event listeners
//   getVersion() — returns module version
//   injectPorts() / getPorts() — port dependency injection
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header - Keyboard Shortcuts Enterprise AAA
// @version 2.4.0-ES6
// @changelog v2.4.0-ES6 - Task 10.1 B04: var → const/let
// P17WI: PortsFactory/PortsProfiles pattern
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '2.4.0-ES6';
const MODULE_ID = 'header.accessibility.shortcuts';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _debugEnabled() { const config = _getPort('config'); return config && config.app && config.app.debug; }
function _log(level: string, msg: string) { const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, msg); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, msg); return; } if (level === 'info') { if (logger.info) logger.info(prefix, msg); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, msg); }

function KeyboardShortcuts(this: any, config: Record<string,unknown>, refreshCoordinator: Record<string,unknown>, fullscreenManager: Record<string,unknown>, logger: Record<string,unknown>) {
  this.config = config;
  this.refreshCoordinator = refreshCoordinator;
  this.fullscreenManager = fullscreenManager;
  this.logger = logger;
  this._onKeyDown = this.onKeyDown.bind(this);
  this._debug = false;
  this._metrics = { mountCount: 0, keyEvents: 0, refreshTriggered: 0, fullscreenTriggered: 0, lastKeyAt: null };
  this._isMounted = false;
  this._isDestroyed = false;
}

KeyboardShortcuts.prototype.mount = function() {
  if (this._isDestroyed) { _log('warn', 'KeyboardShortcuts destruido - mount ignorado'); return; }
  if (this._isMounted) { _log('warn', 'KeyboardShortcuts ja montado'); return; }
  if (!this.config || !this.config.accessibility || !this.config.accessibility.keyboardShortcutsEnabled) { _log('info', 'Keyboard shortcuts desabilitado via config'); return; }
  this._metrics.mountCount++;
  document.addEventListener('keydown', this._onKeyDown);
  this._isMounted = true;
  _log('info', 'Keyboard shortcuts montado');
};

KeyboardShortcuts.prototype.onKeyDown = function(e: KeyboardEvent) {
  if (this._isDestroyed) return;
  const target = e.target;
  // @ts-expect-error TS migration - TS2339
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable || e.ctrlKey || e.metaKey) return;
  this._metrics.keyEvents++;
  this._metrics.lastKeyAt = Date.now();
  if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this._metrics.refreshTriggered++; if (this.refreshCoordinator && this.refreshCoordinator.request) this.refreshCoordinator.request(); _log('debug', 'Refresh triggered via keyboard'); }
  else if (e.key === 'f' || e.key === 'F') { e.preventDefault(); this._metrics.fullscreenTriggered++; if (this.fullscreenManager && this.fullscreenManager.onClick) this.fullscreenManager.onClick({ preventDefault() {} }); _log('debug', 'Fullscreen triggered via keyboard'); }
};

KeyboardShortcuts.prototype.unmount = function() { if (!this._isMounted) { _log('warn', 'KeyboardShortcuts nao esta montado'); return; } document.removeEventListener('keydown', this._onKeyDown); this._isMounted = false; _log('info', 'Keyboard shortcuts desmontado'); };
KeyboardShortcuts.prototype.getMetrics = function() { return Object.assign({}, this._metrics, { isMounted: this._isMounted, isDestroyed: this._isDestroyed }); };
KeyboardShortcuts.prototype.resetMetrics = function() { this._metrics = { mountCount: 0, keyEvents: 0, refreshTriggered: 0, fullscreenTriggered: 0, lastKeyAt: null }; };
KeyboardShortcuts.prototype.healthCheck = function() { const checks = { notDestroyed: !this._isDestroyed, hasConfig: !!this.config }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; };
KeyboardShortcuts.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), isMounted: this._isMounted, metrics: this.getMetrics(), healthCheck: this.healthCheck() }; };
KeyboardShortcuts.prototype.setDebug = function(enabled: boolean) { this._debug = !!enabled; };
KeyboardShortcuts.prototype.destroy = function() { if (this._isMounted) this.unmount(); this._isDestroyed = true; };

function getVersion() { return VERSION; }

export { KeyboardShortcuts, VERSION, MODULE_ID, getVersion, injectPorts, getPorts };
export default KeyboardShortcuts;
