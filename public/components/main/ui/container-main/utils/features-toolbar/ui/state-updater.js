import { ICONS } from "../icons.js";
import { validateStateProviderResult } from "../constants.js";
import {
  hasAction,
  getButtonState,
  setIsFullscreen,
  setIsDarkTheme,
  getToolbarEl
} from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.ui.state-updater";
const _DANGEROUS_PATTERN = /<\s*(script|iframe|object|embed|form|link|meta|base)\b/i;
const _EVENT_HANDLER_PATTERN = /\bon[a-z]+\s*=/i;
function _isSafeSvg(iconHtml) {
  if (typeof iconHtml !== "string") return false;
  if (iconHtml.length === 0) return false;
  const trimmed = iconHtml.trim();
  if (trimmed.indexOf("<svg") !== 0 && trimmed.indexOf("<SVG") !== 0) return false;
  if (_DANGEROUS_PATTERN.test(iconHtml)) return false;
  if (_EVENT_HANDLER_PATTERN.test(iconHtml)) return false;
  return true;
}
function _updateAriaLabel(btn, tooltip) {
  if (!btn || !tooltip) return;
  const shortcut = btn.getAttribute("data-shortcut");
  if (shortcut) {
    btn.setAttribute("aria-label", `${tooltip} (${shortcut})`);
  } else {
    btn.setAttribute("aria-label", tooltip);
  }
}
function _updateButtonStates() {
  _updateFullscreenState();
  _updateThemeState();
  _updateOfflineState();
  const toolbar = getToolbarEl() || document.getElementById("features-toolbar");
  if (!toolbar) return;
  const buttons = toolbar.querySelectorAll(".features-toolbar__btn");
  buttons.forEach((btn) => {
    const buttonId = btn.getAttribute("data-button-id");
    if (!buttonId) return;
    if (buttonId === "fullscreen" || buttonId === "theme" || buttonId === "offline") return;
    const rawState = getButtonState(buttonId);
    const state = validateStateProviderResult(rawState);
    if (state) {
      btn.classList.remove("features-toolbar__btn--skeleton");
      if (typeof state.disabled === "boolean") {
        btn.disabled = state.disabled;
      } else {
        btn.disabled = false;
      }
      if (typeof state.active === "boolean") {
        btn.classList.toggle("features-toolbar__btn--active", state.active);
      }
      if (state.icon) {
        _setButtonIcon(btn, state.icon);
      }
      if (state.tooltip) {
        btn.setAttribute("data-tooltip", state.tooltip);
        _updateAriaLabel(btn, state.tooltip);
      }
      _updateBadge(btn, state.badge);
      _updateDot(btn, state.dot);
    } else {
      const wired = hasAction(buttonId);
      btn.disabled = !wired;
      btn.classList.toggle("features-toolbar__btn--skeleton", !wired);
      _updateBadge(btn, void 0);
      _updateDot(btn, void 0);
    }
  });
}
function _updateBadge(btn, value) {
  const badge = btn.querySelector(".features-toolbar__badge");
  if (!badge) return;
  if (value !== void 0 && value !== null && value !== "" && value !== 0) {
    badge.textContent = String(value);
    badge.style.display = "";
  } else {
    badge.textContent = "";
    badge.style.display = "none";
  }
}
function _updateDot(btn, show) {
  const dot = btn.querySelector(".features-toolbar__dot");
  if (!dot) return;
  dot.style.display = show === true ? "" : "none";
}
function _setButtonIcon(btn, iconHtml) {
  if (!_isSafeSvg(iconHtml)) {
    if (typeof console !== "undefined" && console.log) {
      console.debug("[features-toolbar] Rejected unsafe icon for button:", btn.getAttribute("data-button-id"));
    }
    return;
  }
  const badge = btn.querySelector(".features-toolbar__badge");
  const dot = btn.querySelector(".features-toolbar__dot");
  btn.innerHTML = iconHtml;
  if (badge) btn.appendChild(badge);
  if (dot) btn.appendChild(dot);
}
function _updateFullscreenState() {
  const btn = document.getElementById("ft-btn-fullscreen");
  if (!btn) return;
  const isFs = !!document.fullscreenElement;
  setIsFullscreen(isFs);
  _setButtonIcon(btn, isFs ? ICONS.exitFullscreen : ICONS.fullscreen);
  const tooltip = isFs ? "Sair Tela Cheia" : "Tela Cheia";
  btn.setAttribute("data-tooltip", tooltip);
  _updateAriaLabel(btn, tooltip);
  const wired = hasAction("fullscreen");
  btn.disabled = !wired;
  btn.classList.toggle("features-toolbar__btn--skeleton", !wired);
}
function _updateThemeState() {
  const btn = document.getElementById("ft-btn-theme");
  if (!btn) return;
  const isDark = document.documentElement.classList.contains("theme-dark") || !document.documentElement.classList.contains("theme-light");
  setIsDarkTheme(isDark);
  _setButtonIcon(btn, isDark ? ICONS.sun : ICONS.moon);
  const tooltip = isDark ? "Tema Claro" : "Tema Escuro";
  btn.setAttribute("data-tooltip", tooltip);
  _updateAriaLabel(btn, tooltip);
  const wired = hasAction("theme");
  btn.disabled = !wired;
  btn.classList.toggle("features-toolbar__btn--skeleton", !wired);
}
function _updateOfflineState() {
  const btn = document.getElementById("ft-btn-offline");
  if (!btn) return;
  const rawState = getButtonState("offline");
  const state = validateStateProviderResult(rawState);
  let isOffline = false;
  if (state && typeof state.active === "boolean") {
    isOffline = state.active;
  } else {
    isOffline = !navigator.onLine;
  }
  _setButtonIcon(btn, isOffline ? ICONS.wifiOff : ICONS.wifi);
  const tooltip = isOffline ? "Voltar Online" : "Modo Offline";
  btn.setAttribute("data-tooltip", tooltip);
  _updateAriaLabel(btn, tooltip);
  btn.classList.toggle("features-toolbar__btn--active", isOffline);
  const wired = hasAction("offline");
  btn.disabled = !wired;
  btn.classList.toggle("features-toolbar__btn--skeleton", !wired);
  _updateDot(btn, isOffline);
  if (state && state.tooltip) {
    btn.setAttribute("data-tooltip", String(state.tooltip));
    _updateAriaLabel(btn, String(state.tooltip));
  }
  if (state) {
    _updateBadge(btn, state.badge);
  }
}
export {
  MODULE_ID,
  VERSION,
  _updateButtonStates
};
