const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades";
import { createSlotFacade } from "./slot-facade.js";
import { createCapabilityFacade } from "./capability-facade.js";
import { createLayoutFacade } from "./layout-facade.js";
import { createListenerFacade } from "./listener-facade.js";
import { createMetricsFacade } from "./metrics-facade.js";
import { createImageFacade } from "./image-facade.js";
import { createResourceFacade } from "./resource-facade.js";
import { createDeprecationFacade } from "./deprecation-facade.js";
export {
  MODULE_ID,
  VERSION,
  createCapabilityFacade,
  createDeprecationFacade,
  createImageFacade,
  createLayoutFacade,
  createListenerFacade,
  createMetricsFacade,
  createResourceFacade,
  createSlotFacade
};
