// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.10.0-REGION-RESOLVER)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-core-auto-init
// PURPOSE: Auto-initialization with auth/appshell readiness and container resolution
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   VERSION, MODULE_ID from ./logger.js
//   waitForAuth, waitForAppShell from /core/runtime/boot-ready-dom-bridge.js
//   findRegion, REGION_IDS from /platform/shell/layout-regions.ts
// PROVIDES:
//   autoInit(mountFn) — auto-init with auth/appshell wait and container resolution
//   setupAutoInit(mountFn) — setup auto-init listener
//   waitForAuth() — wait for auth readiness
//   registerWindowGlobals(createHeaderFn, mountFn, getInstanceFn) — register (window as any).Header
//   getMetrics() — return metrics
//   healthCheck() — return health status
//   info() — return module info
//   injectPorts(p) — inject dependency ports
//   getPorts() — get ports snapshot
// WINDOW ACCESS:
//   (window as any).AppShellReady — checks if AppShell is ready
//   (window as any).Header — registers Header global API
// ═══════════════════════════════════════════════════════════════
// Header Auto-Init - Enterprise
// @version 1.10.0-REGION-RESOLVER
// @changelog v1.10.0-REGION-RESOLVER - Migrado para Region Resolver Service (findRegion/REGION_IDS)
// @changelog v1.9.0-ES6 - Task 10.1 B07: var → const/let
// @changelog v1.8.0-P18EC - Migrated to boot-ready-dom-bridge
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';

import { waitForAuth as bridgeWaitForAuth, waitForAppShell as bridgeWaitForAppShell } from '/core/runtime/boot-ready-dom-bridge.js';
import { findRegion, REGION_IDS } from '/platform/shell/layout-regions.js';

export const VERSION = '1.10.0-REGION-RESOLVER';
export const MODULE_ID = 'header-core-auto-init';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { autoInits: 0, authWaits: 0, readyFlagsUsed: false, bridgeUsed: false };
const _integrationsStatus = { appShellConnected: false };

function log(level: string, ...args: any[]) {
  const L = _getPort('logger');
  if (L && L[level]) L[level].apply(L, [`[${MODULE_ID}]`].concat(args));
}

function _isAppShellReadyFlag() { return typeof window !== 'undefined' && (window as any).AppShellReady === true; }

export function waitForAuth() {
  _metrics.authWaits++;
  _initPorts();
  const rf = _getPort('readyFlags');
  if (rf && rf.waitFor) {
    _metrics.readyFlagsUsed = true;
    log('debug', 'Using ReadyFlags.waitFor(auth) via port - exclusive path');
    return rf.waitFor('auth', 8000).then((ready: unknown) => {
      if (ready) return true;
      log('warn', 'ReadyFlags.waitFor(auth) timeout');
      return document.body.dataset.authReady === 'true';
    });
  }
  if (document.body.dataset.authReady === 'true') return Promise.resolve(true);
  log('debug', 'ReadyFlags not available - using boot-ready-dom-bridge');
  _metrics.bridgeUsed = true;
  return bridgeWaitForAuth(10000);
}

function waitForAppShell() {
  _initPorts();
  const rf = _getPort('readyFlags');
  const appShell = _getPort('appShell');
  if (rf && rf.waitFor) {
    log('debug', 'Using ReadyFlags.waitFor(appshell) via port - exclusive path');
    return rf.waitFor('appshell', 8000).then((ready: unknown) => {
      if (ready) return true;
      log('warn', 'ReadyFlags.waitFor(appshell) timeout');
      return _isAppShellReadyFlag() || (appShell && appShell.isReady && appShell.isReady());
    });
  }
  if (_isAppShellReadyFlag() || (appShell && appShell.isReady && appShell.isReady())) return Promise.resolve(true);
  log('debug', 'ReadyFlags not available - using boot-ready-dom-bridge for appshell');
  _metrics.bridgeUsed = true;
  return bridgeWaitForAppShell(10000);
}

export function autoInit(mountFn: Function) {
  _metrics.autoInits++;
  log('info', 'Aguardando auth e appshell...');
  return Promise.all([waitForAuth(), waitForAppShell()]).then(() => {
    log('info', 'Auth e AppShell confirmados, auto-inicializando...');
    let container = null;
    let source = 'none';
    const appShell = _getPort('appShell');
    if (appShell && appShell.region) {
      _integrationsStatus.appShellConnected = true;
      container = appShell.region('header');
      if (container) { source = 'appshell-region'; log('info', 'Container via AppShell.region(header)'); }
    }
    if (!container) {
      container = document.getElementById('header-container');
      if (container) { source = 'legacy-container'; log('info', 'Container via legacy header-container'); }
    }
    if (!container) {
      // v1.10.0: Using Region Resolver Service
      container = findRegion(REGION_IDS.HEADER);
      if (container) { source = 'region-resolver'; log('info', 'Container via Region Resolver Service'); }
    }
    if (container) {
      log('info', `Container encontrado (source: ${source})`);
      return mountFn(container).catch((err: unknown) => { log('error', 'Erro no auto-init:', err); });
    } else {
      log('error', 'Container não encontrado - Header não será montado');
    }
  });
}

export function setupAutoInit(mountFn: Function) {
  _initPorts();
  const rf = _getPort('readyFlags');
  const appShell = _getPort('appShell');
  const isShellReady = (rf && rf.isReady && rf.isReady('appshell')) || _isAppShellReadyFlag() || (appShell && appShell.isReady && appShell.isReady());

  if (isShellReady) {
    log('info', 'AppShell já ready, inicializando Header imediatamente');
    setTimeout(() => { autoInit(mountFn); }, 0);
    return;
  }

  if (rf && rf.waitFor) {
    log('info', 'Usando ReadyFlags.waitFor(appshell) via port - caminho exclusivo');
    rf.waitFor('appshell', 8000).then(() => { autoInit(mountFn); });
    return;
  }

  log('info', 'ReadyFlags não disponível - usando boot-ready-dom-bridge');
  _metrics.bridgeUsed = true;
  bridgeWaitForAppShell(10000).then(() => { autoInit(mountFn); });
}

export function registerWindowGlobals(createHeaderFn: Function, mountFn: Function, getInstanceFn: Function) {
  if (typeof window !== 'undefined') {
    if (!isStrict()) {
      (window as any).Header = {
        createHeader: createHeaderFn,
        mount: mountFn,
        getHeaderInstance: getInstanceFn,
        VERSION,
        MODULE_ID,
        getVersion() { return VERSION; }
      };
    } else {
      recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, property: 'window.Header' });
    }
  }
}

export function getMetrics() { return Object.assign({}, _metrics); }

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    integrations: _integrationsStatus,
    metrics: getMetrics(),
    readyFlagsUsed: _metrics.readyFlagsUsed,
    bridgeUsed: _metrics.bridgeUsed,
    portsInitialized: Ports.isInitialized(),
    p18EventBusOnly: true
  };
}

export function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    checks: { autoInitReady: true, readyFlagsUsed: _metrics.readyFlagsUsed, bridgeUsed: _metrics.bridgeUsed },
    metrics: getMetrics(),
    p18EventBusOnly: true
  };
}

export default { waitForAuth, autoInit, setupAutoInit, registerWindowGlobals, getMetrics, info, healthCheck, injectPorts, getPorts };
