const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell-responsive-adapter";
const BREAKPOINTS = Object.freeze({
  xs: { min: 0, max: 575, name: "extra-small", device: "mobile-portrait" },
  sm: { min: 576, max: 767, name: "small", device: "mobile-landscape" },
  md: { min: 768, max: 991, name: "medium", device: "tablet" },
  lg: { min: 992, max: 1199, name: "large", device: "desktop" },
  xl: { min: 1200, max: 1399, name: "extra-large", device: "desktop-large" },
  xxl: { min: 1400, max: Infinity, name: "extra-extra-large", device: "desktop-wide" }
});
const LAYOUT_POLICIES = Object.freeze({
  xs: {
    sidebar: { visible: false, collapsed: true },
    navRail: { visible: false },
    footer: { visible: true },
    header: { visible: true, compact: true }
  },
  sm: {
    sidebar: { visible: false, collapsed: true },
    navRail: { visible: true },
    footer: { visible: true },
    header: { visible: true, compact: true }
  },
  md: {
    sidebar: { visible: false, collapsed: true },
    navRail: { visible: true },
    footer: { visible: true },
    header: { visible: true, compact: false }
  },
  lg: {
    sidebar: { visible: true, collapsed: false },
    navRail: { visible: true },
    footer: { visible: true },
    header: { visible: true, compact: false }
  },
  xl: {
    sidebar: { visible: true, collapsed: false },
    navRail: { visible: true },
    footer: { visible: true },
    header: { visible: true, compact: false }
  },
  xxl: {
    sidebar: { visible: true, collapsed: false },
    navRail: { visible: true },
    footer: { visible: true },
    header: { visible: true, compact: false }
  }
});
export {
  BREAKPOINTS,
  LAYOUT_POLICIES,
  MODULE_ID,
  VERSION
};
