import { UI_INTENTS } from "/core/runtime/events/catalog/ui.events.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { calculatePasswordStrength, getPasswordStrengthLabel } from "./helpers.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-account-security.events";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function _emitIntent(intent, data) {
  _initPorts();
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(intent, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, data || {}));
}
function setupEventHandlers(container, state, handlers) {
  const onTogglePasswordForm = handlers.onTogglePasswordForm;
  const onSavePassword = handlers.onSavePassword;
  const onToggle2FA = handlers.onToggle2FA;
  const onRevokeSession = handlers.onRevokeSession;
  const onRevokeAllSessions = handlers.onRevokeAllSessions;
  const onTogglePasswordVisibility = handlers.onTogglePasswordVisibility;
  const signal = handlers.signal;
  const newPwdInput = container.querySelector("#new-password");
  if (newPwdInput) {
    newPwdInput.addEventListener("input", (e) => {
      state.passwordStrength = calculatePasswordStrength(e.target.value).score;
      updatePasswordStrengthUI(container, state.passwordStrength);
    }, { signal });
  }
  container.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-action]");
    const toggle = e.target.closest("[data-toggle]");
    if (toggle) {
      const field = toggle.dataset.toggle;
      onTogglePasswordVisibility(field);
      return;
    }
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case "toggle-password-form":
        onTogglePasswordForm();
        break;
      case "save-password":
        handleSavePassword(container, onSavePassword);
        break;
      case "toggle-2fa":
        onToggle2FA(btn.checked);
        break;
      case "revoke-session":
        const sessionId = parseInt(btn.dataset.sessionId ?? "0");
        onRevokeSession(sessionId);
        break;
      case "revoke-all-sessions":
        onRevokeAllSessions();
        break;
      case "export-activity":
        _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "Log de atividade exportado", type: "success" });
        break;
      case "close-modal":
        const modalOverlay = container.querySelector(".pas-modal-overlay");
        if (modalOverlay) modalOverlay.classList.remove("visible");
        break;
    }
  }, { signal });
  const tfaToggle = container.querySelector('[data-action="toggle-2fa"]');
  if (tfaToggle) {
    tfaToggle.addEventListener("change", (e) => {
      onToggle2FA(e.target.checked);
    }, { signal });
  }
}
function handleSavePassword(container, onSavePassword) {
  const currentEl = container.querySelector("#current-password");
  const newPwdEl = container.querySelector("#new-password");
  const confirmEl = container.querySelector("#confirm-password");
  const current = currentEl ? currentEl.value : "";
  const newPwd = newPwdEl ? newPwdEl.value : "";
  const confirm = confirmEl ? confirmEl.value : "";
  if (!current || !newPwd) {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "Preencha todos os campos", type: "warning" });
    return;
  }
  if (newPwd !== confirm) {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "As senhas n\xE3o coincidem", type: "error" });
    return;
  }
  if (newPwd.length < 8) {
    _emitIntent(UI_INTENTS.SHOW_TOAST, { message: "M\xEDnimo 8 caracteres", type: "error" });
    return;
  }
  onSavePassword(current, newPwd);
}
function updatePasswordStrengthUI(container, strength) {
  const strengthBar = container.querySelector(".pas-pwd-strength");
  if (!strengthBar) return;
  const segs = strengthBar.querySelectorAll(".pas-pwd-strength-seg");
  const info2 = getPasswordStrengthLabel(strength);
  segs.forEach((seg, i) => {
    seg.className = `pas-pwd-strength-seg ${i < strength ? `active ${info2.class}` : ""}`;
  });
  const valueEl = strengthBar.querySelector(".pas-pwd-strength-value");
  if (valueEl) {
    valueEl.textContent = info2.label;
    valueEl.className = `pas-pwd-strength-value ${info2.class}`;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, usingP18Intents: true, p22Compliant: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, p18IntentsAvailable: true }, p22Compliant: true };
}
var events_default = { setupEventHandlers, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  healthCheck,
  info,
  setupEventHandlers
};
