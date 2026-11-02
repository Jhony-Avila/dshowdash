// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform (barrel)
// PURPOSE: Ponto único de entrada da Platform Federation —
//          orquestração de experiência, navegação e micro-frontends
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Runtime from ./runtime/index.js
//   Manifest from ./runtime/manifest-v3.js
//
// EXPORTS:
//   VERSION, MODULE_ID, init, navigate, getManifest, getRuntime,
//   isInitialized, info, healthCheck
//
// PROVIDES:
//   info()        — identidade operacional do módulo
//   healthCheck() — estado determinístico (HEALTHY/DEGRADED/FAILED)
// ═══════════════════════════════════════════════════════════════
// @changelog v3.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v3.2.0-ENTERPRISE - Adicionado healthCheck(), info() expandido
// ═══════════════════════════════════════════════════════════════
'use strict';

const VERSION = '3.3.0-P2-ENTERPRISE';
const MODULE_ID = 'platform';

import * as Runtime from './runtime/index.js';
import * as Manifest from './runtime/manifest-v3.js';

let _initialized = false;
let _context: Record<string, unknown> | null = null;
let _initError: Error | null = null;

function init(context: Record<string, unknown>) {
  if (!context) context = {};
  if (_initialized) return Promise.resolve({ version: VERSION, moduleId: MODULE_ID });
  _context = context;
  _initError = null;
  return Runtime.init(context).then(() => {
    _initialized = true;
    return { version: VERSION, moduleId: MODULE_ID, manifest: Manifest.info() };
  }).catch((error: Error) => {
    _initError = error;
    throw error;
  });
}

function navigate(route: string) {
  const app = Manifest.resolveAppByRoute(route);
  if (!app) return Promise.resolve({ success: false, error: 'Route not found' });
  return import(app.entry).then(module => {
    if (module.init) return module.init(_context).then(() => ({
      success: true,
      app: app.id,
      module
    }));
    return { success: true, app: app.id, module };
  }).catch((error: Error) => ({
    success: false,
    error: error.message
  }));
}

function getManifest() { return Manifest; }
function getRuntime() { return Runtime; }
function isInitialized() { return _initialized; }

// ═══════════════════════════════════════════════════════════════
// INFO — Identidade operacional (Briefing Parte 5, §3.2)
// ═══════════════════════════════════════════════════════════════
function info() {
  return {
    id: MODULE_ID,
    version: VERSION,
    type: 'platform',
    initialized: _initialized,
    dependencies: {
      runtime: Runtime.info ? Runtime.info() : { status: 'unknown' },
      manifest: Manifest.info ? Manifest.info() : { status: 'unknown' }
    },
    capabilities: {
      navigation: true,
      federation: true,
      microApps: true
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// HEALTHCHECK — Estado determinístico (Briefing Parte 5, §3.3)
// Retorna: HEALTHY | DEGRADED | FAILED
// Não lança exceção. Não depende de timing.
// ═══════════════════════════════════════════════════════════════
function healthCheck() {
  const runtimeHealth = Runtime.info ? Runtime.info() : null;
  const runtimeOk = runtimeHealth && (runtimeHealth as Record<string, unknown>).initialized;
  // @ts-expect-error strict migration — TS2774
  const manifestOk = Manifest.info && typeof Manifest.resolveAppByRoute === 'function';

  let status = 'HEALTHY';
  if (_initError) {
    status = 'FAILED';
  } else if (!_initialized) {
    status = 'DEGRADED';
  } else if (!runtimeOk) {
    status = 'DEGRADED';
  }

  return {
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      initialized: _initialized,
      runtimeReady: !!runtimeOk,
      manifestReady: !!manifestOk,
      hasContext: !!_context,
      initError: _initError ? _initError.message : null
    },
    timestamp: Date.now()
  };
}

export { init, navigate, getManifest, getRuntime, isInitialized, info, healthCheck, VERSION, MODULE_ID };
export default { init, navigate, getManifest, getRuntime, isInitialized, info, healthCheck, VERSION, MODULE_ID };
