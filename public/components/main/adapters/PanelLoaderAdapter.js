import { VERSION, MODULE_ID, createPanelLoaderAdapter, PANEL_ID_PATHS, ITEM_TO_PANEL, CRITICAL_PANELS, LRUCache, retryWithBackoff } from "./panel-loader/index.js";
import { default as default2 } from "./panel-loader/index.js";
const LOCAL_MODULE_ID = "panel-loader-adapter-wrapper";
const LOCAL_VERSION = "7.1.0-ENTERPRISE";
function healthCheck() {
  return { status: "HEALTHY", version: LOCAL_VERSION, moduleId: LOCAL_MODULE_ID, checks: { wrapperActive: true } };
}
export {
  CRITICAL_PANELS,
  ITEM_TO_PANEL,
  LRUCache,
  MODULE_ID,
  PANEL_ID_PATHS,
  VERSION,
  createPanelLoaderAdapter,
  default2 as default,
  healthCheck,
  retryWithBackoff
};
