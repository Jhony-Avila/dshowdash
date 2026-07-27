const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.status.save-indicator";
import { SAVE_ICONS } from "../constants.js";
function createSaveIndicator(container) {
  let _indicatorEl = null;
  let _hideTimeout = null;
  let _initialized = false;
  function _ensureElement() {
    if (_indicatorEl) return _indicatorEl;
    const headerLeft = container?.querySelector(".dsd-container__header-left");
    if (!headerLeft) return null;
    _indicatorEl = document.createElement("div");
    _indicatorEl.className = "dsd-container__save-indicator";
    _indicatorEl.innerHTML = `
      <span class="dsd-container__save-indicator-icon">${SAVE_ICONS.check}</span>
      <span class="dsd-container__save-indicator-text">Salvo</span>
    `;
    headerLeft.appendChild(_indicatorEl);
    return _indicatorEl;
  }
  return {
    init() {
      if (_initialized) return this;
      _ensureElement();
      _initialized = true;
      return this;
    },
    saving() {
      const el = _ensureElement();
      if (!el) return this;
      if (_hideTimeout) clearTimeout(_hideTimeout);
      el.classList.add("dsd-container__save-indicator--visible", "dsd-container__save-indicator--saving");
      el.querySelector(".dsd-container__save-indicator-icon").innerHTML = SAVE_ICONS.spinner;
      el.querySelector(".dsd-container__save-indicator-text").textContent = "Salvando...";
      return this;
    },
    saved(autoHideMs = 2e3) {
      const el = _ensureElement();
      if (!el) return this;
      if (_hideTimeout) clearTimeout(_hideTimeout);
      el.classList.remove("dsd-container__save-indicator--saving");
      el.classList.add("dsd-container__save-indicator--visible");
      el.querySelector(".dsd-container__save-indicator-icon").innerHTML = SAVE_ICONS.check;
      el.querySelector(".dsd-container__save-indicator-text").textContent = "Salvo";
      if (autoHideMs > 0) {
        _hideTimeout = setTimeout(() => this.hide(), autoHideMs);
      }
      return this;
    },
    hide() {
      if (_indicatorEl) {
        _indicatorEl.classList.remove("dsd-container__save-indicator--visible", "dsd-container__save-indicator--saving");
      }
      return this;
    },
    error(message = "Erro ao salvar") {
      const el = _ensureElement();
      if (!el) return this;
      if (_hideTimeout) clearTimeout(_hideTimeout);
      el.classList.remove("dsd-container__save-indicator--saving");
      el.classList.add("dsd-container__save-indicator--visible");
      el.style.setProperty("--indicator-color", "var(--cm-color-error)");
      el.querySelector(".dsd-container__save-indicator-text").textContent = message;
      _hideTimeout = setTimeout(() => {
        this.hide();
        el.style.removeProperty("--indicator-color");
      }, 3e3);
      return this;
    },
    destroy() {
      if (_hideTimeout) clearTimeout(_hideTimeout);
      if (_indicatorEl) _indicatorEl.remove();
      _indicatorEl = null;
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
  createSaveIndicator
};
