const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-main:label-resolver";
let _injectedSidebarRegistry = null;
function injectSidebarRegistry(registry) {
  _injectedSidebarRegistry = registry;
}
function getInjectedSidebarRegistry() {
  return _injectedSidebarRegistry;
}
function getSidebarRegistry(context) {
  if (context?.ports?.sidebarRegistry) return context.ports.sidebarRegistry;
  if (context?.sidebarRegistry) return context.sidebarRegistry;
  if (_injectedSidebarRegistry) return _injectedSidebarRegistry;
  return null;
}
function createLabelResolver(sidebarRegistry) {
  return function resolvePanelLabel(panelId) {
    if (!panelId) return "Principal";
    try {
      if (sidebarRegistry && typeof sidebarRegistry.getItems === "function") {
        const items = sidebarRegistry.getItems();
        for (let i = 0; i < items.length; i++) {
          if (items[i].panelId === panelId || items[i].id === panelId) {
            return items[i].label || items[i].title || panelId;
          }
        }
      }
    } catch (e) {
    }
    return panelId.replace(/^panel-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  };
}
function healthCheck() {
  const hasInjected = !!_injectedSidebarRegistry;
  const checks = { resolverReady: true, hasInjectedRegistry: hasInjected };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedRegistry: !!_injectedSidebarRegistry, diStrict: true };
}
export {
  MODULE_ID,
  VERSION,
  createLabelResolver,
  getInjectedSidebarRegistry,
  getSidebarRegistry,
  healthCheck,
  info,
  injectSidebarRegistry
};
