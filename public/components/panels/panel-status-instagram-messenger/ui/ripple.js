const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panels/panel-status-instagram-messenger/ui/ripple";
const _attachedElements = /* @__PURE__ */ new WeakMap();
let _metrics = { created: 0, attached: 0, detached: 0 };
function create(event, element) {
  const rect = element.getBoundingClientRect();
  const ripple = document.createElement("span");
  const size = Math.max(rect.width, rect.height);
  const x = event.clientX - rect.left - size / 2;
  const y = event.clientY - rect.top - size / 2;
  ripple.style.cssText = `position:absolute;width:${size}px;height:${size}px;left:${x}px;top:${y}px;background:rgba(255,255,255,0.3);border-radius:50%;transform:scale(0);animation:ripple 0.6s ease-out;pointer-events:none;`;
  ripple.className = "ripple-effect";
  element.style.position = "relative";
  element.style.overflow = "hidden";
  element.appendChild(ripple);
  setTimeout(() => ripple.remove(), 600);
  _metrics.created++;
}
function attach(element) {
  if (_attachedElements.has(element)) return false;
  const handler = (e) => create(e, element);
  element.addEventListener("click", handler);
  _attachedElements.set(element, handler);
  _metrics.attached++;
  return true;
}
function detach(element) {
  if (!_attachedElements.has(element)) return false;
  const handler = _attachedElements.get(element);
  element.removeEventListener("click", handler);
  _attachedElements.delete(element);
  _metrics.detached++;
  return true;
}
function cleanup() {
  let count = 0;
  document.querySelectorAll(".ripple-effect").forEach((el) => {
    el.remove();
    count++;
  });
  return count;
}
function destroy() {
  cleanup();
  _metrics = { created: 0, attached: 0, detached: 0 };
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = { noLeakedRipples: document.querySelectorAll(".ripple-effect").length < 50 };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: `${passed}/1`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics(), healthCheck: healthCheck() };
}
var ripple_default = { create, attach, detach, cleanup, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  attach,
  cleanup,
  create,
  ripple_default as default,
  destroy,
  detach,
  getMetrics,
  healthCheck,
  info
};
