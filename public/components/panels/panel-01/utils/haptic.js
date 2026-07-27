const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/utils/haptic";
class HapticManager {
  constructor(options = {}) {
    this._enabled = options.enabled !== false;
    this._supported = "vibrate" in navigator;
  }
  isSupported() {
    return this._supported;
  }
  isEnabled() {
    return this._enabled && this._supported;
  }
  enable() {
    this._enabled = true;
  }
  disable() {
    this._enabled = false;
  }
  vibrate(pattern) {
    if (!this.isEnabled()) return false;
    try {
      navigator.vibrate(pattern);
      return true;
    } catch {
      return false;
    }
  }
  light() {
    return this.vibrate(10);
  }
  medium() {
    return this.vibrate(25);
  }
  heavy() {
    return this.vibrate(50);
  }
  success() {
    return this.vibrate([10, 50, 10]);
  }
  warning() {
    return this.vibrate([30, 30, 30]);
  }
  error() {
    return this.vibrate([50, 100, 50]);
  }
  click() {
    return this.vibrate(5);
  }
  select() {
    return this.vibrate(15);
  }
  notification() {
    return this.vibrate([20, 100, 20, 100, 20]);
  }
  forAction(action) {
    const patterns = {
      click: () => this.click(),
      select: () => this.select(),
      success: () => this.success(),
      error: () => this.error(),
      warning: () => this.warning(),
      save: () => this.success(),
      delete: () => this.heavy(),
      refresh: () => this.light(),
      toggle: () => this.click()
    };
    const fn = patterns[action];
    if (fn) fn();
  }
  stop() {
    if (this._supported) navigator.vibrate(0);
  }
}
let instance = null;
function getHapticManager() {
  if (!instance) instance = new HapticManager();
  return instance;
}
function haptic(action) {
  getHapticManager().forAction(action);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var haptic_default = { HapticManager, getHapticManager, haptic };
export {
  HapticManager,
  MODULE_ID,
  VERSION,
  haptic_default as default,
  getHapticManager,
  haptic,
  healthCheck,
  info
};
