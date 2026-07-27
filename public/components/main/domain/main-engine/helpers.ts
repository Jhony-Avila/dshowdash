// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.domain.main-engine.helpers
// PURPOSE: MainEngine Helpers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isAuthenticated() — exported function
//   extractRouteInfo() — exported function
//   emitEvent() — exported function
//   safeAsync() — exported function
//   healthCheck() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   event
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '6.0.0-P1-HEX';
const MODULE_ID = 'main.domain.main-engine.helpers';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

// P1-HEX: Authentication check via ports (no direct window/document access)
function isAuthenticated(ports: unknown) {
  try {
    const p = ports as Record<string, Record<string, (...args: unknown[]) => unknown>> | null;
    // 1. Check via injected auth port
    if (p && p.auth && p.auth.isAuthenticated && p.auth.isAuthenticated()) return true;

    // 2. Check via globals port
    const globalsPort = (p?.globals || _getPort('globals')) as Record<string, (...args: unknown[]) => unknown> | null;
    if (globalsPort) {
      // Check SessionManager
      const sessionManager = globalsPort.getSessionManager ? globalsPort.getSessionManager() as Record<string, (...args: unknown[]) => unknown> | null : null;
      if (sessionManager && sessionManager.isAuthenticated && sessionManager.isAuthenticated()) return true;

      // Check AppContext
      const appContext = globalsPort.getAppContext ? globalsPort.getAppContext() as Record<string, Record<string, (...args: unknown[]) => unknown>> | null : null;
      if (appContext && appContext.auth && appContext.auth.isAuthenticated && appContext.auth.isAuthenticated()) return true;

      // Check body attribute
      if (globalsPort.isAuthenticatedViaBody && globalsPort.isAuthenticatedViaBody()) return true;
      if (globalsPort.getBodyAttribute) {
        if (globalsPort.getBodyAttribute('data-auth-ready') === 'true') return true;
      }
      const dataset = (globalsPort.getBodyDataset ? globalsPort.getBodyDataset() : {}) as Record<string, unknown>;
      if (dataset.state === 'authenticated') return true;
    }

    return false;
  } catch (e) {
    // Fallback via globals port
    const gp = _getPort('globals') as Record<string, (...args: unknown[]) => unknown> | null;
    return gp && gp.getBodyAttribute && gp.getBodyAttribute('data-auth-ready') === 'true';
  }
}

function extractRouteInfo(data: Record<string, unknown>) {
  if (data && data.logicalRoute) {
    const lr = data.logicalRoute as Record<string, unknown>;
    const vr = data.virtualRoute as Record<string, unknown> | null;
    return {
      path: lr.path || (vr ? vr.path : null),
      panelId: lr.view || (vr ? vr.view : null),
      layout: lr.layout || (vr ? vr.layout : null)
    };
  }
  if (data && data.path) {
    return { path: data.path, panelId: data.view, layout: data.layout };
  }
  if (data && data.route) {
    const r = data.route as Record<string, unknown>;
    if (r.path) return { path: r.path, panelId: r.view, layout: r.layout };
  }
  return { path: null, panelId: null, layout: null };
}

function emitEvent(events: unknown, event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  const ev = events as Record<string, (...args: unknown[]) => unknown> | null;
  if (ev && ev.emit) {
    ev.emit(event, data);
  }
}

function safeAsync(fn: (...args: unknown[]) => unknown, fallback: unknown) {
  if (fallback === undefined) fallback = null;
  return Promise.resolve().then(() => fn()).catch(() => fallback);
}

function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: Ports.isInitialized(),
    p1HexCompliant: true
  };
}

export { VERSION, MODULE_ID, isAuthenticated, extractRouteInfo, emitEvent, safeAsync, healthCheck, injectPorts, getPorts };
export default { isAuthenticated, extractRouteInfo, emitEvent, safeAsync, healthCheck, injectPorts, getPorts, VERSION, MODULE_ID };
