const VERSION = "3.0.0-UX-ENHANCED";
const MODULE_ID = "main.ui.container-main.components.ux-enhancements.utils.depth";
function setDepth(container, depth) {
  if (!container || depth < 1 || depth > 3) return;
  container.setAttribute("data-depth", String(depth));
}
export {
  MODULE_ID,
  VERSION,
  setDepth
};
