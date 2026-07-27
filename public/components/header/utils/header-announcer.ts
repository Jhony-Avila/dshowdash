// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.5.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/utils/header-announcer
// PURPOSE: Singleton screen reader announcer for header using overlay-root
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
//   getAnnouncerRoot from ./overlay-root.js
// PROVIDES:
//   announce() — queue polite screen reader announcement
//   announceImmediate() — immediate assertive announcement
//   init() / destroy() / clear() — lifecycle management
//   HeaderAnnouncer (constructor) — OOP wrapper
//   healthCheck() / info() — observability
//   injectPorts() / getPorts() — port dependency injection
//   MODULE_ID, VERSION — module identity constants
// ═══════════════════════════════════════════════════════════════
// Header Announcer - AAA Compliant (Singleton)
// @version 1.5.0-ES6
// @changelog v1.5.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.4.0-ENTERPRISE - Export VERSION padronizado
// P17WI: PortsFactory/PortsProfiles pattern
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';
import { getAnnouncerRoot } from './overlay-root.js';

export const MODULE_ID = 'header.utils.header-announcer';
export const VERSION = '1.5.0-ES6';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _announcer: Record<string,unknown>|null = null;
let _initialized = false;
// @ts-expect-error strict migration — TS7034
let _queue = [];
let _isProcessing = false;

function ensureAnnouncer() {
  if (_announcer) return _announcer;
  const root = getAnnouncerRoot();
  if (!root) return null;
  let announcer = root.querySelector('[data-header-announcer]');
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.setAttribute('data-header-announcer', 'true');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'header-announcer sr-only';
    announcer.style.cssText = 'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;';
    root.appendChild(announcer);
  }
  _announcer = announcer;
  _initialized = true;
  const telemetry = _getPort('telemetry');
  if (telemetry && telemetry.track) telemetry.track(HEADER_EVENTS.ANNOUNCER_CREATED, { version: VERSION });
  return announcer;
}

function processQueue() {
  if (_isProcessing || _queue.length === 0) return;
  _isProcessing = true;
  // @ts-expect-error strict migration — TS7005
  const item = _queue.shift();
  const announcer = _announcer;
  if (announcer) {
    announcer.textContent = '';
    setTimeout(() => {
      announcer.textContent = item.message;
      setTimeout(() => {
        if (announcer.textContent === item.message) announcer.textContent = '';
        _isProcessing = false;
        if (_queue.length > 0) setTimeout(processQueue, 100);
      }, 3000);
    }, 50);
  } else { _isProcessing = false; }
}

export function announce(message: string, priority: string) {
  if (!priority) priority = 'polite';
  if (!message) return;
  const announcer = ensureAnnouncer();
  if (!announcer) return;
  if (priority === 'assertive') { announcer.setAttribute('aria-live', 'assertive'); }
  else { announcer.setAttribute('aria-live', 'polite'); }
  _queue.push({ message, priority, timestamp: Date.now() });
  processQueue();
}

export function announceImmediate(message: string, priority: string) {
  if (!priority) priority = 'assertive';
  const announcer = ensureAnnouncer();
  if (!announcer || !message) return;
  announcer.setAttribute('aria-live', priority);
  announcer.textContent = '';
  setTimeout(() => { announcer.textContent = message; }, 50);
}

export function clear() { _queue = []; if (_announcer) _announcer.textContent = ''; }
export function init() { _initPorts(); ensureAnnouncer(); return _initialized; }
// @ts-expect-error TS migration - TS2349
export function destroy() { clear(); if (_announcer) { _announcer.remove(); _announcer = null; } _initialized = false; }
export function isInitialized() { return _initialized; }
export function getVersion() { return VERSION; }

export function healthCheck() {
  const checks = { initialized: _initialized, announcerExists: !!_announcer, queueEmpty: _queue.length === 0, noBodyAppendChild: true, portsInitialized: Ports.isInitialized() };
  const score = Object.values(checks).filter(Boolean).length;
  const maxScore = Object.keys(checks).length;
  return { status: score === maxScore ? 'HEALTHY' : 'DEGRADED', score, maxScore, scoreDisplay: `${score}/${maxScore}`, checks, portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, queueLength: _queue.length, isProcessing: _isProcessing, portsInitialized: Ports.isInitialized() }; }

export function HeaderAnnouncer() {}
HeaderAnnouncer.prototype.announce = (message: string, priority: string) => { announce(message, priority || 'polite'); };
HeaderAnnouncer.prototype.clear = () => { clear(); };
HeaderAnnouncer.prototype.destroy = () => { clear(); };

export default { init, destroy, announce, announceImmediate, clear, isInitialized, getVersion, healthCheck, info, HeaderAnnouncer, VERSION, MODULE_ID, injectPorts, getPorts };
