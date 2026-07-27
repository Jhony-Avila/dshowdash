const VERSION = "1.0.1-P18EC";
const MODULE_ID = "intent-resolver";
const RESOLUTION_ACTIONS = Object.freeze({ NAVIGATE: "navigate", OPEN_PANEL: "openPanel", OPEN_MODAL: "openModal", OPEN_OVERLAY: "openOverlay", NOOP: "noop" });
const REGIONS = Object.freeze({ MAIN: "main", SIDE: "side", MODAL: "modal", OVERLAY: "overlay" });
const RESOLUTION_SOURCES = Object.freeze({ MANIFEST: "manifest", DB_OVERRIDE: "db-override", DEFAULT: "default", FALLBACK: "fallback" });
class IntentResolver {
  constructor(context = {}) {
    this._rules = context.rules || null;
    this._permissions = context.ports?.permissions || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._dbOverrides = /* @__PURE__ */ new Map();
    this._initialized = false;
    this._metrics = { resolved: 0, failed: 0, fallbacks: 0, denied: 0, cached: 0 };
    this._cache = /* @__PURE__ */ new Map();
    this._cacheMaxAge = 6e4;
  }
  init(rulesModule = null) {
    if (this._initialized) return this;
    if (rulesModule) this._rules = rulesModule;
    this._initialized = true;
    this._track("intent-resolver:init", { version: VERSION });
    this._emit("ui-orchestrator:resolver:ready", { version: VERSION });
    return this;
  }
  async resolve(intentId, context = {}) {
    if (!intentId) return this._fail("no-intent-id", "IntentId \xE9 obrigat\xF3rio");
    this._metrics.resolved++;
    const startTime = performance.now();
    const cached = this._getFromCache(intentId, context);
    if (cached) {
      this._metrics.cached++;
      this._track("intent-resolver:cache-hit", { intentId });
      return cached;
    }
    const dbOverride = this._dbOverrides.get(intentId);
    if (dbOverride) {
      const result = await this._resolveFromRule(dbOverride, context, RESOLUTION_SOURCES.DB_OVERRIDE);
      this._setCache(intentId, context, result);
      return result;
    }
    const rule = this._rules?.getRule?.(intentId);
    if (rule) {
      const result = await this._resolveFromRule(rule, context, RESOLUTION_SOURCES.MANIFEST);
      this._setCache(intentId, context, result);
      return result;
    }
    const fallbackResult = this._resolveByConvention(intentId, context);
    if (fallbackResult.success) {
      this._metrics.fallbacks++;
      this._track("intent-resolver:fallback", { intentId, target: fallbackResult.target?.id });
      this._setCache(intentId, context, fallbackResult);
      return fallbackResult;
    }
    this._metrics.failed++;
    const duration = performance.now() - startTime;
    this._track("intent-resolver:failed", { intentId, duration });
    return this._fail("no-rule-found", `Nenhuma regra encontrada para: ${intentId}`);
  }
  async _resolveFromRule(rule, context, source) {
    if (rule.requiresPermission) {
      const hasPermission = await this._checkPermission(rule.requiresPermission, context);
      if (!hasPermission) {
        this._metrics.denied++;
        this._track("intent-resolver:denied", { intentId: rule.intentId, permission: rule.requiresPermission });
        return this._fail("permission-denied", `Sem permiss\xE3o: ${rule.requiresPermission}`);
      }
    }
    if (rule.conditions && !this._evaluateConditions(rule.conditions, context)) return this._fail("conditions-not-met", "Condi\xE7\xF5es n\xE3o atendidas");
    const result = { success: true, action: rule.action || RESOLUTION_ACTIONS.NAVIGATE, target: { id: rule.targetId || rule.panelId || rule.route, region: rule.region || REGIONS.MAIN }, fallback: false, reason: null, meta: { resolvedFrom: source, version: VERSION, ruleId: rule.id || rule.intentId, timestamp: Date.now() } };
    this._track("intent-resolver:resolved", { intentId: rule.intentId, action: result.action, target: result.target.id, source });
    return result;
  }
  _resolveByConvention(intentId, context) {
    const parts = intentId.split(".");
    if (parts.length >= 3) {
      const [source, action, ...targetParts] = parts;
      const target = targetParts.join("-");
      if (action === "open" || action === "navigate") return { success: true, action: RESOLUTION_ACTIONS.NAVIGATE, target: { id: target, region: REGIONS.MAIN }, fallback: true, reason: "resolved-by-convention", meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, convention: `${source}.${action}.*`, timestamp: Date.now() } };
      if (action === "modal") return { success: true, action: RESOLUTION_ACTIONS.OPEN_MODAL, target: { id: target, region: REGIONS.MODAL }, fallback: true, reason: "resolved-by-convention", meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, timestamp: Date.now() } };
      if (action === "overlay") return { success: true, action: RESOLUTION_ACTIONS.OPEN_OVERLAY, target: { id: target, region: REGIONS.OVERLAY }, fallback: true, reason: "resolved-by-convention", meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, timestamp: Date.now() } };
    }
    if (intentId.includes(":")) {
      const [source, target] = intentId.split(":");
      if (target && !["bell", "help", "toggle-sidebar"].includes(target)) return { success: true, action: RESOLUTION_ACTIONS.NAVIGATE, target: { id: target, region: REGIONS.MAIN }, fallback: true, reason: "resolved-by-legacy-convention", meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, timestamp: Date.now() } };
    }
    return { success: false, reason: "no-convention-match" };
  }
  async _checkPermission(permission, context) {
    if (!this._permissions?.check) return true;
    try {
      return await this._permissions.check(permission, context);
    } catch (error) {
      this._track("intent-resolver:permission-error", { permission, error: error.message });
      return false;
    }
  }
  _evaluateConditions(conditions, context) {
    if (!conditions || typeof conditions !== "object") return true;
    for (const [key, expected] of Object.entries(conditions)) {
      const actual = context[key];
      if (actual !== expected) return false;
    }
    return true;
  }
  _getCacheKey(intentId, context) {
    const contextHash = context.userId || context.role || "default";
    return `${intentId}:${contextHash}`;
  }
  _getFromCache(intentId, context) {
    const key = this._getCacheKey(intentId, context);
    const cached = this._cache.get(key);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > this._cacheMaxAge) {
      this._cache.delete(key);
      return null;
    }
    return cached.result;
  }
  _setCache(intentId, context, result) {
    const key = this._getCacheKey(intentId, context);
    this._cache.set(key, { result, timestamp: Date.now() });
  }
  clearCache() {
    this._cache.clear();
    this._track("intent-resolver:cache-cleared", {});
  }
  _fail(reason, message) {
    return { success: false, action: RESOLUTION_ACTIONS.NOOP, target: null, fallback: false, reason, meta: { resolvedFrom: null, version: VERSION, error: message, timestamp: Date.now() } };
  }
  setOverride(intentId, rule) {
    this._dbOverrides.set(intentId, { ...rule, intentId });
    this.clearCache();
    this._track("intent-resolver:override-set", { intentId });
  }
  removeOverride(intentId) {
    const removed = this._dbOverrides.delete(intentId);
    if (removed) this.clearCache();
    return removed;
  }
  getOverrides() {
    return Array.from(this._dbOverrides.entries()).map(([id, rule]) => ({ intentId: id, ...rule }));
  }
  _emit(event, data = {}) {
    this._events?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
  }
  _track(event, data = {}) {
    this._telemetry?.track?.(event, data);
  }
  getMetrics() {
    return { ...this._metrics, cacheSize: this._cache.size };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, metrics: this.getMetrics(), overridesCount: this._dbOverrides.size, rulesLoaded: !!this._rules, hasPermissionsPort: !!this._permissions, cacheMaxAge: this._cacheMaxAge };
  }
  healthCheck() {
    const m = this._metrics;
    const checks = { initialized: this._initialized, rulesLoaded: !!this._rules, lowFailureRate: m.resolved > 0 ? m.failed / m.resolved < 0.1 : true };
    const passed = Object.values(checks).filter(Boolean).length;
    return { status: passed >= 2 ? "healthy" : passed >= 1 ? "degraded" : "unhealthy", score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID };
  }
  destroy() {
    this._cache.clear();
    this._dbOverrides.clear();
    this._initialized = false;
    this._track("intent-resolver:destroyed", {});
  }
}
function createIntentResolver(context) {
  return new IntentResolver(context);
}
let _instance = null;
function getIntentResolver() {
  if (!_instance) _instance = new IntentResolver();
  return _instance;
}
var intent_resolver_default = { IntentResolver, createIntentResolver, getIntentResolver, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES, VERSION, MODULE_ID };
export {
  IntentResolver,
  MODULE_ID,
  REGIONS,
  RESOLUTION_ACTIONS,
  RESOLUTION_SOURCES,
  VERSION,
  createIntentResolver,
  intent_resolver_default as default,
  getIntentResolver
};
