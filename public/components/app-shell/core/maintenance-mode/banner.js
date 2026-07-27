import { MAINTENANCE_TYPES, SEVERITY } from "./constants.js";
import { state, config, bannerElement } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.banner";
function getSeverityColor() {
  switch (state.severity) {
    case SEVERITY.CRITICAL:
      return "#dc3545";
    case SEVERITY.WARNING:
      return "#fd7e14";
    default:
      return "#0d6efd";
  }
}
function getSeverityIcon() {
  switch (state.severity) {
    case SEVERITY.CRITICAL:
      return "\u26A0\uFE0F";
    case SEVERITY.WARNING:
      return "\u{1F527}";
    default:
      return "\u2139\uFE0F";
  }
}
function getDefaultMessage() {
  switch (state.type) {
    case MAINTENANCE_TYPES.FULL:
      return "Sistema em manutencao. Voltaremos em breve.";
    case MAINTENANCE_TYPES.PARTIAL:
      return "Algumas funcionalidades estao temporariamente indisponiveis.";
    case MAINTENANCE_TYPES.SCHEDULED:
      return "Manutencao programada em andamento.";
    case MAINTENANCE_TYPES.EMERGENCY:
      return "Manutencao de emergencia. Desculpe o transtorno.";
    case MAINTENANCE_TYPES.FEATURE:
      return "Recurso temporariamente indisponivel.";
    default:
      return "Sistema em manutencao.";
  }
}
function updateTimeRemaining() {
  if (!state.endTime) return;
  const el = document.getElementById("maintenance-time-remaining");
  if (!el) return;
  const remaining = state.endTime - Date.now();
  if (remaining <= 0) {
    el.textContent = "(finalizando...)";
    return;
  }
  const minutes = Math.ceil(remaining / 6e4);
  if (minutes > 60) {
    const hours = Math.floor(minutes / 60);
    el.textContent = `(~${hours}h restantes)`;
  } else {
    el.textContent = `(~${minutes}min restantes)`;
  }
}
function createBanner() {
  if (typeof document === "undefined") return;
  if (!config.showBanner) return;
  if (bannerElement.value) return;
  const banner = document.createElement("div");
  banner.id = "shell-maintenance-banner";
  banner.className = `maintenance-banner maintenance-${state.severity}`;
  banner.setAttribute("role", "alert");
  banner.setAttribute("aria-live", "assertive");
  const styles = [
    "position: fixed",
    config.bannerPosition === "bottom" ? "bottom: 0" : "top: 0",
    "left: 0",
    "right: 0",
    "padding: 12px 16px",
    `background: ${getSeverityColor()}`,
    "color: white",
    "font-size: 14px",
    "text-align: center",
    "z-index: 99999",
    "display: flex",
    "align-items: center",
    "justify-content: center",
    "gap: 12px"
  ];
  banner.style.cssText = styles.join(";");
  const iconEl = document.createElement("span");
  iconEl.innerHTML = getSeverityIcon();
  banner.appendChild(iconEl);
  const msg = document.createElement("span");
  msg.textContent = state.message || getDefaultMessage();
  banner.appendChild(msg);
  if (state.endTime) {
    const time = document.createElement("span");
    time.id = "maintenance-time-remaining";
    time.style.cssText = "margin-left: 8px; opacity: 0.9; font-size: 12px";
    banner.appendChild(time);
    updateTimeRemaining();
  }
  if (config.allowDismiss) {
    const dismiss = document.createElement("button");
    dismiss.innerHTML = "&times;";
    dismiss.style.cssText = "background: none; border: none; color: white; font-size: 20px; cursor: pointer; margin-left: 12px";
    dismiss.onclick = () => {
      removeBanner();
    };
    banner.appendChild(dismiss);
  }
  document.body.appendChild(banner);
  bannerElement.value = banner;
  document.body.style.paddingTop = config.bannerPosition === "top" ? "48px" : "";
  document.body.style.paddingBottom = config.bannerPosition === "bottom" ? "48px" : "";
}
function removeBanner() {
  if (bannerElement.value && bannerElement.value.parentNode) {
    bannerElement.value.parentNode.removeChild(bannerElement.value);
    bannerElement.value = null;
    document.body.style.paddingTop = "";
    document.body.style.paddingBottom = "";
  }
}
export {
  MODULE_ID,
  VERSION,
  createBanner,
  getDefaultMessage,
  removeBanner,
  updateTimeRemaining
};
