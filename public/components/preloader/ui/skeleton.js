import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "preloader-skeleton";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function _log(level, msg, ctx) {
  const logger = _getPort("logger");
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === "warn") {
    if (logger.warn) logger.warn(msg, ctx);
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(msg, ctx);
    return;
  }
  if (logger.debug) logger.debug(msg, ctx);
}
const SKELETON_TYPES = Object.freeze({ TEXT: "text", TITLE: "title", PARAGRAPH: "paragraph", AVATAR: "avatar", IMAGE: "image", CARD: "card", LIST: "list", TABLE: "table", CHART: "chart", DASHBOARD: "dashboard", FORM: "form", SIDEBAR: "sidebar", HEADER: "header", CUSTOM: "custom" });
const BASE_CSS = ".skeleton{background:linear-gradient(90deg,#1a1a1a 25%,#2a2a2a 50%,#1a1a1a 75%);background-size:200% 100%;animation:skeleton-shimmer 1.5s infinite;border-radius:4px}@keyframes skeleton-shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}.skeleton-text{height:16px;margin:8px 0}.skeleton-title{height:24px;width:60%;margin:12px 0}.skeleton-avatar{width:48px;height:48px;border-radius:50%}.skeleton-image{width:100%;height:200px}.skeleton-card{padding:16px;background:#1a1a1a;border-radius:8px}.skeleton-row{display:flex;gap:16px;margin:8px 0}.skeleton-col{flex:1}.skeleton-container{padding:16px}.skeleton-pulse{animation:skeleton-pulse 2s infinite}@keyframes skeleton-pulse{0%,100%{opacity:1}50%{opacity:0.5}}";
let _cssInjected = false;
function _injectCSS() {
  if (_cssInjected || !hasDocument) return;
  const style = document.createElement("style");
  style.id = "skeleton-styles";
  style.textContent = BASE_CSS;
  document.head.appendChild(style);
  _cssInjected = true;
}
function _createTextSkeleton(options = {}) {
  const width = options.width || "100%";
  return `<div class="skeleton skeleton-text" style="width: ${width};"></div>`;
}
function _createTitleSkeleton(options = {}) {
  const width = options.width || "60%";
  return `<div class="skeleton skeleton-title" style="width: ${width};"></div>`;
}
function _createParagraphSkeleton(options = {}) {
  const lines = options.lines || 3;
  const widths = options.widths || ["100%", "100%", "70%"];
  let html = "";
  for (let i = 0; i < lines; i++) {
    html += `<div class="skeleton skeleton-text" style="width: ${widths[i % widths.length]};"></div>`;
  }
  return html;
}
function _createAvatarSkeleton(options = {}) {
  const size = options.size || 48;
  return `<div class="skeleton skeleton-avatar" style="width: ${size}px; height: ${size}px;"></div>`;
}
function _createImageSkeleton(options = {}) {
  const height = options.height || 200;
  return `<div class="skeleton skeleton-image" style="height: ${height}px;"></div>`;
}
function _createCardSkeleton(options) {
  return `<div class="skeleton-card">${_createTitleSkeleton()}${_createParagraphSkeleton({ lines: 2 })}<div class="skeleton-row" style="margin-top: 16px;">${_createAvatarSkeleton({ size: 32 })}<div class="skeleton-col">${_createTextSkeleton({ width: "40%" })}</div></div></div>`;
}
function _createListSkeleton(options = {}) {
  const items = options.items || 5;
  let html = "";
  for (let i = 0; i < items; i++) {
    html += `<div class="skeleton-row" style="align-items: center;">${_createAvatarSkeleton({ size: 40 })}<div class="skeleton-col">${_createTextSkeleton({ width: "70%" })}${_createTextSkeleton({ width: "40%" })}</div></div>`;
  }
  return html;
}
function _createTableSkeleton(options = {}) {
  const rows = options.rows || 5;
  const cols = options.cols || 4;
  let headerRow = '<div class="skeleton-row">';
  for (let c = 0; c < cols; c++) {
    headerRow += `<div class="skeleton-col">${_createTextSkeleton({ width: "80%" })}</div>`;
  }
  headerRow += "</div>";
  let bodyRows = "";
  for (let r = 0; r < rows; r++) {
    bodyRows += '<div class="skeleton-row">';
    for (let cc = 0; cc < cols; cc++) {
      bodyRows += `<div class="skeleton-col">${_createTextSkeleton()}</div>`;
    }
    bodyRows += "</div>";
  }
  return `<div class="skeleton-container">${headerRow}${bodyRows}</div>`;
}
function _createChartSkeleton(options = {}) {
  const height = options.height || 300;
  return `<div class="skeleton-card">${_createTitleSkeleton({ width: "40%" })}<div class="skeleton skeleton-image" style="height: ${height}px; margin-top: 16px;"></div></div>`;
}
function _createDashboardSkeleton(options = {}) {
  const cards = options.cards || 4;
  let cardsHtml = "";
  for (let i = 0; i < Math.min(cards, 4); i++) {
    cardsHtml += `<div class="skeleton-col"><div class="skeleton-card">${_createTextSkeleton({ width: "50%" })}${_createTitleSkeleton({ width: "70%" })}</div></div>`;
  }
  return `<div class="skeleton-container"><div class="skeleton-row">${cardsHtml}</div><div style="margin-top: 24px;">${_createChartSkeleton({ height: 250 })}</div><div class="skeleton-row" style="margin-top: 24px;"><div class="skeleton-col">${_createTableSkeleton({ rows: 3, cols: 3 })}</div><div class="skeleton-col">${_createListSkeleton({ items: 4 })}</div></div></div>`;
}
function _createFormSkeleton(options = {}) {
  const fields = options.fields || 4;
  let fieldsHtml = "";
  for (let i = 0; i < fields; i++) {
    fieldsHtml += `<div style="margin: 16px 0;">${_createTextSkeleton({ width: "20%" })}<div class="skeleton" style="height: 40px; margin-top: 8px;"></div></div>`;
  }
  return `<div class="skeleton-container">${_createTitleSkeleton({ width: "30%" })}${fieldsHtml}<div class="skeleton" style="height: 44px; width: 120px; margin-top: 24px;"></div></div>`;
}
function _createSidebarSkeleton(options = {}) {
  const items = options.items || 8;
  let itemsHtml = "";
  for (let i = 0; i < items; i++) {
    itemsHtml += `<div class="skeleton-row" style="align-items: center; margin: 12px 0;"><div class="skeleton" style="width: 24px; height: 24px;"></div>${_createTextSkeleton({ width: "70%" })}</div>`;
  }
  return `<div style="padding: 16px; width: 250px;">${_createAvatarSkeleton({ size: 64 })}${_createTitleSkeleton({ width: "80%" })}${_createTextSkeleton({ width: "60%" })}<div style="margin-top: 32px;">${itemsHtml}</div></div>`;
}
function _createHeaderSkeleton(options) {
  return `<div class="skeleton-row" style="padding: 16px; align-items: center;"><div class="skeleton" style="width: 120px; height: 32px;"></div><div class="skeleton-col"></div><div class="skeleton-row" style="gap: 8px;"><div class="skeleton" style="width: 100px; height: 36px;"></div><div class="skeleton" style="width: 100px; height: 36px;"></div>${_createAvatarSkeleton({ size: 36 })}</div></div>`;
}
function _createCustomSkeleton(options = {}) {
  return options.template || _createTextSkeleton();
}
function createSkeleton(type, options) {
  _injectCSS();
  options = options || {};
  switch (type) {
    case SKELETON_TYPES.TEXT:
      return _createTextSkeleton(options);
    case SKELETON_TYPES.TITLE:
      return _createTitleSkeleton(options);
    case SKELETON_TYPES.PARAGRAPH:
      return _createParagraphSkeleton(options);
    case SKELETON_TYPES.AVATAR:
      return _createAvatarSkeleton(options);
    case SKELETON_TYPES.IMAGE:
      return _createImageSkeleton(options);
    case SKELETON_TYPES.CARD:
      return _createCardSkeleton(options);
    case SKELETON_TYPES.LIST:
      return _createListSkeleton(options);
    case SKELETON_TYPES.TABLE:
      return _createTableSkeleton(options);
    case SKELETON_TYPES.CHART:
      return _createChartSkeleton(options);
    case SKELETON_TYPES.DASHBOARD:
      return _createDashboardSkeleton(options);
    case SKELETON_TYPES.FORM:
      return _createFormSkeleton(options);
    case SKELETON_TYPES.SIDEBAR:
      return _createSidebarSkeleton(options);
    case SKELETON_TYPES.HEADER:
      return _createHeaderSkeleton(options);
    case SKELETON_TYPES.CUSTOM:
      return _createCustomSkeleton(options);
    default:
      return _createTextSkeleton(options);
  }
}
const _activeSkeletons = /* @__PURE__ */ new Map();
function show(containerId, type, options) {
  _injectCSS();
  options = options || {};
  const container = typeof containerId === "string" ? hasDocument ? document.getElementById(containerId) : null : containerId;
  if (!container) {
    _log("warn", "Container not found", { containerId });
    return null;
  }
  const skeletonId = `skeleton_${Date.now()}`;
  const skeletonHTML = createSkeleton(type, options);
  const wrapper = document.createElement("div");
  wrapper.id = skeletonId;
  wrapper.className = "skeleton-wrapper";
  wrapper.innerHTML = skeletonHTML;
  const originalContent = container.innerHTML;
  _activeSkeletons.set(skeletonId, { container, originalContent, wrapper });
  container.innerHTML = "";
  container.appendChild(wrapper);
  _log("debug", "Skeleton shown", { skeletonId, type });
  return skeletonId;
}
function hide(skeletonId, options = {}) {
  const skeleton = _activeSkeletons.get(skeletonId);
  if (!skeleton) return false;
  const container = skeleton.container;
  const originalContent = skeleton.originalContent;
  const wrapper = skeleton.wrapper;
  if (options.fadeOut) {
    wrapper.style.transition = "opacity 0.3s";
    wrapper.style.opacity = "0";
    setTimeout(() => {
      wrapper.remove();
      if (options.restoreContent !== false) {
        container.innerHTML = originalContent;
      }
    }, 300);
  } else {
    wrapper.remove();
    if (options.restoreContent !== false) {
      container.innerHTML = originalContent;
    }
  }
  _activeSkeletons.delete(skeletonId);
  _log("debug", "Skeleton hidden", { skeletonId });
  return true;
}
function hideAll() {
  let count = 0;
  _activeSkeletons.forEach((_, id) => {
    if (hide(id)) count++;
  });
  return count;
}
function isActive(skeletonId) {
  return _activeSkeletons.has(skeletonId);
}
function getActiveCount() {
  return _activeSkeletons.size;
}
function getStatus() {
  return { version: VERSION, moduleId: MODULE_ID, cssInjected: _cssInjected, activeSkeletons: _activeSkeletons.size };
}
function healthCheck() {
  const ps = Ports.snapshot();
  return { status: ps._initialized ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, checks: { hasLogger: !!_getPort("logger"), portsInitialized: ps._initialized }, timestamp: Date.now() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, types: Object.values(SKELETON_TYPES), features: ["14-skeleton-types", "shimmer-animation", "manager", "fade-transitions"] };
}
var skeleton_default = { VERSION, MODULE_ID, SKELETON_TYPES, createSkeleton, show, hide, hideAll, isActive, getActiveCount, getStatus, healthCheck, info, injectPorts, getPorts };
export {
  MODULE_ID,
  SKELETON_TYPES,
  VERSION,
  createSkeleton,
  skeleton_default as default,
  getActiveCount,
  getPorts,
  getStatus,
  healthCheck,
  hide,
  hideAll,
  info,
  injectPorts,
  isActive,
  show
};
