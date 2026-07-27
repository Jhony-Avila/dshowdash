const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "nav-rail.core.recovery-manager";
import { NavRailTracker } from "../telemetry/tracker.js";
import { findRegion, REGION_IDS } from "/platform/shell/layout-regions.js";
let _log = () => {
};
function setLogger(logFn) {
  _log = logFn;
}
const RecoveryManager = {
  _recoveryAttempts: 0,
  _maxRecoveryAttempts: 3,
  _recoveryDelay: 5e3,
  _isRecovering: false,
  _lastRecoveryTime: 0,
  async attemptRecovery(instance) {
    if (this._isRecovering) {
      _log("debug", "Recovery already in progress");
      return false;
    }
    if (this._recoveryAttempts >= this._maxRecoveryAttempts) {
      const timeSinceLastRecovery = Date.now() - this._lastRecoveryTime;
      if (timeSinceLastRecovery < 6e4) {
        _log("error", "Max recovery attempts reached, waiting cooldown");
        return false;
      }
      this._recoveryAttempts = 0;
    }
    this._isRecovering = true;
    this._recoveryAttempts++;
    this._lastRecoveryTime = Date.now();
    _log("info", `Starting recovery attempt ${this._recoveryAttempts}/${this._maxRecoveryAttempts}`);
    NavRailTracker.track("recovery:start", { attempt: this._recoveryAttempts });
    try {
      await instance.destroy();
      await new Promise((resolve) => setTimeout(resolve, this._recoveryDelay));
      const root = findRegion(REGION_IDS.NAV_RAIL);
      if (root) {
        await instance.init(root);
        _log("info", "Recovery successful");
        NavRailTracker.track("recovery:success", { attempt: this._recoveryAttempts });
        this._recoveryAttempts = 0;
        this._isRecovering = false;
        return true;
      }
      throw new Error("Root element not found for recovery");
    } catch (error) {
      _log("error", "Recovery failed", { error: error.message, attempt: this._recoveryAttempts });
      NavRailTracker.track("recovery:failed", { attempt: this._recoveryAttempts, error: error.message });
      this._isRecovering = false;
      return false;
    }
  },
  getStatus() {
    return {
      isRecovering: this._isRecovering,
      attempts: this._recoveryAttempts,
      maxAttempts: this._maxRecoveryAttempts,
      lastRecoveryTime: this._lastRecoveryTime
    };
  },
  reset() {
    this._recoveryAttempts = 0;
    this._isRecovering = false;
    this._lastRecoveryTime = 0;
  }
};
var recovery_manager_default = RecoveryManager;
export {
  MODULE_ID,
  RecoveryManager,
  VERSION,
  recovery_manager_default as default,
  setLogger
};
