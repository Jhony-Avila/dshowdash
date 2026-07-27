// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.5.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.status-geo
// PURPOSE: Footer - Status Geo
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   GEO_TELEMETRY — exported value
//   init() — exported function
//   requestLocation() — exported function
//   getLocation() — exported function
//   getPermission() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   GeoLocationComponent() — exported function
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

const MODULE_ID = 'components.footer.status-geo';
const VERSION = '2.5.0-P18EC';

const GEO_TELEMETRY = {
  UPDATED: 'geo:location:updated',
  REQUESTED: 'geo:location:requested',
  DENIED: 'geo:location:denied'
};

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, location: (null as unknown|null), permission: 'unknown', requested: false };
const _metrics = { requests: 0, updates: 0, denials: 0 };

function _track(eventKey: string, payload: Record<string,unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

function requestLocation() {
  _metrics.requests++;
  _state.requested = true;
  _track(GEO_TELEMETRY.REQUESTED, {});
  
  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve({ ok: false, reason: 'Geolocation not supported' });
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      position => {
        _state.location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        };
        _state.permission = 'granted';
        _metrics.updates++;
        // @ts-expect-error TS migration - TS2339
        _track(GEO_TELEMETRY.UPDATED, { lat: _state.location.lat, lng: _state.location.lng });
        resolve({ ok: true, location: _state.location });
      },
      error => {
        _state.permission = 'denied';
        _metrics.denials++;
        _track(GEO_TELEMETRY.DENIED, { code: error.code });
        resolve({ ok: false, error: error.message, code: error.code });
      },
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 300000 }
    );
  });
}

function getLocation() { return _state.location; }
function getPermission() { return _state.permission; }

// @ts-expect-error TS migration - TS2345
function init(ctx?: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, hasLocation: { ok: !!_state.location, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, hasLocation: !!_state.location, permission: _state.permission, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// GeoLocationComponent class for registry compatibility
function GeoLocationComponent(this: any, options: Record<string,unknown>) {
  options = options || {};
  this._container = options.container || null;
  this._mounted = false;
  this._element = null;
  this._autoRequest = options.autoRequest === true;
}

GeoLocationComponent.prototype.mount = function() {
  const self = this;
  if (this._mounted) return Promise.resolve();
  if (!this._container) return Promise.resolve();
  
  init();
  
  this._element = document.createElement('div');
  this._element.className = 'dsd-footer__geo-indicator dsd-chip dsd-chip--sm';
  this._element.title = 'Clique para obter localização';
  this._element.style.cursor = 'pointer';
  this._element.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span class="dsd-footer__geo-text">Geo</span>';
  
  this._element.addEventListener('click', () => {
    const textEl = self._element.querySelector('.dsd-footer__geo-text');
    if (textEl) textEl.textContent = '...';

    // @ts-expect-error strict migration — TS2345
    requestLocation().then((result: { ok: boolean; location?: { lat: number; lng: number }; error?: string }) => {
      if (result.ok && result.location) {
        if (textEl) textEl.textContent = `${result.location.lat.toFixed(2)}, ${result.location.lng.toFixed(2)}`;
        self._element.title = `Lat: ${result.location.lat.toFixed(4)}, Lng: ${result.location.lng.toFixed(4)}`;
      } else {
        if (textEl) textEl.textContent = 'N/A';
        self._element.title = result.error || 'Localização indisponível';
      }
    }).catch(() => { if (textEl) textEl.textContent = 'N/A'; });
  });
  
  this._container.appendChild(this._element);
  this._mounted = true;
  
  if (this._autoRequest) {
    // @ts-expect-error strict migration — TS2345
    requestLocation().then((result: { ok: boolean; location?: { lat: number; lng: number }; error?: string }) => {
      if (result.ok && result.location) {
        const textEl = self._element.querySelector('.dsd-footer__geo-text');
        if (textEl) textEl.textContent = `${result.location.lat.toFixed(2)}, ${result.location.lng.toFixed(2)}`;
      }
    }).catch(() => {});
  }
  
  return Promise.resolve();
};

GeoLocationComponent.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  this._mounted = false;
};

GeoLocationComponent.prototype.isLoaded = function() { return this._mounted; };
GeoLocationComponent.prototype.getLocation = () => getLocation();
GeoLocationComponent.prototype.requestLocation = () => requestLocation();
GeoLocationComponent.prototype.healthCheck = () => healthCheck();
GeoLocationComponent.prototype.info = () => info();

export { MODULE_ID, VERSION, GEO_TELEMETRY, init, requestLocation, getLocation, getPermission, healthCheck, info, GeoLocationComponent };
export default { MODULE_ID, VERSION, GEO_TELEMETRY, GeoLocationComponent, init, requestLocation, getLocation, getPermission, healthCheck, info, injectPorts, getPorts };
