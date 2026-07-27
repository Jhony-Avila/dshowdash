const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.helpers.device";
function createDeviceHelpers(refs) {
  const r = refs;
  return {
    // Permissions
    queryPermission(permission) {
      return r.permissionManager?.query(permission);
    },
    requestPermission(permission) {
      return r.permissionManager?.request(permission);
    },
    // Network
    isOnline() {
      return r.networkManager?.isOnline() ?? navigator.onLine;
    },
    isOffline() {
      return r.networkManager?.isOffline() ?? !navigator.onLine;
    },
    onOnline(callback) {
      return r.networkManager?.onOnline(callback);
    },
    onOffline(callback) {
      return r.networkManager?.onOffline(callback);
    },
    getNetworkInfo() {
      return r.networkManager?.getConnectionInfo();
    },
    // Geolocation
    getCurrentPosition(options) {
      return r.geolocationManager?.getCurrentPosition(options);
    },
    watchPosition(callback, errorCallback, options) {
      return r.geolocationManager?.watchPosition(callback, errorCallback, options);
    },
    // Device
    getDeviceType() {
      return r.deviceManager?.getDeviceType();
    },
    getDeviceInfo() {
      return r.deviceManager?.getFullInfo();
    },
    isMobile() {
      return r.deviceManager?.isMobile() ?? false;
    },
    isTouch() {
      return r.deviceManager?.isTouch() ?? false;
    },
    // Battery
    getBatteryLevel() {
      return r.batteryManager?.getLevelPercent();
    },
    isBatteryCharging() {
      return r.batteryManager?.isCharging();
    },
    onBatteryLow(callback) {
      return r.batteryManager?.onLow(callback);
    },
    // Fullscreen
    enterFullscreen(element) {
      return r.fullscreenManager?.enter(element);
    },
    exitFullscreen() {
      return r.fullscreenManager?.exit();
    },
    toggleFullscreen(element) {
      return r.fullscreenManager?.toggle(element);
    },
    isFullscreen() {
      return r.fullscreenManager?.isFullscreen() ?? false;
    },
    // Visibility
    isPageVisible() {
      return r.visibilityManager?.isVisible() ?? true;
    },
    onPageVisible(callback) {
      return r.visibilityManager?.onVisible(callback);
    },
    onPageHidden(callback) {
      return r.visibilityManager?.onHidden(callback);
    },
    // Wake Lock
    acquireWakeLock() {
      return r.wakeLockManager?.acquire();
    },
    releaseWakeLock() {
      return r.wakeLockManager?.release();
    },
    // Share
    share(data) {
      return r.shareManager?.share(data);
    },
    shareTo(target, data) {
      return r.shareManager?.shareTo(target, data);
    }
  };
}
var device_default = { createDeviceHelpers };
export {
  MODULE_ID,
  VERSION,
  createDeviceHelpers,
  device_default as default
};
