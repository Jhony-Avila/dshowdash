// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.2.0-LOG-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase-4
// PURPOSE: Bootstrap Phase 4 - Plugins, Lifecycle, Metrics, Adapters
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPluginSystem from ../../core/plugin-system.js
//   createLifecycleHooks from ../../core/lifecycle-hooks.js
//   createEventBusAdapter from ../../adapters/event-bus-adapter.js
//   createStateSnapshots from ../../core/state-snapshots.js
//   createDebugMode from ../../utils/debug-mode.js
//   createConfigPersistence from ../../utils/config-persistence.js
//   createSlotPresets from ../../slots/slot-presets.js
//   registerLoaded from ../../core/dependency-map.js
//   getEnv, ENV from ../../config.js
//   VERSION from ../constants.js
//
// PROVIDES:
//   (none)
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

import { createPluginSystem } from '../../core/plugin-system.js';
import { createLifecycleHooks } from '../../core/lifecycle-hooks.js';
import { createEventBusAdapter } from '../../adapters/event-bus-adapter.js';
import { createStateSnapshots } from '../../core/state-snapshots.js';
import { createDebugMode } from '../../utils/debug-mode.js';
import { createConfigPersistence } from '../../utils/config-persistence.js';
import { createSlotPresets } from '../../slots/slot-presets.js';
import { registerLoaded } from '../../core/dependency-map.js';
import { getEnv, ENV } from '../../config.js';
import { VERSION } from '../constants.js';

const MODULE_ID = 'main.ui.container-main.bootstrap-integration.phase-initializers.phase-4';

export async function initPhase4(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const eventBus = context.eventBus as import("../types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const managers = context.managers as import("../types.js").ManagerRef;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase4');
  // v13.2.0: debug — phase start/ready are internal plumbing
  logger?.debug('Phase 4 starting...');
  
  if (config.enableConfigPersistence) {
    managers.set('configPersistence', createConfigPersistence({ prefix: 'container-main', version: VERSION }));
    registerLoaded('config-persistence');
  }
  
  if (config.enableDebugMode) {
    managers.set('debugMode', createDebugMode({ enabled: true, exposeGlobal: true }));
    registerLoaded('debug-mode');
  }
  
  if (config.enableEventBusAdapter) {
    managers.set('eventBusAdapter', createEventBusAdapter({ eventBus, debug: getEnv() === ENV.DEVELOPMENT }));
    registerLoaded('event-bus-adapter');
  }
  
  if (config.enableLifecycleHooks) {
    const lifecycleHooks = createLifecycleHooks({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    lifecycleHooks.injectEventBus(eventBus);
    managers.set('lifecycleHooks', lifecycleHooks);
    registerLoaded('lifecycle-hooks');
  }
  
  if (config.enablePlugins) {
    const pluginSystem = createPluginSystem({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    pluginSystem.injectEventBus(eventBus);
    managers.set('pluginSystem', pluginSystem);
    registerLoaded('plugin-system');
  }
  
  if (config.enableStateSnapshots) {
    managers.set('stateSnapshots', createStateSnapshots({ maxSnapshots: 50, persistToStorage: true }));
    registerLoaded('state-snapshots');
  }
  
  if (config.enableSlotPresets) {
    managers.set('slotPresets', createSlotPresets({}));
    registerLoaded('slot-presets');
  }
  
  bootMetrics?.endPhase('phase4');
  logger?.debug('Phase 4 ready');
}

export default { initPhase4 };
