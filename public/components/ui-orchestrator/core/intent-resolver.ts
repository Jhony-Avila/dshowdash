// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.1-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: intent-resolver
// PURPOSE: IntentResolver - Resolutor Central de Intents P0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RESOLUTION_ACTIONS — exported value
//   REGIONS — exported value
//   RESOLUTION_SOURCES — exported value
//   createIntentResolver() — exported function
//   getIntentResolver() — exported function
//   IntentResolver — exported class
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.1-P18EC';
export const MODULE_ID = 'intent-resolver';

export const RESOLUTION_ACTIONS = Object.freeze({ NAVIGATE: 'navigate', OPEN_PANEL: 'openPanel', OPEN_MODAL: 'openModal', OPEN_OVERLAY: 'openOverlay', NOOP: 'noop' });
export const REGIONS = Object.freeze({ MAIN: 'main', SIDE: 'side', MODAL: 'modal', OVERLAY: 'overlay' });
export const RESOLUTION_SOURCES = Object.freeze({ MANIFEST: 'manifest', DB_OVERRIDE: 'db-override', DEFAULT: 'default', FALLBACK: 'fallback' });

export class IntentResolver {
  [key: string]: unknown;
  constructor(context: { rules?: unknown; ports?: { permissions?: unknown; events?: unknown; telemetry?: unknown } } & Record<string, unknown> = {}) {
    this._rules = context.rules || null;
    this._permissions = context.ports?.permissions || null;
    this._events = context.ports?.events || null;
    this._telemetry = context.ports?.telemetry || null;
    this._dbOverrides = new Map();
    this._initialized = false;
    this._metrics = { resolved: 0, failed: 0, fallbacks: 0, denied: 0, cached: 0 };
    this._cache = new Map();
    this._cacheMaxAge = 60000;
  }

  init(rulesModule: unknown = null): this { if (this._initialized) return this; if (rulesModule) this._rules = rulesModule; this._initialized = true; this._track('intent-resolver:init', { version: VERSION }); this._emit('ui-orchestrator:resolver:ready', { version: VERSION }); return this; }

  async resolve(intentId: string, context: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
    if (!intentId) return this._fail('no-intent-id', 'IntentId é obrigatório');
    (this._metrics as { resolved: number }).resolved++;
    const startTime = performance.now();
    const cached = this._getFromCache(intentId, context);
    if (cached) { (this._metrics as { cached: number }).cached++; this._track('intent-resolver:cache-hit', { intentId }); return cached as Record<string, unknown>; }
    const dbOverride = (this._dbOverrides as Map<string, unknown>).get(intentId);
    if (dbOverride) { const result = await this._resolveFromRule(dbOverride as Record<string, unknown>, context, RESOLUTION_SOURCES.DB_OVERRIDE); this._setCache(intentId, context, result); return result; }
    const rule = (this._rules as { getRule?: (id: string) => unknown } | null)?.getRule?.(intentId);
    if (rule) { const result = await this._resolveFromRule(rule as Record<string, unknown>, context, RESOLUTION_SOURCES.MANIFEST); this._setCache(intentId, context, result); return result; }
    const fallbackResult = this._resolveByConvention(intentId, context);
    if ((fallbackResult as Record<string, unknown>).success) { (this._metrics as { fallbacks: number }).fallbacks++; this._track('intent-resolver:fallback', { intentId, target: ((fallbackResult as Record<string, unknown>).target as Record<string, unknown> | undefined)?.id }); this._setCache(intentId, context, fallbackResult as Record<string, unknown>); return fallbackResult as Record<string, unknown>; }
    (this._metrics as { failed: number }).failed++;
    const duration = performance.now() - startTime;
    this._track('intent-resolver:failed', { intentId, duration });
    return this._fail('no-rule-found', `Nenhuma regra encontrada para: ${intentId}`);
  }

  async _resolveFromRule(rule: Record<string, unknown>, context: Record<string, unknown>, source: string): Promise<Record<string, unknown>> {
    if (rule.requiresPermission) { const hasPermission = await this._checkPermission(rule.requiresPermission as string, context); if (!hasPermission) { (this._metrics as { denied: number }).denied++; this._track('intent-resolver:denied', { intentId: rule.intentId, permission: rule.requiresPermission }); return this._fail('permission-denied', `Sem permissão: ${rule.requiresPermission}`); } }
    if (rule.conditions && !this._evaluateConditions(rule.conditions as Record<string, unknown>, context)) return this._fail('conditions-not-met', 'Condições não atendidas');
    const result: Record<string, unknown> = { success: true, action: rule.action || RESOLUTION_ACTIONS.NAVIGATE, target: { id: rule.targetId || rule.panelId || rule.route, region: rule.region || REGIONS.MAIN }, fallback: false, reason: null, meta: { resolvedFrom: source, version: VERSION, ruleId: rule.id || rule.intentId, timestamp: Date.now() } };
    this._track('intent-resolver:resolved', { intentId: rule.intentId, action: result.action, target: (result.target as Record<string, unknown>).id, source });
    return result;
  }

