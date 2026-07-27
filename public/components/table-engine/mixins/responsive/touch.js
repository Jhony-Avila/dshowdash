const VERSION = "1.0.1-P18EC";
const MODULE_ID = "table-engine:touch";
class TouchHandler {
  constructor(options = {}) {
    this._element = null;
    this._startX = 0;
    this._startY = 0;
    this._currentX = 0;
    this._currentY = 0;
    this._threshold = options.threshold || 50;
    this._maxTime = options.maxTime || 300;
    this._startTime = 0;
    this._isSwiping = false;
    this._listeners = /* @__PURE__ */ new Map();
    this._swipeActions = options.swipeActions || { left: null, right: null };
    this._cssPrefix = options.cssPrefix || "tbl-";
  }
  init(element) {
    this._element = element;
    this._bindEvents();
    return this;
  }
  _bindEvents() {
    if (!this._element) return;
    this._element.addEventListener("touchstart", (e) => this._onTouchStart(e), { passive: true });
    this._element.addEventListener("touchmove", (e) => this._onTouchMove(e), { passive: false });
    this._element.addEventListener("touchend", (e) => this._onTouchEnd(e), { passive: true });
    this._element.addEventListener("touchcancel", () => this._reset(), { passive: true });
  }
  _onTouchStart(e) {
    if (e.touches.length !== 1) return;
    const touch = e.touches[0];
    this._startX = touch.clientX;
    this._startY = touch.clientY;
    this._currentX = touch.clientX;
    this._currentY = touch.clientY;
    this._startTime = Date.now();
    this._isSwiping = false;
    const row = e.target.closest(`.${this._cssPrefix}tr, .${this._cssPrefix}card`);
    if (row) this._activeRow = row;
  }
  _onTouchMove(e) {
    if (e.touches.length !== 1 || !this._activeRow) return;
    const touch = e.touches[0];
    this._currentX = touch.clientX;
    this._currentY = touch.clientY;
    const deltaX = this._currentX - this._startX;
    const deltaY = this._currentY - this._startY;
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
      this._isSwiping = true;
      e.preventDefault();
      this._updateSwipeUI(deltaX);
    }
  }
  _onTouchEnd(e) {
    if (!this._isSwiping || !this._activeRow) {
      this._reset();
      return;
    }
    const deltaX = this._currentX - this._startX;
    const elapsed = Date.now() - this._startTime;
    if (Math.abs(deltaX) >= this._threshold && elapsed <= this._maxTime) {
      const direction = deltaX > 0 ? "right" : "left";
      this._triggerSwipe(direction);
    }
    this._resetSwipeUI();
    this._reset();
  }
  _updateSwipeUI(deltaX) {
    if (!this._activeRow) return;
    const p = this._cssPrefix;
    const maxSwipe = 100;
    const clampedDelta = Math.max(-maxSwipe, Math.min(maxSwipe, deltaX));
    this._activeRow.style.transform = `translateX(${clampedDelta}px)`;
    this._activeRow.style.transition = "none";
    let actionsEl = this._activeRow.querySelector(`.${p}swipe-actions`);
    if (!actionsEl) {
      actionsEl = document.createElement("div");
      actionsEl.className = `${p}swipe-actions`;
      actionsEl.innerHTML = this._renderSwipeActions(deltaX > 0 ? "right" : "left");
      this._activeRow.appendChild(actionsEl);
    }
    actionsEl.classList.toggle(`${p}swipe-left`, deltaX < 0);
    actionsEl.classList.toggle(`${p}swipe-right`, deltaX > 0);
  }
  _renderSwipeActions(direction) {
    const p = this._cssPrefix;
    const actions = direction === "left" ? this._swipeActions.left : this._swipeActions.right;
    if (!actions) return "";
    return actions.map((a) => `<button class="${p}swipe-action ${a.danger ? `${p}swipe-danger` : ""}" data-action="${a.action}" style="background: ${a.color || (a.danger ? "#ef4444" : "#3b82f6")}">${a.icon || a.label}</button>`).join("");
  }
  _resetSwipeUI() {
    if (!this._activeRow) return;
    const p = this._cssPrefix;
    this._activeRow.style.transform = "";
    this._activeRow.style.transition = "transform 0.2s ease";
    const actionsEl = this._activeRow.querySelector(`.${p}swipe-actions`);
    if (actionsEl) setTimeout(() => actionsEl.remove(), 200);
  }
  _triggerSwipe(direction) {
    const rowId = this._activeRow?.dataset?.rowId;
    const actions = direction === "left" ? this._swipeActions.left : this._swipeActions.right;
    if (actions && actions.length > 0) {
      this._emit("swipe", { direction, rowId, action: actions[0].action });
    }
  }
  _reset() {
    this._startX = 0;
    this._startY = 0;
    this._currentX = 0;
    this._currentY = 0;
    this._isSwiping = false;
    this._activeRow = null;
  }
  setSwipeActions(left, right) {
    this._swipeActions.left = left;
    this._swipeActions.right = right;
  }
  on(event, callback) {
    if (!this._listeners.has(event)) this._listeners.set(event, /* @__PURE__ */ new Set());
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }
  _emit(event, data) {
    this._listeners.get(event)?.forEach((cb) => cb(data));
  }
  destroy() {
    this._listeners.clear();
    this._element = null;
  }
  info() {
    return { moduleId: MODULE_ID, version: VERSION, threshold: this._threshold };
  }
  healthCheck() {
    return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
  }
}
function createTouchHandler(options = {}) {
  return new TouchHandler(options);
}
const DEFAULT_SWIPE_ACTIONS = { left: [{ action: "delete", icon: "\u{1F5D1}", label: "Excluir", danger: true, color: "#ef4444" }], right: [{ action: "edit", icon: "\u270F\uFE0F", label: "Editar", color: "#3b82f6" }, { action: "view", icon: "\u{1F441}", label: "Ver", color: "#22c55e" }] };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var touch_default = { createTouchHandler, DEFAULT_SWIPE_ACTIONS, info, healthCheck, VERSION, MODULE_ID };
export {
  DEFAULT_SWIPE_ACTIONS,
  MODULE_ID,
  VERSION,
  createTouchHandler,
  touch_default as default,
  healthCheck,
  info
};
