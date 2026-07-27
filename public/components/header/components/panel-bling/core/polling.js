import { VERSION } from "/core/version.js";
import { createModulePollingManager } from "../../_shared/core/polling-base.js";
const MODULE_ID = "header/components/panel-bling/core/polling";
const _mod = createModulePollingManager(MODULE_ID);
const { PollingManager, getMetrics, resetMetrics } = _mod;
var polling_default = PollingManager;
export {
  MODULE_ID,
  PollingManager,
  VERSION,
  polling_default as default,
  getMetrics,
  resetMetrics
};
