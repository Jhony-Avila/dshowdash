import { VERSION, MODULE_ID, TEMPLATES } from "./constants.js";
import { create, destroy, destroyIn, destroyAll, hasActive } from "./core.js";
import { listTemplates, registerTemplate, unregisterTemplate } from "./custom.js";
import { configure, getConfig } from "./config.js";
import { getMetrics, healthCheck, info } from "./health.js";
import { VERSION as VERSION2, MODULE_ID as MODULE_ID2, TEMPLATES as TEMPLATES2 } from "./constants.js";
import { create as create2, destroy as destroy2, destroyIn as destroyIn2, destroyAll as destroyAll2, hasActive as hasActive2 } from "./core.js";
import { listTemplates as listTemplates2, registerTemplate as registerTemplate2, unregisterTemplate as unregisterTemplate2 } from "./custom.js";
import { configure as configure2, getConfig as getConfig2 } from "./config.js";
import { getMetrics as getMetrics2, healthCheck as healthCheck2, info as info2 } from "./health.js";
var skeleton_loader_default = {
  VERSION: VERSION2,
  MODULE_ID: MODULE_ID2,
  TEMPLATES: TEMPLATES2,
  create: create2,
  destroy: destroy2,
  destroyIn: destroyIn2,
  destroyAll: destroyAll2,
  hasActive: hasActive2,
  listTemplates: listTemplates2,
  registerTemplate: registerTemplate2,
  unregisterTemplate: unregisterTemplate2,
  configure: configure2,
  getConfig: getConfig2,
  getMetrics: getMetrics2,
  healthCheck: healthCheck2,
  info: info2
};
export {
  MODULE_ID,
  TEMPLATES,
  VERSION,
  configure,
  create,
  skeleton_loader_default as default,
  destroy,
  destroyAll,
  destroyIn,
  getConfig,
  getMetrics,
  hasActive,
  healthCheck,
  info,
  listTemplates,
  registerTemplate,
  unregisterTemplate
};
