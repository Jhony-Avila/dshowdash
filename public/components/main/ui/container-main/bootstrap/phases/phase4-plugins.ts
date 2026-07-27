// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: phase4-plugins
// PURPOSE: Phase 4 - Plugins & Infrastructure
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
//   VERSION from ../config/states.js
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
import { VERSION } from '../config/states.js';

const MODULE_ID = 'main.ui.container-main.bootstrap.phases.phase4-plugins';

export async function initPhase4(context: Record<string, unknown>) {
  const config = context.config as Record<string, unknown>;
  const eventBus = context.eventBus as import("../types.js").ManagerRef | null;
  const bootMetrics = context.bootMetrics as import("../types.js").ManagerRef | null;
  const logger = context.logger as import("../types.js").ManagerRef | null;
  
  bootMetrics?.startPhase('phase4');
  logger?.debug('Phase 4 starting...');
  
  let configPersistence = null;
  let debugMode = null;
  let eventBusAdapter = null;
  let lifecycleHooks = null;
  let pluginSystem = null;
  let stateSnapshots = null;
  let slotPresets = null;
  
  if (config.enableConfigPersistence) {
    configPersistence = createConfigPersistence({ prefix: 'container-main', version: VERSION });
    registerLoaded('config-persistence');
  }
  
  if (config.enableDebugMode) {
    debugMode = createDebugMode({ enabled: true, exposeGlobal: true });
    registerLoaded('debug-mode');
  }
  
  if (config.enableEventBusAdapter) {
    eventBusAdapter = createEventBusAdapter({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    registerLoaded('event-bus-adapter');
  }
  
  if (config.enableLifecycleHooks) {
    lifecycleHooks = createLifecycleHooks({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    lifecycleHooks.injectEventBus(eventBus);
    registerLoaded('lifecycle-hooks');
  }
  
  if (config.enablePlugins) {
    pluginSystem = createPluginSystem({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    pluginSystem.injectEventBus(eventBus);
    registerLoaded('plugin-system');
  }
  
  if (config.enableStateSnapshots) {
    stateSnapshots = createStateSnapshots({ maxSnapshots: 50, persistToStorage: true });
    registerLoaded('state-snapshots');
  }
  
  if (config.enableSlotPresets) {
    slotPresets = createSlotPresets({});
    registerLoaded('slot-presets');
  }
  
  bootMetrics?.endPhase('phase4');
  logger?.debug('Phase 4 ready');
  
  return { configPersistence, debugMode, eventBusAdapter, lifecycleHooks, pluginSystem, stateSnapshots, slotPresets };
}

export default { initPhase4 };
