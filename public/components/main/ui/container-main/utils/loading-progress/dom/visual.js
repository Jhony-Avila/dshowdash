const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.loading-progress.dom.visual";
function updateVisual(refs, progress) {
  if (!refs.barElement) return;
  refs.barElement.style.width = `${progress}%`;
  refs.element?.setAttribute("aria-valuenow", String(Math.round(progress)));
}
export {
  MODULE_ID,
  VERSION,
  updateVisual
};
