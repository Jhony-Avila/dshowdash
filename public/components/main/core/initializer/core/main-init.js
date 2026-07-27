import { MODULE_ID, MAIN_CONTAINER_EVENTS } from "../constants.js";
import {
  incrementInitializations,
  incrementErrors,
  updateInitTime
} from "../state.js";
import { createAdapters } from "./adapters-factory.js";
import { createPorts } from "./ports-factory.js";
import { bootstrapPrimaryContainer } from "../bootstrap/container-bootstrap.js";
import { createContainerPort } from "/components/main/ports/ContainerPort.js";
import { createMainEngine } from "/components/main/domain/main-engine.js";
import { buildContext } from "/components/main/domain/context-builder.js";
import { createActionHub } from "/components/main/domain/action-hub/index.js";
const VERSION = "3.6.0-PATH-FIX";
function initializeMain(state, options) {
  options = options || {};
  const startTime = performance.now();
  incrementInitializations();
  const externalDeps = {
    eventBus: options.eventBus || null,
    router: options.router || null,
    globalState: options.globalState || null,
    telemetryCore: options.telemetryCore || null,
    document: options.document || null
  };
  return Promise.resolve().then(() => {
    const adapterResult = createAdapters(externalDeps, state);
    state.eventBusAdapter = adapterResult.eventBusAdapter;
    state.containerAdapter = adapterResult.containerAdapter;
    state.adapters = adapterResult.adapters;
    state.containerPort = createContainerPort(state.containerAdapter);
    state.ports = createPorts(state.adapters, {
      eventBusAdapter: state.eventBusAdapter,
      containerAdapter: state.containerAdapter
    });
    state.context = buildContext({
      ports: state.ports,
      adapters: state.adapters,
      eventBus: externalDeps.eventBus,
      router: externalDeps.router,
      globalState: externalDeps.globalState,
      telemetry: externalDeps.telemetryCore,
      document: externalDeps.document
    });
    state.engine = createMainEngine(Object.assign({}, state.context, {
      defaultPanel: options.defaultPanel || "panel-01"
    }));
    const engine = state.engine;
    return engine.init();
  }).then(() => {
    const engine = state.engine;
    state.actionHub = createActionHub({
      ports: {
        events: state.eventBusAdapter,
        telemetry: state.ports.telemetry,
        navigation: state.ports.navigation,
        timer: state.ports.timer
      },
      mainEngine: state.engine,
      manifestController: typeof engine.getManifestController === "function" ? engine.getManifestController() : null
    });
    const actionHub = state.actionHub;
    actionHub.init();
    engine.setActionHub(state.actionHub);
    return engine.mount();
  }).then(() => {
    state.primaryContainer = bootstrapPrimaryContainer(state);
    state.primaryHandle = null;
    const cPort = state.containerPort;
    if (cPort && typeof cPort.resolvePrimaryHandle === "function") {
      state.primaryHandle = cPort.resolvePrimaryHandle();
    }
    const pHandle = state.primaryHandle;
    if (pHandle && state.eventBusAdapter && state.eventBusAdapter.emit) {
      try {
        state.eventBusAdapter.emit(MAIN_CONTAINER_EVENTS.PRIMARY_READY, {
          handle: pHandle,
          containerId: pHandle.containerId || "container-main",
          mode: pHandle.mode || "unknown",
          source: MODULE_ID
        });
      } catch (e) {
      }
    }
    const initTime = Math.round(performance.now() - startTime);
    updateInitTime(initTime);
    return state;
  }).catch((error) => {
    incrementErrors();
    throw error;
  });
}
var main_init_default = {
  initializeMain
};
export {
  VERSION,
  main_init_default as default,
  initializeMain
};
