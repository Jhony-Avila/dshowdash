import { injectStyles } from "./style-injector.js";
import { initPorts, getPort } from "./ports-manager.js";
import * as state from "./singleton-state.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.module.factory";
async function createAccordion(options = {}) {
  if (state.hasInstance() && !options.forceNew) {
    return { success: true, instance: state.getInstance(), message: "Existing instance returned" };
  }
  state.setOptions(options);
  try {
    initPorts();
    const eventBus = getPort("eventBus");
    await injectStyles();
    const { createAccordionController } = await import("../domain/accordion.controller.js");
    const { createLocalStoragePersistence, createNullPersistence } = await import("../persistence/accordion.persistence.js");
    const { createAccordionView } = await import("../ui/accordion.view.js");
    const { createAccordionTelemetry } = await import("../telemetry/accordion.telemetry.js");
    let persistenceAdapter = null;
    if (options.persistence !== false) {
      persistenceAdapter = createLocalStoragePersistence({
        userId: options.userId,
        tenantId: options.tenantId,
        layoutId: options.layoutId
      });
    } else {
      persistenceAdapter = createNullPersistence();
    }
    const telemetry = createAccordionTelemetry({
      eventBus,
      enabled: options.telemetry !== false,
      debug: options.debug ?? false
    });
    state.setTelemetry(telemetry);
    const view = createAccordionView({
      eventBus,
      iconRegistry: options.iconRegistry ?? getPort("iconRegistry"),
      iconResolver: options.iconResolver ?? null,
      uarpsRegion: options.uarpsRegion ?? null,
      uarpsEnabled: options.uarpsEnabled !== false
    });
    state.setView(view);
    if (options.container) {
      const viewInit = view.init(options.container);
      if (!viewInit.success) {
        return { success: false, error: `View init failed: ${viewInit.error}` };
      }
    }
    const controller = createAccordionController({
      autoPersist: options.autoPersist ?? true
    });
    const initResult = await controller.init({
      structure: options.structure ?? null,
      mode: options.mode,
      persistenceAdapter,
      permissionsPort: options.permissionsPort ?? getPort("permissions"),
      autoRestore: options.autoRestore ?? true
    });
    if (!initResult.success) {
      return { success: false, error: initResult.error ?? initResult.errors };
    }
    if (view) {
      controller.setRenderer(view);
    }
    state.setInstance(controller);
    return {
      success: true,
      instance: controller,
      view,
      telemetry,
      state: controller.getState()
    };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
async function createAccordionWithMock(options = {}) {
  const { getMockModel } = await import("../mock/accordion.mock.js");
  const mockModel = getMockModel();
  return createAccordion({
    ...options,
    structure: mockModel
  });
}
async function mountAccordion(container, options = {}) {
  const result = await createAccordion({
    ...options,
    container
  });
  if (!result.success) {
    return result;
  }
  if (options.structure) {
    result.view?.render(options.structure, result.instance.getState());
  }
  return result;
}
async function mountAccordionWithMock(container, options = {}) {
  const { getMockModel } = await import("../mock/accordion.mock.js");
  const mockModel = getMockModel();
  return mountAccordion(container, {
    ...options,
    structure: mockModel
  });
}
function healthCheck() {
  const checks = {
    factoryAvailable: true,
    createAccordionAvailable: typeof createAccordion === "function",
    mountAccordionAvailable: typeof mountAccordion === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    factories: ["createAccordion", "createAccordionWithMock", "mountAccordion", "mountAccordionWithMock"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var factory_default = {
  createAccordion,
  createAccordionWithMock,
  mountAccordion,
  mountAccordionWithMock,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createAccordion,
  createAccordionWithMock,
  factory_default as default,
  healthCheck,
  info,
  mountAccordion,
  mountAccordionWithMock
};
