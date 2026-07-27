import { createLogger } from "../logger.js";
import { VERSION, MODULE_ID, NOTIFIER_STATES, UPDATE_TYPES, DEFAULT_CONFIG } from "./constants.js";
import { compareVersions, getUpdateType, getCurrentVersion } from "./version.js";
import { createNotificationController } from "./notification.js";
import { checkViaEndpoint, checkViaServiceWorker, applyUpdate } from "./checker.js";
function createUpdateNotifier(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const _logger = createLogger(MODULE_ID);
  let _state = NOTIFIER_STATES.IDLE;
  let _currentVersion = null;
  let _latestVersion = null;
  let _updateInfo = null;
  let _checkInterval = null;
  let _listeners = /* @__PURE__ */ new Set();
  let _lastCheckTime = null;
  let _serviceWorkerRegistration = null;
  function _notifyListeners(event, data) {
    _listeners.forEach((listener) => {
      try {
        listener({ event, ...data, timestamp: Date.now() });
      } catch (e) {
        _logger.warn("Listener error:", e);
      }
    });
  }
  function _setState(newState) {
    const oldState = _state;
    _state = newState;
    _notifyListeners("stateChanged", { state: newState, previousState: oldState });
  }
  const _notification = createNotificationController(config, _notifyListeners);
  const manager = {
    async init() {
      _currentVersion = getCurrentVersion();
      _logger.info(`Update notifier initialized. Current version: ${_currentVersion || "unknown"}`);
      if (config.autoCheck) {
        await this.check();
        this.startAutoCheck();
      }
      if ("serviceWorker" in navigator) {
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          _logger.info("Service Worker updated");
          if (config.autoReload) {
            window.location.reload();
          }
        });
      }
      return this;
    },
    async check() {
      if (_state === NOTIFIER_STATES.CHECKING) {
        _logger.debug("Check already in progress");
        return null;
      }
      _setState(NOTIFIER_STATES.CHECKING);
      _lastCheckTime = Date.now();
      try {
        let updateInfo = await checkViaEndpoint(config.versionEndpoint, _logger);
        if (!updateInfo) {
          const swResult = await checkViaServiceWorker(_logger);
          if (swResult?.registration) {
            _serviceWorkerRegistration = swResult.registration;
          }
          if (swResult?.worker) {
            updateInfo = swResult;
          }
        }
        if (!updateInfo) {
          _setState(NOTIFIER_STATES.UP_TO_DATE);
          _logger.debug("No update info available");
          return null;
        }
        _latestVersion = updateInfo.version;
        _updateInfo = updateInfo;
        const comparison = compareVersions(_latestVersion, _currentVersion);
        if (comparison > 0) {
          _setState(NOTIFIER_STATES.UPDATE_AVAILABLE);
          _updateInfo.type = getUpdateType(_currentVersion, _latestVersion);
          _logger.info(`Update available: ${_currentVersion} -> ${_latestVersion} (${_updateInfo.type})`);
          _notifyListeners("updateAvailable", {
            currentVersion: _currentVersion,
            latestVersion: _latestVersion,
            updateInfo: _updateInfo
          });
          _notification.show(_latestVersion);
          return _updateInfo;
        } else {
          _setState(NOTIFIER_STATES.UP_TO_DATE);
          _logger.debug("Application is up to date");
          return null;
        }
      } catch (error) {
        _setState(NOTIFIER_STATES.ERROR);
        _logger.error("Update check failed:", error);
        _notifyListeners("error", { error: error.message });
        return null;
      }
    },
    startAutoCheck() {
      if (_checkInterval) return;
      _checkInterval = setInterval(() => {
        this.check();
      }, config.checkInterval);
      _logger.debug(`Auto-check started (interval: ${config.checkInterval}ms)`);
    },
    stopAutoCheck() {
      if (_checkInterval) {
        clearInterval(_checkInterval);
        _checkInterval = null;
        _logger.debug("Auto-check stopped");
      }
    },
    applyUpdate() {
      _notifyListeners("updateApplying", {});
      applyUpdate(_serviceWorkerRegistration, _logger);
    },
    dismissNotification() {
      _notification.hide();
    },
    getState() {
      return _state;
    },
    getCurrentVersion() {
      return _currentVersion;
    },
    getLatestVersion() {
      return _latestVersion;
    },
    getUpdateInfo() {
      return _updateInfo ? { ..._updateInfo } : null;
    },
    hasUpdate() {
      return _state === NOTIFIER_STATES.UPDATE_AVAILABLE;
    },
    getLastCheckTime() {
      return _lastCheckTime;
    },
    forceShowNotification(version = "test") {
      _latestVersion = version;
      _notification.show(version);
    },
    subscribe(listener) {
      if (typeof listener === "function") {
        _listeners.add(listener);
        return () => _listeners.delete(listener);
      }
      return () => {
      };
    },
    healthCheck() {
      return {
        status: _state === NOTIFIER_STATES.ERROR ? "DEGRADED" : "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        state: _state,
        currentVersion: _currentVersion,
        latestVersion: _latestVersion,
        hasUpdate: this.hasUpdate(),
        lastCheckTime: _lastCheckTime,
        autoCheckActive: !!_checkInterval
      };
    },
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        states: Object.values(NOTIFIER_STATES),
        updateTypes: Object.values(UPDATE_TYPES),
        config: {
          checkInterval: config.checkInterval,
          versionEndpoint: config.versionEndpoint,
          autoCheck: config.autoCheck,
          position: config.position
        }
      };
    },
    destroy() {
      this.stopAutoCheck();
      _notification.hide();
      _listeners.clear();
      _setState(NOTIFIER_STATES.IDLE);
    }
  };
  _notification.onApplyRequested = () => manager.applyUpdate();
  return manager;
}
export {
  createUpdateNotifier
};
