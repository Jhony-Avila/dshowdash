import { ICONS } from "../utils/icons.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-alert";
const ALERT_VARIANT = { INFO: "info", SUCCESS: "success", WARNING: "warning", DANGER: "danger" };
const VARIANT_ICONS = {
  info: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  success: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M9 12l2 2 4-4"/></svg>',
  warning: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  danger: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
};
function createAlert(options = {}) {
  const {
    title = "",
    message = "",
    variant = ALERT_VARIANT.INFO,
    dismissible = false,
    showIcon = true,
    actions = [],
    className = "",
    onDismiss
  } = options;
  const alert = document.createElement("div");
  alert.className = `dsd-alert dsd-alert--${variant} ${className}`.trim();
  alert.setAttribute("role", "alert");
  alert.setAttribute("aria-live", variant === ALERT_VARIANT.DANGER ? "assertive" : "polite");
  const iconHtml = showIcon ? `<span class="dsd-alert__icon" aria-hidden="true">${VARIANT_ICONS[variant]}</span>` : "";
  const titleHtml = title ? `<strong class="dsd-alert__title">${title}</strong>` : "";
  const dismissHtml = dismissible ? `<button type="button" class="dsd-alert__dismiss" aria-label="Fechar">${ICONS.close || "\xD7"}</button>` : "";
  let actionsHtml = "";
  if (actions.length > 0) {
    actionsHtml = `<div class="dsd-alert__actions">${actions.map(
      (a, i) => `<button type="button" class="dsd-alert__action ${a.primary ? "dsd-alert__action--primary" : ""}" data-index="${i}">${a.label}</button>`
    ).join("")}</div>`;
  }
  alert.innerHTML = `
    ${iconHtml}
    <div class="dsd-alert__content">
      ${titleHtml}
      <p class="dsd-alert__message">${message}</p>
      ${actionsHtml}
    </div>
    ${dismissHtml}
  `;
  if (dismissible) {
    alert.querySelector(".dsd-alert__dismiss")?.addEventListener("click", () => {
      alert.classList.add("dsd-alert--dismissing");
      setTimeout(() => {
        onDismiss?.();
        alert.remove();
      }, 200);
    });
  }
  if (actions.length > 0) {
    alert.querySelectorAll(".dsd-alert__action").forEach((btn) => {
      btn.addEventListener("click", () => {
        const idx = parseInt(btn.dataset.index || "", 10);
        actions[idx]?.onClick?.();
      });
    });
  }
  return {
    element: alert,
    dismiss() {
      alert.querySelector(".dsd-alert__dismiss")?.click();
      return this;
    },
    setMessage(msg) {
      const el = alert.querySelector(".dsd-alert__message");
      if (el) el.textContent = msg;
      return this;
    },
    setTitle(t) {
      const el = alert.querySelector(".dsd-alert__title");
      if (el) el.textContent = t;
      return this;
    },
    getElement() {
      return alert;
    }
  };
}
function showAlert(container, options) {
  const alert = createAlert(options);
  container.insertBefore(alert.element, container.firstChild);
  return alert;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var alert_default = { createAlert, showAlert, info, healthCheck, VERSION, MODULE_ID, ALERT_VARIANT };
export {
  ALERT_VARIANT,
  MODULE_ID,
  VERSION,
  createAlert,
  alert_default as default,
  healthCheck,
  info,
  showAlert
};
