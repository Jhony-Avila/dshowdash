import { createCorePorts as de } from "/core/runtime/ports-profiles.js";
import { healthCheck as Yt, isStrict as Ne } from "/core/runtime/enterprise/strict-mode.js";
import { createEarlyLogger as zt } from "/core/runtime/early-boot-logger.js";
const Te = "1.1.0-P2-ENTERPRISE", Se = "core.kernel.base-kernel", Le = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  ERROR: "error",
  SHUTDOWN: "shutdown"
}, p = {
  REGISTERED: "registered",
  ENABLED: "enabled",
  DISABLED: "disabled",
  ERROR: "error"
}, j = {
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
  NOT_INITIALIZED: "NOT_INITIALIZED"
}, ne = {
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3
}, Qe = {
  READY: "kernel:ready",
  SHUTDOWN: "kernel:shutdown",
  FEATURE_REGISTERED: "kernel:feature:registered",
  FEATURE_ENABLED: "kernel:feature:enabled",
  FEATURE_DISABLED: "kernel:feature:disabled",
  FEATURE_ERROR: "kernel:feature:error",
  HEALTH_DEGRADED: "kernel:health:degraded",
  HEALTH_RECOVERED: "kernel:health:recovered"
};
function et(e, t) {
  return (n, a, r) => ({
    ok: n,
    data: a || null,
    meta: {
      moduleId: e,
      version: t,
      timestamp: Date.now()
    },
    errors: r || []
  });
}
function tt(e, t, n, a) {
  let r = 0, s = 0;
  for (const w in e)
    e.hasOwnProperty(w) && (s++, e[w] && r++);
  const u = s > 0 ? Math.round(r / s * 100) : 0;
  let y = j.HEALTHY;
  r === 0 ? y = j.NOT_INITIALIZED : u < 50 ? y = j.UNHEALTHY : u < 100 && (y = j.DEGRADED);
  const H = {
    status: y,
    score: { passed: r, total: s, percentage: u },
    moduleId: t,
    version: n,
    checks: e,
    timestamp: Date.now()
  };
  if (a)
    for (const w in a)
      a.hasOwnProperty(w) && (H[w] = a[w]);
  return H;
}
function _e(e, t, n) {
  const a = {}, r = [e], s = [], u = [];
  for (; r.length > 0; ) {
    const y = r.pop();
    if (a[y]) continue;
    a[y] = !0;
    const H = n(y) || [];
    for (let w = 0; w < H.length; w++) {
      const B = H[w], oe = t[B];
      oe ? oe.status !== p.ENABLED && u.push(B) : s.push(B), a[B] || r.push(B);
    }
  }
  return {
    valid: s.length === 0 && u.length === 0,
    missing: s,
    disabled: u
  };
}
function nt(e, t, n) {
  const a = [];
  for (const r in t) {
    if (!t.hasOwnProperty(r) || r === e) continue;
    (n(r) || []).indexOf(e) >= 0 && a.push(r);
  }
  return a;
}
function Kt(e) {
  const t = [];
  for (const n in e)
    e.hasOwnProperty(n) && t.push({ id: n, feature: e[n] });
  return t.sort((n, a) => {
    const r = n.feature.priority !== void 0 ? n.feature.priority : ne.NORMAL, s = a.feature.priority !== void 0 ? a.feature.priority : ne.NORMAL;
    return r - s;
  }), t;
}
function rt(e) {
  const t = {
    total: 0,
    enabled: 0,
    disabled: 0,
    error: 0,
    byPriority: { 0: 0, 1: 0, 2: 0, 3: 0 },
    byStatus: {}
  };
  for (const n in e) {
    if (!e.hasOwnProperty(n)) continue;
    const a = e[n];
    t.total++, a.status === p.ENABLED ? t.enabled++ : a.status === p.DISABLED ? t.disabled++ : a.status === p.ERROR && t.error++;
    const r = a.priority !== void 0 ? a.priority : ne.NORMAL;
    t.byPriority[r] = (t.byPriority[r] || 0) + 1, t.byStatus[a.status] = (t.byStatus[a.status] || 0) + 1;
  }
  return t;
}
function Wt(e, t, n) {
  const a = {
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    kernel: {
      moduleId: e.moduleId,
      version: e.version,
      status: e.status,
      uptime: e.startTime ? Date.now() - e.startTime : 0
    },
    features: {},
    metrics: rt(t)
  };
  for (const r in t)
    if (t.hasOwnProperty(r)) {
      const s = t[r];
      a.features[r] = {
        status: s.status,
        priority: s.priority,
        enabled: s.status === p.ENABLED,
        errorCount: s.errorCount || 0,
        lastError: s.lastError || null,
        initDurationMs: s.initDurationMs || null
      };
    }
  if (n)
    for (const r in n)
      n.hasOwnProperty(r) && (a[r] = n[r]);
  return a;
}
function Jt() {
  const e = {
    constantsDefined: { ok: !!Le && !!p && !!j, severity: "crit" },
    helpersDefined: { ok: typeof et == "function" && typeof tt == "function", severity: "crit" },
    validationDefined: { ok: typeof _e == "function", severity: "warn" }
  }, t = Object.values(e).filter((a) => a.ok).length, n = Object.keys(e).length;
  return {
    status: t === n ? "HEALTHY" : "DEGRADED",
    moduleId: Se,
    version: Te,
    score: `${t}/${n}`,
    checks: e,
    timestamp: Date.now()
  };
}
function Zt() {
  return {
    moduleId: Se,
    version: Te,
    constants: {
      kernelStatusCount: Object.keys(Le).length,
      featureStatusCount: Object.keys(p).length,
      healthStatusCount: Object.keys(j).length,
      priorityLevels: Object.keys(ne).length,
      eventsCount: Object.keys(Qe).length
    },
    timestamp: Date.now()
  };
}
const Xt = {
  VERSION: Te,
  MODULE_ID: Se,
  KERNEL_STATUS: Le,
  FEATURE_STATUS: p,
  HEALTH_STATUS: j,
  PRIORITY: ne,
  KERNEL_EVENTS: Qe,
  createEnvelope: et,
  createHealthResult: tt,
  validateDependencies: _e,
  getDependents: nt,
  sortByPriority: Kt,
  aggregateMetrics: rt,
  createDiagnosticsExport: Wt,
  healthCheck: Jt,
  info: Zt
}, Me = "1.5.0-P2-ENTERPRISE", fe = "core.kernel.runtime-consumer", ge = de({ moduleId: fe });
function Qt(e) {
  return ge.get(e);
}
function en(e) {
  return ge.inject(e);
}
function tn() {
  return ge.snapshot();
}
let $ = null, ce = !1, le = [];
const ee = (e, t, n) => {
  const a = `[${fe}]`, r = Qt("logger");
  r && r[e] && r[e](`${a} ${t}`, n || {});
};
function at() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const t = window.Core.windowAdapter.get("RuntimeContext");
    if (t) return t;
  }
  if (window.RuntimeContext)
    return window.RuntimeContext;
  let e = null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get && (e = window.Core.windowAdapter.get("ApplicationKernel")), !e && window.ApplicationKernel && (e = window.ApplicationKernel), e && e.getRuntimeContext)
    return e.getRuntimeContext();
  if (window.__BOOTSTRAP_V2_INSTANCE__) {
    const t = window.__BOOTSTRAP_V2_INSTANCE__.getKernel();
    if (t && t.getRuntimeContext)
      return t.getRuntimeContext();
  }
  return null;
}
function nn() {
  if (ce)
    return { ok: !0, alreadyInitialized: !0 };
  try {
    return $ = at(), $ ? (ce = !0, ee("info", "RuntimeConsumer initialized", {
      contextVersion: $.VERSION,
      mode: $.getMode()
    }), { ok: !0, contextAvailable: !0 }) : (ee("debug", "RuntimeContext not yet available - will retry on demand"), { ok: !0, contextAvailable: !1, reason: "Context not yet initialized" });
  } catch (e) {
    return ee("error", "Init failed", { error: e.message }), { ok: !1, error: e.message };
  }
}
function E() {
  return $ || ($ = at()), $;
}
function rn() {
  return !!E();
}
function an() {
  const e = E();
  return e ? e.getMode() : "unknown";
}
function on() {
  const e = E();
  return e ? e.getPhase() : "unknown";
}
function sn() {
  const e = E();
  return e ? e.isReady() : !1;
}
function cn() {
  const e = E();
  return e ? e.isDegraded() : !1;
}
function ln() {
  const e = E();
  return e && e.isInMaintenance ? e.isInMaintenance() : !1;
}
function un() {
  const e = E();
  return e && e.isFailed ? e.isFailed() : !1;
}
function dn() {
  const e = E();
  return e && e.isInRecovery ? e.isInRecovery() : !1;
}
function fn() {
  const e = E();
  return e && e.getAuthLevel ? e.getAuthLevel() : 0;
}
function gn(e) {
  const t = E();
  return t ? t.canEnableFeature ? t.canEnableFeature(e) : t.isReady() : !1;
}
function it() {
  const e = E();
  return e ? e.canAttemptRecovery ? e.canAttemptRecovery() : !e.isDegraded() : !1;
}
function hn(e) {
  const t = E();
  return t && t.isCapabilityEnabled ? t.isCapabilityEnabled(e) : !1;
}
function ot() {
  const e = E();
  return e ? e.canNavigate ? e.canNavigate() : e.isReady() : !1;
}
function st() {
  const e = E();
  return e ? e.canAuthenticate ? e.canAuthenticate() : e.isReady() : !1;
}
function ct() {
  const e = E();
  return e ? e.canShowUI ? e.canShowUI() : e.isReady() : !1;
}
function lt() {
  const e = E();
  return e ? e.getCapabilities ? e.getCapabilities() : {
    navigate: ot(),
    authenticate: st(),
    showUI: ct(),
    enableFeature: !0,
    recovery: it()
  } : {};
}
function pn() {
  const e = E();
  return e ? e.canOperate ? e.canOperate() : e.isReady() && !(e.isInMaintenance && e.isInMaintenance()) && !(e.isFailed && e.isFailed()) : !1;
}
function mn() {
  const e = E();
  return e ? e.canPerformHeavyOperations ? e.canPerformHeavyOperations() : e.isReady() && !(e.isDegraded && e.isDegraded()) && !(e.isInMaintenance && e.isInMaintenance()) && !(e.isFailed && e.isFailed()) && !(e.isInRecovery && e.isInRecovery()) : !1;
}
function En() {
  const e = E();
  return e ? {
    available: !0,
    mode: e.getMode(),
    phase: e.getPhase(),
    ready: e.isReady(),
    degraded: e.isDegraded(),
    capabilities: lt()
  } : {
    available: !1,
    mode: "unknown",
    phase: "unknown",
    ready: !1,
    degraded: !1
  };
}
function ke(e, t) {
  if (!e || typeof t != "function")
    return ee("warn", "Invalid subscription", { eventName: e }), () => {
    };
  const n = E();
  if (n && n.subscribe) {
    const a = n.subscribe(e, t);
    return le.push(a), a;
  }
  return ee("debug", "Cannot subscribe - no context", { eventName: e }), () => {
  };
}
function yn(e) {
  return ke("mode:changed", e);
}
function bn(e) {
  return ke("phase:changed", e);
}
function vn(e) {
  return ke("degradation:changed", e);
}
function Rn() {
  le.forEach((e) => {
    typeof e == "function" && e();
  }), le = [], $ = null, ce = !1, ee("info", "RuntimeConsumer destroyed");
}
function An() {
  const e = E();
  return {
    status: e ? "HEALTHY" : "DEGRADED",
    moduleId: fe,
    version: Me,
    portsInitialized: ge.isInitialized(),
    checks: {
      contextAvailable: !!e,
      initialized: ce,
      mode: e ? e.getMode() : "N/A",
      phase: e ? e.getPhase() : "N/A",
      subscriptionsCount: le.length
    }
  };
}
function kn() {
  const e = E();
  return {
    moduleId: fe,
    version: Me,
    initialized: ce,
    contextAvailable: !!e,
    mode: e ? e.getMode() : null,
    phase: e ? e.getPhase() : null,
    ready: e ? e.isReady() : !1,
    degraded: e ? e.isDegraded() : !1,
    subscriptionsCount: le.length,
    portsInitialized: ge.isInitialized(),
    timestamp: Date.now()
  };
}
const l = {
  init: nn,
  destroy: Rn,
  getContext: E,
  hasContext: rn,
  getMode: an,
  getPhase: on,
  isReady: sn,
  isDegraded: cn,
  isInMaintenance: ln,
  isFailed: un,
  isInRecovery: dn,
  getAuthLevel: fn,
  canEnableFeature: gn,
  canAttemptRecovery: it,
  isCapabilityEnabled: hn,
  canNavigate: ot,
  canAuthenticate: st,
  canShowUI: ct,
  getCapabilities: lt,
  canOperate: pn,
  canPerformHeavyOperations: mn,
  getSnapshot: En,
  subscribe: ke,
  subscribeToMode: yn,
  subscribeToPhase: bn,
  subscribeToDegradation: vn,
  healthCheck: An,
  info: kn,
  injectPorts: en,
  getPorts: tn,
  VERSION: Me,
  MODULE_ID: fe
}, He = "1.4.0-P2-ENTERPRISE", he = "core.kernel.feature-registry", pe = de({ moduleId: he });
function Dn(e) {
  return pe.get(e);
}
function Cn(e) {
  return pe.inject(e);
}
function On() {
  return pe.snapshot();
}
const xe = {
  maxAttempts: 3,
  baseDelayMs: 1e3,
  maxDelayMs: 3e4,
  backoffMultiplier: 2,
  degradedMaxAttempts: 1,
  degradedDelayMultiplier: 3
};
function wn(e) {
  e = e || {}, e.moduleId;
  const t = e.logger || null;
  let n = e.governanceEnabled !== !1;
  const a = Object.assign({}, xe, e.recoveryConfig || {});
  let r = {}, s = {
    registrations: 0,
    enables: 0,
    disables: 0,
    errors: 0,
    // P0: Métricas de governança
    blockedByContext: 0,
    blockedByMaintenance: 0,
    blockedByAuth: 0,
    recoveryBlocked: 0,
    // P1: Métricas de elevação
    cascadesSuspended: 0,
    recoveryBackoffs: 0,
    capabilityBlocks: 0
  };
  const u = (c, o, i) => {
    const g = `[${he}]`;
    if (t && t[c]) {
      t[c](`${g} ${o}`, i || {});
      return;
    }
    const f = Dn("logger");
    f && f[c] && f[c](`${g} ${o}`, i || {});
  };
  function y(c, o) {
    if (!n)
      return { allowed: !0, governanceDisabled: !0 };
    if (l.hasContext() || l.init(), !l.hasContext())
      return u("debug", "RuntimeContext not available - allowing feature during boot", { featureId: c }), { allowed: !0, contextMissing: !0 };
    const i = l.canEnableFeature({
      requiresReady: o.requiresReady !== !1,
      requiresAuth: o.requiresAuth || !1,
      minLevel: o.minLevel || 0
    });
    return i.allowed || (u("warn", "Feature blocked by RuntimeContext", {
      featureId: c,
      reason: i.reason,
      mode: l.getMode(),
      phase: l.getPhase()
    }), s.blockedByContext++, l.isInMaintenance() && s.blockedByMaintenance++, i.reason && i.reason.indexOf("Authentication") >= 0 && s.blockedByAuth++), i;
  }
  function H(c) {
    if (!n)
      return { allowed: !0, governanceDisabled: !0 };
    if (l.hasContext() || l.init(), !l.hasContext())
      return { allowed: !0, contextMissing: !0 };
    const o = l.canAttemptRecovery();
    return o.allowed || (u("warn", "Recovery blocked by RuntimeContext", {
      featureId: c,
      reason: o.reason
    }), s.recoveryBlocked++), o;
  }
  function w(c, o) {
    if (!n)
      return { allowed: !0, governanceDisabled: !0 };
    if (!l.hasContext())
      return { allowed: !0, contextMissing: !0 };
    const i = l.getContext();
    if (!i)
      return { allowed: !0, contextMissing: !0 };
    const g = o.requiredCapability;
    return g && i.isCapabilityEnabled && !i.isCapabilityEnabled(g) ? (u("warn", "Feature blocked by capability check", {
      featureId: c,
      requiredCapability: g
    }), s.capabilityBlocks++, {
      allowed: !1,
      reason: `Capability not enabled: ${g}`
    }) : o.requiresUI && i.canShowUI && !i.canShowUI() ? (s.capabilityBlocks++, { allowed: !1, reason: "UI capability not available" }) : o.requiresNavigation && i.canNavigate && !i.canNavigate() ? (s.capabilityBlocks++, { allowed: !1, reason: "Navigation capability not available" }) : { allowed: !0 };
  }
  function B() {
    return !n || !l.hasContext() ? !1 : l.isDegraded() ? (u("info", "Cascade suspended - system in DEGRADED mode"), s.cascadesSuspended++, !0) : l.isInRecovery() ? (u("info", "Cascade suspended - system in RECOVERY mode"), s.cascadesSuspended++, !0) : !1;
  }
  function oe(c) {
    const o = c.recoveryAttempts || 0, i = l.isDegraded(), g = i ? a.degradedMaxAttempts : a.maxAttempts, f = i ? a.degradedDelayMultiplier : 1;
    let v = a.baseDelayMs * Math.pow(a.backoffMultiplier, o) * f;
    return v = Math.min(v, a.maxDelayMs), {
      delay: v,
      attempts: o,
      maxAttempts: g,
      canRetry: o < g,
      isDegraded: i
    };
  }
  function Ot(c) {
    const o = oe(c);
    if (!o.canRetry)
      return u("warn", "Recovery max attempts reached", {
        featureId: c.id,
        attempts: o.attempts,
        maxAttempts: o.maxAttempts
      }), { allowed: !1, reason: "Max recovery attempts reached", backoff: o };
    const i = c.lastRecoveryAttempt || 0, g = Date.now() - i;
    return g < o.delay ? (u("debug", "Recovery in cooldown", {
      featureId: c.id,
      remainingMs: o.delay - g
    }), s.recoveryBackoffs++, {
      allowed: !1,
      reason: "Recovery in cooldown",
      remainingMs: o.delay - g,
      backoff: o
    }) : { allowed: !0, backoff: o };
  }
  function wt(c, o) {
    return r[c] ? { ok: !1, error: `Feature already registered: ${c}` } : (r[c] = {
      id: c,
      status: p.REGISTERED,
      priority: o.priority !== void 0 ? o.priority : ne.NORMAL,
      enabled: o.enabled !== !1,
      dependencies: o.dependencies || [],
      module: o.module || null,
      init: o.init || null,
      cleanup: o.cleanup || null,
      healthCheck: o.healthCheck || null,
      // P0: Configuração de governança
      requiresReady: o.requiresReady !== !1,
      requiresAuth: o.requiresAuth || !1,
      minLevel: o.minLevel || 0,
      // P1: Configuração de capacidades
      requiredCapability: o.requiredCapability || null,
      requiresUI: o.requiresUI || !1,
      requiresNavigation: o.requiresNavigation || !1,
      // Métricas
      errorCount: 0,
      lastError: null,
      initDurationMs: null,
      registeredAt: Date.now(),
      // P0: Tracking de bloqueios
      lastBlockedAt: null,
      lastBlockReason: null,
      blockCount: 0,
      // P1: Tracking de recovery
      recoveryAttempts: 0,
      lastRecoveryAttempt: null,
      totalRecoveries: 0
    }, s.registrations++, { ok: !0, featureId: c });
  }
  function Ke(c, o) {
    o = o || {};
    const i = r[c];
    if (!i)
      return { ok: !1, error: `Feature not found: ${c}` };
    if (i.status === p.ENABLED)
      return { ok: !0, alreadyEnabled: !0 };
    if (!o.skipGovernanceCheck) {
      const f = y(c, i);
      if (!f.allowed)
        return i.lastBlockedAt = Date.now(), i.lastBlockReason = f.reason, i.blockCount++, {
          ok: !1,
          error: `Blocked by RuntimeContext: ${f.reason}`,
          blockedByGovernance: !0,
          reason: f.reason
        };
      const v = w(c, i);
      if (!v.allowed)
        return i.lastBlockedAt = Date.now(), i.lastBlockReason = v.reason, i.blockCount++, {
          ok: !1,
          error: `Blocked by capability: ${v.reason}`,
          blockedByCapability: !0,
          reason: v.reason
        };
    }
    if (!o.skipDependencyCheck) {
      const f = _e(c, r, (v) => r[v] ? r[v].dependencies : []);
      if (!f.valid)
        return { ok: !1, error: "Dependencies not met", missing: f.missing, disabled: f.disabled };
    }
    const g = Date.now();
    try {
      if (i.init) {
        const f = o.ctx || {};
        l.hasContext() && (f.runtimeSnapshot = l.getSnapshot()), i.init(f);
      }
      return i.status = p.ENABLED, i.initDurationMs = Date.now() - g, i.recoveryAttempts = 0, s.enables++, u("info", "Feature enabled", {
        featureId: c,
        initDurationMs: i.initDurationMs,
        mode: l.getMode()
      }), { ok: !0, featureId: c, initDurationMs: i.initDurationMs };
    } catch (f) {
      return i.status = p.ERROR, i.errorCount++, i.lastError = f.message, s.errors++, u("error", "Feature enable failed", { featureId: c, error: f.message }), { ok: !1, error: f.message };
    }
  }
  function We(c, o) {
    o = o || {};
    const i = r[c];
    if (!i)
      return { ok: !1, error: `Feature not found: ${c}` };
    if (i.status !== p.ENABLED)
      return { ok: !0, alreadyDisabled: !0 };
    const f = nt(c, r, (D) => r[D] ? r[D].dependencies : []).filter((D) => r[D] && r[D].status === p.ENABLED);
    if (f.length > 0 && !o.cascade)
      return { ok: !1, error: "Feature has enabled dependents", dependents: f };
    const v = [];
    if (o.cascade && f.length > 0)
      if (B() && !o.forceCascade)
        u("warn", "Cascade disabled suspended due to system mode", {
          featureId: c,
          pendingDependents: f,
          mode: l.getMode()
        });
      else
        for (let D = 0; D < f.length; D++)
          We(f[D], { cascade: !0 }).ok && v.push(f[D]);
    try {
      return i.cleanup && i.cleanup(), i.status = p.DISABLED, s.disables++, u("info", "Feature disabled", {
        featureId: c,
        cascadeDisabled: v,
        cascadeSuspended: B() && f.length > 0
      }), {
        ok: !0,
        featureId: c,
        cascadeDisabled: v,
        cascadeSuspended: f.length > 0 && v.length === 0
      };
    } catch (D) {
      return i.status = p.ERROR, i.errorCount++, i.lastError = D.message, { ok: !1, error: D.message };
    }
  }
  function It(c, o) {
    o = o || {};
    const i = r[c];
    if (!i)
      return { ok: !1, error: `Feature not found: ${c}` };
    if (i.status !== p.ERROR)
      return { ok: !1, error: "Feature not in ERROR state", currentStatus: i.status };
    if (!o.skipGovernanceCheck) {
      const f = H(c);
      if (!f.allowed)
        return {
          ok: !1,
          error: `Recovery blocked by RuntimeContext: ${f.reason}`,
          blockedByGovernance: !0,
          reason: f.reason
        };
    }
    if (!o.skipBackoffCheck) {
      const f = Ot(i);
      if (!f.allowed)
        return {
          ok: !1,
          error: f.reason,
          blockedByBackoff: !0,
          backoff: f.backoff,
          remainingMs: f.remainingMs
        };
    }
    i.recoveryAttempts = (i.recoveryAttempts || 0) + 1, i.lastRecoveryAttempt = Date.now(), i.status = p.DISABLED, i.lastError = null, u("info", "Attempting recovery", {
      featureId: c,
      attempt: i.recoveryAttempts,
      isDegraded: l.isDegraded()
    });
    const g = Ke(c, o);
    return g.ok && (i.totalRecoveries = (i.totalRecoveries || 0) + 1, u("info", "Recovery successful", { featureId: c, totalRecoveries: i.totalRecoveries })), g;
  }
  function Nt(c) {
    const o = r[c];
    return o ? (o.recoveryAttempts = 0, o.lastRecoveryAttempt = null, o.errorCount = 0, o.lastError = null, u("info", "Recovery state reset", { featureId: c }), { ok: !0, featureId: c }) : { ok: !1, error: `Feature not found: ${c}` };
  }
  function Tt() {
    let c = 0;
    for (const o in r)
      r[o].recoveryAttempts = 0, r[o].lastRecoveryAttempt = null, c++;
    return u("info", "All recovery states reset", { count: c }), { ok: !0, count: c };
  }
  function St(c) {
    return r[c] || null;
  }
  function Lt(c) {
    const o = r[c];
    return o ? o.status : null;
  }
  function _t() {
    return Object.assign({}, r);
  }
  function Mt(c) {
    const o = [];
    for (const i in r)
      r[i].status === c && o.push(i);
    return o;
  }
  function Ht(c) {
    const o = [];
    for (const i in r)
      r[i].priority === c && o.push(i);
    return o;
  }
  function Je() {
    return Object.keys(r).length;
  }
  function xt() {
    const c = [];
    for (const o in r) {
      const i = r[o];
      c.push({
        id: o,
        status: i.status,
        priority: i.priority,
        enabled: i.status === p.ENABLED,
        blockCount: i.blockCount || 0,
        lastBlockReason: i.lastBlockReason || null,
        recoveryAttempts: i.recoveryAttempts || 0,
        totalRecoveries: i.totalRecoveries || 0
      });
    }
    return c;
  }
  function Ze() {
    const c = [];
    for (const o in r) {
      const i = r[o];
      if (i.status === p.ERROR) {
        const g = oe(i);
        c.push({
          id: o,
          errorCount: i.errorCount,
          lastError: i.lastError,
          recoveryAttempts: i.recoveryAttempts || 0,
          canRetry: g.canRetry,
          nextRetryIn: g.canRetry ? Math.max(0, g.delay - (Date.now() - (i.lastRecoveryAttempt || 0))) : null
        });
      }
    }
    return c;
  }
  function Ut() {
    const c = {};
    for (const o in r) {
      const i = r[o];
      if (i.healthCheck)
        try {
          c[o] = i.healthCheck();
        } catch (g) {
          c[o] = { status: "ERROR", error: g.message };
        }
      else
        c[o] = { status: i.status === p.ENABLED ? "HEALTHY" : i.status };
    }
    return c;
  }
  function Bt() {
    let c = 0, o = 0, i = 0;
    for (const g in r) {
      const f = r[g].status;
      f === p.ENABLED ? c++ : f === p.DISABLED ? o++ : f === p.ERROR && i++;
    }
    return Object.assign({}, s, {
      total: Je(),
      enabled: c,
      disabled: o,
      error: i,
      runtimeMode: l.getMode(),
      runtimePhase: l.getPhase(),
      canOperate: l.canOperate(),
      featuresInError: Ze().length
    });
  }
  function Pt() {
    n = !0, u("info", "Governance enabled");
  }
  function Ft() {
    n = !1, u("warn", "Governance disabled - features will not check RuntimeContext");
  }
  function $t() {
    return n;
  }
  function Gt() {
    return {
      enabled: n,
      contextAvailable: l.hasContext(),
      currentMode: l.getMode(),
      currentPhase: l.getPhase(),
      canOperate: l.canOperate(),
      cascadeSuspended: B(),
      recoveryConfig: Object.assign({}, a),
      metrics: {
        blockedByContext: s.blockedByContext,
        blockedByMaintenance: s.blockedByMaintenance,
        blockedByAuth: s.blockedByAuth,
        recoveryBlocked: s.recoveryBlocked,
        cascadesSuspended: s.cascadesSuspended,
        recoveryBackoffs: s.recoveryBackoffs,
        capabilityBlocks: s.capabilityBlocks
      }
    };
  }
  function jt(c) {
    return Object.assign(a, c), u("info", "Recovery config updated", a), Object.assign({}, a);
  }
  function Vt() {
    return Object.assign({}, a);
  }
  function qt() {
    r = {}, s = {
      registrations: 0,
      enables: 0,
      disables: 0,
      errors: 0,
      blockedByContext: 0,
      blockedByMaintenance: 0,
      blockedByAuth: 0,
      recoveryBlocked: 0,
      cascadesSuspended: 0,
      recoveryBackoffs: 0,
      capabilityBlocks: 0
    };
  }
  return {
    // Core operations
    register: wt,
    enable: Ke,
    disable: We,
    // P0/P1: Recovery with governance + backoff
    attemptRecovery: It,
    // P1: Recovery management
    resetRecoveryState: Nt,
    resetAllRecoveryStates: Tt,
    getFeaturesInError: Ze,
    setRecoveryConfig: jt,
    getRecoveryConfig: Vt,
    // Queries
    get: St,
    getStatus: Lt,
    getAll: _t,
    getByStatus: Mt,
    getByPriority: Ht,
    count: Je,
    list: xt,
    // Health
    healthCheckAll: Ut,
    getMetrics: Bt,
    // P0: Governance
    enableGovernance: Pt,
    disableGovernance: Ft,
    isGovernanceEnabled: $t,
    getGovernanceStatus: Gt,
    // Reset
    reset: qt
  };
}
function In() {
  const e = !!l, t = l.hasContext(), n = {
    portsInitialized: { ok: pe.isInitialized(), severity: "info" },
    runtimeConsumerAvailable: { ok: e, severity: "crit" },
    contextAvailable: { ok: t, severity: "warn" }
  }, a = Object.values(n).filter((s) => s.ok).length, r = Object.keys(n).length;
  return {
    status: a >= r - 1 ? "HEALTHY" : a >= r - 2 ? "DEGRADED" : "UNHEALTHY",
    moduleId: he,
    version: He,
    score: `${a}/${r}`,
    checks: n,
    runtimeMode: t ? l.getMode() : null,
    timestamp: Date.now()
  };
}
function Nn() {
  return {
    moduleId: he,
    version: He,
    portsInitialized: pe.isInitialized(),
    contextAvailable: l.hasContext(),
    runtimeMode: l.hasContext() ? l.getMode() : null,
    recoveryConfig: { ...xe },
    timestamp: Date.now()
  };
}
const Tn = {
  VERSION: He,
  MODULE_ID: he,
  createFeatureRegistry: wn,
  healthCheck: In,
  info: Nn,
  injectPorts: Cn,
  getPorts: On,
  RECOVERY_CONFIG: xe
}, Ue = "1.2.0-P2-ENTERPRISE", me = "core.kernel.feature-manifest", Ee = de({ moduleId: me });
function Sn(e) {
  return Ee.get(e);
}
function Ln(e) {
  return Ee.inject(e);
}
function _n() {
  return Ee.snapshot();
}
const d = Object.freeze({
  CORE: "core",
  AUTH: "auth",
  UI: "ui",
  NAVIGATION: "navigation",
  DATA: "data",
  INTEGRATION: "integration",
  TELEMETRY: "telemetry",
  EXPERIMENTAL: "experimental"
}), ye = Object.freeze({
  MANIFEST: "manifest",
  KERNEL: "kernel",
  REMOTE: "remote",
  OVERRIDE: "override"
});
let m = {}, q = {}, Y = {}, W = !1, T = {
  registered: 0,
  flagChanges: 0,
  lockViolations: 0,
  unregisteredBlocks: 0
};
const S = (e, t, n) => {
  const a = `[${me}]`, r = Sn("logger");
  r && r[e] && r[e](`${a} ${t}`, n || {});
};
function ut(e, t) {
  if (W)
    return T.lockViolations++, S("error", "Manifest is locked - cannot register new features", { featureId: e }), { ok: !1, error: "Manifest is locked", featureId: e };
  if (m[e])
    return S("warn", "Feature already registered in manifest", { featureId: e }), { ok: !1, error: "Feature already registered", featureId: e };
  const n = {
    id: e,
    name: t.name || e,
    description: t.description || "",
    category: t.category || d.CORE,
    version: t.version || "1.0.0",
    // Governance
    requiresAuth: t.requiresAuth || !1,
    requiresReady: t.requiresReady !== !1,
    minLevel: t.minLevel || 0,
    requiredCapability: t.requiredCapability || null,
    requiredCapabilities: t.requiredCapabilities || [],
    // Dependencies
    dependencies: t.dependencies || [],
    softDependencies: t.softDependencies || [],
    // Flags
    defaultEnabled: t.defaultEnabled !== !1,
    canDisable: t.canDisable !== !1,
    experimental: t.experimental || !1,
    deprecated: t.deprecated || !1,
    // Health
    healthWeight: t.healthWeight || 1,
    critical: t.critical || !1,
    // Meta
    owner: t.owner || "system",
    documentation: t.documentation || null,
    registeredAt: Date.now()
  };
  m[e] = n, q[e] = {
    enabled: n.defaultEnabled,
    source: ye.MANIFEST,
    lastChanged: Date.now(),
    changedBy: "manifest"
  };
  const a = n.category;
  return Y[a] || (Y[a] = []), Y[a].push(e), T.registered++, S("info", "Feature registered in manifest", { featureId: e, category: a }), { ok: !0, featureId: e, definition: n };
}
function Mn(e) {
  const t = [];
  for (const n in e)
    t.push(ut(n, e[n]));
  return t;
}
function dt(e, t, n, a) {
  if (!m[e])
    return S("warn", "Cannot set flag for unregistered feature", { featureId: e }), { ok: !1, error: "Feature not in manifest", featureId: e };
  const r = m[e];
  if (!t && !r.canDisable)
    return S("warn", "Feature cannot be disabled", { featureId: e }), { ok: !1, error: "Feature cannot be disabled", featureId: e };
  const s = q[e] ? q[e].enabled : r.defaultEnabled;
  return q[e] = {
    enabled: t,
    source: n || ye.OVERRIDE,
    lastChanged: Date.now(),
    changedBy: a || "unknown",
    previousValue: s
  }, T.flagChanges++, S("info", "Flag changed", { featureId: e, enabled: t, source: n }), { ok: !0, featureId: e, enabled: t, previousValue: s };
}
function Be(e) {
  return q[e] ? Object.assign({}, q[e]) : m[e] ? { enabled: m[e].defaultEnabled, source: ye.MANIFEST } : null;
}
function Hn(e) {
  const t = Be(e);
  return t ? t.enabled : !1;
}
function xn(e) {
  if (!e) return { ok: !1, error: "No kernel flags provided" };
  let t = 0;
  for (const n in e)
    m[n] && (dt(n, e[n], ye.KERNEL, "kernel-sync"), t++);
  return S("info", "Flags synced with kernel", { synced: t }), { ok: !0, synced: t };
}
function Un(e) {
  return m[e] ? Object.assign({}, m[e]) : null;
}
function Bn() {
  const e = {};
  for (const t in m)
    e[t] = Object.assign({}, m[t]);
  return e;
}
function Pn(e) {
  return (Y[e] || []).map((n) => Object.assign({}, m[n]));
}
function ft() {
  const e = {};
  for (const t in Y)
    e[t] = Y[t].length;
  return e;
}
function gt() {
  const e = [];
  for (const t in m)
    m[t].critical && e.push(t);
  return e;
}
function ht() {
  const e = [];
  for (const t in m)
    m[t].experimental && e.push(t);
  return e;
}
function pt() {
  const e = [];
  for (const t in m)
    m[t].deprecated && e.push(t);
  return e;
}
function Fn(e) {
  return !!m[e];
}
function $n(e, t) {
  if (!m[e])
    return T.unregisteredBlocks++, {
      valid: !1,
      error: "Feature not registered in manifest",
      code: "UNREGISTERED"
    };
  const n = m[e], a = Be(e);
  if (!a.enabled)
    return {
      valid: !1,
      error: "Feature flag is disabled",
      code: "FLAG_DISABLED",
      source: a.source
    };
  if (n.deprecated && S("warn", "Activating deprecated feature", { featureId: e }), t && n.requiredCapabilities && n.requiredCapabilities.length > 0)
    for (let r = 0; r < n.requiredCapabilities.length; r++) {
      const s = n.requiredCapabilities[r];
      if (t.isCapabilityEnabled && !t.isCapabilityEnabled(s))
        return {
          valid: !1,
          error: `Required capability not enabled: ${s}`,
          code: "CAPABILITY_MISSING",
          capability: s
        };
    }
  return { valid: !0, definition: n };
}
function Gn() {
  return W = !0, S("info", "Manifest locked", { featuresRegistered: T.registered }), { ok: !0, featuresRegistered: T.registered };
}
function jn(e) {
  return e !== "__KERNEL_UNLOCK__" ? (T.lockViolations++, S("error", "Invalid unlock attempt"), { ok: !1, error: "Invalid unlock secret" }) : (W = !1, S("warn", "Manifest unlocked"), { ok: !0 });
}
function Vn() {
  return W;
}
function qn() {
  return {
    moduleId: me,
    version: Ue,
    locked: W,
    totalFeatures: Object.keys(m).length,
    categories: ft(),
    criticalCount: gt().length,
    experimentalCount: ht().length,
    deprecatedCount: pt().length,
    portsInitialized: Ee.isInitialized(),
    metrics: Object.assign({}, T),
    timestamp: Date.now()
  };
}
function Yn() {
  const e = {
    manifestPopulated: Object.keys(m).length > 0,
    noLockViolations: T.lockViolations === 0,
    noUnregisteredBlocks: T.unregisteredBlocks === 0
  };
  let t = 0, n = 0;
  for (const a in e)
    n++, e[a] && t++;
  return {
    status: t === n ? "HEALTHY" : t > 0 ? "DEGRADED" : "UNHEALTHY",
    moduleId: me,
    version: Ue,
    portsInitialized: Ee.isInitialized(),
    score: { passed: t, total: n },
    checks: e,
    locked: W,
    metrics: Object.assign({}, T),
    timestamp: Date.now()
  };
}
function zn() {
  m = {}, q = {}, Y = {}, W = !1, T = { registered: 0, flagChanges: 0, lockViolations: 0, unregisteredBlocks: 0 }, S("info", "Manifest reset");
}
const R = {
  VERSION: Ue,
  MODULE_ID: me,
  // Constants
  FEATURE_CATEGORIES: d,
  FLAG_SOURCES: ye,
  // Ports
  injectPorts: Ln,
  getPorts: _n,
  // Registration
  register: ut,
  registerBatch: Mn,
  // Flags
  setFlag: dt,
  getFlag: Be,
  isEnabled: Hn,
  syncWithKernel: xn,
  // Queries
  get: Un,
  getAll: Bn,
  getByCategory: Pn,
  getCategories: ft,
  getCriticalFeatures: gt,
  getExperimentalFeatures: ht,
  getDeprecatedFeatures: pt,
  isRegistered: Fn,
  validateActivation: $n,
  // Lock
  lock: Gn,
  unlock: jn,
  isLocked: Vn,
  // Diagnostics
  info: qn,
  healthCheck: Yn,
  reset: zn
}, Pe = "1.3.0-GOVERNANCE", be = "core.kernel.health-aggregator", re = de({ moduleId: be });
function Kn(e) {
  return re.get(e);
}
function Wn(e) {
  return re.inject(e);
}
function Jn() {
  return re.snapshot();
}
const A = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
  CRITICAL: "CRITICAL",
  UNKNOWN: "UNKNOWN"
}), V = Object.freeze({
  HEALTHY: 0,
  UNKNOWN: 1,
  DEGRADED: 2,
  UNHEALTHY: 3,
  CRITICAL: 4
}), Re = Object.freeze({
  core: { weight: 10, critical: !0 },
  auth: { weight: 9, critical: !0 },
  governance: { weight: 8, critical: !0 },
  // v1.3.0: Categoria para strict-mode e políticas
  ui: { weight: 5, critical: !1 },
  navigation: { weight: 6, critical: !1 },
  data: { weight: 7, critical: !1 },
  integration: { weight: 4, critical: !1 },
  telemetry: { weight: 2, critical: !1 },
  experimental: { weight: 1, critical: !1 }
});
let O = {}, h = {}, N = A.UNKNOWN, te = [], K = !1;
const U = (e, t, n) => {
  const a = `[${be}]`, r = Kn("logger");
  r && r[e] && r[e](`${a} ${t}`, n || {});
};
function Zn() {
  return K ? { ok: !0, alreadyInitialized: !0 } : (Object.keys(Re).forEach((e) => {
    h[e] = {
      status: A.UNKNOWN,
      features: {},
      weight: Re[e].weight,
      critical: Re[e].critical,
      lastUpdate: null
    };
  }), K = !0, mt(), U("info", "HealthAggregator initialized", { categories: Object.keys(Re).length }), { ok: !0 });
}
function mt() {
  var e;
  try {
    const t = Yt();
    Fe("enterprise-strict-mode", "governance", t.status, {
      strictModeActive: Ne(),
      scorePercentage: t.scorePercentage,
      recentViolations: ((e = t.summary) == null ? void 0 : e.recentCount) || 0,
      topOffenders: t.topOffenders || []
    });
  } catch (t) {
    U("warn", "Failed to register strict-mode health", { error: t.message });
  }
}
function Xn() {
  return K ? (mt(), !0) : !1;
}
function Fe(e, t, n, a) {
  if (!e || !t || !n)
    return U("warn", "Invalid health report", { featureId: e, category: t, status: n }), !1;
  if (!A[n])
    return U("warn", "Unknown health status", { status: n }), !1;
  const r = Date.now(), s = O[e] ? O[e].status : null;
  return O[e] = {
    category: t,
    status: n,
    details: a || {},
    lastUpdate: r,
    previousStatus: s
  }, h[t] || (h[t] = {
    status: A.UNKNOWN,
    features: {},
    weight: 3,
    critical: !1,
    lastUpdate: null
  }), h[t].features[e] = n, h[t].lastUpdate = r, $e(t), Ge(), s && s !== n && (U("info", "Health changed", {
    featureId: e,
    from: s,
    to: n
  }), Et({
    type: "health:changed",
    featureId: e,
    category: t,
    from: s,
    to: n
  })), !0;
}
function Qn(e) {
  if (!Array.isArray(e)) return !1;
  const t = [];
  return e.forEach((n) => {
    t.push(Fe(n.featureId, n.category, n.status, n.details));
  }), t;
}
function er(e) {
  if (!O[e]) return !1;
  const t = O[e].category;
  return delete O[e], h[t] && h[t].features[e] && (delete h[t].features[e], $e(t), Ge()), U("debug", "Health entry removed", { featureId: e }), !0;
}
function $e(e) {
  const t = h[e];
  if (!t) return;
  const n = t.features, a = Object.keys(n);
  if (a.length === 0) {
    t.status = A.UNKNOWN;
    return;
  }
  let r = 0;
  a.forEach((u) => {
    const y = n[u], H = V[y] || 0;
    H > r && (r = H);
  });
  const s = {};
  Object.keys(V).forEach((u) => {
    s[V[u]] = u;
  }), t.status = s[r] || A.UNKNOWN;
}
function Ge() {
  const e = Object.keys(h);
  if (e.length === 0) {
    N = A.UNKNOWN;
    return;
  }
  let t = 0, n = !1;
  e.forEach((s) => {
    const u = h[s], y = V[u.status] || 0;
    u.critical && y >= V.DEGRADED && (n = !0), y > t && (t = y);
  });
  const a = {};
  Object.keys(V).forEach((s) => {
    a[V[s]] = s;
  });
  let r = a[t] || A.UNKNOWN;
  if (n && r === A.DEGRADED && (r = A.UNHEALTHY), N !== r) {
    const s = N;
    N = r, U("info", "Global health changed", { from: s, to: r }), Et({ type: "global:health:changed", from: s, to: r });
  }
}
function tr(e) {
  return O[e] || null;
}
function nr(e) {
  return h[e] || null;
}
function rr() {
  return N;
}
function ar() {
  return {
    global: N,
    categories: JSON.parse(JSON.stringify(h)),
    features: JSON.parse(JSON.stringify(O)),
    timestamp: Date.now()
  };
}
function ir() {
  const e = {};
  return Object.keys(h).forEach((t) => {
    e[t] = {
      status: h[t].status,
      featureCount: Object.keys(h[t].features).length,
      critical: h[t].critical
    };
  }), e;
}
function or(e) {
  return typeof e != "function" ? () => {
  } : (te.push(e), () => {
    te = te.filter((t) => t !== e);
  });
}
function Et(e) {
  te.forEach((t) => {
    try {
      t(e);
    } catch (n) {
      U("error", "Listener error", { error: n.message });
    }
  });
}
function sr() {
  O = {}, Object.keys(h).forEach((e) => {
    h[e].features = {}, h[e].status = A.UNKNOWN, h[e].lastUpdate = null;
  }), N = A.UNKNOWN, U("info", "HealthAggregator reset");
}
function cr() {
  O = {}, h = {}, N = A.UNKNOWN, te = [], K = !1, U("info", "HealthAggregator destroyed");
}
function lr() {
  const e = {
    initialized: K,
    globalHealthy: N === "HEALTHY" || N === "DEGRADED",
    categoriesConfigured: Object.keys(h).length >= 5,
    featuresTracked: Object.keys(O).length > 0,
    portsInitialized: re.isInitialized()
  }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return {
    status: K ? t === n ? "HEALTHY" : "DEGRADED" : "UNHEALTHY",
    score: `${t}/${n}`,
    moduleId: be,
    version: Pe,
    strictMode: Ne(),
    portsInitialized: re.isInitialized(),
    checks: e,
    globalHealth: N,
    categoriesCount: Object.keys(h).length,
    featuresTracked: Object.keys(O).length,
    timestamp: Date.now()
  };
}
function ur() {
  return {
    moduleId: be,
    version: Pe,
    initialized: K,
    strictMode: Ne(),
    globalHealth: N,
    categoriesCount: Object.keys(h).length,
    featuresTracked: Object.keys(O).length,
    listenersCount: te.length,
    portsInitialized: re.isInitialized(),
    categories: Object.keys(h),
    timestamp: Date.now()
  };
}
const I = {
  init: Zn,
  destroy: cr,
  reset: sr,
  report: Fe,
  reportBatch: Qn,
  remove: er,
  recalculateCategoryHealth: $e,
  recalculateGlobalHealth: Ge,
  getFeatureHealth: tr,
  getCategoryHealth: nr,
  getGlobalHealth: rr,
  getFullReport: ar,
  getCategorySummary: ir,
  subscribe: or,
  updateStrictModeHealth: Xn,
  // v1.3.0
  healthCheck: lr,
  info: ur,
  injectPorts: Wn,
  getPorts: Jn,
  HEALTH_STATUS: A,
  VERSION: Pe,
  MODULE_ID: be
}, De = "1.3.0-P2-ENTERPRISE", J = "core.kernel.telemetry-emitter", ae = de({ moduleId: J });
let Ie = !1;
function yt() {
  Ie || (ae.init(), Ie = !0);
}
function dr(e) {
  return yt(), ae.get(e);
}
function bt() {
  return yt(), ae.getEventBus();
}
function fr(e) {
  return ae.inject(e);
}
function gr() {
  return ae.snapshot();
}
const _ = Object.freeze({
  // Feature lifecycle
  FEATURE_REGISTERED: "feature:registered",
  FEATURE_ENABLED: "feature:enabled",
  FEATURE_DISABLED: "feature:disabled",
  FEATURE_ERROR: "feature:error",
  FEATURE_RECOVERY: "feature:recovery",
  // Governance
  GOVERNANCE_BLOCK: "governance:block",
  GOVERNANCE_ALLOW: "governance:allow",
  CASCADE_SUSPENDED: "governance:cascade:suspended",
  RECOVERY_BACKOFF: "governance:recovery:backoff",
  CAPABILITY_BLOCK: "governance:capability:block",
  // Health
  HEALTH_CHANGE: "health:change",
  HEALTH_CRITICAL: "health:critical",
  HEALTH_DEGRADED: "health:degraded",
  HEALTH_RECOVERED: "health:recovered",
  // Manifest
  MANIFEST_REGISTERED: "manifest:registered",
  MANIFEST_LOCKED: "manifest:locked",
  FLAG_CHANGED: "manifest:flag:changed",
  // Context
  MODE_CHANGE: "context:mode:change",
  PHASE_CHANGE: "context:phase:change",
  // Anti-regression
  LOCK_VIOLATION: "antiregression:lock:violation",
  UNREGISTERED_BLOCK: "antiregression:unregistered:block"
}), P = Object.freeze({
  DEBUG: "debug",
  INFO: "info",
  WARN: "warn",
  ERROR: "error",
  CRITICAL: "critical"
});
let Z = !0, k = [];
const vt = 1e3;
let z = [], ve = {}, M = {
  emitted: 0,
  buffered: 0,
  flushed: 0,
  dropped: 0,
  errors: 0
};
const L = {
  bufferEnabled: !0,
  autoFlush: !0,
  flushInterval: 5e3,
  minLevel: P.INFO,
  includeStackTrace: !1
};
let se = null;
const Xe = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
  critical: 4
};
function hr(e) {
  return Xe[e] >= Xe[L.minLevel];
}
function pr(e, t, n, a) {
  return {
    id: mr(),
    type: e,
    level: t,
    data: n || {},
    context: Object.assign({
      moduleId: J,
      version: De,
      timestamp: Date.now(),
      isoTime: (/* @__PURE__ */ new Date()).toISOString()
    }, a || {}),
    meta: {
      emittedAt: Date.now(),
      buffered: !1
    }
  };
}
function mr() {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 9)}`;
}
function Rt(e, t, n) {
  const a = `[${J}]`, r = dr("logger");
  r && r[e] && r[e](`${a} ${t}`, n || {});
}
function X(e, t, n, a) {
  if (!Z || !hr(t) || ve[e] === !1) return null;
  const r = pr(e, t, n, a);
  M.emitted++;
  for (let s = 0; s < z.length; s++)
    try {
      z[s](r);
    } catch {
      M.errors++;
    }
  return L.bufferEnabled && Tr(r), Sr(r), r;
}
function Er(e, t, n) {
  return X(e, P.DEBUG, t, n);
}
function ie(e, t, n) {
  return X(e, P.INFO, t, n);
}
function Ce(e, t, n) {
  return X(e, P.WARN, t, n);
}
function je(e, t, n) {
  return X(e, P.ERROR, t, n);
}
function yr(e, t, n) {
  return X(e, P.CRITICAL, t, n);
}
function br(e, t) {
  return ie(_.FEATURE_REGISTERED, { featureId: e, definition: t });
}
function vr(e, t) {
  return ie(_.FEATURE_ENABLED, { featureId: e, durationMs: t });
}
function Rr(e, t) {
  return ie(_.FEATURE_DISABLED, { featureId: e, reason: t });
}
function Ar(e, t, n) {
  return je(_.FEATURE_ERROR, {
    featureId: e,
    error: t,
    stack: L.includeStackTrace ? n : void 0
  });
}
function kr(e, t, n) {
  return ie(_.FEATURE_RECOVERY, {
    featureId: e,
    attempt: t,
    success: n
  });
}
function Dr(e, t, n) {
  return Ce(_.GOVERNANCE_BLOCK, {
    featureId: e,
    reason: t,
    mode: n
  });
}
function Cr(e, t, n) {
  return Ce(_.CASCADE_SUSPENDED, {
    featureId: e,
    pendingDependents: t,
    mode: n
  });
}
function Or(e, t, n) {
  return ie(_.RECOVERY_BACKOFF, {
    featureId: e,
    attempt: t,
    delayMs: n
  });
}
function wr(e, t, n, a) {
  const r = a ? P.ERROR : P.INFO;
  return X(_.HEALTH_CHANGE, r, {
    featureId: e,
    from: t,
    to: n,
    critical: a
  });
}
function Ir(e, t) {
  return je(_.LOCK_VIOLATION, {
    operation: e,
    featureId: t
  });
}
function Nr(e) {
  return Ce(_.UNREGISTERED_BLOCK, { featureId: e });
}
function Tr(e) {
  e.meta.buffered = !0, k.push(e), M.buffered++, k.length > vt && (k.shift(), M.dropped++);
}
function Sr(e) {
  const t = bt();
  t && typeof t.emit == "function" && t.emit(`telemetry:${e.type}`, e);
}
function At() {
  if (k.length === 0) return { ok: !0, flushed: 0 };
  const e = k.slice();
  k = [], M.flushed += e.length;
  const t = bt();
  return t && typeof t.emit == "function" && t.emit("telemetry:batch", { events: e, count: e.length, source: J, timestamp: Date.now() }), Rt("debug", "Buffer flushed", { count: e.length }), { ok: !0, flushed: e.length, events: e };
}
function Lr() {
  return k.slice();
}
function _r() {
  const e = k.length;
  return k = [], { ok: !0, cleared: e };
}
function Oe() {
  se || (se = setInterval(() => {
    k.length > 0 && At();
  }, L.flushInterval));
}
function Ve() {
  se && (clearInterval(se), se = null);
}
function Mr(e) {
  return typeof e != "function" ? () => {
  } : (z.push(e), function() {
    const n = z.indexOf(e);
    n >= 0 && z.splice(n, 1);
  });
}
function Hr(e, t) {
  ve[e] = t;
}
function xr() {
  ve = {};
}
function Ur(e) {
  return Object.assign(L, e), L.autoFlush ? Oe() : Ve(), Object.assign({}, L);
}
function Br() {
  return Object.assign({}, L);
}
function Pr() {
  Z = !0, L.autoFlush && Oe();
}
function Fr() {
  Z = !1, Ve();
}
function $r() {
  return Z;
}
function Gr() {
  return Object.assign({}, M);
}
function jr() {
  return {
    moduleId: J,
    version: De,
    enabled: Z,
    p2Enterprise: !0,
    portsInitialized: Ie,
    bufferSize: k.length,
    subscriberCount: z.length,
    filterCount: Object.keys(ve).length,
    config: Object.assign({}, L),
    metrics: Object.assign({}, M),
    timestamp: Date.now()
  };
}
function Vr() {
  const e = {
    enabled: Z,
    bufferNotFull: k.length < vt * 0.9,
    noErrors: M.errors < 10,
    recentFlush: M.flushed > 0 || k.length < 100
  };
  let t = 0, n = 0;
  for (const a in e)
    n++, e[a] && t++;
  return {
    status: t === n ? "HEALTHY" : t > 0 ? "DEGRADED" : "UNHEALTHY",
    moduleId: J,
    version: De,
    portsInitialized: ae.isInitialized(),
    score: { passed: t, total: n },
    checks: e,
    metrics: Object.assign({}, M),
    timestamp: Date.now()
  };
}
function qr() {
  Ve(), k = [], z = [], ve = {}, M = { emitted: 0, buffered: 0, flushed: 0, dropped: 0, errors: 0 }, Z = !0, L.autoFlush && Oe(), Rt("info", "Telemetry emitter reset");
}
typeof window < "u" && L.autoFlush && Oe();
const x = {
  VERSION: De,
  MODULE_ID: J,
  EVENT_TYPES: _,
  LEVELS: P,
  // Ports
  injectPorts: fr,
  getPorts: gr,
  // Core emit
  emit: X,
  debug: Er,
  info: ie,
  warn: Ce,
  error: je,
  critical: yr,
  // Convenience emitters
  featureRegistered: br,
  featureEnabled: vr,
  featureDisabled: Rr,
  featureError: Ar,
  featureRecovery: kr,
  governanceBlock: Dr,
  cascadeSuspended: Cr,
  recoveryBackoff: Or,
  healthChange: wr,
  lockViolation: Ir,
  unregisteredBlock: Nr,
  // Buffer
  flush: At,
  getBuffer: Lr,
  clearBuffer: _r,
  // Subscriptions
  subscribe: Mr,
  // Filters
  setFilter: Hr,
  clearFilters: xr,
  // Config
  configure: Ur,
  getConfig: Br,
  enable: Pr,
  disable: Fr,
  isEnabled: $r,
  // Diagnostics
  getMetrics: Gr,
  info: jr,
  healthCheck: Vr,
  reset: qr
}, qe = "1.4.0-P2-ENTERPRISE", we = "core.kernel.feature-definitions", Ae = zt(we), C = {
  // ─────────────────────────────────────────────────────────────
  // CORE - Features essenciais do sistema
  // ─────────────────────────────────────────────────────────────
  "event-bus": {
    name: "Event Bus",
    description: "Sistema de eventos pub/sub enterprise",
    category: d.CORE,
    version: "3.0.0",
    critical: !0,
    canDisable: !1,
    healthWeight: 10,
    owner: "core-team"
  },
  "asset-loader": {
    name: "Asset Loader",
    description: "Carregamento dinâmico de CSS/JS",
    category: d.CORE,
    version: "1.0.0",
    critical: !0,
    canDisable: !1,
    dependencies: ["event-bus"],
    owner: "core-team"
  },
  "enterprise-loader": {
    name: "Enterprise Loader",
    description: "Loader de inicialização enterprise",
    category: d.CORE,
    version: "1.0.0",
    critical: !0,
    canDisable: !1,
    dependencies: ["event-bus", "asset-loader"],
    owner: "core-team"
  },
  "cache-manager": {
    name: "Cache Manager",
    description: "Gerenciamento de cache do sistema",
    category: d.CORE,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "core-team"
  },
  "error-boundary": {
    name: "Error Boundary",
    description: "Captura e tratamento de erros",
    category: d.CORE,
    version: "1.0.0",
    critical: !0,
    canDisable: !1,
    dependencies: ["event-bus"],
    owner: "core-team"
  },
  // ─────────────────────────────────────────────────────────────
  // AUTH - Autenticação e autorização
  // ─────────────────────────────────────────────────────────────
  "session-manager": {
    name: "Session Manager",
    description: "Gerenciamento de sessão do usuário",
    category: d.AUTH,
    version: "2.0.0",
    critical: !0,
    canDisable: !1,
    requiresReady: !0,
    dependencies: ["event-bus"],
    healthWeight: 10,
    owner: "auth-team"
  },
  "login-modal": {
    name: "Login Modal",
    description: "Modal de autenticação",
    category: d.AUTH,
    version: "1.0.0",
    critical: !0,
    canDisable: !1,
    dependencies: ["session-manager", "modal-manager"],
    owner: "auth-team"
  },
  security: {
    name: "Security Module",
    description: "Módulo de segurança e proteções",
    category: d.AUTH,
    version: "1.0.0",
    critical: !0,
    canDisable: !1,
    dependencies: ["session-manager"],
    owner: "security-team"
  },
  "permission-audit": {
    name: "Permission Audit",
    description: "Auditoria de permissões",
    category: d.AUTH,
    version: "1.0.0",
    requiresAuth: !0,
    minLevel: 80,
    dependencies: ["session-manager"],
    owner: "security-team"
  },
  // ─── UARPS Soberano (AAA+ Governance) ───
  "permission-resolver": {
    name: "Permission Resolver",
    description: "UARPS Soberano - Resolve permissões UMA vez e emite modelo resolvido via PERMISSIONS_EVENTS",
    category: d.AUTH,
    version: "1.0.0-ENTERPRISE-AAA",
    critical: !0,
    canDisable: !1,
    requiresAuth: !1,
    requiresReady: !0,
    dependencies: ["event-bus", "session-manager"],
    healthWeight: 8,
    owner: "governance-team"
  },
  // ─────────────────────────────────────────────────────────────
  // UI - Interface de usuário
  // ─────────────────────────────────────────────────────────────
  "app-shell": {
    name: "App Shell",
    description: "Shell principal da aplicação",
    category: d.UI,
    version: "7.0.0",
    critical: !0,
    canDisable: !1,
    requiresReady: !0,
    dependencies: ["event-bus", "session-manager"],
    healthWeight: 10,
    owner: "ui-team"
  },
  "layout-manager": {
    name: "Layout Manager",
    description: "Gerenciamento de layout responsivo da aplicação - state machine com 7 estados (default, compact, fullscreen, admin, dashboard, monitor, kiosk)",
    category: d.UI,
    version: "5.7.0-INIT-SAFE",
    critical: !0,
    canDisable: !1,
    dependencies: ["app-shell", "event-bus"],
    healthWeight: 7,
    owner: "ui-team"
  },
  // ─── AAA+ Governance: Header consome PERMISSIONS_EVENTS.READY ───
  header: {
    name: "Header",
    description: "Barra superior da aplicação - consome PERMISSIONS_EVENTS.READY para sincronização AAA+",
    category: d.UI,
    version: "6.1.0-UARPS-SOBERANO",
    critical: !0,
    canDisable: !1,
    requiresAuth: !1,
    dependencies: ["app-shell", "event-bus", "permission-resolver"],
    softDependencies: ["session-manager"],
    healthWeight: 5,
    owner: "ui-team"
  },
  footer: {
    name: "Footer",
    description: "Rodapé da aplicação",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["app-shell"],
    owner: "ui-team"
  },
  // ─── AAA+ Governance: Sidebar consome PermissionResolver como fonte primária ───
  sidebar: {
    name: "Sidebar",
    description: "Barra lateral de navegação - usa PermissionResolver (UARPS Soberano) para filtragem de permissões",
    category: d.NAVIGATION,
    version: "6.5.0-UARPS-SOBERANO",
    critical: !1,
    requiresAuth: !0,
    minLevel: 0,
    dependencies: ["app-shell", "nav-rail", "permission-resolver"],
    softDependencies: ["router"],
    owner: "navigation-team"
  },
  main: {
    name: "Main Content",
    description: "Área principal de conteúdo",
    category: d.UI,
    version: "1.0.0",
    critical: !0,
    dependencies: ["app-shell", "layout-manager"],
    owner: "ui-team"
  },
  // ─── P0 Governance: Container-Main — Plataforma de UI ───
  "container-main": {
    name: "Container Main",
    description: "Kernel adaptativo de UI - plataforma de painéis, slots, layout geométrico, 8 facades, audit system, 27 componentes DI-STRICT",
    category: d.UI,
    version: "8.2.0-ENTERPRISE",
    critical: !0,
    canDisable: !1,
    requiresAuth: !1,
    dependencies: ["app-shell", "event-bus", "layout-manager"],
    softDependencies: ["session-manager", "theme-manager"],
    healthWeight: 9,
    owner: "ui-team"
  },
  "overlay-layer": {
    name: "Overlay Layer",
    description: "Camada de overlays e modais",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["app-shell"],
    owner: "ui-team"
  },
  "modal-manager": {
    name: "Modal Manager",
    description: "Gerenciamento global de modais",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus", "overlay-layer"],
    owner: "ui-team"
  },
  "theme-manager": {
    name: "Theme Manager",
    description: "Gerenciamento de temas e dark mode",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "ui-team"
  },
  "icon-registry": {
    name: "Icon Registry",
    description: "Registro e cache de ícones SVG",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["asset-loader"],
    owner: "ui-team"
  },
  "notification-manager": {
    name: "Notification Manager",
    description: "Sistema de notificações",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "ui-team"
  },
  "toast-service": {
    name: "Toast Service",
    description: "Serviço de toasts/snackbars",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "ui-team"
  },
  preloader: {
    name: "Preloader",
    description: "Tela de carregamento inicial",
    category: d.UI,
    version: "1.0.0",
    critical: !0,
    canDisable: !1,
    owner: "ui-team"
  },
  "accessibility-manager": {
    name: "Accessibility Manager",
    description: "Gerenciamento de acessibilidade",
    category: d.UI,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "ui-team"
  },
  // ─────────────────────────────────────────────────────────────
  // NAVIGATION - Navegação e rotas
  // ─────────────────────────────────────────────────────────────
  router: {
    name: "Router",
    description: "Sistema de rotas SPA",
    category: d.NAVIGATION,
    version: "2.0.0",
    critical: !0,
    canDisable: !1,
    requiresReady: !0,
    dependencies: ["event-bus", "session-manager"],
    healthWeight: 10,
    owner: "navigation-team"
  },
  // ─── AAA+ Governance: Nav-Rail consome PermissionResolver para getUserLevel() ───
  "nav-rail": {
    name: "Nav Rail",
    description: "Navegação principal (Material Design) - getUserLevel() via PermissionResolver (UARPS Soberano)",
    category: d.NAVIGATION,
    version: "4.2.0-UARPS-SOBERANO",
    critical: !1,
    requiresAuth: !0,
    minLevel: 0,
    dependencies: ["router", "session-manager", "permission-resolver"],
    owner: "navigation-team"
  },
  "command-palette": {
    name: "Command Palette",
    description: "Paleta de comandos (Ctrl+K)",
    category: d.NAVIGATION,
    version: "1.0.0",
    critical: !1,
    requiresAuth: !0,
    dependencies: ["router", "event-bus"],
    owner: "navigation-team"
  },
  // ─────────────────────────────────────────────────────────────
  // DATA - Gerenciamento de dados
  // ─────────────────────────────────────────────────────────────
  panels: {
    name: "Panel System",
    description: "Sistema de painéis de dados",
    category: d.DATA,
    version: "1.0.0",
    critical: !1,
    requiresAuth: !0,
    dependencies: ["router", "main"],
    owner: "data-team"
  },
  // ─── P0 Governance: Panel Orchestrator — Lifecycle de painéis ───
  "panel-orchestrator": {
    name: "Panel Orchestrator",
    description: "Orquestrador de ciclo de vida de painéis - scheduler, presets, health monitor, degradeMode",
    category: d.DATA,
    version: "8.1.0-ENTERPRISE",
    critical: !0,
    canDisable: !1,
    requiresAuth: !1,
    dependencies: ["event-bus", "container-main"],
    softDependencies: ["session-manager", "telemetry-kernel"],
    healthWeight: 8,
    owner: "ui-team"
  },
  cards: {
    name: "Card System",
    description: "Sistema de cards de dados",
    category: d.DATA,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "data-team"
  },
  charts: {
    name: "Chart System",
    description: "Sistema de gráficos",
    category: d.DATA,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "data-team"
  },
  "table-engine": {
    name: "Table Engine",
    description: "Engine de tabelas avançadas",
    category: d.DATA,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "data-team"
  },
  // ─────────────────────────────────────────────────────────────
  // INTEGRATION - Integrações externas
  // ─────────────────────────────────────────────────────────────
  "network-monitor": {
    name: "Network Monitor",
    description: "Monitoramento de conexão de rede",
    category: d.INTEGRATION,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "infra-team"
  },
  "sw-controller": {
    name: "Service Worker Controller",
    description: "Controle do Service Worker",
    category: d.INTEGRATION,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "infra-team"
  },
  "context-provider": {
    name: "Context Provider",
    description: "Provedor de contexto global",
    category: d.INTEGRATION,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "core-team"
  },
  // ─────────────────────────────────────────────────────────────
  // TELEMETRY - Monitoramento e métricas
  // ─────────────────────────────────────────────────────────────
  "telemetry-kernel": {
    name: "Telemetry Kernel",
    description: "Kernel de telemetria e métricas",
    category: d.TELEMETRY,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus"],
    owner: "observability-team"
  },
  "analytics-manager": {
    name: "Analytics Manager",
    description: "Gerenciamento de analytics",
    category: d.TELEMETRY,
    version: "1.0.0",
    critical: !1,
    dependencies: ["event-bus", "session-manager"],
    owner: "observability-team"
  },
  "audit-trail": {
    name: "Audit Trail",
    description: "Trilha de auditoria",
    category: d.TELEMETRY,
    version: "1.0.0",
    critical: !1,
    requiresAuth: !0,
    minLevel: 50,
    dependencies: ["event-bus", "session-manager"],
    owner: "security-team"
  },
  "dev-tools": {
    name: "Dev Tools",
    description: "Ferramentas de desenvolvimento",
    category: d.TELEMETRY,
    version: "1.0.0",
    critical: !1,
    experimental: !0,
    dependencies: ["event-bus"],
    owner: "dev-team"
  },
  // ─────────────────────────────────────────────────────────────
  // EXPERIMENTAL - Features experimentais
  // ─────────────────────────────────────────────────────────────
  "feature-flags": {
    name: "Feature Flags",
    description: "Sistema de feature flags",
    category: d.EXPERIMENTAL,
    version: "1.0.0",
    critical: !1,
    experimental: !0,
    dependencies: ["event-bus"],
    owner: "platform-team"
  },
  "device-manager": {
    name: "Device Manager",
    description: "Gerenciamento de dispositivos",
    category: d.EXPERIMENTAL,
    version: "1.0.0",
    critical: !1,
    experimental: !0,
    dependencies: ["event-bus"],
    owner: "platform-team"
  }
};
let ue = !1, G = null;
function Yr(e) {
  e = e || {};
  const t = e.lock !== !1, n = e.silent || !1;
  if (ue)
    return {
      ok: !0,
      alreadyRegistered: !0,
      result: G
    };
  const a = {
    total: 0,
    success: 0,
    failed: 0,
    errors: [],
    features: []
  };
  n || Ae.info(`Registering ${Object.keys(C).length} features...`);
  for (const r in C)
    if (C.hasOwnProperty(r)) {
      a.total++;
      const s = R.register(r, C[r]);
      s.ok ? (a.success++, a.features.push(r)) : (a.failed++, a.errors.push({ featureId: r, error: s.error }), n || Ae.warn(`Failed to register: ${r}`, { error: s.error }));
    }
  if (n || Ae.info(`Registration complete: ${a.success}/${a.total} features`), t && a.failed === 0) {
    const r = R.lock();
    a.locked = r.ok, n || Ae.info(`Manifest locked: ${r.ok}`);
  }
  return ue = !0, G = a, { ok: a.failed === 0, results: a };
}
function zr() {
  return ue;
}
function Kr() {
  return G;
}
function Wr() {
  return Object.assign({}, C);
}
function Jr(e) {
  const t = [];
  for (const n in C)
    C[n].category === e && t.push({ id: n, definition: C[n] });
  return t;
}
function kt() {
  const e = [];
  for (const t in C)
    C[t].critical && e.push(t);
  return e;
}
function Zr() {
  const e = {
    registered: { ok: ue, severity: "info" },
    noErrors: { ok: !G || G.failed === 0, severity: "warn" },
    manifestLocked: { ok: (G == null ? void 0 : G.locked) === !0, severity: "info" }
  }, t = Object.values(e).filter((a) => a.ok).length, n = Object.keys(e).length;
  return {
    status: t === n ? "HEALTHY" : t >= n - 1 ? "DEGRADED" : "UNHEALTHY",
    moduleId: we,
    version: qe,
    score: `${t}/${n}`,
    checks: e,
    totalFeatures: Object.keys(C).length,
    timestamp: Date.now()
  };
}
function Xr() {
  return {
    moduleId: we,
    version: qe,
    registered: ue,
    totalFeatures: Object.keys(C).length,
    criticalCount: kt().length,
    categories: Object.keys(d).length,
    result: G,
    timestamp: Date.now()
  };
}
const Q = {
  VERSION: qe,
  MODULE_ID: we,
  FEATURES: C,
  registerAllFeatures: Yr,
  isRegistered: zr,
  getRegistrationResult: Kr,
  getFeatureDefinitions: Wr,
  getFeaturesByCategory: Jr,
  getCriticalFeatures: kt,
  healthCheck: Zr,
  info: Xr
}, Ye = "1.1.0-P2-ENTERPRISE", ze = "core.kernel.governance-guard", b = {
  canInitCalls: 0,
  guardedInitCalls: 0,
  blockedOperations: 0,
  allowedOperations: 0,
  heavyOperationChecks: 0,
  lastCheckAt: null
};
function Dt(e, t) {
  if (t = t || {}, b.canInitCalls++, b.lastCheckAt = Date.now(), !l.hasContext())
    return b.allowedOperations++, { allowed: !0, reason: "No context yet (early boot)", earlyBoot: !0 };
  if (!l.canOperate()) {
    const n = l.getMode(), a = l.getPhase();
    return b.blockedOperations++, x.governanceBlock(e, "System not ready", n), {
      allowed: !1,
      reason: "System not ready for operations",
      mode: n,
      phase: a,
      deferred: !0
    };
  }
  if (t.requiresAuth) {
    const n = l.canEnableFeature({ requiresAuth: !0 });
    if (!n.allowed)
      return b.blockedOperations++, x.governanceBlock(e, "Auth required", l.getMode()), {
        allowed: !1,
        reason: n.reason || "Authentication required",
        deferred: !0
      };
  }
  if (t.requiresCapability && !l.isCapabilityEnabled(t.requiresCapability))
    return b.blockedOperations++, x.governanceBlock(e, `Capability missing: ${t.requiresCapability}`, l.getMode()), {
      allowed: !1,
      reason: `Required capability not available: ${t.requiresCapability}`,
      deferred: !0
    };
  if (t.minLevel) {
    const n = l.getAuthLevel ? l.getAuthLevel() : 0;
    if (n < t.minLevel)
      return b.blockedOperations++, {
        allowed: !1,
        reason: `Insufficient auth level. Required: ${t.minLevel}, Current: ${n}`,
        deferred: !1
      };
  }
  return b.allowedOperations++, { allowed: !0 };
}
function Ct(e, t, n) {
  n = n || {}, b.guardedInitCalls++;
  const a = Dt(e, n);
  if (!a.allowed) {
    if (a.deferred && n.onDeferred) {
      const s = l.subscribe((u) => {
        u.ready && !u.maintenance && (s(), Ct(e, t, Object.assign({}, n, { onDeferred: null })));
      });
      typeof n.onDeferred == "function" && n.onDeferred(a);
    }
    return Promise.resolve({
      ok: !1,
      blocked: !0,
      reason: a.reason,
      mode: a.mode,
      phase: a.phase,
      deferred: a.deferred
    });
  }
  const r = Date.now();
  return Promise.resolve().then(() => t()).then((s) => {
    const u = Date.now() - r;
    return I.report(e, {
      status: "HEALTHY",
      score: 100,
      details: { initDuration: u }
    }), x.featureEnabled(e, u), s;
  }).catch((s) => {
    throw I.report(e, {
      status: "UNHEALTHY",
      score: 0,
      error: s.message
    }), x.featureError(e, s.message), s;
  });
}
function Qr(e) {
  return b.heavyOperationChecks++, b.lastCheckAt = Date.now(), l.hasContext() ? l.canPerformHeavyOperations() ? (b.allowedOperations++, { allowed: !0 }) : (b.blockedOperations++, {
    allowed: !1,
    reason: "System in degraded state, heavy operations blocked",
    mode: l.getMode()
  }) : { allowed: !0, earlyBoot: !0 };
}
function ea(e, t, n, a) {
  return I.report(e, {
    status: t,
    score: n,
    details: a
  });
}
function ta(e) {
  return l.subscribe(e);
}
function na() {
  return l.getSnapshot();
}
function ra() {
  return l.hasContext();
}
function aa() {
  const e = l.hasContext(), t = e ? l.canOperate() : null, n = b.allowedOperations + b.blockedOperations, a = n > 0 ? b.blockedOperations / n * 100 : 0, r = {
    hasContext: { ok: e, severity: "info" },
    canOperate: { ok: t !== !1, severity: "warn" },
    lowBlockRate: { ok: a < 50, severity: "warn" },
    runtimeConsumerAvailable: { ok: !!l, severity: "crit" },
    healthAggregatorAvailable: { ok: !!I, severity: "warn" }
  }, s = Object.values(r).filter((y) => y.ok).length, u = Object.keys(r).length;
  return {
    status: s >= u - 1 ? "HEALTHY" : s >= u - 2 ? "DEGRADED" : "UNHEALTHY",
    version: Ye,
    moduleId: ze,
    score: `${s}/${u}`,
    checks: r,
    metrics: { ...b },
    blockRate: `${Math.round(a)}%`,
    timestamp: Date.now()
  };
}
function ia() {
  return {
    moduleId: ze,
    version: Ye,
    hasContext: l.hasContext(),
    canOperate: l.hasContext() ? l.canOperate() : null,
    mode: l.hasContext() ? l.getMode() : null,
    phase: l.hasContext() ? l.getPhase() : null,
    metrics: { ...b },
    timestamp: Date.now()
  };
}
const F = {
  VERSION: Ye,
  MODULE_ID: ze,
  canInit: Dt,
  guardedInit: Ct,
  canPerformHeavyOperation: Qr,
  reportHealth: ea,
  onContextChange: ta,
  getContextSnapshot: na,
  hasContext: ra,
  healthCheck: aa,
  info: ia
}, oa = "1.6.0-P2-ENTERPRISE", sa = "core/kernel", ca = {
  // Manifest
  registerFeature: R.register,
  registerFeatures: R.registerBatch,
  getManifest: R.getAll,
  isRegistered: R.isRegistered,
  validateActivation: R.validateActivation,
  lockManifest: R.lock,
  isManifestLocked: R.isLocked,
  // Feature Definitions (P2+)
  registerAllFeatures: Q.registerAllFeatures,
  isAllRegistered: Q.isRegistered,
  getFeatureDefinitions: Q.getFeatureDefinitions,
  getCriticalFeatures: Q.getCriticalFeatures,
  // Flags
  setFlag: R.setFlag,
  getFlag: R.getFlag,
  isEnabled: R.isEnabled,
  // Health
  reportHealth: I.report,
  getHealth: I.getSummary,
  getFeatureHealth: I.getFeatureHealth,
  getCategoryHealth: I.getCategoryHealth,
  getGlobalHealth: I.getGlobalHealth,
  // Telemetry
  emit: x.emit,
  track: x.info,
  // Context
  getContext: l.getContext,
  getSnapshot: l.getSnapshot,
  canOperate: l.canOperate,
  // Guard (P2+)
  canInit: F.canInit,
  guardedInit: F.guardedInit,
  canPerformHeavyOperation: F.canPerformHeavyOperation,
  onContextChange: F.onContextChange,
  hasContext: F.hasContext,
  // Info
  info() {
    return {
      manifest: R.info(),
      definitions: Q.info(),
      health: I.info(),
      telemetry: x.info(),
      consumer: l.info(),
      guard: F.info()
    };
  },
  healthCheck() {
    return {
      manifest: R.healthCheck(),
      health: I.healthCheck(),
      telemetry: x.healthCheck(),
      consumer: l.healthCheck(),
      guard: F.healthCheck()
    };
  }
}, ga = {
  VERSION: oa,
  MODULE_ID: sa,
  // P0 Modules
  BaseKernel: Xt,
  FeatureRegistry: Tn,
  RuntimeConsumer: l,
  // P2 Modules
  FeatureManifest: R,
  HealthAggregator: I,
  TelemetryEmitter: x,
  FeatureDefinitions: Q,
  GovernanceGuard: F,
  // P2 Facade
  Governance: ca
};
export {
  _ as EVENT_TYPES,
  d as FEATURE_CATEGORIES,
  p as FEATURE_STATUS,
  ye as FLAG_SOURCES,
  ca as Governance,
  j as HEALTH_STATUS,
  Qe as KERNEL_EVENTS,
  Le as KERNEL_STATUS,
  P as LEVELS,
  sa as MODULE_ID,
  ne as PRIORITY,
  oa as VERSION,
  rt as aggregateMetrics,
  it as canAttemptRecovery,
  st as canAuthenticate,
  gn as canEnableFeature,
  Dt as canInit,
  ot as canNavigate,
  pn as canOperate,
  Qr as canPerformHeavyOperation,
  mn as canPerformHeavyOperations,
  ct as canShowUI,
  Cr as cascadeSuspended,
  _r as clearBuffer,
  xr as clearFilters,
  Ur as configure,
  Wt as createDiagnosticsExport,
  et as createEnvelope,
  wn as createFeatureRegistry,
  tt as createHealthResult,
  ga as default,
  Rn as destroy,
  Fr as disableEmitter,
  X as emit,
  yr as emitCritical,
  Er as emitDebug,
  je as emitError,
  ie as emitInfo,
  Ce as emitWarn,
  Pr as enableEmitter,
  Rr as featureDisabled,
  vr as featureEnabled,
  Ar as featureError,
  kr as featureRecovery,
  br as featureRegistered,
  At as flush,
  Un as get,
  Bn as getAll,
  fn as getAuthLevel,
  Lr as getBuffer,
  Pn as getByCategory,
  lt as getCapabilities,
  ft as getCategories,
  nr as getCategoryHealth,
  ir as getCategorySummary,
  Br as getConfig,
  E as getContext,
  na as getContextSnapshot,
  nt as getDependents,
  pt as getDeprecatedFeatures,
  ht as getExperimentalFeatures,
  Wr as getFeatureDefinitions,
  tr as getFeatureHealth,
  Jr as getFeaturesByCategory,
  Be as getFlag,
  ar as getFullReport,
  rr as getGlobalHealth,
  jr as getInfo,
  Gr as getMetrics,
  an as getMode,
  on as getPhase,
  En as getSnapshot,
  Dr as governanceBlock,
  Ct as guardedInit,
  rn as hasContext,
  wr as healthChange,
  nn as init,
  hn as isCapabilityEnabled,
  cn as isDegraded,
  Hn as isEnabled,
  un as isFailed,
  ln as isInMaintenance,
  dn as isInRecovery,
  Vn as isLocked,
  sn as isReady,
  Fn as isRegistered,
  Gn as lock,
  Ir as lockViolation,
  ta as onContextChange,
  $e as recalculateCategoryHealth,
  Ge as recalculateGlobalHealth,
  Or as recoveryBackoff,
  ut as register,
  Yr as registerAllFeatures,
  Mn as registerBatch,
  er as remove,
  Fe as report,
  Qn as reportBatch,
  ea as reportHealth,
  Hr as setFilter,
  dt as setFlag,
  Kt as sortByPriority,
  ke as subscribe,
  vn as subscribeToDegradation,
  yn as subscribeToMode,
  bn as subscribeToPhase,
  xn as syncWithKernel,
  jn as unlock,
  Nr as unregisteredBlock,
  $n as validateActivation,
  _e as validateDependencies
};
