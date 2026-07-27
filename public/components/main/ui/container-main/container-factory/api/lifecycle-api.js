const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.container-factory.api.lifecycle-api";
import { createContainerDOM } from "../dom/index.js";
import { initializeComponents, destroyComponents, LIFECYCLE_HOOKS } from "../components/index.js";
import { getEventBus } from "../../core/event-bridge.js";
function createLifecycleAPI(context) {
  const containerId = context.containerId;
  const options = context.options;
  const state = context.state;
  const refs = context.refs;
  const setComponents = context.setComponents;
  const getComponents = context.getComponents;
  return {
    mount() {
      if (state.mounted) return this;
      const container = createContainerDOM(containerId, options);
      refs.container = container;
      refs.contentEl = container.querySelector(".dsd-container__content");
      if (refs.target) {
        refs.target.appendChild(container);
      }
      let eventBus = null;
      try {
        eventBus = getEventBus({});
      } catch (e) {
        eventBus = null;
      }
      refs.eventBus = eventBus;
      const components = initializeComponents(container, options, state, eventBus);
      setComponents(components);
      state.mounted = true;
      container.setAttribute("data-state", "ready");
      components.eventHooks?.emit?.(LIFECYCLE_HOOKS.MOUNTED, { container });
      options.onReady?.(this);
      return this;
    },
    unmount() {
      if (!state.mounted) return this;
      const components = getComponents();
      components.eventHooks?.emit?.(LIFECYCLE_HOOKS.BEFORE_UNMOUNT, { container: refs.container });
      destroyComponents(components);
      refs.container?.remove();
      state.mounted = false;
      setComponents({});
      return this;
    }
  };
}
var lifecycle_api_default = { createLifecycleAPI };
export {
  MODULE_ID,
  VERSION,
  createLifecycleAPI,
  lifecycle_api_default as default
};
