import { VERSION } from "/core/version.js";
const MODULE_ID = "header/components/panel-maps/ui/ripple";
let _debug = false;
const _metrics = { effects: 0, lastEffectAt: null };
function createRipple(event, element) {
  if (!element) element = event.currentTarget;
  const circle = document.createElement("span");
  const diameter = Math.max(element.clientWidth, element.clientHeight);
  const radius = diameter / 2;
  const rect = element.getBoundingClientRect();
  circle.style.width = circle.style.height = `${diameter}px`;
  circle.style.left = `${event.clientX - rect.left - radius}px`;
  circle.style.top = `${event.clientY - rect.top - radius}px`;
  circle.classList.add("ripple-effect");
  const existing = element.querySelector(".ripple-effect");
  if (existing) existing.remove();
  element.appendChild(circle);
  _metrics.effects++;
  _metrics.lastEffectAt = Date.now();
  setTimeout(() => circle.remove(), 600);
}
function attachRipple(element) {
  if (!element) return;
  element.addEventListener("click", createRipple);
  element.style.position = "relative";
  element.style.overflow = "hidden";
}
function detachRipple(element) {
  if (!element) return;
  element.removeEventListener("click", createRipple);
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getMetrics() {
  return { ..._metrics };
}
function resetMetrics() {
  _metrics.effects = 0;
  _metrics.lastEffectAt = null;
}
function healthCheck() {
  return { status: "HEALTHY", score: 1, maxScore: 1, checks: { ready: true }, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, metrics: getMetrics() };
}
var ripple_default = { createRipple, attachRipple, detachRipple };
export {
  MODULE_ID,
  VERSION,
  attachRipple,
  createRipple,
  ripple_default as default,
  detachRipple,
  getMetrics,
  healthCheck,
  info,
  resetMetrics,
  setDebug
};
