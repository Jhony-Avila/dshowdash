import { CONTRACTS } from "../core/contracts.js";
const MODULE_ID = "footer-icon-users-template";
const VERSION = "1.1.0-ENTERPRISE";
let _metrics = { renders: 0 };
const Template = {
  render(props = {}) {
    _metrics.renders++;
    const size = CONTRACTS.SIZES[props.size] || CONTRACTS.SIZES.md;
    const variant = props.variant || "primary";
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || "users";
    const title = props.title || "";
    const clickable = props.clickable ?? false;
    const state = props.state || "default";
    const classes = ["dsd-icon", "dsd-icon--users", `dsd-icon--${variant}`, `dsd-icon--size-${props.size || "md"}`, `dsd-icon--state-${state}`, clickable ? "dsd-icon--clickable" : ""].filter(Boolean).join(" ");
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : "";
    return `<span class="${classes}" data-icon-id="users"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>`;
  },
  getSvgPath() {
    return "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2";
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
