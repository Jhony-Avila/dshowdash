import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE6";
const MODULE_ID = "container-main:notification-manager";
const NOTIFICATION_TYPES = Object.freeze({
  INFO: "info",
  SUCCESS: "success",
  WARNING: "warning",
  ERROR: "error",
  LOADING: "loading"
});
const POSITIONS = Object.freeze({
  TOP_LEFT: "top-left",
  TOP_CENTER: "top-center",
  TOP_RIGHT: "top-right",
  BOTTOM_LEFT: "bottom-left",
  BOTTOM_CENTER: "bottom-center",
  BOTTOM_RIGHT: "bottom-right"
});
function createNotificationManager(options = {}) {
  const {
    position = POSITIONS.TOP_RIGHT,
    maxVisible = 5,
    defaultDuration = 5e3,
    pauseOnHover = true,
    stackDirection = "down",
    containerClass = "cm-notifications",
    zIndex = 9999,
    animation = "slide",
    onShow = null,
    onHide = null,
    onClick = null
  } = options;
  const _logger = createLogger(MODULE_ID);
  let _container = null;
  let _notifications = /* @__PURE__ */ new Map();
  let _queue = [];
  let _counter = 0;
  let _metrics = { shown: 0, clicked: 0, dismissed: 0, queued: 0 };
  const STYLES = `
    .cm-notifications { position: fixed; z-index: ${zIndex}; display: flex; flex-direction: column; gap: 8px; padding: 16px; pointer-events: none; max-width: 400px; }
    .cm-notifications.top-left { top: 0; left: 0; }
    .cm-notifications.top-center { top: 0; left: 50%; transform: translateX(-50%); }
    .cm-notifications.top-right { top: 0; right: 0; }
    .cm-notifications.bottom-left { bottom: 0; left: 0; }
    .cm-notifications.bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); }
    .cm-notifications.bottom-right { bottom: 0; right: 0; }
    .cm-notification { display: flex; align-items: flex-start; gap: 12px; padding: 12px 16px; border-radius: 8px; background: #1a1a2e; color: #fff; box-shadow: 0 4px 12px rgba(0,0,0,0.3); pointer-events: auto; cursor: pointer; min-width: 280px; max-width: 100%; opacity: 0; transform: translateX(100%); transition: all 0.3s ease; }
    .cm-notification.visible { opacity: 1; transform: translateX(0); }
    .cm-notification.removing { opacity: 0; transform: translateX(100%); }
    .cm-notification.info { border-left: 4px solid #3b82f6; }
    .cm-notification.success { border-left: 4px solid #22c55e; }
    .cm-notification.warning { border-left: 4px solid #f59e0b; }
    .cm-notification.error { border-left: 4px solid #ef4444; }
    .cm-notification.loading { border-left: 4px solid #8b5cf6; }
    .cm-notification-icon { font-size: 20px; flex-shrink: 0; }
    .cm-notification-content { flex: 1; min-width: 0; }
    .cm-notification-title { font-weight: 600; font-size: 14px; margin-bottom: 2px; }
    .cm-notification-message { font-size: 13px; opacity: 0.9; word-wrap: break-word; }
    .cm-notification-close { background: none; border: none; color: #fff; opacity: 0.6; cursor: pointer; padding: 0; font-size: 18px; line-height: 1; }
    .cm-notification-close:hover { opacity: 1; }
    .cm-notification-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: rgba(255,255,255,0.3); border-radius: 0 0 0 8px; transition: width linear; }
    .cm-notification-actions { display: flex; gap: 8px; margin-top: 8px; }
    .cm-notification-action { background: rgba(255,255,255,0.2); border: none; color: #fff; padding: 4px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; }
    .cm-notification-action:hover { background: rgba(255,255,255,0.3); }
    @keyframes cm-spin { to { transform: rotate(360deg); } }
    .cm-notification.loading .cm-notification-icon { animation: cm-spin 1s linear infinite; }
  `;
  const ICONS = {
    info: "\u2139\uFE0F",
    success: "\u2705",
    warning: "\u26A0\uFE0F",
    error: "\u274C",
    loading: "\u23F3"
  };
  function _createContainer() {
    if (_container) return;
    if (!document.getElementById("cm-notification-styles")) {
      const style = document.createElement("style");
      style.id = "cm-notification-styles";
      style.textContent = STYLES;
      document.head.appendChild(style);
    }
    _container = document.createElement("div");
    _container.className = `${containerClass} ${position}`;
    document.body.appendChild(_container);
  }
  function _createElement(notification) {
    const el = document.createElement("div");
    el.className = `cm-notification ${notification.type}`;
    el.dataset.id = notification.id;
    let actionsHtml = "";
    if (notification.actions?.length > 0) {
      actionsHtml = `<div class="cm-notification-actions">${notification.actions.map((a, i) => `<button class="cm-notification-action" data-action="${i}">${a.label}</button>`).join("")}</div>`;
    }
    el.innerHTML = `
      <span class="cm-notification-icon">${notification.icon || ICONS[notification.type]}</span>
      <div class="cm-notification-content">
        ${notification.title ? `<div class="cm-notification-title">${notification.title}</div>` : ""}
        <div class="cm-notification-message">${notification.message}</div>
        ${actionsHtml}
      </div>
      ${notification.closable !== false ? '<button class="cm-notification-close">\xD7</button>' : ""}
      ${notification.duration > 0 ? '<div class="cm-notification-progress"></div>' : ""}
    `;
    el.addEventListener("click", (e) => {
      if (e.target.classList.contains("cm-notification-close")) {
        _hide(notification.id);
        return;
      }
      if (e.target.classList.contains("cm-notification-action")) {
        const actionIndex = parseInt(e.target.dataset.action);
        notification.actions?.[actionIndex]?.onClick?.();
        if (notification.actions?.[actionIndex]?.closeOnClick !== false) {
          _hide(notification.id);
        }
        return;
      }
      _metrics.clicked++;
      onClick?.(notification);
      notification.onClick?.();
    });
    if (pauseOnHover && notification.duration > 0) {
      el.addEventListener("mouseenter", () => _pauseTimer(notification.id));
      el.addEventListener("mouseleave", () => _resumeTimer(notification.id));
    }
    return el;
  }
  function _show(notification) {
    _createContainer();
    const visibleCount = _notifications.size;
    if (visibleCount >= maxVisible) {
      _queue.push(notification);
      _metrics.queued++;
      return notification.id;
    }
    const el = _createElement(notification);
    notification.element = el;
    notification.createdAt = Date.now();
    if (stackDirection === "up") {
      _container.insertBefore(el, _container.firstChild);
    } else {
      _container.appendChild(el);
    }
    _notifications.set(notification.id, notification);
    _metrics.shown++;
    requestAnimationFrame(() => {
      el.classList.add("visible");
    });
    if (notification.duration > 0) {
      _startTimer(notification);
    }
    onShow?.(notification);
    _logger.debug(`Notification shown: ${notification.id}`);
    return notification.id;
  }
  function _hide(id) {
    const notification = _notifications.get(id);
    if (!notification) return;
    _clearTimer(notification);
    const el = notification.element;
    el.classList.remove("visible");
    el.classList.add("removing");
    setTimeout(() => {
      el.remove();
      _notifications.delete(id);
      _metrics.dismissed++;
      onHide?.(notification);
      _processQueue();
    }, 300);
  }
  function _startTimer(notification) {
    const progress = notification.element?.querySelector(".cm-notification-progress");
    if (progress) {
      progress.style.width = "100%";
      progress.style.transitionDuration = `${notification.duration}ms`;
      requestAnimationFrame(() => {
        progress.style.width = "0%";
      });
    }
    notification.timerId = setTimeout(() => {
      _hide(notification.id);
    }, notification.duration);
    notification.timerStart = Date.now();
    notification.timerRemaining = notification.duration;
  }
  function _pauseTimer(id) {
    const notification = _notifications.get(id);
    if (!notification || !notification.timerId) return;
    clearTimeout(notification.timerId);
    notification.timerRemaining -= Date.now() - notification.timerStart;
    const progress = notification.element?.querySelector(".cm-notification-progress");
    if (progress) {
      const computed = getComputedStyle(progress);
      progress.style.transitionDuration = "0s";
      progress.style.width = computed.width;
    }
  }
  function _resumeTimer(id) {
    const notification = _notifications.get(id);
    if (!notification || notification.timerRemaining <= 0) return;
    const progress = notification.element?.querySelector(".cm-notification-progress");
    if (progress) {
      progress.style.transitionDuration = `${notification.timerRemaining}ms`;
      requestAnimationFrame(() => {
        progress.style.width = "0%";
      });
    }
    notification.timerId = setTimeout(() => {
      _hide(notification.id);
    }, notification.timerRemaining);
    notification.timerStart = Date.now();
  }
  function _clearTimer(notification) {
    if (notification.timerId) {
      clearTimeout(notification.timerId);
      notification.timerId = null;
    }
  }
  function _processQueue() {
    if (_queue.length === 0) return;
    if (_notifications.size >= maxVisible) return;
    const next = _queue.shift();
    _show(next);
  }
  const manager = {
    // Mostra notificação
    show(options2) {
      const notification = {
        id: `notif-${++_counter}`,
        type: options2.type || NOTIFICATION_TYPES.INFO,
        title: options2.title || null,
        message: options2.message || "",
        duration: options2.duration ?? defaultDuration,
        icon: options2.icon || null,
        closable: options2.closable !== false,
        actions: options2.actions || [],
        onClick: options2.onClick || null,
        data: options2.data || null
      };
      return _show(notification);
    },
    // Shortcuts
    info(message, options2 = {}) {
      return this.show({ ...options2, type: NOTIFICATION_TYPES.INFO, message });
    },
    success(message, options2 = {}) {
      return this.show({ ...options2, type: NOTIFICATION_TYPES.SUCCESS, message });
    },
    warning(message, options2 = {}) {
      return this.show({ ...options2, type: NOTIFICATION_TYPES.WARNING, message });
    },
    error(message, options2 = {}) {
      return this.show({ ...options2, type: NOTIFICATION_TYPES.ERROR, message, duration: options2.duration ?? 0 });
    },
    loading(message, options2 = {}) {
      return this.show({ ...options2, type: NOTIFICATION_TYPES.LOADING, message, duration: 0, closable: false });
    },
    // Atualiza notificação existente
    update(id, options2) {
      const notification = _notifications.get(id);
      if (!notification) return false;
      if (options2.type) {
        notification.type = options2.type;
        notification.element.className = `cm-notification ${options2.type} visible`;
      }
      if (options2.title !== void 0) {
        const titleEl = notification.element.querySelector(".cm-notification-title");
        if (titleEl) titleEl.textContent = options2.title;
      }
      if (options2.message !== void 0) {
        notification.element.querySelector(".cm-notification-message").textContent = options2.message;
      }
      if (options2.icon) {
        notification.element.querySelector(".cm-notification-icon").textContent = options2.icon;
      }
      return true;
    },
    // Esconde
    hide(id) {
      _hide(id);
    },
    // Esconde todas
    hideAll() {
      for (const id of _notifications.keys()) {
        _hide(id);
      }
      _queue = [];
    },
    // Promise helper
    async promise(promise, options2 = {}) {
      const id = this.loading(options2.loading || "Loading...");
      try {
        const result = await promise;
        this.update(id, {
          type: NOTIFICATION_TYPES.SUCCESS,
          message: options2.success || "Success!",
          icon: ICONS.success
        });
        setTimeout(() => this.hide(id), options2.successDuration ?? 3e3);
        return result;
      } catch (error) {
        this.update(id, {
          type: NOTIFICATION_TYPES.ERROR,
          message: options2.error || error.message || "Error!",
          icon: ICONS.error
        });
        if (options2.errorDuration !== 0) {
          setTimeout(() => this.hide(id), options2.errorDuration ?? 5e3);
        }
        throw error;
      }
    },
    // Getters
    getNotification(id) {
      return _notifications.get(id);
    },
    getVisible() {
      return Array.from(_notifications.values());
    },
    getQueueLength() {
      return _queue.length;
    },
    getMetrics() {
      return { ..._metrics, visible: _notifications.size, queued: _queue.length };
    },
    resetMetrics() {
      _metrics = { shown: 0, clicked: 0, dismissed: 0, queued: 0 };
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        visible: _notifications.size,
        queued: _queue.length,
        metrics: _metrics
      };
    },
    // Info
    getInfo() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        position,
        maxVisible,
        defaultDuration,
        types: Object.keys(NOTIFICATION_TYPES),
        positions: Object.keys(POSITIONS)
      };
    },
    // Destroy
    destroy() {
      this.hideAll();
      if (_container) {
        _container.remove();
        _container = null;
      }
      const styles = document.getElementById("cm-notification-styles");
      if (styles) styles.remove();
    }
  };
  return manager;
}
let _instance = null;
function getNotificationManager(options = {}) {
  if (!_instance) {
    _instance = createNotificationManager(options);
  }
  return _instance;
}
function resetNotificationManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function notify(message, options = {}) {
  return getNotificationManager().show({ message, ...options });
}
function notifySuccess(message, options = {}) {
  return getNotificationManager().success(message, options);
}
function notifyError(message, options = {}) {
  return getNotificationManager().error(message, options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, types: Object.keys(NOTIFICATION_TYPES), positions: Object.keys(POSITIONS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var notification_manager_default = {
  VERSION,
  MODULE_ID,
  NOTIFICATION_TYPES,
  POSITIONS,
  createNotificationManager,
  getNotificationManager,
  resetNotificationManager,
  notify,
  notifySuccess,
  notifyError,
  info,
  healthCheck
};
export {
  MODULE_ID,
  NOTIFICATION_TYPES,
  POSITIONS,
  VERSION,
  createNotificationManager,
  notification_manager_default as default,
  getNotificationManager,
  healthCheck,
  info,
  notify,
  notifyError,
  notifySuccess,
  resetNotificationManager
};
