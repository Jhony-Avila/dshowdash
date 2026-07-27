const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-spinner";
const SPINNER_SIZE = { XS: "xs", SM: "sm", MD: "md", LG: "lg", XL: "xl" };
const SPINNER_VARIANT = { DEFAULT: "default", PRIMARY: "primary", WHITE: "white" };
function createSpinner(options = {}) {
  const {
    size = SPINNER_SIZE.MD,
    variant = SPINNER_VARIANT.DEFAULT,
    label = "Carregando...",
    showLabel = false,
    className = ""
  } = options;
  const spinner = document.createElement("div");
  spinner.className = `dsd-spinner dsd-spinner--${size} dsd-spinner--${variant} ${className}`.trim();
  spinner.setAttribute("role", "status");
  spinner.setAttribute("aria-label", String(label));
  spinner.innerHTML = `
    <svg class="dsd-spinner__svg" viewBox="0 0 24 24" fill="none">
      <circle class="dsd-spinner__track" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
      <circle class="dsd-spinner__indicator" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>
    </svg>
    ${showLabel ? `<span class="dsd-spinner__label">${label}</span>` : `<span class="sr-only">${label}</span>`}
  `;
  return {
    element: spinner,
    show() {
      spinner.hidden = false;
      return this;
    },
    hide() {
      spinner.hidden = true;
      return this;
    },
    setLabel(newLabel) {
      spinner.setAttribute("aria-label", newLabel);
      const labelEl = spinner.querySelector(".dsd-spinner__label");
      if (labelEl) labelEl.textContent = newLabel;
      return this;
    },
    getElement() {
      return spinner;
    }
  };
}
function createOverlaySpinner(container, options = {}) {
  const { label = "Carregando...", variant = SPINNER_VARIANT.PRIMARY } = options;
  const overlay = document.createElement("div");
  overlay.className = "dsd-spinner-overlay";
  const spinner = createSpinner({ size: SPINNER_SIZE.LG, variant, label, showLabel: true });
  overlay.appendChild(spinner.element);
  return {
    show() {
      container.style.position = "relative";
      container.appendChild(overlay);
      return this;
    },
    hide() {
      overlay.remove();
      return this;
    },
    getElement() {
      return overlay;
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var spinner_default = { createSpinner, createOverlaySpinner, info, healthCheck, VERSION, MODULE_ID, SPINNER_SIZE, SPINNER_VARIANT };
export {
  MODULE_ID,
  SPINNER_SIZE,
  SPINNER_VARIANT,
  VERSION,
  createOverlaySpinner,
  createSpinner,
  spinner_default as default,
  healthCheck,
  info
};
