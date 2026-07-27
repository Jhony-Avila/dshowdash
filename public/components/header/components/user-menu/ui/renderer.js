import { getInitials, getAvatarColor } from "./icons.js";
const MODULE_ID = "header-user-menu-ui-renderer";
const VERSION = "1.4.0-P18EC";
let _metrics = { positionUpdates: 0, uiUpdates: 0 };
function updateDropdownPosition(element, dropdown) {
  if (!element || !dropdown) return;
  _metrics.positionUpdates++;
  const trigger = element.querySelector(".user-menu-trigger");
  if (!trigger) return;
  const rect = trigger.getBoundingClientRect();
  dropdown.style.position = "fixed";
  dropdown.style.top = `${rect.bottom + 8}px`;
  dropdown.style.left = "8px";
  dropdown.style.right = "auto";
}
function updateUI(element, dropdown, state) {
  if (!element || !dropdown) return;
  _metrics.uiUpdates++;
  const avatarContainer = element.querySelector(".user-avatar");
  const avatarImg = element.querySelector(".avatar-img");
  const avatarInitials = element.querySelector(".avatar-initials");
  const avatarLargeContainer = dropdown.querySelector(".user-avatar-large");
  const avatarLargeImg = dropdown.querySelector(".avatar-img");
  const avatarLargeInitials = dropdown.querySelector(".avatar-initials");
  const nameEl = element.querySelector(".user-name");
  const nameFullEl = dropdown.querySelector(".user-name-full");
  const roleEl = dropdown.querySelector(".user-role");
  const trigger = element.querySelector(".user-menu-trigger");
  if (state.user) {
    const initials = getInitials(state.user.name || state.user.fullName);
    const avatarUrl = state.user.avatar_url || state.user.avatar;
    const hasAvatar = avatarUrl && avatarUrl.length > 0 && !avatarUrl.includes("default");
    const bgColor = getAvatarColor(state.user.id);
    if (hasAvatar) {
      avatarImg.src = avatarUrl;
      avatarImg.style.display = "block";
      avatarInitials.style.display = "none";
    } else {
      avatarImg.style.display = "none";
      avatarInitials.style.display = "flex";
      avatarInitials.textContent = initials;
      avatarContainer.style.background = bgColor;
    }
    if (hasAvatar) {
      avatarLargeImg.src = avatarUrl;
      avatarLargeImg.style.display = "block";
      avatarLargeInitials.style.display = "none";
    } else {
      avatarLargeImg.style.display = "none";
      avatarLargeInitials.style.display = "flex";
      avatarLargeInitials.textContent = initials;
      avatarLargeContainer.style.background = bgColor;
    }
    const displayName = state.user.name || state.user.fullName || "Usu\xE1rio";
    nameEl.textContent = displayName;
    nameFullEl.textContent = state.user.fullName || displayName;
    roleEl.textContent = state.user.funcao || state.user.role || "user";
    element.dataset.status = "ok";
    element.dataset.role = state.user.role || "user";
  } else {
    avatarImg.style.display = "none";
    avatarInitials.style.display = "flex";
    avatarInitials.textContent = "?";
    avatarLargeImg.style.display = "none";
    avatarLargeInitials.style.display = "flex";
    avatarLargeInitials.textContent = "?";
    nameEl.textContent = "Visitante";
    nameFullEl.textContent = "Visitante";
    element.dataset.status = "guest";
  }
  if (state.isOpen) {
    updateDropdownPosition(element, dropdown);
    dropdown.setAttribute("aria-hidden", "false");
    dropdown.classList.add("is-open");
  } else {
    const activeElement = document.activeElement;
    if (activeElement && dropdown.contains(activeElement)) {
      activeElement.blur();
    }
    dropdown.classList.remove("is-open");
    dropdown.setAttribute("aria-hidden", "true");
  }
  trigger.setAttribute("aria-expanded", String(state.isOpen));
  element.classList.toggle("is-open", state.isOpen);
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { rendererReady: true }, metrics: getMetrics() };
}
export {
  MODULE_ID,
  VERSION,
  getMetrics,
  healthCheck,
  info,
  updateDropdownPosition,
  updateUI
};
