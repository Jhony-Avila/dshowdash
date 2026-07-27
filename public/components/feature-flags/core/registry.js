const VERSION = "2.3.0-P2-ENTERPRISE";
const MODULE_ID = "components.feature-flags.core.registry";
const _flags = /* @__PURE__ */ new Map();
function register(key, config) {
  const flagConfig = {
    enabled: config?.enabled ?? false,
    percentage: config?.percentage ?? 100,
    variant: config?.variant ?? null,
    value: config?.value ?? null,
    metadata: config?.metadata ?? {},
    registeredAt: Date.now(),
    updatedAt: Date.now()
  };
  _flags.set(key, flagConfig);
  return true;
}
function unregister(key) {
  return _flags.delete(key);
}
function get(key) {
  return _flags.get(key);
}
function has(key) {
  return _flags.has(key);
}
function list() {
  return Array.from(_flags.keys());
}
function getAll() {
  const result = {};
  _flags.forEach((value, key) => {
    result[key] = { ...value };
  });
  return result;
}
function clear() {
  _flags.clear();
}
function enable(key) {
  const flag = _flags.get(key);
  if (!flag) {
    register(key, { enabled: true });
    return true;
  }
  flag.enabled = true;
  flag.updatedAt = Date.now();
  _flags.set(key, flag);
  return true;
}
function disable(key) {
  const flag = _flags.get(key);
  if (!flag) {
    register(key, { enabled: false });
    return true;
  }
  flag.enabled = false;
  flag.updatedAt = Date.now();
  _flags.set(key, flag);
  return true;
}
function update(key, config) {
  const flag = _flags.get(key);
  if (!flag) {
    return register(key, config);
  }
  const updated = {
    ...flag,
    ...config,
    updatedAt: Date.now()
  };
  _flags.set(key, updated);
  return true;
}
function setPercentage(key, percentage) {
  const flag = _flags.get(key);
  const safePercentage = Math.max(0, Math.min(100, percentage));
  if (!flag) {
    register(key, { enabled: true, percentage: safePercentage });
    return true;
  }
  flag.percentage = safePercentage;
  flag.updatedAt = Date.now();
  _flags.set(key, flag);
  return true;
}
function healthCheck() {
  const checks = {
    registryExists: true,
    hasFlagsMap: _flags instanceof Map
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    flagCount: _flags.size,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    flagCount: _flags.size,
    flags: list(),
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
const FlagRegistry = {
  register,
  unregister,
  get,
  has,
  list,
  getAll,
  clear,
  enable,
  disable,
  update,
  setPercentage,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
var registry_default = FlagRegistry;
export {
  FlagRegistry,
  MODULE_ID,
  VERSION,
  clear,
  registry_default as default,
  disable,
  enable,
  get,
  getAll,
  has,
  healthCheck,
  info,
  list,
  register,
  setPercentage,
  unregister,
  update
};
