import { createPermissionManager } from "../../utils/permission-manager.js";
import { createNetworkManager } from "../../utils/network-manager.js";
import { createGeolocationManager } from "../../utils/geolocation-manager.js";
import { createDeviceManager } from "../../utils/device-manager.js";
import { createBatteryManager } from "../../utils/battery-manager.js";
import { createFullscreenManager } from "../../utils/fullscreen-manager.js";
import { createVisibilityManager } from "../../utils/visibility-manager.js";
import { createWakeLockManager } from "../../utils/wake-lock-manager.js";
import { createShareManager } from "../../utils/share-manager.js";
import { registerLoaded } from "../../core/dependency-map.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.phases.phase7-device";
async function initPhase7(context) {
  const config = context.config;
  const bootMetrics = context.bootMetrics;
  const logger = context.logger;
  bootMetrics?.startPhase("phase7");
  logger?.debug("Phase 7 starting...");
  let permissionManager = null, networkManager = null, geolocationManager = null;
  let deviceManager = null, batteryManager = null, fullscreenManager = null;
  let visibilityManager = null, wakeLockManager = null, shareManager = null;
  if (config.enablePermissionManager) {
    permissionManager = createPermissionManager({});
    registerLoaded("permission-manager");
  }
  if (config.enableNetworkManager) {
    networkManager = createNetworkManager({ pingInterval: 3e4 });
    registerLoaded("network-manager");
  }
  if (config.enableGeolocationManager) {
    geolocationManager = createGeolocationManager({ enableHighAccuracy: true });
    registerLoaded("geolocation-manager");
  }
  if (config.enableDeviceManager) {
    deviceManager = createDeviceManager({});
    registerLoaded("device-manager");
  }
  if (config.enableBatteryManager) {
    batteryManager = createBatteryManager({ lowThreshold: 0.2, criticalThreshold: 0.1 });
    registerLoaded("battery-manager");
  }
  if (config.enableFullscreenManager) {
    fullscreenManager = createFullscreenManager({});
    registerLoaded("fullscreen-manager");
  }
  if (config.enableVisibilityManager) {
    visibilityManager = createVisibilityManager({});
    registerLoaded("visibility-manager");
  }
  if (config.enableWakeLockManager) {
    wakeLockManager = createWakeLockManager({ autoReacquire: true });
    registerLoaded("wake-lock-manager");
  }
  if (config.enableShareManager) {
    shareManager = createShareManager({ fallbackToClipboard: true });
    registerLoaded("share-manager");
  }
  bootMetrics?.endPhase("phase7");
  logger?.debug("Phase 7 ready");
  return {
    permissionManager,
    networkManager,
    geolocationManager,
    deviceManager,
    batteryManager,
    fullscreenManager,
    visibilityManager,
    wakeLockManager,
    shareManager
  };
}
var phase7_device_default = { initPhase7 };
export {
  MODULE_ID,
  VERSION,
  phase7_device_default as default,
  initPhase7
};
