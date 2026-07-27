// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: device
// PURPOSE: Bootstrap Helpers - Device & Browser APIs
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createDeviceHelpers() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.helpers.device';

export function createDeviceHelpers(refs: Record<string, unknown>) {
  const r = refs as Record<string, import('../types.js').ManagerRef | null>;
  return {
    // Permissions
    queryPermission(permission: string) { return r.permissionManager?.query(permission); },
    requestPermission(permission: string) { return r.permissionManager?.request(permission); },
    // Network
    isOnline() { return r.networkManager?.isOnline() ?? navigator.onLine; },
    isOffline() { return r.networkManager?.isOffline() ?? !navigator.onLine; },
    onOnline(callback: (...args: unknown[]) => void) { return r.networkManager?.onOnline(callback); },
    onOffline(callback: (...args: unknown[]) => void) { return r.networkManager?.onOffline(callback); },
    getNetworkInfo() { return r.networkManager?.getConnectionInfo(); },
    // Geolocation
    getCurrentPosition(options: Record<string, unknown>) { return r.geolocationManager?.getCurrentPosition(options); },
    watchPosition(callback: (...args: unknown[]) => void, errorCallback: unknown, options: Record<string, unknown>) { return r.geolocationManager?.watchPosition(callback, errorCallback, options); },
    // Device
    getDeviceType() { return r.deviceManager?.getDeviceType(); },
    getDeviceInfo() { return r.deviceManager?.getFullInfo(); },
    isMobile() { return r.deviceManager?.isMobile() ?? false; },
    isTouch() { return r.deviceManager?.isTouch() ?? false; },
    // Battery
    getBatteryLevel() { return r.batteryManager?.getLevelPercent(); },
    isBatteryCharging() { return r.batteryManager?.isCharging(); },
    onBatteryLow(callback: (...args: unknown[]) => void) { return r.batteryManager?.onLow(callback); },
    // Fullscreen
    enterFullscreen(element: HTMLElement) { return r.fullscreenManager?.enter(element); },
    exitFullscreen() { return r.fullscreenManager?.exit(); },
    toggleFullscreen(element: HTMLElement) { return r.fullscreenManager?.toggle(element); },
    isFullscreen() { return r.fullscreenManager?.isFullscreen() ?? false; },
    // Visibility
    isPageVisible() { return r.visibilityManager?.isVisible() ?? true; },
    onPageVisible(callback: (...args: unknown[]) => void) { return r.visibilityManager?.onVisible(callback); },
    onPageHidden(callback: (...args: unknown[]) => void) { return r.visibilityManager?.onHidden(callback); },
    // Wake Lock
    acquireWakeLock() { return r.wakeLockManager?.acquire(); },
    releaseWakeLock() { return r.wakeLockManager?.release(); },
    // Share
    share(data: Record<string, unknown>) { return r.shareManager?.share(data); },
    shareTo(target: HTMLElement, data: Record<string, unknown>) { return r.shareManager?.shareTo(target, data); }
  };
}

export default { createDeviceHelpers };
