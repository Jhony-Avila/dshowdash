// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.device-manager.ports
// PURPOSE: Ports management and media device permissions for device manager
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(ctx) initializes ports with optional context
// @contract CLEANUP - cleanup() releases all devices and resets state
// @contract REQUEST_DEVICE - requestDevice(type) requests camera/microphone access
// @contract GET_PERMISSION - getPermission(type) returns permission status
// @contract GET_DEVICE - getDevice(type) returns active device stream
// @contract RELEASE_DEVICE - releaseDevice(type) stops and releases device
// @contract HAS_WINDOW - hasWindow constant for SSR checks
// @contract GET_PORT - getPort(name) retrieves a port by name
// @contract LOG - log(level, ...args) logging function
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: DEVICE_EVENTS from /core/runtime/events/index.js
// PROVIDES: hasWindow, getPort, log, init, cleanup, requestDevice, getPermission,
//           getDevice, releaseDevice, healthCheck, info, injectPorts, getPorts,
//           VERSION, MODULE_ID
// @changelog v2.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.2.0-P18EC: Events Contracts Migration
// @changelog P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { DEVICE_EVENTS } from '/core/runtime/events/catalog/device.events.js';

export const MODULE_ID = 'components.device-manager.ports';
export const VERSION = '2.3.0-P2-ENTERPRISE';

export const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() {
  Ports.init();
}

function _getPort(name: string): unknown {
  return Ports.get(name);
}

export function injectPorts(p: Record<string, unknown>): unknown {
  return Ports.inject(p);
}

export function getPorts() {
  return Ports.snapshot();
}

// Export getPort for use by other modules
export function getPort(name: string): unknown {
  return _getPort(name);
}

// Export log for use by other modules
export function log(level: string, ...args: unknown[]): void {
  const logger = _getPort('logger') as { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void } | undefined;
  if (!logger) return;
  const config = _getPort('config') as { app?: { debug?: boolean } } | undefined;
  const debug = config?.app?.debug;

  if (level === 'error') {
    logger.error?.(`[${MODULE_ID}]`, ...args);
  } else if (level === 'warn') {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
  } else if (debug) {
    logger.debug?.(`[${MODULE_ID}]`, ...args);
  }
}

const _state: {
  initialized: boolean;
  devices: Record<string, MediaStream>;
  permissions: Record<string, string>;
} = {
  initialized: false,
  devices: {},
  permissions: {}
};

const _metrics = {
  requests: 0,
  granted: 0,
  denied: 0
};

function _emit(eventName: string, data: Record<string, unknown>): void {
  const eb = _getPort('eventBus') as { emit?: (name: string, payload: Record<string, unknown>) => void } | undefined;
  if (eb && eb.emit) {
    eb.emit(eventName, { source: MODULE_ID, ...(data || {}) });
  }
}

export function requestDevice(type: string): Promise<{ ok: boolean; stream?: MediaStream; reason?: string; error?: string }> {
  _metrics.requests++;

  return new Promise(resolve => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices) {
      _metrics.denied++;
      resolve({ ok: false, reason: 'MediaDevices not available' });
      return;
    }

    const constraints: MediaStreamConstraints = {};
    if (type === 'camera' || type === 'video') constraints.video = true;
    if (type === 'microphone' || type === 'audio') constraints.audio = true;

    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        _metrics.granted++;
        _state.devices[type] = stream;
        _state.permissions[type] = 'granted';
        _emit(DEVICE_EVENTS.GRANTED, { type });
        resolve({ ok: true, stream });
      })
      .catch(error => {
        _metrics.denied++;
        _state.permissions[type] = 'denied';
        _emit(DEVICE_EVENTS.DENIED, { type, error: error.message });
        resolve({ ok: false, error: error.message });
      });
  });
}

export function getPermission(type: string): string {
  return _state.permissions[type] || 'unknown';
}

export function getDevice(type: string): MediaStream | null {
  return _state.devices[type] || null;
}

export function releaseDevice(type: string): { ok: boolean; reason?: string } {
  if (_state.devices[type]) {
    const stream = _state.devices[type];
    for (const track of stream.getTracks()) {
      track.stop();
    }
    delete _state.devices[type];
    _emit(DEVICE_EVENTS.RELEASED, { type });
    return { ok: true };
  }
  return { ok: false, reason: 'Device not found' };
}

export function init(ctx?: { ports?: Record<string, unknown> }): { ok: boolean; alreadyInitialized?: boolean; version?: string } {
  if (_state.initialized) {
    return { ok: true, alreadyInitialized: true };
  }
  _initPorts();
  if (ctx && ctx.ports) {
    injectPorts(ctx.ports);
  }
  _state.initialized = true;
  return { ok: true, version: VERSION };
}

export function cleanup() {
  for (const type of Object.keys(_state.devices)) {
    releaseDevice(type);
  }
  _state.devices = {};
  _state.permissions = {};
  _state.initialized = false;
  return { ok: true };
}

export function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    hasMediaDevices: typeof navigator !== 'undefined' && !!navigator.mediaDevices,
    portsInitialized: Ports.isInitialized()
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    metrics: { ..._metrics },
    activeDevices: Object.keys(_state.devices),
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    activeDevices: Object.keys(_state.devices),
    permissions: { ..._state.permissions },
    metrics: { ..._metrics },
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}

export default {
  MODULE_ID,
  VERSION,
  hasWindow,
  getPort,
  log,
  init,
  cleanup,
  requestDevice,
  getPermission,
  getDevice,
  releaseDevice,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
