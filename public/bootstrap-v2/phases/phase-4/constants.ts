// Phase 4 Constants
// @version 4.2.1-CONTRACTS
// @changelog v4.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v4.2.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v4.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: VERSION, MODULE_ID, BOOT_CONFIG
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export var VERSION = '4.2.1-CONTRACTS';
export var MODULE_ID = 'phase-4-main';

// Boot configuration for container-main Bootstrap (56+ managers)
export var BOOT_CONFIG = Object.freeze({
  autoStart: true,
  enableLazyLoading: true,
  waitForLazyComponents: false,
  enablePerformanceMonitor: true,
  enableFallbackSystem: true,
  enablePlugins: true,
  enableLifecycleHooks: true,
  enableBootMetrics: true,
  enableEventBusAdapter: true,
  enableStateSnapshots: true,
  enableDebugMode: false,
  enableConfigPersistence: true,
  enableSlotPresets: true,
  enableSanitizer: true,
  enableRateLimiter: true,
  enableDevToolsPanel: false,
  enableWorkerManager: true,
  enableConsoleCommands: false,
  enableTelemetryDashboard: false,
  enableRequestQueue: true,
  enableCacheManager: true,
  enableEventRecorder: false,
  enableNotificationManager: true,
  enableFormValidator: true,
  enableStorageManager: true,
  enableClipboardManager: true,
  enableDragDropManager: true,
  enableModalManager: true,
  enableTooltipManager: true,
  enableContextMenuManager: true,
  enableHotkeyManager: true,
  enableScrollManager: true,
  enableFocusManager: true,
  enableUndoManager: true,
  enableThemeManager: true,
  enableAnimationManager: true,
  enableMediaQueryManager: true,
  enableIntersectionManager: true,
  enableResizeManager: true,
  enableMutationManager: true,
  enablePermissionManager: true,
  enableNetworkManager: true,
  enableGeolocationManager: false,
  enableDeviceManager: true,
  enableBatteryManager: true,
  enableFullscreenManager: true,
  enableVisibilityManager: true,
  enableWakeLockManager: false,
  enableShareManager: true
});

export default {
  VERSION,
  MODULE_ID,
  BOOT_CONFIG
};
