const VERSION = "5.5.0-ENTERPRISE";
const MODULE_ID = "login-modal-accessibility-aria-manager";
const isBrowser = typeof document !== "undefined";
const _metrics = { modalOpens: 0, modalCloses: 0, fieldErrors: 0, fieldClears: 0, alerts: 0 };
function ModalAriaManager(modal, config) {
  config = config || {};
  this.modal = modal;
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.idPrefix = config.idPrefix || "login";
}
ModalAriaManager.prototype.setOpen = function() {
  if (!this.modal) return;
  _metrics.modalOpens++;
  this.modal.removeAttribute("hidden");
  this.modal.setAttribute("aria-hidden", "false");
  this.modal.setAttribute("role", "dialog");
  this.modal.setAttribute("aria-modal", "true");
  const titleId = `${this.idPrefix}-title`;
  const title = this.modal.querySelector(`#${titleId}`);
  if (title) this.modal.setAttribute("aria-labelledby", titleId);
  this._track("modal:opened");
};
ModalAriaManager.prototype.setClosed = function() {
  if (!this.modal) return;
  _metrics.modalCloses++;
  this.modal.setAttribute("hidden", "");
  this.modal.setAttribute("aria-hidden", "true");
  this.modal.removeAttribute("role");
  this.modal.removeAttribute("aria-modal");
  this.modal.removeAttribute("aria-labelledby");
  this._track("modal:closed");
};
ModalAriaManager.prototype._track = function(event) {
  if (this.telemetry && typeof this.telemetry === "function") this.telemetry(event, { timestamp: Date.now() });
};
function FieldAriaManager(config) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.onRenderError = config.onRenderError || this._defaultRenderError.bind(this);
  this.onClearError = config.onClearError || this._defaultClearError.bind(this);
  this.errorElements = /* @__PURE__ */ new Set();
}
FieldAriaManager.prototype.setError = function(input, message, errorCode) {
  if (!input || !isBrowser) return;
  _metrics.fieldErrors++;
  input.setAttribute("aria-invalid", "true");
  const errorId = `${input.id}-error`;
  this.onRenderError(input, errorId, message, errorCode);
  input.setAttribute("aria-describedby", errorId);
  this.errorElements.add(errorId);
  this._track("field:error", { field: input.id, code: errorCode });
};
FieldAriaManager.prototype.clearError = function(input) {
  if (!input) return;
  _metrics.fieldClears++;
  input.removeAttribute("aria-invalid");
  const errorId = input.getAttribute("aria-describedby");
  if (errorId) {
    this.onClearError(input, errorId);
    input.removeAttribute("aria-describedby");
    this.errorElements.delete(errorId);
  }
  this._track("field:cleared", { field: input.id });
};
FieldAriaManager.prototype._defaultRenderError = function(input, errorId, message, errorCode) {
  if (!isBrowser) return;
  let errorElement = document.getElementById(errorId);
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = errorId;
    errorElement.className = this.config.errorClass || "input-error-message";
    errorElement.setAttribute("role", "alert");
    errorElement.setAttribute("aria-live", "polite");
    if (errorCode) errorElement.setAttribute("data-error-code", errorCode);
    if (input.parentElement) input.parentElement.appendChild(errorElement);
    else input.insertAdjacentElement("afterend", errorElement);
  }
  errorElement.textContent = message;
  if (errorCode && !errorElement.hasAttribute("data-error-code")) errorElement.setAttribute("data-error-code", errorCode);
};
FieldAriaManager.prototype._defaultClearError = (input, errorId) => {
  if (!isBrowser) return;
  const el = document.getElementById(errorId);
  if (el) el.remove();
};
FieldAriaManager.prototype.cleanup = function() {
  const self = this;
  if (!isBrowser) return;
  self.errorElements.forEach((errorId) => {
    const el = document.getElementById(errorId);
    if (el) el.remove();
  });
  self.errorElements.clear();
};
FieldAriaManager.prototype._track = function(event, detail) {
  detail = detail || {};
  if (this.telemetry && typeof this.telemetry === "function") this.telemetry(event, Object.assign({ timestamp: Date.now() }, detail));
};
function AlertAriaManager(config) {
  config = config || {};
  this.config = config;
  this.telemetry = config.telemetry || null;
  this.autoFocus = config.autoFocus !== false;
  this.temporaryTabIndex = /* @__PURE__ */ new WeakMap();
}
AlertAriaManager.prototype.setStatus = function(element, role, live, message, shouldFocus) {
  if (shouldFocus === void 0) shouldFocus = this.autoFocus;
  if (!element) return;
  _metrics.alerts++;
  element.setAttribute("role", role);
  element.setAttribute("aria-live", live);
  element.textContent = message;
  if (shouldFocus) {
    const hadTabIndex = element.hasAttribute("tabindex");
    if (!hadTabIndex) {
      element.tabIndex = -1;
      this.temporaryTabIndex.set(element, true);
    }
    element.focus({ preventScroll: true });
  }
  this._track("alert:shown", { role, live, length: message.length });
};
AlertAriaManager.prototype.clearStatus = function(element) {
  if (!element) return;
  element.removeAttribute("role");
  element.removeAttribute("aria-live");
  element.textContent = "";
  if (this.temporaryTabIndex.has(element)) {
    element.removeAttribute("tabindex");
    this.temporaryTabIndex.delete(element);
  }
  this._track("alert:cleared");
};
AlertAriaManager.prototype._track = function(event, detail) {
  detail = detail || {};
  if (this.telemetry && typeof this.telemetry === "function") this.telemetry(event, Object.assign({ timestamp: Date.now() }, detail));
};
function AriaManager(modal, config, deps) {
  config = config || {};
  deps = deps || {};
  this.modal = modal;
  this.logger = deps.logger || console;
  const uiConfig = config.ui || {};
  const subConfig = { idPrefix: config.idPrefix || "login", errorClass: uiConfig.errorClass || config.errorClass, telemetry: deps.telemetry || config.telemetry || null };
  this._modalManager = new ModalAriaManager(modal, subConfig);
  this._fieldManager = new FieldAriaManager(subConfig);
  this._alertManager = new AlertAriaManager(subConfig);
}
AriaManager.prototype.setModalOpen = function() {
  this._modalManager.setOpen();
};
AriaManager.prototype.setModalClosed = function() {
  this._modalManager.setClosed();
};
AriaManager.prototype.setInputError = function(input, errorMessage) {
  this._fieldManager.setError(input, errorMessage);
};
AriaManager.prototype.clearInputError = function(input) {
  this._fieldManager.clearError(input);
};
AriaManager.prototype.setErrorAlert = function(errorElement, message) {
  this._alertManager.setStatus(errorElement, "alert", "assertive", message);
};
AriaManager.prototype.clearErrorAlert = function(errorElement) {
  this._alertManager.clearStatus(errorElement);
};
AriaManager.prototype.setButtonBusy = (button, isBusy) => {
  if (!button) return;
  if (isBusy) button.setAttribute("aria-busy", "true");
  else button.removeAttribute("aria-busy");
};
AriaManager.prototype.setTogglePressed = (button, isPressed) => {
  if (!button) return;
  button.setAttribute("aria-pressed", isPressed ? "true" : "false");
  button.setAttribute("aria-label", isPressed ? "Ocultar senha" : "Mostrar senha");
};
AriaManager.prototype.cleanup = function() {
  this._fieldManager.cleanup();
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: Object.assign({}, _metrics), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { isBrowserEnvironment: isBrowser, classesAvailable: typeof ModalAriaManager === "function" && typeof FieldAriaManager === "function", ariaManagerExported: typeof AriaManager === "function" };
  let passed = 0;
  for (const k in checks) if (checks[k]) passed++;
  const total = 3;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, healthy: passed >= 2, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
export {
  AlertAriaManager,
  AriaManager,
  FieldAriaManager,
  MODULE_ID,
  ModalAriaManager,
  VERSION,
  healthCheck,
  info
};
