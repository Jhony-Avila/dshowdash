const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.slot-facade";
function createSlotFacade(registry, healthReporter) {
  return {
    register(config, contentFactory) {
      const slotManager = registry.get("slot");
      if (!slotManager) throw new Error("Kernel not initialized");
      const slotId = config.id || config.slotId;
      registry.get("lifecycle")?.register(slotId);
      return slotManager.register(config, contentFactory);
    },
    unregister(slotId) {
      registry.get("lifecycle")?.reset(slotId);
      return registry.get("slot")?.unregister(slotId) || false;
    },
    async activate(slotId) {
      const slotManager = registry.get("slot");
      if (!slotManager) throw new Error("Kernel not initialized");
      const startTime = performance.now();
      const result = await slotManager.activate(slotId);
      registry.get("metrics")?.timing(slotId, "activation_time", performance.now() - startTime);
      healthReporter?.incrementSlotActivations();
      return result;
    },
    get(slotId) {
      return registry.get("slot")?.get(slotId) || null;
    },
    getActive() {
      return registry.get("slot")?.getActive() || null;
    },
    list() {
      return registry.get("slot")?.list() || [];
    },
    pauseAll() {
      return registry.get("slot")?.pauseAll();
    },
    resumeActive() {
      return registry.get("slot")?.resumeActive();
    }
  };
}
var slot_facade_default = { createSlotFacade };
export {
  MODULE_ID,
  VERSION,
  createSlotFacade,
  slot_facade_default as default
};
