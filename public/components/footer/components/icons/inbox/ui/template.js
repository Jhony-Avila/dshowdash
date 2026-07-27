import { CONTRACTS } from "../core/contracts.js";
const MODULE_ID = "footer-icon-inbox-template";
const VERSION = "1.1.0-ENTERPRISE";
let _metrics = { renders: 0 };
const Template = {
  render(props = {}) {
    _metrics.renders++;
    const size = CONTRACTS.SIZES[props.size] || CONTRACTS.SIZES.md;
    const variant = props.variant || "primary";
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || "inbox";
    const title = props.title || "";
    const clickable = props.clickable ?? false;
    const state = props.state || "default";
    const classes = ["dsd-icon", "dsd-icon--inbox", `dsd-icon--${variant}`, `dsd-icon--size-${props.size || "md"}`, `dsd-icon--state-${state}`, clickable ? "dsd-icon--clickable" : ""].filter(Boolean).join(" ");
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : "";
    return `<span class="${classes}" data-icon-id="inbox"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<polyline points="22 12 16 12 14 15 10 15 8 12 2 12"/><path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/></svg></span>`;
  },
  getSvgPath() {
    return "22 12 16 12 14 15 10 15 8 12 2 12";
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
