import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { NAV_INTENTS } from "/core/runtime/events/catalog/nav.events.js";
import NavigationAdapter, { requestNavigation, requestPanelNavigation, requestIntegrationNavigation } from "../../core/navigation-adapter.js";
const VERSION = "2.2.0-ES6";
const MODULE_ID = "header-components-navigation-helper";
const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function navigateToRoute(route, source) {
  if (!route) return false;
  return requestNavigation({
    route,
    source: source || MODULE_ID
  });
}
function navigateToPanel(panelId, source) {
  if (!panelId) return false;
  return requestPanelNavigation(panelId, source || MODULE_ID);
}
function navigateToIntegration(integrationId, source) {
  if (!integrationId) return false;
  return requestIntegrationNavigation(integrationId, source || MODULE_ID);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    eventFix: true,
    portsInitialized: Ports.isInitialized(),
    adapterVersion: NavigationAdapter.VERSION,
    delegatesTo: "navigation-adapter",
    usesOfficialEvents: true
  };
}
function healthCheck() {
  const adapterHealth = NavigationAdapter.healthCheck ? NavigationAdapter.healthCheck() : { status: "UNKNOWN" };
  return {
    status: adapterHealth.status,
    version: VERSION,
    moduleId: MODULE_ID,
    eventFix: true,
    checks: {
      adapterAvailable: true,
      adapterHealthy: adapterHealth.status === "HEALTHY",
      usesOfficialEvents: true
    },
    adapterHealth,
    portsInitialized: Ports.isInitialized()
  };
}
var navigation_helper_default = {
  VERSION,
  MODULE_ID,
  NAV_INTENTS,
  navigateToRoute,
  navigateToPanel,
  navigateToIntegration,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  NAV_INTENTS,
  VERSION,
  navigation_helper_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  navigateToIntegration,
  navigateToPanel,
  navigateToRoute
};
