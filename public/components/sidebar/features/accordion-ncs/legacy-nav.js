import { CONTAINER_ID, log } from "./constants.js";
import { CSS_CLASSES as C } from "../../ui/constants.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.features.accordion-ncs.legacy-nav";
function hideLegacyNav() {
  const navContent = document.querySelector(`.${C.NAV_CONTENT}`);
  if (!navContent) return;
  const children = navContent.children;
  let hiddenCount = 0;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.id === CONTAINER_ID) continue;
    if (child.hasAttribute("data-accordion-ncs-active")) continue;
    if (child.classList.contains(C.SECTION) || child.classList.contains(C.NAV_SECTION)) {
      child.style.display = "none";
      child.setAttribute("data-ncs-hidden", "true");
      hiddenCount++;
    }
  }
  log("info", `Legacy navigation hidden (${hiddenCount} elements)`);
}
function showLegacyNav() {
  const legacyElements = document.querySelectorAll('[data-ncs-hidden="true"]');
  legacyElements.forEach((el) => {
    el.style.display = "";
    el.removeAttribute("data-ncs-hidden");
  });
  log("info", "Legacy navigation restored");
}
function getLegacyHiddenCount() {
  return document.querySelectorAll('[data-ncs-hidden="true"]').length;
}
var legacy_nav_default = {
  hideLegacyNav,
  showLegacyNav,
  getLegacyHiddenCount
};
export {
  MODULE_ID,
  VERSION,
  legacy_nav_default as default,
  getLegacyHiddenCount,
  hideLegacyNav,
  showLegacyNav
};
