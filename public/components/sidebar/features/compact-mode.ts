// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.9.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-compact-mode
// PURPOSE: Sidebar Features - Compact Mode
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   enable() — exported function
//   disable() — exported function
//   toggle() — exported function
//   isEnabled() — exported function
//   getContainer() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.COMPACT_DISABLED
//   SIDEBAR_EVENTS.COMPACT_ENABLED
//   SIDEBAR_EVENTS.COMPACT_INITIALIZED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.9.0-ES6';
export const MODULE_ID = 'sidebar-compact-mode';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STORAGE_KEY = 'dsd-sidebar-compact';
const CLASS_NAME = 'dsd-sidebar--compact';

let _enabled = false;
let _container: HTMLElement | null = null;
let _metrics = { enables: 0, disables: 0, toggles: 0 };

function loadState() { try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch(e) { return false; } }
function saveState(enabled: boolean) { try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch(e) { } }

export function init(eventBus: DynObj, container: HTMLElement) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  const saved = loadState();
  if (saved && container) enable(container);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMPACT_INITIALIZED);
  return saved;
}

export function enable(container: HTMLElement) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.add(CLASS_NAME);
  _container.setAttribute('data-compact', 'true');
  _enabled = true;
  _metrics.enables++;
  saveState(true);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMPACT_ENABLED);
  return true;
}

export function disable(container: HTMLElement) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.remove(CLASS_NAME);
  _container.removeAttribute('data-compact');
  _enabled = false;
  _metrics.disables++;
  saveState(false);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.COMPACT_DISABLED);
  return true;
}

export function toggle(container: HTMLElement) { _container = container || _container; _metrics.toggles++; if (_enabled) { disable(_container); return false; } else { enable(_container); return true; } }
export function isEnabled() { return _enabled; }
export function getContainer() { return _container; }

export function destroy() { if (_container) { _container.classList.remove(CLASS_NAME); _container.removeAttribute('data-compact'); } _container = null; _enabled = false; }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _enabled, hasContainer: !!_container, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _enabled, hasContainer: !!_container }, metrics: getMetrics() }; }

export default { init, enable, disable, toggle, isEnabled, getContainer, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
