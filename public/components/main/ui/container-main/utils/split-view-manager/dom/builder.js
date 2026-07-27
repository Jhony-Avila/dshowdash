import { getConfig, getContainer, setPrimaryPanel, setSecondaryPanel, setGutter, getCurrentRatio, resetDOMRefs, getPrimaryPanel } from "../state.js";
import { _createStyles } from "./styles.js";
import { _applyRatio } from "./ratio.js";
import { _setupResizeHandlers } from "../handlers/resize.js";
import { _setupCollapseHandlers } from "../handlers/collapse.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.dom.builder";
function _createDOM() {
  _createStyles();
  const container = getContainer();
  const config = getConfig();
  const existingContent = container.innerHTML;
  container.innerHTML = `
    <div class="dsd-split-view dsd-split-view--${config.orientation}">
      <div class="dsd-split-view__panel dsd-split-view__panel--primary"></div>
      <div class="dsd-split-view__gutter">
        ${config.collapsible ? `
          <button class="dsd-split-view__collapse-btn dsd-split-view__collapse-btn--left" data-collapse="primary" title="Collapse left panel">\u25C0</button>
          <button class="dsd-split-view__collapse-btn dsd-split-view__collapse-btn--right" data-collapse="secondary" title="Collapse right panel">\u25B6</button>
        ` : ""}
      </div>
      <div class="dsd-split-view__panel dsd-split-view__panel--secondary"></div>
    </div>
  `;
  const wrapper = container.querySelector(".dsd-split-view");
  setPrimaryPanel(wrapper.querySelector(".dsd-split-view__panel--primary"));
  setSecondaryPanel(wrapper.querySelector(".dsd-split-view__panel--secondary"));
  setGutter(wrapper.querySelector(".dsd-split-view__gutter"));
  getPrimaryPanel().innerHTML = existingContent;
  wrapper.style.setProperty("--split-gutter", `${config.gutter}px`);
  wrapper.style.setProperty("--split-duration", `${config.animationDuration}ms`);
  _applyRatio(getCurrentRatio());
  if (config.resizable) {
    _setupResizeHandlers();
  }
  if (config.collapsible) {
    _setupCollapseHandlers();
  }
}
function _destroyDOM() {
  const primaryPanel = getPrimaryPanel();
  const container = getContainer();
  if (!primaryPanel) return;
  const content = primaryPanel.innerHTML;
  container.innerHTML = content;
  resetDOMRefs();
}
export {
  MODULE_ID,
  VERSION,
  _createDOM,
  _destroyDOM
};
