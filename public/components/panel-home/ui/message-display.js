const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "panel-home.ui.message-display";
import { PANEL_ID } from "../core/constants.js";
import { CONFIG } from "../core/config.js";
const _state = {
  currentMessage: null,
  isAnimating: false,
  container: null
};
const CATEGORY_ICONS = {
  temporal: "\u{1F324}\uFE0F",
  acolhimento: "\u{1F44B}",
  acao: "\u{1F680}",
  contexto: "\u{1F504}",
  estado: "\u2705",
  inspiracional: "\u{1F4A1}",
  idle: "\u23F8\uFE0F",
  default: "\u2728"
};
function getIcon(category) {
  return CATEGORY_ICONS[category] || CATEGORY_ICONS.default;
}
function init(container) {
  _state.container = container;
  _state.currentMessage = null;
  _state.isAnimating = false;
}
function display(message, options = {}) {
  if (!_state.container) return;
  const messageArea = _state.container.querySelector(`#${PANEL_ID}-message-area`);
  const primaryEl = _state.container.querySelector(`#${PANEL_ID}-primary`);
  const secondaryEl = _state.container.querySelector(`#${PANEL_ID}-secondary`);
  const iconEl = _state.container.querySelector(`#${PANEL_ID}-icon`);
  if (!messageArea || !primaryEl) return;
  if (!message) {
    displayEmpty(messageArea, primaryEl, secondaryEl, iconEl);
    return;
  }
  if (CONFIG.features.animations && !options.skipAnimation) {
    animateTransition(messageArea, () => {
      updateContent(message, messageArea, primaryEl, secondaryEl, iconEl);
    });
  } else {
    updateContent(message, messageArea, primaryEl, secondaryEl, iconEl);
  }
  _state.currentMessage = message;
}
function updateContent(message, messageArea, primaryEl, secondaryEl, iconEl) {
  messageArea.classList.remove("ph-empty", "ph-loading");
  messageArea.dataset.category = message.category || "default";
  if (iconEl) {
    iconEl.textContent = getIcon(message.category);
    iconEl.style.display = "block";
  }
  primaryEl.textContent = message.text || "";
  if (secondaryEl) {
    if (message.subtitle) {
      secondaryEl.textContent = message.subtitle;
      secondaryEl.style.display = "block";
    } else {
      secondaryEl.textContent = "";
      secondaryEl.style.display = "none";
    }
  }
}
function displayEmpty(messageArea, primaryEl, secondaryEl, iconEl) {
  messageArea.classList.add("ph-empty");
  messageArea.classList.remove("ph-loading");
  messageArea.dataset.category = "empty";
  if (iconEl) {
    iconEl.textContent = "";
    iconEl.style.display = "none";
  }
  primaryEl.textContent = "";
  if (secondaryEl) {
    secondaryEl.textContent = "";
    secondaryEl.style.display = "none";
  }
  _state.currentMessage = null;
}
function showLoading() {
  if (!_state.container) return;
  const messageArea = _state.container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.add("ph-loading");
    messageArea.classList.remove("ph-empty");
  }
}
function hideLoading() {
  if (!_state.container) return;
  const messageArea = _state.container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.remove("ph-loading");
  }
}
function animateTransition(element, updateFn) {
  if (_state.isAnimating) {
    updateFn();
    return;
  }
  _state.isAnimating = true;
  const duration = CONFIG.display.fadeDuration;
  element.style.opacity = "0";
  element.style.transform = "translateY(8px)";
  setTimeout(() => {
    updateFn();
    element.style.transition = `opacity ${duration}ms ease, transform ${duration}ms ease`;
    element.style.opacity = "1";
    element.style.transform = "translateY(0)";
    setTimeout(() => {
      _state.isAnimating = false;
      element.style.transition = "";
    }, duration);
  }, duration);
}
function getCurrentMessage() {
  return _state.currentMessage;
}
function clear() {
  if (!_state.container) return;
  const messageArea = _state.container.querySelector(`#${PANEL_ID}-message-area`);
  const primaryEl = _state.container.querySelector(`#${PANEL_ID}-primary`);
  const secondaryEl = _state.container.querySelector(`#${PANEL_ID}-secondary`);
  const iconEl = _state.container.querySelector(`#${PANEL_ID}-icon`);
  if (messageArea && primaryEl) {
    displayEmpty(messageArea, primaryEl, secondaryEl, iconEl);
  }
  _state.currentMessage = null;
}
function destroy() {
  _state.container = null;
  _state.currentMessage = null;
  _state.isAnimating = false;
}
var message_display_default = {
  init,
  display,
  showLoading,
  hideLoading,
  getCurrentMessage,
  clear,
  destroy
};
export {
  MODULE_ID,
  VERSION,
  clear,
  message_display_default as default,
  destroy,
  display,
  getCurrentMessage,
  hideLoading,
  init,
  showLoading
};
