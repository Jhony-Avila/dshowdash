const VERSION = "2.1.0-P18EC";
const MODULE_ID = "observability";
import { createObservabilityController } from "./observability-controller.js";
function createObservabilityModule(context = {}) {
  const controller = createObservabilityController(context);
  controller.init();
  return {
    controller,
    healthCheck() {
      return {
        status: "healthy",
        controller: controller.healthCheck(),
        version: VERSION,
        moduleId: MODULE_ID
      };
    },
    info() {
      return {
        version: VERSION,
        moduleId: MODULE_ID,
        controller: controller.info()
      };
    },
    destroy() {
      controller.destroy();
    }
  };
}
import { ObservabilityController as ObservabilityController2, createObservabilityController as createObservabilityController2 } from "./observability-controller.js";
var observability_default = { createObservabilityModule, VERSION, MODULE_ID };
export {
  MODULE_ID,
  ObservabilityController2 as ObservabilityController,
  VERSION,
  createObservabilityController2 as createObservabilityController,
  createObservabilityModule,
  observability_default as default
};
