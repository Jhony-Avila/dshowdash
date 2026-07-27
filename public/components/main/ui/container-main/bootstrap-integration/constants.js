import { LIMITS, INTERVALS, LOG_LEVELS, isFeatureEnabled, FEATURES, getEnv, ENV } from "../config.js";
import { TYPES } from "../utils/validator.js";
const VERSION = "13.1.0-MODULAR";
const MODULE_ID = "container-main:bootstrap.bootstrap-integration.constants";
const BOOTSTRAP_STATES = Object.freeze({
  IDLE: "idle",
  BOOTING: "booting",
  PHASE1_READY: "phase1-ready",
  PHASE2_READY: "phase2-ready",
  PHASE3_READY: "phase3-ready",
  PHASE4_READY: "phase4-ready",
  PHASE5_READY: "phase5-ready",
  PHASE6_READY: "phase6-ready",
  PHASE7_READY: "phase7-ready",
  KERNEL_READY: "kernel-ready",
  COMPONENTS_READY: "components-ready",
  PLUGINS_READY: "plugins-ready",
  RUNNING: "running",
  ERROR: "error",
  SHUTDOWN: "shutdown"
});
const CONFIG_SCHEMA = {
  cleanupStrategy: { type: TYPES.STRING, enum: ["aggressive", "balanced", "conservative"], default: "balanced" },
  memoryWarningThreshold: { type: TYPES.NUMBER, min: 0.1, max: 1, default: 0.7 },
  memoryCriticalThreshold: { type: TYPES.NUMBER, min: 0.1, max: 1, default: 0.9 },
  maxConcurrentLoads: { type: TYPES.NUMBER, min: 1, max: 20, default: LIMITS.MAX_CONCURRENT_LOADS },
  logLevel: { type: TYPES.NUMBER, min: 0, max: 99, default: LOG_LEVELS.INFO },
  performanceInterval: { type: TYPES.NUMBER, min: 1e3, max: 6e4, default: INTERVALS.MEMORY_CHECK }
};
const DEFAULT_CONFIG = {
  cleanupStrategy: "balanced",
  memoryWarningThreshold: 0.7,
  memoryCriticalThreshold: 0.9,
  maxConcurrentLoads: LIMITS.MAX_CONCURRENT_LOADS,
  enableMetricsPersistence: true,
  enableImageVirtualization: true,
  enableDeprecationWarnings: getEnv() !== ENV.PRODUCTION,
  enableLazyLoading: true,
  waitForLazyComponents: false,
  autoStart: true,
  logLevel: getEnv() === ENV.PRODUCTION ? LOG_LEVELS.WARN : LOG_LEVELS.INFO,
  captureGlobalErrors: true,
  enableGlobalState: isFeatureEnabled(FEATURES.GLOBAL_STATE),
  enablePerformanceMonitor: isFeatureEnabled(FEATURES.PERFORMANCE_MONITOR),
  enableFallbackSystem: isFeatureEnabled(FEATURES.FALLBACK_SYSTEM),
  performanceInterval: INTERVALS.MEMORY_CHECK,
  // Phase 4
  enablePlugins: true,
  enableLifecycleHooks: true,
  enableBootMetrics: true,
  enableEventBusAdapter: true,
  enableStateSnapshots: true,
  enableDebugMode: getEnv() === ENV.DEVELOPMENT,
  enableConfigPersistence: true,
  enableSlotPresets: true,
  // Phase 5 Core
  enableSanitizer: true,
  enableRateLimiter: true,
  enableDevToolsPanel: getEnv() === ENV.DEVELOPMENT,
  enableWorkerManager: true,
  enableConsoleCommands: getEnv() === ENV.DEVELOPMENT,
  enableTelemetryDashboard: getEnv() === ENV.DEVELOPMENT,
  // Phase 5 Extended
  enableRequestQueue: true,
  enableCacheManager: true,
  enableEventRecorder: getEnv() === ENV.DEVELOPMENT,
  // Phase 6 Core
  enableNotificationManager: true,
  enableFormValidator: true,
  enableStorageManager: true,
  enableClipboardManager: true,
  enableDragDropManager: true,
  enableModalManager: true,
  // Phase 6 Extended
  enableTooltipManager: true,
  enableContextMenuManager: true,
  enableHotkeyManager: true,
  enableScrollManager: true,
  enableFocusManager: true,
  enableUndoManager: true,
  // Phase 6 Advanced
  enableThemeManager: true,
  enableAnimationManager: true,
  enableMediaQueryManager: true,
  enableIntersectionManager: true,
  enableResizeManager: true,
  enableMutationManager: true,
  // Phase 7
  enablePermissionManager: true,
  enableNetworkManager: true,
  enableGeolocationManager: true,
  enableDeviceManager: true,
  enableBatteryManager: true,
  enableFullscreenManager: true,
  enableVisibilityManager: true,
  enableWakeLockManager: true,
  enableShareManager: true,
  // Callbacks
  plugins: [],
  onStateChange: null,
  onError: null,
  onReady: null,
  onPerformanceWarning: null,
  onPerformanceCritical: null
};
var constants_default = { VERSION, MODULE_ID, BOOTSTRAP_STATES, CONFIG_SCHEMA, DEFAULT_CONFIG };
export {
  BOOTSTRAP_STATES,
  CONFIG_SCHEMA,
  DEFAULT_CONFIG,
  MODULE_ID,
  VERSION,
  constants_default as default
};
