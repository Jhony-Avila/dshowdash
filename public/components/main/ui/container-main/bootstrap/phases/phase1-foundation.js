import { createLogger, configure as configureLogger, injectEventBus as injectLoggerEventBus } from "../../utils/logger.js";
import { injectEventBus as injectErrorEventBus, install as installErrorHandler } from "../../utils/error-handler.js";
import GlobalStateAdapter from "../../adapters/global-state-adapter.js";
import { registerLoaded } from "../../core/dependency-map.js";
import { BOOTSTRAP_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "13.3.1-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.phases.phase1-foundation";
async function initPhase1(context) {
  const config = context.config;
  const eventBus = context.eventBus;
  const bootMetrics = context.bootMetrics;
  const MODULE_ID2 = context.MODULE_ID;
  bootMetrics?.startPhase("phase1");
  configureLogger({ level: config.logLevel, enabled: true });
  injectLoggerEventBus(eventBus);
  const logger = createLogger(MODULE_ID2);
  logger?.debug("Phase 1 starting...");
  registerLoaded("logger");
  if (config.captureGlobalErrors) {
    injectErrorEventBus(eventBus);
    installErrorHandler({
      eventBus,
      captureUnhandled: true,
      captureRejections: true,
      onError: (errorInfo) => {
        logger?.error("Global error:", errorInfo);
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
  logger?.debug("Phase 1 ready");
  return { logger, GlobalStateAdapter };
}
var phase1_foundation_default = { initPhase1 };
export {
  MODULE_ID,
  VERSION,
  phase1_foundation_default as default,
  initPhase1
};
