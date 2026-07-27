const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "sidebar.features.accordion-ncs.loader";
import NavigationModelLoader from "../../integration/navigation-model-loader.js";
import { CONTAINER_ID, state, log, initPorts } from "./constants.js";
import { createContainer, removeContainer, waitForNavContent } from "./container.js";
import { hideLegacyNav, showLegacyNav } from "./legacy-nav.js";
import { convertModelToAccordionStructure } from "./model-converter.js";
import { setupNavigationHandler } from "./navigation-handler.js";
async function waitForModel(maxAttempts = 20, interval = 150) {
  for (let i = 0; i < maxAttempts; i++) {
    const model = NavigationModelLoader.getModel();
    if (model && model.sections && model.sections.length > 0) {
      return { success: true, model, source: "memory" };
    }
    if (NavigationModelLoader.isReady && NavigationModelLoader.isReady()) {
      const m = NavigationModelLoader.getModel();
      if (m) return { success: true, model: m, source: "ready" };
    }
    await new Promise((r) => {
      setTimeout(r, interval);
    });
  }
  return { success: false, reason: "timeout" };
}
async function loadAccordionFallback() {
  try {
    log("warn", "Using mock fallback");
    const navReady = await waitForNavContent(15, 100);
    if (!navReady) {
      log("warn", "Nav content still not available, skipping accordion");
      return { success: false, error: "Nav content not available" };
    }
    const AccordionModule = await import("/components/accordion/index.js");
    const container = createContainer();
    if (!container) {
      log("warn", "Container creation failed, skipping accordion");
      return { success: false, error: "Container creation failed" };
    }
    const result = await AccordionModule.mountAccordionWithMock(`#${CONTAINER_ID}`);
    if (result.success) {
      state.accordion = result;
      state.accordion.source = "mock";
      state.enabled = true;
      hideLegacyNav();
      setupNavigationHandler(result);
      log("info", "Accordion NCS loaded with MOCK fallback");
      return { success: true, source: "mock", accordion: result };
    }
    throw new Error(result.error || "Mock mount failed");
  } catch (error) {
    log("error", `Fallback also failed: ${error.message}`);
    removeContainer();
    return { success: false, error: error.message };
  }
}
async function loadAccordion() {
  initPorts();
  try {
    const loadResult = await NavigationModelLoader.load();
    let model = null;
    let source = "unknown";
    if (!loadResult.success && loadResult.reason === "already-loading") {
      log("info", "Model already loading, waiting for it...");
      const waitResult = await waitForModel(20, 150);
      if (waitResult.success) {
        model = waitResult.model;
        source = waitResult.source;
        log("info", "Model obtained after waiting");
      } else {
        log("warn", "Timeout waiting for model, using fallback");
        return loadAccordionFallback();
      }
    } else if (loadResult.success) {
      model = loadResult.model || NavigationModelLoader.getModel();
      source = loadResult.source;
    } else {
      log("warn", `Model load failed: ${loadResult.reason || loadResult.error}`);
      return loadAccordionFallback();
    }
    state.modelLoaderReady = true;
    if (!model || !model.sections || model.sections.length === 0) {
      log("warn", "Model empty, using fallback");
      return loadAccordionFallback();
    }
    const structure = convertModelToAccordionStructure(model);
    const navReady = await waitForNavContent(15, 100);
    if (!navReady) {
      log("warn", "Nav content not available, using fallback");
      return loadAccordionFallback();
    }
    const AccordionModule = await import("/components/accordion/index.js");
    const container = createContainer();
    if (!container) {
      throw new Error("Container creation failed");
    }
    const result = await AccordionModule.mountAccordion(`#${CONTAINER_ID}`, {
      structure,
      persistence: true,
      telemetry: true
    });
    if (result.success) {
      state.accordion = result;
      state.accordion.source = source;
      state.accordion.modelVersion = model.version;
      state.enabled = true;
      hideLegacyNav();
      setupNavigationHandler(result);
      log("info", "Accordion NCS loaded via NavigationModelLoader");
      log("info", `Source: ${source}, Sections: ${structure.sections.length}`);
      return {
        success: true,
        source,
        accordion: result,
        sectionsCount: structure.sections.length,
        modelVersion: model.version
      };
    } else {
      throw new Error(result.error || "Mount failed");
    }
  } catch (error) {
    log("error", `Failed to load Accordion NCS: ${error.message}`);
    return loadAccordionFallback();
  }
}
function unloadAccordion() {
  state.cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  state.cleanups = [];
  if (state.accordion && state.accordion.instance) {
    try {
      state.accordion.instance.destroy();
    } catch (e) {
    }
  }
  removeContainer();
  showLegacyNav();
  state.accordion = null;
  state.enabled = false;
  log("info", "Accordion NCS unloaded");
}
var loader_default = {
  loadAccordion,
  loadAccordionFallback,
  unloadAccordion,
  waitForModel
};
export {
  MODULE_ID,
  VERSION,
  loader_default as default,
  loadAccordion,
  loadAccordionFallback,
  unloadAccordion
};
