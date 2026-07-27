// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.footer.announce-live-region
// PURPOSE: Footer - Announce Live Region
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   announce() — exported function
//   setElement() — exported function
//   setPoliteness() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   FooterAnnounceLiveRegion() — exported function
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

const MODULE_ID = 'components.footer.announce-live-region';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state = { initialized: false, element: (null as HTMLElement|null|null), queue: ([] as unknown[]), politeness: 'polite' };
const _metrics = { announcements: 0 };

// @ts-expect-error TS migration - TS2345, TS2769
function announce(message: string, options: Record<string,unknown>) { options = options || {}; _metrics.announcements++; if (!_state.element && typeof document !== 'undefined') { _state.element = document.getElementById('live-region') || document.querySelector('[aria-live]'); } if (_state.element) { _state.element.setAttribute('aria-live', options.politeness || _state.politeness); _state.element.textContent = message; setTimeout(() => { _state.element.textContent = ''; }, options.clearAfter || 3000); return { ok: true }; } return { ok: false, reason: 'No live region element' }; }

function setElement(element: HTMLElement|null) { _state.element = element; return { ok: true }; }
function setPoliteness(level: string) { _state.politeness = level; return { ok: true }; }

// @ts-expect-error TS migration - TS2345, TS2740
function init(ctx?: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); if (ctx && ctx.element) _state.element = ctx.element; _state.initialized = true; return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, hasElement: { ok: !!_state.element, severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, hasElement: !!_state.element, politeness: _state.politeness, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

// FooterAnnounceLiveRegion class for registry compatibility
function FooterAnnounceLiveRegion(this: any, options: Record<string,unknown>) {
  options = options || {};
  this._container = null;
  this._mounted = false;
  this._element = null;
}

FooterAnnounceLiveRegion.prototype.mount = function(container: HTMLElement|null, config: Record<string,unknown>, integrations: Record<string,unknown>) {
  if (this._mounted) return Promise.resolve();
  
  init();
  
  this._container = container;
  this._element = document.createElement('div');
  this._element.id = 'footer-live-region';
  this._element.className = 'dsd-footer__live-region sr-only';
  this._element.setAttribute('role', 'status');
  this._element.setAttribute('aria-live', 'polite');
  this._element.setAttribute('aria-atomic', 'true');
  
  this._container.appendChild(this._element);
  setElement(this._element);
  this._mounted = true;
  
  return Promise.resolve();
};

FooterAnnounceLiveRegion.prototype.destroy = function() {
  if (this._element && this._element.parentNode) {
    this._element.parentNode.removeChild(this._element);
  }
  this._element = null;
  _state.element = null;
  this._mounted = false;
};

FooterAnnounceLiveRegion.prototype.isLoaded = function() { return this._mounted; };
FooterAnnounceLiveRegion.prototype.announce = (message: string, options: Record<string,unknown>) => announce(message, options);
FooterAnnounceLiveRegion.prototype.setPoliteness = (level: string) => setPoliteness(level);
FooterAnnounceLiveRegion.prototype.healthCheck = () => healthCheck();
FooterAnnounceLiveRegion.prototype.info = () => info();

export { MODULE_ID, VERSION, init, announce, setElement, setPoliteness, healthCheck, info, FooterAnnounceLiveRegion };
export default FooterAnnounceLiveRegion;
