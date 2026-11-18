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
  return function resolvePanelLabel(panelId, origem = {}) {
    if (!panelId) return "Principal";
    try {
      if (sidebarRegistry && typeof sidebarRegistry.getItems === "function") {
        const items = sidebarRegistry.getItems();
        const rot = (it) => it.label || it.title || panelId;
        const doPainel = (it) => !it.panelId || it.panelId === panelId;
        if (origem.itemKey) {
          const it = items.find((x) => x.key === origem.itemKey && doPainel(x));
          if (it) return rot(it);
        }
        for (const r of [origem.route, typeof window !== "undefined" ? window.location.hash : null]) {
          if (!r) continue;
          const it = items.find((x) => x.route === r && doPainel(x));
          if (it) return rot(it);
        }
        const mesmos = items.filter((x) => x.panelId === panelId || x.id === panelId);
        if (mesmos.length === 1) return rot(mesmos[0]);
        if (mesmos.length > 1) return "Painel";
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
