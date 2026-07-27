import networkStore from "../state/store.js";
import NetworkDetector from "./detector.js";
import { trackNetworkEvent } from "../telemetry/tracker.js";
const MODULE_ID = "network-monitor-lifecycle";
const VERSION = "1.0.1-P20";
let initialized = false;
let healthCheckInterval = null;
const NetworkLifecycle = {
  async init(options) {
    options = options || {};
    if (initialized) return false;
    trackNetworkEvent("network:lifecycle:init:start");
    NetworkDetector.detect();
    NetworkDetector.startListeners();
    if (options.healthCheckInterval && options.healthCheckUrl) {
      healthCheckInterval = setInterval(() => {
        NetworkDetector.checkConnectivity(options.healthCheckUrl);
      }, options.healthCheckInterval);
    }
    initialized = true;
    trackNetworkEvent("network:lifecycle:init:complete");
    return true;
  },
  shutdown() {
    trackNetworkEvent("network:lifecycle:shutdown:start");
    NetworkDetector.stopListeners();
    if (healthCheckInterval) {
      clearInterval(healthCheckInterval);
      healthCheckInterval = null;
    }
    initialized = false;
    trackNetworkEvent("network:lifecycle:shutdown:complete");
    return true;
  },
  // @ts-expect-error TS migration - TS2339
  reset() {
    trackNetworkEvent("network:lifecycle:reset");
    NetworkDetector.detect();
    return true;
  },
  isInitialized() {
    return initialized;
  },
  // @ts-expect-error TS migration - TS2339, TS2551
  getStatus() {
    return { initialized, online: networkStore.isOnline(), connectionInfo: networkStore.getConnectionInfo(), lastCheck: networkStore.get("lastCheck") };
  }
};
var lifecycle_default = NetworkLifecycle;
export {
  MODULE_ID,
  NetworkLifecycle,
  VERSION,
  lifecycle_default as default
};
