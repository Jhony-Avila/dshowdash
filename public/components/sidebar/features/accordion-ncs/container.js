import { CONTAINER_ID, UARPS_REGION, state } from "./constants.js";
import { CSS_CLASSES as C } from "../../ui/constants.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.features.accordion-ncs.container";
function createContainer() {
  if (document.getElementById(CONTAINER_ID)) {
    return document.getElementById(CONTAINER_ID);
  }
  const navContent = document.querySelector(`.${C.NAV_CONTENT}`);
  if (!navContent) {
    return null;
  }
  const container = document.createElement("div");
  container.id = CONTAINER_ID;
  container.className = C.ACCORDION_CONTAINER;
  container.setAttribute("data-accordion-ncs-active", "true");
  container.setAttribute("data-uarps-region", UARPS_REGION);
  navContent.insertBefore(container, navContent.firstChild);
  state.container = container;
  return container;
}
function removeContainer() {
  const container = document.getElementById(CONTAINER_ID);
  if (container) {
    container.remove();
  }
  state.container = null;
}
async function waitForNavContent(maxAttempts = 10, interval = 100) {
  for (let i = 0; i < maxAttempts; i++) {
    const navContent = document.querySelector(`.${C.NAV_CONTENT}`);
    if (navContent) return true;
    await new Promise((r) => {
      setTimeout(r, interval);
    });
  }
  return false;
}
var container_default = {
  createContainer,
  removeContainer,
  waitForNavContent
};
export {
  MODULE_ID,
  VERSION,
  createContainer,
  container_default as default,
  removeContainer,
  waitForNavContent
};
