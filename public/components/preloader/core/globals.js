import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { getProgressSource } from "./container-resolver.js";
const MODULE_ID = "preloader-globals";
const VERSION = "1.7.0-P2-ENTERPRISE";
function registerWindowGlobals(getInstanceFn) {
  if (typeof window === "undefined") return;
  const preloaderControllerApi = {
    getInstance: getInstanceFn,
    show() {
      const i = getInstanceFn();
      return i ? i.show() : void 0;
    },
    hide(cb) {
      const i = getInstanceFn();
      return i ? i.hide(cb) : void 0;
    },
    setProgress(pct) {
      const i = getInstanceFn();
      return i ? i.setProgress(pct) : void 0;
    },
    getStatus() {
      const i = getInstanceFn();
      return i ? i.getStatus() : void 0;
    },
    getVersion() {
      const i = getInstanceFn();
      return i ? i.getVersion() : void 0;
    },
    healthCheck() {
      const i = getInstanceFn();
      return i ? i.healthCheck() : void 0;
    },
    info() {
      const i = getInstanceFn();
      return i ? i.info() : void 0;
    },
    isInitialized() {
      const i = getInstanceFn();
      return i ? i.isInitialized() : void 0;
    },
    reset() {
      const i = getInstanceFn();
      return i ? i.reset() : void 0;
    },
    getTrace() {
      const i = getInstanceFn();
      return i ? i.bootTrace : void 0;
    },
    getBootId() {
      const i = getInstanceFn();
      return i ? i.bootId : void 0;
    },
    getOrchestratorState() {
      const i = getInstanceFn();
      return i ? i.getOrchestratorState() : void 0;
    },
    getMetrics() {
      const i = getInstanceFn();
      return i ? i.getMetrics() : void 0;
    },
    getIntegrationsStatus() {
      const i = getInstanceFn();
      return i ? i.getIntegrationsStatus() : void 0;
    },
    notifyAuthReady() {
      const i = getInstanceFn();
      return i ? i.notifyAuthReady() : void 0;
    }
  };
  const preloaderApi = {
    notifyAuthReady() {
      const i = getInstanceFn();
      return i ? i.notifyAuthReady() : void 0;
    },
    getStatus() {
      const i = getInstanceFn();
      return i ? i.getStatus() : void 0;
    },
    getVersion() {
      const i = getInstanceFn();
      return i ? i.getVersion() : void 0;
    },
    healthCheck() {
      const i = getInstanceFn();
      return i ? i.healthCheck() : void 0;
    }
  };
  const preloaderDevApi = {
    getInstance: getInstanceFn,
    mount(el) {
      const i = getInstanceFn();
      return i ? i.mount(el) : void 0;
    },
    show() {
      const i = getInstanceFn();
      return i ? i.show() : void 0;
    },
    hide(cb) {
      const i = getInstanceFn();
      return i ? i.hide(cb) : void 0;
    },
    setProgress(pct) {
      const i = getInstanceFn();
      return i ? i.setProgress(pct) : void 0;
    },
    cleanup() {
      const i = getInstanceFn();
      return i ? i.cleanup() : void 0;
    },
    reset() {
      const i = getInstanceFn();
      return i ? i.reset() : void 0;
    },
    getStatus() {
      const i = getInstanceFn();
      return i ? i.getStatus() : void 0;
    },
    getVersion() {
      const i = getInstanceFn();
      return i ? i.getVersion() : void 0;
    },
    healthCheck() {
      const i = getInstanceFn();
      return i ? i.healthCheck() : void 0;
    },
    info() {
      const i = getInstanceFn();
      return i ? i.info() : void 0;
    },
    isInitialized() {
      const i = getInstanceFn();
      return i ? i.isInitialized() : void 0;
    },
    getTrace() {
      const i = getInstanceFn();
      return i ? i.bootTrace : void 0;
    },
    getBootId() {
      const i = getInstanceFn();
      return i ? i.bootId : void 0;
    },
    // v1.5.0: Bootstrap-v2 é a fonte única de progresso
    getProgressSource() {
      return getProgressSource();
    },
    getOrchestratorState() {
      const i = getInstanceFn();
      return i ? i.getOrchestratorState() : void 0;
    },
    getMetrics() {
      const i = getInstanceFn();
      return i ? i.getMetrics() : void 0;
    },
    getIntegrationsStatus() {
      const i = getInstanceFn();
      return i ? i.getIntegrationsStatus() : void 0;
    },
    forceFinish(motivo) {
      const i = getInstanceFn();
      return i ? i.finalizar(motivo || "debug-force", true) : void 0;
    }
  };
  window.__dev = window.__dev || {};
  window.__dev.preloader = preloaderDevApi;
  if (!isStrict()) {
    if (!window.PreloaderController) {
      window.PreloaderController = preloaderControllerApi;
    }
    window.Preloader = preloaderApi;
  } else {
    if (!window.PreloaderController) {
      Object.defineProperty(window, "PreloaderController", {
        get() {
          recordViolation("WINDOW_ACCESS", { module: MODULE_ID, property: "PreloaderController", access: "global-access" });
          return preloaderControllerApi;
        },
        configurable: true
      });
    }
    Object.defineProperty(window, "Preloader", {
      get() {
        recordViolation("WINDOW_ACCESS", { module: MODULE_ID, property: "Preloader", access: "global-access" });
        return preloaderApi;
      },
      configurable: true
    });
  }
}
function setupPageHideHandler(getInstanceFn) {
  window.addEventListener("pagehide", () => {
    const i = getInstanceFn();
    if (i && i.destroy) i.destroy();
  });
}
var globals_default = { MODULE_ID, VERSION, registerWindowGlobals, setupPageHideHandler };
export {
  MODULE_ID,
  VERSION,
  globals_default as default,
  registerWindowGlobals,
  setupPageHideHandler
};
