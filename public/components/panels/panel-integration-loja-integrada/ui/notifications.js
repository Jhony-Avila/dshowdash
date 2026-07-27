const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-integration-loja-integrada/ui/notifications";
let _container = null;
let _wrapper = null;
function _ensureWrapper() {
  if (!_wrapper) {
    _wrapper = document.createElement("div");
    _wrapper.className = "panel-notifications-wrapper";
    _wrapper.setAttribute("data-notifications-owner", MODULE_ID);
    const panel = document.querySelector('[data-panel="panel-integration-loja-integrada"]') || document.querySelector(".panel-integration-loja-integrada");
    (panel || document.documentElement).appendChild(_wrapper);
  }
  return _wrapper;
}
function _ensureContainer() {
  if (!_container) {
    _container = document.createElement("div");
    _container.className = "notifications-container";
    _container.style.cssText = "position:fixed;top:1rem;right:1rem;z-index:9999;display:flex;flex-direction:column;gap:0.5rem;pointer-events:none;";
    _ensureWrapper().appendChild(_container);
  }
  return _container;
}
function show(message, type = "info", duration = 3e3) {
  const container = _ensureContainer();
  const notification = document.createElement("div");
  notification.className = `notification notification--${type}`;
  notification.textContent = message;
  notification.style.cssText = "padding:0.75rem 1rem;border-radius:0.5rem;background:#333;color:#fff;font-size:0.875rem;animation:slideIn 0.3s ease;pointer-events:auto;";
  container.appendChild(notification);
  if (duration > 0) {
    setTimeout(() => {
      notification.remove();
    }, duration);
  }
  return notification;
}
function success(message, duration) {
  return show(message, "success", duration);
}
function error(message, duration) {
  return show(message, "error", duration);
}
function warning(message, duration) {
  return show(message, "warning", duration);
}
function info(message, duration) {
  return show(message, "info", duration);
}
function destroy() {
  if (_wrapper) {
    _wrapper.remove();
    _wrapper = null;
    _container = null;
  }
}
function healthCheck() {
  return { status: "healthy", version: VERSION, moduleId: MODULE_ID, noBodyAppend: true };
}
function getInfo() {
  return { version: VERSION, moduleId: MODULE_ID, healthCheck: healthCheck() };
}
var notifications_default = { show, success, error, warning, info, destroy, healthCheck, getInfo, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  notifications_default as default,
  destroy,
  error,
  getInfo,
  healthCheck,
  info,
  show,
  success,
  warning
};
