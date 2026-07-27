const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.capability-facade";
function createCapabilityFacade(registry) {
  return {
    request(panelId, capability) {
      return registry.get("capability")?.request(panelId, capability) || { status: "NOT_AVAILABLE" };
    },
    revoke(panelId, capability) {
      return registry.get("capability")?.revoke(panelId, capability) || false;
    },
    has(panelId, capability) {
      return registry.get("capability")?.has(panelId, capability) || false;
    }
  };
}
var capability_facade_default = { createCapabilityFacade };
export {
  MODULE_ID,
  VERSION,
  createCapabilityFacade,
  capability_facade_default as default
};
