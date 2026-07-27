import { CONTRACTS } from "../core/contracts.js";
const MODULE_ID = "footer-icon-memory-template";
const VERSION = "1.1.0-ENTERPRISE";
const SVG_PATH = "M6 19v-8a6 6 0 1 1 12 0v8M6 13h12";
let _metrics = { renders: 0 };
const Template = {
  render(props = {}) {
    _metrics.renders++;
    const size = CONTRACTS.SIZES[props.size] || CONTRACTS.SIZES.md;
    const variant = props.variant || "primary";
    const decorative = props.decorative ?? false;
    const ariaLabel = props.ariaLabel || "memory";
    const title = props.title || "";
    const clickable = props.clickable ?? false;
    const state = props.state || "default";
    const classes = ["dsd-icon", "dsd-icon--memory", `dsd-icon--${variant}`, `dsd-icon--size-${props.size || "md"}`, `dsd-icon--state-${state}`, clickable ? "dsd-icon--clickable" : ""].filter(Boolean).join(" ");
    const ariaAttrs = decorative ? 'aria-hidden="true" role="presentation"' : `aria-label="${ariaLabel}" role="img"`;
    const titleTag = title ? `<title>${title}</title>` : "";
    return `<span class="${classes}" data-icon-id="memory"><svg class="dsd-icon__svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${ariaAttrs}>${titleTag}<path d="${SVG_PATH}"/></svg></span>`;
  },
  getSvgPath() {
    return SVG_PATH;
  }
};
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, svgPath: SVG_PATH, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { templateReady: true, hasSvgPath: !!SVG_PATH }, metrics: getMetrics() };
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
