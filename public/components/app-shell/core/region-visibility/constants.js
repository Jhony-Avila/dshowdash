const VERSION = "1.0.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell-region-visibility";
const REGION_MAP = Object.freeze({
  header: { id: "app-shell-header", defaultVisible: true },
  sidebar: { id: "app-shell-sidebar", defaultVisible: true },
  "nav-rail": { id: "app-shell-nav-rail", defaultVisible: true },
  main: { id: "app-shell-main", defaultVisible: true },
  footer: { id: "app-shell-footer", defaultVisible: true },
  ticker: { id: "app-shell-ticker", defaultVisible: false },
  preloader: { id: "app-shell-preloader", defaultVisible: true },
  login: { id: "app-shell-login", defaultVisible: false },
  toast: { id: "app-shell-toast", defaultVisible: true }
});
const CSS_CLASSES = Object.freeze({
  HIDDEN: "app-shell-hidden",
  SHOWING: "app-shell-showing",
  HIDING: "app-shell-hiding",
  FULLSCREEN: "app-shell-fullscreen"
});
const DEFAULT_CONFIG = Object.freeze({
  animationDuration: 200,
  defaultAnimate: true
});
export {
  CSS_CLASSES,
  DEFAULT_CONFIG,
  MODULE_ID,
  REGION_MAP,
  VERSION
};
