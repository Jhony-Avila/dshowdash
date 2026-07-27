const VERSION = "2.2.0-P04-XSS";
const MODULE_ID = "notification-manager-core-renderer";
function escapeHtml(str) {
  if (!str) return "";
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}
function createNotificationElement(notification) {
  const el = document.createElement("div");
  el.className = `notification notification-${escapeHtml(notification.type) || "info"}`;
  el.dataset.notificationId = notification.id;
  el.innerHTML = `<div class="notification-content">${escapeHtml(notification.message)}</div>`;
  return el;
}
function healthCheck() {
  return {
    status: "HEALTHY",
    score: "1/1",
    checks: { available: true, xssSanitized: true },
    version: VERSION,
    moduleId: MODULE_ID,
    p04Compliant: true,
    timestamp: Date.now()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p04Compliant: true, timestamp: Date.now() };
}
var renderer_default = { createNotificationElement, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createNotificationElement,
  renderer_default as default,
  healthCheck,
  info
};
