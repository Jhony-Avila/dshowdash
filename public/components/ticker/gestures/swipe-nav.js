import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "ticker.gestures.swipe-nav";
const hasWindow = typeof window !== "undefined";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
function _log(level, ...args) {
  const logger = _getPort("logger");
  if (logger?.[level]) logger[level](`[${MODULE_ID}]`, ...args);
}
class SwipeNavigator {
  constructor(options = {}) {
    this.threshold = options.threshold || 50;
    this.velocityThreshold = options.velocityThreshold || 0.3;
    this.onSwipeLeft = options.onSwipeLeft || null;
    this.onSwipeRight = options.onSwipeRight || null;
    this.onSwipeUp = options.onSwipeUp || null;
    this.onSwipeDown = options.onSwipeDown || null;
    this._container = null;
    this._startX = 0;
    this._startY = 0;
    this._startTime = 0;
    this._tracking = false;
    this._enabled = true;
    this._metrics = { swipes: 0, left: 0, right: 0, up: 0, down: 0 };
    this._boundTouchStart = this._onTouchStart.bind(this);
    this._boundTouchMove = this._onTouchMove.bind(this);
    this._boundTouchEnd = this._onTouchEnd.bind(this);
  }
  init(container) {
    if (!container) return this;
    this._container = container;
    this._attachEvents();
    _log("debug", "SwipeNavigator initialized");
    return this;
  }
  _attachEvents() {
    this._container.addEventListener("touchstart", this._boundTouchStart, { passive: true });
    this._container.addEventListener("touchmove", this._boundTouchMove, { passive: true });
    this._container.addEventListener("touchend", this._boundTouchEnd, { passive: true });
  }
  _onTouchStart(e) {
    if (!this._enabled || e.touches.length !== 1) return;
    this._startX = e.touches[0].clientX;
    this._startY = e.touches[0].clientY;
    this._startTime = Date.now();
    this._tracking = true;
  }
  _onTouchMove(e) {
    if (!this._tracking) return;
  }
  _onTouchEnd(e) {
    if (!this._tracking) return;
    this._tracking = false;
    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - this._startX;
    const deltaY = touch.clientY - this._startY;
    const deltaTime = Date.now() - this._startTime;
    const velocityX = Math.abs(deltaX) / deltaTime;
    const velocityY = Math.abs(deltaY) / deltaTime;
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    if (absX < this.threshold && absY < this.threshold) return;
    if (velocityX < this.velocityThreshold && velocityY < this.velocityThreshold) return;
    this._metrics.swipes++;
    if (absX > absY) {
      if (deltaX > 0) {
        this._metrics.right++;
        if (this.onSwipeRight) this.onSwipeRight({ deltaX, deltaY, velocity: velocityX });
        _log("debug", "Swipe right detected");
      } else {
        this._metrics.left++;
        if (this.onSwipeLeft) this.onSwipeLeft({ deltaX, deltaY, velocity: velocityX });
        _log("debug", "Swipe left detected");
      }
    } else {
      if (deltaY > 0) {
        this._metrics.down++;
        if (this.onSwipeDown) this.onSwipeDown({ deltaX, deltaY, velocity: velocityY });
        _log("debug", "Swipe down detected");
      } else {
        this._metrics.up++;
        if (this.onSwipeUp) this.onSwipeUp({ deltaX, deltaY, velocity: velocityY });
        _log("debug", "Swipe up detected");
      }
    }
  }
  enable() {
    this._enabled = true;
  }
  disable() {
    this._enabled = false;
  }
  destroy() {
    if (this._container) {
      this._container.removeEventListener("touchstart", this._boundTouchStart);
      this._container.removeEventListener("touchmove", this._boundTouchMove);
      this._container.removeEventListener("touchend", this._boundTouchEnd);
    }
    this._container = null;
  }
  healthCheck() {
    const checks = { hasContainer: !!this._container, enabled: this._enabled, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed === 3 ? "HEALTHY" : "DEGRADED", score: `${passed}/3`, checks, metrics: { ...this._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, enabled: this._enabled, threshold: this.threshold, metrics: { ...this._metrics }, portsInitialized: Ports.isInitialized() };
  }
}
function getVersion() {
  return VERSION;
}
var swipe_nav_default = SwipeNavigator;
export {
  MODULE_ID,
  SwipeNavigator,
  VERSION,
  swipe_nav_default as default,
  getPorts,
  getVersion,
  injectPorts
};
