import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-progress-bar";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitEvent(eventType, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(eventType, { source: MODULE_ID, timestamp: Date.now(), ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.animated !== void 0 && typeof options.animated !== "boolean") errors.push("animated must be a boolean");
  if (options.showText !== void 0 && typeof options.showText !== "boolean") errors.push("showText must be a boolean");
  if (options.variant !== void 0 && !["default", "success", "warning", "error", "info"].includes(options.variant)) errors.push("variant must be default|success|warning|error|info");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const PROGRESS_VARIANT = { DEFAULT: "default", SUCCESS: "success", WARNING: "warning", ERROR: "error", INFO: "info" };
function createProgressBar(container, options = {}) {
  _validateOptions(options);
  const { animated = true, showText = true, variant = PROGRESS_VARIANT.DEFAULT, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _progressEl = null;
  let _value = 0;
  let _variant = variant;
  let _indeterminate = false;
  let _visible = false;
  let _label = "Progresso";
  function _createProgressElement() {
    const header = container.querySelector(".dsd-container__header");
    if (!header) return null;
    let existing = container.querySelector(".dsd-progress-bar");
    if (existing) return existing;
    const progress = document.createElement("div");
    progress.className = "dsd-progress-bar";
    progress.setAttribute("role", "progressbar");
    progress.setAttribute("aria-valuemin", "0");
    progress.setAttribute("aria-valuemax", "100");
    progress.setAttribute("aria-valuenow", "0");
    progress.setAttribute("aria-label", _label);
    progress.setAttribute("aria-live", "polite");
    progress.innerHTML = `<div class="dsd-progress-bar__track"><div class="dsd-progress-bar__fill"></div></div>${showText ? '<span class="dsd-progress-bar__text" aria-hidden="true">0%</span>' : ""}`;
    header.insertAdjacentElement("afterend", progress);
    return progress;
  }
  function _updateProgress() {
    if (!_progressEl) return;
    const fill = _progressEl.querySelector(".dsd-progress-bar__fill");
    const text = _progressEl.querySelector(".dsd-progress-bar__text");
    _progressEl.classList.toggle("dsd-progress-bar--indeterminate", _indeterminate);
    _progressEl.classList.toggle("dsd-progress-bar--animated", animated);
    _progressEl.classList.toggle("dsd-progress-bar--visible", _visible);
    Object.values(PROGRESS_VARIANT).forEach((v) => _progressEl.classList.remove(`dsd-progress-bar--${v}`));
    _progressEl.classList.add(`dsd-progress-bar--${_variant}`);
    if (_indeterminate) {
      _progressEl.removeAttribute("aria-valuenow");
      _progressEl.setAttribute("aria-valuetext", "Carregando...");
    } else {
      _progressEl.setAttribute("aria-valuenow", String(_value));
      _progressEl.setAttribute("aria-valuetext", `${Math.round(_value)}% conclu\xEDdo`);
      if (fill) fill.style.width = `${_value}%`;
    }
    if (text) text.textContent = _indeterminate ? "" : `${Math.round(_value)}%`;
  }
  const progressApi = {
    init() {
      if (_initialized) return this;
      _progressEl = _createProgressElement();
      _initialized = true;
      _updateProgress();
      return this;
    },
    show() {
      _visible = true;
      _updateProgress();
      return this;
    },
    hide() {
      _visible = false;
      _updateProgress();
      return this;
    },
    isVisible() {
      return _visible;
    },
    setValue(value) {
      if (typeof value !== "number") return this;
      _value = Math.max(0, Math.min(100, value));
      _updateProgress();
      if (_value >= 100) _emitEvent(MAIN_EVENTS.PROGRESS_COMPLETE, { containerId: container.id });
      return this;
    },
    getValue() {
      return _value;
    },
    increment(amount = 10) {
      return this.setValue(_value + amount);
    },
    reset() {
      _value = 0;
      _updateProgress();
      return this;
    },
    setVariant(v) {
      if (Object.values(PROGRESS_VARIANT).includes(v)) {
        _variant = v;
        _updateProgress();
      }
      return this;
    },
    setLabel(label) {
      if (typeof label === "string") {
        _label = label;
        _progressEl?.setAttribute("aria-label", label);
      }
      return this;
    },
    setIndeterminate(ind) {
      _indeterminate = !!ind;
      _updateProgress();
      return this;
    },
    isIndeterminate() {
      return _indeterminate;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _progressEl?.remove();
      _progressEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, value: _value, variant: _variant, indeterminate: _indeterminate, visible: _visible, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return progressApi;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var progress_bar_default = { createProgressBar, injectEventBus, info, healthCheck, VERSION, MODULE_ID, PROGRESS_VARIANT };
export {
  MODULE_ID,
  PROGRESS_VARIANT,
  VERSION,
  createProgressBar,
  progress_bar_default as default,
  healthCheck,
  info,
  injectEventBus
};
