// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.9.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.core.lifecycle
// PURPOSE: Footer Lifecycle Manager - Mount/unmount orchestration
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract FOOTER_LIFECYCLE - FooterLifecycle() constructor
// @contract MOUNT - mount() mounts footer to container
// @contract UNMOUNT - unmount() unmounts footer
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   FooterLifecycle() — exported constructor
//   lifecycle — exported singleton instance
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v6.9.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v6.8.1-ENTERPRISE: ES5 conversion (Object.values → for loop in healthCheck)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '6.9.0-P2-ENTERPRISE';
const MODULE_ID = 'footer.core.lifecycle';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; }
  if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' '));
};

const _metrics = { mountAttempts: 0, mountSuccess: 0, mountFailures: 0, unmountCount: 0, lastMountAt: (null as unknown|null), lastUnmountAt: (null as unknown|null) };

export function FooterLifecycle(this: any) {
  this._mounted = false;
  this._mounting = false;
  this._container = null;
  this._containerId = null;
  this._abortController = null;
  this._cleanupFns = [];
}

FooterLifecycle.prototype.mount = function(containerSelector: string) {
  const self = this;
  if (this._mounted || this._mounting) {
    _log('warn', 'Já montado ou montando');
    return Promise.resolve({ success: false, reason: 'already-mounted', container: this._container, containerId: this._containerId, source: 'lifecycle' });
  }
  _initPorts();
  _metrics.mountAttempts++;
  this._mounting = true;
  return Promise.resolve().then(() => {
    self._container = typeof containerSelector === 'string' ? document.querySelector(containerSelector) : containerSelector;
    if (!self._container) {
      const fallbacks = ['#shell-footer-region', '#footer-region', '[data-region="footer"]', 'footer'];
      for (let i = 0; i < fallbacks.length; i++) {
        self._container = document.querySelector(fallbacks[i]);
        if (self._container) break;
      }
    }
    if (!self._container) {
      _log('error', 'Container não encontrado');
      _metrics.mountFailures++;
      self._mounting = false;
      return { success: false, reason: 'container-not-found', container: (null as HTMLElement|null|null), containerId: (null as string|null), source: 'lifecycle' };
    }
    self._abortController = new AbortController();
    self._mounted = true;
    self._mounting = false;
    self._containerId = self._container.id || 'footer-root';
    _metrics.mountSuccess++;
    _metrics.lastMountAt = Date.now();
    _log('info', `Footer montado containerId=${self._containerId}`);
    return { success: true, reason: (null as string|null), container: self._container, containerId: self._containerId, source: 'lifecycle' };
  }).catch(error => {
    _log('error', 'Erro ao montar:', error);
    _metrics.mountFailures++;
    self._mounting = false;
    return { success: false, reason: error.message || 'mount-error', container: (null as HTMLElement|null|null), containerId: (null as string|null), source: 'lifecycle' };
  });
};

FooterLifecycle.prototype.unmount = function() {
  if (!this._mounted) return Promise.resolve({ success: false, reason: 'not-mounted' });
  try {
    for (let i = 0; i < this._cleanupFns.length; i++) { try { this._cleanupFns[i](); } catch (e) {} }
    this._cleanupFns = [];
    if (this._abortController) { this._abortController.abort(); this._abortController = null; }
    this._mounted = false;
    this._container = null;
    this._containerId = null;
    _metrics.unmountCount++;
    _metrics.lastUnmountAt = Date.now();
    _log('info', 'Footer desmontado');
    return Promise.resolve({ success: true, reason: null });
  } catch (error: any) {
    _log('error', 'Erro ao desmontar:', error);
    return Promise.resolve({ success: false, reason: error.message || 'unmount-error' });
  }
};

FooterLifecycle.prototype.registerCleanup = function(fn: Function) { if (typeof fn === 'function') this._cleanupFns.push(fn); };
FooterLifecycle.prototype.isMounted = function() { return this._mounted; };
FooterLifecycle.prototype.getContainer = function() { return this._container; };
FooterLifecycle.prototype.getSignal = function() { return this._abortController ? this._abortController.signal : null; };
FooterLifecycle.prototype.getMetrics = () => Object.assign({}, _metrics);
FooterLifecycle.prototype.setDebug = (enabled: boolean) => { };

FooterLifecycle.prototype.getStatus = function() {
  const portsSnapshot = Ports.snapshot();
  return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, mounting: this._mounting, hasContainer: !!this._container, containerId: this._containerId, metrics: this.getMetrics(), portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
};

FooterLifecycle.prototype.info = function() { return Object.assign({}, this.getStatus(), { healthCheck: this.healthCheck() }); };

FooterLifecycle.prototype.healthCheck = function() {
  const portsSnapshot = Ports.snapshot();
  const checks = { mounted: this._mounted, hasContainer: !!this._container, notMounting: !this._mounting, noFailures: _metrics.mountFailures === 0, portsInitialized: portsSnapshot._initialized };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string,unknown>)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  return { status: passed === total ? 'HEALTHY' : (passed >= 2 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: _metrics, version: VERSION, moduleId: MODULE_ID, portsInitialized: portsSnapshot._initialized, timestamp: Date.now() };
};

export const lifecycle = (new (FooterLifecycle as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
export { VERSION, MODULE_ID };
export default FooterLifecycle;
