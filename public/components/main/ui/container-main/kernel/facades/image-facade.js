const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.image-facade";
function createImageFacade(registry) {
  return {
    virtualize(element, src, options = {}) {
      return registry.get("image")?.register(element, src, options) || null;
    },
    loadNow(imageId) {
      return registry.get("image")?.loadNow(imageId) || Promise.resolve(null);
    },
    pause() {
      return registry.get("image")?.pause();
    },
    resume() {
      return registry.get("image")?.resume();
    }
  };
}
var image_facade_default = { createImageFacade };
export {
  MODULE_ID,
  VERSION,
  createImageFacade,
  image_facade_default as default
};
