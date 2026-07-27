// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:dependency-map
// PURPOSE: Dependency Map - Mapa de dependências entre módulos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEPENDENCY_TYPES — exported value
//   DEPENDENCY_GRAPH — exported value
//   registerLoaded() — exported function
//   isLoaded() — exported function
//   getDependencies() — exported function
//   checkDependencies() — exported function
//   getLoadOrder() — exported function
//   detectCircular() — exported function
//   getDependents() — exported function
//   generateReport() — exported function
//   reset() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

export const VERSION = '10.0.0-PHASE7';
export const MODULE_ID = 'container-main:dependency-map';

export const DEPENDENCY_TYPES = Object.freeze({ REQUIRED: 'required', OPTIONAL: 'optional', PEER: 'peer', DEV: 'dev' });

export const DEPENDENCY_GRAPH = Object.freeze({
  // Bootstrap
  'bootstrap-integration': {
    requires: ['adaptive-kernel', 'init-components', 'event-bridge', 'logger', 'error-handler', 'global-state-adapter', 'performance-monitor', 'fallback-system', 'boot-metrics', 'lifecycle-hooks'],
    optional: ['contracts', 'plugin-system', 'event-bus-adapter', 'state-snapshots', 'debug-mode', 'config-persistence', 'slot-presets', 'sanitizer', 'rate-limiter', 'devtools-panel', /* 'worker-manager' REMOVED 2026-04-29 */ 'console-commands', 'telemetry-dashboard', 'request-queue', 'cache-manager', 'event-recorder', 'notification-manager', 'form-validator', 'storage-manager', 'clipboard-manager', 'drag-drop-manager', 'modal-manager', 'tooltip-manager', 'context-menu-manager', 'hotkey-manager', 'scroll-manager', 'focus-manager', 'undo-manager', 'theme-manager-v2', 'animation-manager-v2', 'media-query-manager', 'intersection-manager', 'resize-manager', 'mutation-manager', 'permission-manager', 'network-manager', 'geolocation-manager', 'device-manager', 'battery-manager', 'fullscreen-manager', 'visibility-manager', 'wake-lock-manager', 'share-manager'],
    provides: ['boot', 'getBootstrap', 'healthCheck']
  },
  // Kernel
  'adaptive-kernel': { requires: ['event-bridge', 'circuit-breaker'], optional: ['slot-manager', 'capability-manager', 'resource-manager', 'cleanup-scheduler', 'layout-manager', 'listener-tracker', 'metrics-persistence', 'image-virtualizer', 'lifecycle-guard', 'deprecation-manager', 'compat-layer', 'slot-presets'], provides: ['createAdaptiveKernel', 'KERNEL_STATES'] },
  // Core
  'event-bridge': { requires: [], optional: [], provides: ['getEventBus', 'createEventBridge'] },
  // FASE 4 - Core
  'plugin-system': { requires: ['logger', 'validator'], optional: ['event-bridge'], provides: ['createPluginSystem', 'getPluginSystem', 'PLUGIN_STATES', 'PLUGIN_HOOKS'] },
  'lifecycle-hooks': { requires: ['logger'], optional: ['event-bridge'], provides: ['createLifecycleHooks', 'getLifecycleHooks', 'HOOKS', 'PRIORITIES'] },
  'boot-metrics': { requires: ['logger'], optional: [], provides: ['createBootMetrics', 'getBootMetrics', 'BOOT_PHASES'] },
  'state-snapshots': { requires: ['logger'], optional: ['event-bridge', 'config-persistence'], provides: ['createStateSnapshots', 'getStateSnapshots', 'SNAPSHOT_TYPES'] },
  // Utils - FASE 1
  'logger': { requires: [], optional: ['event-bridge'], provides: ['Logger', 'createLogger', 'LOG_LEVELS'] },
  'error-handler': { requires: ['logger'], optional: ['event-bridge'], provides: ['createErrorHandler', 'ERROR_SEVERITY', 'ERROR_CATEGORIES'] },
  'async-helpers': { requires: ['error-handler'], optional: [], provides: ['withTimeout', 'fetchWithTimeout', 'retryWithBackoff', 'DEFAULT_TIMEOUTS'] },
  // FASE 3
  'config': { requires: [], optional: [], provides: ['getConfig', 'setConfig', 'FEATURES', 'TIMEOUTS', 'LIMITS'] },
  'validator': { requires: [], optional: [], provides: ['validate', 'validateObject', 'is', 'TYPES'] },
  // FASE 4 - Utils
  'debug-mode': { requires: ['logger', 'config'], optional: ['event-bridge'], provides: ['createDebugMode', 'getDebugMode', 'DEBUG_LEVELS', 'DEBUG_CATEGORIES'] },
  'config-persistence': { requires: ['logger'], optional: [], provides: ['createConfigPersistence', 'getConfigPersistence', 'STORAGE_KEYS'] },
  // FASE 5 - Core
  'sanitizer': { requires: ['logger'], optional: [], provides: ['createSanitizer', 'getSanitizer', 'escapeHtml', 'sanitizeText', 'sanitizeHtml', 'isSafe'] },
  'rate-limiter': { requires: ['logger'], optional: [], provides: ['createRateLimiter', 'getRateLimiter', 'STRATEGIES', 'PRESETS'] },
  'devtools-panel': { requires: ['logger', 'config'], optional: ['event-bridge', 'debug-mode'], provides: ['createDevToolsPanel', 'getDevToolsPanel'] },
  // REMOVED 2026-04-29 — worker-manager dormente (ver /backup/remove-workers-20260429-183149/).
  // 'worker-manager': { requires: ['logger'], optional: [], provides: ['createWorkerManager', 'getWorkerManager', 'WORKER_STATES', 'TASK_TYPES'] },
  'console-commands': { requires: ['logger', 'config'], optional: ['event-bridge'], provides: ['createConsoleCommands', 'getConsoleCommands'] },
  'telemetry-dashboard': { requires: ['logger', 'config'], optional: ['event-bridge', 'performance-monitor'], provides: ['createTelemetryDashboard', 'getTelemetryDashboard'] },
  // FASE 5 - Extended
  'request-queue': { requires: ['logger'], optional: ['rate-limiter'], provides: ['createRequestQueue', 'getRequestQueue', 'PRIORITIES', 'REQUEST_STATES'] },
  'cache-manager': { requires: ['logger'], optional: ['config-persistence'], provides: ['createCacheManager', 'getCacheManager', 'EVICTION_STRATEGIES'] },
  'event-recorder': { requires: ['logger'], optional: ['event-bridge'], provides: ['createEventRecorder', 'getEventRecorder', 'RECORDER_STATES', 'EVENT_TYPES'] },
  // FASE 6 - UI/UX Core
  'notification-manager': { requires: ['logger'], optional: [], provides: ['createNotificationManager', 'getNotificationManager', 'notify', 'NOTIFICATION_TYPES', 'POSITIONS'] },
  'form-validator': { requires: ['logger'], optional: ['sanitizer'], provides: ['createFormValidator', 'getFormValidator', 'RULES'] },
  'storage-manager': { requires: ['logger'], optional: ['config-persistence'], provides: ['createStorageManager', 'getStorageManager', 'storage', 'STORAGE_TYPES'] },
  'clipboard-manager': { requires: ['logger'], optional: ['notification-manager'], provides: ['createClipboardManager', 'getClipboardManager', 'copyText', 'pasteText'] },
  'drag-drop-manager': { requires: ['logger'], optional: [], provides: ['createDragDropManager', 'getDragDropManager', 'DROP_EFFECTS'] },
  'modal-manager': { requires: ['logger'], optional: ['sanitizer', 'focus-manager'], provides: ['createModalManager', 'getModalManager', 'openModal', 'closeModal', 'MODAL_SIZES'] },
  // FASE 6 - UI/UX Extended
  'tooltip-manager': { requires: ['logger'], optional: [], provides: ['createTooltipManager', 'getTooltipManager', 'POSITIONS', 'TRIGGERS'] },
  'context-menu-manager': { requires: ['logger'], optional: [], provides: ['createContextMenuManager', 'getContextMenuManager', 'ITEM_TYPES'] },
  'hotkey-manager': { requires: ['logger'], optional: [], provides: ['createHotkeyManager', 'getHotkeyManager', 'registerHotkey', 'MODIFIERS', 'SCOPES'] },
  'scroll-manager': { requires: ['logger'], optional: [], provides: ['createScrollManager', 'getScrollManager', 'scrollTo', 'DIRECTIONS'] },
  'focus-manager': { requires: ['logger'], optional: [], provides: ['createFocusManager', 'getFocusManager'] },
  'undo-manager': { requires: ['logger'], optional: ['storage-manager'], provides: ['createUndoManager', 'getUndoManager', 'undo', 'redo'] },
  // FASE 6 - Advanced
  'theme-manager-v2': { requires: ['logger'], optional: ['storage-manager'], provides: ['createThemeManager', 'getThemeManager', 'setTheme', 'toggleTheme', 'THEMES'] },
  'animation-manager-v2': { requires: ['logger'], optional: [], provides: ['createAnimationManager', 'getAnimationManager', 'animate', 'EASINGS', 'PRESETS'] },
  'media-query-manager': { requires: ['logger'], optional: [], provides: ['createMediaQueryManager', 'getMediaQueryManager', 'getCurrentBreakpoint', 'BREAKPOINTS'] },
  'intersection-manager': { requires: ['logger'], optional: [], provides: ['createIntersectionManager', 'getIntersectionManager', 'lazyLoad', 'observe'] },
  'resize-manager': { requires: ['logger'], optional: [], provides: ['createResizeManager', 'getResizeManager', 'observeResize'] },
  'mutation-manager': { requires: ['logger'], optional: [], provides: ['createMutationManager', 'getMutationManager', 'watchDOM', 'MUTATION_TYPES'] },
  // FASE 7 - Device & Browser APIs
  'permission-manager': { requires: ['logger'], optional: [], provides: ['createPermissionManager', 'getPermissionManager', 'queryPermission', 'requestPermission', 'PERMISSIONS', 'PERMISSION_STATES'] },
  'network-manager': { requires: ['logger'], optional: [], provides: ['createNetworkManager', 'getNetworkManager', 'isOnline', 'isOffline', 'NETWORK_STATES', 'CONNECTION_TYPES'] },
  'geolocation-manager': { requires: ['logger'], optional: ['permission-manager'], provides: ['createGeolocationManager', 'getGeolocationManager', 'getCurrentPosition', 'GEO_ERRORS'] },
  'device-manager': { requires: ['logger'], optional: [], provides: ['createDeviceManager', 'getDeviceManager', 'getDeviceType', 'isMobile', 'DEVICE_TYPES', 'OS_TYPES', 'BROWSER_TYPES'] },
  'battery-manager': { requires: ['logger'], optional: [], provides: ['createBatteryManager', 'getBatteryManager', 'getBatteryLevel', 'isBatteryCharging', 'BATTERY_STATES'] },
  'fullscreen-manager': { requires: ['logger'], optional: [], provides: ['createFullscreenManager', 'getFullscreenManager', 'enterFullscreen', 'exitFullscreen', 'toggleFullscreen'] },
  'visibility-manager': { requires: ['logger'], optional: [], provides: ['createVisibilityManager', 'getVisibilityManager', 'isPageVisible', 'isPageHidden', 'VISIBILITY_STATES'] },
  'wake-lock-manager': { requires: ['logger'], optional: ['visibility-manager'], provides: ['createWakeLockManager', 'getWakeLockManager', 'acquireWakeLock', 'releaseWakeLock'] },
  'share-manager': { requires: ['logger'], optional: ['clipboard-manager'], provides: ['createShareManager', 'getShareManager', 'share', 'shareTo', 'SHARE_TARGETS'] },
  // Adapters
  'global-state-adapter': { requires: ['logger'], optional: ['event-bridge'], provides: ['GlobalStateAdapter', 'selectors'] },
  'event-bus-adapter': { requires: ['event-bridge', 'logger'], optional: [], provides: ['createEventBusAdapter', 'getEventBusAdapter', 'EVENT_NAMESPACES'] },
  // FASE 4 - Slots
  'slot-presets': { requires: ['logger'], optional: [], provides: ['createSlotPresets', 'getSlotPresets', 'PRESET_CATEGORIES', 'DEFAULT_PRESETS'] },
  // Resources - FASE 2
  'performance-monitor': { requires: ['logger', 'memory-monitor', 'fps-monitor', 'telemetry'], optional: ['event-bridge'], provides: ['createPerformanceMonitor', 'MONITOR_STATES'] },
  'fallback-system': { requires: ['logger', 'error-handler', 'async-helpers'], optional: ['event-bridge'], provides: ['createFallbackSystem', 'FALLBACK_LEVELS', 'FALLBACK_STRATEGIES'] },
  // Resources - Core
  'circuit-breaker': { requires: [], optional: [], provides: ['getCircuitBreaker', 'CIRCUIT_STATES'] },
  'resource-manager': { requires: ['circuit-breaker'], optional: ['event-bridge'], provides: ['createResourceManager', 'RESOURCE_TYPES'] },
  'slot-manager': { requires: ['lifecycle-guard'], optional: ['event-bridge', 'capability-manager', 'slot-presets'], provides: ['createSlotManager', 'SLOT_STATES'] },
  'capability-manager': { requires: ['panel-contract'], optional: ['event-bridge'], provides: ['createCapabilityManager', 'CAPABILITY_STATUS'] },
  'layout-manager': { requires: [], optional: ['event-bridge'], provides: ['createLayoutManager', 'DOCK_POSITIONS'] },
  'listener-tracker': { requires: [], optional: ['event-bridge'], provides: ['createListenerTracker'] },
  'lifecycle-guard': { requires: ['lifecycle-contract'], optional: ['event-bridge'], provides: ['createLifecycleGuard', 'LIFECYCLE_STATES'] },
  'metrics-persistence': { requires: [], optional: ['event-bridge', 'indexed-db'], provides: ['createMetricsPersistence', 'METRIC_TYPES'] },
  'image-virtualizer': { requires: [], optional: ['event-bridge', 'visibility-observer'], provides: ['createImageVirtualizer'] },
  'cleanup-scheduler': { requires: [], optional: ['event-bridge'], provides: ['createCleanupScheduler', 'CLEANUP_STRATEGIES'] },
  'deprecation-manager': { requires: ['logger'], optional: ['event-bridge'], provides: ['createDeprecationManager'] },
  'compat-layer': { requires: [], optional: ['event-bridge'], provides: ['createCompatLayer'] },
  // Utils auxiliares
  'memory-monitor': { requires: [], optional: [], provides: ['start', 'stop', 'getCurrentMemory'] },
  'fps-monitor': { requires: [], optional: [], provides: ['start', 'stop', 'getCurrentFPS'] },
  'telemetry': { requires: [], optional: ['event-bridge'], provides: ['track', 'flush'] },
  // Contracts
  'panel-contract': { requires: ['lifecycle-contract', 'slot-contract'], optional: [], provides: ['PANEL_CATEGORIES', 'PANEL_CAPABILITIES'] },
  'lifecycle-contract': { requires: [], optional: [], provides: ['LIFECYCLE_STATES', 'createLifecycleWrapper'] },
  'slot-contract': { requires: [], optional: [], provides: ['SLOT_TYPES', 'RENDER_MODES'] },
  'resource-contract': { requires: [], optional: [], provides: ['RESOURCE_TYPES', 'RESOURCE_STATES'] },
  'capability-contract': { requires: [], optional: [], provides: ['CAPABILITY_TYPES'] },
  'utils-contract': { requires: [], optional: [], provides: ['UTIL_CATEGORIES', 'validateUtilInterface'] }
});

