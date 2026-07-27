import { HOOK_TYPES } from "./constants.js";
import { hooks, isValidHookType } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.lifecycle-hooks.registration";
function on(type, handler, options = {}) {
  if (!isValidHookType(type)) {
    throw new Error(`Invalid hook type: ${type}. Valid types: ${HOOK_TYPES.join(", ")}`);
  }
  if (typeof handler !== "function") {
    throw new Error("Hook handler must be a function");
  }
  const hookEntry = {
    id: `hook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    handler,
    priority: options.priority || 0,
    once: options.once || false,
    name: options.name || null,
    async: options.async !== false
  };
  hooks[type].push(hookEntry);
  hooks[type].sort((a, b) => b.priority - a.priority);
  return () => off(type, hookEntry.id);
}
function once(type, handler, options = {}) {
  return on(type, handler, { ...options, once: true });
}
function off(type, handlerOrId) {
  if (!isValidHookType(type)) return false;
  const initialLength = hooks[type].length;
  if (typeof handlerOrId === "string") {
    hooks[type] = hooks[type].filter((h) => h.id !== handlerOrId);
  } else if (typeof handlerOrId === "function") {
    hooks[type] = hooks[type].filter((h) => h.handler !== handlerOrId);
  }
  return hooks[type].length < initialLength;
}
function offAll(type) {
  if (type) {
    if (!isValidHookType(type)) return false;
    hooks[type] = [];
    return true;
  }
  for (const t of HOOK_TYPES) {
    hooks[t] = [];
  }
  return true;
}
export {
  MODULE_ID,
  VERSION,
  off,
  offAll,
  on,
  once
};
