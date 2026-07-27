const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/components/_base/IComponent";
const IComponentSpec = {
  requiredProperties: ["id", "VERSION"],
  recommendedProperties: ["MODULE_ID", "capabilities"],
  requiredMethods: ["mount", "unmount"],
  recommendedMethods: ["healthCheck", "info", "destroy"],
  optionalMethods: ["refresh", "reset", "configure", "getState", "setState"],
  defaultCapabilities: {
    reorderable: true,
    hideable: true,
    critical: false,
    refreshable: false,
    configurable: false
  }
};
function validateInterface(instance, componentName) {
  componentName = componentName || "unknown";
  const errors = [];
  const warnings = [];
  const compliance = {
    requiredProperties: 0,
    requiredPropertiesTotal: IComponentSpec.requiredProperties.length,
    recommendedProperties: 0,
    recommendedPropertiesTotal: IComponentSpec.recommendedProperties.length,
    requiredMethods: 0,
    requiredMethodsTotal: IComponentSpec.requiredMethods.length,
    recommendedMethods: 0,
    recommendedMethodsTotal: IComponentSpec.recommendedMethods.length
  };
  if (!instance) {
    errors.push("Inst\xE2ncia \xE9 null ou undefined");
    return { valid: false, errors, warnings, compliance };
  }
  IComponentSpec.requiredProperties.forEach((prop) => {
    if (instance[prop] === void 0 || instance[prop] === null) {
      errors.push(`Propriedade obrigat\xF3ria ausente: ${prop}`);
    } else {
      compliance.requiredProperties++;
    }
  });
  IComponentSpec.recommendedProperties.forEach((prop) => {
    if (instance[prop] === void 0 || instance[prop] === null) {
      warnings.push(`Propriedade recomendada ausente: ${prop}`);
    } else {
      compliance.recommendedProperties++;
    }
  });
  IComponentSpec.requiredMethods.forEach((method) => {
    if (typeof instance[method] !== "function") {
      errors.push(`M\xE9todo obrigat\xF3rio ausente: ${method}()`);
    } else {
      compliance.requiredMethods++;
    }
  });
  IComponentSpec.recommendedMethods.forEach((method) => {
    if (typeof instance[method] !== "function") {
      warnings.push(`M\xE9todo recomendado ausente: ${method}()`);
    } else {
      compliance.recommendedMethods++;
    }
  });
  const totalRequired = Number(compliance.requiredPropertiesTotal) + Number(compliance.requiredMethodsTotal);
  const totalRecommended = Number(compliance.recommendedPropertiesTotal) + Number(compliance.recommendedMethodsTotal);
  const metRequired = Number(compliance.requiredProperties) + Number(compliance.requiredMethods);
  const metRecommended = Number(compliance.recommendedProperties) + Number(compliance.recommendedMethods);
  compliance.requiredScore = totalRequired > 0 ? `${(metRequired / totalRequired * 100).toFixed(0)}%` : "100%";
  compliance.recommendedScore = totalRecommended > 0 ? `${(metRecommended / totalRecommended * 100).toFixed(0)}%` : "100%";
  compliance.overallScore = `${((metRequired + metRecommended) / (totalRequired + totalRecommended) * 100).toFixed(0)}%`;
  return {
    valid: errors.length === 0,
    // @ts-expect-error strict migration — TS7005
    errors,
    // @ts-expect-error strict migration — TS7005
    warnings,
    compliance,
    componentName,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function createComponentBase(config) {
  config = config || {};
  function ComponentBase(options) {
    options = options || {};
    this.id = config.id || options.id || `component-${Date.now()}`;
    this.VERSION = config.version || "1.0.0";
    this.MODULE_ID = config.moduleId || `header/components/${this.id}`;
    this.capabilities = Object.assign({}, IComponentSpec.defaultCapabilities, config.capabilities);
    this._mounted = false;
    this._container = null;
    this._abortController = null;
    this._state = {};
  }
  ComponentBase.prototype.mount = function(container) {
    const self = this;
    if (this._mounted) {
      return Promise.resolve();
    }
    this._container = container;
    this._abortController = new AbortController();
    return Promise.resolve().then(() => {
      self._mounted = true;
      return self;
    });
  };
  ComponentBase.prototype.unmount = function() {
    if (!this._mounted) {
      return;
    }
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._mounted = false;
    this._container = null;
  };
  ComponentBase.prototype.healthCheck = function() {
    const checks = {
      mounted: this._mounted,
      hasContainer: !!this._container,
      hasId: !!this.id,
      hasVersion: !!this.VERSION
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      checks,
      version: this.VERSION,
      moduleId: this.MODULE_ID,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    };
  };
  ComponentBase.prototype.info = function() {
    return {
      id: this.id,
      version: this.VERSION,
      moduleId: this.MODULE_ID,
      mounted: this._mounted,
      capabilities: this.capabilities,
      healthCheck: this.healthCheck()
    };
  };
  ComponentBase.prototype.destroy = function() {
    this.unmount();
    this._state = {};
  };
  ComponentBase.prototype.refresh = () => Promise.resolve();
  ComponentBase.prototype.reset = function() {
    this._state = {};
  };
  ComponentBase.prototype.configure = (options) => {
  };
  ComponentBase.prototype.getState = function() {
    return Object.assign({}, this._state);
  };
  ComponentBase.prototype.setState = function(newState) {
    this._state = Object.assign({}, this._state, newState);
  };
  return ComponentBase;
}
var IComponent_default = {
  VERSION,
  MODULE_ID,
  IComponentSpec,
  validateInterface,
  createComponentBase
};
export {
  IComponentSpec,
  MODULE_ID,
  VERSION,
  createComponentBase,
  IComponent_default as default,
  validateInterface
};
