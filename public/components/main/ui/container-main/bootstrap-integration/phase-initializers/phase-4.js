import { createPluginSystem } from "../../core/plugin-system.js";
import { createLifecycleHooks } from "../../core/lifecycle-hooks.js";
import { createEventBusAdapter } from "../../adapters/event-bus-adapter.js";
import { createStateSnapshots } from "../../core/state-snapshots.js";
import { createDebugMode } from "../../utils/debug-mode.js";
import { createConfigPersistence } from "../../utils/config-persistence.js";
import { createSlotPresets } from "../../slots/slot-presets.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { getEnv, ENV } from "../../config.js";
import { VERSION } from "../constants.js";
const MODULE_ID = "main.ui.container-main.bootstrap-integration.phase-initializers.phase-4";
async function initPhase4(context) {
  const config = context.config;
  const eventBus = context.eventBus;
  const bootMetrics = context.bootMetrics;
  const managers = context.managers;
  const logger = context.logger;
  bootMetrics?.startPhase("phase4");
  logger?.debug("Phase 4 starting...");
  if (config.enableConfigPersistence) {
    managers.set("configPersistence", createConfigPersistence({ prefix: "container-main", version: VERSION }));
    registerLoaded("config-persistence");
  }
  if (config.enableDebugMode) {
    managers.set("debugMode", createDebugMode({ enabled: true, exposeGlobal: true }));
    registerLoaded("debug-mode");
  }
  if (config.enableEventBusAdapter) {
    managers.set("eventBusAdapter", createEventBusAdapter({ eventBus, debug: getEnv() === ENV.DEVELOPMENT }));
    registerLoaded("event-bus-adapter");
  }
  if (config.enableLifecycleHooks) {
    const lifecycleHooks = createLifecycleHooks({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    lifecycleHooks.injectEventBus(eventBus);
    managers.set("lifecycleHooks", lifecycleHooks);
    registerLoaded("lifecycle-hooks");
  }
  if (config.enablePlugins) {
    const pluginSystem = createPluginSystem({ eventBus, debug: getEnv() === ENV.DEVELOPMENT });
    pluginSystem.injectEventBus(eventBus);
    managers.set("pluginSystem", pluginSystem);
    registerLoaded("plugin-system");
  }
  if (config.enableStateSnapshots) {
    managers.set("stateSnapshots", createStateSnapshots({ maxSnapshots: 50, persistToStorage: true }));
    registerLoaded("state-snapshots");
  }
  if (config.enableSlotPresets) {
    managers.set("slotPresets", createSlotPresets({}));
    registerLoaded("slot-presets");
  }
  bootMetrics?.endPhase("phase4");
  logger?.debug("Phase 4 ready");
}
var phase_4_default = { initPhase4 };
export {
  phase_4_default as default,
  initPhase4
};
