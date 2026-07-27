import { registerLoaded } from "../../core/dependency-map.js";
const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap-integration.phase-initializers.phase-3";
async function initPhase3(context) {
  const bootMetrics = context.bootMetrics;
  const logger = context.logger;
  bootMetrics?.startPhase("phase3");
  logger?.debug("Phase 3 starting...");
  registerLoaded("config");
  registerLoaded("dependency-map");
  registerLoaded("validator");
  registerLoaded("utils-contract");
  bootMetrics?.endPhase("phase3");
}
var phase_3_default = { initPhase3 };
export {
  MODULE_ID,
  VERSION,
  phase_3_default as default,
  initPhase3
};
