const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "modal-manager-global.ui.renderer";
import Container from "./container.js";
import Accessibility from "../core/accessibility.js";
import { escapeHtml } from "../utils/helpers.js";
function renderStack(modals) {
  const stackContainer = Container.getStack();
  if (!stackContainer) return;
  const existingIds = new Set(modals.map((m) => m.id));
  const toRemove = stackContainer.querySelectorAll("[data-modal-id]");
  toRemove.forEach((el) => {
    if (!existingIds.has(el.getAttribute("data-modal-id"))) {
      el.remove();
    }
  });
  const visibleModals = modals.filter((m) => m.runtime.visible);
  const topModal = visibleModals[visibleModals.length - 1];
  if (topModal && topModal.backdrop && topModal.backdrop.visible) {
    const bd = topModal.backdrop;
    Container.updateBackdrop(true, { opacity: bd.opacity, blur: bd.blur, clickToClose: topModal.closeOnBackdrop });
  } else {
    Container.updateBackdrop(false);
  }
  modals.forEach((modal, index) => {
    renderModal(modal, index);
  });
  Container.updateAriaHidden(modals.length > 0);
  if (topModal && topModal.focusTrap) {
    const el = stackContainer.querySelector(`[data-modal-id="${topModal.id}"]`);
    if (el) {
      Accessibility.activateFocusTrap(el);
      Accessibility.hideBackgroundFromScreenReaders(Container.getRoot());
    }
  } else {
    Accessibility.deactivateFocusTrap();
    Accessibility.restoreBackgroundForScreenReaders();
  }
}
function renderModal(modal, stackIndex) {
  const stackContainer = Container.getStack();
  if (!stackContainer) return;
  let element = stackContainer.querySelector(`[data-modal-id="${modal.id}"]`);
  if (!element) {
    element = createModalElement(modal);
    stackContainer.appendChild(element);
  }
  updateModalElement(element, modal, stackIndex);
  return element;
}
function createModalElement(modal) {
  const element = document.createElement("div");
  element.setAttribute("data-modal-id", modal.id);
  element.className = buildModalClasses(modal);
  element.innerHTML = `<div class="modal-content" role="document">${modal.showCloseButton ? '<button class="modal-close-btn" aria-label="Fechar modal" data-close><span aria-hidden="true">&times;</span></button>' : ""}${modal.title ? `<div class="modal-header"><h2 class="modal-title" id="modal-title-${modal.id}">${escapeHtml(modal.title)}</h2></div>` : ""}<div class="modal-body" id="modal-body-${modal.id}">${modal.content || ""}</div></div>`;
  Accessibility.applyAriaAttributes(element, modal);
  if (modal.title) {
    element.setAttribute("aria-labelledby", `modal-title-${modal.id}`);
  }
  element.setAttribute("aria-describedby", `modal-body-${modal.id}`);
  return element;
}
function updateModalElement(element, modal, stackIndex) {
  const runtime = modal.runtime;
  element.className = buildModalClasses(modal);
  element.setAttribute("data-modal-type", modal.type);
  element.setAttribute("data-modal-size", modal.size);
  element.setAttribute("data-visible", runtime.visible ? "true" : "false");
  element.setAttribute("data-closing", runtime.closing ? "true" : "false");
  element.style.zIndex = String(modal.zIndex || 2e3 + stackIndex * 10);
  if (modal.position) {
    element.setAttribute("data-position", modal.position);
  }
  if (runtime.visible) {
    element.classList.add("visible");
    element.classList.remove("hidden");
  } else {
    element.classList.remove("visible");
    element.classList.add("hidden");
  }
  if (runtime.closing) {
    element.classList.add("closing");
  } else {
    element.classList.remove("closing");
  }
}
function buildModalClasses(modal) {
  const runtime = modal.runtime;
  const classes = ["modal-wrapper"];
  classes.push(`modal--${modal.type}`);
  classes.push(`modal--${modal.size}`);
  if (modal.position) {
    classes.push(`modal--position-${modal.position}`);
  }
  if (modal.blocking) {
    classes.push("modal--blocking");
  }
  if (runtime.visible) {
    classes.push("visible");
  }
  if (runtime.closing) {
    classes.push("closing");
  }
  return classes.join(" ");
}
function clear() {
  const stackContainer = Container.getStack();
  if (stackContainer) {
    stackContainer.innerHTML = "";
  }
  Container.updateBackdrop(false);
  Container.updateAriaHidden(false);
  Accessibility.cleanup();
}
function getModalElement(id) {
  const stackContainer = Container.getStack();
  if (!stackContainer) return null;
  return stackContainer.querySelector(`[data-modal-id="${id}"]`);
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { containerAvailable: !!Container.getStack(), accessibilityReady: typeof Accessibility.activateFocusTrap === "function" };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var renderer_default = { renderStack, renderModal, clear, getModalElement, getVersion, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  buildModalClasses,
  clear,
  createModalElement,
  renderer_default as default,
  getModalElement,
  getVersion,
  healthCheck,
  info,
  renderModal,
  renderStack,
  updateModalElement
};
