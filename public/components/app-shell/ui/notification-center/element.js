import { config, metrics } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.element";
const ICONS = {
  info: "\u2139\uFE0F",
  success: "\u2705",
  warning: "\u26A0\uFE0F",
  error: "\u274C",
  loading: "\u23F3"
};
function getIcon(type) {
  return ICONS[type] || ICONS.info;
}
function escapeHtml(str) {
  if (!str) return "";
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function createNotificationElement(notification, dismissFn) {
  const el = document.createElement("div");
  el.className = `shell-notification ${notification.type}`;
  el.setAttribute("data-id", notification.id);
  el.setAttribute("role", "alert");
  const html = [
    `<span class="shell-notification-icon">${getIcon(notification.type)}</span>`,
    '<div class="shell-notification-content">'
  ];
  if (notification.title) {
    html.push(`<p class="shell-notification-title">${escapeHtml(notification.title)}</p>`);
  }
  if (notification.message) {
    html.push(`<p class="shell-notification-message">${escapeHtml(notification.message)}</p>`);
  }
  if (notification.actions && notification.actions.length > 0) {
    html.push('<div class="shell-notification-actions">');
    notification.actions.forEach((action, idx) => {
      html.push(`<button class="shell-notification-action${action.primary ? " primary" : ""}" data-action="${idx}">${escapeHtml(action.label)}</button>`);
    });
    html.push("</div>");
  }
  html.push("</div>");
  if (notification.dismissible !== false) {
    html.push('<button class="shell-notification-close" aria-label="Fechar">&times;</button>');
  }
  if (config.showProgress && notification.duration && notification.type !== "loading") {
    html.push('<div class="shell-notification-progress" style="width: 100%;"></div>');
  }
  el.innerHTML = html.join("");
  const closeBtn = el.querySelector(".shell-notification-close");
  if (closeBtn) {
    closeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      dismissFn(notification.id);
    });
  }
  const actionBtns = el.querySelectorAll(".shell-notification-action");
  actionBtns.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const idx = parseInt(btn.getAttribute("data-action"), 10);
      const action = notification.actions[idx];
      if (action && action.onClick) {
        action.onClick(notification);
      }
      if (action && action.dismiss !== false) {
        dismissFn(notification.id);
      }
    });
  });
  if (notification.onClick) {
    el.style.cursor = "pointer";
    el.addEventListener("click", () => {
      metrics.clicked++;
      notification.onClick(notification);
    });
  }
  if (config.pauseOnHover && notification.duration) {
    el.addEventListener("mouseenter", () => {
      notification._paused = true;
    });
    el.addEventListener("mouseleave", () => {
      notification._paused = false;
    });
  }
  return el;
}
export {
  MODULE_ID,
  VERSION,
  createNotificationElement,
  escapeHtml,
  getIcon
};
