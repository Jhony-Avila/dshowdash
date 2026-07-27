const VERSION = "15.3.0-SHELL-CSS";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.styles";
function _getCssPath() {
  try {
    if (typeof import.meta !== "undefined" && import.meta.url) {
      const moduleUrl = new URL(import.meta.url);
      const basePath = moduleUrl.pathname.substring(0, moduleUrl.pathname.lastIndexOf("/"));
      return `${basePath}/styles/toolbar.css`;
    }
  } catch (e) {
  }
  return "/components/main/ui/container-main/utils/features-toolbar/styles/toolbar.css";
}
const _CSS_HREF = _getCssPath();
function _updateTooltipDelay(ms) {
  const toolbar = document.getElementById("features-toolbar");
  if (toolbar) {
    toolbar.style.setProperty("--ft-tooltip-delay", `${ms / 1e3}s`);
  }
}
let _injecting = false;
function _injectStyles() {
  if (_injecting) return;
  _injecting = true;
  try {
    const existingStyle = document.getElementById("features-toolbar-styles");
    if (existingStyle) existingStyle.remove();
    const existingLink = document.getElementById("features-toolbar-css");
    if (existingLink) {
      const currentHref = existingLink.getAttribute("href") || "";
      if (currentHref.endsWith("/styles/toolbar.css")) {
        return;
      }
      existingLink.remove();
    }
    const link = document.createElement("link");
    link.id = "features-toolbar-css";
    link.rel = "stylesheet";
    link.href = _CSS_HREF;
    document.head.appendChild(link);
  } finally {
    _injecting = false;
  }
}
export {
  MODULE_ID,
  VERSION,
  _injectStyles,
  _updateTooltipDelay
};
