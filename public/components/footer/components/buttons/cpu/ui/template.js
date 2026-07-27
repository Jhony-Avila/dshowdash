import { getIcon } from "../../_shared/icons.js";
const MODULE_ID = "footer-button-cpu-template";
const VERSION = "1.2.0-ENTERPRISE-UARPS";
let _metrics = { renders: 0 };
function createTemplate(config = {}) {
  _metrics.renders++;
  const { id = "cpu", label = "CPU", icon = "cpu", kind = "decorative" } = config;
  const iconSvg = getIcon(icon);
  const uarpsTrigger = `trigger:footer:${id}`;
  const btnClass = kind === "control" ? `dsd-footer__control-btn footer-btn footer-btn--${id}` : `dsd-footer__icon-btn footer-btn footer-btn--${id}`;
  if (kind === "control") {
    return `<button type="button" class="${btnClass}" aria-label="${label}" data-button-id="${id}" data-uarps-trigger="${uarpsTrigger}" data-icon="${icon}" tabindex="0" title="${label}">${iconSvg}<span>${label}</span></button>`;
  }
  return `<button type="button" class="${btnClass}" aria-label="${label}" data-button-id="${id}" data-uarps-trigger="${uarpsTrigger}" data-icon="${icon}" tabindex="0" title="${label}">${iconSvg}</button>`;
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() };
}
var template_default = { createTemplate, getMetrics, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createTemplate,
  template_default as default,
  getMetrics,
  healthCheck,
  info
};
