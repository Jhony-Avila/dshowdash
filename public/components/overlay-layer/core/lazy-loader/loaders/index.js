const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lazy-loader.loaders";
import { registerLoader, unregisterLoader, findLoader, getRegisteredLoaders } from "./registry.js";
import { loadWithRetry, load } from "./execute.js";
export {
  MODULE_ID,
  VERSION,
  findLoader,
  getRegisteredLoaders,
  load,
  loadWithRetry,
  registerLoader,
  unregisterLoader
};
