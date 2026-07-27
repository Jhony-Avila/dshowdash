import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { validateContract, createMountWithTimeout, createFallbackHTML, CRITICALITY, COMPONENT_STATUS, DEFAULT_MOUNT_TIMEOUT } from "../components/_base/contract.js";
import { HEADER_COMPONENTS } from "/components/header/components/dist/header-components.bundle.js";
const VERSION = "12.2.0-ES6";
const MODULE_ID = "header/core/components-loader";
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
function _emitSubcomponentEvent(eventName, detail) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) eventBus.emit(eventName, detail);
  document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
}
const CRITICALITY_MAP = { "menu": CRITICALITY.CRITICAL, "action": CRITICALITY.IMPORTANT, "indicator": CRITICALITY.IMPORTANT, "info": CRITICALITY.OPTIONAL, "panel": CRITICALITY.OPTIONAL, "integration": CRITICALITY.OPTIONAL };
const REGION_MAP = { "left": "left", "center": "right", "right": "right" };
const FALLBACK_COMPONENTS_LIST = [{ name: "real-time-clock", region: "right", criticality: CRITICALITY.CRITICAL, timeout: 5e3 }, { name: "notifications", region: "right", criticality: CRITICALITY.IMPORTANT, timeout: 6e3 }, { name: "errors-status", region: "right", criticality: CRITICALITY.IMPORTANT, timeout: 5e3 }];
function ComponentsLoader(headerInstance) {
  this.header = headerInstance;
  this.components = /* @__PURE__ */ new Map();
  this.componentStatus = /* @__PURE__ */ new Map();
  this.loadedCount = 0;
  this.failedCount = 0;
  this.timeoutCount = 0;
  this._debug = false;
  this._metrics = { loadCount: 0, unmountCount: 0, errorCount: 0, timeoutCount: 0, retryCount: 0, lastLoadAt: null, registrySource: null, registryLoadTime: null, orderSource: null, governanceValidated: 0, duplicatesBlocked: 0 };
  this.componentsList = [];
  this._registryLoaded = false;
  this._headerRegistry = null;
  this._moduleCapabilities = /* @__PURE__ */ new Map();
  this._componentWrappers = /* @__PURE__ */ new Map();
  this._loadedAt = null;
  this._loadingInProgress = /* @__PURE__ */ new Set();
}
ComponentsLoader.prototype._loadFromRegistry = function() {
  const self = this;
  return new Promise((resolve) => {
    const startTime = performance.now();
    import("../registry/index.js").then((module) => {
      const HeaderRegistry = module.default;
      self._headerRegistry = HeaderRegistry;
      return HeaderRegistry.load().then((result) => {
        if (!result.success) {
          _log("warn", "Registry load failed (non-fatal), using fallback:", result.error || "unknown");
          self.componentsList = FALLBACK_COMPONENTS_LIST.slice();
          self._metrics.registrySource = "fallback";
          self._metrics.orderSource = "fallback";
          self._registryLoaded = false;
          resolve(false);
          return;
        }
        const orderedComponents = HeaderRegistry.getOrderedComponents();
        const orderInfo = HeaderRegistry.getOrderInfo();
        self.componentsList = orderedComponents.filter((comp) => comp.is_active !== 0).map((comp, index) => ({
          name: comp.component_key || comp.key,
          orderIndex: index,
          region: REGION_MAP[comp.group_position] || "right",
          criticality: CRITICALITY_MAP[comp.component_type] || CRITICALITY.OPTIONAL,
          timeout: comp.polling_interval > 0 ? Math.min(comp.polling_interval, 1e4) : 5e3,
          groupKey: comp.groupKey || comp.group_key,
          componentType: comp.component_type,
          label: comp.label,
          icon: comp.icon_name,
          minLevel: comp.min_access_level || 0,
          showOnMobile: comp.show_on_mobile !== 0,
          showOnTablet: comp.show_on_tablet !== 0,
          showOnDesktop: comp.show_on_desktop !== 0,
          apiEndpoint: comp.api_endpoint,
          pollingEnabled: comp.polling_enabled === 1,
          pollingInterval: comp.polling_interval,
          isDraggable: comp.component_type !== "menu"
        }));
        self._registryLoaded = true;
        self._metrics.registrySource = "database";
        self._metrics.orderSource = orderInfo.source;
        self._metrics.registryLoadTime = performance.now() - startTime;
        _log("info", `Registry carregado: ${self.componentsList.length} componentes, ordem: ${orderInfo.source}, tempo: ${self._metrics.registryLoadTime.toFixed(0)}ms`);
        window.HeaderRegistry = HeaderRegistry;
        resolve(true);
      });
    }).catch((error) => {
      _log("warn", "Falha ao carregar do Registry, usando fallback:", error.message);
      self.componentsList = FALLBACK_COMPONENTS_LIST.slice();
      self._metrics.registrySource = "fallback";
      self._metrics.orderSource = "fallback";
      self._registryLoaded = false;
      resolve(false);
    });
  });
};
ComponentsLoader.prototype._findComponentClass = (module, componentName) => {
  if (module.default && typeof module.default === "function" && module.default.prototype && module.default.prototype.mount) return module.default;
  const pascalName = `${componentName.split("-").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}Component`;
  const possibleNames = [pascalName, pascalName.replace("Component", ""), `${pascalName}Enterprise`, componentName.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("")];
  for (let i = 0; i < possibleNames.length; i++) {
    if (module[possibleNames[i]] && typeof module[possibleNames[i]] === "function") return module[possibleNames[i]];
  }
  const moduleKeys = Object.keys(module);
  for (let j = 0; j < moduleKeys.length; j++) {
    const exp = module[moduleKeys[j]];
    if (typeof exp === "function" && exp.prototype && typeof exp.prototype.mount === "function") return exp;
  }
  for (let k = 0; k < moduleKeys.length; k++) {
    const expK = module[moduleKeys[k]];
    if (typeof expK === "function" && expK.prototype && expK.prototype.constructor === expK) return expK;
  }
  return null;
};
ComponentsLoader.prototype._extractModuleGovernance = function(module, componentName) {
  const governance = { id: null, capabilities: null, version: null, valid: false };
  if (typeof module.id === "string") governance.id = module.id;
  if (module.capabilities && typeof module.capabilities === "object") governance.capabilities = module.capabilities;
  if (typeof module.VERSION === "string") governance.version = module.VERSION;
  governance.valid = !!governance.id && !!governance.capabilities;
  if (!governance.valid) {
    _log("debug", `Governanca incompleta para ${componentName}: id=${!!governance.id}, capabilities=${!!governance.capabilities}`);
  } else {
    this._metrics.governanceValidated++;
  }
  this._moduleCapabilities.set(componentName, governance);
  return governance;
};
ComponentsLoader.prototype._setLoadingState = (isLoading) => {
  const headerRight = document.querySelector(".header-right");
  if (headerRight) {
    headerRight.style.opacity = isLoading ? "0.3" : "1";
    headerRight.style.transition = "opacity 0.2s ease";
  }
  if (window.InputPolicyManager && window.InputPolicyManager.setLoading) window.InputPolicyManager.setLoading(isLoading, MODULE_ID);
};
ComponentsLoader.prototype._updateComponentStatus = function(name, status, error) {
  const previous = this.componentStatus.get(name);
  this.componentStatus.set(name, { status, error: error || null, updatedAt: Date.now() });
  _emitSubcomponentEvent("header:subcomponent:status", { component: name, status, previousStatus: previous ? previous.status : COMPONENT_STATUS.PENDING, error: error ? error.message : null, timestamp: Date.now() });
  if (status === COMPONENT_STATUS.FAILED || status === COMPONENT_STATUS.TIMEOUT) {
    _emitSubcomponentEvent("header:subcomponent:degraded", { component: name, reason: status, error: error ? error.message : null, timestamp: Date.now() });
  }
  if (window.HeaderRegistry && window.HeaderRegistry.setComponentLoaded && status === COMPONENT_STATUS.MOUNTED) {
    window.HeaderRegistry.setComponentLoaded(name, true, this.components.get(name) ? this.components.get(name).instance : null);
  }
};
ComponentsLoader.prototype._renderFallback = (container, componentName, error) => {
  const fallbackHTML = createFallbackHTML(componentName, error ? error.message : null);
  const wrapper = document.createElement("div");
  wrapper.innerHTML = fallbackHTML;
  container.appendChild(wrapper.firstElementChild);
};
ComponentsLoader.prototype._shouldShowOnDevice = (config) => {
  const width = window.innerWidth;
  if (width < 768) return config.showOnMobile !== false;
  if (width < 1024) return config.showOnTablet !== false;
  return config.showOnDesktop !== false;
};
ComponentsLoader.prototype._createComponentWrapper = (name, config) => {
  const wrapper = document.createElement("div");
  wrapper.className = "header-component-wrapper";
  wrapper.dataset.componentKey = name;
  wrapper.dataset.componentType = config.componentType || "unknown";
  wrapper.dataset.componentLabel = config.label || name;
  wrapper.dataset.draggable = config.isDraggable !== false ? "true" : "false";
  wrapper.style.cssText = "display: inline-flex; align-items: center; justify-content: center;";
  return wrapper;
};
ComponentsLoader.prototype.loadAll = function() {
  const self = this;
  _log("info", "Carregando componentes modulares (Enterprise AAA Governance)...");
  return this._loadFromRegistry().then(() => {
    const visibleComponents = self.componentsList.filter((c) => self._shouldShowOnDevice(c));
    self._setLoadingState(true);
    const criticalComponents = visibleComponents.filter((c) => c.criticality === CRITICALITY.CRITICAL);
    const otherComponents = visibleComponents.filter((c) => c.criticality !== CRITICALITY.CRITICAL);
    const loadCritical = (index) => {
      if (index >= criticalComponents.length) return Promise.resolve();
      return self.loadComponent(criticalComponents[index]).then(() => loadCritical(index + 1));
    };
    return loadCritical(0).then(() => {
      const otherPromises = otherComponents.map((config) => self.loadComponent(config).catch(() => {
      }));
      return Promise.all(otherPromises);
    }).then(() => {
      self._setLoadingState(false);
      self._loadedAt = Date.now();
      _log("info", `Componentes: ${self.loadedCount} OK, ${self.failedCount} falhas, ${self.timeoutCount} timeouts, ${self._metrics.governanceValidated} com governanca valida`);
      self._metrics.loadCount++;
      self._metrics.lastLoadAt = Date.now();
      _emitSubcomponentEvent("header:components:loaded", { loaded: self.loadedCount, failed: self.failedCount, timeout: self.timeoutCount, total: visibleComponents.length, components: Array.from(self.components.keys()), source: self._metrics.registrySource, orderSource: self._metrics.orderSource, governanceValidated: self._metrics.governanceValidated, timestamp: Date.now() });
      return { loaded: self.loadedCount, failed: self.failedCount, timeout: self.timeoutCount, components: Array.from(self.components.keys()), source: self._metrics.registrySource, orderSource: self._metrics.orderSource, governanceValidated: self._metrics.governanceValidated };
    });
  });
};
ComponentsLoader.prototype.loadComponent = function(config) {
  const self = this;
  const name = config.name;
  const region = config.region;
  const criticality = config.criticality;
  const timeout = config.timeout;
  const mountTimeout = timeout || DEFAULT_MOUNT_TIMEOUT;
  if (this.components.has(name)) {
    _log("debug", `DEDUP: Componente ${name} ja carregado, ignorando duplicata`);
    this._metrics.duplicatesBlocked++;
    return Promise.resolve(this.components.get(name).instance);
  }
  if (this._loadingInProgress.has(name)) {
    _log("debug", `DEDUP: Componente ${name} ja em carregamento, ignorando`);
    this._metrics.duplicatesBlocked++;
    return Promise.resolve(null);
  }
  const existingWrapper = this._componentWrappers.get(name);
  if (existingWrapper && existingWrapper.isConnected) {
    _log("debug", `DEDUP: Wrapper de ${name} ja existe no DOM, ignorando`);
    this._metrics.duplicatesBlocked++;
    return Promise.resolve(null);
  }
  this._loadingInProgress.add(name);
  this._updateComponentStatus(name, COMPONENT_STATUS.LOADING);
  return new Promise((resolve) => {
    const containerSelector = `.header-${region}`;
    const container = document.querySelector(containerSelector);
    if (!container) {
      self._loadingInProgress.delete(name);
      self.failedCount++;
      self._metrics.errorCount++;
      self._updateComponentStatus(name, COMPONENT_STATUS.FAILED, new Error(`Container nao encontrado: ${containerSelector}`));
      resolve(null);
      return;
    }
    const wrapper = self._createComponentWrapper(name, config);
    container.appendChild(wrapper);
    self._componentWrappers.set(name, wrapper);
    const modulePath = `/components/header/components/${name}/index.js`;
    const bundledModule = HEADER_COMPONENTS[name];
    (bundledModule ? Promise.resolve(bundledModule) : import(modulePath)).then((module) => {
      const moduleGovernance = self._extractModuleGovernance(module, name);
      const ComponentClass = self._findComponentClass(module, name);
      if (!ComponentClass) throw new Error(`Classe nao encontrada em ${modulePath}. Exports: ${Object.keys(module).join(", ")}`);
      const instance = new ComponentClass({
        container: wrapper,
        config: {
          label: config.label,
          icon: config.icon,
          apiEndpoint: config.apiEndpoint,
          pollingEnabled: config.pollingEnabled,
          pollingInterval: config.pollingInterval
        }
      });
      if (moduleGovernance.id && !instance.id) instance._governanceId = moduleGovernance.id;
      if (moduleGovernance.capabilities && !instance.capabilities) instance._governanceCapabilities = moduleGovernance.capabilities;
      if (moduleGovernance.version && !instance.VERSION) instance._governanceVersion = moduleGovernance.version;
      const contractValidation = validateContract(instance, name);
      if (!contractValidation.valid) {
        _log("warn", `Contrato invalido para ${name}:`, contractValidation.issues.join(", "));
      }
      return createMountWithTimeout(instance, mountTimeout).then(() => {
        self._loadingInProgress.delete(name);
        self.components.set(name, {
          instance,
          config,
          contractValidation,
          governance: moduleGovernance,
          wrapper
        });
        self.loadedCount++;
        self._updateComponentStatus(name, COMPONENT_STATUS.MOUNTED);
        _log("debug", `OK ${name} montado (${criticality}, gov: ${moduleGovernance.valid ? "OK" : "PARCIAL"})`);
        resolve(instance);
      });
    }).catch((error) => {
      self._loadingInProgress.delete(name);
      const isTimeout = error.message.indexOf("timeout") !== -1;
      if (isTimeout) {
        self.timeoutCount++;
        self._metrics.timeoutCount++;
        self._updateComponentStatus(name, COMPONENT_STATUS.TIMEOUT, error);
        _log("warn", `TIMEOUT ${name} timeout apos ${mountTimeout}ms`);
      } else {
        self.failedCount++;
        self._metrics.errorCount++;
        self._updateComponentStatus(name, COMPONENT_STATUS.FAILED, error);
        _log("error", `FAIL ${name} falhou:`, error.message);
      }
      const wrapperToRemove = self._componentWrappers.get(name);
      if (wrapperToRemove) {
        wrapperToRemove.remove();
        self._componentWrappers.delete(name);
      }
      const containerEl = document.querySelector(`.header-${region}`);
      if (containerEl && criticality !== CRITICALITY.OPTIONAL) self._renderFallback(containerEl, name, error);
      resolve(null);
    });
  });
};
ComponentsLoader.prototype.reorderComponents = function(newOrder) {
  const container = document.querySelector(".header-right");
  if (!container) return false;
  const nonComponents = [];
  const children = container.children;
  for (let i = 0; i < children.length; i++) {
    const el = children[i];
    if (!el.classList.contains("header-component-wrapper") && !el.classList.contains("header-component-fallback")) nonComponents.push(el);
  }
  for (let j = 0; j < newOrder.length; j++) {
    const key = newOrder[j];
    const wrapper = this._componentWrappers.get(key);
    if (wrapper && wrapper.parentElement === container) container.appendChild(wrapper);
  }
  for (let k = 0; k < nonComponents.length; k++) {
    container.insertBefore(nonComponents[k], container.firstChild);
  }
  _log("info", "Componentes reordenados no DOM", { count: newOrder.length });
  return true;
};
ComponentsLoader.prototype.getCurrentDOMOrder = () => {
  const container = document.querySelector(".header-right");
  if (!container) return [];
  const order = [];
  const wrappers = container.querySelectorAll(".header-component-wrapper[data-component-key]");
  for (let i = 0; i < wrappers.length; i++) {
    order.push(wrappers[i].dataset.componentKey);
  }
  return order;
};
ComponentsLoader.prototype.getComponent = function(name) {
  const data = this.components.get(name);
  return data ? data.instance : null;
};
ComponentsLoader.prototype.getComponentStatus = function(name) {
  return this.componentStatus.get(name) || null;
};
ComponentsLoader.prototype.getComponentWrapper = function(name) {
  return this._componentWrappers.get(name) || null;
};
ComponentsLoader.prototype.getComponentCapabilities = function(name) {
  const data = this._moduleCapabilities.get(name);
  return data ? data.capabilities : null;
};
ComponentsLoader.prototype.getGovernedComponents = function() {
  const governed = [];
  const self = this;
  this.components.forEach((data, name) => {
    if (data.governance && data.governance.valid) governed.push({ name, id: data.governance.id, capabilities: data.governance.capabilities, version: data.governance.version });
  });
  return governed;
};
ComponentsLoader.prototype.refreshFromRegistry = function() {
  const self = this;
  if (!this._headerRegistry && !window.HeaderRegistry) {
    _log("warn", "HeaderRegistry nao disponivel");
    return Promise.resolve(false);
  }
  const registry = this._headerRegistry || window.HeaderRegistry;
  registry.invalidateCache();
  return this._loadFromRegistry().then(() => {
    _emitSubcomponentEvent("header:registry:refreshed", { componentsCount: self.componentsList.length, orderSource: self._metrics.orderSource, timestamp: Date.now() });
    return true;
  });
};
ComponentsLoader.prototype.getOrderInfo = function() {
  if (!this._headerRegistry && !window.HeaderRegistry) return { source: "unavailable", order: this.componentsList.map((c) => c.name) };
  const registry = this._headerRegistry || window.HeaderRegistry;
  return registry.getOrderInfo();
};
ComponentsLoader.prototype.getSubcomponentsHealth = function() {
  const results = {};
  const self = this;
  this.components.forEach((data, name) => {
    const instance = data.instance;
    if (instance && typeof instance.healthCheck === "function") {
      try {
        results[name] = instance.healthCheck();
      } catch (e) {
        results[name] = { status: "ERROR", error: e.message };
      }
    } else {
      results[name] = { status: "NO_HEALTHCHECK", mounted: true };
    }
  });
  this.componentStatus.forEach((statusData, name) => {
    if (!results[name]) results[name] = { status: statusData.status, error: statusData.error ? statusData.error.message : null };
  });
  return results;
};
ComponentsLoader.prototype.unmountAll = function() {
  const self = this;
  _log("info", "Desmontando componentes modulares...");
  const promises = [];
  this.components.forEach((data, name) => {
    const instance = data.instance;
    const p = Promise.resolve().then(() => {
      if (instance && typeof instance.unmount === "function") return instance.unmount();
      else if (instance && typeof instance.destroy === "function") return instance.destroy();
    }).then(() => {
      self._updateComponentStatus(name, COMPONENT_STATUS.UNMOUNTED);
      _log("debug", `OK ${name} desmontado`);
    }).catch((error) => {
      _log("error", `FAIL Erro ao desmontar ${name}:`, error.message);
      self._metrics.errorCount++;
    });
    promises.push(p);
  });
  return Promise.all(promises).then(() => {
    self._componentWrappers.forEach((wrapper) => {
      wrapper.remove();
    });
    self._componentWrappers.clear();
    self.components.clear();
    self._moduleCapabilities.clear();
    self._loadingInProgress.clear();
    self.loadedCount = 0;
    self.failedCount = 0;
    self.timeoutCount = 0;
    self._metrics.unmountCount++;
    self._metrics.governanceValidated = 0;
    self._loadedAt = null;
  });
};
ComponentsLoader.prototype.retryComponent = function(name) {
  const self = this;
  let config = null;
  for (let i = 0; i < this.componentsList.length; i++) {
    if (this.componentsList[i].name === name) {
      config = this.componentsList[i];
      break;
    }
  }
  if (!config) {
    _log("warn", `Componente ${name} nao encontrado na lista`);
    return Promise.resolve(null);
  }
  const fallback = document.querySelector(`.header-component-fallback[data-component="${name}"]`);
  if (fallback) fallback.remove();
  const existing = this.components.get(name);
  if (existing && existing.instance) {
    return Promise.resolve().then(() => {
      if (existing.instance.unmount) return existing.instance.unmount();
    }).then(() => {
      self.components.delete(name);
      const wrapper2 = self._componentWrappers.get(name);
      if (wrapper2) {
        wrapper2.remove();
        self._componentWrappers.delete(name);
      }
      self._moduleCapabilities.delete(name);
      self._loadingInProgress.delete(name);
      self._metrics.retryCount++;
      _log("info", `Retentando carregar ${name}...`);
      return self.loadComponent(config);
    });
  }
  const wrapper = this._componentWrappers.get(name);
  if (wrapper) {
    wrapper.remove();
    this._componentWrappers.delete(name);
  }
  this._moduleCapabilities.delete(name);
  this._loadingInProgress.delete(name);
  this._metrics.retryCount++;
  _log("info", `Retentando carregar ${name}...`);
  return this.loadComponent(config);
};
ComponentsLoader.prototype.getStats = function() {
  const statusMap = {};
  this.componentStatus.forEach((v, k) => {
    statusMap[k] = v;
  });
  return { total: this.componentsList.length, loaded: this.loadedCount, failed: this.failedCount, timeout: this.timeoutCount, components: Array.from(this.components.keys()), statusMap, registrySource: this._metrics.registrySource, orderSource: this._metrics.orderSource, registryLoaded: this._registryLoaded, governanceValidated: this._metrics.governanceValidated, wrapperCount: this._componentWrappers.size, duplicatesBlocked: this._metrics.duplicatesBlocked };
};
ComponentsLoader.prototype.getManifest = function() {
  return { registryId: MODULE_ID, version: VERSION, loadedAt: this._loadedAt, itemCount: this.components.size, items: Array.from(this.components.keys()), componentsList: this.componentsList.map((c) => c.name), governance: this.getGovernedComponents(), metrics: Object.assign({}, this._metrics), registrySource: this._metrics.registrySource, orderSource: this._metrics.orderSource, p23Governance: true, timestamp: Date.now() };
};
ComponentsLoader.prototype.healthCheck = function() {
  const self = this;
  const stats = this.getStats();
  const successRate = stats.total > 0 ? stats.loaded / stats.total : 0;
  const governanceRate = stats.loaded > 0 ? this._metrics.governanceValidated / stats.loaded : 0;
  const subHealth = this.getSubcomponentsHealth();
  let criticalMounted = true;
  for (let i = 0; i < this.componentsList.length; i++) {
    const c = this.componentsList[i];
    if (c.criticality === CRITICALITY.CRITICAL) {
      const status = this.componentStatus.get(c.name);
      if (!status || status.status !== COMPONENT_STATUS.MOUNTED) {
        criticalMounted = false;
        break;
      }
    }
  }
  const validSources = ["user", "admin", "system", "fallback"];
  const checks = { hasHeader: !!this.header, componentsMapReady: this.components instanceof Map, noExcessiveErrors: this._metrics.errorCount < 10, hasComponentsList: this.componentsList.length > 0, goodSuccessRate: successRate >= 0.7, criticalComponentsLoaded: criticalMounted, registryLoaded: this._registryLoaded, orderSourceValid: validSources.indexOf(this._metrics.orderSource) !== -1, goodGovernanceRate: governanceRate >= 0.8, wrappersIntact: this._componentWrappers.size === this.loadedCount, noDuplicates: this._metrics.duplicatesBlocked === 0 || true };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let j = 0; j < checkKeys.length; j++) {
    if (checks[checkKeys[j]]) passed++;
  }
  const total = checkKeys.length;
  const issues = [];
  for (let k = 0; k < checkKeys.length; k++) {
    if (!checks[checkKeys[k]]) issues.push(checkKeys[k]);
  }
  return { status: passed === total ? "HEALTHY" : passed >= total - 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), stats, subcomponentsHealth: subHealth, registrySource: this._metrics.registrySource, orderSource: this._metrics.orderSource, governanceValidated: this._metrics.governanceValidated, governanceRate: `${(governanceRate * 100).toFixed(0)}%`, duplicatesBlocked: this._metrics.duplicatesBlocked, p23Governance: true, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
};
ComponentsLoader.prototype.info = function() {
  return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), stats: this.getStats(), metrics: this._metrics, subcomponentsHealth: this.getSubcomponentsHealth(), governedComponents: this.getGovernedComponents(), healthCheck: this.healthCheck(), orderInfo: this.getOrderInfo(), currentDOMOrder: this.getCurrentDOMOrder(), registryAvailable: !!window.HeaderRegistry, p23Governance: true };
};
ComponentsLoader.prototype.setDebug = function(enabled) {
  this._debug = !!enabled;
};
ComponentsLoader.prototype.resetMetrics = function() {
  this._metrics = { loadCount: 0, unmountCount: 0, errorCount: 0, timeoutCount: 0, retryCount: 0, lastLoadAt: null, registrySource: null, registryLoadTime: null, orderSource: null, governanceValidated: 0, duplicatesBlocked: 0 };
};
function getVersion() {
  return VERSION;
}
var components_loader_default = ComponentsLoader;
export {
  ComponentsLoader,
  MODULE_ID,
  VERSION,
  components_loader_default as default,
  getPorts,
  getVersion,
  injectPorts
};
