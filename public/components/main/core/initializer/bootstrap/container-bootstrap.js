import { MODULE_ID } from "../constants.js";
import { incrementBootstraps, incrementErrors } from "../state.js";
import { getSafeMountPoint } from "../core/mount-point.js";
import { loadPanelHome } from "../panel-home/panel-home-manager.js";
import { createPlaceholder } from "../ui/placeholder.js";
import { createControls } from "/components/main/ui/container-main/components/controls.js";
import { createEnhancements } from "/components/main/ui/container-main/components/ux-enhancements/index.js";
import { CONTAINER_EVENTS } from "/core/runtime/events/catalog/container.events.js";
const VERSION = "3.6.0-PATH-FIX";
function bootstrapPrimaryContainer(state) {
  if (!state.containerPort) return null;
  incrementBootstraps();
  try {
    const primaryContainer = state.containerPort.getOrCreate({
      id: "primary",
      title: "Principal",
      icon: "",
      variant: "default",
      dockSpec: { region: "main", slot: "primary" },
      layoutPolicy: { mode: "inherit" },
      collapsible: true,
      defaultCollapsed: false
    });
    const rootEl = primaryContainer ? primaryContainer.rootEl : null;
    if (primaryContainer && rootEl) {
      const mountInfo = getSafeMountPoint();
      if (mountInfo) {
        if (rootEl.parentNode) {
          if (rootEl.id !== "container-main") {
            rootEl.id = "container-main";
          }
          rootEl.setAttribute("data-container-main", "true");
        } else if (mountInfo.mode !== "existing") {
          mountInfo.element.appendChild(rootEl);
          rootEl.id = "container-main";
          rootEl.setAttribute("data-container-main", "true");
        }
      }
      _initializeControls(primaryContainer, state);
    }
    const contentEl = primaryContainer ? primaryContainer.contentEl : null;
    if (contentEl && !contentEl.hasChildNodes()) {
      loadPanelHome(contentEl).then((success) => {
        if (!success) {
          const placeholder = createPlaceholder();
          contentEl.appendChild(placeholder);
        }
      });
    }
    if (state.eventBusAdapter && state.eventBusAdapter.emit) {
      state.eventBusAdapter.emit(CONTAINER_EVENTS.READY, {
        id: "primary",
        source: MODULE_ID
      });
    }
    return primaryContainer;
  } catch (error) {
    incrementErrors();
    if (state.eventBusAdapter && state.eventBusAdapter.emit) {
      state.eventBusAdapter.emit(CONTAINER_EVENTS.ERROR, {
        id: "primary",
        error: error.message,
        source: MODULE_ID
      });
    }
    return null;
  }
}
function _initializeControls(container, state) {
  try {
    const controls = createControls(container.rootEl, {
      collapsible: true,
      closable: false,
      fullscreenable: true,
      eventBus: state.eventBusAdapter
    });
    controls.init();
    container.controls = controls;
    const enhancements = createEnhancements(container.rootEl, {
      scrollIndicator: true,
      validationShake: true,
      saveIndicator: false,
      connectionStatus: false
    });
    enhancements.init();
    container.enhancements = enhancements;
  } catch (initError) {
    console.debug("[initializer] Controls/Enhancements init failed:", initError.message);
  }
}
var container_bootstrap_default = {
  bootstrapPrimaryContainer
};
export {
  VERSION,
  bootstrapPrimaryContainer,
  container_bootstrap_default as default
};
