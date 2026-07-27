const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-skeleton";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
function _validateOptions(options) {
  const errors = [];
  if (options.type !== void 0 && !["dashboard", "list", "cards", "simple"].includes(options.type)) errors.push("type must be dashboard|list|cards|simple");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const SKELETON_TEMPLATES = {
  dashboard: `<div class="dsd-container__skeleton dsd-skeleton-dashboard" role="status" aria-label="Carregando dashboard" aria-busy="true">
    <div class="dsd-skeleton-dashboard__header"><div class="dsd-skeleton dsd-skeleton--title"></div><div class="dsd-skeleton dsd-skeleton--button"></div></div>
    <div class="dsd-skeleton-dashboard__cards"><div class="dsd-skeleton dsd-skeleton--card-sm"></div><div class="dsd-skeleton dsd-skeleton--card-sm"></div><div class="dsd-skeleton dsd-skeleton--card-sm"></div><div class="dsd-skeleton dsd-skeleton--card-sm"></div></div>
    <div class="dsd-skeleton-dashboard__main"><div class="dsd-skeleton dsd-skeleton--chart"></div><div class="dsd-skeleton-stack"><div class="dsd-skeleton dsd-skeleton--text"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div><div class="dsd-skeleton dsd-skeleton--text"></div><div class="dsd-skeleton dsd-skeleton--text-lg"></div></div></div>
  </div>`,
  list: `<div class="dsd-container__skeleton" role="status" aria-label="Carregando lista" aria-busy="true">
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
    <div class="dsd-skeleton-row"><div class="dsd-skeleton dsd-skeleton--avatar"></div><div class="dsd-skeleton-stack" style="flex:1"><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div></div>
  </div>`,
  cards: `<div class="dsd-container__skeleton" role="status" aria-label="Carregando cards" aria-busy="true"><div class="dsd-skeleton-grid"><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div><div class="dsd-skeleton dsd-skeleton--card"></div></div></div>`,
  simple: `<div class="dsd-container__skeleton" role="status" aria-label="Carregando conte\xFAdo" aria-busy="true"><div class="dsd-skeleton dsd-skeleton--title"></div><div class="dsd-skeleton dsd-skeleton--text"></div><div class="dsd-skeleton dsd-skeleton--text-lg"></div><div class="dsd-skeleton dsd-skeleton--text-sm"></div></div>`
};
function getSkeletonTemplate(type) {
  return SKELETON_TEMPLATES[type] || SKELETON_TEMPLATES.simple;
}
function createSkeleton(container, options = {}) {
  _validateOptions(options);
  const { type = "dashboard" } = options;
  let _initialized = false;
  let _skeletonEl = null;
  let _contentEl = null;
  const skeleton = {
    init() {
      if (_initialized) return this;
      _contentEl = container.querySelector(".dsd-container__content");
      _initialized = true;
      return this;
    },
    show(skeletonType = type) {
      if (!_contentEl || _skeletonEl) return this;
      const wrapper = document.createElement("div");
      wrapper.innerHTML = getSkeletonTemplate(skeletonType);
      _skeletonEl = wrapper.firstElementChild;
      _contentEl.innerHTML = "";
      _contentEl.appendChild(_skeletonEl);
      container.setAttribute("data-skeleton", "true");
      container.setAttribute("aria-busy", "true");
      return this;
    },
    hide() {
      if (!_skeletonEl) return this;
      _skeletonEl.remove();
      _skeletonEl = null;
      container.removeAttribute("data-skeleton");
      container.setAttribute("aria-busy", "false");
      return this;
    },
    isVisible() {
      return !!_skeletonEl;
    },
    setType(newType) {
      if (!["dashboard", "list", "cards", "simple"].includes(newType)) return this;
      if (_skeletonEl) {
        this.hide();
        this.show(newType);
      }
      return this;
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      this.hide();
      _contentEl = null;
      _initialized = false;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, visible: this.isVisible(), domOnly: true, hasValidation: true };
    }
  };
  return skeleton;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, domOnly: true, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, domOnly: true, hasValidation: true };
}
var skeleton_default = { createSkeleton, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createSkeleton,
  skeleton_default as default,
  healthCheck,
  info
};
