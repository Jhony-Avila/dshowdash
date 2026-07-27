const VERSION = "1.0.0";
const MODULE_ID = "container-main:accessibility-manager";
const A11Y_FEATURES = Object.freeze({
  SCREEN_READER: "screen-reader",
  HIGH_CONTRAST: "high-contrast",
  REDUCED_MOTION: "reduced-motion",
  LARGE_TEXT: "large-text",
  FOCUS_INDICATORS: "focus-indicators",
  KEYBOARD_ONLY: "keyboard-only"
});
const ARIA_LIVE_REGIONS = Object.freeze({
  POLITE: "polite",
  ASSERTIVE: "assertive",
  OFF: "off"
});
const CONTRAST_MODES = Object.freeze({
  NORMAL: "normal",
  HIGH: "high",
  HIGHEST: "highest"
});
const DEFAULT_CONFIG = Object.freeze({
  enableAriaLive: true,
  enableFocusManagement: true,
  enableSkipLinks: true,
  enableLandmarks: true,
  announcePageChanges: true,
  focusIndicatorStyle: "outline",
  contrastMode: CONTRAST_MODES.NORMAL,
  textScale: 1,
  persistPreferences: true
});
const STORAGE_KEY = "dsd:container-main:a11y-prefs";
export {
  A11Y_FEATURES,
  ARIA_LIVE_REGIONS,
  CONTRAST_MODES,
  DEFAULT_CONFIG,
  MODULE_ID,
  STORAGE_KEY,
  VERSION
};
