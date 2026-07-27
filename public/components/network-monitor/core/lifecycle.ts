// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P20)
// ═══════════════════════════════════════════════════════════════
// MODULE: network-monitor-lifecycle
// PURPOSE: Network Monitor Lifecycle
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   networkStore from ../state/store.js
//   NetworkDetector from ./detector.js
//   trackNetworkEvent from ../telemetry/tracker.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   NetworkLifecycle — exported value
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


import networkStore from '../state/store.js';

import NetworkDetector from './detector.js';
import { trackNetworkEvent } from '../telemetry/tracker.js';

export const MODULE_ID = 'network-monitor-lifecycle';
export const VERSION = '1.0.1-P20';

let initialized = false;
let healthCheckInterval: ReturnType<typeof setInterval> | null = null;

export const NetworkLifecycle = {
  async init(options: Record<string, unknown>) {
    options = options || {};
    if (initialized) return false;
    trackNetworkEvent('network:lifecycle:init:start');
    // @ts-expect-error TS migration - TS2339
    NetworkDetector.detect();
    // @ts-expect-error TS migration - TS2339
    NetworkDetector.startListeners();
    if (options.healthCheckInterval && options.healthCheckUrl) {
      // @ts-expect-error TS migration - TS2339
      healthCheckInterval = setInterval(() => { NetworkDetector.checkConnectivity(options.healthCheckUrl); }, options.healthCheckInterval);
    }
    initialized = true;
    trackNetworkEvent('network:lifecycle:init:complete');
    return true;
  },
  shutdown() {
    trackNetworkEvent('network:lifecycle:shutdown:start');
    // @ts-expect-error TS migration - TS2339
    NetworkDetector.stopListeners();
    if (healthCheckInterval) { clearInterval(healthCheckInterval); healthCheckInterval = null; }
    initialized = false;
    trackNetworkEvent('network:lifecycle:shutdown:complete');
    return true;
  },
  // @ts-expect-error TS migration - TS2339
  reset() { trackNetworkEvent('network:lifecycle:reset'); NetworkDetector.detect(); return true; },
  isInitialized() { return initialized; },
  // @ts-expect-error TS migration - TS2339, TS2551
  getStatus() { return { initialized, online: networkStore.isOnline(), connectionInfo: networkStore.getConnectionInfo(), lastCheck: networkStore.get('lastCheck') }; }
};

export default NetworkLifecycle;
