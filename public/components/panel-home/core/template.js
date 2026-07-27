import { PANEL_ID } from "./constants.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home.core.template";
function renderStructure(container) {
  container.innerHTML = `
    <div class="ph-wrapper" data-panel="${PANEL_ID}">
      <div class="ph-content">
        <div class="ph-message-area" id="${PANEL_ID}-message-area">
          <div class="ph-message-container">
            <span class="ph-message-icon" id="${PANEL_ID}-icon"></span>
            <div class="ph-message-text-wrapper">
              <h2 class="ph-message-primary" id="${PANEL_ID}-primary"></h2>
              <p class="ph-message-secondary" id="${PANEL_ID}-secondary"></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderLoading(container) {
  const messageArea = container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.add("ph-loading");
  }
}
function removeLoading(container) {
  const messageArea = container.querySelector(`#${PANEL_ID}-message-area`);
  if (messageArea) {
    messageArea.classList.remove("ph-loading");
  }
}
function renderMessage(container, message) {
  const primaryEl = container.querySelector(`#${PANEL_ID}-primary`);
  const secondaryEl = container.querySelector(`#${PANEL_ID}-secondary`);
  const iconEl = container.querySelector(`#${PANEL_ID}-icon`);
  const messageArea = container.querySelector(`#${PANEL_ID}-message-area`);
  if (!primaryEl || !messageArea) return;
  messageArea.classList.remove("ph-loading");
  if (!message) {
    messageArea.classList.add("ph-empty");
    primaryEl.textContent = "";
    if (secondaryEl) secondaryEl.textContent = "";
    if (iconEl) iconEl.textContent = "";
    return;
  }
  messageArea.classList.remove("ph-empty");
  messageArea.classList.add("ph-fade-in");
  messageArea.dataset.category = message.category || "default";
  if (iconEl) {
    iconEl.textContent = getCategoryIcon(message.category);
  }
  primaryEl.textContent = message.text || "";
  if (secondaryEl) {
    secondaryEl.textContent = message.subtitle || "";
    secondaryEl.style.display = message.subtitle ? "block" : "none";
  }
  setTimeout(() => {
    messageArea.classList.remove("ph-fade-in");
  }, 300);
}
function getCategoryIcon(category) {
  const icons = {
    temporal: "\u{1F550}",
    acolhimento: "\u{1F44B}",
    acao: "\u{1F680}",
    contexto: "\u{1F504}",
    estado: "\u2705",
    inspiracional: "\u{1F4A1}",
    idle: "\u{1F4A4}",
    default: "\u2728"
  };
  return icons[category] || icons.default;
}
var template_default = {
  renderStructure,
  renderLoading,
  removeLoading,
  renderMessage
};
export {
  MODULE_ID,
  VERSION,
  template_default as default,
  removeLoading,
  renderLoading,
  renderMessage,
  renderStructure
};