let _loadedModules = new Set();
let _loadOrder: unknown[] = [];

export function registerLoaded(moduleId: string) { if (!_loadedModules.has(moduleId)) { _loadedModules.add(moduleId); _loadOrder.push({ moduleId, timestamp: Date.now() }); } }
export function isLoaded(moduleId: string) { return _loadedModules.has(moduleId); }
export function getDependencies(moduleId: string) { const deps = (DEPENDENCY_GRAPH as Record<string, Record<string, unknown>>)[moduleId]; if (!deps) return null; return { ...deps, moduleId }; }
export function checkDependencies(moduleId: string) { const deps = (DEPENDENCY_GRAPH as Record<string, { requires: string[]; optional: string[]; provides: string[] }>)[moduleId]; if (!deps) return { satisfied: true, missing: [] as string[], optional: [] as string[] }; const missing = deps.requires.filter((d: string) => !_loadedModules.has(d)); const optionalMissing = deps.optional.filter((d: string) => !_loadedModules.has(d)); return { satisfied: missing.length === 0, missing, optional: optionalMissing, loaded: deps.requires.filter((d: string) => _loadedModules.has(d)) }; }
export function getLoadOrder(moduleId: string, visited = new Set()): string[] { if (visited.has(moduleId)) return []; visited.add(moduleId); const deps = (DEPENDENCY_GRAPH as Record<string, unknown>)[moduleId] as Record<string, unknown> | undefined; if (!deps) return [moduleId]; const order: string[] = []; for (const dep of (deps.requires as string[])) { order.push(...getLoadOrder(dep, visited)); } order.push(moduleId); return [...new Set(order)]; }
export function detectCircular(moduleId: string, visited = new Set(), path: string[] = []): { hasCircular: boolean; cycle?: string[] } { if (visited.has(moduleId)) { const cycleStart = path.indexOf(moduleId); if (cycleStart !== -1) return { hasCircular: true, cycle: path.slice(cycleStart).concat(moduleId) }; return { hasCircular: false }; } visited.add(moduleId); path.push(moduleId); const deps = (DEPENDENCY_GRAPH as Record<string, unknown>)[moduleId] as Record<string, unknown> | undefined; if (deps) { for (const dep of (deps.requires as string[])) { const result: { hasCircular: boolean; cycle?: string[] } = detectCircular(dep, visited, [...path]); if (result.hasCircular) return result; } } return { hasCircular: false }; }
// @ts-expect-error strict migration — TS2345
export function getDependents(moduleId: string) { const dependents = []; for (const [id, deps] of Object.entries(DEPENDENCY_GRAPH)) { if (deps.requires.includes(moduleId) || deps.optional.includes(moduleId)) { dependents.push({ moduleId: id, type: deps.requires.includes(moduleId) ? 'required' : 'optional' }); } } return dependents; }
export function generateReport() { const modules = Object.keys(DEPENDENCY_GRAPH); const loaded = Array.from(_loadedModules); const notLoaded = modules.filter(m => !_loadedModules.has(m)); const circularChecks = modules.map(m => ({ moduleId: m, ...detectCircular(m) })); const hasCircular = circularChecks.filter(c => c.hasCircular); return { totalModules: modules.length, loadedModules: loaded.length, notLoaded: notLoaded.length, loadOrder: _loadOrder, circularDependencies: hasCircular, modules: modules.map(m => ({ moduleId: m, loaded: _loadedModules.has(m), dependencies: checkDependencies(m) })) }; }
export function reset() { _loadedModules.clear(); _loadOrder = []; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, totalModules: Object.keys(DEPENDENCY_GRAPH).length, loadedModules: _loadedModules.size, dependencyTypes: Object.keys(DEPENDENCY_TYPES) }; }
export function healthCheck() { const report = generateReport(); const hasCircular = report.circularDependencies.length > 0; return { status: hasCircular ? 'WARNING' : 'HEALTHY', version: VERSION, moduleId: MODULE_ID, loadedModules: _loadedModules.size, totalModules: Object.keys(DEPENDENCY_GRAPH).length, circularCount: report.circularDependencies.length }; }

export default { VERSION, MODULE_ID, DEPENDENCY_TYPES, DEPENDENCY_GRAPH, registerLoaded, isLoaded, getDependencies, checkDependencies, getLoadOrder, detectCircular, getDependents, generateReport, reset, info, healthCheck };
