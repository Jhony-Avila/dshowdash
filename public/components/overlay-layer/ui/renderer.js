import * as Container from "./container.js";
const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "overlay-layer-renderer";
let _metrics = { renderCount: 0, clearCount: 0 };
function render(overlay) {
  if (!overlay?.id) return null;
  const container = Container.get() || Container.create();
  const el = document.createElement("div");
  el.id = `overlay-${overlay.id}`;
  el.className = `overlay-item overlay-type-${overlay.type || "modal"}`;
  el.dataset.overlayId = overlay.id;
  if (overlay.content) {
    if (typeof overlay.content === "string") el.innerHTML = overlay.content;
    else if (overlay.content instanceof HTMLElement) el.appendChild(overlay.content);
  }
  container.appendChild(el);
  _metrics.renderCount++;
  return el;
}
function remove(id) {
  const el = document.getElementById(`overlay-${id}`);
  if (el?.parentNode) el.parentNode.removeChild(el);
}
function clear() {
  const container = Container.get();
  if (container) container.innerHTML = "";
  _metrics.clearCount++;
}
function getMetrics() {
  return { ..._metrics };
}
function healthCheck() {
  const checks = { containerAvailable: Container.exists() };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), containerExists: Container.exists(), timestamp: Date.now() };
}
var renderer_default = { render, remove, clear, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  renderer_default as default,
  getMetrics,
  healthCheck,
  info,
  remove,
  render
};
