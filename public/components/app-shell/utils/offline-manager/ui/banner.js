import { config, getBannerElement, setBannerElement } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.utils.offline-manager.ui.banner";
function removeBanner() {
  const bannerElement = getBannerElement();
  if (bannerElement && bannerElement.parentNode) {
    bannerElement.parentNode.removeChild(bannerElement);
    setBannerElement(null);
  }
}
function showBanner(message, type) {
  if (!config.showBanner) return;
  if (typeof document === "undefined") return;
  removeBanner();
  const banner = document.createElement("div");
  banner.id = "shell-offline-banner";
  banner.setAttribute("role", "alert");
  banner.setAttribute("aria-live", "polite");
  const bgColor = type === "offline" ? "#dc3545" : type === "slow" ? "#fd7e14" : "#28a745";
  banner.style.cssText = [
    "position: fixed",
    config.bannerPosition === "top" ? "top: 0" : "bottom: 0",
    "left: 0",
    "right: 0",
    "padding: 10px 16px",
    `background: ${bgColor}`,
    "color: white",
    "font-size: 14px",
    "text-align: center",
    "z-index: 99998",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "gap: 8px"
  ].join(";");
  const icon = type === "offline" ? "\u{1F4E1}" : type === "slow" ? "\u{1F422}" : "\u2705";
  banner.innerHTML = `<span>${icon}</span><span>${message}</span>`;
  if (type !== "offline") {
    const closeBtn = document.createElement("button");
    closeBtn.innerHTML = "&times;";
    closeBtn.style.cssText = "background: none; border: none; color: white; font-size: 18px; cursor: pointer; margin-left: 12px;";
    closeBtn.onclick = removeBanner;
    banner.appendChild(closeBtn);
    setTimeout(removeBanner, 5e3);
  }
  document.body.appendChild(banner);
  setBannerElement(banner);
}
export {
  MODULE_ID,
  VERSION,
  removeBanner,
  showBanner
};
