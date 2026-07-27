import {
  getEventBus,
  getToolbarEl,
  getContainer,
  setCurrentPanelId,
  addCleanup,
  snapshotActions,
  detectActionLoss
} from "../state.js";
import { _updateButtonStates } from "../ui/state-updater.js";
import { TOOLBAR_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.features-toolbar.events.listeners";
const REWIRE_CHECK_INTERVAL_MS = 1e4;
let _rewireIntervalId = null;
let _lastRewireEmit = 0;
const REWIRE_COOLDOWN_MS = 3e4;
let _rewireInProgress = false;
function resetRewireState() {
  if (_rewireIntervalId !== null) {
    clearInterval(_rewireIntervalId);
    _rewireIntervalId = null;
  }
  _lastRewireEmit = 0;
  _rewireInProgress = false;
}
function _setupEventListeners() {
  const eventBus = getEventBus();
  if (!eventBus) return;
  const navHandler = (data) => {
    setCurrentPanelId(data?.panelId || data?.to || null);
    _updateButtonStates();
  };
  eventBus.on?.("main.navigation.sync", navHandler);
  eventBus.on?.("nav.navigate.success", navHandler);
  eventBus.on?.("nav.navigate.path", navHandler);
  addCleanup(() => {
    eventBus.off?.("main.navigation.sync", navHandler);
    eventBus.off?.("nav.navigate.success", navHandler);
    eventBus.off?.("nav.navigate.path", navHandler);
  });
  const fullscreenHandler = () => {
    _updateButtonStates();
  };
  document.addEventListener("fullscreenchange", fullscreenHandler);
  addCleanup(() => {
    document.removeEventListener("fullscreenchange", fullscreenHandler);
  });
  const themeObserver = new MutationObserver(() => {
    _updateButtonStates();
  });
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class", "data-theme"] });
  addCleanup(() => {
    themeObserver.disconnect();
  });
  const onlineHandler = () => {
    _updateButtonStates();
  };
  const offlineHandler = () => {
    _updateButtonStates();
  };
  window.addEventListener("online", onlineHandler);
  window.addEventListener("offline", offlineHandler);
  addCleanup(() => {
    window.removeEventListener("online", onlineHandler);
    window.removeEventListener("offline", offlineHandler);
  });
  _setupToolbarGuard();
  _setupRewireMonitor();
}
function _setupRewireMonitor() {
  snapshotActions();
  _rewireIntervalId = setInterval(() => {
    const detection = detectActionLoss();
    if (detection.hadActions && detection.lost.length > 0) {
      const now = Date.now();
      if (now - _lastRewireEmit < REWIRE_COOLDOWN_MS) {
        snapshotActions();
        return;
      }
      if (_rewireInProgress) return;
      _lastRewireEmit = now;
      _rewireInProgress = true;
      if (typeof console !== "undefined" && console.debug) {
        console.debug("[features-toolbar] Re-wire detected: lost actions:", detection.lost.join(", "));
      }
      _attemptRewire(detection).finally(() => {
        _rewireInProgress = false;
        _updateButtonStates();
        snapshotActions();
      });
    } else {
      snapshotActions();
    }
  }, REWIRE_CHECK_INTERVAL_MS);
  addCleanup(() => {
    if (_rewireIntervalId !== null) {
      clearInterval(_rewireIntervalId);
      _rewireIntervalId = null;
    }
  });
}
function _attemptRewire(detection) {
  return import("../../toolbar-wiring.js").then((wiringModule) => {
    const wireFn = wiringModule.wireToolbar || wiringModule.default && wiringModule.default.wireToolbar;
    if (!wireFn) {
      throw new Error("wireToolbar not found in module");
    }
    let toolbarApi = null;
    try {
      const apiModule = window.__featuresToolbarApi__;
      if (apiModule && apiModule.registerAction) {
        toolbarApi = apiModule;
      }
    } catch (_e) {
    }
    if (!toolbarApi) {
      throw new Error("Toolbar API not available for rewire");
    }
    return wireFn(toolbarApi).then((result) => {
      if (typeof console !== "undefined" && console.debug) {
        console.debug("[features-toolbar] Re-wire success:", result.wired.length, "actions reconnected");
      }
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(TOOLBAR_EVENT_NAMES.REWIRED, {
          source: "features-toolbar",
          reason: "action-loss-recovery",
          lostActions: detection.lost,
          rewiredActions: result.wired,
          failedActions: result.failed,
          timestamp: Date.now()
        });
      }
    });
  }).catch((err) => {
    if (typeof console !== "undefined" && console.debug) {
      console.debug("[features-toolbar] Re-wire via wireToolbar failed, emitting fallback:", err.message);
    }
    const eventBus = getEventBus();
    if (eventBus && eventBus.emit) {
      const toolbarEl = getToolbarEl();
      const buttonCount = toolbarEl ? toolbarEl.querySelectorAll(".features-toolbar__btn").length : 0;
      eventBus.emit(TOOLBAR_EVENT_NAMES.INITIALIZED, {
        source: "features-toolbar",
        reason: "rewire-action-loss",
        lostActions: detection.lost,
        currentActions: detection.current,
        buttonCount,
        timestamp: Date.now()
      });
    }
  });
}
function _setupToolbarGuard() {
  const toolbarEl = getToolbarEl();
  const container = getContainer();
  if (!toolbarEl || !container) return;
  const header = container.querySelector(".dsd-container__header");
  if (!header) return;
  let _isRecovering = false;
  const guardObserver = new MutationObserver(() => {
    if (_isRecovering) return;
    if (!document.contains(toolbarEl)) {
      _isRecovering = true;
      try {
        const controls = header.querySelector(".dsd-container__controls");
        if (controls) {
          header.insertBefore(toolbarEl, controls);
        } else if (header.parentNode) {
          header.appendChild(toolbarEl);
        }
        _updateButtonStates();
        const eventBus = getEventBus();
        if (eventBus && eventBus.emit) {
          eventBus.emit(TOOLBAR_EVENT_NAMES.RECOVERED, {
            source: "features-toolbar",
            reason: "dom-removal-detected",
            timestamp: Date.now()
          });
        }
      } catch (e) {
        if (typeof console !== "undefined" && console.debug) {
          console.debug("[features-toolbar] Guard recovery failed:", e.message);
        }
      }
      setTimeout(() => {
        _isRecovering = false;
      }, 100);
    }
  });
  guardObserver.observe(header, { childList: true, subtree: false });
  let _containerRafId = null;
  const containerObserver = new MutationObserver(() => {
    if (_isRecovering) return;
    if (_containerRafId !== null) return;
    _containerRafId = requestAnimationFrame(() => {
      _containerRafId = null;
      if (_isRecovering) return;
      const currentHeader = container.querySelector(".dsd-container__header");
      if (currentHeader && !currentHeader.contains(toolbarEl)) {
        _isRecovering = true;
        try {
          const controls = currentHeader.querySelector(".dsd-container__controls");
          if (controls) {
            currentHeader.insertBefore(toolbarEl, controls);
          } else {
            currentHeader.appendChild(toolbarEl);
          }
          _updateButtonStates();
        } catch (e) {
          if (typeof console !== "undefined" && console.debug) {
            console.debug("[features-toolbar] Container guard recovery failed:", e.message);
          }
        }
        setTimeout(() => {
          _isRecovering = false;
        }, 100);
      }
    });
  });
  containerObserver.observe(container, { childList: true, subtree: false });
  addCleanup(() => {
    guardObserver.disconnect();
    containerObserver.disconnect();
    if (_containerRafId !== null) {
      cancelAnimationFrame(_containerRafId);
      _containerRafId = null;
    }
  });
}
export {
  MODULE_ID,
  VERSION,
  _setupEventListeners,
  resetRewireState
};
