import { config, containerElement } from "./state.js";
import { injectStyles } from "./styles.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.container";
function ensureContainer() {
  if (containerElement.value && document.body.contains(containerElement.value)) {
    return containerElement.value;
  }
  injectStyles();
  containerElement.value = document.createElement("div");
  containerElement.value.className = `shell-notification-container ${config.position}`;
  containerElement.value.setAttribute("role", "alert");
  containerElement.value.setAttribute("aria-live", "polite");
  document.body.appendChild(containerElement.value);
  return containerElement.value;
}
function updateContainerPosition() {
  if (!containerElement.value) return;
  containerElement.value.className = `shell-notification-container ${config.position}`;
}
export {
  MODULE_ID,
  VERSION,
  ensureContainer,
  updateContainerPosition
};
