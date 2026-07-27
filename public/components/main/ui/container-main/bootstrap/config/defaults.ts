// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-AAA-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: defaults
// PURPOSE: Bootstrap Defaults - Configurações padrão e schema de validação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LIMITS, INTERVALS, LOG_LEVELS, isFeatureEnabled, FEATURES, getEnv, ENV from ....
//   TYPES from ../../utils/validator.js
//
// PROVIDES:
//   CONFIG_SCHEMA — exported value
//   DEFAULT_CONFIG — exported value
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

import { LIMITS, INTERVALS, LOG_LEVELS, isFeatureEnabled, FEATURES, getEnv, ENV } from '../../config.js';
import { TYPES } from '../../utils/validator.js';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.bootstrap.config.defaults';

// ═══════════════════════════════════════════════════════════════
// PADRÃO AAA DE LOGGING
// ═══════════════════════════════════════════════════════════════
// DEBUG (0) - Detalhes internos, fluxo, estados (mk.verbose())
// INFO  (1) - Marcos importantes (✅ Bootstrap complete)
// WARN  (2) - Degradação, fallbacks, anomalias [PADRÃO]
// ERROR (3) - Falhas recuperáveis
// CRITICAL (4) - Falhas irrecuperáveis
//
// Para ver mais logs: mk.logLevel('info') ou mk.verbose()
// Para silenciar: mk.quiet()
// ═══════════════════════════════════════════════════════════════

export const CONFIG_SCHEMA = {
  cleanupStrategy: { type: TYPES.STRING, enum: ['aggressive', 'balanced', 'conservative'], default: 'balanced' },
  memoryWarningThreshold: { type: TYPES.NUMBER, min: 0.1, max: 1, default: 0.7 },
  memoryCriticalThreshold: { type: TYPES.NUMBER, min: 0.1, max: 1, default: 0.9 },
  maxConcurrentLoads: { type: TYPES.NUMBER, min: 1, max: 20, default: LIMITS.MAX_CONCURRENT_LOADS },
  logLevel: { type: TYPES.NUMBER, min: 0, max: 99, default: LOG_LEVELS.WARN },
  performanceInterval: { type: TYPES.NUMBER, min: 1000, max: 60000, default: INTERVALS.MEMORY_CHECK }
};

export const DEFAULT_CONFIG = {
  cleanupStrategy: 'balanced',
  memoryWarningThreshold: 0.7,
  memoryCriticalThreshold: 0.9,
  maxConcurrentLoads: LIMITS.MAX_CONCURRENT_LOADS,
  enableMetricsPersistence: true,
  enableImageVirtualization: true,
  enableDeprecationWarnings: getEnv() !== ENV.PRODUCTION,
  enableLazyLoading: true,
  waitForLazyComponents: false,
  autoStart: true,
  logLevel: LOG_LEVELS.WARN,  // AAA: WARN padrão em todos os ambientes
  captureGlobalErrors: true,
  enableGlobalState: isFeatureEnabled(FEATURES.GLOBAL_STATE),
  enablePerformanceMonitor: isFeatureEnabled(FEATURES.PERFORMANCE_MONITOR),
  enableFallbackSystem: isFeatureEnabled(FEATURES.FALLBACK_SYSTEM),
  performanceInterval: INTERVALS.MEMORY_CHECK,
  enablePlugins: true,
  enableLifecycleHooks: true,
  enableBootMetrics: true,
  enableEventBusAdapter: true,
  enableStateSnapshots: true,
  enableDebugMode: getEnv() === ENV.DEVELOPMENT,
  enableConfigPersistence: true,
  enableSlotPresets: true,
  enableSanitizer: true,
  enableRateLimiter: true,
  enableDevToolsPanel: getEnv() === ENV.DEVELOPMENT,
  enableWorkerManager: true,
  enableConsoleCommands: getEnv() === ENV.DEVELOPMENT,
  enableTelemetryDashboard: getEnv() === ENV.DEVELOPMENT,
  enableRequestQueue: true,
  enableCacheManager: true,
  enableEventRecorder: getEnv() === ENV.DEVELOPMENT,
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
  enableGeolocationManager: true,
  enableDeviceManager: true,
  enableBatteryManager: true,
  enableFullscreenManager: true,
  enableVisibilityManager: true,
  enableWakeLockManager: true,
  enableShareManager: true,
  plugins: [] as unknown[],
  onStateChange: null as ((...args: unknown[]) => void) | null,
  onError: null as ((...args: unknown[]) => void) | null,
  onReady: null as ((...args: unknown[]) => void) | null,
  onPerformanceWarning: null as ((...args: unknown[]) => void) | null,
  onPerformanceCritical: null as ((...args: unknown[]) => void) | null
};

export default { CONFIG_SCHEMA, DEFAULT_CONFIG };
