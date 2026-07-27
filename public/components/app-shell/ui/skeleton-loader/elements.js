import { config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.skeleton-loader.elements";
function createSkeletonElement(cfg) {
  const el = document.createElement("div");
  el.className = `skeleton-loader skeleton-${config.animationType}`;
  if (cfg.width) el.style.width = cfg.width;
  if (cfg.height) el.style.height = cfg.height;
  if (cfg.marginTop) el.style.marginTop = cfg.marginTop;
  if (cfg.marginBottom) el.style.marginBottom = cfg.marginBottom;
  if (cfg.radius) el.style.borderRadius = cfg.radius;
  if (cfg.flex) el.style.flex = cfg.flex;
  if (cfg.type === "circle") {
    el.classList.add("skeleton-circle");
    el.style.width = cfg.size || "40px";
    el.style.height = cfg.size || "40px";
  }
  return el;
}
export {
  MODULE_ID,
  VERSION,
  createSkeletonElement
};
