// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-mini-mode
// PURPOSE: Sidebar Features - Mini Mode
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SIDEBAR_EVENTS from /core/runtime/events/catalog/sidebar.events.js
//   createUiPorts from /core/runtime/ports-profiles.js
//   CSS_CLASSES as C from ../ui/constants.js
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
//   SIDEBAR_EVENTS.MINI_DISABLED
//   SIDEBAR_EVENTS.MINI_ENABLED
//   SIDEBAR_EVENTS.MINI_INITIALIZED
// LISTENS (eventos):
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SIDEBAR_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { CSS_CLASSES as C } from '../ui/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '6.1.0-ES6';
export const MODULE_ID = 'sidebar-mini-mode';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const STORAGE_KEY = 'dsd-sidebar-mini';

let _enabled = false;
let _container: HTMLElement | null = null;
let _cleanups: (() => void)[] = [];
let _metrics = { enables: 0, disables: 0, toggles: 0 };

function loadState() { try { return localStorage.getItem(STORAGE_KEY) === 'true'; } catch(e) { return false; } }
function saveState(enabled: boolean) { try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch(e) { } }

function setupHoverExpand(container: HTMLElement) {
  const handleEnter = () => { if (_enabled) container.classList.add(C.MOD_MINI_HOVER); };
  const handleLeave = () => { container.classList.remove(C.MOD_MINI_HOVER); };
  container.addEventListener('mouseenter', handleEnter);
  container.addEventListener('mouseleave', handleLeave);
  _cleanups.push(() => { container.removeEventListener('mouseenter', handleEnter); });
  _cleanups.push(() => { container.removeEventListener('mouseleave', handleLeave); });
}

export function init(eventBus: DynObj, container: HTMLElement) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  _container = container;
  if (container) setupHoverExpand(container);
  const saved = loadState();
  if (saved && container) enable(container);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MINI_INITIALIZED);
  return saved;
}

export function enable(container: HTMLElement) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.add(C.MOD_MINI);
  _container.setAttribute('data-mini', 'true');
  _enabled = true;
  _metrics.enables++;
  saveState(true);
  _container.querySelectorAll(`.${C.ITEM}`).forEach((item: DynObj) => { const label = item.querySelector(`.${C.ITEM_LABEL}`); if (label) item.setAttribute('title', label.textContent || ''); });
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MINI_ENABLED);
  return true;
}

export function disable(container: HTMLElement) {
  _container = container || _container;
  if (!_container) return false;
  _container.classList.remove(C.MOD_MINI);
  _container.classList.remove(C.MOD_MINI_HOVER);
  _container.removeAttribute('data-mini');
  _enabled = false;
  _metrics.disables++;
  saveState(false);
  _container.querySelectorAll(`.${C.ITEM}[title]`).forEach((item: DynObj) => { item.removeAttribute('title'); });
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.MINI_DISABLED);
  return true;
}

export function toggle(container: HTMLElement) { _container = container || _container; _metrics.toggles++; if (_enabled) { disable(_container); return false; } else { enable(_container); return true; } }
export function isEnabled() { return _enabled; }
export function getContainer() { return _container; }
// @ts-expect-error strict migration — TS2345
export function destroy() { _cleanups.forEach(fn => { try { fn(); } catch(e) { } }); _cleanups = []; disable(_container); }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _enabled, hasContainer: !!_container, cleanups: _cleanups.length, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _enabled, hasContainer: !!_container }, metrics: getMetrics() }; }

export default { init, enable, disable, toggle, isEnabled, getContainer, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
