import { VERSION, MODULE_ID } from "../constants.js";
function createGettersAPI(context) {
  const containerId = context.containerId;
  const options = context.options;
  const state = context.state;
  const refs = context.refs;
  const getComponents = context.getComponents;
  return {
    getElement() {
      return refs.container;
    },
    getId() {
      return containerId;
    },
    getOptions() {
      return { ...options };
    },
    getComponent(name) {
      return getComponents()[name] || null;
    },
    healthCheck() {
      const components = getComponents();
      const componentCount = Object.keys(components).length;
      const healthyComponents = Object.values(components).filter((c) => c?.healthCheck?.()?.status === "HEALTHY").length;
      return {
        status: state.error ? "DEGRADED" : state.mounted ? "HEALTHY" : "NOT_MOUNTED",
        version: VERSION,
        moduleId: MODULE_ID,
        containerId,
        mounted: state.mounted,
        state: { ...state },
        componentCount,
        healthyComponents,
        controlsInitialized: !!components.controls?.isInitialized?.()
      };
    }
  };
}
var getters_api_default = { createGettersAPI };
export {
  createGettersAPI,
  getters_api_default as default
};
