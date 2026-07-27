import { config, errors, errorHandlers, setErrors, setErrorHandlers } from "./state.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.error-boundary.operations";
function clearError(errorId) {
  const index = errors.findIndex((e) => e.id === errorId);
  if (index === -1) return { ok: false, error: "not-found" };
  errors.splice(index, 1);
  return { ok: true };
}
function clearErrors() {
  const count = errors.length;
  setErrors([]);
  return { ok: true, cleared: count };
}
function cleanExpired() {
  const now = Date.now();
  const before = errors.length;
  const filtered = errors.filter((e) => now - e.timestamp < config.errorTTL);
  setErrors(filtered);
  return { ok: true, removed: before - filtered.length };
}
function onError(handler) {
  if (typeof handler !== "function") {
    throw new Error("Handler must be a function");
  }
  errorHandlers.push(handler);
  return () => {
    const index = errorHandlers.indexOf(handler);
    if (index > -1) {
      errorHandlers.splice(index, 1);
    }
  };
}
function clearHandlers() {
  setErrorHandlers([]);
  return { ok: true };
}
export {
  MODULE_ID,
  VERSION,
  cleanExpired,
  clearError,
  clearErrors,
  clearHandlers,
  onError
};
