// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.8.0-ES6-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-factory
// PURPOSE: Factory singleton para criação/gestão da instância Sidebar
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts — from '/core/runtime/ports-profiles.js'
//   VERSION (as CONST_VERSION), CAPABILITIES — from './core/constants.js'
//
// PROVIDES:
//   createSidebar() — async factory, retorna instância Sidebar
//   createSidebarSync(SidebarClass) — factory síncrona
//   getSidebar() — getter da instância (throws se não inicializada)
//   getSidebarOrNull() — getter nullable
//   destroySidebar() — destrói instância
//   hasSidebarInstance() — boolean check
//   setInstance(instance) — setter direto
//   injectPorts(p) / getPorts() — ports API
//   getMetrics() / info() / healthCheck() — observabilidade
//   VERSION, MODULE_ID — constantes
//
// RECEIVES (via init/options): nenhum
// EMITS (eventos): nenhum
// LISTENS (eventos): nenhum
// WINDOW ACCESS: nenhum
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { VERSION as CONST_VERSION, CAPABILITIES } from './core/constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '5.8.0-ES6';
export const MODULE_ID = 'sidebar-factory';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string) {
  const args = Array.prototype.slice.call(arguments, 1);
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = '[sidebar-factory]';
  if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; }
  if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; }
  if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; }
  if (logger.debug) logger.debug(prefix, args.join(' '));
};

let _instance: DynObj | null = null;
const _metrics = { creates: 0, destroys: 0, gets: 0, errors: 0 };

export function createSidebar() {
  _metrics.creates++;
  if (_instance) return Promise.resolve(_instance);
  return import('./sidebar.js').then(module => {
    const Sidebar = module.default || module.Sidebar;
    _instance = new Sidebar();
    return _instance;
  }).catch(error => {
    _metrics.errors++;

    // @ts-expect-error TS migration - TS2554
    _log('error', 'Failed to load sidebar:', error.message || error);
    throw error;
  });
}

export function createSidebarSync(SidebarClass: DynObj) { _metrics.creates++; if (!_instance) _instance = new SidebarClass(); return _instance; }
export function getSidebar() { _metrics.gets++; if (!_instance) throw new Error('Sidebar not initialized. Call createSidebar() first.'); return _instance; }
export function destroySidebar() { _metrics.destroys++; if (_instance) { if (_instance.destroy) _instance.destroy(); _instance = null; } }
export function hasSidebarInstance() { return _instance !== null; }
export function getSidebarOrNull() { _metrics.gets++; return _instance; }
export function setInstance(instance: DynObj) { _instance = instance; }

export function getMetrics() { return Object.assign({ hasInstance: !!_instance }, _metrics); }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), hasInstance: !!_instance, capabilities: CAPABILITIES, metrics: getMetrics() }; }

export function healthCheck() {
  const checks = { hasInstance: !!_instance, noErrors: _metrics.errors === 0, capabilitiesLoaded: !!CAPABILITIES, hasLogger: !!_getPort('logger') };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 3 ? 'HEALTHY' : _instance ? 'DEGRADED' : 'NOT_INITIALIZED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export default { createSidebar, createSidebarSync, getSidebar, destroySidebar, hasSidebarInstance, getSidebarOrNull, setInstance, info, getMetrics, healthCheck, VERSION, MODULE_ID, CAPABILITIES };
