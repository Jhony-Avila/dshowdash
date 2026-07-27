import { NOTIFICATION_TYPES } from "./constants.js";
import { show, dismiss } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.notification-center.convenience";
function info(message, options) {
  return show(Object.assign({ type: NOTIFICATION_TYPES.INFO, message }, options || {}));
}
function success(message, options) {
  return show(Object.assign({ type: NOTIFICATION_TYPES.SUCCESS, message }, options || {}));
}
function warning(message, options) {
  return show(Object.assign({ type: NOTIFICATION_TYPES.WARNING, message }, options || {}));
}
function error(message, options) {
  return show(Object.assign({ type: NOTIFICATION_TYPES.ERROR, message, duration: 0 }, options || {}));
}
function loading(message, options) {
  return show(Object.assign({
    type: NOTIFICATION_TYPES.LOADING,
    message,
    duration: 0,
    dismissible: false
  }, options || {}));
}
function promise(promiseOrFn, messages) {
  messages = messages || {};
  const loadingId = loading(messages.loading || "Carregando...");
  const thePromise = typeof promiseOrFn === "function" ? promiseOrFn() : promiseOrFn;
  return thePromise.then((result) => {
    dismiss(loadingId);
    if (messages.success) {
      success(typeof messages.success === "function" ? messages.success(result) : messages.success);
    }
    return result;
  }).catch((err) => {
    dismiss(loadingId);
    if (messages.error) {
      error(typeof messages.error === "function" ? messages.error(err) : messages.error);
    }
    throw err;
  });
}
export {
  MODULE_ID,
  VERSION,
  error,
  info,
  loading,
  promise,
  success,
  warning
};
