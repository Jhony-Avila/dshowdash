const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.effects.parallax";
function createParallaxBackground(container) {
  let _mouseMoveHandler = null;
  let _intensity = 10;
  let _initialized = false;
  function _handleMouseMove(e) {
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) / rect.width;
    const deltaY = (e.clientY - centerY) / rect.height;
    const moveX = deltaX * _intensity;
    const moveY = deltaY * _intensity;
    container.style.setProperty("--parallax-x", `${moveX}px`);
    container.style.setProperty("--parallax-y", `${moveY}px`);
  }
  return {
    init(options = {}) {
      if (_initialized) return this;
      _intensity = options.intensity || 10;
      container?.classList?.add("dsd-container--parallax");
      if (options.particles) {
        container?.classList?.add("dsd-container--parallax-particles");
      }
      _mouseMoveHandler = _handleMouseMove;
      container?.addEventListener("mousemove", _mouseMoveHandler, { passive: true });
      _initialized = true;
      return this;
    },
    setIntensity(intensity) {
      _intensity = intensity;
      return this;
    },
    destroy() {
      if (_mouseMoveHandler && container) {
        container.removeEventListener("mousemove", _mouseMoveHandler);
      }
      container?.classList?.remove("dsd-container--parallax", "dsd-container--parallax-particles");
      container?.style?.removeProperty("--parallax-x");
      container?.style?.removeProperty("--parallax-y");
      _initialized = false;
    },
    isInitialized() {
      return _initialized;
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  createParallaxBackground
};
