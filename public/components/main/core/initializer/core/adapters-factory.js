import { createRouterAdapter } from "/components/main/adapters/RouterAdapter.js";
import { createAuthAdapter } from "/components/main/adapters/AuthAdapter.js";
import { createStateAdapter } from "/components/main/adapters/StateAdapter.js";
import { createPanelLoaderAdapter } from "/components/main/adapters/PanelLoaderAdapter.js";
import { createTelemetryAdapter } from "/components/main/adapters/TelemetryAdapter.js";
import { createDOMAdapter } from "/components/main/adapters/DOMAdapter.js";
import { createEventBusAdapter } from "/components/main/adapters/EventBusAdapter.js";
import { createUIAdapter } from "/components/main/adapters/UIAdapter.js";
import { createContainerAdapter } from "/components/main/adapters/container/adapter.js";
import { createTimerAdapter } from "/components/main/adapters/TimerAdapter.js";
import { createGlobalsAdapter } from "/components/main/adapters/GlobalsAdapter.js";
import { createCanvasBasic } from "/components/main/ui/canvas-basic.js";
import { LAYOUT_EVENTS } from "/core/runtime/events/catalog/layout.events.js";
const VERSION = "5.8.0-P2-ENTERPRISE";
const MODULE_ID = "main.core.initializer.core.adapters-factory";
function createAdapters(externalDeps, state) {
  const eventBusAdapter = createEventBusAdapter(externalDeps.eventBus, { source: "main" });
  const uiAdapter = createUIAdapter({ document: externalDeps.document });
  const routerAdapter = createRouterAdapter({
    router: externalDeps.router,
    eventBus: externalDeps.eventBus
  });
  const authAdapter = createAuthAdapter({ eventBus: externalDeps.eventBus });
  const stateAdapter = createStateAdapter({ globalState: externalDeps.globalState });
  const telemetryAdapter = createTelemetryAdapter({
    telemetry: externalDeps.telemetryCore,
    eventBus: externalDeps.eventBus
  });
  const domAdapter = createDOMAdapter({ document: externalDeps.document });
  const panelLoaderAdapter = createPanelLoaderAdapter({});
  const canvasBasic = createCanvasBasic();
  const timerAdapter = createTimerAdapter();
  const globalsAdapter = createGlobalsAdapter();
  const onLayoutRequested = (layout) => {
    if (state.engine) {
      const layoutController = state.engine.getLayoutController ? state.engine.getLayoutController() : null;
      if (layoutController && typeof layoutController.applyLayout === "function") {
        layoutController.applyLayout(layout);
        if (eventBusAdapter && eventBusAdapter.emit) {
          eventBusAdapter.emit(LAYOUT_EVENTS.APPLIED, {
            layout,
            source: "container-policy"
          });
        }
      }
    }
  };
  const containerAdapter = createContainerAdapter({
    domAdapter,
    uiAdapter,
    eventsPort: eventBusAdapter,
    telemetryPort: telemetryAdapter,
    onLayoutRequested
  });
  const adapters = {
    router: routerAdapter,
    auth: authAdapter,
    state: stateAdapter,
    panelLoader: panelLoaderAdapter,
    telemetry: telemetryAdapter,
    dom: domAdapter,
    canvas: canvasBasic,
    eventBus: eventBusAdapter,
    ui: uiAdapter,
    container: containerAdapter,
    timer: timerAdapter,
    globals: globalsAdapter
  };
  return {
    adapters,
    eventBusAdapter,
    containerAdapter
  };
}
var adapters_factory_default = {
  createAdapters
};
export {
  MODULE_ID,
  VERSION,
  createAdapters,
  adapters_factory_default as default
};
