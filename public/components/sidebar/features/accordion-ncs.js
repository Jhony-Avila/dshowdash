import NavigationModelLoader from "../integration/navigation-model-loader.js";
import { VERSION as MODULE_ID, state, initPorts, injectPorts, getPorts, log } from "./accordion-ncs/constants.js";
import { isEnabled, setFeatureFlag } from "./accordion-ncs/feature-flags.js";
import { loadAccordion, unloadAccordion } from "./accordion-ncs/loader.js";
import { healthCheck, info } from "./accordion-ncs/health.js";
const VERSION = "3.4.0-KERNEL-CTX";
function init(ctx) {
  if (state.initialized) {
    return { ok: true, message: "Already initialized" };
  }
  const eventBus = ctx?.eventBus || ctx;
  const ports = ctx?.ports;
  state.eventBus = eventBus;
  state.initialized = true;
  if (ports) {
    injectPorts(ports);
  }
  initPorts();
  if (isEnabled()) {
    setTimeout(() => {
      loadAccordion();
    }, 500);
  }
  log("info", `Initialized (enabled: ${isEnabled()})`);
  return { ok: true, enabled: isEnabled() };
}
function enable() {
  setFeatureFlag("sidebar.accordion.ncs.enabled", true);
  if (state.initialized && !state.enabled) {
    loadAccordion();
  }
  return { ok: true, message: "Accordion NCS enabled. Reload for full effect." };
}
function disable() {
  setFeatureFlag("sidebar.accordion.ncs.enabled", false);
  if (state.enabled) {
    unloadAccordion();
  }
  return { ok: true, message: "Accordion NCS disabled." };
}
function toggle() {
  if (isEnabled()) {
    return disable();
  } else {
    return enable();
  }
}
function getAccordion() {
  return state.accordion;
}
async function reload(force = false) {
  if (state.enabled) {
    unloadAccordion();
  }
  if (force && NavigationModelLoader.reload) {
    await NavigationModelLoader.reload();
  }
  if (isEnabled()) {
    return loadAccordion();
  }
  return Promise.resolve({ ok: false, message: "Feature flag not enabled" });
}
function cleanup() {
  unloadAccordion();
  if (NavigationModelLoader.abort) {
    NavigationModelLoader.abort();
  }
  state.initialized = false;
  state.eventBus = null;
  state.modelLoaderReady = false;
}
function destroy() {
  cleanup();
}
function getNavigationModel() {
  return NavigationModelLoader.getModel();
}
function getNavigationSnapshot() {
  return NavigationModelLoader.info ? NavigationModelLoader.info() : null;
}
function invalidateNavigationCache() {
  return NavigationModelLoader.reload ? NavigationModelLoader.reload() : null;
}
if (typeof window !== "undefined") {
  window.AccordionNCS = {
    VERSION,
    enable,
    disable,
    toggle,
    isEnabled,
    reload,
    getAccordion,
    getNavigationModel,
    getNavigationSnapshot,
    invalidateNavigationCache,
    healthCheck,
    info
  };
}
var accordion_ncs_default = {
  VERSION,
  MODULE_ID,
  init,
  cleanup,
  enable,
  disable,
  toggle,
  isEnabled,
  reload,
  getAccordion,
  getNavigationModel,
  getNavigationSnapshot,
  invalidateNavigationCache,
  destroy,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  cleanup,
  accordion_ncs_default as default,
  destroy,
  disable,
  enable,
  getAccordion,
  getNavigationModel,
  getNavigationSnapshot,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  invalidateNavigationCache,
  isEnabled,
  reload,
  toggle
};
