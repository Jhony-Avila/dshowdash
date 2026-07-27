// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-parallax
// PURPOSE: Sidebar Features - Parallax Scroll
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
//   destroy() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   SIDEBAR_EVENTS.PARALLAX_INITIALIZED
// LISTENS (eventos):
//   'scroll'
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
export const MODULE_ID = 'sidebar-parallax';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _enabled = false;
let _cleanup: (() => void) | null = null;
let _metrics = { enables: 0, disables: 0, scrollEvents: 0 };

export function init(eventBus: DynObj) {
  if (eventBus) Ports.inject({ eventBus });
  _initPorts();
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(SIDEBAR_EVENTS.PARALLAX_INITIALIZED);
}

export function enable(container: HTMLElement) {
  if (!container || _enabled) return false;
  container.classList.add(C.MOD_PARALLAX);
  const navContent = container.querySelector(`.${C.NAV_CONTENT}, .${C.NAV}`);
  if (!navContent) return false;
  const handler = () => { _metrics.scrollEvents++; const scrollTop = navContent.scrollTop; const offset = scrollTop * -0.3; container.style.setProperty('--parallax-offset', `${offset}px`); };
  navContent.addEventListener('scroll', handler, { passive: true });
  _cleanup = () => { navContent.removeEventListener('scroll', handler); container.classList.remove(C.MOD_PARALLAX); container.style.removeProperty('--parallax-offset'); };
  _enabled = true;
  _metrics.enables++;
  return true;
}

export function disable() { if (_cleanup) { _cleanup(); _cleanup = null; } _enabled = false; _metrics.disables++; }
export function toggle(container: HTMLElement) { if (_enabled) { disable(); return false; } else { return enable(container); } }
export function isEnabled() { return _enabled; }

export function destroy() { disable(); }

export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _enabled, metrics: getMetrics() }; }
export function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), checks: { enabled: _enabled }, metrics: getMetrics() }; }

export default { init, enable, disable, toggle, isEnabled, destroy, injectPorts, getPorts, getMetrics, info, healthCheck, VERSION, MODULE_ID };
