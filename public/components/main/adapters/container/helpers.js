const VERSION = "8.0.0-UNIFIED";
const MODULE_ID = "container-helpers";
const VALID_VARIANTS = ["default", "primary", "secondary", "tertiary", "minimal", "card", "panel", "modal", "floating"];
function validateVariant(variant) {
  if (!variant || typeof variant !== "string") return "default";
  const normalized = variant.toLowerCase().trim();
  return VALID_VARIANTS.includes(normalized) ? normalized : "default";
}
function validateTitle(title) {
  if (!title || typeof title !== "string") return "";
  return title.replace(/[<>]/g, "").trim().slice(0, 100);
}
function debounce(fn, delay = 100) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
function throttle(fn, limit = 100) {
  let inThrottle = false;
  return (...args) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}
function generateId(prefix = "id") {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 9)}`;
}
function deepClone(obj) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { ...obj };
  }
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      functionsAvailable: ["validateVariant", "validateTitle", "debounce", "throttle", "generateId", "deepClone"],
      validVariants: VALID_VARIANTS
    }
  };
}
var helpers_default = { validateVariant, validateTitle, debounce, throttle, generateId, deepClone, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  debounce,
  deepClone,
  helpers_default as default,
  generateId,
  healthCheck,
  throttle,
  validateTitle,
  validateVariant
};
