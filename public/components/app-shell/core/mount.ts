// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
/**
 * @file App Shell — Mount Operations
 * @version 3.3.1-EXPORT-FIX
 * @module app-shell/core/mount
 *
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires /core/runtime/ports-profiles.js (createCorePorts)
 * @requires ./lifecycle.js (markMounted, markUnmounting, reset as resetLifecycle)
 * @requires ../state/store.js (setMounted, setReady, getState)
 * @requires ../ui/template.js (createBaseShell, createRegions)
 * @requires ../ui/transitions.js (applyInitialEffects, resetTransitions)
 *
 * @provides mountShell, unmountShell, finalizeShellReady, getShellStatus
 * @provides getMetrics, healthCheck, info, injectPorts, getPortsSnapshot
 *
 * @browserAPI document.body.appendChild, document.getElementById
 *
 * @description
 * Shell mounting and unmounting operations. Creates base shell structure,
 * regions, and applies initial visual effects.
 * v3.3.0: Removed compatibility layer - legacy containers no longer created.
 * v3.3.1: Added getShellStatus for index.js compatibility.
 *
 * @example
 * import { mountShell, unmountShell, finalizeShellReady } from './mount.js';
 * await mountShell();
 * finalizeShellReady();
 * ============================================================================
 */
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { markMounted, markUnmounting, reset as resetLifecycle } from './lifecycle.js';
import { setMounted, setReady, getState } from '../state/store.js';
import { createBaseShell, createRegions } from '../ui/template.js';
import { applyInitialEffects, resetTransitions } from '../ui/transitions.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '3.3.1-EXPORT-FIX';
export const MODULE_ID = 'app-shell-mount';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPortsSnapshot() { return Ports.snapshot(); }

const _metrics = { mounts: 0, unmounts: 0, finalizes: 0, errors: 0 };

export function mountShell(options?: DynObj) {
  _initPorts();
  options = options || {};

  return new Promise(resolve => {
    try {
      const shell = createBaseShell();
      createRegions(shell);

      if (!document.getElementById('app-shell')) {
        document.body.appendChild(shell);
      }

      applyInitialEffects();
      markMounted();
      setMounted(true);

      _metrics.mounts++;

      resolve({ ok: true, shell });
    } catch (e: any) {
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  });
}

export function unmountShell() {
  _initPorts();

  return new Promise(resolve => {
    try {
      markUnmounting();
      resetTransitions();

      const shell = document.getElementById('app-shell');
      if (shell && shell.parentNode) {
        shell.parentNode.removeChild(shell);
      }

      setMounted(false);
      setReady(false);
      resetLifecycle();

      _metrics.unmounts++;

      resolve({ ok: true });
    } catch (e: any) {
      _metrics.errors++;
      resolve({ ok: false, error: e.message });
    }
  });
}

export function finalizeShellReady() {
  _initPorts();

  try {
    const shell = document.getElementById('app-shell');
    if (shell) {
      shell.classList.add('ready');
      shell.setAttribute('data-ready', 'true');
    }

    setReady(true);
    _metrics.finalizes++;

    return { ok: true };
  } catch (e: any) {
    _metrics.errors++;
    return { ok: false, error: e.message };
  }
}

// Returns current shell status for index.js AppShell.getStatus()
export function getShellStatus() {
  const state = getState();
  const shellExists = typeof document !== 'undefined' && !!document.getElementById('app-shell');

  return {
    mounted: state.mounted || false,
    ready: state.ready || false,
    shellExists,
    phase: state.phase || 'idle',
    metrics: Object.assign({}, _metrics),
    timestamp: Date.now()
  };
}

export function getMetrics() {
  return Object.assign({}, _metrics);
}

export function healthCheck() {
  const portsSnapshot = Ports.snapshot();
  const shellExists = !!document.getElementById('app-shell');

  const checks = {
    shellMounted: shellExists,
    noErrors: _metrics.errors === 0,
    portsInitialized: portsSnapshot._initialized
  };

  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if ((checks as DynObj)[keys[i]]) passed++;
  }

  return {
    status: passed === keys.length ? 'HEALTHY' : 'DEGRADED',
    score: `${passed}/${keys.length}`,
    checks,
    shellExists,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  const portsSnapshot = Ports.snapshot();

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    shellExists: !!document.getElementById('app-shell'),
    metrics: getMetrics(),
    portsStatus: { initialized: portsSnapshot._initialized },
    timestamp: Date.now()
  };
}

export default {
  VERSION,
  MODULE_ID,
  mountShell,
  unmountShell,
  finalizeShellReady,
  getShellStatus,
  getMetrics,
  healthCheck,
  info,
  injectPorts,
  getPortsSnapshot
};
