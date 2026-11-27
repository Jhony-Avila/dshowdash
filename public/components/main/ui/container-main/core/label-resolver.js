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
const TITULOS_PAINEL = Object.freeze({ "panel-integracoes": "Integra\xE7\xF5es", "panel-gmail": "Gmail" });
const PAINEIS_COMPARTILHADOS = /* @__PURE__ */ new Set(["panel-stub-dev"]);
function createLabelResolver(sidebarRegistry) {
  return function resolvePanelLabel(panelId, origem = {}) {
    if (!panelId) return "Principal";
    const compartilhado = PAINEIS_COMPARTILHADOS.has(panelId);
    try {
      if (sidebarRegistry && typeof sidebarRegistry.getItems === "function") {
        const items = sidebarRegistry.getItems();
        if (compartilhado) {
          for (const r of [origem.route, typeof window !== "undefined" ? window.location.hash : null]) {
            if (!r) continue;
            const it = items.find((x) => x.panelId === panelId && x.route === r);
            if (it) return it.label || it.title || "Painel";
          }
          return "Painel";
        }
        for (let i = 0; i < items.length; i++) {
          if (items[i].panelId === panelId || items[i].id === panelId) {
            return items[i].label || items[i].title || panelId;
          }
        }
      }
    } catch (e) {
    }
    if (compartilhado) return "Painel";
    if (TITULOS_PAINEL[panelId]) return TITULOS_PAINEL[panelId];
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
  PAINEIS_COMPARTILHADOS,
  TITULOS_PAINEL,
  VERSION,
  createLabelResolver,
  getInjectedSidebarRegistry,
  getSidebarRegistry,
  healthCheck,
  info,
  injectSidebarRegistry
};
