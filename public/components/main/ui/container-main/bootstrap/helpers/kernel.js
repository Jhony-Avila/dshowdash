const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.bootstrap.helpers.kernel";
function createKernelHelpers(refs) {
  const r = refs;
  return {
    registerSlot(cfg, contentFactory) {
      return r.kernel?.registerSlot(cfg, contentFactory);
    },
    activateSlot(slotId) {
      return r.kernel?.activateSlot(slotId);
    },
    getActiveSlot() {
      return r.kernel?.getActiveSlot();
    },
    requestCapability(panelId, capability) {
      return r.kernel?.requestCapability(panelId, capability);
    },
    hasCapability(panelId, capability) {
      return r.kernel?.hasCapability(panelId, capability);
    },
    registerLayout(panelId, panel, element, opts) {
      return r.kernel?.registerLayout(panelId, panel, element, opts);
    },
    resizePanel(panelId, width, height) {
      return r.kernel?.resizePanel(panelId, width, height);
    },
    togglePanelFullscreen(panelId) {
      return r.kernel?.toggleFullscreen(panelId);
    },
    recordMetric(panelId, name, value, opts) {
      return r.kernel?.recordMetric(panelId, name, value, opts);
    },
    virtualizeImage(element, src, opts) {
      return r.kernel?.virtualizeImage(element, src, opts);
    },
    getPreset(presetId) {
      return r.slotPresets?.get(presetId);
    },
    listPresets(category) {
      return r.slotPresets?.list(category);
    },
    // @ts-expect-error strict migration — TS2345
    applyPreset(presetId, overrides) {
      return r.slotPresets?.apply(presetId, overrides);
    }
  };
}
var kernel_default = { createKernelHelpers };
export {
  MODULE_ID,
  VERSION,
  createKernelHelpers,
  kernel_default as default
};