  _resolveByConvention(intentId: string, context: Record<string, unknown>): Record<string, unknown> {
    const parts = intentId.split('.');
    if (parts.length >= 3) {
      const [source, action, ...targetParts] = parts;
      const target = targetParts.join('-');
      if (action === 'open' || action === 'navigate') return { success: true, action: RESOLUTION_ACTIONS.NAVIGATE, target: { id: target, region: REGIONS.MAIN }, fallback: true, reason: 'resolved-by-convention', meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, convention: `${source}.${action}.*`, timestamp: Date.now() } };
      if (action === 'modal') return { success: true, action: RESOLUTION_ACTIONS.OPEN_MODAL, target: { id: target, region: REGIONS.MODAL }, fallback: true, reason: 'resolved-by-convention', meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, timestamp: Date.now() } };
      if (action === 'overlay') return { success: true, action: RESOLUTION_ACTIONS.OPEN_OVERLAY, target: { id: target, region: REGIONS.OVERLAY }, fallback: true, reason: 'resolved-by-convention', meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, timestamp: Date.now() } };
    }
    if (intentId.includes(':')) {
      const [source, target] = intentId.split(':');
      if (target && !['bell', 'help', 'toggle-sidebar'].includes(target)) return { success: true, action: RESOLUTION_ACTIONS.NAVIGATE, target: { id: target, region: REGIONS.MAIN }, fallback: true, reason: 'resolved-by-legacy-convention', meta: { resolvedFrom: RESOLUTION_SOURCES.FALLBACK, version: VERSION, timestamp: Date.now() } };
    }
    return { success: false, reason: 'no-convention-match' };
  }

  async _checkPermission(permission: string, context: Record<string, unknown>): Promise<boolean> { if (!(this._permissions as { check?: unknown } | null)?.check) return true; try { return await (this._permissions as { check: (p: string, c: Record<string, unknown>) => Promise<boolean> }).check(permission, context); } catch (error) { this._track('intent-resolver:permission-error', { permission, error: (error as Error).message }); return false; } }
  _evaluateConditions(conditions: Record<string, unknown>, context: Record<string, unknown>): boolean { if (!conditions || typeof conditions !== 'object') return true; for (const [key, expected] of Object.entries(conditions)) { const actual = context[key]; if (actual !== expected) return false; } return true; }
  _getCacheKey(intentId: string, context: Record<string, unknown>): string { const contextHash = (context.userId as string | undefined) || (context.role as string | undefined) || 'default'; return `${intentId}:${contextHash}`; }
  _getFromCache(intentId: string, context: Record<string, unknown>): unknown { const key = this._getCacheKey(intentId, context); const cached = (this._cache as Map<string, { result: unknown; timestamp: number }>).get(key); if (!cached) return null; if (Date.now() - cached.timestamp > (this._cacheMaxAge as number)) { (this._cache as Map<string, unknown>).delete(key); return null; } return cached.result; }
  _setCache(intentId: string, context: Record<string, unknown>, result: unknown): void { const key = this._getCacheKey(intentId, context); (this._cache as Map<string, { result: unknown; timestamp: number }>).set(key, { result, timestamp: Date.now() }); }
  clearCache(): void { (this._cache as Map<string, unknown>).clear(); this._track('intent-resolver:cache-cleared', {}); }
  _fail(reason: string, message: string): Record<string, unknown> { return { success: false, action: RESOLUTION_ACTIONS.NOOP, target: null, fallback: false, reason, meta: { resolvedFrom: null, version: VERSION, error: message, timestamp: Date.now() } }; }
  setOverride(intentId: string, rule: Record<string, unknown>): void { (this._dbOverrides as Map<string, unknown>).set(intentId, { ...rule, intentId }); this.clearCache(); this._track('intent-resolver:override-set', { intentId }); }
  removeOverride(intentId: string): boolean { const removed = (this._dbOverrides as Map<string, unknown>).delete(intentId); if (removed) this.clearCache(); return removed; }
  getOverrides(): unknown[] { return Array.from((this._dbOverrides as Map<string, Record<string, unknown>>).entries()).map(([id, rule]) => ({ intentId: id, ...rule })); }
  _emit(event: string, data: Record<string, unknown> = {}): void { (this._events as { emit?: (e: string, d: unknown) => void } | null)?.emit?.(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); }
  _track(event: string, data: Record<string, unknown> = {}): void { (this._telemetry as { track?: (e: string, d: unknown) => void } | null)?.track?.(event, data); }
  getMetrics(): Record<string, unknown> { return { ...(this._metrics as object), cacheSize: (this._cache as Map<string, unknown>).size }; }
  info(): Record<string, unknown> { return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, metrics: this.getMetrics(), overridesCount: (this._dbOverrides as Map<string, unknown>).size, rulesLoaded: !!this._rules, hasPermissionsPort: !!this._permissions, cacheMaxAge: this._cacheMaxAge }; }
  healthCheck(): Record<string, unknown> { const m = this._metrics as { resolved: number; failed: number }; const checks = { initialized: this._initialized, rulesLoaded: !!this._rules, lowFailureRate: m.resolved > 0 ? (m.failed / m.resolved) < 0.1 : true }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed >= 2 ? 'healthy' : passed >= 1 ? 'degraded' : 'unhealthy', score: `${passed}/3`, checks, version: VERSION, moduleId: MODULE_ID }; }
  destroy(): void { (this._cache as Map<string, unknown>).clear(); (this._dbOverrides as Map<string, unknown>).clear(); this._initialized = false; this._track('intent-resolver:destroyed', {}); }
}

export function createIntentResolver(context: Record<string, unknown>): IntentResolver { return new IntentResolver(context); }
let _instance: IntentResolver | null = null;
export function getIntentResolver(): IntentResolver { if (!_instance) _instance = new IntentResolver(); return _instance; }

export default { IntentResolver, createIntentResolver, getIntentResolver, RESOLUTION_ACTIONS, REGIONS, RESOLUTION_SOURCES, VERSION, MODULE_ID };
