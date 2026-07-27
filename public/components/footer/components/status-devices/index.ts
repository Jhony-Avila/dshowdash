// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-devices
// PURPOSE: Footer - Status Devices
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   DEVICES_TELEMETRY — exported value
//   init() — exported function
//   checkDevice() — exported function
//   getDeviceStatus() — exported function
//   getAllDeviceStatus() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   WebcamMicStatusComponent() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.footer.status-devices';
const VERSION = '2.3.0-P18EC';

const DEVICES_TELEMETRY = { CHECKED: 'footer:device:checked' };

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, devices: {}, permissions: {} };
const _metrics = { checks: 0, grants: 0, denials: 0 };

function _track(eventKey: string, payload: Record<string,unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

// @ts-expect-error TS migration - TS2322
function checkDevice(type: string) { _metrics.checks++; if (typeof navigator === 'undefined' || !navigator.permissions) return Promise.resolve({ ok: false, reason: 'Permissions API not available' }); return navigator.permissions.query({ name: type }).then(result => { (_state.permissions as Record<string,unknown>)[type as string] = result.state; if (result.state === 'granted') _metrics.grants++; else if (result.state === 'denied') _metrics.denials++; _track(DEVICES_TELEMETRY.CHECKED, { type, state: result.state }); return { ok: true, state: result.state }; }).catch(e => ({
  ok: false,
  error: e.message
})); }

function getDeviceStatus(type: string) { return (_state.permissions as Record<string,unknown>)[type as string] || 'unknown'; }
function getAllDeviceStatus() { return Object.assign({}, _state.permissions); }

// @ts-expect-error TS migration - TS2345
function init(ctx?: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, permissions: _state.permissions, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// WebcamMicStatusComponent class for registry compatibility
function WebcamMicStatusComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this._container = options.container || null;
  this._mounted = false;
  this._element = null;
  this._camStatus = 'unknown';
  this._micStatus = 'unknown';
}

WebcamMicStatusComponent.prototype.mount = function() {
  const self = this;
  if (this._mounted) return Promise.resolve();
  if (!this._container) return Promise.resolve();
  
  init();
  
  this._element = document.createElement('div');
  this._element.className = 'dsd-footer__devices-status';
  this._element.innerHTML = '<div class="dsd-footer__device dsd-footer__device--cam" title="Camera"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg><span class="dsd-status-dot dsd-status-dot--neutral"></span></div><div class="dsd-footer__device dsd-footer__device--mic" title="Microphone"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg><span class="dsd-status-dot dsd-status-dot--neutral"></span></div>';
  
  this._container.appendChild(this._element);
  this._mounted = true;
  
  // Check permissions
  return this._checkPermissions();
};

WebcamMicStatusComponent.prototype._checkPermissions = function() {
  const self = this;
  const promises = [];
  
  if (navigator.permissions) {
    promises.push(
      checkDevice('camera').then(result => {
        // @ts-expect-error strict migration — TS2339
        self._camStatus = result.ok ? result.state : 'error';
        self._updateDot('cam', self._camStatus);
      }).catch(() => { self._camStatus = 'error'; })
    );
    promises.push(
      checkDevice('microphone').then(result => {
        // @ts-expect-error strict migration — TS2339
        self._micStatus = result.ok ? result.state : 'error';
        self._updateDot('mic', self._micStatus);
      }).catch(() => { self._micStatus = 'error'; })
    );
  }
  
  return Promise.all(promises);
};

WebcamMicStatusComponent.prototype._updateDot = function(device: Record<string,unknown>, status: string) {
  if (!this._element) return;
  const deviceEl = this._element.querySelector(`.dsd-footer__device--${device}`);
  if (!deviceEl) return;
  const dot = deviceEl.querySelector('.dsd-status-dot');
  if (!dot) return;
  const statusClass = status === 'granted' ? 'online' : status === 'denied' ? 'offline' : status === 'prompt' ? 'warning' : 'neutral';
  dot.className = `dsd-status-dot dsd-status-dot--${statusClass}`;
};

WebcamMicStatusComponent.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};

WebcamMicStatusComponent.prototype.isLoaded = function() { return this._mounted; };
WebcamMicStatusComponent.prototype.getCameraStatus = function() { return this._camStatus; };
WebcamMicStatusComponent.prototype.getMicStatus = function() { return this._micStatus; };
WebcamMicStatusComponent.prototype.healthCheck = () => healthCheck();
WebcamMicStatusComponent.prototype.info = () => info();

export { MODULE_ID, VERSION, DEVICES_TELEMETRY, init, checkDevice, getDeviceStatus, getAllDeviceStatus, healthCheck, info, WebcamMicStatusComponent };
export default WebcamMicStatusComponent;
