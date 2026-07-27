const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.deprecation-facade";
function createDeprecationFacade(registry) {
  return {
    register(id, config) {
      return registry.get("deprecation")?.register(id, config) || false;
    },
    check(id, context = "") {
      return registry.get("deprecation")?.check(id, context) || { deprecated: false };
    }
  };
}
var deprecation_facade_default = { createDeprecationFacade };
export {
  MODULE_ID,
  VERSION,
  createDeprecationFacade,
  deprecation_facade_default as default
};
