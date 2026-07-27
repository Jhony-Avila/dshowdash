import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { PRELOADER_EVENTS } from "/core/runtime/events/catalog/preloader.events.js";
const VERSION = "1.5.0-IMPORT-FIX";
const MODULE_ID = "preloader-lifecycle";
const hasWindow = typeof window !== "undefined";
const hasDocument = typeof document !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
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
const log = { info(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.info) logger.info(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, debug(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.debug) logger.debug(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
}, warn(msg, ctx) {
  const logger = _getPort("logger");
  if (logger && logger.warn) logger.warn(msg, Object.assign({ component: MODULE_ID }, ctx || {}));
} };
import { PreloaderPolicy } from "./policy.js";
import { resolveContainer } from "./container-resolver.js";
import { setupGlobalStateIntegration, setupOrchestratorIntegration, setupRouterGlobalIntegration, cleanupIntegrations } from "./integrations.js";
import { createDOMManager } from "./dom-manager.js";
import { STATES } from "./modes.js";
import { destroy as destroyAAA, resetRegistry, verifyDestruction, registerTimer } from "./destroyer.js";
import { PRELOADER_BOOT_EVENTS, BOOT_RESULTS, EXIT_CODES, createBootOutput } from "./contracts.js";
import { getPreloaderTemplate } from "../template.js";
import { getTemplateForProfile } from "../template-aaa.js";
import { injectFallbackScreen } from "../ui/degraded-ui.js";
import { hidePreloader } from "../ui/animation.js";
import { notifyPreloaderActive, notifyPreloaderInactive } from "./layout-integration.js";
import { saveFocusState, restoreFocusState } from "../ui/focus-manager.js";
function mount(ctx) {
  if (ctx.mounted) return ctx;
  ctx.metrics.recordMount();
  ctx.tracer.add("mount:start");
  saveFocusState();
  if (ctx.config.useAAAMode) {
    _mountAAA(ctx);
  } else {
    _mountLegacy(ctx);
  }
  notifyPreloaderActive();
  ctx.globalStateCleanups = setupGlobalStateIntegration(ctx.system);
  ctx.orchestratorCleanups = setupOrchestratorIntegration(ctx.system);
  ctx.routerGlobalCleanup = setupRouterGlobalIntegration(ctx.system);
  ctx.mounted = true;
  ctx.showing = true;
  ctx.modeManager.setState(STATES.INITIALIZING);
  ctx.tracer.add("mount:complete");
  return ctx;
}
function _mountAAA(ctx) {
  const profile = PreloaderPolicy.get("ui.profile") || "standard";
  const templateHtml = getTemplateForProfile(profile, { showVideo: PreloaderPolicy.get("video.enabled"), showProgress: PreloaderPolicy.get("ui.showProgress"), showPercentage: PreloaderPolicy.get("ui.showPercentage"), showText: PreloaderPolicy.get("ui.showText"), showLogo: PreloaderPolicy.get("ui.showLogo") });
  ctx.domManagerAAA = createDOMManager({ useShadowDOM: ctx.config.useShadowRoot });
  ctx.domManagerAAA.mount(templateHtml);
  ctx.domManagerAAA.setVisible(true);
  ctx.$screen = ctx.domManagerAAA.getRoot();
  ctx.$bar = ctx.domManagerAAA.getProgressBar();
  ctx.mountSource = "aaa-dom-manager";
  log.debug("Mounted with AAA DOM Manager");
}
function _mountLegacy(ctx) {
  const resolved = resolveContainer(ctx.config);
  ctx.containerEl = resolved.containerEl;
  ctx.mountSource = resolved.source;
  if (!ctx.containerEl) {
    ctx.$injectedScreen = injectFallbackScreen(ctx.tracer.add.bind(ctx.tracer));
    ctx.$screen = ctx.$injectedScreen;
  } else {
    ctx.$screen = ctx.containerEl.querySelector("#loading-screen") || ctx.containerEl;
    if (!ctx.$screen.innerHTML.trim()) {
      ctx.$screen.innerHTML = getPreloaderTemplate();
    }
  }
  ctx.$bar = ctx.$screen ? ctx.$screen.querySelector(".loading-progress-bar, #loading-progress-bar") : null;
  ctx.$label = ctx.$screen ? ctx.$screen.querySelector(".loading-percentage") : null;
  if (ctx.$screen) {
    ctx.$screen.classList.add("visible");
    ctx.$screen.classList.remove("hidden");
    ctx.$screen.removeAttribute("hidden");
    ctx.$screen.setAttribute("aria-busy", "true");
  }
  log.debug("Mounted with legacy method", { source: ctx.mountSource });
}
function show(ctx) {
  if (ctx.showing) return;
  if (ctx.config.useAAAMode && ctx.domManagerAAA) {
    ctx.domManagerAAA.setVisible(true);
  } else if (ctx.$screen) {
    ctx.$screen.classList.add("visible");
    ctx.$screen.classList.remove("hidden");
  }
  notifyPreloaderActive();
  ctx.showing = true;
  ctx.modeManager.setState(STATES.INITIALIZING);
}
function hide(ctx, callback) {
  if (!ctx.showing && !ctx.mounted) {
    if (callback) callback();
    return;
  }
  ctx.tracer.add("hide:start");
  ctx.metrics.recordHide();
  ctx.finalizing = true;
  ctx.tracer.markStart("hide");
  const onHideComplete = () => {
    restoreFocusState(ctx.$screen);
    ctx.showing = false;
    ctx.modeManager.setState(STATES.COMPLETE);
    ctx.tracer.markEnd("hide");
    ctx.tracer.add("hide:complete");
    const finalPayload = { bootId: ctx.bootId, durationMs: ctx.state.getBootDuration(), success: true, componentsLoaded: ["preloader"], performanceMarks: ctx.tracer.getPerformanceMarks(), bootTrace: ctx.tracer.getTrace(), phase: ctx.state.fase, orchestratorState: ctx.orchestratorState, mountSource: ctx.mountSource, useAAAMode: ctx.config.useAAAMode, timestamp: Date.now() };
    ctx.emit(PRELOADER_EVENTS.HIDE, finalPayload);
    ctx.emit(PRELOADER_BOOT_EVENTS.BOOT_COMPLETE, createBootOutput(BOOT_RESULTS.SUCCESS, EXIT_CODES.BOOT_COMPLETE, { bootId: ctx.bootId, startTime: ctx.bootStartTs, phase: ctx.state.fase, progress: 100, authChecked: true, authenticated: ctx.state.temSessaoValida }));
    if (ctx.config.orchestrator.notifyOnBoot && ctx.eventBus) {
      ctx.eventBus.emit(PRELOADER_EVENTS.BOOT_READY, { bootId: ctx.bootId, durationMs: finalPayload.durationMs, orchestratorState: ctx.orchestratorState, timestamp: Date.now() });
    }
    if (callback) callback();
    ctx.finalizing = false;
  };
  if (ctx.config.useAAAMode && ctx.domManagerAAA) {
    ctx.domManagerAAA.fadeOut(ctx.config.hideDelayMs).then(onHideComplete);
  } else {
    hidePreloader(onHideComplete);
  }
}
function setProgress(ctx, pct) {
  const clamped = Math.max(0, Math.min(100, pct));
  if (clamped < ctx.state.progressoAtual) return;
  if (ctx.timers.progressDebounce) return;
  const timerId = setTimeout(() => {
    if (ctx.config.useAAAMode && ctx.domManagerAAA) {
      ctx.domManagerAAA.setProgress(clamped);
    } else {
      if (ctx.$bar) ctx.$bar.style.width = `${clamped}%`;
      if (ctx.$label) ctx.$label.textContent = `${Math.round(clamped)}%`;
    }
    ctx.state.setProgresso(clamped);
    ctx.emit(PRELOADER_EVENTS.PROGRESS, { bootId: ctx.bootId, progress: clamped, phase: ctx.state.fase, timestamp: Date.now() });
    delete ctx.timers.progressDebounce;
  }, ctx.config.progressDebounceMs);
  ctx.timers.progressDebounce = timerId;
  registerTimer(timerId);
}
function cleanup(ctx) {
  ctx.tracer.add("cleanup:start");
  ctx.metrics.recordCleanup();
  Object.keys(ctx.timers).forEach((key) => {
    clearTimeout(ctx.timers[key]);
  });
  ctx.timers = {};
  if (ctx.abortController) {
    ctx.abortController.abort();
    ctx.abortController = null;
  }
  cleanupIntegrations(ctx.system);
  ctx.cleanupManager.cleanup();
  ctx.degradedUI.cleanup();
  if (ctx.progressMonitor) {
    ctx.progressMonitor.stop();
    ctx.progressMonitor = null;
  }
  notifyPreloaderInactive();
  restoreFocusState(ctx.$screen);
  if (ctx.config.useAAAMode && ctx.domManagerAAA) {
    ctx.domManagerAAA.unmount();
    ctx.domManagerAAA = null;
  } else {
    if (ctx.$injectedScreen && ctx.$injectedScreen.parentNode) {
      ctx.$injectedScreen.parentNode.removeChild(ctx.$injectedScreen);
      ctx.$injectedScreen = null;
    } else if (ctx.$screen) {
      ctx.$screen.classList.add("hidden");
      ctx.$screen.setAttribute("hidden", "");
      ctx.$screen.setAttribute("aria-busy", "false");
    }
  }
  if (ctx.bootExecutorAAA) {
    ctx.bootExecutorAAA.destroy();
    ctx.bootExecutorAAA = null;
  }
  ctx.$screen = null;
  ctx.$bar = null;
  ctx.$label = null;
  ctx.mounted = false;
  ctx.showing = false;
  ctx.finalizing = false;
  ctx.allowFinalize = true;
  ctx.bootManager.reset();
  ctx.modeManager.reset();
  ctx.tracer.add("cleanup:complete");
}
function destroy(ctx) {
  ctx.tracer.add("destroy");
  ctx.allowFinalize = false;
  ctx.destroyed = true;
  cleanup(ctx);
  const destroyReport = destroyAAA({ rootElement: ctx.$screen, instanceId: ctx.bootId, eventBus: ctx.eventBus });
  resetRegistry();
  ctx.tracer.clear();
  const verification = verifyDestruction();
  if (!verification.clean) {
    log.warn("Destruction verification failed", { issues: verification.issues });
  }
  log.info("PreloaderSystem destroyed", { bootId: ctx.bootId, cleanupReport: destroyReport, verification });
  return destroyReport;
}
function healthCheck() {
  const logger = _getPort("logger");
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { loggerAvailable: !!logger, portsInitialized: Ports.isInitialized() }, portsInitialized: Ports.isInitialized() };
}
var lifecycle_default = { mount, show, hide, setProgress, cleanup, destroy, healthCheck, VERSION, MODULE_ID, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  lifecycle_default as default,
  destroy,
  getPorts,
  healthCheck,
  hide,
  injectPorts,
  mount,
  setProgress,
  show
};
