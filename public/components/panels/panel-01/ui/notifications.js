import * as Toast from "./toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/notifications";
class NotificationsManager {
  constructor() {
    this._queue = [];
    this._processing = false;
    this._maxConcurrent = 3;
    this._active = 0;
  }
  success(message, options = {}) {
    return this._enqueue("success", message, options);
  }
  error(message, options = {}) {
    return this._enqueue("error", message, { duration: 6e3, ...options });
  }
  warning(message, options = {}) {
    return this._enqueue("warning", message, options);
  }
  info(message, options = {}) {
    return this._enqueue("info", message, options);
  }
  loading(message = "Carregando...") {
    return Toast.show(message, "info", 0);
  }
  _enqueue(type, message, options = {}) {
    if (this._active < this._maxConcurrent) {
      return this._show(type, message, options);
    }
    return new Promise((resolve) => {
      this._queue.push({ type, message, options, resolve });
    });
  }
  _show(type, message, options) {
    this._active++;
    const duration = options.duration || 4e3;
    const toast = Toast[type](message, duration);
    setTimeout(() => {
      this._active--;
      this._processQueue();
    }, duration);
    return toast;
  }
  _processQueue() {
    if (this._queue.length === 0 || this._active >= this._maxConcurrent) return;
    const { type, message, options, resolve } = this._queue.shift();
    const result = this._show(type, message, options);
    resolve(result);
  }
  clearAll() {
    document.querySelectorAll(".p01-toast").forEach((t) => t.remove());
    this._queue = [];
    this._active = 0;
  }
}
const notifications = new NotificationsManager();
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var notifications_default = notifications;
export {
  MODULE_ID,
  VERSION,
  notifications_default as default,
  healthCheck,
  info,
  notifications
};
