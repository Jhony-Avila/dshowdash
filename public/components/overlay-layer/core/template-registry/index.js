import { VERSION, MODULE_ID } from "./constants.js";
import { BUILTIN_TEMPLATES } from "./builtin.js";
import { inject } from "./state.js";
import { register, unregister, get, has } from "./crud.js";
import { list, listCustom, listBuiltin } from "./list.js";
import { apply, create, clone } from "./apply.js";
import { restoreBuiltin, restoreAllBuiltins, clearCustom } from "./restore.js";
import { configure, getConfig } from "./config.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2 } from "./constants.js";
import { BUILTIN_TEMPLATES as BUILTIN_TEMPLATES2 } from "./builtin.js";
import { inject as inject2 } from "./state.js";
import { register as register2, unregister as unregister2, get as get2, has as has2 } from "./crud.js";
import { list as list2, listCustom as listCustom2, listBuiltin as listBuiltin2 } from "./list.js";
import { apply as apply2, create as create2, clone as clone2 } from "./apply.js";
import { restoreBuiltin as restoreBuiltin2, restoreAllBuiltins as restoreAllBuiltins2, clearCustom as clearCustom2 } from "./restore.js";
import { configure as configure2, getConfig as getConfig2 } from "./config.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var template_registry_default = {
  inject: inject2,
  register: register2,
  unregister: unregister2,
  get: get2,
  has: has2,
  list: list2,
  listCustom: listCustom2,
  listBuiltin: listBuiltin2,
  apply: apply2,
  create: create2,
  clone: clone2,
  restoreBuiltin: restoreBuiltin2,
  restoreAllBuiltins: restoreAllBuiltins2,
  clearCustom: clearCustom2,
  configure: configure2,
  getConfig: getConfig2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2,
  BUILTIN_TEMPLATES: BUILTIN_TEMPLATES2,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  BUILTIN_TEMPLATES,
  MODULE_ID,
  VERSION,
  apply,
  clearCustom,
  clone,
  configure,
  create,
  template_registry_default as default,
  get,
  getConfig,
  getMetrics,
  has,
  healthCheck,
  info,
  inject,
  list,
  listBuiltin,
  listCustom,
  register,
  restoreAllBuiltins,
  restoreBuiltin,
  unregister
};
