const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.helpers";
import { createLifecycleHelpers } from "./lifecycle.js";
import { createKernelHelpers } from "./kernel.js";
import { createUtilsHelpers } from "./utils.js";
import { createUIHelpers } from "./ui.js";
import { createDeviceHelpers } from "./device.js";
function createAllHelpers(refs) {
  const { createLifecycleHelpers: createLifecycleHelpers2 } = require("./lifecycle.js");
  const { createKernelHelpers: createKernelHelpers2 } = require("./kernel.js");
  const { createUtilsHelpers: createUtilsHelpers2 } = require("./utils.js");
  const { createUIHelpers: createUIHelpers2 } = require("./ui.js");
  const { createDeviceHelpers: createDeviceHelpers2 } = require("./device.js");
  return {
    ...createLifecycleHelpers2(refs),
    ...createKernelHelpers2(refs),
    ...createUtilsHelpers2(refs),
    ...createUIHelpers2(refs),
    ...createDeviceHelpers2(refs)
  };
}
export {
  MODULE_ID,
  VERSION,
  createAllHelpers,
  createDeviceHelpers,
  createKernelHelpers,
  createLifecycleHelpers,
  createUIHelpers,
  createUtilsHelpers
};
