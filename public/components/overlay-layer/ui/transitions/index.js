import { VERSION, MODULE_ID, BUILTIN_TRANSITIONS } from "./constants.js";
import { register, unregister } from "./registry/register.js";
import { get, has, list, setDefault, getDefault } from "./registry/query.js";
import { apply, enter, exit } from "./animation/apply.js";
import { cancel, cancelAll, getActiveCount } from "./animation/cancel.js";
import { generateCSS } from "./helpers/css-generator.js";
import { configure, getConfig, getMetrics, healthCheck, info } from "./api.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, BUILTIN_TRANSITIONS as BUILTIN_TRANSITIONS2 } from "./constants.js";
import { register as register2, unregister as unregister2 } from "./registry/register.js";
import { get as get2, has as has2, list as list2, setDefault as setDefault2, getDefault as getDefault2 } from "./registry/query.js";
import { apply as apply2, enter as enter2, exit as exit2 } from "./animation/apply.js";
import { cancel as cancel2, cancelAll as cancelAll2, getActiveCount as getActiveCount2 } from "./animation/cancel.js";
import { generateCSS as generateCSS2 } from "./helpers/css-generator.js";
import { configure as configure2, getConfig as getConfig2, getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./api.js";
var transitions_default = {
  register: register2,
  unregister: unregister2,
  get: get2,
  has: has2,
  list: list2,
  setDefault: setDefault2,
  getDefault: getDefault2,
  apply: apply2,
  enter: enter2,
  exit: exit2,
  cancel: cancel2,
  cancelAll: cancelAll2,
  getActiveCount: getActiveCount2,
  generateCSS: generateCSS2,
  configure: configure2,
  getConfig: getConfig2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2,
  BUILTIN_TRANSITIONS: BUILTIN_TRANSITIONS2,
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2
};
export {
  BUILTIN_TRANSITIONS,
  MODULE_ID,
  VERSION,
  apply,
  cancel,
  cancelAll,
  configure,
  transitions_default as default,
  enter,
  exit,
  generateCSS,
  get,
  getActiveCount,
  getConfig,
  getDefault,
  getMetrics,
  has,
  healthCheck,
  info,
  list,
  register,
  setDefault,
  unregister
};
