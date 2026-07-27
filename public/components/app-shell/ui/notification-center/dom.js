import { containerElement, config } from "./state.js";
import { createNotificationElement as _createElement } from "./element.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.dom";
const CONTAINER_ID = "app-shell-notification-center";
function ensureContainer() {
  if (containerElement.value) return containerElement.value;
  if (typeof document === "undefined") return null;
  let container = document.getElementById(CONTAINER_ID);
  if (!container) {
    container = document.createElement("div");
    container.id = CONTAINER_ID;
    container.className = `notification-center notification-center--${config.position}`;
    container.setAttribute("role", "region");
    container.setAttribute("aria-label", "Notifications");
    document.body.appendChild(container);
  }
  containerElement.value = container;
  return container;
}
function getContainer() {
  return containerElement.value || ensureContainer();
}
function createNotificationElement(notification) {
  const container = ensureContainer();
  if (!container) return null;
  const dismissFn = (id) => {
    const event = new CustomEvent("notification-dismiss", { detail: { id } });
    container.dispatchEvent(event);
  };
  const element = _createElement(notification, dismissFn);
  element.classList.add("notification--entering");
  container.appendChild(element);
  element.offsetHeight;
  setTimeout(() => {
    element.classList.remove("notification--entering");
  }, config.animationDuration || 300);
  return element;
}
function removeNotificationElement(element) {
  if (!element) return;
  element.classList.add("notification--leaving");
  setTimeout(() => {
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  }, config.animationDuration || 300);
}
function updateProgressBar(element, progress) {
  if (!element) return;
  const progressBar = element.querySelector(".shell-notification-progress");
  if (progressBar) {
    progressBar.style.width = `${Math.max(0, Math.min(100, progress))}%`;
  }
}
export {
  MODULE_ID,
  VERSION,
  createNotificationElement,
  ensureContainer,
  getContainer,
  removeNotificationElement,
  updateProgressBar
};
