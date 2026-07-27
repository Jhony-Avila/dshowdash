const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-badge";
const BADGE_VARIANT = {
  DEFAULT: "default",
  PRIMARY: "primary",
  SUCCESS: "success",
  WARNING: "warning",
  DANGER: "danger",
  INFO: "info"
};
const BADGE_SIZE = { SM: "sm", MD: "md", LG: "lg" };
function createBadge(options = {}) {
  const {
    text = "",
    variant = BADGE_VARIANT.DEFAULT,
    size = BADGE_SIZE.MD,
    rounded = false,
    dot = false,
    removable = false,
    className = "",
    onRemove
  } = options;
  const badge = document.createElement("span");
  badge.className = `dsd-badge dsd-badge--${variant} dsd-badge--${size} ${rounded ? "dsd-badge--rounded" : ""} ${dot ? "dsd-badge--dot" : ""} ${className}`.trim();
  if (dot) {
    badge.innerHTML = '<span class="dsd-badge__dot"></span>';
  } else {
    badge.innerHTML = `
      <span class="dsd-badge__text">${text}</span>
      ${removable ? '<button type="button" class="dsd-badge__remove" aria-label="Remover">\xD7</button>' : ""}
    `;
    if (removable) {
      badge.querySelector(".dsd-badge__remove")?.addEventListener("click", (e) => {
        e.stopPropagation();
        onRemove?.();
        badge.remove();
      });
    }
  }
  return {
    element: badge,
    setText(newText) {
      const textEl = badge.querySelector(".dsd-badge__text");
      if (textEl) textEl.textContent = newText;
      return this;
    },
    setVariant(newVariant) {
      Object.values(BADGE_VARIANT).forEach((v) => badge.classList.remove(`dsd-badge--${v}`));
      badge.classList.add(`dsd-badge--${newVariant}`);
      return this;
    },
    remove() {
      badge.remove();
    },
    getElement() {
      return badge;
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var badge_default = { createBadge, info, healthCheck, VERSION, MODULE_ID, BADGE_VARIANT, BADGE_SIZE };
export {
  BADGE_SIZE,
  BADGE_VARIANT,
  MODULE_ID,
  VERSION,
  createBadge,
  badge_default as default,
  healthCheck,
  info
};
