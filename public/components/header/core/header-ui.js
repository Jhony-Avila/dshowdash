import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { TooltipsManager } from "../ui/tooltips.js";
import { EnvChipUI } from "../ui/env-chip.js";
import { ScrollDetector } from "../ui/scroll-detector.js";
import { RovingTabindex } from "../accessibility/roving-tabindex.js";
import { AnnounceManager } from "../accessibility/announce.js";
import { KeyboardShortcuts } from "../accessibility/shortcuts.js";
import { RippleManager } from "../ui/ripple.js";
import { CustomizationOverlay } from "../ui/customization-overlay.js";
import { init as initOverlayRoot, destroy as destroyOverlayRoot } from "../utils/overlay-root.js";
const VERSION = "5.6.0-P17WI";
const MODULE_ID = "header/core/header-ui";
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
const _debugEnabled = () => _getPort("config")?.app?.debug || false;
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    logger.error?.(prefix, ...args);
    return;
  }
  if (level === "warn") {
    logger.warn?.(prefix, ...args);
    return;
  }
  if (level === "info") {
    logger.info?.(prefix, ...args);
    return;
  }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};
class HeaderUI {
  constructor(header) {
    this.header = header;
    this._debug = false;
    this._metrics = { initUICount: 0, initAccessibilityCount: 0, mountCount: 0, lastMountAt: null, customizationOverlayInit: false };
    this.customizationOverlay = null;
    this._networkQualityUnsub = null;
  }
  initUI() {
    this._metrics.initUICount++;
    this.header.tooltips = new TooltipsManager(this.header.config, this.header.logger);
    this.header.envChip = new EnvChipUI(this.header.elements, this.header.store, this.header.logger);
    this.header.scrollDetector = new ScrollDetector(this.header.config, this.header.elements, this.header.store, this.header.logger);
    _log("info", "UI inicializado");
  }
  initRefresh() {
    _log("info", "Refresh via componente modular refresh-action");
  }
  initAccessibility() {
    this._metrics.initAccessibilityCount++;
    this.header.rovingTabindex = new RovingTabindex(this.header.config, this.header.elements, this.header.logger);
    this.header.announceManager = new AnnounceManager(this.header.config, this.header.elements, this.header.timers, this.header.logger);
    this.header.rippleManager = new RippleManager(this.header.logger);
    this.header.shortcuts = new KeyboardShortcuts(this.header.config, null, null, this.header.logger);
    _log("info", "Accessibility inicializado");
  }
  // @ts-expect-error TS migration - TS2339
  async _initCustomizationOverlay() {
    try {
      this.customizationOverlay = new CustomizationOverlay({ header: this.header });
      const success = await this.customizationOverlay.init();
      if (success) {
        this._metrics.customizationOverlayInit = true;
        this.header.customizationOverlay = this.customizationOverlay;
        if (!isStrict()) {
          window.HeaderCustomization = this.customizationOverlay;
        } else {
          recordViolation("GLOBAL_EXPOSURE_BLOCKED", { module: MODULE_ID, property: "window.HeaderCustomization" });
        }
        _log("info", "CustomizationOverlay inicializado");
      } else {
        _log("warn", "CustomizationOverlay init retornou false");
      }
    } catch (error) {
      _log("error", "Erro ao inicializar CustomizationOverlay:", error.message);
    }
  }
  mountAll() {
    this._metrics.mountCount++;
    this._metrics.lastMountAt = Date.now();
    const headerContainer = this.header.elements?.header || document.querySelector(".site-header");
    if (headerContainer) {
      initOverlayRoot(headerContainer);
      _log("info", "overlay-root inicializado");
    } else {
      _log("warn", "Header container n\xE3o encontrado para overlay-root");
    }
    this.header.networkMonitor.mount();
    this.header.polling.start();
    if (this.header.networkMonitor && typeof this.header.networkMonitor.on === "function") {
      this._networkQualityUnsub = this.header.networkMonitor.on("quality:change", (quality) => {
        this.header.propagateNetworkQuality(quality);
      });
    }
    this.header.tooltips.mount();
    this.header.envChip.mount();
    this.header.scrollDetector.mount();
    this.header.rovingTabindex.mount();
    this.header.announceManager.mount();
    if (this.header.shortcuts) this.header.shortcuts.mount();
    if (this.header.rippleManager) this.header.rippleManager.mount();
    this._initCustomizationOverlay();
    _log("info", "UI montado");
  }
  // @ts-expect-error TS migration - TS2339
  unmountAll() {
    if (this._networkQualityUnsub) {
      this._networkQualityUnsub();
      this._networkQualityUnsub = null;
    }
    if (this.customizationOverlay) {
      this.customizationOverlay.destroy();
      this.customizationOverlay = null;
      delete window.HeaderCustomization;
    }
    destroyOverlayRoot();
    _log("info", "overlay-root destru\xEDdo");
  }
  healthCheck() {
    const checks = { headerAvailable: !!this.header, tooltipsReady: !!this.header?.tooltips, envChipReady: !!this.header?.envChip, scrollDetectorReady: !!this.header?.scrollDetector, accessibilityReady: !!this.header?.announceManager, overlayRootAAA: true, customizationOverlay: this._metrics.customizationOverlayInit };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([, v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: (/* @__PURE__ */ new Date()).toISOString() };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: this._metrics, customizationOverlay: this.customizationOverlay?.info?.() || null, healthCheck: this.healthCheck() };
  }
  setDebug(enabled) {
    this._debug = !!enabled;
    if (this.customizationOverlay) this.customizationOverlay.setDebug(enabled);
  }
  resetMetrics() {
    this._metrics = { initUICount: 0, initAccessibilityCount: 0, mountCount: 0, lastMountAt: null, customizationOverlayInit: false };
    if (this.customizationOverlay) this.customizationOverlay.resetMetrics();
  }
}
function getVersion() {
  return VERSION;
}
var header_ui_default = HeaderUI;
export {
  HeaderUI,
  MODULE_ID,
  VERSION,
  header_ui_default as default,
  getPorts,
  getVersion,
  injectPorts
};
