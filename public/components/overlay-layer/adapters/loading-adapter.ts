// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.adapters.loading-adapter
// PURPOSE: Overlay Layer - Loading Adapter v2.2.0-P17WI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   * as Manager from ../core/manager.js
//
// PROVIDES:
//   show() — exported function
//   hide() — exported function
//   showLoading() — exported function
//   hideLoading() — exported function
//   isVisible() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import * as Manager from '../core/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

const VERSION = '2.2.0-P17WI';
const MODULE_ID = 'overlay-layer.adapters.loading-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const LOADING_ID = 'global-loading';
const _metrics = { showCount: 0, hideCount: 0 };

function show(message: string) {
  if (!message) message = 'Carregando...';
  _metrics.showCount++;
  return Manager.open({ id: LOADING_ID, type: 'loading', content: message, config: { closable: false } });
}

function hide() {
  _metrics.hideCount++;

  // @ts-expect-error TS migration - TS2554
  return Manager.close(LOADING_ID);
}

function showLoading(message: string) { return show(message); }
function hideLoading() { return hide(); }

function isVisible() {
  const state = Manager.info ? Manager.info() : null;
  return state && state.currentStack ? state.currentStack.indexOf(LOADING_ID) !== -1 : false;
}

function getMetrics() { return { showCount: _metrics.showCount, hideCount: _metrics.hideCount }; }

function healthCheck() {
  const checks = { managerAvailable: !!Manager, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) { if ((checks as DynObj)[keys[i]]) passed++; }
  return { status: passed === keys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${keys.length}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, loadingId: LOADING_ID, isVisible: isVisible(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export { show, hide, showLoading, hideLoading, isVisible, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };

export default { show, hide, showLoading, hideLoading, isVisible, getMetrics, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
