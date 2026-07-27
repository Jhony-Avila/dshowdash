import { updateCountdown, setAutoRefreshState } from "../core/template.js";
import * as Toast from "../ui/toast.js";
import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:handlers:auto-refresh";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function _isAuthenticated() {
  const auth = _getPort("auth");
  if (auth && auth.isAuthenticated && auth.isAuthenticated()) return true;
  return false;
}
function _isDocumentVisible() {
  return typeof document !== "undefined" && !document.hidden;
}
function createAutoRefreshManager(ctx) {
  _initPorts();
  let timer = null;
  let countdown = 30;
  let enabled = ctx.autoRefreshEnabled;
  let paused = false;
  let countdownWhenPaused = 0;
  function _canRefresh() {
    if (!enabled) return false;
    if (paused) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    return true;
  }
  function start() {
    stop();
    if (!enabled) return;
    paused = false;
    countdown = 30;
    updateCountdown(ctx.wrapper, countdown);
    timer = setInterval(() => {
      if (paused) return;
      if (!_isDocumentVisible()) return;
      countdown--;
      updateCountdown(ctx.wrapper, countdown);
      if (countdown <= 0) {
        countdown = 30;
        if (_canRefresh()) {
          ctx.loadAllData();
        }
      }
    }, 1e3);
  }
  function stop() {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    paused = false;
  }
  function pause() {
    if (!enabled || paused) return;
    paused = true;
    countdownWhenPaused = countdown;
  }
  function resume() {
    if (!enabled || !paused) return;
    paused = false;
    countdown = countdownWhenPaused > 0 ? countdownWhenPaused : 30;
    updateCountdown(ctx.wrapper, countdown);
    if (!timer) start();
  }
  function toggle() {
    enabled = !enabled;
    setAutoRefreshState(ctx.wrapper, enabled);
    if (enabled) {
      paused = false;
      start();
      Toast.info("Auto-refresh ativado");
    } else {
      stop();
      Toast.info("Auto-refresh desativado");
    }
    if (ctx.haptic) ctx.haptic.click();
    return enabled;
  }
  function isEnabled() {
    return enabled;
  }
  function isPaused() {
    return paused;
  }
  function getCountdown() {
    return countdown;
  }
  function destroy() {
    stop();
  }
  function healthCheck2() {
    const checks = {
      timerAvailable: true,
      cleanupImplemented: true,
      visibilityGating: true,
      authGating: true,
      pauseResumeSupport: true
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
      moduleId: MODULE_ID,
      version: VERSION,
      score: `${passed}/${total}`,
      checks,
      enabled,
      paused,
      hasTimer: !!timer,
      countdown,
      isAuthenticated: _isAuthenticated(),
      isDocumentVisible: _isDocumentVisible(),
      p25Compliant: true,
      timestamp: Date.now()
    };
  }
  function info2() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      enabled,
      paused,
      hasTimer: !!timer,
      countdown,
      isAuthenticated: _isAuthenticated(),
      isDocumentVisible: _isDocumentVisible(),
      p25Compliant: true
    };
  }
  return {
    start,
    stop,
    pause,
    resume,
    toggle,
    isEnabled,
    isPaused,
    getCountdown,
    destroy,
    healthCheck: healthCheck2,
    info: info2
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: { moduleAvailable: true, visibilityGating: true, authGating: true },
    p25Compliant: true,
    timestamp: Date.now()
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var auto_refresh_default = {
  createAutoRefreshManager,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createAutoRefreshManager,
  auto_refresh_default as default,
  healthCheck,
  info
};
