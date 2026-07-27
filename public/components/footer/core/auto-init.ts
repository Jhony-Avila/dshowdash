// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.12.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: footer-auto-init
// PURPOSE: Footer Auto Init - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   waitForAuth as bridgeWaitForAuth, waitForAppShell as bridgeWaitForAppShell from /core/runtime/boot-ready-dom-bridge.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   setupAutoInit() — exported function
//   setupDevTools() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { waitForAuth as bridgeWaitForAuth, waitForAppShell as bridgeWaitForAppShell } from '/core/runtime/boot-ready-dom-bridge.js';

const VERSION = '9.12.0-P18EC';
const MODULE_ID = 'footer-auto-init';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const log = {
  debug(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {})); },
  info(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {})); },
  error(msg: string, ctx?: Record<string, unknown>) { const logger = _getPort('logger'); if (logger && logger.error) logger.error(msg, Object.assign({ component: MODULE_ID }, ctx || {})); }
};

const _metrics = { autoInits: 0, authWaits: 0, readyFlagsUsed: false, bridgeUsed: false };

function waitForAuth() {
  _metrics.authWaits++;
  const readyFlags = _getPort('readyFlags');
  if (readyFlags && readyFlags.waitFor) {
    _metrics.readyFlagsUsed = true;
    log.debug('Using ReadyFlags.waitFor(auth) - exclusive path');
    return readyFlags.waitFor('auth', 8000).then((ready: unknown) => { if (ready) return true; log.debug('ReadyFlags.waitFor(auth) timeout'); return document.body.dataset.authReady === 'true'; });
  }
  log.debug('ReadyFlags not available - using boot-ready-dom-bridge');
  _metrics.bridgeUsed = true;
  return bridgeWaitForAuth(10000);
}

function waitForAppShell() {
  const readyFlags = _getPort('readyFlags');
  const appShell = _getPort('appShell');
  if (readyFlags && readyFlags.waitFor) {
    log.debug('Using ReadyFlags.waitFor(appshell) - exclusive path');
    return readyFlags.waitFor('appshell', 8000).then((ready: unknown) => { if (ready) return true; log.debug('ReadyFlags.waitFor(appshell) timeout'); return (appShell && appShell.isReady && appShell.isReady()) || document.body.dataset.appReady === 'true'; });
  }
  if (appShell && appShell.isReady && appShell.isReady()) return Promise.resolve(true);
  if (typeof document !== 'undefined' && document.body && document.body.dataset.appReady === 'true') return Promise.resolve(true);
  log.debug('ReadyFlags not available - using boot-ready-dom-bridge for appshell');
  _metrics.bridgeUsed = true;
  return bridgeWaitForAppShell(10000);
}

export function setupAutoInit(mountFn: Function, VERSION: unknown, MODULE_ID: string) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  function autoInitFooter() {
    _metrics.autoInits++;
    log.debug('autoInitFooter CHAMADO', { version: VERSION });
    Promise.all([waitForAuth(), waitForAppShell()]).then(() => {
      log.debug('Auth e AppShell OK, chamando mount()');
      // @ts-expect-error TS migration - TS2339
      mountFn().then(() => { log.debug('mount() SUCESSO - Layout 2-bar'); }).catch((err: unknown) => { log.error('mount() ERRO', { error: err.message }); });
    });
  }
  const readyFlags = _getPort('readyFlags');
  const appShell = _getPort('appShell');
  const isShellReady = (readyFlags && readyFlags.isReady && readyFlags.isReady('appshell')) || (appShell && appShell.isReady && appShell.isReady()) || document.body.dataset.appReady === 'true';
  log.debug('isShellReady check', { isShellReady });
  if (isShellReady) { log.debug('AppShell ja ready - iniciando imediatamente'); autoInitFooter(); return; }
  if (readyFlags && readyFlags.waitFor) { log.debug('Usando ReadyFlags.waitFor(appshell) - caminho exclusivo'); readyFlags.waitFor('appshell', 8000).then(() => { autoInitFooter(); }); return; }
  log.debug('ReadyFlags não disponível - usando boot-ready-dom-bridge');
  _metrics.bridgeUsed = true;
  bridgeWaitForAppShell(10000).then(() => { log.debug('AppShell ready via bridge'); autoInitFooter(); });
}

export function setupDevTools(exports: unknown, MODULE_ID: string) {
  if (typeof window === 'undefined') return;
  const cfg = _getPort('config');
  if (cfg && cfg.app && cfg.app.debug) { (window as any).__dev = (window as any).__dev || {}; (window as any).__dev.footer = exports; }
}

export function getMetrics() { return Object.assign({}, _metrics); }
export function info() { const ps = Ports.snapshot(); return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), readyFlagsUsed: _metrics.readyFlagsUsed, bridgeUsed: _metrics.bridgeUsed, portsInitialized: ps._initialized, p18EventBusOnly: true }; }
export function healthCheck() { const ps = Ports.snapshot(); return { status: ps._initialized ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { autoInitReady: true, readyFlagsUsed: _metrics.readyFlagsUsed, bridgeUsed: _metrics.bridgeUsed, hasLogger: !!_getPort('logger'), portsInitialized: ps._initialized }, metrics: getMetrics(), p18EventBusOnly: true }; }

export { MODULE_ID, VERSION };
export default { setupAutoInit, setupDevTools, getMetrics, info, healthCheck, VERSION, MODULE_ID };
