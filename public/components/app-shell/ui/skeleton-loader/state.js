const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.state";
const activeSkeletons = /* @__PURE__ */ new Map();
const customTemplates = /* @__PURE__ */ new Map();
const config = {
  animationType: "pulse",
  animationDuration: 1500,
  baseColor: "var(--color-skeleton-base, #e0e0e0)",
  highlightColor: "var(--color-skeleton-highlight, #f0f0f0)",
  borderRadius: "4px"
};
const metrics = {
  created: 0,
  destroyed: 0,
  activeCount: 0
};
export {
  MODULE_ID,
  VERSION,
  activeSkeletons,
  config,
  customTemplates,
  metrics
};
