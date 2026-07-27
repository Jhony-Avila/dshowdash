const VERSION = "2.2.0-ENTERPRISE-AAA";
const MODULE_ID = "header/components/_base/contract";
const REQUIRED_METHODS = ["mount", "unmount"];
const RECOMMENDED_METHODS = ["healthCheck", "info", "destroy"];
const REQUIRED_PROPERTIES = ["VERSION", "id"];
const RECOMMENDED_PROPERTIES = ["MODULE_ID", "capabilities"];
const DEFAULT_CAPABILITIES = {
  reorderable: true,
  hideable: true,
  critical: false,
  refreshable: false,
  configurable: false
};
const DEFAULT_MOUNT_TIMEOUT = 5e3;
const CRITICALITY = {
  CRITICAL: "critical",
  IMPORTANT: "important",
  OPTIONAL: "optional"
};
const COMPONENT_STATUS = {
  PENDING: "pending",
  LOADING: "loading",
  MOUNTED: "mounted",
  DEGRADED: "DEGRADED",
  FAILED: "failed",
  UNMOUNTED: "unmounted",
  TIMEOUT: "timeout"
};
function validateContract(instance, componentName = "unknown") {
  const issues = [];
  const warnings = [];
  for (const method of REQUIRED_METHODS) {
    if (typeof instance[method] !== "function") {
      issues.push(`Missing required method: ${method}()`);
    }
  }
  for (const method of RECOMMENDED_METHODS) {
    if (typeof instance[method] !== "function") {
      warnings.push(`Missing recommended method: ${method}()`);
    }
  }
  const hasVersion = instance.VERSION || instance._governanceVersion || instance.constructor?.VERSION;
  if (!hasVersion) {
    issues.push("Missing required property: VERSION");
  }
  const hasId = instance.id || instance._governanceId || instance.constructor?.id || instance.componentId;
  if (!hasId) {
    warnings.push("Missing property: id (required for governance)");
  }
  const hasCapabilities = instance.capabilities || instance._governanceCapabilities || instance.constructor?.capabilities;
  if (!hasCapabilities) {
    warnings.push("Missing property: capabilities (using defaults)");
  }
  return {
    valid: issues.length === 0,
    issues,
    warnings,
    componentName,
    compliance: {
      required: REQUIRED_METHODS.length - issues.filter((i) => i.includes("required method")).length,
      requiredTotal: REQUIRED_METHODS.length,
      recommended: RECOMMENDED_METHODS.length - warnings.filter((w) => w.includes("recommended")).length,
      recommendedTotal: RECOMMENDED_METHODS.length
    },
    governance: {
      hasId: !!hasId,
      hasVersion: !!hasVersion,
      hasCapabilities: !!hasCapabilities,
      capabilities: hasCapabilities || DEFAULT_CAPABILITIES
    }
  };
}
function resolveCapabilities(instance) {
  const explicit = instance.capabilities || instance._governanceCapabilities || instance.constructor?.capabilities;
  return { ...DEFAULT_CAPABILITIES, ...explicit };
}
function canReorder(instance) {
  const caps = resolveCapabilities(instance);
  return caps.reorderable && !caps.critical;
}
function canHide(instance) {
  const caps = resolveCapabilities(instance);
  return caps.hideable && !caps.critical;
}
function createMountWithTimeout(instance, timeoutMs = DEFAULT_MOUNT_TIMEOUT) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Mount timeout after ${timeoutMs}ms`));
    }, timeoutMs);
    Promise.resolve(instance.mount()).then((result) => {
      clearTimeout(timer);
      resolve(result);
    }).catch((error) => {
      clearTimeout(timer);
      reject(error);
    });
  });
}
function createFallbackHTML(componentName, error = null) {
  const safeError = error ? String(error).substring(0, 50) : "Erro desconhecido";
  return `<div class="header-component-fallback" data-component="${componentName}" data-status="failed" title="${safeError}">
    <span class="fallback-icon">\u26A0</span>
  </div>`;
}
function createLoadingHTML(componentName) {
  return `<div class="header-component-loading" data-component="${componentName}" data-status="loading">
    <span class="loading-pulse"></span>
  </div>`;
}
var contract_default = {
  VERSION,
  MODULE_ID,
  REQUIRED_METHODS,
  RECOMMENDED_METHODS,
  REQUIRED_PROPERTIES,
  RECOMMENDED_PROPERTIES,
  DEFAULT_CAPABILITIES,
  DEFAULT_MOUNT_TIMEOUT,
  CRITICALITY,
  COMPONENT_STATUS,
  validateContract,
  resolveCapabilities,
  canReorder,
  canHide,
  createMountWithTimeout,
  createFallbackHTML,
  createLoadingHTML
};
export {
  COMPONENT_STATUS,
  CRITICALITY,
  DEFAULT_CAPABILITIES,
  DEFAULT_MOUNT_TIMEOUT,
  MODULE_ID,
  RECOMMENDED_METHODS,
  RECOMMENDED_PROPERTIES,
  REQUIRED_METHODS,
  REQUIRED_PROPERTIES,
  VERSION,
  canHide,
  canReorder,
  createFallbackHTML,
  createLoadingHTML,
  createMountWithTimeout,
  contract_default as default,
  resolveCapabilities,
  validateContract
};
