// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: getters
// PURPOSE: Bootstrap Getters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   GlobalStateAdapter from ../adapters/global-state-adapter.js
//
// PROVIDES:
//   createGetters() — exported function
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

import GlobalStateAdapter from '../adapters/global-state-adapter.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap-integration.getters';

export function createGetters(context: Record<string, unknown>) {
  const managers = context.managers as import("./types.js").ManagerRef;
  const getState = context.getState as (...args: unknown[]) => unknown;
  const kernel = context.kernel as import("./types.js").ManagerRef | null;
  const eventBus = context.eventBus as import("./types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("./types.js").ManagerRef | null;
  const errors = context.errors as unknown[];
  const config = context.config as Record<string, unknown>;

  return {
    getState,
    getKernel: () => kernel,
    getEventBus: () => eventBus,
    getEventBusAdapter: () => managers.get('eventBusAdapter'),
    getManager: (name: string) => kernel?.getManager(name) || null,
    getBootMetrics: () => bootMetrics,
    getErrors: () => [...errors],
    getLogger: () => managers.get('logger'),
    getGlobalState: () => GlobalStateAdapter,
    getConfig: () => ({ ...config }),
    // Phase 2
    getPerformanceMonitor: () => managers.get('performanceMonitor'),
    getFallbackSystem: () => managers.get('fallbackSystem'),
    // Phase 4
    getPluginSystem: () => managers.get('pluginSystem'),
    getLifecycleHooks: () => managers.get('lifecycleHooks'),
    getStateSnapshots: () => managers.get('stateSnapshots'),
    getDebugMode: () => managers.get('debugMode'),
    getConfigPersistence: () => managers.get('configPersistence'),
    getSlotPresets: () => managers.get('slotPresets'),
    // Phase 5
    getSanitizer: () => managers.get('sanitizer'),
    getRateLimiter: () => managers.get('rateLimiter'),
    getDevToolsPanel: () => managers.get('devToolsPanel'),
    getWorkerManager: () => managers.get('workerManager'),
    getConsoleCommands: () => managers.get('consoleCommands'),
    getTelemetryDashboard: () => managers.get('telemetryDashboard'),
    getRequestQueue: () => managers.get('requestQueue'),
    getCacheManager: () => managers.get('cacheManager'),
    getEventRecorder: () => managers.get('eventRecorder'),
    // Phase 6
    getNotificationManager: () => managers.get('notificationManager'),
    getFormValidator: () => managers.get('formValidator'),
    getStorageManager: () => managers.get('storageManager'),
    getClipboardManager: () => managers.get('clipboardManager'),
    getDragDropManager: () => managers.get('dragDropManager'),
    getModalManager: () => managers.get('modalManager'),
    getTooltipManager: () => managers.get('tooltipManager'),
    getContextMenuManager: () => managers.get('contextMenuManager'),
    getHotkeyManager: () => managers.get('hotkeyManager'),
    getScrollManager: () => managers.get('scrollManager'),
    getFocusManager: () => managers.get('focusManager'),
    getUndoManager: () => managers.get('undoManager'),
    getThemeManager: () => managers.get('themeManager'),
    getAnimationManager: () => managers.get('animationManager'),
    getMediaQueryManager: () => managers.get('mediaQueryManager'),
    getIntersectionManager: () => managers.get('intersectionManager'),
    getResizeManager: () => managers.get('resizeManager'),
    getMutationManager: () => managers.get('mutationManager'),
    // Phase 7
    getPermissionManager: () => managers.get('permissionManager'),
    getNetworkManager: () => managers.get('networkManager'),
    getGeolocationManager: () => managers.get('geolocationManager'),
    getDeviceManager: () => managers.get('deviceManager'),
    getBatteryManager: () => managers.get('batteryManager'),
    getFullscreenManager: () => managers.get('fullscreenManager'),
    getVisibilityManager: () => managers.get('visibilityManager'),
    getWakeLockManager: () => managers.get('wakeLockManager'),
    getShareManager: () => managers.get('shareManager')
  };
}

export default { createGetters };
