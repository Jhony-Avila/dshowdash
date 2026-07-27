import { CONTRACTS } from "../core/contracts.js";
const MODULE_ID = "footer-icon-unlock-template";
const VERSION = "1.1.0-ENTERPRISE";
let _metrics = { renders: 0 };
const Template = {
  render(props = {}) {
    _metrics.renders++;
    const size = CONTRACTS.SIZES[props.size] || CONTRACTS.SIZES.md;
    const variant = props.variant || "primary";
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || "unlock";
    const title = props.title || "";
    const clickable = props.clickable ?? false;
    const state = props.state || "default";
    const classes = ["dsd-icon", "dsd-icon--unlock", `dsd-icon--${variant}`, `dsd-icon--size-${props.size || "md"}`, `dsd-icon--state-${state}`, clickable ? "dsd-icon--clickable" : ""].filter(Boolean).join(" ");
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : "";
    return `<span class="${classes}" data-icon-id="unlock"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg></span>`;
  },
  getSvgPath() {
    return "M7 11V7a5 5 0 0 1 9.9-1";
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
