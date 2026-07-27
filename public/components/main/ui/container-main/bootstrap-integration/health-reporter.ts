// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-reporter
// PURPOSE: Bootstrap Health Reporter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   contractsHealthCheck from ../contracts/index.js
//   healthCheck as errorHealthCheck from ../utils/error-handler.js
//   VERSION, MODULE_ID, BOOTSTRAP_STATES from ./constants.js
//   GlobalStateAdapter from ../adapters/global-state-adapter.js
//
// PROVIDES:
//   createHealthReporter() — exported function
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

import { contractsHealthCheck } from '../contracts/index.js';
import { healthCheck as errorHealthCheck } from '../utils/error-handler.js';
import GlobalStateAdapter from '../adapters/global-state-adapter.js';
import { VERSION, MODULE_ID, BOOTSTRAP_STATES } from './constants.js';

export function createHealthReporter(context: Record<string, unknown>) {
  const managers = context.managers as import("./types.js").ManagerRef;
  const getState = context.getState as (...args: unknown[]) => string;
  const kernel = context.kernel as import("./types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("./types.js").ManagerRef | null;
  const errors = context.errors as unknown[];
  const config = context.config as Record<string, unknown>;

  function getManagerHealth(name: string) {
    const manager = managers.get(name);
    // @ts-expect-error strict migration — TS2774
    return manager?.healthCheck?.() || { status: manager ? 'HEALTHY' : 'DISABLED' };
  }

  return {
    async healthCheck() {
      const state = getState();
      const kernelHealth = kernel ? await kernel.healthCheck() : { status: 'NOT_INITIALIZED' };
      const contractsHealth = contractsHealthCheck();
      const errorHandlerHealth = errorHealthCheck();
      const globalStateHealth = GlobalStateAdapter.healthCheck();
      
      const isRunning = state === BOOTSTRAP_STATES.RUNNING;
      let status = 'HEALTHY';
      if (state === BOOTSTRAP_STATES.ERROR) status = 'ERROR';
      else if (!isRunning) status = 'NOT_RUNNING';
      else if (errors.length > 0) status = 'WARNING';
      else if (kernelHealth.status !== 'HEALTHY') status = kernelHealth.status as string;
      
      return {
        status,
        version: VERSION,
        moduleId: MODULE_ID,
        modular: true,
        bootstrapState: state,
        errorCount: errors.length,
        bootMetrics: bootMetrics?.getReport()?.summary || null,
        phase1: { logger: { status: 'HEALTHY' }, errorHandler: errorHandlerHealth, globalState: globalStateHealth },
        phase2: { performanceMonitor: getManagerHealth('performanceMonitor'), fallbackSystem: getManagerHealth('fallbackSystem') },
        phase3: { config: { status: 'HEALTHY' }, dependencyMap: { status: 'HEALTHY' }, validator: { status: 'HEALTHY' } },
        phase4: {
          pluginSystem: getManagerHealth('pluginSystem'),
          lifecycleHooks: getManagerHealth('lifecycleHooks'),
          bootMetrics: getManagerHealth('bootMetrics'),
          stateSnapshots: getManagerHealth('stateSnapshots'),
          debugMode: getManagerHealth('debugMode'),
          configPersistence: getManagerHealth('configPersistence'),
          slotPresets: getManagerHealth('slotPresets'),
          eventBusAdapter: { status: managers.get('eventBusAdapter') ? 'HEALTHY' : 'DISABLED' }
        },
        phase5Core: {
          sanitizer: getManagerHealth('sanitizer'),
          rateLimiter: getManagerHealth('rateLimiter'),
          devToolsPanel: getManagerHealth('devToolsPanel'),
          workerManager: getManagerHealth('workerManager'),
          consoleCommands: getManagerHealth('consoleCommands'),
          telemetryDashboard: getManagerHealth('telemetryDashboard')
        },
        phase5Extended: {
          requestQueue: getManagerHealth('requestQueue'),
          cacheManager: getManagerHealth('cacheManager'),
          eventRecorder: getManagerHealth('eventRecorder')
        },
        phase6Core: {
          notificationManager: getManagerHealth('notificationManager'),
          formValidator: getManagerHealth('formValidator'),
          storageManager: getManagerHealth('storageManager'),
          clipboardManager: getManagerHealth('clipboardManager'),
          dragDropManager: getManagerHealth('dragDropManager'),
          modalManager: getManagerHealth('modalManager')
        },
        phase6Extended: {
          tooltipManager: getManagerHealth('tooltipManager'),
          contextMenuManager: getManagerHealth('contextMenuManager'),
          hotkeyManager: getManagerHealth('hotkeyManager'),
          scrollManager: getManagerHealth('scrollManager'),
          focusManager: getManagerHealth('focusManager'),
          undoManager: getManagerHealth('undoManager')
        },
        phase6Advanced: {
          themeManager: getManagerHealth('themeManager'),
          animationManager: getManagerHealth('animationManager'),
          mediaQueryManager: getManagerHealth('mediaQueryManager'),
          intersectionManager: getManagerHealth('intersectionManager'),
          resizeManager: getManagerHealth('resizeManager'),
          mutationManager: getManagerHealth('mutationManager')
        },
        phase7: {
          permissionManager: getManagerHealth('permissionManager'),
          networkManager: getManagerHealth('networkManager'),
          geolocationManager: getManagerHealth('geolocationManager'),
          deviceManager: getManagerHealth('deviceManager'),
          batteryManager: getManagerHealth('batteryManager'),
          fullscreenManager: getManagerHealth('fullscreenManager'),
          visibilityManager: getManagerHealth('visibilityManager'),
          wakeLockManager: getManagerHealth('wakeLockManager'),
          shareManager: getManagerHealth('shareManager')
        },
        kernel: kernelHealth,
        contracts: contractsHealth
      };
    },

    info() {
      const state = getState();
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        modular: true,
        state,
        kernelState: kernel?.getState() || null,
        bootMetrics: bootMetrics?.getReport()?.summary || null,
        phase1: { loggerActive: !!managers.get('logger'), globalStateAvailable: GlobalStateAdapter.isAvailable(), errorHandlerInstalled: config.captureGlobalErrors },
        phase2: { performanceMonitorActive: managers.has('performanceMonitor'), fallbackSystemActive: managers.has('fallbackSystem') },
        phase3: { configIntegrated: true, dependencyMapActive: true, validatorActive: true },
        phase4: { pluginSystemActive: managers.has('pluginSystem'), lifecycleHooksActive: managers.has('lifecycleHooks'), bootMetricsActive: !!bootMetrics, eventBusAdapterActive: managers.has('eventBusAdapter'), stateSnapshotsActive: managers.has('stateSnapshots'), debugModeActive: managers.has('debugMode'), configPersistenceActive: managers.has('configPersistence'), slotPresetsActive: managers.has('slotPresets') },
        phase5Core: { sanitizerActive: managers.has('sanitizer'), rateLimiterActive: managers.has('rateLimiter'), devToolsPanelActive: managers.has('devToolsPanel'), workerManagerActive: managers.has('workerManager'), consoleCommandsActive: managers.has('consoleCommands'), telemetryDashboardActive: managers.has('telemetryDashboard') },
        phase5Extended: { requestQueueActive: managers.has('requestQueue'), cacheManagerActive: managers.has('cacheManager'), eventRecorderActive: managers.has('eventRecorder') },
        phase6Core: { notificationManagerActive: managers.has('notificationManager'), formValidatorActive: managers.has('formValidator'), storageManagerActive: managers.has('storageManager'), clipboardManagerActive: managers.has('clipboardManager'), dragDropManagerActive: managers.has('dragDropManager'), modalManagerActive: managers.has('modalManager') },
        phase6Extended: { tooltipManagerActive: managers.has('tooltipManager'), contextMenuManagerActive: managers.has('contextMenuManager'), hotkeyManagerActive: managers.has('hotkeyManager'), scrollManagerActive: managers.has('scrollManager'), focusManagerActive: managers.has('focusManager'), undoManagerActive: managers.has('undoManager') },
        phase6Advanced: { themeManagerActive: managers.has('themeManager'), animationManagerActive: managers.has('animationManager'), mediaQueryManagerActive: managers.has('mediaQueryManager'), intersectionManagerActive: managers.has('intersectionManager'), resizeManagerActive: managers.has('resizeManager'), mutationManagerActive: managers.has('mutationManager') },
        phase7: { permissionManagerActive: managers.has('permissionManager'), networkManagerActive: managers.has('networkManager'), geolocationManagerActive: managers.has('geolocationManager'), deviceManagerActive: managers.has('deviceManager'), batteryManagerActive: managers.has('batteryManager'), fullscreenManagerActive: managers.has('fullscreenManager'), visibilityManagerActive: managers.has('visibilityManager'), wakeLockManagerActive: managers.has('wakeLockManager'), shareManagerActive: managers.has('shareManager') },
        managersActive: managers.count(),
        pluginsActive: managers.get('pluginSystem')?.listActive()?.length || 0,
        snapshotsCount: managers.get('stateSnapshots')?.count() || 0
      };
    }
  };
}

export default { createHealthReporter };
