const MODULE_ID = "modal-manager-global.utils.contracts";
const VERSION = "1.2.0-P2-ENTERPRISE";
const MODAL_TYPES = ["dialog", "drawer", "sheet", "full-screen", "alert", "confirm", "prompt", "custom"];
const MODAL_SIZES = ["xs", "sm", "md", "lg", "xl", "full"];
const DRAWER_POSITIONS = ["left", "right", "top", "bottom"];
const TYPE_DEFAULTS = {
  "dialog": { size: "md", blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true },
  "drawer": { size: "sm", blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true, position: "right" },
  "sheet": { size: "md", blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true, position: "bottom" },
  "full-screen": { size: "full", blocking: true, closeOnEsc: true, closeOnBackdrop: false, focusTrap: true },
  "alert": { size: "sm", blocking: true, closeOnEsc: false, closeOnBackdrop: false, focusTrap: true },
  "confirm": { size: "sm", blocking: true, closeOnEsc: true, closeOnBackdrop: false, focusTrap: true },
  "prompt": { size: "sm", blocking: true, closeOnEsc: true, closeOnBackdrop: false, focusTrap: true },
  "custom": { size: "md", blocking: false, closeOnEsc: true, closeOnBackdrop: true, focusTrap: true }
};
const DEFAULT_MODAL_DESCRIPTOR = {
  id: null,
  type: "dialog",
  title: "",
  content: null,
  component: null,
  props: {},
  size: "md",
  position: null,
  blocking: false,
  closeOnEsc: true,
  closeOnBackdrop: true,
  focusTrap: true,
  showCloseButton: true,
  backdrop: { visible: true, opacity: 0.5, blur: false },
  animation: { enter: "fade-scale", exit: "fade-scale", duration: 300 },
  aria: { label: null, labelledBy: null, describedBy: null },
  zIndex: null,
  owner: "unknown",
  context: {},
  callbacks: { onOpen: null, onClose: null, onConfirm: null, onCancel: null },
  runtime: { createdAt: null, openedAt: null, closedAt: null, visible: false, closing: false }
};
function isValidType(type) {
  return MODAL_TYPES.indexOf(type) !== -1;
}
function isValidSize(size) {
  return MODAL_SIZES.indexOf(size) !== -1;
}
function isValidPosition(position) {
  return DRAWER_POSITIONS.indexOf(position) !== -1;
}
function validateModalDescriptor(descriptor) {
  const errors = [];
  const warnings = [];
  if (!descriptor || typeof descriptor !== "object") {
    return { valid: false, errors: ["Descriptor must be an object"], warnings: [], normalized: null };
  }
  if (!descriptor.id || typeof descriptor.id !== "string") {
    errors.push("id is required and must be a string");
  }
  if (descriptor.type && !isValidType(descriptor.type)) {
    errors.push(`Invalid type: ${descriptor.type}. Valid: ${MODAL_TYPES.join(", ")}`);
  }
  if (descriptor.size && !isValidSize(descriptor.size)) {
    warnings.push(`Invalid size: ${descriptor.size}, using md`);
  }
  if ((descriptor.type === "drawer" || descriptor.type === "sheet") && descriptor.position) {
    if (!isValidPosition(descriptor.position)) {
      warnings.push(`Invalid position: ${descriptor.position}, using default`);
    }
  }
  if (!descriptor.content && !descriptor.component && ["alert", "confirm", "prompt"].indexOf(descriptor.type) === -1) {
    warnings.push("No content or component provided");
  }
  if (errors.length > 0) {
    return { valid: false, errors, warnings, normalized: null };
  }
  const normalized = normalizeDescriptor(descriptor);
  return { valid: true, errors: [], warnings, normalized };
}
function normalizeDescriptor(descriptor) {
  const type = descriptor.type || "dialog";
  const typeDefaults = TYPE_DEFAULTS[type] || TYPE_DEFAULTS["custom"];
  const normalized = Object.assign({}, DEFAULT_MODAL_DESCRIPTOR, typeDefaults, descriptor, {
    type,
    id: descriptor.id,
    size: isValidSize(descriptor.size) ? descriptor.size : typeDefaults.size,
    backdrop: normalizeBackdrop(descriptor.backdrop),
    animation: normalizeAnimation(descriptor.animation),
    aria: normalizeAria(descriptor.aria, descriptor.title),
    callbacks: normalizeCallbacks(descriptor.callbacks),
    runtime: { createdAt: Date.now(), openedAt: null, closedAt: null, visible: false, closing: false }
  });
  if (type === "drawer" || type === "sheet") {
    normalized.position = isValidPosition(descriptor.position) ? descriptor.position : typeDefaults.position;
  }
  return normalized;
}
function normalizeBackdrop(backdrop) {
  if (backdrop === false) {
    return { visible: false, opacity: 0, blur: false };
  }
  return { visible: backdrop && backdrop.visible !== void 0 ? backdrop.visible : true, opacity: backdrop && backdrop.opacity !== void 0 ? backdrop.opacity : 0.5, blur: backdrop && backdrop.blur || false };
}
function normalizeAnimation(animation) {
  return { enter: animation && animation.enter || "fade-scale", exit: animation && animation.exit || "fade-scale", duration: animation && animation.duration || 300 };
}
function normalizeAria(aria, title) {
  return { label: aria && aria.label || title || null, labelledBy: aria && aria.labelledBy || null, describedBy: aria && aria.describedBy || null };
}
function normalizeCallbacks(callbacks) {
  return { onOpen: callbacks && typeof callbacks.onOpen === "function" ? callbacks.onOpen : null, onClose: callbacks && typeof callbacks.onClose === "function" ? callbacks.onClose : null, onConfirm: callbacks && typeof callbacks.onConfirm === "function" ? callbacks.onConfirm : null, onCancel: callbacks && typeof callbacks.onCancel === "function" ? callbacks.onCancel : null };
}
function getVersion() {
  return VERSION;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, modalTypes: MODAL_TYPES, modalSizes: MODAL_SIZES, timestamp: Date.now() };
}
function healthCheck() {
  const checks = { typesAvailable: MODAL_TYPES.length > 0, sizesAvailable: MODAL_SIZES.length > 0, defaultsAvailable: Object.keys(TYPE_DEFAULTS).length > 0 };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : "DEGRADED", score: `${passed}/${checkKeys.length}`, checks, moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}
var contracts_default = { MODAL_TYPES, MODAL_SIZES, validateModalDescriptor, normalizeDescriptor, getVersion, healthCheck, info, VERSION, MODULE_ID };
export {
  DEFAULT_MODAL_DESCRIPTOR,
  DRAWER_POSITIONS,
  MODAL_SIZES,
  MODAL_TYPES,
  MODULE_ID,
  TYPE_DEFAULTS,
  VERSION,
  contracts_default as default,
  getVersion,
  healthCheck,
  info,
  isValidPosition,
  isValidSize,
  isValidType,
  normalizeAnimation,
  normalizeAria,
  normalizeBackdrop,
  normalizeCallbacks,
  normalizeDescriptor,
  validateModalDescriptor
};
