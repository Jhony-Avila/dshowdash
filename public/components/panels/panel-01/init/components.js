import { getFeatureStatus } from "./feature-loader.js";
import { initCoreComponents, initTableExtensions } from "./init-core.js";
import { initUIBase } from "./init-ui-base.js";
import { initSearchFilters } from "./init-search-filters.js";
import { initViews } from "./init-views.js";
import { initDataAnalysis } from "./init-data-analysis.js";
import { initUtils } from "./init-utils.js";
import { initPerformance } from "./init-performance.js";
import { initCollaboration } from "./init-collaboration.js";
import { initServices } from "./init-services.js";
import { initNotifications } from "./init-notifications.js";
import { initUIExtras } from "./init-ui-extras.js";
import { destroyComponents } from "./destroy.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:init:components";
async function initAllComponents(ctx, handlers) {
  const result = { _featureStatus: {} };
  initCoreComponents(ctx, handlers, result);
  await initUIBase(ctx, handlers, result);
  await initSearchFilters(ctx, handlers, result);
  await initCollaboration(ctx, handlers, result);
  await initPerformance(ctx, result);
  await initNotifications(ctx, result);
  await initServices(ctx, result);
  return result;
}
async function initUIExtensions(ctx) {
  const result = {};
  await initUIExtras(ctx, result);
  await initViews(ctx, result);
  await initDataAnalysis(ctx, result);
  return result;
}
async function initUtilsExtensions(ctx) {
  const result = {};
  await initUtils(ctx, result);
  await initPerformance(ctx, result);
  await initNotifications(ctx, result);
  return result;
}
import { initCoreComponents as initCoreComponents2 } from "./init-core.js";
import { initTableExtensions as initTableExtensions2 } from "./init-core.js";
import { initServices as initServices2 } from "./init-services.js";
import { destroyComponents as destroyComponents2 } from "./destroy.js";
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    features: getFeatureStatus(),
    modules: [
      "feature-registry",
      "init-core",
      "init-ui-base",
      "init-search-filters",
      "init-views",
      "init-data-analysis",
      "init-utils",
      "init-performance",
      "init-collaboration",
      "init-services",
      "init-notifications",
      "init-ui-extras",
      "destroy"
    ]
  };
}
function healthCheck() {
  const status = getFeatureStatus();
  return {
    status: status.failed.length === 0 ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    loaded: status.loaded.length,
    failed: status.failed.length
  };
}
var components_default = {
  initAllComponents,
  initCoreComponents,
  initTableExtensions,
  initUIExtensions,
  initUtilsExtensions,
  initServices,
  destroyComponents,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  components_default as default,
  destroyComponents2 as destroyComponents,
  healthCheck,
  info,
  initAllComponents,
  initCoreComponents2 as initCoreComponents,
  initServices2 as initServices,
  initTableExtensions2 as initTableExtensions,
  initUIExtensions,
  initUtilsExtensions
};
