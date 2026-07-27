import { createLogger, configure as configureLogger, injectEventBus as injectLoggerEventBus, Logger } from "../../utils/logger.js";
import { install as installErrorHandler, injectEventBus as injectErrorEventBus } from "../../utils/error-handler.js";
import GlobalStateAdapter from "../../adapters/global-state-adapter.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { MODULE_ID } from "../constants.js";
import { BOOTSTRAP_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const PHASE_MODULE_ID = "bootstrap-integration:phase-1";
const VERSION = "13.7.0-IMPORT-FIX";
async function initPhase1(context) {
  const config = context.config;
  const eventBus = context.eventBus;
  const bootMetrics = context.bootMetrics;
  const managers = context.managers;
  bootMetrics?.startPhase("phase1");
  configureLogger({ level: config.logLevel, enabled: true });
  injectLoggerEventBus(eventBus);
  const logger = createLogger(MODULE_ID);
  managers.set("logger", logger);
  logger.debug("Phase 1 starting...");
  registerLoaded("logger");
  if (typeof window !== "undefined") {
    if (isStrict()) {
      recordViolation("WINDOW_LOGGER_EXPOSURE", { module: PHASE_MODULE_ID, intentional: true });
    }
    window.Logger = Logger;
    window.LoggerGlobal = Logger;
  }
  if (config.captureGlobalErrors) {
    injectErrorEventBus(eventBus);
    installErrorHandler({
      eventBus,
      captureUnhandled: true,
      captureRejections: true,
      onError: (errorInfo) => {
        logger.error("Global error:", errorInfo);
        eventBus?.emit(BOOTSTRAP_EVENT_NAMES.GLOBAL_ERROR, errorInfo);
      }
    });
    registerLoaded("error-handler");
  }
  if (config.enableGlobalState) {
    GlobalStateAdapter.injectEventBus(eventBus);
    GlobalStateAdapter.init({ eventBus, syncOnInit: true });
    registerLoaded("global-state-adapter");
  }
  bootMetrics?.endPhase("phase1");
  return { logger };
}
function info() {
  return {
    moduleId: PHASE_MODULE_ID,
    version: VERSION,
    phase: 1,
    provides: ["logger", "error-handler", "global-state-adapter"],
    strictMode: isStrict()
  };
}
var phase_1_default = { initPhase1, info };
export {
  VERSION,
  phase_1_default as default,
  info,
  initPhase1
};
