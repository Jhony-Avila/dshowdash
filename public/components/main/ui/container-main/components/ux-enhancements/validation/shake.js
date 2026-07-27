const VERSION = "3.0.0-UX-ENHANCED";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.validation.shake";
function createValidationShake(container) {
  let _shakeTimeout = null;
  return {
    shake() {
      if (!container) return this;
      if (_shakeTimeout) {
        clearTimeout(_shakeTimeout);
        container.classList.remove("dsd-container--validation-error");
      }
      void container.offsetWidth;
      container.classList.add("dsd-container--validation-error");
      _shakeTimeout = setTimeout(() => {
        container.classList.remove("dsd-container--validation-error");
        _shakeTimeout = null;
      }, 500);
      return this;
    },
    onValidationError(errors) {
      if (errors && (Array.isArray(errors) ? errors.length > 0 : Object.keys(errors).length > 0)) {
        this.shake();
      }
      return this;
    },
    destroy() {
      if (_shakeTimeout) {
        clearTimeout(_shakeTimeout);
        container?.classList?.remove("dsd-container--validation-error");
      }
    }
  };
}
export {
  MODULE_ID,
  VERSION,
  createValidationShake
};
