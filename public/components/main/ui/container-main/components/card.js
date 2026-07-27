const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-card";
const CARD_VARIANT = { DEFAULT: "default", ELEVATED: "elevated", OUTLINED: "outlined", FILLED: "filled" };
function createCard(options = {}) {
  const {
    title = "",
    subtitle = "",
    content = "",
    image = null,
    imageAlt = "",
    variant = CARD_VARIANT.DEFAULT,
    actions = [],
    headerActions = [],
    clickable = false,
    className = "",
    onClick
  } = options;
  const card = document.createElement("article");
  card.className = `dsd-card dsd-card--${variant} ${clickable ? "dsd-card--clickable" : ""} ${className}`.trim();
  if (clickable) {
    card.tabIndex = 0;
    card.setAttribute("role", "button");
  }
  let imageHtml = "";
  if (image) {
    imageHtml = `<div class="dsd-card__media"><img src="${image}" alt="${imageAlt}" class="dsd-card__image" loading="lazy" /></div>`;
  }
  let headerHtml = "";
  if (title || subtitle || headerActions.length > 0) {
    const headerActionsHtml = headerActions.length > 0 ? `<div class="dsd-card__header-actions">${headerActions.map(
      (a, i) => `<button type="button" class="dsd-card__header-action" data-header-action="${i}" aria-label="${a.label || ""}">${a.icon || a.label}</button>`
    ).join("")}</div>` : "";
    headerHtml = `
      <header class="dsd-card__header">
        <div class="dsd-card__header-text">
          ${title ? `<h3 class="dsd-card__title">${title}</h3>` : ""}
          ${subtitle ? `<p class="dsd-card__subtitle">${subtitle}</p>` : ""}
        </div>
        ${headerActionsHtml}
      </header>
    `;
  }
  let contentHtml = "";
  if (content) {
    contentHtml = `<div class="dsd-card__content">${typeof content === "string" ? content : ""}</div>`;
  }
  let actionsHtml = "";
  if (actions.length > 0) {
    actionsHtml = `<footer class="dsd-card__actions">${actions.map(
      (a, i) => `<button type="button" class="dsd-card__action ${a.primary ? "dsd-card__action--primary" : ""}" data-action="${i}">${a.label}</button>`
    ).join("")}</footer>`;
  }
  card.innerHTML = `${imageHtml}${headerHtml}${contentHtml}${actionsHtml}`;
  if (content instanceof HTMLElement) {
    card.querySelector(".dsd-card__content")?.appendChild(content);
  }
  if (clickable) {
    card.addEventListener("click", (e) => {
      if (!e.target.closest("button")) onClick?.();
    });
    card.addEventListener("keydown", (e) => {
      if ((e.key === "Enter" || e.key === " ") && !e.target.closest("button")) {
        e.preventDefault();
        onClick?.();
      }
    });
  }
  actions.forEach((a, i) => {
    card.querySelector(`[data-action="${i}"]`)?.addEventListener("click", (e) => {
      e.stopPropagation();
      a.onClick?.();
    });
  });
  headerActions.forEach((a, i) => {
    card.querySelector(`[data-header-action="${i}"]`)?.addEventListener("click", (e) => {
      e.stopPropagation();
      a.onClick?.();
    });
  });
  return {
    element: card,
    setTitle(t) {
      const el = card.querySelector(".dsd-card__title");
      if (el) el.textContent = t;
      return this;
    },
    setSubtitle(s) {
      const el = card.querySelector(".dsd-card__subtitle");
      if (el) el.textContent = s;
      return this;
    },
    setContent(c) {
      const el = card.querySelector(".dsd-card__content");
      if (el) {
        if (typeof c === "string") el.innerHTML = c;
        else {
          el.innerHTML = "";
          el.appendChild(c);
        }
      }
      return this;
    },
    setImage(src, alt = "") {
      const el = card.querySelector(".dsd-card__image");
      if (el) {
        el.src = src;
        el.alt = alt;
      }
      return this;
    },
    getElement() {
      return card;
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID };
}
var card_default = { createCard, info, healthCheck, VERSION, MODULE_ID, CARD_VARIANT };
export {
  CARD_VARIANT,
  MODULE_ID,
  VERSION,
  createCard,
  card_default as default,
  healthCheck,
  info
};
