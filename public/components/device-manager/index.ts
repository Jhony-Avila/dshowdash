

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.device-manager
// PURPOSE: Main device manager for device registration and management
// ───────────────────────────────────────────────────────────────
// @contract INIT - init() initializes device manager and registers device
// @contract DESTROY - destroy() destroys device manager and cleans up
// @contract RESET - reset() resets device manager and clears stored data
// @contract LIST - list() lists all user devices
// @contract GET_CURRENT - getCurrent() gets current device info
// @contract REGISTER - register(customName) registers device with optional name
// @contract SET_TRUST - setTrust(deviceId, trustLevel) sets device trust level
// @contract RENAME - rename(deviceId, newName) renames a device
// @contract REMOVE - remove(deviceId) removes a device
// @contract ON - on(event, callback) registers event listener
// @contract OFF - off(event, callback) removes event listener
// @contract GET_DEVICES - getDevices() returns cached devices list
// @contract GET_CURRENT_DEVICE - getCurrentDevice() returns cached current device
// @contract GET_DEVICE_ID - getDeviceId() generates/retrieves device ID
// @contract IS_INITIALIZED - isInitialized() returns initialization status
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: DEVICE_EVENTS from /core/runtime/events/index.js
// IMPORTS: isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
// IMPORTS: generateDeviceId, detectDeviceType, detectBrowser, detectOS,
//          clearStoredData, hasDeviceId, hasFingerprint, getStoredDeviceId
//          from ./device-detection.js
// IMPORTS: listDevices, getCurrentDevice, registerDevice, setDeviceTrust,
//          renameDevice, removeDevice, trackTelemetry from ./api-operations.js
// PROVIDES: DeviceManager, VERSION, MODULE_ID, injectPorts, getPorts
// @changelog v3.7.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v3.6.0-STRICT-MODE: Strict mode migration (conditional window exposure)
// @changelog v3.5.0: ContextProvider integration
// @changelog v3.4.0-ENTERPRISE: ES6 modernization
// @changelog P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { DEVICE_EVENTS } from '/core/runtime/events/catalog/device.events.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import {
  generateDeviceId,
  detectDeviceType,
  detectBrowser,
  detectOS,
  clearStoredData,
  hasDeviceId,
  hasFingerprint,
  getStoredDeviceId
} from './device-detection.js';
import {
  listDevices,
  getCurrentDevice,
  registerDevice,
  setDeviceTrust,
  renameDevice,
  removeDevice,
  trackTelemetry
} from './api-operations.js';

export const VERSION = '3.7.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.device-manager';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => Ports.init();
const _getPort = (name: string): Record<string, unknown> | undefined => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>): unknown => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _debug = () => {
  const config = _getPort('config') as { app?: { debug?: boolean } } | undefined;
  return config?.app?.debug;
};

const log = (level: string, ...args: unknown[]): void => {
  const logger = _getPort('logger') as { error?: (...a: unknown[]) => void; warn?: (...a: unknown[]) => void; debug?: (...a: unknown[]) => void } | undefined;
  if (!logger) return;
  if (level === 'error') {
    logger.error?.(`[${MODULE_ID}]`, ...args);
  } else if (level === 'warn') {
    logger.warn?.(`[${MODULE_ID}]`, ...args);
  } else if (_debug()) {
    logger.debug?.(`[${MODULE_ID}]`, ...args);
  }
};

