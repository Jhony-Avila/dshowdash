import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-P17WI";
const MODULE_ID = "router.core.ab-testing";
const hasWindow = typeof window !== "undefined";
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
function _log(level, msg, ctx = {}) {
  const logger = _getPort("logger");
  if (!logger || typeof logger[level] !== "function") return;
  logger[level](msg, { component: MODULE_ID, ...ctx });
}
const _experiments = /* @__PURE__ */ new Map();
const _userAssignments = /* @__PURE__ */ new Map();
const _results = /* @__PURE__ */ new Map();
let _config = {
  enabled: true,
  persistAssignments: true,
  storageKey: "router_ab_assignments",
  trackingEnabled: true,
  defaultVariant: "control"
};
const _metrics = {
  totalExperiments: 0,
  activeExperiments: 0,
  totalAssignments: 0,
  totalConversions: 0
};
function createExperiment(experimentId, config = {}) {
  _initPorts();
  const experiment = {
    id: experimentId,
    name: config.name || experimentId,
    description: config.description || "",
    status: config.status || "draft",
    variants: config.variants || [
      { id: "control", name: "Control", weight: 50 },
      { id: "treatment", name: "Treatment", weight: 50 }
    ],
    targetRoutes: config.targetRoutes || [],
    targetUsers: config.targetUsers || null,
    excludeUsers: config.excludeUsers || [],
    startDate: config.startDate || null,
    endDate: config.endDate || null,
    sampleSize: config.sampleSize || 100,
    goals: config.goals || [],
    metadata: config.metadata || {},
    createdAt: Date.now(),
    updatedAt: Date.now()
  };
  const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
  if (totalWeight !== 100) {
    _log("warn", "Variant weights do not sum to 100", { experimentId, totalWeight });
  }
  _experiments.set(experimentId, experiment);
  _results.set(experimentId, { variants: {}, conversions: {}, impressions: {} });
  _metrics.totalExperiments = _experiments.size;
  _log("info", "Experiment created", { experimentId });
  return experiment;
}
function updateExperiment(experimentId, updates = {}) {
  const experiment = _experiments.get(experimentId);
  if (!experiment) {
    _log("warn", "Experiment not found", { experimentId });
    return null;
  }
  Object.assign(experiment, updates, { updatedAt: Date.now() });
  return experiment;
}
function startExperiment(experimentId) {
  return updateExperiment(experimentId, { status: "running", startDate: Date.now() });
}
function pauseExperiment(experimentId) {
  return updateExperiment(experimentId, { status: "paused" });
}
function stopExperiment(experimentId) {
  return updateExperiment(experimentId, { status: "stopped", endDate: Date.now() });
}
function deleteExperiment(experimentId) {
  _experiments.delete(experimentId);
  _results.delete(experimentId);
  _metrics.totalExperiments = _experiments.size;
}
function getExperiment(experimentId) {
  return _experiments.get(experimentId) || null;
}
function getAllExperiments() {
  return Array.from(_experiments.values());
}
function getActiveExperiments() {
  return Array.from(_experiments.values()).filter((e) => e.status === "running");
}
function assignVariant(experimentId, userId = null) {
  const experiment = _experiments.get(experimentId);
  if (!experiment || experiment.status !== "running") {
    return { variant: _config.defaultVariant, assigned: false };
  }
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  if (_userAssignments.has(assignmentKey)) {
    return { variant: _userAssignments.get(assignmentKey), assigned: false, cached: true };
  }
  if (experiment.excludeUsers?.includes(userKey)) {
    return { variant: _config.defaultVariant, assigned: false, excluded: true };
  }
  if (experiment.targetUsers && !experiment.targetUsers.includes(userKey)) {
    return { variant: _config.defaultVariant, assigned: false, notTargeted: true };
  }
  const variant = _selectVariant(experiment.variants, userKey, experimentId);
  _userAssignments.set(assignmentKey, variant);
  _metrics.totalAssignments++;
  _trackImpression(experimentId, variant);
  if (_config.persistAssignments) {
    _saveAssignments();
  }
  _log("debug", "Variant assigned", { experimentId, userId: userKey, variant });
  return { variant, assigned: true };
}
function _selectVariant(variants, userKey, experimentId) {
  const hash = _hashString(`${userKey}:${experimentId}`);
  const bucket = hash % 100;
  let cumulative = 0;
  for (const variant of variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.id;
    }
  }
  return variants[0]?.id || _config.defaultVariant;
}
function getAssignment(experimentId, userId = null) {
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  return _userAssignments.get(assignmentKey) || null;
}
function clearAssignment(experimentId, userId = null) {
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  _userAssignments.delete(assignmentKey);
  _saveAssignments();
}
function resolveRouteVariant(routeId, userId = null) {
  const activeExperiments = getActiveExperiments();
  for (const experiment of activeExperiments) {
    if (experiment.targetRoutes.includes(routeId)) {
      const { variant } = assignVariant(experiment.id, userId);
      const variantConfig = experiment.variants.find((v) => v.id === variant);
      if (variantConfig?.routeOverride?.[routeId]) {
        return {
          experimentId: experiment.id,
          variant,
          route: variantConfig.routeOverride[routeId]
        };
      }
      return { experimentId: experiment.id, variant, route: null };
    }
  }
  return null;
}
function _trackImpression(experimentId, variant) {
  const results = _results.get(experimentId);
  if (!results) return;
  if (!results.impressions[variant]) {
    results.impressions[variant] = 0;
  }
  results.impressions[variant]++;
}
function trackConversion(experimentId, goalId, userId = null, value = 1) {
  const experiment = _experiments.get(experimentId);
  if (!experiment) return false;
  const userKey = userId || _getAnonymousId();
  const assignmentKey = `${experimentId}:${userKey}`;
  const variant = _userAssignments.get(assignmentKey);
  if (!variant) {
    _log("warn", "No assignment for conversion", { experimentId, userId: userKey });
    return false;
  }
  const results = _results.get(experimentId);
  if (!results) return false;
  const conversionKey = `${variant}:${goalId}`;
  if (!results.conversions[conversionKey]) {
    results.conversions[conversionKey] = { count: 0, value: 0 };
  }
  results.conversions[conversionKey].count++;
  results.conversions[conversionKey].value += value;
  _metrics.totalConversions++;
  _log("debug", "Conversion tracked", { experimentId, goalId, variant, value });
  return true;
}
function getResults(experimentId) {
  const experiment = _experiments.get(experimentId);
  const results = _results.get(experimentId);
  if (!experiment || !results) return null;
  const variantResults = {};
  for (const variant of experiment.variants) {
    const impressions = results.impressions[variant.id] || 0;
    const conversions = {};
    for (const goal of experiment.goals) {
      const key = `${variant.id}:${goal.id}`;
      const data = results.conversions[key] || { count: 0, value: 0 };
      conversions[goal.id] = {
        ...data,
        rate: impressions > 0 ? `${(data.count / impressions * 100).toFixed(2)}%` : "0%"
      };
    }
    variantResults[variant.id] = {
      name: variant.name,
      weight: variant.weight,
      impressions,
      conversions
    };
  }
  return {
    experimentId,
    name: experiment.name,
    status: experiment.status,
    variants: variantResults,
    totalImpressions: Object.values(results.impressions).reduce((a, b) => a + b, 0),
    startDate: experiment.startDate,
    endDate: experiment.endDate
  };
}
function analyzeExperiment(experimentId, goalId) {
  const results = getResults(experimentId);
  if (!results) return null;
  const variants = Object.entries(results.variants);
  if (variants.length < 2) return { significantDifference: false };
  const control = results.variants.control;
  const treatment = results.variants.treatment;
  if (!control || !treatment) return { significantDifference: false };
  const controlRate = control.impressions > 0 ? control.conversions[goalId]?.count / control.impressions : 0;
  const treatmentRate = treatment.impressions > 0 ? treatment.conversions[goalId]?.count / treatment.impressions : 0;
  const lift = controlRate > 0 ? ((treatmentRate - controlRate) / controlRate * 100).toFixed(2) : 0;
  const minSampleSize = 100;
  const hasEnoughSamples = control.impressions >= minSampleSize && treatment.impressions >= minSampleSize;
  return {
    controlRate: `${(controlRate * 100).toFixed(2)}%`,
    treatmentRate: `${(treatmentRate * 100).toFixed(2)}%`,
    lift: `${lift}%`,
    winner: treatmentRate > controlRate ? "treatment" : "control",
    hasEnoughSamples,
    significantDifference: hasEnoughSamples && Math.abs(parseFloat(lift)) > 5
  };
}
function _saveAssignments() {
  if (typeof localStorage === "undefined") return;
  try {
    const data = Array.from(_userAssignments.entries());
    localStorage.setItem(_config.storageKey, JSON.stringify(data));
  } catch (e) {
  }
}
function loadAssignments() {
  if (typeof localStorage === "undefined") return 0;
  try {
    const data = localStorage.getItem(_config.storageKey);
    if (data) {
      const entries = JSON.parse(data);
      entries.forEach(([key, value]) => _userAssignments.set(key, value));
      return entries.length;
    }
  } catch (e) {
  }
  return 0;
}
function _getAnonymousId() {
  if (typeof localStorage === "undefined") return `anon_${Date.now()}`;
  let id = localStorage.getItem("ab_anonymous_id");
  if (!id) {
    id = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem("ab_anonymous_id", id);
  }
  return id;
}
function _hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
function getMetrics() {
  _metrics.activeExperiments = getActiveExperiments().length;
  return { ..._metrics };
}
function getStatus() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    enabled: _config.enabled,
    experiments: _experiments.size,
    activeExperiments: getActiveExperiments().length,
    assignments: _userAssignments.size,
    portsInitialized: Ports.isInitialized(),
    metrics: getMetrics()
  };
}
function healthCheck() {
  return {
    status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: Ports.isInitialized(),
    timestamp: Date.now()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    features: ["experiments", "variant-assignment", "conversion-tracking", "statistical-analysis", "persistence"],
    portsInitialized: Ports.isInitialized(),
    status: getStatus()
  };
}
loadAssignments();
var ab_testing_default = {
  VERSION,
  MODULE_ID,
  createExperiment,
  updateExperiment,
  startExperiment,
  pauseExperiment,
  stopExperiment,
  deleteExperiment,
  getExperiment,
  getAllExperiments,
  getActiveExperiments,
  assignVariant,
  getAssignment,
  clearAssignment,
  resolveRouteVariant,
  trackConversion,
  getResults,
  analyzeExperiment,
  loadAssignments,
  getMetrics,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  analyzeExperiment,
  assignVariant,
  clearAssignment,
  createExperiment,
  ab_testing_default as default,
  deleteExperiment,
  getActiveExperiments,
  getAllExperiments,
  getAssignment,
  getExperiment,
  getMetrics,
  getPorts,
  getResults,
  getStatus,
  healthCheck,
  info,
  injectPorts,
  loadAssignments,
  pauseExperiment,
  resolveRouteVariant,
  startExperiment,
  stopExperiment,
  trackConversion,
  updateExperiment
};
