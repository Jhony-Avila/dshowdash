// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-RETURN-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-container-resolver
// PURPOSE: Preloader Container Resolver - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   resolveContainer() — exported function
//   getProgressSource() — exported function
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
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'preloader-container-resolver';
const VERSION = '1.5.0-RETURN-FIX';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { resolves: 0, appShellHits: 0, shellRegionHits: 0, bodyFallbacks: 0 };

export function resolveContainer(config?: Record<string, unknown>) {
  _initPorts();
  _metrics.resolves++;
  
  const appShell = _getPort('appShell');
  if (appShell && appShell.adapter && typeof appShell.adapter.getContainer === 'function') {
    const container = appShell.adapter.getContainer('preloader', { createIfMissing: true });
    if (container) {
      _metrics.appShellHits++;
      return { containerEl: container, source: 'appshell-adapter' };
    }
  }

  const shellRegion = document.getElementById('shell-preloader-region');
  if (shellRegion) {
    _metrics.shellRegionHits++;
    return { containerEl: shellRegion, source: 'shell-region-direct' };
  }

  _metrics.bodyFallbacks++;
  return { containerEl: null, source: 'body-fallback' };
}

export function getProgressSource() {
  return {
    source: 'bootstrap-v2',
    events: ['boot:progress:start', 'boot:progress:phase:start', 'boot:progress:phase:complete', 'boot:progress:complete'],
    legacy: false
  };
}

export function getMetrics() { return Object.assign({}, _metrics); }

export function info() { 
  return { 
    moduleId: MODULE_ID, 
    version: VERSION, 
    progressSource: getProgressSource(),
    metrics: getMetrics(), 
    portsInitialized: Ports.isInitialized() 
  }; 
}

export function healthCheck() { 
  return { 
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', 
    version: VERSION, 
    moduleId: MODULE_ID, 
    checks: { 
      resolverReady: true, 
      portsInitialized: Ports.isInitialized(),
      bootstrapIntegrated: true
    }, 
    portsInitialized: Ports.isInitialized(), 
    progressSource: 'bootstrap-v2',
    metrics: getMetrics() 
  }; 
}

export { MODULE_ID, VERSION };
export default { 
  MODULE_ID, 
  VERSION, 
  resolveContainer, 
  getProgressSource,
  getMetrics, 
  info, 
  healthCheck, 
  injectPorts, 
  getPorts 
};