const DeviceManager = (() => {
  let devices: Record<string, unknown>[] = [];
  let currentDevice: Record<string, unknown> | null = null;
  let isInitialized = false;
  const abortController: { current: AbortController | null } = { current: null };
  const listeners = new Map<string, Set<(data: Record<string, unknown>) => void>>();
  const _metrics: Record<string, number> = {
    registerCount: 0,
    listCount: 0,
    errorCount: 0,
    lastActivity: 0
  };

  const emit = (event: string, data: Record<string, unknown>): void => {
    const localEvent = event.indexOf('device:') === 0 ? event.replace('device:', '') : event;

    if (listeners.has(localEvent)) {
      // @ts-expect-error strict migration — TS2532
      for (const fn of listeners.get(localEvent)) {
        try {
          fn(data);
        } catch (e) {
          log('error', 'Listener error:', e);
        }
      }
    }

    const eb = _getPort('eventBus') as { emit?: (name: string, payload: Record<string, unknown>) => void } | undefined;
    const eventName = event.indexOf('device:') === 0 ? event : `device:${event}`;
    if (hasWindow && eb?.emit) {
      eb.emit(eventName, data);
    }
  };

  const on = (event: string, callback: (data: Record<string, unknown>) => void): (() => void) => {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    // @ts-expect-error strict migration — TS2532
    listeners.get(event).add(callback);
    // @ts-expect-error strict migration — TS2532
    return () => listeners.get(event).delete(callback);
  };

  const off = (event: string, callback?: (data: Record<string, unknown>) => void): void => {
    if (listeners.has(event)) {
      if (callback) {
        // @ts-expect-error strict migration — TS2532
        listeners.get(event).delete(callback);
      } else {
        listeners.delete(event);
      }
    }
  };

  const list = () =>
    listDevices(abortController, _metrics, emit).then((d: unknown[]) => {
      devices = d as Record<string, unknown>[];
      return d;
    });

  const getCurrent = () =>
    getCurrentDevice(abortController, _metrics, emit).then((d: Record<string, unknown> | null) => {
      currentDevice = d;
      return d;
    });

  const register = (customName?: string) =>
    registerDevice(customName, abortController, _metrics, emit);

  const setTrust = (deviceId: string, trustLevel: string) =>
    setDeviceTrust(deviceId, trustLevel, abortController, _metrics, emit);

  const rename = (deviceId: string, newName: string) =>
    renameDevice(deviceId, newName, abortController, _metrics, emit);

  const remove = (deviceId: string) =>
    removeDevice(deviceId, abortController, _metrics, emit).then((data) => {
      devices = devices.filter((d) => d.id != deviceId);
      return data;
    });

  const init = () => {
    if (!hasWindow) return Promise.resolve(false);
    if (isInitialized) return Promise.resolve(true);

    _initPorts();
    abortController.current = new AbortController();

    return register()
      .then(() => {
        isInitialized = true;
        trackTelemetry('ready', { initialized: true }, _metrics);
        emit(DEVICE_EVENTS.READY, { initialized: true });
        log('info', `${VERSION} initialized`);
        return true;
      })
      .catch((error) => {
        log('error', 'Init error:', error);
        emit(DEVICE_EVENTS.ERROR, { action: 'init', error: error.message });
        return false;
      });
  };

  const destroy = () => {
    if (abortController.current) {
      abortController.current.abort();
      abortController.current = null;
    }
    listeners.clear();
    devices = [];
    currentDevice = null;
    isInitialized = false;
    log('info', 'Destroyed');
  };

  const reset = () => {
    if (!hasWindow) return;
    destroy();
    clearStoredData();
    log('info', 'Reset complete');
  };

  const healthCheck = () => {
    const checks = {
      hasWindow,
      initialized: isInitialized,
      hasDeviceId: hasDeviceId(),
      hasFingerprint: hasFingerprint(),
      hasCurrentDevice: !!currentDevice,
      abortControllerActive: !!abortController.current && !abortController.current.signal.aborted,
      portsInitialized: Ports.isInitialized()
    };

    const issues = [];
    let passed = 0;

    for (const [key, value] of Object.entries(checks)) {
      if (value) passed++;
      else issues.push(key);
    }

    const total = Object.keys(checks).length;
    const status = passed === total ? 'HEALTHY' : passed >= total * 0.6 ? 'DEGRADED' : 'UNHEALTHY';

    return {
      status,
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      issues: issues.length > 0 ? issues : null,
      portsInitialized: Ports.isInitialized(),
      metrics: { ..._metrics },
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  };

  const getStatus = () => ({
    name: MODULE_ID,
    version: VERSION,
    initialized: isInitialized,
    deviceCount: devices.length,
    currentDevice: currentDevice ? { id: currentDevice.id, name: currentDevice.device_name } : null,
    deviceId: getStoredDeviceId(),
    metrics: { ..._metrics }
  });

  const info = () => ({
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: isInitialized,
    portsInitialized: Ports.isInitialized(),
    deviceType: detectDeviceType(),
    browser: detectBrowser(),
    os: detectOS(),
    deviceId: getStoredDeviceId(),
    metrics: { ..._metrics },
    timestamp: Date.now()
  });

  const getMetrics = () => ({ ..._metrics });

  return {
    init,
    destroy,
    reset,
    list,
    getCurrent,
    register,
    setTrust,
    rename,
    remove,
    on,
    off,
    getDevices: () => devices.slice(),
    getCurrentDevice: () => currentDevice,
    getDeviceId: generateDeviceId,
    isInitialized: () => isInitialized,
    healthCheck,
    getStatus,
    info,
    getMetrics,
    getVersion: () => VERSION,
    injectPorts,
    getPorts,
    TRUST_LEVELS: ['unknown', 'low', 'medium', 'high', 'trusted'],
    VERSION,
    MODULE_ID
  };
})();

if (hasWindow) {
  const strictMode = isStrict();
  if (!strictMode) {
    (window as unknown as Record<string, unknown>).DeviceManager = DeviceManager;
  } else {
    recordViolation('GLOBAL_EXPOSURE_BLOCKED', { module: MODULE_ID, target: 'window.DeviceManager' });
  }
  // DevTools sempre permitido
  window.__dev = window.__dev || {};
  window.__dev.deviceManager = DeviceManager;
}

export default DeviceManager;
export { DeviceManager };
