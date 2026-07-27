import { VERSION, MODULE_ID, HOOK_TYPES } from "./constants.js";
import { on, once, off, offAll } from "./registration.js";
import { execute, executeSync } from "./execution.js";
import { hasHooks, countHooks, listHooks, getHookTypes } from "./queries.js";
import { inject, configure, getConfig, enable, disable, isEnabled } from "./config.js";
import { getMetrics, resetMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, HOOK_TYPES as HOOK_TYPES2 } from "./constants.js";
import { on as on2, once as once2, off as off2, offAll as offAll2 } from "./registration.js";
import { execute as execute2, executeSync as executeSync2 } from "./execution.js";
import { hasHooks as hasHooks2, countHooks as countHooks2, listHooks as listHooks2, getHookTypes as getHookTypes2 } from "./queries.js";
import { inject as inject2, configure as configure2, getConfig as getConfig2, enable as enable2, disable as disable2, isEnabled as isEnabled2 } from "./config.js";
import { getMetrics as getMetrics2, resetMetrics as resetMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var lifecycle_hooks_default = {
  inject: inject2,
  on: on2,
  once: once2,
  off: off2,
  offAll: offAll2,
  execute: execute2,
  executeSync: executeSync2,
  hasHooks: hasHooks2,
  countHooks: countHooks2,
  listHooks: listHooks2,
  configure: configure2,
  getConfig: getConfig2,
  enable: enable2,
  disable: disable2,
  isEnabled: isEnabled2,
  getHookTypes: getHookTypes2,
  getMetrics: getMetrics2,
  resetMetrics: resetMetrics2,
  healthCheck: healthCheck2,
  info: info2,
  HOOK_TYPES: HOOK_TYPES2,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  HOOK_TYPES,
  MODULE_ID,
  VERSION,
  configure,
  countHooks,
  lifecycle_hooks_default as default,
  disable,
  enable,
  execute,
  executeSync,
  getConfig,
  getHookTypes,
  getMetrics,
  hasHooks,
  healthCheck,
  info,
  inject,
  isEnabled,
  listHooks,
  off,
  offAll,
  on,
  once,
  resetMetrics
};
