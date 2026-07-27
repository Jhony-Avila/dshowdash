import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { createProgressCircle } from "../progress-circle/index.js";
import { createConnectionStatus } from "../connection-status/index.js";
import Animacoes from "/assets/animacoes/index.js";
import { FooterButtonsMounter } from "../buttons/component-mounter.js";
import IconsOrchestrator from "../icons-orchestrator.js";
import FooterAnnounceLiveRegion from "../announce-live-region/index.js";
import { LanguageSelectorComponent } from "../status-lang/index.js";
import FooterLinksUseful from "../links-useful/index.js";
import FooterVersionEnv from "../version-env/index.js";
const VERSION = "31.0.0-METRICS-API";
const MODULE_ID = "footer.registry";
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
const SLOTS = { QUICK_STATUS: '[data-slot="quick-status"]', META: '[data-slot="meta"]', SESSION_TIMER: '[data-slot="session-timer"]', ANNOUNCE: '[data-slot="announce"]', BRAND: '[data-slot="brand"]', DECORATIVE_ICONS: '[data-slot="decorative-icons"]', LINKS: '[data-slot="links"]', COPYRIGHT: '[data-slot="copyright"]' };
const _log = function(level, msg, data) {
  var logger = _getPort("logger");
  if (!logger) return;
  var prefix = "[" + MODULE_ID + "]";
  if (level === "error" && logger.error) logger.error(prefix, msg, data || "");
  else if (level === "warn" && logger.warn) logger.warn(prefix, msg, data || "");
  else if (level === "info" && logger.info) logger.info(prefix, msg, data || "");
  else if (logger.debug) logger.debug(prefix, msg, data || "");
};
const METRICS_API_URL = "/api/metrics/server.php";
const METRICS_POLL_INTERVAL = 3e4;
const _metrics = { ipFetchAttempts: 0, ipFetchSuccess: 0, ipFetchErrors: 0, metricsPolls: 0, metricsPollErrors: 0, metricsSource: null };
function _fetchWithTimeout(url, options, timeout) {
  timeout = timeout || 5e3;
  return new Promise(function(resolve, reject) {
    const controller = new AbortController();
    const timeoutId = setTimeout(function() {
      controller.abort();
    }, timeout);
    fetch(url, Object.assign({}, options, { signal: controller.signal })).then(function(response) {
      clearTimeout(timeoutId);
      resolve(response);
    }).catch(function(error) {
      clearTimeout(timeoutId);
      reject(error);
    });
  });
}
function FooterComponentsRegistry() {
  this._mounted = false;
  this._mountedAt = null;
  this._cleanupFns = [];
  this._intervals = [];
  this._sessionStart = Date.now();
  this._ipData = null;
  this._connectionStatus = null;
  this._cpuCircle = null;
  this._memoryCircle = null;
  this._diskCircle = null;
  this._metricsInterval = null;
  this._brandAnimation = null;
  this._buttonsMounted = false;
  this._iconsMounted = false;
  this._announceRegion = null;
  this._statusLang = null;
  this._linksUseful = null;
  this._versionEnv = null;
  this._metaContainer = null;
  this._config = null;
}
FooterComponentsRegistry.prototype.mountAll = function(container, config, integrations) {
  let self = this;
  config = config || {};
  integrations = integrations || {};
  this._config = config;
  if (this._mounted) {
    _log("warn", "Registry already mounted, skipping");
    return Promise.resolve();
  }
  const statusSlot = container.querySelector(SLOTS.QUICK_STATUS);
  const metaSlot = container.querySelector(SLOTS.META);
  const sessionSlot = container.querySelector(SLOTS.SESSION_TIMER);
  const brandSlot = container.querySelector(SLOTS.BRAND);
  const iconsSlot = container.querySelector(SLOTS.DECORATIVE_ICONS);
  const announceSlot = container.querySelector(SLOTS.ANNOUNCE);
  const linksSlot = container.querySelector(SLOTS.LINKS);
  const promises = [];
  if (brandSlot) promises.push(this._mountBrandLottie(brandSlot));
  if (iconsSlot) promises.push(this._mountDecorativeIcons(iconsSlot, config));
  promises.push(this._mountButtons(container));
  if (statusSlot) {
    statusSlot.innerHTML = "";
    this._mountConnectionStatus(statusSlot);
    this._mountProgressCircles(statusSlot);
  }
  if (metaSlot) {
    this._metaContainer = metaSlot;
    this._mountMetaInfo(metaSlot, config);
    promises.push(this._mountVersionEnv(metaSlot, integrations));
  }
  if (sessionSlot) this._mountSessionTimer(sessionSlot);
  if (announceSlot) promises.push(this._mountAnnounceRegion(announceSlot, integrations));
  if (linksSlot) promises.push(this._mountLinksUseful(linksSlot, integrations));
  return Promise.all(promises).then(function() {
    self._mounted = true;
    self._mountedAt = Date.now();
    _log("info", "Registry mounted v" + VERSION);
  });
};
FooterComponentsRegistry.prototype._mountConnectionStatus = function(container) {
  const wrapper = document.createElement("div");
  wrapper.className = "dsd-footer__status-connection";
  wrapper.setAttribute("data-component", "connection-status");
  container.appendChild(wrapper);
  this._connectionStatus = createConnectionStatus();
  this._connectionStatus.mount(wrapper);
  _log("info", "Connection status mounted");
};
FooterComponentsRegistry.prototype._mountProgressCircles = function(container) {
  const cpuWrapper = document.createElement("div");
  cpuWrapper.className = "dsd-footer__status-cpu";
  cpuWrapper.setAttribute("data-component", "progress-cpu");
  container.appendChild(cpuWrapper);
  this._cpuCircle = createProgressCircle({ label: "CPU" });
  this._cpuCircle.mount(cpuWrapper, 0);
  const ramWrapper = document.createElement("div");
  ramWrapper.className = "dsd-footer__status-ram";
  ramWrapper.setAttribute("data-component", "progress-ram");
  container.appendChild(ramWrapper);
  this._memoryCircle = createProgressCircle({ label: "RAM" });
  this._memoryCircle.mount(ramWrapper, 0);
  const diskWrapper = document.createElement("div");
  diskWrapper.className = "dsd-footer__status-disk";
  diskWrapper.setAttribute("data-component", "progress-disk");
  container.appendChild(diskWrapper);
  this._diskCircle = createProgressCircle({ label: "DISK" });
  this._diskCircle.mount(diskWrapper, 0);
  this._startMetricsPolling();
  _log("info", "Progress circles mounted (CPU, RAM, DISK)");
};
FooterComponentsRegistry.prototype._startMetricsPolling = function() {
  let self = this;
  const fetchMetrics = function() {
    _metrics.metricsPolls++;
    _fetchWithTimeout(METRICS_API_URL, { method: "GET", headers: { "Accept": "application/json" } }, 5e3).then(function(response) {
      if (response.ok) return response.json();
      throw new Error("Metrics API response not OK: " + response.status);
    }).then(function(json) {
      const data = json && json.data ? json.data : json;
      if (data) {
        if (data.cpu !== void 0 && self._cpuCircle) self._cpuCircle.setValue(data.cpu);
        if (data.memory !== void 0 && self._memoryCircle) self._memoryCircle.setValue(data.memory);
        if (data.disk !== void 0 && self._diskCircle) self._diskCircle.setValue(data.disk);
        _metrics.metricsSource = "api";
      }
    }).catch(function(err) {
      _metrics.metricsPollErrors++;
      _log("warn", "Metrics API poll failed", err.message);
    });
  };
  fetchMetrics();
  this._metricsInterval = setInterval(function() {
    if (document.hidden) return;
    fetchMetrics();
  }, METRICS_POLL_INTERVAL);
  this._intervals.push(this._metricsInterval);
  _log("info", "Metrics polling started (" + METRICS_POLL_INTERVAL / 1e3 + "s interval)");
};
FooterComponentsRegistry.prototype._mountDecorativeIcons = function(container, config) {
  let self = this;
  config = config || this._config || {};
  let dockItems = [];
  if (config.dock && config.dock.items && Array.isArray(config.dock.items)) {
    dockItems = config.dock.items.filter(function(item) {
      return item && item.id && item.type !== "separator";
    }).map(function(item) {
      return {
        id: item.icon || item.id,
        icon: item.icon || item.id,
        tooltip: item.tooltip || item.ariaLabel || item.id,
        href: item.href || null,
        panel: item.panel || null,
        ariaLabel: item.ariaLabel || item.tooltip || item.id
      };
    });
  }
  _log("info", "Mounting decorative icons", { count: dockItems.length, items: dockItems.map(function(i) {
    return i.id;
  }) });
  return Promise.resolve().then(function() {
    return IconsOrchestrator.mountAll(container, dockItems);
  }).then(function(result) {
    self._iconsMounted = true;
    const mounted = result && result.mounted ? result.mounted.length : 0;
    const failed = result && result.failed ? result.failed.length : 0;
    _log("info", "Icons mounted", { mounted, failed });
  }).catch(function(err) {
    _log("error", "Failed to mount icons", err.message);
  });
};
FooterComponentsRegistry.prototype._mountButtons = function(container) {
  let self = this;
  return FooterButtonsMounter.mountAll(container).then(function(results) {
    self._buttonsMounted = true;
    _log("info", "Buttons mounted", { mounted: results.mounted.length, failed: results.failed.length });
    if (results.failed.length > 0) _log("warn", "Some buttons failed to mount", { failed: results.failed });
  }).catch(function(err) {
    _log("error", "Failed to mount buttons", err.message);
  });
};
FooterComponentsRegistry.prototype._mountBrandLottie = function(container) {
  let self = this;
  const lottieContainer = container.querySelector('[data-lottie="cards"]');
  if (!lottieContainer) {
    _log("debug", "Lottie container not found");
    return Promise.resolve();
  }
  return Animacoes.init({ debug: false }).then(function() {
    return Animacoes.loadAnimation("cards", lottieContainer, { loop: true, autoplay: true, renderer: "svg" });
  }).then(function(anim) {
    self._brandAnimation = anim;
    _log("info", "Brand Lottie loaded");
  }).catch(function(err) {
    _log("warn", "Failed to load brand Lottie", err.message);
  });
};
FooterComponentsRegistry.prototype._mountAnnounceRegion = function(container, integrations) {
  let self = this;
  return Promise.resolve().then(function() {
    self._announceRegion = new FooterAnnounceLiveRegion();
    return self._announceRegion.mount(container, {}, integrations);
  }).then(function() {
    _log("info", "Announce live region mounted");
  }).catch(function(err) {
    _log("warn", "Failed to mount announce-live-region", err.message);
  });
};
FooterComponentsRegistry.prototype._mountStatusLang = function(container, integrations) {
  let self = this;
  return Promise.resolve().then(function() {
    const langContainer = document.createElement("div");
    langContainer.className = "dsd-footer__status-lang";
    langContainer.setAttribute("data-component", "status-lang");
    container.appendChild(langContainer);
    self._statusLang = new LanguageSelectorComponent({ container: langContainer });
    if (self._statusLang.mount) self._statusLang.mount();
    _log("info", "Status lang mounted");
  }).catch(function(err) {
    _log("warn", "Failed to mount status-lang", err.message);
  });
};
FooterComponentsRegistry.prototype._mountLinksUseful = function(container, integrations) {
  let self = this;
  return Promise.resolve().then(function() {
    self._linksUseful = new FooterLinksUseful();
    if (self._linksUseful.mount) return self._linksUseful.mount(container, {}, integrations);
  }).then(function() {
    _log("info", "Links useful mounted");
  }).catch(function(err) {
    _log("warn", "Failed to mount links-useful", err.message);
  });
};
FooterComponentsRegistry.prototype._mountVersionEnv = function(container, integrations) {
  let self = this;
  return Promise.resolve().then(function() {
    const versionContainer = document.createElement("div");
    versionContainer.className = "dsd-footer__version-env";
    versionContainer.setAttribute("data-component", "version-env");
    container.appendChild(versionContainer);
    self._versionEnv = new FooterVersionEnv();
    if (self._versionEnv.mount) return self._versionEnv.mount(versionContainer, {}, integrations);
  }).then(function() {
    _log("info", "Version env mounted");
  }).catch(function(err) {
    _log("warn", "Failed to mount version-env", err.message);
  });
};
FooterComponentsRegistry.prototype._mountSessionTimer = function(container) {
  let self = this;
  const sessionChip = document.createElement("div");
  sessionChip.className = "dsd-footer__session-chip";
  sessionChip.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="dsd-footer__session-icon"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span class="dsd-footer__session-value">00:00:00</span>';
  container.appendChild(sessionChip);
  const sessionInterval = setInterval(function() {
    const elapsed = Date.now() - self._sessionStart;
    const hours = Math.floor(elapsed / 36e5);
    const mins = Math.floor(elapsed % 36e5 / 6e4);
    const secs = Math.floor(elapsed % 6e4 / 1e3);
    const timeStr = [hours, mins, secs].map(function(n) {
      return String(n).padStart(2, "0");
    }).join(":");
    const valueEl = sessionChip.querySelector(".dsd-footer__session-value");
    if (valueEl) valueEl.textContent = timeStr;
  }, 1e3);
  this._intervals.push(sessionInterval);
};
FooterComponentsRegistry.prototype._mountMetaInfo = function(container, config) {
  const buildEl = container.querySelector('[data-value="build"]');
  if (buildEl) buildEl.textContent = "Build: " + (config.buildDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
  this._fetchIpInfo(container);
};
FooterComponentsRegistry.prototype._fetchIpInfo = function(container) {
  const self = this;
  _metrics.ipFetchAttempts++;
  const ipEl = container.querySelector('[data-value="ip"]');
  const locationEl = container.querySelector('[data-value="location"]');
  const updateFallback = function() {
    if (ipEl) ipEl.textContent = "IP: --";
    if (locationEl) locationEl.textContent = "Local: --";
  };
  _fetchWithTimeout("https://ipapi.co/json/", { method: "GET", headers: { "Accept": "application/json" } }, 5e3).then(function(response) {
    if (response.ok) return response.json();
    throw new Error("Response not OK: " + response.status);
  }).then(function(data) {
    _metrics.ipFetchSuccess++;
    self._ipData = data;
    if (ipEl && data.ip) ipEl.textContent = "IP: " + data.ip;
    if (locationEl && data.city && data.region) locationEl.textContent = data.city + ", " + data.region;
    _log("debug", "IP info fetched successfully");
  }).catch(function(e) {
    _metrics.ipFetchErrors++;
    _log("warn", "Failed to fetch IP info (degraded mode)", e.message);
    updateFallback();
  });
};
FooterComponentsRegistry.prototype.destroyAll = function() {
  if (this._iconsMounted) {
    IconsOrchestrator.unmountAll();
    this._iconsMounted = false;
  }
  FooterButtonsMounter.unmountAll();
  this._buttonsMounted = false;
  if (this._announceRegion && this._announceRegion.destroy) {
    this._announceRegion.destroy();
    this._announceRegion = null;
  }
  if (this._statusLang && this._statusLang.destroy) {
    this._statusLang.destroy();
    this._statusLang = null;
  }
  if (this._metricsInterval) {
    clearInterval(this._metricsInterval);
    this._metricsInterval = null;
  }
  if (this._brandAnimation) {
    Animacoes.destroyAnimation("cards");
    this._brandAnimation = null;
  }
  if (this._connectionStatus) {
    this._connectionStatus.unmount();
    this._connectionStatus = null;
  }
  if (this._cpuCircle) {
    this._cpuCircle.unmount();
    this._cpuCircle = null;
  }
  if (this._memoryCircle) {
    this._memoryCircle.unmount();
    this._memoryCircle = null;
  }
  if (this._diskCircle) {
    this._diskCircle.unmount();
    this._diskCircle = null;
  }
  if (this._versionEnv && this._versionEnv.destroy) {
    this._versionEnv.destroy();
    this._versionEnv = null;
  }
  if (this._linksUseful && this._linksUseful.destroy) {
    this._linksUseful.destroy();
    this._linksUseful = null;
  }
  let i;
  for (i = 0; i < this._intervals.length; i++) clearInterval(this._intervals[i]);
  this._intervals = [];
  for (i = 0; i < this._cleanupFns.length; i++) this._cleanupFns[i]();
  this._cleanupFns = [];
  this._mounted = false;
  this._mountedAt = null;
  this._metaContainer = null;
  this._config = null;
  _log("info", "Registry destroyed");
};
FooterComponentsRegistry.prototype.announce = function(message) {
  if (this._announceRegion) this._announceRegion.announce(message);
};
FooterComponentsRegistry.prototype.getComponent = function(name) {
  const map = {
    "connection-status": this._connectionStatus,
    "cpu-circle": this._cpuCircle,
    "memory-circle": this._memoryCircle,
    "disk-circle": this._diskCircle,
    "announce-region": this._announceRegion,
    "status-lang": this._statusLang,
    "version-env": this._versionEnv,
    "links-useful": this._linksUseful
  };
  return map[name] || null;
};
FooterComponentsRegistry.prototype.getAllComponents = function() {
  const all = [
    { name: "connection-status", instance: this._connectionStatus },
    { name: "cpu-circle", instance: this._cpuCircle },
    { name: "memory-circle", instance: this._memoryCircle },
    { name: "disk-circle", instance: this._diskCircle },
    { name: "icons", instance: this._iconsMounted ? IconsOrchestrator : null },
    { name: "announce-region", instance: this._announceRegion },
    { name: "status-lang", instance: this._statusLang },
    { name: "version-env", instance: this._versionEnv },
    { name: "links-useful", instance: this._linksUseful }
  ];
  return all.filter(function(c) {
    return c.instance;
  });
};
FooterComponentsRegistry.prototype.getVersion = function() {
  return VERSION;
};
FooterComponentsRegistry.prototype.getMetrics = function() {
  return {
    mounted: this._mounted,
    buttonsMounted: this._buttonsMounted,
    connectionStatusMounted: !!this._connectionStatus,
    cpuCircleMounted: !!this._cpuCircle,
    memoryCircleMounted: !!this._memoryCircle,
    diskCircleMounted: !!this._diskCircle,
    iconsMounted: this._iconsMounted,
    announceRegionMounted: !!this._announceRegion,
    statusLangMounted: !!this._statusLang,
    versionEnvMounted: !!this._versionEnv,
    linksUsefulMounted: !!this._linksUseful,
    metricsPolling: !!this._metricsInterval,
    metricsSource: _metrics.metricsSource,
    metricsPolls: _metrics.metricsPolls,
    metricsPollErrors: _metrics.metricsPollErrors,
    brandAnimation: !!this._brandAnimation,
    ipFetch: { attempts: _metrics.ipFetchAttempts, success: _metrics.ipFetchSuccess, errors: _metrics.ipFetchErrors }
  };
};
FooterComponentsRegistry.prototype.getManifest = function() {
  const components = this.getAllComponents();
  return {
    registryId: MODULE_ID,
    version: VERSION,
    loadedAt: this._mountedAt,
    itemCount: components.length,
    // @ts-expect-error TS migration - TS2339
    items: components.map(function(c) {
      return c.name;
    }),
    mounted: this._mounted,
    metrics: this.getMetrics(),
    slots: Object.keys(SLOTS),
    p23Governance: true,
    diCompliance: "100%",
    timestamp: Date.now()
  };
};
FooterComponentsRegistry.prototype.healthCheck = function() {
  const totalChecks = 12;
  const metricsViaAPI = _metrics.metricsSource === "api";
  const checks = [
    this._mounted,
    this._buttonsMounted,
    !!this._connectionStatus,
    !!this._cpuCircle,
    !!this._memoryCircle,
    !!this._diskCircle,
    this._iconsMounted,
    !!this._announceRegion,
    !!this._versionEnv,
    !!this._linksUseful,
    !!_getPort("logger"),
    metricsViaAPI
  ];
  let passed = checks.filter(Boolean).length;
  return {
    status: passed >= 9 ? "HEALTHY" : passed >= 7 ? "DEGRADED" : "UNHEALTHY",
    score: passed + "/" + totalChecks,
    checks: this.getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    p23Governance: true,
    diCompliance: metricsViaAPI ? "100%" : "partial",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
};
FooterComponentsRegistry.prototype.info = function() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    mounted: this._mounted,
    // @ts-expect-error TS migration - TS2339
    components: this.getAllComponents().map(function(c) {
      return c.name;
    }),
    metrics: this.getMetrics(),
    p23Governance: true,
    diCompliance: _metrics.metricsSource === "api" ? "100%" : "partial"
  };
};
FooterComponentsRegistry.prototype.setDebug = function(enabled) {
};
FooterComponentsRegistry.VERSION = VERSION;
FooterComponentsRegistry.SLOTS = SLOTS;
var registry_default = FooterComponentsRegistry;
export {
  MODULE_ID,
  VERSION,
  registry_default as default,
  getPorts,
  injectPorts
};
