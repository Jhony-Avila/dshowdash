import { Icons } from "./icons.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-toast";
let _container = null;
const _toasts = [];
let _soundEnabled = false;
const SOUNDS = { success: "/assets/sounds/success.mp3", error: "/assets/sounds/error.mp3", warning: "/assets/sounds/warning.mp3" };
function _ensureContainer() {
  if (_container) return _container;
  _container = document.createElement("div");
  _container.className = "uarps-toast-container";
  document.body.appendChild(_container);
  return _container;
}
function _playSound(type) {
  if (!_soundEnabled || !SOUNDS[type]) return;
  try {
    const audio = new Audio(SOUNDS[type]);
    audio.volume = 0.3;
    audio.play().catch(() => {
    });
  } catch (e) {
  }
}
function _vibrate(pattern) {
  if (!pattern) pattern = [50];
  try {
    if (navigator.vibrate) navigator.vibrate(pattern);
  } catch (e) {
  }
}
function show(options) {
  if (!options) options = {};
  const type = String(options.type || "info");
  const title = String(options.title || "");
  const message = String(options.message || "");
  const duration = options.duration !== void 0 ? Number(options.duration) : 4e3;
  const actions = options.actions || [];
  const closable = options.closable !== void 0 ? options.closable : true;
  const sound = options.sound !== void 0 ? options.sound : true;
  const vibrate = options.vibrate !== void 0 ? options.vibrate : true;
  _ensureContainer();
  const id = `toast-${Date.now()}`;
  const toast = document.createElement("div");
  toast.className = `uarps-toast uarps-toast--${type}`;
  toast.id = id;
  toast.style.setProperty("--toast-duration", `${duration}ms`);
  const iconMap = { success: "checkCircle", error: "xCircle", warning: "alertTriangle", info: "info" };
  const iconsRecord = Icons;
  let actionsHtml = "";
  if (actions.length) {
    actionsHtml = '<div class="uarps-toast__actions">';
    for (let i = 0; i < actions.length; i++) {
      const a = actions[i];
      actionsHtml += `<button class="uarps-toast__action ${a.secondary ? "uarps-toast__action--secondary" : ""}" data-action="${a.id}">${a.label}</button>`;
    }
    actionsHtml += "</div>";
  }
  toast.innerHTML = `<span class="uarps-toast__icon">${iconsRecord[iconMap[String(type)]] || iconsRecord.info}</span><div class="uarps-toast__content">${title ? `<div class="uarps-toast__title">${title}</div>` : ""}${message ? `<div class="uarps-toast__message">${message}</div>` : ""}${actionsHtml}</div>${closable ? `<button class="uarps-toast__close">${iconsRecord.x}</button>` : ""}<div class="uarps-toast__progress"></div>`;
  const closeBtn = toast.querySelector(".uarps-toast__close");
  if (closeBtn) closeBtn.addEventListener("click", () => {
    dismiss(id);
  });
  const actionBtns = toast.querySelectorAll("[data-action]");
  for (let j = 0; j < actionBtns.length; j++) {
    ((btn) => {
      btn.addEventListener("click", () => {
        let action = null;
        for (let k = 0; k < actions.length; k++) {
          if (actions[k].id === btn.dataset.action) {
            action = actions[k];
            break;
          }
        }
        if (action && action.onClick) action.onClick();
        if (!action || action.dismiss !== false) dismiss(id);
      });
    })(actionBtns[j]);
  }
  _container.appendChild(toast);
  _toasts.push({ id, toast, timeout: null });
  if (sound) _playSound(type);
  if (vibrate && type === "error") _vibrate([100, 50, 100]);
  if (duration > 0) {
    const timeout = setTimeout(() => {
      dismiss(id);
    }, duration);
    let t = null;
    for (let m = 0; m < _toasts.length; m++) {
      if (_toasts[m].id === id) {
        t = _toasts[m];
        break;
      }
    }
    if (t) t.timeout = timeout;
  }
  return id;
}
function dismiss(id) {
  let index = -1;
  for (let i = 0; i < _toasts.length; i++) {
    if (_toasts[i].id === id) {
      index = i;
      break;
    }
  }
  if (index === -1) return;
  const item = _toasts[index];
  if (item.timeout) clearTimeout(item.timeout);
  item.toast.classList.add("uarps-toast--exiting");
  setTimeout(() => {
    item.toast.remove();
    _toasts.splice(index, 1);
  }, 300);
}
function dismissAll() {
  const ids = [];
  for (let i = 0; i < _toasts.length; i++) ids.push(_toasts[i].id);
  for (let j = 0; j < ids.length; j++) dismiss(ids[j]);
}
function setSoundEnabled(enabled) {
  _soundEnabled = !!enabled;
}
function success(title, message, options) {
  if (!options) options = {};
  options.type = "success";
  options.title = title;
  options.message = message;
  return show(options);
}
function error(title, message, options) {
  if (!options) options = {};
  options.type = "error";
  options.title = title;
  options.message = message;
  return show(options);
}
function warning(title, message, options) {
  if (!options) options = {};
  options.type = "warning";
  options.title = title;
  options.message = message;
  return show(options);
}
function toastInfo(title, message, options) {
  if (!options) options = {};
  options.type = "info";
  options.title = title;
  options.message = message;
  return show(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { containerReady: !!_container || true, toastCount: _toasts.length } };
}
const Toast = { show, dismiss, dismissAll, success, error, warning, info: toastInfo, setSoundEnabled, VERSION, MODULE_ID, healthCheck };
var toast_default = Toast;
export {
  MODULE_ID,
  Toast,
  VERSION,
  toast_default as default,
  dismiss,
  dismissAll,
  error,
  healthCheck,
  info,
  setSoundEnabled,
  show,
  success,
  toastInfo,
  warning
};
