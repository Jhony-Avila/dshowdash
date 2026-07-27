const MODULE_ID = "login-modal-toggle-password";
const VERSION = "5.5.0-ENTERPRISE";
const DEFAULT_LABELS = { show: "Mostrar senha", hide: "Ocultar senha" };
function TogglePassword(passwordInput, toggleButton, config, deps) {
  config = config || {};
  deps = deps || {};
  this.passwordInput = passwordInput;
  this.toggleButton = toggleButton;
  this.config = config;
  this.enabled = config.enabled !== false;
  this.labels = Object.assign({}, DEFAULT_LABELS, config.labels || {});
  this.logger = deps.logger || console;
  this.telemetry = deps.telemetry || null;
  this.onToggle = config.onToggle || null;
  this.isVisible = false;
  this.toggleCount = 0;
  this._mounted = false;
  this._handleClick = this.handleClick.bind(this);
}
TogglePassword.prototype.mount = function() {
  if (!this.passwordInput || !this.toggleButton) {
    if (this.logger && this.logger.warn) this.logger.warn("[toggle-password] Password input ou toggle button n\xE3o encontrado");
    return;
  }
  if (!this.enabled) {
    this.toggleButton.style.display = "none";
    if (this.logger && this.logger.info) this.logger.info("[toggle-password] Toggle password DESABILITADO por pol\xEDtica");
    return;
  }
  this.unmount();
  this.toggleButton.addEventListener("click", this._handleClick);
  this._updateAriaState(false);
  this._mounted = true;
  if (this.logger && this.logger.info) this.logger.info("[toggle-password] Toggle password montado");
};
TogglePassword.prototype.handleClick = function(event) {
  event.preventDefault();
  event.stopPropagation();
  if (!this.enabled) {
    if (this.logger && this.logger.warn) this.logger.warn("[toggle-password] Toggle bloqueado por pol\xEDtica");
    return;
  }
  this.isVisible = !this.isVisible;
  this.toggleCount++;
  this.passwordInput.type = this.isVisible ? "text" : "password";
  this._updateAriaState(this.isVisible);
  if (this.onToggle && typeof this.onToggle === "function") {
    this.onToggle(this.isVisible);
  }
  this._track(this.isVisible ? "password:view:enabled" : "password:view:disabled");
  if (this.logger && this.logger.info) this.logger.info(`[toggle-password] Senha ${this.isVisible ? "VIS\xCDVEL" : "OCULTA"}`, { toggleCount: this.toggleCount });
};
TogglePassword.prototype._updateAriaState = function(isVisible) {
  if (!this.toggleButton) return;
  this.toggleButton.setAttribute("aria-pressed", isVisible ? "true" : "false");
  this.toggleButton.setAttribute("aria-label", isVisible ? this.labels.hide : this.labels.show);
};
TogglePassword.prototype.setEnabled = function(enabled) {
  this.enabled = enabled;
  if (this.toggleButton) {
    this.toggleButton.style.display = enabled ? "" : "none";
    this.toggleButton.disabled = !enabled;
  }
  if (this.logger && this.logger.info) this.logger.info(`[toggle-password] Toggle password ${enabled ? "HABILITADO" : "DESABILITADO"}`);
};
TogglePassword.prototype.getStats = function() {
  return { toggleCount: this.toggleCount, currentlyVisible: this.isVisible };
};
TogglePassword.prototype.resetStats = function() {
  this.toggleCount = 0;
};
TogglePassword.prototype.unmount = function() {
  if (this.toggleButton) {
    this.toggleButton.removeEventListener("click", this._handleClick);
  }
  if (this.passwordInput) {
    this.passwordInput.type = "password";
  }
  this.isVisible = false;
  this._mounted = false;
};
TogglePassword.prototype._track = function(event) {
  if (this.telemetry && typeof this.telemetry === "function") {
    this.telemetry(event, { toggleCount: this.toggleCount, timestamp: Date.now(), source: MODULE_ID });
  }
};
TogglePassword.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, mounted: this._mounted, enabled: this.enabled, isVisible: this.isVisible, stats: this.getStats(), hasPasswordInput: !!this.passwordInput, hasToggleButton: !!this.toggleButton, timestamp: Date.now() };
};
TogglePassword.prototype.healthCheck = function() {
  const checks = { hasPasswordInput: !!this.passwordInput, hasToggleButton: !!this.toggleButton, isMounted: this._mounted, isEnabled: this.enabled };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 4 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/4`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { moduleLoaded: true, classAvailable: typeof TogglePassword === "function" };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
var toggle_password_default = TogglePassword;
export {
  MODULE_ID,
  TogglePassword,
  VERSION,
  toggle_password_default as default,
  healthCheck,
  info
};
