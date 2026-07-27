const VERSION = "1.0.0";
const MODULE_ID = "container-main:split-view-manager";
const SPLIT_ORIENTATIONS = Object.freeze({
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical"
});
const SPLIT_POSITIONS = Object.freeze({
  PRIMARY: "primary",
  SECONDARY: "secondary"
});
const DEFAULT_CONFIG = Object.freeze({
  orientation: SPLIT_ORIENTATIONS.HORIZONTAL,
  ratio: 0.5,
  minSize: 200,
  maxSize: null,
  resizable: true,
  collapsible: true,
  persistState: true,
  animationDuration: 200,
  gutter: 8
});
const STORAGE_KEY = "dsd:container-main:split-view";
export {
  DEFAULT_CONFIG,
  MODULE_ID,
  SPLIT_ORIENTATIONS,
  SPLIT_POSITIONS,
  STORAGE_KEY,
  VERSION
};
