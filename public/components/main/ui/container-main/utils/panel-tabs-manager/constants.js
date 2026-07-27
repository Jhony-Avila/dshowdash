const VERSION = "1.0.0";
const MODULE_ID = "container-main:panel-tabs";
const TAB_STATES = Object.freeze({
  ACTIVE: "active",
  INACTIVE: "inactive",
  LOADING: "loading",
  ERROR: "error"
});
const TAB_POSITIONS = Object.freeze({
  TOP: "top",
  BOTTOM: "bottom"
});
const CLOSE_BEHAVIORS = Object.freeze({
  ACTIVATE_PREVIOUS: "activate-previous",
  ACTIVATE_NEXT: "activate-next",
  ACTIVATE_FIRST: "activate-first"
});
const DEFAULT_CONFIG = Object.freeze({
  maxTabs: 20,
  position: TAB_POSITIONS.TOP,
  closeBehavior: CLOSE_BEHAVIORS.ACTIVATE_PREVIOUS,
  showCloseButton: true,
  showTabIcons: true,
  allowReorder: true,
  allowDuplicates: false,
  confirmClose: false,
  persistTabs: true,
  animationDuration: 150,
  tabMinWidth: 100,
  tabMaxWidth: 200,
  newTabTitle: "Nova Aba",
  newTabIcon: "\u{1F4C4}"
});
const STORAGE_KEY = "dsd:container-main:panel-tabs";
export {
  CLOSE_BEHAVIORS,
  DEFAULT_CONFIG,
  MODULE_ID,
  STORAGE_KEY,
  TAB_POSITIONS,
  TAB_STATES,
  VERSION
};
