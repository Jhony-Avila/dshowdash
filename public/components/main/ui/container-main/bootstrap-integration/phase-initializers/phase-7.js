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
const MODULE_ID = "main.ui.container-main.bootstrap-integration.phase-initializers.phase-7";
async function initPhase7(context) {
  const config = context.config;
  const bootMetrics = context.bootMetrics;
  const managers = context.managers;
  const logger = context.logger;
  bootMetrics?.startPhase("phase7");
  logger?.debug("Phase 7 starting...");
  if (config.enablePermissionManager) {
    managers.set("permissionManager", createPermissionManager({}));
    registerLoaded("permission-manager");
  }
  if (config.enableNetworkManager) {
    managers.set("networkManager", createNetworkManager({ pingInterval: 3e4 }));
    registerLoaded("network-manager");
  }
  if (config.enableGeolocationManager) {
    managers.set("geolocationManager", createGeolocationManager({ enableHighAccuracy: true }));
    registerLoaded("geolocation-manager");
  }
  if (config.enableDeviceManager) {
    managers.set("deviceManager", createDeviceManager({}));
    registerLoaded("device-manager");
  }
  if (config.enableBatteryManager) {
    managers.set("batteryManager", createBatteryManager({ lowThreshold: 0.2, criticalThreshold: 0.1 }));
    registerLoaded("battery-manager");
  }
  if (config.enableFullscreenManager) {
    managers.set("fullscreenManager", createFullscreenManager({}));
    registerLoaded("fullscreen-manager");
  }
  if (config.enableVisibilityManager) {
    managers.set("visibilityManager", createVisibilityManager({}));
    registerLoaded("visibility-manager");
  }
  if (config.enableWakeLockManager) {
    managers.set("wakeLockManager", createWakeLockManager({ autoReacquire: true }));
    registerLoaded("wake-lock-manager");
  }
  if (config.enableShareManager) {
    managers.set("shareManager", createShareManager({ fallbackToClipboard: true }));
    registerLoaded("share-manager");
  }
  bootMetrics?.endPhase("phase7");
  logger?.debug("Phase 7 ready");
}
var phase_7_default = { initPhase7 };
export {
  MODULE_ID,
  VERSION,
  phase_7_default as default,
  initPhase7
};
