import { IMAGE_STATES } from "../config/constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.image-virtualizer.observer.intersection-handler";
function createIntersectionHandler(options = {}) {
  const { config, images, loader } = options;
  let _observer = null;
  function _handleIntersection(entries) {
    entries.forEach((entry) => {
      const element = entry.target;
      const imageId = element.getAttribute("data-virtualized-id");
      if (!imageId) return;
      const record = images.get(imageId);
      if (!record) return;
      if (entry.isIntersecting && record.state === IMAGE_STATES.PLACEHOLDER) {
        loader.addToQueue(imageId);
      }
    });
  }
  return {
    init() {
      if (_observer || typeof IntersectionObserver === "undefined") return this;
      _observer = new IntersectionObserver(_handleIntersection, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });
      return this;
    },
    observe(element) {
      _observer?.observe(element);
    },
    unobserve(element) {
      _observer?.unobserve(element);
    },
    disconnect() {
      _observer?.disconnect();
      _observer = null;
    },
    isActive() {
      return !!_observer;
    }
  };
}
var intersection_handler_default = { createIntersectionHandler };
export {
  MODULE_ID,
  VERSION,
  createIntersectionHandler,
  intersection_handler_default as default
};
