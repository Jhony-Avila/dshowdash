const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/split-view";
const SPLIT_MODES = Object.freeze({ OFF: "off", HORIZONTAL: "horizontal", VERTICAL: "vertical" });
const SPLIT_SIZES = Object.freeze({ SMALL: 30, MEDIUM: 50, LARGE: 70 });
function SplitViewManager(options = {}) {
  this.container = options.container || null;
  this.onResize = options.onResize || (() => {
  });
  this.onModeChange = options.onModeChange || (() => {
  });
  this.onItemSelect = options.onItemSelect || (() => {
  });
  this.onSelect = options.onSelect || (() => {
  });
  this._mode = SPLIT_MODES.OFF;
  this._splitSize = SPLIT_SIZES.MEDIUM;
  this._selectedItem = null;
}
SplitViewManager.prototype.setContainer = function(container) {
  this.container = container;
};
SplitViewManager.prototype.setMode = function(mode) {
  this._mode = mode;
  this.onModeChange(mode);
};
SplitViewManager.prototype.getMode = function() {
  return this._mode;
};
SplitViewManager.prototype.setSplitSize = function(size) {
  this._splitSize = size;
  this.onResize(size);
};
SplitViewManager.prototype.selectItem = function(item) {
  this._selectedItem = item;
  this.onItemSelect(item);
};
SplitViewManager.prototype.render = function() {
  if (!this.container || this._mode === SPLIT_MODES.OFF) return;
  let html = `<div class="p01-split-view p01-split-view--${this._mode}">`;
  html += `<div class="p01-split-list" style="flex: ${this._splitSize}%;"></div>`;
  html += '<div class="p01-split-divider"></div>';
  html += `<div class="p01-split-detail" style="flex: ${100 - this._splitSize}%;"></div>`;
  html += "</div>";
  this.container.innerHTML = html;
};
SplitViewManager.prototype.destroy = function() {
  if (this.container) this.container.innerHTML = "";
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION });
var split_view_default = { SplitViewManager, SPLIT_MODES, SPLIT_SIZES, info, healthCheck };
export {
  MODULE_ID,
  SPLIT_MODES,
  SPLIT_SIZES,
  SplitViewManager,
  VERSION,
  split_view_default as default,
  healthCheck,
  info
};
