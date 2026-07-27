import { VERSION, MODULE_ID, MAIN_CONTAINER_EVENTS, PANEL_HOME_PATH } from "./constants.js";
import { initializeMain } from "./core/main-init.js";
import { bootstrapPrimaryContainer } from "./bootstrap/container-bootstrap.js";
import { createPlaceholder } from "./ui/placeholder.js";
import { unmountPanelHome, isPanelHomeMounted } from "./panel-home/panel-home-manager.js";
import { getMetrics, info, healthCheck } from "./diagnostics/health.js";
var initializer_default = {
  initializeMain,
  bootstrapPrimaryContainer,
  createPlaceholder,
  unmountPanelHome,
  isPanelHomeMounted,
  getMetrics,
  info,
  healthCheck,
  VERSION,
  MODULE_ID,
  MAIN_CONTAINER_EVENTS,
  PANEL_HOME_PATH
};
export {
  MAIN_CONTAINER_EVENTS,
  MODULE_ID,
  PANEL_HOME_PATH,
  VERSION,
  bootstrapPrimaryContainer,
  createPlaceholder,
  initializer_default as default,
  getMetrics,
  healthCheck,
  info,
  initializeMain,
  isPanelHomeMounted,
  unmountPanelHome
};
