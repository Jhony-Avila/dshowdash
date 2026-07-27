import RegionVisibility from "../../core/region-visibility.js";
import LayoutPersistence from "../../state/layout-persistence.js";
import { BREAKPOINTS, LAYOUT_POLICIES } from "./constants.js";
import { autoApplyPolicies, userOverrides, metrics } from "./state.js";
import { findRegion, REGION_IDS } from "/platform/shell/layout-regions.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.adapters.responsive-adapter.policies";
function applyLayoutPolicy(breakpoint, options) {
  if (!autoApplyPolicies.value && !(options && options.force)) return false;
  const policy = LAYOUT_POLICIES[breakpoint];
  if (!policy) return false;
  const animate = options && options.animate !== false;
  const animateOptions = { animate, duration: 200 };
  if (!userOverrides.sidebar) {
    if (policy.sidebar) {
      if (policy.sidebar.visible === false) {
        RegionVisibility.hide("sidebar", animateOptions);
      } else {
        RegionVisibility.show("sidebar", animateOptions);
      }
      if (policy.sidebar.collapsed !== void 0) {
        LayoutPersistence.setSidebarCollapsed(policy.sidebar.collapsed);
      }
    }
  }
  if (!userOverrides.navRail && policy.navRail) {
    if (policy.navRail.visible === false) {
      RegionVisibility.hide("nav-rail", animateOptions);
    } else {
      RegionVisibility.show("nav-rail", animateOptions);
    }
  }
  if (policy.header && policy.header.compact !== void 0) {
    const header = findRegion(REGION_IDS.HEADER);
    if (header) {
      if (policy.header.compact) {
        header.classList.add("dsd-shell__region--compact");
      } else {
        header.classList.remove("dsd-shell__region--compact");
      }
    }
  }
  if (typeof document !== "undefined" && document.body) {
    const bpKeys = Object.keys(BREAKPOINTS);
    for (let j = 0; j < bpKeys.length; j++) {
      document.body.classList.remove(`dsd-bp-${bpKeys[j]}`);
    }
    document.body.classList.add(`dsd-bp-${breakpoint}`);
    const deviceType = BREAKPOINTS[breakpoint].device;
    document.body.setAttribute("data-device", deviceType);
    if (breakpoint === "xs" || breakpoint === "sm") {
      document.body.classList.add("dsd-mobile");
      document.body.classList.remove("dsd-tablet", "dsd-desktop");
    } else if (breakpoint === "md") {
      document.body.classList.add("dsd-tablet");
      document.body.classList.remove("dsd-mobile", "dsd-desktop");
    } else {
      document.body.classList.add("dsd-desktop");
      document.body.classList.remove("dsd-mobile", "dsd-tablet");
    }
  }
  metrics.policyApplications++;
  return true;
}
export {
  MODULE_ID,
  VERSION,
  applyLayoutPolicy
};
