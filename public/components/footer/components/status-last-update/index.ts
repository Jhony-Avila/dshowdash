// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-last-update
// PURPOSE: Footer - Status Last Update
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   UPDATE_EVENTS — exported value
//   init() — exported function
//   setLastUpdate() — exported function
//   getLastUpdate() — exported function
//   getFormattedTime() — exported function
//   getTimeSince() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   FooterStatusLastUpdate() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.footer.status-last-update';
const VERSION = '2.3.0-P18EC';

const UPDATE_EVENTS = { CHANGED: 'footer:last-update:changed' };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, lastUpdate: (null as unknown|null), source: (null as string|null) };
const _metrics = { updates: 0 };

function _emit(eventName: string, data: Record<string,unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }

function setLastUpdate(timestamp: number, source: string) { _state.lastUpdate = timestamp || Date.now(); _state.source = source || 'unknown'; _metrics.updates++; _emit(UPDATE_EVENTS.CHANGED, { timestamp: _state.lastUpdate, source: _state.source }); return { ok: true, timestamp: _state.lastUpdate }; }

function getLastUpdate() { return { timestamp: _state.lastUpdate, source: _state.source }; }
// @ts-expect-error TS migration - TS2769
function getFormattedTime() { if (!_state.lastUpdate) return '--:--'; const d = new Date(_state.lastUpdate); return d.toLocaleTimeString(); }
// @ts-expect-error TS migration - TS2363
function getTimeSince() { if (!_state.lastUpdate) return null; return Date.now() - _state.lastUpdate; }

// @ts-expect-error TS migration - TS2345
function init(ctx?: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); _state.initialized = true; setLastUpdate(Date.now(), 'init'); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, hasUpdate: { ok: !!_state.lastUpdate, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, lastUpdate: _state.lastUpdate, source: _state.source, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// FooterStatusLastUpdate class for registry compatibility
function FooterStatusLastUpdate(this: any, options: Record<string,unknown>) {
  options = options || {};
  this._container = null;
  this._mounted = false;
  this._element = null;
  this._intervalId = null;
}

FooterStatusLastUpdate.prototype.mount = function(container: HTMLElement|null, config: Record<string,unknown>, integrations: Record<string,unknown>) {
  const self = this;
  if (this._mounted) return Promise.resolve();
  
  init();
  
  this._container = container;
  this._element = document.createElement('div');
  this._element.className = 'dsd-footer__last-update dsd-chip dsd-chip--sm';
  this._element.title = 'Last Update';
  this._element.innerHTML = `<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span class="dsd-footer__update-time">${getFormattedTime()}</span>`;
  
  this._container.appendChild(this._element);
  this._mounted = true;
  
  // Update every second (guard against duplicate intervals)
  if (this._intervalId) { clearInterval(this._intervalId); this._intervalId = null; }
  this._intervalId = setInterval(() => {
    const timeEl = self._element.querySelector('.dsd-footer__update-time');
    if (timeEl) timeEl.textContent = getFormattedTime();
  }, 1000);
  
  return Promise.resolve();
};

FooterStatusLastUpdate.prototype.destroy = function() {
  if (this._intervalId) {
    clearInterval(this._intervalId);
    this._intervalId = null;
  }
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};

FooterStatusLastUpdate.prototype.isLoaded = function() { return this._mounted; };
FooterStatusLastUpdate.prototype.getLastUpdate = () => getLastUpdate();
FooterStatusLastUpdate.prototype.setLastUpdate = (timestamp: number, source: string) => setLastUpdate(timestamp, source);
FooterStatusLastUpdate.prototype.getFormattedTime = () => getFormattedTime();
FooterStatusLastUpdate.prototype.healthCheck = () => healthCheck();
FooterStatusLastUpdate.prototype.info = () => info();

export { MODULE_ID, VERSION, UPDATE_EVENTS, init, setLastUpdate, getLastUpdate, getFormattedTime, getTimeSince, healthCheck, info, FooterStatusLastUpdate };
export default FooterStatusLastUpdate;
