import { HEADER_EVENTS } from "/core/runtime/events/catalog/header.events.js";
import { VERSION, MODULE_ID } from "./constants.js";
import { isPortsInitialized } from "./ports.js";
import { getUserMenu, updateUserMenu } from "./user-menu/updater.js";
import { setupIntentsHandlers, cleanupIntentsHandlers } from "./handlers/intents.js";
import { setupAuthEventHandlers, cleanupAuthEvents } from "./handlers/auth.js";
import { setupVisibilityChange } from "./handlers/visibility.js";
import { setupConnectivityHandlers } from "./handlers/connectivity.js";
import { setupRefreshEventHandlers, setupComponentsReadyListener } from "./handlers/refresh.js";
import { setupRuntimeContextHandlers, cleanupRuntimeContextHandlers } from "./handlers/runtime-context.js";
class HeaderEvents {
  constructor(header) {
    this.header = header;
    this._debug = false;
    this._authCleanups = [];
    this._intentsCleanups = [];
    this._runtimeContextCleanups = [];
    this._componentsReadyCleanup = null;
    this._metrics = {
      visibilityChangeCount: 0,
      connectivityChangeCount: 0,
      refreshCount: 0,
      networkQualityCount: 0,
      authEventCount: 0,
      intentsEventCount: 0,
      componentsReadyCount: 0,
      sessionStartedCount: 0,
      runtimeContextUpdateCount: 0,
      runtimeContextReadyCount: 0,
      lastEventAt: null,
      bridgeUsed: false
    };
  }
  _getUserMenu() {
    return getUserMenu(this.header);
  }
  _updateUserMenu(userData) {
    return updateUserMenu(this.header, userData);
  }
  setupIntentsHandlers() {
    setupIntentsHandlers(this);
  }
  cleanupIntentsHandlers() {
    cleanupIntentsHandlers(this);
  }
  setupAuthEventHandlers() {
    setupAuthEventHandlers(this);
  }
  cleanupAuthEvents() {
    cleanupAuthEvents(this);
  }
  setupVisibilityChange() {
    setupVisibilityChange(this);
  }
  setupConnectivityHandlers() {
    setupConnectivityHandlers(this);
  }
  setupRefreshEventHandlers() {
    setupRefreshEventHandlers(this);
  }
  setupComponentsReadyListener() {
    setupComponentsReadyListener(this);
  }
  setupRuntimeContextHandlers() {
    setupRuntimeContextHandlers(this);
  }
  cleanupRuntimeContextHandlers() {
    cleanupRuntimeContextHandlers(this);
  }
  propagateNetworkQuality(quality) {
    this._metrics.networkQualityCount++;
    this._metrics.lastEventAt = Date.now();
    const rtt = quality.rtt;
    const effectiveType = quality.effectiveType;
    const downlink = quality.downlink;
    const status = quality.status;
    if (this.header.eventBus && typeof this.header.eventBus.emit === "function") {
      this.header.eventBus.emit(HEADER_EVENTS.NETWORK_QUALITY_CHANGE, {
        rtt,
        effectiveType,
        downlink,
        status,
        instanceId: this.header.instanceId,
        timestamp: Date.now(),
        source: MODULE_ID
      });
      if (status === "degraded" || status === "offline") {
        this.header.eventBus.emit(HEADER_EVENTS.QUALITY_CHANGE, {
          rtt,
          effectiveType,
          instanceId: this.header.instanceId,
          timestamp: Date.now(),
          source: MODULE_ID
        });
      }
    }
  }
  healthCheck() {
    const hasHeader = !!this.header;
    const hasEventBus = !!(this.header && this.header.eventBus);
    const hasAbortControllers = !!(this.header && this.header.abortControllers);
    const hasAuthEvents = this._authCleanups.length > 0;
    const hasIntentsEvents = this._intentsCleanups.length > 0;
    const hasRuntimeContextEvents = this._runtimeContextCleanups.length > 0;
    const checks = {
      headerAvailable: hasHeader,
      eventBusAvailable: hasEventBus,
      abortControllersReady: hasAbortControllers,
      authEventsConfigured: hasAuthEvents,
      intentsEventsConfigured: hasIntentsEvents,
      runtimeContextConfigured: hasRuntimeContextEvents,
      p0AuthOwnership: hasAuthEvents,
      p3RuntimeContext: hasRuntimeContextEvents
    };
    let passed = 0;
    const total = Object.keys(checks).length;
    Object.keys(checks).forEach((k) => {
      if (checks[k]) passed++;
    });
    return {
      status: passed === total ? "HEALTHY" : passed >= total * 0.7 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: isPortsInitialized(),
      p22Compliant: true,
      p0IntentsCompliant: hasIntentsEvents,
      p0AuthOwnership: hasAuthEvents,
      p3RuntimeContext: hasRuntimeContextEvents,
      bridgeUsed: this._metrics.bridgeUsed,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  info() {
    return {
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: isPortsInitialized(),
      p22Compliant: true,
      p0IntentsCompliant: this._intentsCleanups.length > 0,
      p0AuthOwnership: this._authCleanups.length > 0,
      p3RuntimeContext: this._runtimeContextCleanups.length > 0,
      bridgeUsed: this._metrics.bridgeUsed,
      metrics: this._metrics,
      authCleanups: this._authCleanups.length,
      intentsCleanups: this._intentsCleanups.length,
      runtimeContextCleanups: this._runtimeContextCleanups.length,
      healthCheck: this.healthCheck()
    };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
  }
  resetMetrics() {
    this._metrics = {
      visibilityChangeCount: 0,
      connectivityChangeCount: 0,
      refreshCount: 0,
      networkQualityCount: 0,
      authEventCount: 0,
      intentsEventCount: 0,
      componentsReadyCount: 0,
      sessionStartedCount: 0,
      runtimeContextUpdateCount: 0,
      runtimeContextReadyCount: 0,
      lastEventAt: null,
      bridgeUsed: false
    };
  }
  cleanup() {
    this.cleanupAuthEvents();
    this.cleanupIntentsHandlers();
    this.cleanupRuntimeContextHandlers();
    if (this._componentsReadyCleanup) {
      try {
        this._componentsReadyCleanup();
      } catch (e) {
      }
      this._componentsReadyCleanup = null;
    }
  }
}
export {
  HeaderEvents
};
