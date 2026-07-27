import { CONTRACTS } from "../core/contracts.js";
const MODULE_ID = "footer-icon-terminal-template";
const VERSION = "1.1.0-ENTERPRISE";
let _metrics = { renders: 0 };
const Template = {
  render(props = {}) {
    _metrics.renders++;
    const size = CONTRACTS.SIZES[props.size] || CONTRACTS.SIZES.md;
    const variant = props.variant || "primary";
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || "terminal";
    const title = props.title || "";
    const clickable = props.clickable ?? false;
    const state = props.state || "default";
    const classes = ["dsd-icon", "dsd-icon--terminal", `dsd-icon--${variant}`, `dsd-icon--size-${props.size || "md"}`, `dsd-icon--state-${state}`, clickable ? "dsd-icon--clickable" : ""].filter(Boolean).join(" ");
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : "";
    return `<span class="${classes}" data-icon-id="terminal"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg></span>`;
  },
  getSvgPath() {
    return "4 17 10 11 4 5";
  }
};
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true }, metrics: getMetrics() };
}
var template_default = { ...Template, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  Template,
  VERSION,
  template_default as default,
  getMetrics,
  healthCheck,
  info
};
