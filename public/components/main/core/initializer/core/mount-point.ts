// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.9.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: mount-point
// PURPOSE: Initializer - Mount Point Detection
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   getSafeMountPoint() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @version 3.9.0-STRICT-MODE
// @changelog v3.9.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v3.8.0-P0-ENTERPRISE - Logger via Ports (elimina (window as any).Logger fallback)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

export const VERSION = '5.8.0-P2-ENTERPRISE';

export const MODULE_ID = 'initializer-mount-point';

// P0 ENTERPRISE: Ports-based access
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && (window as any).Core?.windowAdapter?.get) {
    const waLogger = (window as any).Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback to console)
  // 4. Non-strict: use (window as any).Logger with violation recording or console

  // 5. Ultimate fallback: console (only in non-strict)
  return console;
}

// ============================================================================
// SAFE MOUNT POINT DETECTION
// v3.4.0: NEVER use #app or body as they contain the entire layout
// ============================================================================

/**
 * Detecta ponto de montagem seguro para o container
 * @returns {Object|null} { element, mode } ou null se não encontrar
 */
export function getSafeMountPoint() {
  // Priority 1: Existing container-main
  const existing = document.getElementById('container-main');
  if (existing) return { element: existing, mode: 'existing' };

  // Priority 2: Shell main region
  const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
  if (shellMain) return { element: shellMain, mode: 'shell-region' };

  // Priority 3: data-region="main"
  const dataRegion = document.querySelector('[data-region="main"]');
  if (dataRegion) return { element: dataRegion, mode: 'data-region' };

  // Priority 4: data-shell-region="main"
  const shellRegion = document.querySelector('[data-shell-region="main"]');
  if (shellRegion) return { element: shellRegion, mode: 'shell-data-region' };

  // NO FALLBACK to #app or body - this would destroy the layout!
  const logger = _getLogger();
  if (logger && logger.warn) {
    logger.warn('[initializer] No safe mount point found - container will not be mounted to DOM');
  }
  return null;
}

export default {
  getSafeMountPoint,
  injectPorts,
  getPorts
};
