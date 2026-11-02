import { guardedBoot as Gd } from "/boot/boot-guard.js";
import { BOOT_EVENTS as Ot } from "/core/runtime/events/catalog/boot.events.js";
import { createCorePorts as Ln } from "/core/runtime/ports-profiles.js";
import { isStrict as de, recordViolation as Sn, setBootReady as zd, EnterpriseViolationError as Ht, setEventBusGetter as Vd, VERSION as Va, healthCheck as Yd, getViolations as jd, exposeDevTools as Wd } from "/core/runtime/enterprise/strict-mode.js";
import * as Vt from "/core/runtime/enterprise/governance-telemetry-bridge.js";
import { createReadyPayload as $d, createUpdatedPayload as al } from "/core/runtime/constants/payload-contracts.js";
import { createEarlyLogger as Kd } from "/core/runtime/early-boot-logger.js";
import { DEGRADATION_EVENTS as _n } from "/core/runtime/events/catalog/degradation.events.js";
import { CORE_EVENTS as Bt } from "/core/runtime/events/catalog/core.events.js";
import { validateAll as qd } from "/core/runtime/contracts/runtime-governance-rules.js";
import { registerModule as Jd, aggregateHealth as Zd } from "/core/runtime/health/runtime-health-aggregator.js";
import { AUTH_EVENTS as st } from "/core/runtime/events/catalog/auth.events.js";
import Qd from "/core/auth/permissions/permissions-guard-enterprise.js";
import Xd from "/core/auth/policies/security-policies-enterprise.js";
import ef from "/core/auth/auth-orchestrator/auth-orchestrator.js";
import tf, { setOrchestrator as rf } from "/core/auth/adapters/auth-adapter-enterprise.js";
import { SessionManager as ne } from "/components/session-manager/dist/session-manager.bundle.js";
import { createAuthRedirectController as nf } from "/core/auth/bridges/auth-redirect-controller.js";
import { ROUTER_EVENTS as Gl } from "/core/runtime/events/catalog/router.events.js";
import { ORCHESTRATOR_EVENTS as af } from "/core/runtime/events/catalog/orchestrator.events.js";
import { findRegion as pt, REGION_IDS as Et } from "/platform/shell/layout-regions.js";
import { SHELL_EVENTS as of } from "/core/runtime/events/catalog/shell.events.js";
var Or = "bootstrap-v2-loader", rr = "7.0.0-EXPLICIT-START", sr = typeof window < "u";
const lr = {
  preBootOrchestrator: null,
  bootstrapInstance: null,
  preBootResult: null,
  bootResult: null
};
function _i() {
  return lr.preBootOrchestrator;
}
function sf(e) {
  lr.preBootOrchestrator = e;
}
function yo() {
  return lr.bootstrapInstance;
}
function lf(e) {
  lr.bootstrapInstance = e;
}
function zi() {
  return lr.preBootResult;
}
function uf(e) {
  lr.preBootResult = e;
}
function zl() {
  return lr.bootResult;
}
function cf(e) {
  lr.bootResult = e;
}
const z = Object.freeze({
  PHASE_CRITICAL: 5e3,
  PHASE_CORE: 1e4,
  PHASE_AUTH: 15e3,
  PHASE_SHELL: 2e4,
  PHASE_MAIN: 15e3,
  PHASE_UI: 1e4,
  PHASE_PLATFORM: 1e4,
  MODULE_EVENTBUS: 3e3,
  MODULE_LOGGER: 5e3,
  MODULE_ERROR_BOUNDARY: 3e3,
  MODULE_CONFIG: 5e3,
  MODULE_SECURITY: 3e3,
  MODULE_ENVIRONMENT: 3e3,
  MODULE_GLOBAL_STATE: 5e3,
  MODULE_ROUTER: 5e3,
  MODULE_READY_FLAGS: 3e3,
  MODULE_TELEMETRY: 3e3,
  MODULE_SESSION: 5e3,
  MODULE_AUTH: 5e3,
  MODULE_LOGIN: 5e3,
  MODULE_APP_SHELL: 8e3,
  MODULE_HEADER: 5e3,
  MODULE_NAV: 5e3,
  MODULE_FOOTER: 5e3,
  MODULE_MAIN_ENGINE: 1e4,
  MODULE_CONTAINER: 5e3,
  MODULE_UI_ORCHESTRATOR: 5e3,
  MODULE_TICKER: 5e3,
  MODULE_TOAST: 3e3,
  MODULE_PRELOADER: 2e3,
  MODULE_PLATFORM: 5e3,
  // UI Delays (v1.1.0 - Timeout Formalization)
  UI_DELAY_SHORT: 200,
  UI_DELAY_MEDIUM: 250,
  UI_DELAY_LONG: 500,
  UI_DELAY_RETRY: 300,
  UI_DELAY_INIT: 1e3,
  CONFIG_WAIT: 8e3,
  DEFAULT_PHASE: 3e4,
  DEFAULT_MODULE: 1e4
}), ie = Object.freeze({
  HALT: "halt",
  DEGRADED: "degraded",
  SKIP: "skip",
  ALLOW_SHELL_ONLY: "allow-shell-only",
  ALLOW_LOGIN_ONLY: "allow-login-only"
}), N = Object.freeze({
  HEALTHY: "HEALTHY",
  DEGRADED: "DEGRADED",
  UNHEALTHY: "UNHEALTHY",
  FAILED: "FAILED"
});
function df(e) {
  return z[e] || z.DEFAULT_MODULE;
}
function ff() {
  return { ...z };
}
var B = N, hf = Object.freeze([
  N.HEALTHY,
  N.DEGRADED,
  N.UNHEALTHY,
  N.FAILED
]), Ya = Object.freeze({
  // Minúsculas → Maiúsculas
  healthy: N.HEALTHY,
  degraded: N.DEGRADED,
  unhealthy: N.UNHEALTHY,
  failed: N.FAILED,
  // Status customizados → BOOT_HEALTH padrão
  initializing: N.DEGRADED,
  INITIALIZING: N.DEGRADED,
  unknown: N.DEGRADED,
  UNKNOWN: N.DEGRADED,
  CANCELLED: N.FAILED,
  cancelled: N.FAILED,
  OFFLINE: N.UNHEALTHY,
  offline: N.UNHEALTHY,
  CRITICAL: N.FAILED,
  critical: N.FAILED,
  NOT_INITIALIZED: N.DEGRADED,
  not_initialized: N.DEGRADED,
  DISABLED: N.DEGRADED,
  disabled: N.DEGRADED,
  NOT_EXECUTED: N.DEGRADED,
  not_executed: N.DEGRADED,
  // Já válidos (passthrough)
  HEALTHY: N.HEALTHY,
  DEGRADED: N.DEGRADED,
  UNHEALTHY: N.UNHEALTHY,
  FAILED: N.FAILED
});
function gf(e) {
  if (!e || typeof e != "string")
    return N.DEGRADED;
  var t = Ya[e];
  if (t) return t;
  var r = e.toUpperCase();
  return Ya[r] ? Ya[r] : N.DEGRADED;
}
function mf(e) {
  return hf.indexOf(e) !== -1;
}
function ue(e) {
  e || (e = {});
  var t = e.status || N.DEGRADED;
  mf(t) || (t = gf(t));
  var r = {
    status: t,
    moduleId: e.moduleId || "unknown",
    version: e.version || "0.0.0",
    timestamp: e.timestamp || Date.now()
  };
  if (e.checks && typeof e.checks == "object") {
    r.checks = e.checks;
    for (var n = Object.keys(e.checks), i = 0, o = 0; o < n.length; o++)
      e.checks[n[o]] && i++;
    r.score = i + "/" + n.length;
  }
  return e.details && typeof e.details == "object" && (r.details = e.details), e.message && typeof e.message == "string" && (r.message = e.message), r;
}
const V = Object.freeze({
  // PERMITIDOS
  INFORMATIONAL: "informational",
  // Apenas informa sobre algo que aconteceu
  OBSERVABILITY: "observability",
  // Telemetria, métricas, logging
  NOTIFICATION: "notification",
  // Notifica UI sobre estado
  PROGRESS: "progress",
  // Indica progresso de operação
  // RESTRITOS (requerem justificativa)
  COORDINATION: "coordination",
  // Coordena múltiplos módulos (usar com cuidado)
  // PROIBIDOS (violam princípio arquitetural)
  DECISIONAL: "decisional",
  // Evento que decide fluxo — PROIBIDO
  COMMAND: "command"
  // Evento que executa ação — PROIBIDO (use commands)
}), ye = Object.freeze({
  PRE_BOOT: "pre-boot",
  ORCHESTRATOR: "orchestrator",
  PHASE: "phase",
  MODULE: "module",
  BOOTSTRAP: "bootstrap",
  PROGRESS: "progress",
  HEALTH: "health",
  DEGRADATION: "degradation",
  KERNEL: "kernel",
  ROLLBACK: "rollback"
}), pf = Object.freeze({
  // PRE-BOOT: Apenas informacional
  [ye.PRE_BOOT]: {
    allowedRoles: [V.INFORMATIONAL, V.PROGRESS],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["timestamp"],
    optionalFields: ["source", "time", "modules"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    description: "Pre-boot events are purely informational"
  },
  // ORCHESTRATOR: Informacional + coordenação limitada
  [ye.ORCHESTRATOR]: {
    allowedRoles: [V.INFORMATIONAL, V.OBSERVABILITY, V.COORDINATION],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["phaseId", "timestamp"],
    optionalFields: ["result", "error", "time", "name"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    // Fluxo é decidido pelo orchestrator, não pelo evento
    description: "Orchestrator events inform about phase execution"
  },
  // PHASE: Informacional
  [ye.PHASE]: {
    allowedRoles: [V.INFORMATIONAL, V.PROGRESS],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["phaseId", "timestamp"],
    optionalFields: ["phaseName", "phaseIndex", "totalPhases", "percentage"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    description: "Phase events track phase lifecycle"
  },
  // MODULE: Observabilidade
  [ye.MODULE]: {
    allowedRoles: [V.OBSERVABILITY, V.INFORMATIONAL],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["moduleId", "timestamp"],
    optionalFields: ["time", "error", "metrics"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    description: "Module events are for telemetry only"
  },
  // BOOTSTRAP: Pode notificar UI (após boot completo)
  [ye.BOOTSTRAP]: {
    allowedRoles: [V.INFORMATIONAL, V.NOTIFICATION],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["timestamp"],
    optionalFields: ["totalTime", "phases", "context", "health", "result"],
    canTriggerUIChange: !0,
    // Apenas para indicar fim do boot
    canTriggerFlowChange: !1,
    description: "Bootstrap events can notify UI about boot completion"
  },
  // PROGRESS: Pode atualizar UI (progresso visual)
  [ye.PROGRESS]: {
    allowedRoles: [V.PROGRESS, V.NOTIFICATION],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["percentage", "timestamp"],
    optionalFields: ["phase", "phaseName", "phaseIndex", "totalPhases"],
    canTriggerUIChange: !0,
    // Atualiza barra de progresso
    canTriggerFlowChange: !1,
    description: "Progress events update UI progress indicators"
  },
  // HEALTH: Observabilidade
  [ye.HEALTH]: {
    allowedRoles: [V.OBSERVABILITY, V.INFORMATIONAL],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["status", "timestamp"],
    optionalFields: ["score", "checkNumber", "details"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    description: "Health events are for monitoring only"
  },
  // DEGRADATION: Pode notificar UI
  [ye.DEGRADATION]: {
    allowedRoles: [V.NOTIFICATION, V.INFORMATIONAL],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["type", "timestamp"],
    optionalFields: ["message", "phaseId", "severity", "recoverable"],
    canTriggerUIChange: !0,
    // Mostra banner/toast de degradação
    canTriggerFlowChange: !1,
    // Degradação é decidida pelo contrato, não pelo evento
    description: "Degradation events notify UI about degraded state"
  },
  // KERNEL: Informacional + coordenação limitada
  [ye.KERNEL]: {
    allowedRoles: [V.INFORMATIONAL, V.COORDINATION],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["timestamp"],
    optionalFields: ["mode", "state", "capability", "health"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    description: "Kernel events inform about kernel state changes"
  },
  // ROLLBACK: Informacional
  [ye.ROLLBACK]: {
    allowedRoles: [V.INFORMATIONAL, V.OBSERVABILITY],
    forbiddenRoles: [V.DECISIONAL, V.COMMAND],
    requiredFields: ["phaseId", "timestamp"],
    optionalFields: ["effects", "error", "time"],
    canTriggerUIChange: !1,
    canTriggerFlowChange: !1,
    description: "Rollback events inform about rollback execution"
  }
});
function Ef(e) {
  if (!e || typeof e != "string")
    return null;
  const t = e.toLowerCase();
  return t.indexOf("pre-boot") !== -1 || t.indexOf("preboot") !== -1 ? ye.PRE_BOOT : t.indexOf("orchestrator") !== -1 ? ye.ORCHESTRATOR : t.indexOf("phase") !== -1 && t.indexOf("progress") === -1 ? ye.PHASE : t.indexOf("module") !== -1 ? ye.MODULE : t.indexOf("bootstrap") !== -1 ? ye.BOOTSTRAP : t.indexOf("progress") !== -1 ? ye.PROGRESS : t.indexOf("health") !== -1 ? ye.HEALTH : t.indexOf("degrad") !== -1 ? ye.DEGRADATION : t.indexOf("kernel") !== -1 ? ye.KERNEL : t.indexOf("rollback") !== -1 ? ye.ROLLBACK : null;
}
function vf(e, t, r) {
  const n = [], i = [], o = Ef(e), l = o ? pf[o] : null;
  return l ? (l.forbiddenRoles.indexOf(t) !== -1 && n.push('Role "' + t + '" is forbidden for ' + o + " events"), l.allowedRoles.indexOf(t) === -1 && i.push('Role "' + t + '" is not in allowed list for ' + o), (t === V.DECISIONAL || t === V.COMMAND) && n.push("Events cannot have DECISIONAL or COMMAND role (Briefing principle)"), r && (r.triggersFlowChange && !l.canTriggerFlowChange && n.push("Event " + e + " cannot trigger flow changes"), r.triggersUIChange && !l.canTriggerUIChange && i.push("Event " + e + " should not trigger UI changes")), {
    valid: n.length === 0,
    errors: n,
    warnings: i,
    category: o,
    policy: l
  }) : (i.push("No policy found for event: " + e), {
    valid: !0,
    // Permitir eventos desconhecidos mas alertar
    errors: [],
    warnings: i
  });
}
var Vi = "module-events", Yi = "2.4.0-EVENTS-CONTRACT", Nn = "bootstrap:", Kt = null, De = {
  MODULE_START: "module:start",
  MODULE_PROGRESS: "module:progress",
  MODULE_COMPLETE: "module:complete",
  MODULE_ERROR: "module:error",
  MODULE_SKIP: "module:skip",
  MODULE_RETRY: "module:retry",
  // Sprint 7B: Batch events
  PHASE_MODULES_START: "phase:modules:start",
  PHASE_MODULES_COMPLETE: "phase:modules:complete"
}, At = [], Vl = 200, wt = {}, J = {
  totalModulesStarted: 0,
  totalModulesCompleted: 0,
  totalModulesFailed: 0,
  totalModulesSkipped: 0,
  totalRetries: 0,
  timings: [],
  byPhase: {},
  byModule: {}
}, Mn = [];
function Yl(e) {
  return e === void 0 && (e = {}), Kt = e.eventBus || null, { initialized: !0, hasEventBus: !!Kt };
}
function jl(e) {
  Kt = e || null;
}
function ja(e, t) {
  if (e.length === 0) return 0;
  var r = e.slice().sort(function(i, o) {
    return i - o;
  }), n = Math.ceil(t / 100 * r.length) - 1;
  return r[Math.max(0, n)];
}
function Ao() {
  var e = J.timings;
  if (e.length === 0)
    return { count: 0, min: 0, max: 0, avg: 0, p50: 0, p90: 0, p99: 0 };
  var t = e.reduce(function(r, n) {
    return r + n;
  }, 0);
  return {
    count: e.length,
    min: Math.min.apply(null, e),
    max: Math.max.apply(null, e),
    avg: Math.round(t / e.length),
    p50: ja(e, 50),
    p90: ja(e, 90),
    p99: ja(e, 99)
  };
}
function It(e, t) {
  var r = Nn + e, n = vf(r, V.OBSERVABILITY, {
    triggersFlowChange: !1,
    triggersUIChange: !1
  });
  n.valid || Mn.push({
    eventName: r,
    errors: n.errors,
    timestamp: Date.now()
  });
  var i = {
    id: "evt-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5),
    type: e,
    phaseId: t.phaseId || null,
    moduleId: t.moduleId || null,
    moduleName: t.moduleName || null,
    progress: t.progress || null,
    duration: t.duration || null,
    success: t.success !== void 0 ? t.success : null,
    error: t.error || null,
    metadata: t.metadata || {},
    timestamp: Date.now(),
    // v2.4.0: Add role from contract
    role: V.OBSERVABILITY
  };
  for (yf(i), At.unshift(i); At.length > Vl; )
    At.pop();
  var o = wt[e] || [];
  o.forEach(function(a) {
    try {
      a(i);
    } catch {
    }
  });
  var l = wt["*"] || [];
  if (l.forEach(function(a) {
    try {
      a(i);
    } catch {
    }
  }), Kt && Kt.emit)
    try {
      Kt.emit(r, i);
    } catch {
    }
  return i;
}
function yf(e) {
  var t = e.phaseId, r = e.moduleId;
  switch (t && !J.byPhase[t] && (J.byPhase[t] = {
    started: 0,
    completed: 0,
    failed: 0,
    skipped: 0,
    retries: 0,
    timings: []
  }), r && !J.byModule[r] && (J.byModule[r] = {
    executions: 0,
    successes: 0,
    failures: 0,
    retries: 0,
    timings: []
  }), e.type) {
    case De.MODULE_START:
      J.totalModulesStarted++, t && J.byPhase[t].started++, r && J.byModule[r].executions++;
      break;
    case De.MODULE_COMPLETE:
      J.totalModulesCompleted++, t && J.byPhase[t].completed++, e.success && r && J.byModule[r].successes++, !e.success && r && J.byModule[r].failures++, e.duration !== null && (J.timings.push(e.duration), t && J.byPhase[t].timings.push(e.duration), r && J.byModule[r].timings.push(e.duration), J.timings.length > 500 && (J.timings = J.timings.slice(-500)));
      break;
    case De.MODULE_ERROR:
      J.totalModulesFailed++, t && J.byPhase[t].failed++, r && J.byModule[r].failures++;
      break;
    case De.MODULE_SKIP:
      J.totalModulesSkipped++, t && J.byPhase[t].skipped++;
      break;
    case De.MODULE_RETRY:
      J.totalRetries++, t && J.byPhase[t].retries++, r && J.byModule[r].retries++;
      break;
  }
}
function So(e, t) {
  return wt[e] || (wt[e] = []), wt[e].push(t), function() {
    var r = wt[e].indexOf(t);
    r !== -1 && wt[e].splice(r, 1);
  };
}
function Wl(e, t, r, n) {
  return It(De.MODULE_START, {
    phaseId: e,
    moduleId: t,
    moduleName: r,
    metadata: n
  });
}
function $l(e, t, r, n) {
  return It(De.MODULE_PROGRESS, {
    phaseId: e,
    moduleId: t,
    progress: r,
    metadata: n
  });
}
function Kl(e, t, r, n, i) {
  return It(De.MODULE_COMPLETE, {
    phaseId: e,
    moduleId: t,
    duration: r,
    success: n,
    metadata: i
  });
}
function ql(e, t, r, n) {
  return It(De.MODULE_ERROR, {
    phaseId: e,
    moduleId: t,
    error: r,
    success: !1,
    metadata: n
  });
}
function Jl(e, t, r, n) {
  return It(De.MODULE_SKIP, {
    phaseId: e,
    moduleId: t,
    metadata: Object.assign({ reason: r }, n || {})
  });
}
function Zl(e, t, r, n, i) {
  return It(De.MODULE_RETRY, {
    phaseId: e,
    moduleId: t,
    metadata: Object.assign({ attempt: r, maxAttempts: n }, i || {})
  });
}
function Ql(e, t, r) {
  return It(De.PHASE_MODULES_START, {
    phaseId: e,
    metadata: { moduleCount: t, moduleIds: r }
  });
}
function Xl(e, t) {
  var r = t.filter(function(o) {
    return o.success;
  }).length, n = t.filter(function(o) {
    return !o.success;
  }).length, i = t.reduce(function(o, l) {
    return o + (l.duration || 0);
  }, 0);
  return It(De.PHASE_MODULES_COMPLETE, {
    phaseId: e,
    success: n === 0,
    duration: i,
    metadata: {
      moduleCount: t.length,
      succeeded: r,
      failed: n,
      results: t
    }
  });
}
function Oo() {
  return At.slice();
}
function Io(e) {
  return At.filter(function(t) {
    return t.phaseId === e;
  });
}
function eu(e) {
  return At.filter(function(t) {
    return t.moduleId === e;
  });
}
function tu(e) {
  return At.filter(function(t) {
    return t.type === e;
  });
}
function ji(e) {
  var t = Io(e), r = {};
  return t.forEach(function(n) {
    n.moduleId && (r[n.moduleId] || (r[n.moduleId] = { events: [], startTime: null, endTime: null, duration: null, success: null }), r[n.moduleId].events.push(n), n.type === De.MODULE_START && (r[n.moduleId].startTime = n.timestamp), n.type === De.MODULE_COMPLETE && (r[n.moduleId].endTime = n.timestamp, r[n.moduleId].duration = n.duration, r[n.moduleId].success = n.success));
  }), r;
}
function Pn() {
  return {
    totals: {
      started: J.totalModulesStarted,
      completed: J.totalModulesCompleted,
      failed: J.totalModulesFailed,
      skipped: J.totalModulesSkipped,
      retries: J.totalRetries
    },
    timing: Ao(),
    byPhase: Object.keys(J.byPhase).map(function(e) {
      var t = J.byPhase[e];
      return {
        phaseId: e,
        started: t.started,
        completed: t.completed,
        failed: t.failed,
        skipped: t.skipped,
        avgTime: t.timings.length > 0 ? Math.round(t.timings.reduce(function(r, n) {
          return r + n;
        }, 0) / t.timings.length) : 0
      };
    }),
    timestamp: Date.now()
  };
}
function Wi(e) {
  var t = J.byModule[e];
  return t ? {
    moduleId: e,
    executions: t.executions,
    successes: t.successes,
    failures: t.failures,
    successRate: t.executions > 0 ? Math.round(t.successes / t.executions * 100) : 0,
    retries: t.retries,
    timing: t.timings.length > 0 ? {
      min: Math.min.apply(null, t.timings),
      max: Math.max.apply(null, t.timings),
      avg: Math.round(t.timings.reduce(function(r, n) {
        return r + n;
      }, 0) / t.timings.length),
      count: t.timings.length
    } : null
  } : null;
}
function To() {
  return Object.keys(J.byModule).map(function(e) {
    return Wi(e);
  }).filter(Boolean);
}
function ru() {
  return At = [], !0;
}
function bo() {
  J = {
    totalModulesStarted: 0,
    totalModulesCompleted: 0,
    totalModulesFailed: 0,
    totalModulesSkipped: 0,
    totalRetries: 0,
    timings: [],
    byPhase: {},
    byModule: {}
  }, Mn = [];
}
function nu() {
  return Mn.slice();
}
function Ro() {
  var e = Pn();
  return {
    moduleId: Vi,
    version: Yi,
    eventTypes: Object.keys(De),
    eventNamespace: Nn,
    historySize: At.length,
    listenerCount: Object.keys(wt).reduce(function(t, r) {
      return t + wt[r].length;
    }, 0),
    hasEventBus: !!Kt,
    metrics: {
      totalStarted: e.totals.started,
      totalCompleted: e.totals.completed,
      avgTiming: e.timing.avg
    },
    validationWarnings: Mn.length,
    usesEventsContract: !0,
    improvements: ["#9-GranularModuleEvents", "AggregatedMetrics", "TimingPercentiles", "EventsFormalized", "EventsContract"]
  };
}
function iu() {
  var e = Pn(), t = B.HEALTHY;
  return e.totals.failed > e.totals.completed * 0.1 && (t = B.DEGRADED), ue({
    status: t,
    moduleId: Vi,
    version: Yi,
    details: {
      historySize: At.length,
      maxHistory: Vl,
      hasEventBus: !!Kt,
      eventNamespace: Nn,
      failureRate: e.totals.completed > 0 ? Math.round(e.totals.failed / e.totals.completed * 100) : 0,
      validationWarnings: Mn.length,
      usesEventsContract: !0
    }
  });
}
var Af = {
  MODULE_EVENT_TYPES: De,
  MODULE_EVENTS_NAMESPACE: Nn,
  init: Yl,
  setEventBus: jl,
  emit: It,
  on: So,
  emitModuleStart: Wl,
  emitModuleProgress: $l,
  emitModuleComplete: Kl,
  emitModuleError: ql,
  emitModuleSkip: Jl,
  emitModuleRetry: Zl,
  emitPhaseModulesStart: Ql,
  emitPhaseModulesComplete: Xl,
  getEventHistory: Oo,
  getEventsByPhase: Io,
  getEventsByModule: eu,
  getEventsByType: tu,
  getModuleTimeline: ji,
  getMetrics: Pn,
  getModulePerformance: Wi,
  getAllModulePerformance: To,
  getTimingStats: Ao,
  getValidationWarnings: nu,
  clearHistory: ru,
  resetMetrics: bo,
  info: Ro,
  healthCheck: iu,
  MODULE_ID: Vi,
  VERSION: Yi
};
const au = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_EVENTS_NAMESPACE: Nn,
  MODULE_EVENT_TYPES: De,
  MODULE_ID: Vi,
  VERSION: Yi,
  clearHistory: ru,
  default: Af,
  emit: It,
  emitModuleComplete: Kl,
  emitModuleError: ql,
  emitModuleProgress: $l,
  emitModuleRetry: Zl,
  emitModuleSkip: Jl,
  emitModuleStart: Wl,
  emitPhaseModulesComplete: Xl,
  emitPhaseModulesStart: Ql,
  getAllModulePerformance: To,
  getEventHistory: Oo,
  getEventsByModule: eu,
  getEventsByPhase: Io,
  getEventsByType: tu,
  getMetrics: Pn,
  getModulePerformance: Wi,
  getModuleTimeline: ji,
  getTimingStats: Ao,
  getValidationWarnings: nu,
  healthCheck: iu,
  info: Ro,
  init: Yl,
  on: So,
  resetMetrics: bo,
  setEventBus: jl
}, Symbol.toStringTag, { value: "Module" }));
var Jr = "opentelemetry-adapter", Zr = "1.1.0-HEALTH-CONTRACT", je = {
  SERVICE_NAME: "service.name",
  SERVICE_VERSION: "service.version",
  SERVICE_NAMESPACE: "service.namespace",
  DEPLOYMENT_ENVIRONMENT: "deployment.environment",
  // Bootstrap specific
  BOOT_PHASE_ID: "bootstrap.phase.id",
  BOOT_PHASE_NAME: "bootstrap.phase.name",
  BOOT_MODULE_ID: "bootstrap.module.id",
  BOOT_SUCCESS: "bootstrap.success",
  BOOT_DEGRADED: "bootstrap.degraded",
  BOOT_DURATION_MS: "bootstrap.duration_ms",
  BOOT_HEALTH_STATUS: "bootstrap.health.status",
  BOOT_HEALTH_SCORE: "bootstrap.health.score"
}, On = {
  UNSET: 0,
  OK: 1,
  ERROR: 2
}, nr = {
  COUNTER: "counter",
  HISTOGRAM: "histogram",
  GAUGE: "gauge"
}, qt = [], Jt = [], Sf = 100, Of = 500, Ve = {
  serviceName: "dshowdash-bootstrap",
  serviceVersion: "2.8.0-PERSISTENCE",
  serviceNamespace: "bootstrap-v2",
  environment: "production",
  enabled: !0,
  exportEndpoint: null,
  batchSize: 50,
  flushInterval: 3e4
};
function ou() {
  for (var e = "0123456789abcdef", t = "", r = 0; r < 32; r++)
    t += e[Math.floor(Math.random() * 16)];
  return t;
}
function If() {
  for (var e = "0123456789abcdef", t = "", r = 0; r < 16; r++)
    t += e[Math.floor(Math.random() * 16)];
  return t;
}
function wo(e, t, r) {
  var n = {
    traceId: Co || ou(),
    spanId: If(),
    parentSpanId: r || null,
    name: e,
    kind: "INTERNAL",
    startTimeUnixNano: Date.now() * 1e6,
    endTimeUnixNano: null,
    attributes: Hn(Object.assign({}, Ki(), t || {})),
    status: { code: On.UNSET },
    events: []
  };
  for (qt.unshift(n); qt.length > Sf; )
    qt.pop();
  return n;
}
function su(e, t, r) {
  if (!e) return null;
  e.endTimeUnixNano = Date.now() * 1e6, e.status = {
    code: t === "error" ? On.ERROR : On.OK,
    message: r || void 0
  };
  var n = (e.endTimeUnixNano - (e.startTimeUnixNano || 0)) / 1e6;
  return e.attributes.push({
    key: je.BOOT_DURATION_MS,
    value: { intValue: Math.round(n) }
  }), e;
}
function lu(e, t, r) {
  e && e.events.push({
    timeUnixNano: Date.now() * 1e6,
    name: t,
    attributes: Hn(r || {})
  });
}
function kn(e, t, r, n, i) {
  var o = {
    name: "bootstrap." + e,
    description: "Bootstrap metric: " + e,
    unit: i || "ms",
    type: r || nr.GAUGE,
    value: t,
    attributes: Hn(Object.assign({}, Ki(), n || {})),
    timestamp: Date.now()
  };
  for (Jt.unshift(o); Jt.length > Of; )
    Jt.pop();
  return o;
}
function Kr(e, t, r) {
  return kn(e, t, nr.COUNTER, r, "1");
}
function $i(e, t, r, n) {
  return kn(e, t, nr.HISTOGRAM, r, n || "ms");
}
function Do(e, t, r, n) {
  return kn(e, t, nr.GAUGE, r, n || "1");
}
function Hn(e) {
  var t = [];
  for (var r in e)
    if (e.hasOwnProperty(r)) {
      var n = e[r], i = {};
      typeof n == "string" ? i = { stringValue: n } : typeof n == "number" ? i = Number.isInteger(n) ? { intValue: n } : { doubleValue: n } : typeof n == "boolean" ? i = { boolValue: n } : i = { stringValue: String(n) }, t.push({ key: r, value: i });
    }
  return t;
}
function Ki() {
  var e = {};
  return e[je.SERVICE_NAME] = Ve.serviceName, e[je.SERVICE_VERSION] = Ve.serviceVersion, e[je.SERVICE_NAMESPACE] = Ve.serviceNamespace, e[je.DEPLOYMENT_ENVIRONMENT] = Ve.environment, e;
}
var Co = null;
function Lo(e, t) {
  return Co = ou(), wo(e, t, null);
}
function _o() {
  Co = null;
}
function No() {
  return {
    resourceSpans: [{
      resource: {
        attributes: Hn(Ki())
      },
      scopeSpans: [{
        scope: {
          name: Jr,
          version: Zr
        },
        spans: qt.map(function(e) {
          return {
            traceId: e.traceId,
            spanId: e.spanId,
            parentSpanId: e.parentSpanId,
            name: e.name,
            kind: 1,
            startTimeUnixNano: String(e.startTimeUnixNano),
            endTimeUnixNano: e.endTimeUnixNano ? String(e.endTimeUnixNano) : void 0,
            attributes: e.attributes,
            status: e.status,
            events: e.events
          };
        })
      }]
    }]
  };
}
function Mo() {
  return {
    resourceMetrics: [{
      resource: {
        attributes: Hn(Ki())
      },
      scopeMetrics: [{
        scope: {
          name: Jr,
          version: Zr
        },
        metrics: Jt.map(function(e) {
          var t = {
            attributes: e.attributes,
            timeUnixNano: String(e.timestamp * 1e6),
            asDouble: e.value
          }, r = {
            name: e.name,
            description: e.description,
            unit: e.unit
          };
          return e.type === nr.COUNTER ? r.sum = {
            dataPoints: [t],
            aggregationTemporality: 2,
            isMonotonic: !0
          } : e.type === nr.HISTOGRAM ? r.histogram = {
            dataPoints: [Object.assign({}, t, { count: 1, sum: e.value })]
          } : r.gauge = {
            dataPoints: [t]
          }, r;
        })
      }]
    }]
  };
}
function uu(e, t, r, n, i) {
  var o = {};
  o[je.BOOT_PHASE_ID] = e, o[je.BOOT_PHASE_NAME] = t, o[je.BOOT_SUCCESS] = n, o[je.BOOT_DEGRADED] = i || !1, $i("phase.duration", r, o, void 0), Kr("phase.count", 1, o), n || Kr("phase.errors", 1, o);
}
function Po(e, t, r, n) {
  var i = {};
  i[je.BOOT_SUCCESS] = t, i[je.BOOT_HEALTH_STATUS] = r, i[je.BOOT_HEALTH_SCORE] = n, $i("boot.duration", e, i, void 0), Do("boot.health_score", n, i, "%"), Kr("boot.count", 1, i), t || Kr("boot.failures", 1, i);
}
function cu(e) {
  e.serviceName && (Ve.serviceName = e.serviceName), e.serviceVersion && (Ve.serviceVersion = e.serviceVersion), e.serviceNamespace && (Ve.serviceNamespace = e.serviceNamespace), e.environment && (Ve.environment = e.environment), e.enabled !== void 0 && (Ve.enabled = e.enabled), e.exportEndpoint && (Ve.exportEndpoint = e.exportEndpoint);
}
function ko() {
  return Object.assign({}, Ve);
}
function Ho() {
  qt = [];
}
function Bo() {
  Jt = [];
}
function du() {
  Ho(), Bo();
}
function Uo() {
  return {
    moduleId: Jr,
    version: Zr,
    config: ko(),
    spansCount: qt.length,
    metricsCount: Jt.length,
    improvements: ["#13-OpenTelemetryExport"]
  };
}
function fu() {
  var e = B.HEALTHY;
  return Ve.enabled || (e = B.DEGRADED), ue({
    status: e,
    moduleId: Jr,
    version: Zr,
    checks: {
      enabled: Ve.enabled,
      hasSpans: qt.length > 0,
      hasMetrics: Jt.length > 0
    },
    details: {
      enabled: Ve.enabled,
      spansCount: qt.length,
      metricsCount: Jt.length
    }
  });
}
var Tf = {
  OTEL_ATTRIBUTES: je,
  SPAN_STATUS: On,
  METRIC_TYPES: nr,
  createSpan: wo,
  endSpan: su,
  addSpanEvent: lu,
  recordMetric: kn,
  recordCounter: Kr,
  recordHistogram: $i,
  recordGauge: Do,
  startTrace: Lo,
  endTrace: _o,
  exportSpans: No,
  exportMetrics: Mo,
  recordBootPhase: uu,
  recordBootComplete: Po,
  configure: cu,
  getConfig: ko,
  clearSpans: Ho,
  clearMetrics: Bo,
  clearAll: du,
  info: Uo,
  healthCheck: fu,
  MODULE_ID: Jr,
  VERSION: Zr
};
const bf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  METRIC_TYPES: nr,
  MODULE_ID: Jr,
  OTEL_ATTRIBUTES: je,
  SPAN_STATUS: On,
  VERSION: Zr,
  addSpanEvent: lu,
  clearAll: du,
  clearMetrics: Bo,
  clearSpans: Ho,
  configure: cu,
  createSpan: wo,
  default: Tf,
  endSpan: su,
  endTrace: _o,
  exportMetrics: Mo,
  exportSpans: No,
  getConfig: ko,
  healthCheck: fu,
  info: Uo,
  recordBootComplete: Po,
  recordBootPhase: uu,
  recordCounter: Kr,
  recordGauge: Do,
  recordHistogram: $i,
  recordMetric: kn,
  startTrace: Lo
}, Symbol.toStringTag, { value: "Module" }));
var qi = "network-detector", Ji = "1.1.0-HEALTH-CONTRACT", Ae = {
  EXCELLENT: "excellent",
  GOOD: "good",
  FAIR: "fair",
  POOR: "poor",
  OFFLINE: "offline",
  UNKNOWN: "unknown"
}, Zi = {
  excellent: 0.8,
  good: 1,
  fair: 1.5,
  poor: 2.5,
  offline: 0,
  unknown: 1.2
}, Rf = {
  "4g": Ae.EXCELLENT,
  "3g": Ae.GOOD,
  "2g": Ae.FAIR,
  "slow-2g": Ae.POOR
}, cn = null, Wa = null, wf = 5e3, Br = [];
function xo() {
  return typeof navigator > "u" ? null : navigator.connection || navigator.mozConnection || navigator.webkitConnection || null;
}
function Qi() {
  if (typeof navigator < "u" && navigator.onLine === !1)
    return {
      quality: Ae.OFFLINE,
      effectiveType: null,
      downlink: 0,
      rtt: 1 / 0,
      saveData: !1,
      online: !1
    };
  var e = xo();
  if (!e)
    return {
      quality: Ae.UNKNOWN,
      effectiveType: null,
      downlink: null,
      rtt: null,
      saveData: !1,
      online: !0
    };
  var t = e.effectiveType || null, r = e.downlink || null, n = e.rtt || null, i = e.saveData || !1, o = Ae.UNKNOWN;
  return t && (o = Rf[t] || Ae.UNKNOWN), n !== null && (n < 50 ? o = Ae.EXCELLENT : n < 100 ? o = Ae.GOOD : n < 300 ? o = Ae.FAIR : o = Ae.POOR), i && o === Ae.EXCELLENT && (o = Ae.GOOD), {
    quality: o,
    effectiveType: t,
    downlink: r,
    rtt: n,
    saveData: i,
    online: !0
  };
}
function He(e) {
  if (!e && cn && Wa) {
    var t = Date.now() - Wa;
    if (t < wf)
      return cn;
  }
  return cn = Qi(), Wa = Date.now(), cn;
}
function Bn(e, t) {
  t === void 0 && (t = {});
  var r = He(t.forceRefresh), n = Zi[r.quality] || 1, i = t.minMultiplier || 0.5, o = t.maxMultiplier || 3;
  n = Math.max(i, Math.min(o, n));
  var l = Math.round(e * n), a = t.minTimeout || 1e3, s = t.maxTimeout || 12e4;
  return l = Math.max(a, Math.min(s, l)), {
    original: e,
    adjusted: l,
    multiplier: n,
    networkQuality: r.quality,
    networkInfo: r
  };
}
function hu(e, t) {
  var r = Bn(t);
  return {
    timeout: r.adjusted,
    phase: e,
    baseTimeout: t,
    multiplier: r.multiplier,
    networkQuality: r.networkQuality
  };
}
function gu(e) {
  return Br.push(e), Br.length === 1 && Df(), function() {
    var t = Br.indexOf(e);
    t !== -1 && Br.splice(t, 1), Br.length === 0 && Cf();
  };
}
var Dt = null;
function Df() {
  if (!(typeof window > "u")) {
    Dt = function() {
      cn = null;
      var t = He(!0);
      Br.forEach(function(r) {
        try {
          r(t);
        } catch {
        }
      });
    }, window.addEventListener("online", Dt), window.addEventListener("offline", Dt);
    var e = xo();
    e && e.addEventListener && e.addEventListener("change", Dt);
  }
}
function Cf() {
  if (!(typeof window > "u" || !Dt)) {
    window.removeEventListener("online", Dt), window.removeEventListener("offline", Dt);
    var e = xo();
    e && e.removeEventListener && e.removeEventListener("change", Dt), Dt = null;
  }
}
function Xi() {
  return typeof navigator > "u" ? !0 : navigator.onLine !== !1;
}
function Qr() {
  var e = He();
  return e.quality === Ae.POOR || e.quality === Ae.OFFLINE;
}
function Fo() {
  var e = He(), t = {
    excellent: 4,
    good: 3,
    fair: 2,
    poor: 1,
    offline: 0,
    unknown: 2
  };
  return t[e.quality] || 2;
}
function Go() {
  var e = He();
  return {
    moduleId: qi,
    version: Ji,
    networkInfo: e,
    qualityLevel: Fo(),
    isOnline: Xi(),
    isPoor: Qr(),
    timeoutMultipliers: Zi,
    improvements: ["#2-DynamicTimeouts"]
  };
}
function zo() {
  var e = He(), t = B.HEALTHY;
  return e.quality === Ae.OFFLINE ? t = B.UNHEALTHY : e.quality === Ae.POOR && (t = B.DEGRADED), ue({
    status: t,
    moduleId: qi,
    version: Ji,
    details: {
      networkQuality: e.quality,
      online: e.online
    }
  });
}
var Lf = {
  NETWORK_QUALITY: Ae,
  TIMEOUT_MULTIPLIERS: Zi,
  detectNetworkQuality: Qi,
  getNetworkInfo: He,
  calculateAdjustedTimeout: Bn,
  getPhaseTimeout: hu,
  onNetworkChange: gu,
  isOnline: Xi,
  isNetworkPoor: Qr,
  getQualityLevel: Fo,
  info: Go,
  healthCheck: zo,
  MODULE_ID: qi,
  VERSION: Ji
};
const mu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: qi,
  NETWORK_QUALITY: Ae,
  TIMEOUT_MULTIPLIERS: Zi,
  VERSION: Ji,
  calculateAdjustedTimeout: Bn,
  default: Lf,
  detectNetworkQuality: Qi,
  getNetworkInfo: He,
  getPhaseTimeout: hu,
  getQualityLevel: Fo,
  healthCheck: zo,
  info: Go,
  isNetworkPoor: Qr,
  isOnline: Xi,
  onNetworkChange: gu
}, Symbol.toStringTag, { value: "Module" }));
var ea = "manifest-integrity", ta = "2.1.0-HEALTH-CONTRACT", Vo = "bootstrap-v2:manifest-hash", Yo = "bootstrap-v2:manifest-hash-meta", oe = null, Ne = null, Re = null, Fr = [], _f = 20, ir = !1;
function Nf() {
  try {
    return !!(window.crypto && window.crypto.subtle && window.crypto.subtle.digest);
  } catch {
    return !1;
  }
}
(function() {
  ir = Nf();
})();
function In(e) {
  for (var t = 2166136261, r = 0; r < e.length; r++)
    t ^= e.charCodeAt(r), t += (t << 1) + (t << 4) + (t << 7) + (t << 8) + (t << 24);
  return (t >>> 0).toString(16);
}
async function jo(e) {
  if (!ir)
    return In(e);
  try {
    var t = new TextEncoder(), r = t.encode(e), n = await window.crypto.subtle.digest("SHA-256", r), i = Array.from(new Uint8Array(n)), o = i.map(function(l) {
      return l.toString(16).padStart(2, "0");
    }).join("");
    return o;
  } catch {
    return In(e);
  }
}
function Wo(e) {
  return In(e);
}
function Ir(e) {
  for (var t = Object.keys(e).sort(), r = [], n = 0; n < t.length; n++) {
    var i = t[n], o = e[i];
    o == null ? r.push(i + ":null") : typeof o == "object" ? Array.isArray(o) ? r.push(i + ":[" + o.map(function(l) {
      return typeof l == "object" ? Ir(l) : String(l);
    }).join(",") + "]") : r.push(i + ":{" + Ir(o) + "}") : r.push(i + ":" + String(o));
  }
  return Wo(r.join("|"));
}
async function $o(e) {
  for (var t = Object.keys(e).sort(), r = [], n = 0; n < t.length; n++) {
    var i = t[n], o = e[i];
    if (o == null)
      r.push(i + ":null");
    else if (typeof o == "object")
      if (Array.isArray(o)) {
        for (var l = [], a = 0; a < o.length; a++) {
          var s = o[a];
          l.push(typeof s == "object" ? Ir(s) : String(s));
        }
        r.push(i + ":[" + l.join(",") + "]");
      } else
        r.push(i + ":{" + Ir(o) + "}");
    else
      r.push(i + ":" + String(o));
  }
  return await jo(r.join("|"));
}
function pu(e) {
  var t, r;
  return e ? {
    version: e.version,
    phases: (e.phases || []).map(function(n) {
      return {
        id: n.id,
        order: n.order,
        critical: n.critical,
        timeout: n.timeout,
        dependsOn: n.dependsOn,
        recoverable: n.recoverable
      };
    }),
    globalTimeout: e.globalTimeout || ((t = e.global) == null ? void 0 : t.defaultTimeout),
    retryPolicy: e.retryPolicy || ((r = e.global) == null ? void 0 : r.defaultRetry)
  } : null;
}
function Un(e) {
  var t = pu(e);
  return t ? Ir(t) : null;
}
async function ra(e) {
  var t = pu(e);
  return t ? await $o(t) : null;
}
function Ko() {
  try {
    var e = sessionStorage.getItem(Vo), t = sessionStorage.getItem(Yo);
    if (e && t)
      return oe = e, Ne = JSON.parse(t), !0;
  } catch {
  }
  return !1;
}
function Eu(e, t) {
  try {
    return sessionStorage.setItem(Vo, e), sessionStorage.setItem(Yo, JSON.stringify(t)), !0;
  } catch {
    return !1;
  }
}
function qo() {
  try {
    sessionStorage.removeItem(Vo), sessionStorage.removeItem(Yo);
  } catch {
  }
}
function na(e) {
  return oe = Un(e), Ne = {
    timestamp: Date.now(),
    algorithm: "fnv-1a",
    manifestVersion: e == null ? void 0 : e.version
  }, Eu(oe, Ne), Re = {
    timestamp: Date.now(),
    hash: oe,
    valid: !0,
    issueCount: 0,
    algorithm: "fnv-1a"
  }, oe;
}
async function vu(e) {
  return oe = await ra(e), Ne = {
    timestamp: Date.now(),
    algorithm: ir ? "sha-256" : "fnv-1a",
    manifestVersion: e == null ? void 0 : e.version
  }, Eu(oe, Ne), Re = {
    timestamp: Date.now(),
    hash: oe,
    valid: !0,
    issueCount: 0,
    algorithm: Ne.algorithm
  }, oe;
}
function Xr(e, t) {
  t === void 0 && (t = {});
  var r = Un(e), n = !0, i = [];
  if (!oe && t.checkPersisted !== !1 && Ko(), oe && r !== oe && (n = !1, i.push({
    type: "HASH_MISMATCH",
    severity: "critical",
    message: "Manifest hash changed since initial load",
    expected: oe,
    // @ts-expect-error strict migration — TS2322
    actual: r,
    storedAt: Ne == null ? void 0 : Ne.timestamp
  })), !e)
    n = !1, i.push({ type: "NULL_MANIFEST", severity: "critical", message: "Manifest is null or undefined" });
  else if (e.version || i.push({ type: "MISSING_VERSION", severity: "warning", message: "Manifest version is missing" }), !e.phases || !Array.isArray(e.phases))
    n = !1, i.push({ type: "INVALID_PHASES", severity: "critical", message: "Manifest phases array is invalid" });
  else {
    var o = {}, l = {};
    e.phases.forEach(function(s, u) {
      s.id ? (o[s.id] && (n = !1, i.push({ type: "DUPLICATE_PHASE_ID", severity: "critical", message: "Duplicate phase id: " + s.id })), o[s.id] = !0) : (i.push({ type: "PHASE_NO_ID", severity: "critical", message: "Phase at index " + u + " has no id" }), n = !1), s.order === void 0 ? i.push({ type: "PHASE_NO_ORDER", severity: "warning", message: "Phase " + s.id + " has no order" }) : (l[s.order] && i.push({ type: "DUPLICATE_ORDER", severity: "warning", message: "Duplicate order " + s.order + ": " + s.id + " and " + l[s.order] }), l[s.order] = s.id), s.dependsOn && Array.isArray(s.dependsOn) && s.dependsOn.forEach(function(c) {
        var d = e.phases.some(function(f) {
          return f.id === c;
        });
        d || (i.push({ type: "MISSING_DEPENDENCY", severity: "critical", message: "Phase " + s.id + " depends on non-existent phase: " + c }), n = !1);
      });
    });
  }
  var a = {
    timestamp: Date.now(),
    hash: r,
    storedHash: oe,
    valid: n,
    issueCount: i.length,
    criticalCount: i.filter(function(s) {
      return s.severity === "critical";
    }).length,
    issues: i,
    algorithm: "fnv-1a"
  };
  for (Re = a, Fr.unshift(a); Fr.length > _f; )
    Fr.pop();
  return {
    valid: n,
    hash: r,
    storedHash: oe,
    hashMatch: oe ? r === oe : !0,
    issues: i,
    criticalIssues: i.filter(function(s) {
      return s.severity === "critical";
    }),
    warnings: i.filter(function(s) {
      return s.severity === "warning";
    }),
    timestamp: Date.now()
  };
}
async function yu(e, t) {
  t === void 0 && (t = {});
  var r = await ra(e), n = Xr(e, Object.assign({}, t, { skipHashCheck: !0 }));
  return oe && (Ne == null ? void 0 : Ne.algorithm) === "sha-256" && r !== oe && (n.valid = !1, n.issues.unshift({
    type: "SHA256_MISMATCH",
    severity: "critical",
    message: "SHA-256 hash mismatch detected",
    expected: oe,
    // @ts-expect-error strict migration — TS2322
    actual: r
  })), n.hash = r, n.algorithm = ir ? "sha-256" : "fnv-1a", n;
}
function ia(e) {
  if (!oe) return !1;
  var t = Un(e);
  return t !== oe;
}
function Au() {
  return Fr.slice();
}
function Su() {
  return Re ? Object.assign({}, Re) : null;
}
function Ou() {
  oe = null, Ne = null, Re = null, Fr = [], qo();
}
function aa() {
  return {
    moduleId: ea,
    version: ta,
    storedHash: oe ? oe.substring(0, 16) + "..." : null,
    storedHashMeta: Ne,
    lastValidation: Re ? {
      valid: Re.valid,
      issueCount: Re.issueCount,
      timestamp: Re.timestamp
    } : null,
    validationCount: Fr.length,
    webCryptoAvailable: ir,
    algorithm: ir ? "sha-256" : "fnv-1a",
    improvements: ["#7-ManifestIntegrity", "SHA256-Support", "Persistence"]
  };
}
function Jo() {
  var e = B.HEALTHY;
  return Re && !Re.valid ? e = B.UNHEALTHY : Re && Re.issueCount > 0 && (e = B.DEGRADED), ue({
    status: e,
    moduleId: ea,
    version: ta,
    checks: {
      hashStored: !!oe,
      lastValidationValid: Re ? Re.valid : !0,
      webCryptoAvailable: ir
    },
    details: {
      hashStored: !!oe,
      algorithm: (Ne == null ? void 0 : Ne.algorithm) || "none",
      lastValidationValid: Re ? Re.valid : null,
      webCryptoAvailable: ir
    }
  });
}
var Mf = {
  hashString: Wo,
  hashStringFNV: In,
  hashStringSHA256: jo,
  hashObject: Ir,
  hashObjectAsync: $o,
  calculateManifestHash: Un,
  calculateManifestHashAsync: ra,
  storeHash: na,
  storeHashAsync: vu,
  validateIntegrity: Xr,
  validateIntegrityAsync: yu,
  wasTampered: ia,
  getValidationHistory: Au,
  getLastValidation: Su,
  loadPersistedHash: Ko,
  clearPersistedHash: qo,
  reset: Ou,
  info: aa,
  healthCheck: Jo,
  MODULE_ID: ea,
  VERSION: ta
};
const Iu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ea,
  VERSION: ta,
  calculateManifestHash: Un,
  calculateManifestHashAsync: ra,
  clearPersistedHash: qo,
  default: Mf,
  getLastValidation: Su,
  getValidationHistory: Au,
  hashObject: Ir,
  hashObjectAsync: $o,
  hashString: Wo,
  hashStringFNV: In,
  hashStringSHA256: jo,
  healthCheck: Jo,
  info: aa,
  loadPersistedHash: Ko,
  reset: Ou,
  storeHash: na,
  storeHashAsync: vu,
  validateIntegrity: Xr,
  validateIntegrityAsync: yu,
  wasTampered: ia
}, Symbol.toStringTag, { value: "Module" }));
var oa = "phase-rollback", sa = "1.1.0-HEALTH-CONTRACT", We = {}, Nt = [], vr = [], Pf = 50, Ct = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
  FAILED: "failed",
  SKIPPED: "skipped"
};
function Zo(e, t, r) {
  r === void 0 && (r = {}), We[e] || (We[e] = []);
  var n = {
    id: "rb-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5),
    phaseId: e,
    fn: t,
    priority: r.priority || 0,
    description: r.description || "Rollback for " + e,
    critical: r.critical || !1,
    registeredAt: Date.now()
  };
  return We[e].push(n), We[e].sort(function(i, o) {
    return o.priority - i.priority;
  }), n.id;
}
function Tu(e, t) {
  if (!We[e]) return !1;
  var r = We[e].findIndex(function(n) {
    return n.id === t;
  });
  return r !== -1 ? (We[e].splice(r, 1), !0) : !1;
}
function bu(e, t) {
  Nt.push({
    phaseId: e,
    timestamp: Date.now(),
    context: t || {}
  });
}
function Qo(e) {
  Nt = Nt.filter(function(t) {
    return t.phaseId !== e;
  });
}
function la(e, t) {
  return new Promise(function(r) {
    var n = We[e] || [];
    if (n.length === 0) {
      r({
        phaseId: e,
        status: Ct.SKIPPED,
        reason: "No rollback handlers registered",
        handlersExecuted: 0
      });
      return;
    }
    var i = [], o = Date.now(), l = function(a) {
      if (a >= n.length) {
        var s = i.some(function(h) {
          return !h.success;
        }), u = {
          phaseId: e,
          status: s ? Ct.FAILED : Ct.COMPLETED,
          handlersExecuted: i.length,
          results: i,
          duration: Date.now() - o
        };
        $a(u), r(u);
        return;
      }
      var c = n[a], d = Date.now();
      try {
        var f = c.fn(t);
        Promise.resolve(f).then(function() {
          i.push({
            handlerId: c.id,
            description: c.description,
            success: !0,
            duration: Date.now() - d
          }), l(a + 1);
        }).catch(function(h) {
          if (i.push({
            handlerId: c.id,
            description: c.description,
            success: !1,
            error: h.message,
            duration: Date.now() - d
          }), c.critical) {
            var p = {
              phaseId: e,
              status: Ct.FAILED,
              reason: "Critical rollback handler failed: " + h.message,
              handlersExecuted: i.length,
              results: i,
              duration: Date.now() - o
            };
            $a(p), r(p);
          } else
            l(a + 1);
        });
      } catch (h) {
        if (i.push({
          handlerId: c.id,
          description: c.description,
          success: !1,
          error: h.message,
          duration: Date.now() - d
        }), c.critical) {
          var g = {
            phaseId: e,
            status: Ct.FAILED,
            reason: "Critical rollback handler threw: " + h.message,
            handlersExecuted: i.length,
            results: i,
            duration: Date.now() - o
          };
          $a(g), r(g);
        } else
          l(a + 1);
      }
    };
    l(0);
  });
}
function Xo(e, t) {
  return new Promise(function(r) {
    for (var n = [], i = Nt.length - 1; i >= 0; i--) {
      var o = Nt[i];
      if (n.push(o.phaseId), o.phaseId === e)
        break;
    }
    if (n.length === 0) {
      r({
        success: !0,
        phasesRolledBack: 0,
        results: [],
        message: "No phases to rollback"
      });
      return;
    }
    var l = [], a = Date.now(), s = function(u) {
      if (u >= n.length) {
        var c = l.some(function(f) {
          return f.status === Ct.FAILED;
        });
        r({
          success: !c,
          phasesRolledBack: l.length,
          results: l,
          duration: Date.now() - a
        });
        return;
      }
      var d = n[u];
      la(d, t).then(function(f) {
        l.push(f), Qo(d), s(u + 1);
      });
    };
    s(0);
  });
}
function $a(e) {
  for (vr.unshift({
    timestamp: Date.now(),
    phaseId: e.phaseId,
    status: e.status,
    handlersExecuted: e.handlersExecuted,
    duration: e.duration
  }); vr.length > Pf; )
    vr.pop();
}
function es() {
  return vr.slice();
}
function Ru(e) {
  return (We[e] || []).map(function(t) {
    return {
      id: t.id,
      description: t.description,
      priority: t.priority,
      critical: t.critical
    };
  });
}
function ua() {
  return Object.keys(We).filter(function(e) {
    return We[e].length > 0;
  });
}
function wu() {
  return Nt.slice();
}
function Du() {
  We = {}, Nt = [];
}
function Cu() {
  vr = [];
}
function ts() {
  return {
    moduleId: oa,
    version: sa,
    registeredPhases: ua(),
    executedPhases: Nt.length,
    totalHandlers: Object.keys(We).reduce(function(e, t) {
      return e + We[t].length;
    }, 0),
    rollbackHistory: vr.length,
    improvements: ["#8-AutomaticRollback"]
  };
}
function Lu() {
  var e = vr.filter(function(t) {
    return t.status === Ct.FAILED && Date.now() - t.timestamp < 3e5;
  });
  return ue({
    status: e.length > 0 ? B.DEGRADED : B.HEALTHY,
    moduleId: oa,
    version: sa,
    details: {
      registeredPhases: ua().length,
      executedPhases: Nt.length,
      recentFailures: e.length
    }
  });
}
var kf = {
  ROLLBACK_STATUS: Ct,
  registerRollback: Zo,
  unregisterRollback: Tu,
  markPhaseExecuted: bu,
  clearPhaseExecution: Qo,
  rollbackPhase: la,
  rollbackToPhase: Xo,
  getRollbackHistory: es,
  getPhaseHandlers: Ru,
  getRegisteredPhases: ua,
  getExecutedPhases: wu,
  reset: Du,
  clearHistory: Cu,
  info: ts,
  healthCheck: Lu,
  MODULE_ID: oa,
  VERSION: sa
};
const Hf = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: oa,
  ROLLBACK_STATUS: Ct,
  VERSION: sa,
  clearHistory: Cu,
  clearPhaseExecution: Qo,
  default: kf,
  getExecutedPhases: wu,
  getPhaseHandlers: Ru,
  getRegisteredPhases: ua,
  getRollbackHistory: es,
  healthCheck: Lu,
  info: ts,
  markPhaseExecuted: bu,
  registerRollback: Zo,
  reset: Du,
  rollbackPhase: la,
  rollbackToPhase: Xo,
  unregisterRollback: Tu
}, Symbol.toStringTag, { value: "Module" }));
var ca = "main-kernel-lazy-loader", xn = "1.2.0-HEALTH-CONTRACT", yt = null, St = !1, et = /* @__PURE__ */ new Map(), Mt = /* @__PURE__ */ new Set(), gr = /* @__PURE__ */ new Map(), Zt = {
  preloadOnHover: !0,
  hoverDelayMs: 200,
  loadTimeoutMs: 1e4,
  logLevel: 1
}, Pe = {
  lazyLoadsTriggered: 0,
  lazyLoadsCompleted: 0,
  lazyLoadsFailed: 0,
  preloadsTriggered: 0,
  cacheHits: 0,
  totalLoadTimeMs: 0
}, lo = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
function ol(e, t, r) {
  var n = lo[e] || 1;
  if (!(n < Zt.logLevel)) {
    var i = "[LazyLoader]", o = i + " " + t;
    e === "error" ? console.error(o, r !== void 0 ? r : "") : e === "warn" ? console.warn(o, r !== void 0 ? r : "") : console.debug(o, r !== void 0 ? r : "");
  }
}
function Ni(e) {
  return typeof e == "string" ? Zt.logLevel = lo[e] !== void 0 ? lo[e] : 1 : typeof e == "number" && (Zt.logLevel = e), Zt.logLevel;
}
var Ka = {
  "panel-1": [],
  "panel-2": [],
  "panel-3": [],
  "panel-4": [],
  "panel-5": [],
  "panel-6": [],
  "panel-7": [],
  "panel-8": [],
  "panel-9": [],
  "panel-10": [],
  "panel-11": [],
  "panel-12": ["analytics-tracker"],
  "panel-13": [],
  "panel-14": [],
  "panel-15": [],
  settings: ["ux-feedback"],
  admin: ["analytics-tracker", "session-sync"]
};
function _u(e, t) {
  if (!e) return { ok: !1, error: "Kernel required" };
  if (yt = e, t) {
    if (t.config && (Zt = Object.assign({}, Zt, t.config)), t.routeMap)
      for (var r in t.routeMap)
        t.routeMap.hasOwnProperty(r) && et.set(r, t.routeMap[r]);
    t.logLevel !== void 0 && Ni(t.logLevel);
  }
  for (var n in Ka)
    Ka.hasOwnProperty(n) && !et.has(n) && et.set(n, Ka[n]);
  return St = !0, typeof window < "u" && (window.lazyLoader = {
    loadForRoute: rs,
    preload: da,
    isLoaded: is,
    getMap: fa,
    status: os,
    setLogLevel: Ni
  }), { ok: !0, version: xn, routesMapped: et.size };
}
function Nu() {
  return yt = null, St = !1, et.clear(), Mt.clear(), gr.clear(), typeof window < "u" && delete window.lazyLoader, { ok: !0 };
}
async function rs(e, t) {
  if (!St || !yt)
    return { ok: !1, error: "Lazy loader not initialized" };
  var r = et.get(e) || [];
  if (r.length === 0)
    return { ok: !0, route: e, features: [], message: "No features mapped" };
  for (var n = [], i = 0; i < r.length; i++) {
    var o = r[i], l = await ns(o, t);
    n.push(l);
  }
  var a = n.filter(function(s) {
    return s.ok;
  }).length;
  return {
    ok: a === n.length,
    route: e,
    features: r,
    results: n,
    succeeded: a,
    failed: n.length - a
  };
}
async function ns(e, t) {
  if (!St || !yt)
    return { ok: !1, error: "Lazy loader not initialized" };
  if (Mt.has(e))
    return Pe.cacheHits++, { ok: !0, featureId: e, cached: !0 };
  if (gr.has(e))
    return gr.get(e);
  Pe.lazyLoadsTriggered++;
  var r = performance.now(), n = Bf(e, t, r);
  gr.set(e, n);
  try {
    var i = await n;
    return i;
  } finally {
    gr.delete(e);
  }
}
async function Bf(e, t, r) {
  var n = t || {};
  try {
    var i = yt.getFeature ? yt.getFeature(e) : null;
    if (i && i.ok && i.data) {
      if (i.data.status !== "enabled") {
        var o = yt.enableFeature(e, n.context || {});
        if (!o.ok)
          throw new Error("Failed to enable: " + JSON.stringify(o.errors));
      }
    } else {
      var l = n.path || "../features/" + e + "/index.js", a = await Uf(
        import(l),
        Zt.loadTimeoutMs,
        e
      ), s = yt.registerFeature({
        id: e,
        version: a.VERSION || a.default && a.default.VERSION || "1.0.0",
        init: a.init || a.default && a.default.init,
        cleanup: a.destroy || a.cleanup || a.default && a.default.destroy,
        healthCheck: a.healthCheck || a.default && a.default.healthCheck
      });
      if (!s.ok)
        throw new Error("Failed to register: " + JSON.stringify(s.errors));
      var o = yt.enableFeature(e, n.context || {});
      if (!o.ok)
        throw new Error("Failed to enable: " + JSON.stringify(o.errors));
    }
    var u = Math.round(performance.now() - r);
    return Pe.lazyLoadsCompleted++, Pe.totalLoadTimeMs += u, Mt.add(e), ol("info", "✅ Loaded: " + e + " (" + u + "ms)"), { ok: !0, featureId: e, duration: u };
  } catch (c) {
    var u = Math.round(performance.now() - r);
    return Pe.lazyLoadsFailed++, ol("error", "❌ Failed to load: " + e, c), { ok: !1, featureId: e, error: c.message, duration: u };
  }
}
function Uf(e, t, r) {
  return new Promise(function(n, i) {
    var o = setTimeout(function() {
      i(new Error("Load timeout for " + r + " after " + t + "ms"));
    }, t);
    e.then(function(l) {
      clearTimeout(o), n(l);
    }).catch(function(l) {
      clearTimeout(o), i(l);
    });
  });
}
function da(e) {
  if (St && (Pe.preloadsTriggered++, typeof document < "u")) {
    var t = document.createElement("link");
    t.rel = "prefetch", t.href = "/components/main/domain/features/" + e + "/index.js", t.as = "script", document.head.appendChild(t);
  }
}
function Mu(e) {
  for (var t = et.get(e) || [], r = 0; r < t.length; r++)
    Mt.has(t[r]) || da(t[r]);
  return { ok: !0, preloaded: t.length };
}
function Pu(e, t) {
  return et.set(e, t), { ok: !0 };
}
function ku(e, t) {
  var r = et.get(e) || [];
  return r.indexOf(t) === -1 && (r.push(t), et.set(e, r)), { ok: !0 };
}
function fa() {
  var e = {};
  return et.forEach(function(t, r) {
    e[r] = t.slice();
  }), e;
}
function is(e) {
  return Mt.has(e);
}
function as() {
  return Array.from(Mt);
}
function os() {
  return {
    enabled: St,
    routesMapped: et.size,
    featuresLoaded: Mt.size,
    pendingLoads: gr.size
  };
}
function ss() {
  var e = Pe.lazyLoadsCompleted > 0 ? Math.round(Pe.totalLoadTimeMs / Pe.lazyLoadsCompleted) : 0;
  return Object.assign({}, Pe, {
    averageLoadTimeMs: e,
    loadedFeatures: Mt.size,
    successRate: Pe.lazyLoadsTriggered > 0 ? Math.round(Pe.lazyLoadsCompleted / Pe.lazyLoadsTriggered * 100) + "%" : "N/A"
  });
}
function ha() {
  return {
    moduleId: ca,
    version: xn,
    enabled: St,
    config: Object.assign({}, Zt),
    routeMap: fa(),
    loadedFeatures: as(),
    metrics: ss()
  };
}
function Hu() {
  var e = !!yt, t = Pe.lazyLoadsFailed < Pe.lazyLoadsTriggered * 0.2, r = B.HEALTHY;
  return St ? (!e || !t) && (r = B.DEGRADED) : r = B.UNHEALTHY, ue({
    status: r,
    moduleId: ca,
    version: xn,
    checks: {
      enabled: St,
      kernelConnected: e,
      lowFailureRate: t
    },
    details: {
      enabled: St,
      kernelConnected: e,
      routesMapped: et.size,
      featuresLoaded: Mt.size,
      pendingLoads: gr.size,
      metrics: Object.assign({}, Pe)
    }
  });
}
var xf = {
  MODULE_ID: ca,
  VERSION: xn,
  init: _u,
  destroy: Nu,
  loadFeaturesForRoute: rs,
  loadFeature: ns,
  preloadFeature: da,
  preloadForRoute: Mu,
  setRouteFeatures: Pu,
  addRouteFeature: ku,
  getRouteMap: fa,
  isFeatureLoaded: is,
  getLoadedFeatures: as,
  getStatus: os,
  getMetrics: ss,
  setLogLevel: Ni,
  info: ha,
  healthCheck: Hu
};
const Bu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ca,
  VERSION: xn,
  addRouteFeature: ku,
  default: xf,
  destroy: Nu,
  getLoadedFeatures: as,
  getMetrics: ss,
  getRouteMap: fa,
  getStatus: os,
  healthCheck: Hu,
  info: ha,
  init: _u,
  isFeatureLoaded: is,
  loadFeature: ns,
  loadFeaturesForRoute: rs,
  preloadFeature: da,
  preloadForRoute: Mu,
  setLogLevel: Ni,
  setRouteFeatures: Pu
}, Symbol.toStringTag, { value: "Module" }));
var ga = "boot-cancellation", ma = "1.2.0-HEALTH-CONTRACT", Qt = null, _t = null, X = {
  cancelled: !1,
  cancelledAt: null,
  reason: null,
  phase: null,
  abortController: null
}, Gr = [], pn = [], Ff = 20;
function Uu(e) {
  return e === void 0 && (e = {}), Qt = e.eventBus || null, _t = e.getBootState || null, { initialized: !0, hasEventBus: !!Qt, hasBootStateGetter: !!_t };
}
function xu(e) {
  Qt = e || null;
}
function Fu() {
  return typeof AbortController < "u" ? (X.abortController = new AbortController(), X.abortController) : null;
}
function Gu() {
  return X.abortController ? X.abortController.signal : null;
}
function Fn() {
  return X.cancelled === !0;
}
function wr() {
  var e = null;
  if (_t && typeof _t == "function")
    try {
      e = _t();
    } catch {
      return !1;
    }
  return e ? e.state === "running" || e.state === "starting" : !1;
}
function pa(e, t) {
  if (t === void 0 && (t = {}), !wr()) {
    var r = null;
    if (_t && typeof _t == "function")
      try {
        r = _t();
      } catch {
      }
    return {
      success: !1,
      error: "Cannot cancel: boot is not in progress",
      state: r ? r.state : "unknown"
    };
  }
  if (X.cancelled)
    return {
      success: !1,
      error: "Cancellation already requested",
      cancelledAt: X.cancelledAt
    };
  if (X.cancelled = !0, X.cancelledAt = Date.now(), X.reason = e || "User requested cancellation", X.phase = t.currentPhase || null, X.abortController)
    try {
      X.abortController.abort();
    } catch {
    }
  for (pn.unshift({
    timestamp: X.cancelledAt,
    reason: X.reason,
    phase: X.phase
  }); pn.length > Ff; )
    pn.pop();
  var n = {
    cancelled: !0,
    reason: X.reason,
    phase: X.phase,
    timestamp: X.cancelledAt
  };
  if (Gr.forEach(function(i) {
    try {
      i(n);
    } catch {
    }
  }), Qt && Qt.emit)
    try {
      Qt.emit(Ot.CANCELLED, n);
    } catch {
    }
  return {
    success: !0,
    cancelledAt: X.cancelledAt,
    reason: X.reason
  };
}
function Ea(e) {
  return Gr.push(e), function() {
    var t = Gr.indexOf(e);
    t !== -1 && Gr.splice(t, 1);
  };
}
function zu(e) {
  return X.cancelled ? {
    cancelled: !0,
    reason: X.reason,
    shouldAbort: !0
  } : {
    cancelled: !1,
    shouldAbort: !1
  };
}
function Vu(e, t) {
  return new Promise(function(r, n) {
    var i = !1, o = null;
    if (X.cancelled) {
      n(new Error("Boot was cancelled: " + X.reason));
      return;
    }
    var l = Ea(function(a) {
      i || (i = !0, o && clearTimeout(o), n(new Error("Boot was cancelled: " + a.reason)));
    });
    t && (o = setTimeout(function() {
      i || (i = !0, l(), n(new Error("Operation timed out after " + t + "ms")));
    }, t)), e.then(function(a) {
      i || (i = !0, o && clearTimeout(o), l(), r(a));
    }).catch(function(a) {
      i || (i = !0, o && clearTimeout(o), l(), n(a));
    });
  });
}
function va() {
  X = {
    cancelled: !1,
    cancelledAt: null,
    reason: null,
    phase: null,
    abortController: null
  }, Gr = [], Fu();
}
function Gn() {
  return {
    cancelled: X.cancelled,
    cancelledAt: X.cancelledAt,
    reason: X.reason,
    phase: X.phase,
    canCancel: wr()
  };
}
function Yu() {
  return pn.slice();
}
function ls() {
  return {
    moduleId: ga,
    version: ma,
    state: Gn(),
    historyCount: pn.length,
    listenerCount: Gr.length,
    hasAbortController: !!X.abortController,
    hasEventBus: !!Qt,
    hasBootStateGetter: !!_t,
    improvements: ["#17-BootCancellation"]
  };
}
function us() {
  return ue({
    status: X.cancelled ? B.FAILED : B.HEALTHY,
    moduleId: ga,
    version: ma,
    details: {
      cancelled: X.cancelled,
      canCancel: wr(),
      hasEventBus: !!Qt
    }
  });
}
Fu();
var Gf = {
  init: Uu,
  setEventBus: xu,
  isCancelled: Fn,
  canCancel: wr,
  cancel: pa,
  onCancel: Ea,
  checkCancellation: zu,
  makeCancellable: Vu,
  getAbortSignal: Gu,
  reset: va,
  getState: Gn,
  getHistory: Yu,
  info: ls,
  healthCheck: us,
  MODULE_ID: ga,
  VERSION: ma
};
const ju = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ga,
  VERSION: ma,
  canCancel: wr,
  cancel: pa,
  checkCancellation: zu,
  default: Gf,
  getAbortSignal: Gu,
  getHistory: Yu,
  getState: Gn,
  healthCheck: us,
  info: ls,
  init: Uu,
  isCancelled: Fn,
  makeCancellable: Vu,
  onCancel: Ea,
  reset: va,
  setEventBus: xu
}, Symbol.toStringTag, { value: "Module" }));
var ya = "partial-reinit", Aa = "1.1.0-HEALTH-CONTRACT", yr = [], zf = 30, Ge = {}, zn = [
  "phase-4-ui-prep",
  "phase-5-ui",
  "phase-6-platform"
];
function Wu(e, t, r) {
  r === void 0 && (r = {}), Ge[e] || (Ge[e] = []);
  var n = {
    id: "rh-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 5),
    phaseId: e,
    handler: t,
    priority: r.priority || 0,
    description: r.description || "Reinit handler for " + e,
    cleanup: r.cleanup || null,
    registeredAt: Date.now()
  };
  return Ge[e].push(n), Ge[e].sort(function(i, o) {
    return o.priority - i.priority;
  }), n.id;
}
function $u(e, t) {
  if (!Ge[e]) return !1;
  var r = Ge[e].findIndex(function(n) {
    return n.id === t;
  });
  return r !== -1 ? (Ge[e].splice(r, 1), !0) : !1;
}
function Vn(e) {
  return zn.indexOf(e) !== -1 || !!Ge[e];
}
function Yn(e, t) {
  return new Promise(function(r) {
    if (!Vn(e)) {
      r({
        success: !1,
        phaseId: e,
        error: "Phase does not support partial reinitialization"
      });
      return;
    }
    var n = Ge[e] || [];
    if (n.length === 0) {
      r({
        success: !0,
        phaseId: e,
        handlersExecuted: 0,
        message: "No handlers registered, phase marked as reinit-ready"
      });
      return;
    }
    var i = performance.now(), o = [], l = n.filter(function(a) {
      return a.cleanup;
    }).reverse().map(function(a) {
      return Promise.resolve().then(function() {
        return a.cleanup(t);
      }).catch(function(s) {
        return { error: s.message };
      });
    });
    Promise.all(l).then(function() {
      var a = function(s) {
        if (s >= n.length) {
          var u = Math.round(performance.now() - i), c = o.some(function(h) {
            return !h.success;
          }), d = {
            success: !c,
            phaseId: e,
            handlersExecuted: o.length,
            results: o,
            duration: u
          };
          Vf(d), r(d);
          return;
        }
        var f = n[s], g = performance.now();
        Promise.resolve().then(function() {
          return f.handler(t);
        }).then(function() {
          o.push({
            handlerId: f.id,
            description: f.description,
            success: !0,
            duration: Math.round(performance.now() - g)
          }), a(s + 1);
        }).catch(function(h) {
          o.push({
            handlerId: f.id,
            description: f.description,
            success: !1,
            error: h.message,
            duration: Math.round(performance.now() - g)
          }), a(s + 1);
        });
      };
      a(0);
    });
  });
}
function jn(e, t, r) {
  return r === void 0 && (r = {}), new Promise(function(n) {
    var i = [], o = performance.now(), l = function(a) {
      if (a >= e.length) {
        var s = i.some(function(u) {
          return !u.success;
        });
        n({
          success: !s,
          phasesProcessed: i.length,
          results: i,
          duration: Math.round(performance.now() - o)
        });
        return;
      }
      Yn(e[a], t).then(function(u) {
        i.push(u), !u.success && r.stopOnError ? n({
          success: !1,
          phasesProcessed: i.length,
          results: i,
          stoppedAt: e[a],
          duration: Math.round(performance.now() - o)
        }) : l(a + 1);
      });
    };
    l(0);
  });
}
function cs(e, t, r) {
  var n = zn, i = n.indexOf(e);
  if (i === -1)
    return Promise.resolve({
      success: !1,
      error: "Phase not found in reinit order: " + e
    });
  var o = n.slice(i);
  return jn(o, t, r);
}
function Vf(e) {
  for (yr.unshift({
    timestamp: Date.now(),
    phaseId: e.phaseId,
    success: e.success,
    handlersExecuted: e.handlersExecuted,
    duration: e.duration
  }); yr.length > zf; )
    yr.pop();
}
function Ku() {
  return yr.slice();
}
function qu(e) {
  return (Ge[e] || []).map(function(t) {
    return {
      id: t.id,
      description: t.description,
      priority: t.priority,
      hasCleanup: !!t.cleanup
    };
  });
}
function Sa() {
  return Object.keys(Ge).filter(function(e) {
    return Ge[e].length > 0;
  });
}
function Ju() {
  Ge = {}, yr = [];
}
function Oa() {
  return {
    moduleId: ya,
    version: Aa,
    supportedPhases: zn,
    registeredPhases: Sa(),
    totalHandlers: Object.keys(Ge).reduce(function(e, t) {
      return e + Ge[t].length;
    }, 0),
    historyCount: yr.length,
    improvements: ["#29-PartialReinit"]
  };
}
function Zu() {
  var e = yr.filter(function(t) {
    return !t.success && Date.now() - t.timestamp < 3e5;
  });
  return ue({
    status: e.length > 2 ? B.DEGRADED : B.HEALTHY,
    moduleId: ya,
    version: Aa,
    details: {
      registeredPhases: Sa().length,
      recentFailures: e.length
    }
  });
}
var Yf = {
  REINIT_SUPPORTED_PHASES: zn,
  registerHandler: Wu,
  unregisterHandler: $u,
  supportsReinit: Vn,
  reinitPhase: Yn,
  reinitPhases: jn,
  reinitFrom: cs,
  getHistory: Ku,
  getPhaseHandlers: qu,
  getRegisteredPhases: Sa,
  reset: Ju,
  info: Oa,
  healthCheck: Zu,
  MODULE_ID: ya,
  VERSION: Aa
};
const Qu = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ya,
  REINIT_SUPPORTED_PHASES: zn,
  VERSION: Aa,
  default: Yf,
  getHistory: Ku,
  getPhaseHandlers: qu,
  getRegisteredPhases: Sa,
  healthCheck: Zu,
  info: Oa,
  registerHandler: Wu,
  reinitFrom: cs,
  reinitPhase: Yn,
  reinitPhases: jn,
  reset: Ju,
  supportsReinit: Vn,
  unregisterHandler: $u
}, Symbol.toStringTag, { value: "Module" }));
function jf() {
  if (!sr) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var e = window.Core.windowAdapter.get("Kernel");
    if (e) return e;
  }
  return window.Kernel || null;
}
function Wf() {
  var e = yo();
  return e && e.getKernel ? e.getKernel() : jf();
}
function $f() {
  return {
    moduleId: Or,
    version: rr,
    sprints: 9,
    totalImprovements: 26,
    features: {
      enterprise: !0,
      robust: !0,
      observability: !0,
      quality: !0,
      persistence: !0,
      observabilityAdvanced: !0,
      resilienceAdvanced: !0,
      performance: !0,
      featuresToolbar: !0,
      featuresIntegration: !0
    },
    modules: {
      ModuleEvents: Ro(),
      OpenTelemetry: Uo(),
      NetworkDetector: Go(),
      ManifestIntegrity: aa(),
      PhaseRollback: ts(),
      LazyLoader: ha(),
      BootCancellation: ls(),
      PartialReinit: Oa()
    },
    hasPreBootResult: !!zi(),
    hasBootResult: !!zl()
  };
}
function Kf() {
  var e = _i(), t = yo(), r = e ? e.healthCheck() : null, n = t ? t.healthCheck() : null, i = "INITIALIZING";
  if (n && (i = n.status), Qr() && (i = i === "HEALTHY" ? "DEGRADED" : i), t && t.getManifest) {
    var o = Xr(t.getManifest());
    o.valid || (i = "UNHEALTHY");
  }
  return {
    status: i,
    moduleId: Or,
    version: rr,
    sprints: 9,
    totalImprovements: 26,
    stages: {
      preBoot: r,
      bootstrap: n
    },
    network: zo(),
    manifestIntegrity: Jo(),
    cancellation: us(),
    timestamp: Date.now()
  };
}
const qf = Ln({ moduleId: Or + ":loader-logger" });
function te(e, t, r) {
  const n = qf.get("logger");
  if (n && n[e]) {
    n[e]("[" + Or + "] " + t, r || "");
    return;
  }
  e === "error" && console.error("[" + Or + "]", t, r || "");
}
let Jf = null;
function uo(e, t) {
  try {
    const r = Jf || (sr ? window.EventBus : null);
    r && r.emit && r.emit(e, Object.assign({}, t, { source: Or, timestamp: Date.now() }));
  } catch {
  }
}
var Zf = "1.0.1-CONTRACTS", at = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  LOADING_BRIDGE: "loading-bridge",
  LOADING_METRICS: "loading-metrics",
  LOADING_PERMISSIONS: "loading-permissions",
  READY: "ready",
  FAILED: "failed"
}, cr = {
  START: "pre-boot:start",
  BRIDGE_READY: "pre-boot:bridge:ready",
  METRICS_READY: "pre-boot:metrics:ready",
  PERMISSIONS_READY: "pre-boot:permissions:ready",
  COMPLETE: "pre-boot:complete",
  ERROR: "pre-boot:error"
};
function qa() {
  return {
    success: !1,
    state: at.IDLE,
    modules: {
      bridge: { loaded: !1, error: null, time: 0 },
      metrics: { loaded: !1, error: null, time: 0 },
      permissions: { loaded: !1, mode: "unknown", error: null, time: 0 }
    },
    timing: {
      startTime: null,
      endTime: null,
      totalTime: 0,
      moduleTimings: {}
    },
    errors: [],
    version: Zf
  };
}
var Ja = "pre-boot-orchestrator", sl = "1.2.0-DOMAIN-PURE";
function Qf(e) {
  e === void 0 && (e = {});
  var t = at.IDLE, r = qa(), n = {}, i = [], o = e.logger || null, l = e.eventBus || null, a = {
    status: "INITIALIZING",
    modulesLoaded: 0,
    totalModules: 3,
    criticalIssues: [],
    warnings: []
  };
  function s(y, R, O) {
    if (o) {
      const b = o;
      b[y] && b[y]("[" + Ja + "] " + R, O || "");
    }
  }
  function u(y, R) {
    for (var O = n[y] || [], b = 0; b < O.length; b++)
      try {
        O[b](R);
      } catch {
      }
    if (l) {
      const P = l;
      if (P.emit)
        try {
          P.emit(y, R);
        } catch {
        }
    }
  }
  function c(y, R) {
    var O = n;
    O[y] || (O[y] = []), O[y].push(R);
    var b = function() {
      var P = O[y] || [], C = P.indexOf(R);
      C !== -1 && P.splice(C, 1);
    };
    return i.push(b), b;
  }
  function d(y) {
    var R = t;
    t = y, r.state = y, s("info", "State: " + R + " → " + y);
  }
  function f() {
    if (!l) {
      if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
        var y = window.Core.windowAdapter.get("EventBus");
        if (y) {
          l = y;
          return;
        }
      }
      typeof window < "u" && window.EventBus && (l = window.EventBus);
    }
  }
  function g() {
    var y = performance.now();
    return d(at.LOADING_BRIDGE), import("/core/runtime/boot-ready-dom-bridge.js").then(function(R) {
      R && R.init && R.init();
      var O = Math.round(performance.now() - y);
      return r.modules.bridge = { loaded: !0, error: null, time: O }, r.timing.moduleTimings.bridge = O, a.modulesLoaded++, s("info", "Bridge loaded", { time: O }), u(cr.BRIDGE_READY, { time: O }), !0;
    }).catch(function(R) {
      var O = Math.round(performance.now() - y);
      return r.modules.bridge = { loaded: !1, error: R.message, time: O }, r.timing.moduleTimings.bridge = O, r.errors.push({ module: "bridge", error: R.message }), a.warnings.push("Bridge failed: " + R.message), s("warn", "Bridge failed (non-critical)", { error: R.message }), !1;
    });
  }
  function h() {
    var y = performance.now();
    return d(at.LOADING_METRICS), import("/assets/js/core/metrics-polling/index.js").then(function(R) {
      R.default && (typeof window < "u" && (window.MetricsPollingManager = R.default), R.default.init());
      var O = Math.round(performance.now() - y);
      return r.modules.metrics = { loaded: !0, error: null, time: O }, r.timing.moduleTimings.metrics = O, a.modulesLoaded++, s("info", "Metrics loaded", { time: O }), u(cr.METRICS_READY, { time: O }), !0;
    }).catch(function(R) {
      var O = Math.round(performance.now() - y);
      return r.modules.metrics = { loaded: !1, error: R.message, time: O }, r.timing.moduleTimings.metrics = O, r.errors.push({ module: "metrics", error: R.message }), a.warnings.push("Metrics failed: " + R.message), s("warn", "Metrics failed (non-critical)", { error: R.message }), !1;
    });
  }
  function p() {
    var y = performance.now();
    return d(at.LOADING_PERMISSIONS), import("/components/_shared/permissions/integration.js").then(function(R) {
      var O = "unknown";
      if (R.default) {
        var b = R.default.init({ debug: !1 });
        O = b.ok ? "allow-all" : "error";
      }
      var P = Math.round(performance.now() - y);
      return r.modules.permissions = { loaded: !0, mode: O, error: null, time: P }, r.timing.moduleTimings.permissions = P, a.modulesLoaded++, s("info", "Permissions loaded", { mode: O, time: P }), u(cr.PERMISSIONS_READY, { mode: O, time: P }), !0;
    }).catch(function(R) {
      var O = Math.round(performance.now() - y);
      return r.modules.permissions = { loaded: !1, mode: "error", error: R.message, time: O }, r.timing.moduleTimings.permissions = O, r.errors.push({ module: "permissions", error: R.message }), a.warnings.push("Permissions failed: " + R.message), s("warn", "Permissions failed (non-critical)", { error: R.message }), !1;
    });
  }
  function A() {
    var y = a.modulesLoaded, R = a.totalModules;
    return y === R && a.criticalIssues.length === 0 ? a.status = "HEALTHY" : y >= 1 && a.criticalIssues.length === 0 ? a.status = "DEGRADED" : a.status = "UNHEALTHY", a;
  }
  function T() {
    return t !== at.IDLE ? (s("warn", "Pre-boot already running or completed"), Promise.resolve(r)) : (r = qa(), r.timing.startTime = performance.now(), d(at.INITIALIZING), s("info", "Pre-boot starting (Stage -1)"), u(cr.START, { timestamp: Date.now() }), f(), g().then(function() {
      return h();
    }).then(function() {
      return p();
    }).then(function() {
      return r.timing.endTime = performance.now(), r.timing.totalTime = Math.round(r.timing.endTime - r.timing.startTime), A(), r.health = Object.assign({}, a), r.success = !0, d(at.READY), s("info", "Pre-boot complete (Stage -1)", {
        totalTime: r.timing.totalTime,
        health: a.status,
        modules: {
          bridge: r.modules.bridge.loaded,
          metrics: r.modules.metrics.loaded,
          permissions: r.modules.permissions.loaded
        }
      }), u(cr.COMPLETE, r), r;
    }).catch(function(y) {
      return r.timing.endTime = performance.now(), r.timing.totalTime = Math.round(r.timing.endTime - r.timing.startTime), r.success = !1, r.errors.push({ module: "orchestrator", error: y.message }), a.criticalIssues.push("Orchestrator error: " + y.message), A(), r.health = Object.assign({}, a), d(at.FAILED), s("error", "Pre-boot failed", { error: y.message }), u(cr.ERROR, { error: y.message, result: r }), r;
    }));
  }
  function S() {
    return t;
  }
  function L() {
    return Object.assign({}, r);
  }
  function H() {
    return t === at.READY;
  }
  function E() {
    return Object.assign({}, a);
  }
  function m() {
    for (var y = 0; y < i.length; y++)
      try {
        i[y]();
      } catch {
      }
    i = [], t = at.IDLE, r = qa(), n = {}, a = {
      status: "INITIALIZING",
      modulesLoaded: 0,
      totalModules: 3,
      criticalIssues: [],
      warnings: []
    }, s("info", "Pre-boot reset (with listener cleanup)");
  }
  function v() {
    return {
      moduleId: Ja,
      version: sl,
      state: t,
      isReady: H(),
      health: a.status,
      modules: {
        bridge: r.modules.bridge.loaded,
        metrics: r.modules.metrics.loaded,
        permissions: r.modules.permissions.loaded
      },
      totalTime: r.timing.totalTime,
      errors: r.errors.length,
      warnings: a.warnings.length,
      quickWinsApplied: ["QW06-HealthCheck", "QW12-ListenerCleanup"]
    };
  }
  function w() {
    return A(), {
      status: a.status,
      moduleId: Ja,
      version: sl,
      state: t,
      modulesLoaded: a.modulesLoaded,
      totalModules: a.totalModules,
      criticalIssues: a.criticalIssues.length,
      warnings: a.warnings.length,
      timestamp: Date.now()
    };
  }
  return {
    run: T,
    getState: S,
    getResult: L,
    getHealthStatus: E,
    isReady: H,
    reset: m,
    on: c,
    info: v,
    healthCheck: w,
    STATES: at,
    EVENTS: cr
  };
}
var Za = null;
function Xf(e) {
  return Za || (Za = Qf(e)), Za;
}
function eh() {
  if (!sr) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const e = window.Core.windowAdapter.get("Logger");
    if (e) return e;
  }
  return window.Logger || null;
}
function th() {
  te("info", "Stage -1: Pre-Boot starting");
  const e = Xf({ logger: eh() });
  return sf(e), e.run().then(function(t) {
    return uf(t), te("info", "Stage -1: Pre-Boot complete", {
      success: t.success,
      totalTime: t.timing.totalTime
    }), t;
  });
}
function rh(e, t) {
  sr && (window[e] = t);
}
const ds = "circuit-breaker", fs = "1.2.0-HEALTH-CONTRACT", ce = {
  CLOSED: "closed",
  // Normal - permite requisições
  OPEN: "open",
  // Falha - bloqueia requisições
  HALF_OPEN: "half-open"
  // Teste - permite uma requisição de teste
}, vt = {
  STATE_CHANGE: "circuit-breaker:state-change",
  OPENED: "circuit-breaker:opened",
  CLOSED: "circuit-breaker:closed",
  HALF_OPEN: "circuit-breaker:half-open",
  FAILURE: "circuit-breaker:failure",
  SUCCESS: "circuit-breaker:success"
}, dn = {
  failureThreshold: 3,
  // Falhas antes de abrir
  successThreshold: 2,
  // Sucessos para fechar
  timeout: 3e4,
  // Tempo em OPEN antes de HALF_OPEN (30s)
  resetTimeout: 6e4
  // Tempo para reset completo (60s)
}, Ce = {}, zr = [];
function _r(e, t) {
  for (let r = 0; r < zr.length; r++)
    try {
      zr[r]({ event: e, data: t, timestamp: Date.now() });
    } catch {
    }
}
function hs(e, t) {
  t === void 0 && (t = {});
  const r = {
    failureThreshold: t.failureThreshold || dn.failureThreshold,
    successThreshold: t.successThreshold || dn.successThreshold,
    timeout: t.timeout || dn.timeout,
    resetTimeout: t.resetTimeout || dn.resetTimeout
  };
  let n = ce.CLOSED, i = 0, o = 0, l = null, a = null, s = null;
  function u(E, m, v) {
    const w = {
      moduleId: e,
      from: E,
      to: m,
      reason: v,
      failures: i,
      successes: o
    };
    _r(vt.STATE_CHANGE, w), m === ce.OPEN ? _r(vt.OPENED, w) : m === ce.CLOSED ? _r(vt.CLOSED, w) : m === ce.HALF_OPEN && _r(vt.HALF_OPEN, w);
  }
  function c() {
    if (n === ce.OPEN && s && Date.now() - s >= r.timeout) {
      const m = n;
      return n = ce.HALF_OPEN, u(m, n, "Timeout elapsed, testing"), !0;
    }
    return !1;
  }
  function d() {
    return c(), n === ce.CLOSED || n === ce.HALF_OPEN;
  }
  function f() {
    a = Date.now();
    const E = n;
    return n === ce.HALF_OPEN ? (o++, o >= r.successThreshold && (n = ce.CLOSED, i = 0, o = 0, s = null, u(E, n, "Success threshold reached"))) : n === ce.CLOSED && (i = Math.max(0, i - 1)), _r(vt.SUCCESS, { moduleId: e, state: n }), { state: n, failures: i, successes: o };
  }
  function g(E) {
    i++, l = Date.now();
    const m = n;
    return n === ce.HALF_OPEN ? (n = ce.OPEN, s = Date.now(), o = 0, u(m, n, "Failure during half-open test")) : n === ce.CLOSED && i >= r.failureThreshold && (n = ce.OPEN, s = Date.now(), u(m, n, "Failure threshold reached")), _r(vt.FAILURE, {
      moduleId: e,
      state: n,
      error: E ? E.message : "unknown",
      failures: i
    }), { state: n, failures: i, error: E ? E.message : "unknown" };
  }
  function h() {
    const E = n;
    n = ce.CLOSED, i = 0, o = 0, l = null, a = null, s = null, E !== ce.CLOSED && u(E, n, "Manual reset");
  }
  function p() {
    return c(), n;
  }
  function A() {
    return p() === ce.OPEN;
  }
  function T() {
    return p() === ce.CLOSED;
  }
  function S() {
    return p() === ce.HALF_OPEN;
  }
  function L() {
    return {
      moduleId: e,
      state: p(),
      failures: i,
      successes: o,
      lastFailureTime: l,
      lastSuccessTime: a,
      openedAt: s,
      config: r
    };
  }
  function H(E) {
    return d() ? Promise.resolve().then(function() {
      return E();
    }).then(function(m) {
      return f(), m;
    }).catch(function(m) {
      throw g(m), m;
    }) : Promise.reject(new Error("Circuit breaker OPEN for " + e));
  }
  return {
    canExecute: d,
    recordSuccess: f,
    recordFailure: g,
    reset: h,
    getState: p,
    isOpen: A,
    isClosed: T,
    isHalfOpen: S,
    getStats: L,
    execute: H,
    STATES: ce
  };
}
function Wn(e, t) {
  return Ce[e] || (Ce[e] = hs(e, t)), Ce[e];
}
function $n() {
  const e = {};
  for (const t in Ce)
    Ce.hasOwnProperty(t) && (e[t] = Ce[t].getStats());
  return e;
}
function Xu() {
  for (const e in Ce)
    Ce.hasOwnProperty(e) && Ce[e].reset();
}
function lt() {
  let e = 0;
  for (const t in Ce)
    Ce.hasOwnProperty(t) && Ce[t].getState() === ce.OPEN && e++;
  return e;
}
function Ia() {
  const e = [];
  for (const t in Ce)
    Ce.hasOwnProperty(t) && Ce[t].getState() === ce.OPEN && e.push(Ce[t].getStats());
  return e;
}
function Mi(e) {
  return typeof e == "function" ? (zr.push(e), function() {
    const r = zr.indexOf(e);
    r !== -1 && zr.splice(r, 1);
  }) : function() {
  };
}
function Dr() {
  const e = Object.keys(Ce).length, t = lt();
  let r = B.HEALTHY;
  return e > 0 && (t / e >= 0.5 ? r = B.FAILED : t > 0 && (r = B.DEGRADED)), ue({
    status: r,
    moduleId: ds,
    version: fs,
    details: {
      total: e,
      open: t,
      closed: e - t,
      openBreakers: Ia()
    }
  });
}
function gs() {
  const e = Object.keys(Ce).length, t = lt();
  return {
    moduleId: ds,
    version: fs,
    breakerCount: e,
    openCount: t,
    listenerCount: zr.length,
    breakers: $n(),
    health: Dr()
  };
}
var nh = {
  createCircuitBreaker: hs,
  getBreaker: Wn,
  getAllBreakers: $n,
  resetAll: Xu,
  getOpenCount: lt,
  getOpenBreakers: Ia,
  subscribe: Mi,
  healthCheck: Dr,
  info: gs,
  STATES: ce,
  BREAKER_EVENTS: vt
};
const tt = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BREAKER_EVENTS: vt,
  DEFAULT_CONFIG: dn,
  MODULE_ID: ds,
  STATES: ce,
  VERSION: fs,
  createCircuitBreaker: hs,
  default: nh,
  getAllBreakers: $n,
  getBreaker: Wn,
  getOpenBreakers: Ia,
  getOpenCount: lt,
  healthCheck: Dr,
  info: gs,
  resetAll: Xu,
  subscribe: Mi
}, Symbol.toStringTag, { value: "Module" }));
var ec = N, ih = Object.freeze([
  N.HEALTHY,
  N.DEGRADED,
  N.UNHEALTHY,
  N.FAILED
]), Qa = Object.freeze({
  // Minúsculas → Maiúsculas
  healthy: N.HEALTHY,
  degraded: N.DEGRADED,
  unhealthy: N.UNHEALTHY,
  failed: N.FAILED,
  // Status customizados → BOOT_HEALTH padrão
  initializing: N.DEGRADED,
  INITIALIZING: N.DEGRADED,
  unknown: N.DEGRADED,
  UNKNOWN: N.DEGRADED,
  CANCELLED: N.FAILED,
  cancelled: N.FAILED,
  OFFLINE: N.UNHEALTHY,
  offline: N.UNHEALTHY,
  CRITICAL: N.FAILED,
  critical: N.FAILED,
  NOT_INITIALIZED: N.DEGRADED,
  not_initialized: N.DEGRADED,
  DISABLED: N.DEGRADED,
  disabled: N.DEGRADED,
  NOT_EXECUTED: N.DEGRADED,
  not_executed: N.DEGRADED,
  // Já válidos (passthrough)
  HEALTHY: N.HEALTHY,
  DEGRADED: N.DEGRADED,
  UNHEALTHY: N.UNHEALTHY,
  FAILED: N.FAILED
});
function ah(e) {
  if (!e || typeof e != "string")
    return N.DEGRADED;
  var t = Qa[e];
  if (t) return t;
  var r = e.toUpperCase();
  return Qa[r] ? Qa[r] : N.DEGRADED;
}
function oh(e) {
  return ih.indexOf(e) !== -1;
}
function tc(e) {
  e || (e = {});
  var t = e.status || N.DEGRADED;
  oh(t) || (t = ah(t));
  var r = {
    status: t,
    moduleId: e.moduleId || "unknown",
    version: e.version || "0.0.0",
    timestamp: e.timestamp || Date.now()
  };
  if (e.checks && typeof e.checks == "object") {
    r.checks = e.checks;
    for (var n = Object.keys(e.checks), i = 0, o = 0; o < n.length; o++)
      e.checks[n[o]] && i++;
    r.score = i + "/" + n.length;
  }
  return e.details && typeof e.details == "object" && (r.details = e.details), e.message && typeof e.message == "string" && (r.message = e.message), r;
}
const pe = Object.freeze({
  NONE: "NONE",
  // Sem degradação — sistema saudável
  PARTIAL: "PARTIAL",
  // Degradação parcial — algumas features indisponíveis
  SIGNIFICANT: "SIGNIFICANT",
  // Degradação significativa — funcionalidade limitada
  SEVERE: "SEVERE",
  // Degradação severa — apenas básico funciona
  TOTAL: "TOTAL"
  // Falha total — sistema não operacional
}), Ee = Object.freeze({
  INFO: "info",
  // Informativo — sem impacto funcional
  WARNING: "warning",
  // Aviso — impacto menor
  ERROR: "error",
  // Erro — impacto significativo
  CRITICAL: "critical"
  // Crítico — sistema comprometido
}), sh = Object.freeze([
  pe.NONE,
  pe.PARTIAL,
  pe.SIGNIFICANT,
  pe.SEVERE,
  pe.TOTAL
]);
Object.freeze([
  ie.HALT,
  ie.DEGRADED,
  ie.SKIP,
  ie.ALLOW_SHELL_ONLY,
  ie.ALLOW_LOGIN_ONLY
]);
const lh = Object.freeze([
  Ee.INFO,
  Ee.WARNING,
  Ee.ERROR,
  Ee.CRITICAL
]), uh = Object.freeze({
  [ie.HALT]: pe.TOTAL,
  [ie.DEGRADED]: pe.SIGNIFICANT,
  [ie.ALLOW_LOGIN_ONLY]: pe.SEVERE,
  [ie.ALLOW_SHELL_ONLY]: pe.SEVERE,
  [ie.SKIP]: pe.PARTIAL
}), ch = Object.freeze({
  [ie.HALT]: Ee.CRITICAL,
  [ie.DEGRADED]: Ee.ERROR,
  [ie.ALLOW_LOGIN_ONLY]: Ee.ERROR,
  [ie.ALLOW_SHELL_ONLY]: Ee.WARNING,
  [ie.SKIP]: Ee.WARNING
}), dh = Object.freeze({
  [ie.HALT]: !1,
  [ie.DEGRADED]: !0,
  [ie.ALLOW_LOGIN_ONLY]: !0,
  [ie.ALLOW_SHELL_ONLY]: !0,
  [ie.SKIP]: !0
});
function fh(e) {
  return sh.indexOf(e) !== -1;
}
function hh(e) {
  return lh.indexOf(e) !== -1;
}
function gh(e) {
  return e ? uh[e] || pe.SIGNIFICANT : pe.NONE;
}
function mh(e) {
  return e ? ch[e] || Ee.WARNING : Ee.INFO;
}
function ph(e) {
  if (!e) return !0;
  const t = dh[e];
  return t !== void 0 ? t : !0;
}
function Eh(e) {
  e || (e = {});
  const t = e.mode || null;
  let r = e.status;
  (!r || !fh(r)) && (r = gh(t));
  let n = e.severity;
  (!n || !hh(n)) && (n = mh(t));
  const i = {
    status: r,
    mode: t,
    phaseId: e.phaseId || "unknown",
    timestamp: e.timestamp || Date.now()
  };
  return e.reason && typeof e.reason == "string" && (i.reason = e.reason), i.severity = n, i.recoverable = e.recoverable !== void 0 ? e.recoverable : ph(t), e.details && typeof e.details == "object" && (i.details = e.details), i.notified = e.notified !== void 0 ? e.notified : !1, e.error && (i.error = typeof e.error == "string" ? e.error : e.error.message || "Unknown error"), i;
}
const vh = Object.freeze({
  "boot-failed": { status: pe.TOTAL, severity: Ee.CRITICAL },
  "critical-phase-failed": { status: pe.TOTAL, severity: Ee.CRITICAL },
  "phase-failed": { status: pe.SIGNIFICANT, severity: Ee.ERROR },
  "circuit-breaker-open": { status: pe.SIGNIFICANT, severity: Ee.ERROR },
  degraded: { status: pe.SIGNIFICANT, severity: Ee.WARNING },
  "phase-degraded": { status: pe.PARTIAL, severity: Ee.WARNING },
  "timeout-warning": { status: pe.PARTIAL, severity: Ee.WARNING }
});
function yh(e) {
  return !e || typeof e != "string" ? { status: pe.PARTIAL, severity: Ee.WARNING } : vh[e] || { status: pe.PARTIAL, severity: Ee.WARNING };
}
const ur = "degradation-notifier", Ta = "1.4.0-DEGRADATION-CONTRACT", Kn = Ln({ moduleId: ur });
function rc(e) {
  return Kn.get(e);
}
function nc(e) {
  return Kn.inject(e);
}
function ic() {
  return Kn.snapshot();
}
const Ye = Ee, Ah = {
  enabled: !0,
  showToast: !0,
  showBanner: !0,
  autoHideDelay: 1e4,
  maxNotifications: 5,
  groupSimilar: !0,
  persistCritical: !0,
  logToConsole: !0
};
let ze = Object.assign({}, Ah), _e = [], Vr = [], ll = 0, qn = !1, ms = null;
function Sh(e, t, r) {
  ll++;
  const n = yh(e);
  return {
    id: ll,
    type: e,
    message: t,
    details: r || {},
    severity: n.severity,
    status: n.status,
    timestamp: Date.now(),
    dismissed: !1,
    grouped: !1,
    groupCount: 1
  };
}
function Jn(e, t) {
  for (let r = 0; r < Vr.length; r++)
    try {
      Vr[r](e, t);
    } catch (n) {
      ze.logToConsole && console.warn("[" + ur + "] Listener error:", n);
    }
}
function Zn(e, t) {
  const r = rc("eventBus");
  if (r && r.emit)
    try {
      r.emit(e, Object.assign({}, t, {
        source: ur,
        timestamp: Date.now()
      }));
    } catch {
    }
}
function qr(e, t, r) {
  if (!ze.logToConsole) return;
  const n = "[" + ur + "]", i = rc("logger");
  i && i[e] && i[e](n + " " + t, r || "");
}
function Oh(e) {
  ze.showToast && (Zn(_n.TOAST, {
    id: e.id,
    type: e.type,
    message: e.message,
    severity: e.severity,
    status: e.status,
    autoHide: e.severity !== Ye.CRITICAL || !ze.persistCritical,
    autoHideDelay: ze.autoHideDelay
  }), qr("info", "Toast emitted", { id: e.id, type: e.type }));
}
function ba(e, t) {
  qn = e, ms = t, Zn(_n.BANNER, {
    visible: e,
    content: t,
    severity: t ? t.severity : null
  }), e ? qr("warn", "Banner shown", t) : qr("info", "Banner hidden");
}
function Ih(e) {
  if (!ze.groupSimilar) return !1;
  for (let t = 0; t < _e.length; t++) {
    const r = _e[t];
    if (!r.dismissed && r.type === e.type)
      return r.groupCount++, r.grouped = !0, r.lastUpdate = Date.now(), Jn("grouped", r), !0;
  }
  return !1;
}
function Th() {
  const e = _e.filter(function(t) {
    return !t.dismissed;
  });
  if (e.length > ze.maxNotifications) {
    const t = e.filter(function(n) {
      return n.severity !== Ye.CRITICAL;
    }).sort(function(n, i) {
      return n.timestamp - i.timestamp;
    }), r = e.length - ze.maxNotifications;
    for (let n = 0; n < r && n < t.length; n++)
      t[n].dismissed = !0, Jn("auto-dismissed", t[n]);
  }
}
function Pt(e, t, r) {
  if (!ze.enabled) return null;
  const n = Sh(e, t, r);
  return Ih(n) ? null : (_e.push(n), Th(), Oh(n), (n.severity === Ye.CRITICAL || n.severity === Ye.ERROR) && ba(!0, {
    message: n.message,
    severity: n.severity,
    status: n.status,
    type: n.type,
    count: _e.filter(function(i) {
      return !i.dismissed && (i.severity === Ye.CRITICAL || i.severity === Ye.ERROR);
    }).length
  }), Jn("notify", n), Zn(_n.NOTIFY, n), qr(
    n.severity === Ye.CRITICAL ? "error" : "warn",
    "Degradation notified: " + e,
    { message: t, details: r }
  ), n);
}
function Tn(e, t) {
  return Pt("phase-degraded", "Fase " + e + " em modo degradado", {
    phaseId: e,
    reason: t
  });
}
function ps(e, t, r) {
  return Pt(r ? "critical-phase-failed" : "phase-failed", "Fase " + e + " falhou" + (r ? " (crítica)" : ""), {
    phaseId: e,
    error: t,
    critical: r
  });
}
function Es(e, t) {
  return Pt("circuit-breaker-open", "Circuit Breaker aberto: " + e, {
    moduleId: e,
    stats: t
  });
}
function ac(e, t) {
  return Pt("degraded", "Sistema em modo degradado: " + e, t);
}
function Ra(e) {
  return Pt("boot-failed", "Falha no boot: " + e, { error: e });
}
function vs(e, t) {
  return Pt("timeout-warning", "Boot demorando mais que o esperado", {
    elapsed: e,
    timeout: t
  });
}
function Pi(e, t) {
  return Pt("phase-rollback", "Fase " + e + " sofreu rollback", {
    phaseId: e,
    rollbackResult: t
  });
}
function ys(e) {
  for (let t = 0; t < _e.length; t++)
    if (_e[t].id === e)
      return _e[t].dismissed = !0, Jn("dismissed", _e[t]), Zn(_n.DISMISSED, { id: e }), !_e.some(function(n) {
        return !n.dismissed && (n.severity === Ye.CRITICAL || n.severity === Ye.ERROR);
      }) && qn && ba(!1, null), !0;
  return !1;
}
function As() {
  let e = 0;
  for (let t = 0; t < _e.length; t++)
    _e[t].dismissed || (_e[t].dismissed = !0, e++);
  return ba(!1, null), Jn("dismissed-all", { count: e }), Zn(_n.DISMISSED_ALL, { count: e }), e;
}
function Qn() {
  return _e.filter(function(e) {
    return !e.dismissed;
  });
}
function oc() {
  return _e.slice();
}
function sc() {
  return {
    visible: qn,
    content: ms
  };
}
function lc(e) {
  return typeof e == "function" ? (Vr.push(e), function() {
    const r = Vr.indexOf(e);
    r !== -1 && Vr.splice(r, 1);
  }) : function() {
  };
}
function uc(e) {
  ze = Object.assign({}, ze, e), qr("info", "Configuration updated", ze);
}
function cc() {
  return Object.assign({}, ze);
}
function dc() {
  _e = [], qn = !1, ms = null, ba(!1, null), qr("info", "Reset complete");
}
function fc() {
  const e = Qn();
  return {
    moduleId: ur,
    version: Ta,
    enabled: ze.enabled,
    portsInitialized: Kn.isInitialized(),
    totalNotifications: _e.length,
    activeNotifications: e.length,
    criticalCount: e.filter(function(t) {
      return t.severity === Ye.CRITICAL;
    }).length,
    errorCount: e.filter(function(t) {
      return t.severity === Ye.ERROR;
    }).length,
    warningCount: e.filter(function(t) {
      return t.severity === Ye.WARNING;
    }).length,
    bannerVisible: qn,
    listeners: Vr.length,
    contractVersion: "1.0.0",
    improvements: ["#25-DegradationNotifier", "DEGRADATION-CONTRACT"]
  };
}
function hc() {
  return tc({
    status: ec.HEALTHY,
    moduleId: ur,
    version: Ta,
    details: {
      portsInitialized: Kn.isInitialized(),
      enabled: ze.enabled,
      activeNotifications: Qn().length,
      contractIntegrated: !0
    }
  });
}
var bh = {
  MODULE_ID: ur,
  VERSION: Ta,
  SEVERITY: Ye,
  notify: Pt,
  notifyPhaseDegraded: Tn,
  notifyPhaseFailed: ps,
  notifyCircuitBreakerOpen: Es,
  notifyBootDegraded: ac,
  notifyBootFailed: Ra,
  notifyTimeoutWarning: vs,
  notifyPhaseRollback: Pi,
  dismiss: ys,
  dismissAll: As,
  getActive: Qn,
  getAll: oc,
  getBannerStatus: sc,
  subscribe: lc,
  configure: uc,
  getConfig: cc,
  reset: dc,
  info: fc,
  healthCheck: hc,
  injectPorts: nc,
  getPorts: ic
};
const we = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ur,
  SEVERITY: Ye,
  VERSION: Ta,
  configure: uc,
  default: bh,
  dismiss: ys,
  dismissAll: As,
  getActive: Qn,
  getAll: oc,
  getBannerStatus: sc,
  getConfig: cc,
  getPortsSnapshot: ic,
  healthCheck: hc,
  info: fc,
  injectPorts: nc,
  notify: Pt,
  notifyBootDegraded: ac,
  notifyBootFailed: Ra,
  notifyCircuitBreakerOpen: Es,
  notifyPhaseDegraded: Tn,
  notifyPhaseFailed: ps,
  notifyPhaseRollback: Pi,
  notifyTimeoutWarning: vs,
  reset: dc,
  subscribe: lc
}, Symbol.toStringTag, { value: "Module" }));
function Rh() {
  if (!sr) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var e = window.Core.windowAdapter.get("Kernel");
    if (e) return e;
  }
  return window.Kernel || null;
}
function wh(e, t) {
  return {
    // Core
    boot: function() {
      return e.boot();
    },
    getState: function() {
      return e.getState();
    },
    isReady: function() {
      return e.isReady();
    },
    getResult: function() {
      return e.getResult();
    },
    reset: function() {
      return e.reset();
    },
    getSingletonState: function() {
      return e.getSingletonState();
    },
    healthCheck: function() {
      return e.healthCheck();
    },
    info: function() {
      return e.info();
    },
    // Platform APIs
    getContext: function() {
      return e.getContext ? e.getContext() : null;
    },
    getContextSnapshot: function() {
      return e.getContextSnapshot ? e.getContextSnapshot() : null;
    },
    getHealthAggregator: function() {
      return e.getHealthAggregator ? e.getHealthAggregator() : null;
    },
    getHealthStatus: function() {
      return e.getHealthStatus ? e.getHealthStatus() : null;
    },
    getManifest: function() {
      return e.getManifest ? e.getManifest() : null;
    },
    getDependencyGraph: function() {
      return e.getDependencyGraph ? e.getDependencyGraph() : null;
    },
    getFeatureFlags: function() {
      return e.getFeatureFlags ? e.getFeatureFlags() : null;
    },
    isFeatureEnabled: function(r) {
      return e.isFeatureEnabled ? e.isFeatureEnabled(r) : !1;
    },
    // Pre-Boot APIs
    getPreBootResult: function() {
      return zi();
    },
    getPreBootOrchestrator: function() {
      return _i();
    },
    // Enterprise: Kernel
    getKernel: function() {
      return e.getKernel ? e.getKernel() : Rh();
    },
    getStateMachine: function() {
      return e.getStateMachine ? e.getStateMachine() : null;
    },
    // Enterprise: Circuit Breaker
    getCircuitBreakerRegistry: function() {
      return tt;
    },
    getCircuitBreaker: function(r, n) {
      return Wn(r, n);
    },
    getCircuitBreakerStatus: function() {
      return Dr();
    },
    getAllCircuitBreakers: function() {
      return $n();
    },
    // Robust: Boot Loop Detection
    getBootLoopStatus: function() {
      return e.getBootLoopStatus ? e.getBootLoopStatus() : null;
    },
    resetBootLoopTracker: function() {
      return e.resetBootLoopTracker ? e.resetBootLoopTracker() : null;
    },
    // Robust: Global Timeout
    getGlobalTimeoutStatus: function() {
      return e.getGlobalTimeoutStatus ? e.getGlobalTimeoutStatus() : null;
    },
    // Observability: Periodic Health Check
    getPeriodicHealthStatus: function() {
      return e.getPeriodicHealthStatus ? e.getPeriodicHealthStatus() : null;
    },
    // Observability: Memory Metrics
    getMemoryMetrics: function() {
      return e.getMemoryMetrics ? e.getMemoryMetrics() : null;
    },
    // Observability: Degradation Notifier
    getDegradationNotifier: function() {
      return we;
    },
    getActiveNotifications: function() {
      return we ? Qn() : [];
    },
    dismissNotification: function(r) {
      return we ? ys(r) : !1;
    },
    dismissAllNotifications: function() {
      return we ? As() : 0;
    },
    // Quality: Tests and Validation
    runKernelTests: function() {
      return Promise.resolve().then(() => Yh).then(function(r) {
        return r.run();
      }).catch(function(r) {
        return { error: r.message };
      });
    },
    validateManifest: function() {
      return Promise.resolve().then(() => ig).then(function(r) {
        return r.validateManifest();
      }).catch(function(r) {
        return { valid: !1, error: r.message };
      });
    },
    // Sprint 5: Persistência
    getCurrentBoot: function() {
      return e.getCurrentBoot ? e.getCurrentBoot() : null;
    },
    getLastSuccessfulBoot: function() {
      return e.getLastSuccessfulBoot ? e.getLastSuccessfulBoot() : null;
    },
    hasRecentValidBoot: function(r) {
      return e.hasRecentValidBoot ? e.hasRecentValidBoot(r) : !1;
    },
    // Sprint 5: Histórico de Boots
    getBootHistory: function() {
      return e.getBootHistory ? e.getBootHistory() : [];
    },
    clearBootHistory: function() {
      return e.clearBootHistory ? e.clearBootHistory() : !1;
    },
    analyzeBootHistory: function() {
      return e.analyzeBootHistory ? e.analyzeBootHistory() : null;
    },
    // Sprint 5: Debug Mode
    enableDebug: function(r) {
      return e.enableDebug ? e.enableDebug(r) : null;
    },
    disableDebug: function() {
      return e.disableDebug ? e.disableDebug() : null;
    },
    toggleDebug: function() {
      return e.toggleDebug ? e.toggleDebug() : null;
    },
    isDebugEnabled: function() {
      return e.isDebugEnabled ? e.isDebugEnabled() : !1;
    },
    getDebugState: function() {
      return e.getDebugState ? e.getDebugState() : null;
    },
    // Sprint 7: Observabilidade Avançada
    ModuleEvents: au,
    getModuleEventHistory: function() {
      return Oo();
    },
    getModuleTimeline: function(r) {
      return ji(r);
    },
    onModuleEvent: function(r, n) {
      return So(r, n);
    },
    // OpenTelemetry
    OpenTelemetry: bf,
    exportOtelSpans: function() {
      return No();
    },
    exportOtelMetrics: function() {
      return Mo();
    },
    // Análise de Causa Raiz
    getErrorHistory: function() {
      return Promise.resolve().then(() => fl).then(function(r) {
        return r.getErrorHistory();
      });
    },
    analyzeErrorPatterns: function() {
      return Promise.resolve().then(() => fl).then(function(r) {
        return r.analyzeErrorPatterns();
      });
    },
    // Sprint 8: Resiliência Avançada
    NetworkDetector: mu,
    getNetworkInfo: function() {
      return He();
    },
    getNetworkQuality: function() {
      return Qi();
    },
    calculateAdjustedTimeout: function(r) {
      return Bn(r);
    },
    isOnline: function() {
      return Xi();
    },
    isNetworkPoor: function() {
      return Qr();
    },
    ManifestIntegrity: Iu,
    validateManifestIntegrity: function() {
      var r = e.getManifest ? e.getManifest() : null;
      return Xr(r);
    },
    wasManifestTampered: function() {
      var r = e.getManifest ? e.getManifest() : null;
      return ia(r);
    },
    PhaseRollback: Hf,
    registerRollback: function(r, n, i) {
      return Zo(r, n, i);
    },
    rollbackPhase: function(r, n) {
      return la(r, n);
    },
    rollbackToPhase: function(r, n) {
      return Xo(r, n);
    },
    getRollbackHistory: function() {
      return es();
    },
    // Sprint 9: Performance
    LazyLoader: Bu,
    registerLazyModule: function(r, n, i) {
      return (void 0)(r, n, i);
    },
    lazyLoad: function(r) {
      return (void 0)(r);
    },
    preloadAll: function(r, n) {
      return (void 0)(r, n);
    },
    getLazyStats: function() {
      return (void 0)();
    },
    BootCancellation: ju,
    cancelBoot: function(r) {
      return pa(r);
    },
    canCancelBoot: function() {
      return wr();
    },
    isBootCancelled: function() {
      return Fn();
    },
    onBootCancel: function(r) {
      return Ea(r);
    },
    PartialReinit: Qu,
    reinitPhase: function(r, n) {
      return Yn(r, n);
    },
    reinitPhases: function(r, n) {
      return jn(r, n);
    },
    // @ts-expect-error TS migration - TS2554
    reinitFrom: function(r, n) {
      return cs(r, n);
    },
    supportsReinit: function(r) {
      return Vn(r);
    },
    // Sprint 5: Módulos diretos
    BootPersistence: e.BootPersistence || null,
    DebugMode: e.DebugMode || null,
    // Meta
    VERSION: e.VERSION || t.VERSION || "3.4.0-SPRINT7",
    MODULE_ID: e.MODULE_ID || "bootstrap-v2",
    LOADER_VERSION: rr,
    // Feature flags
    ENTERPRISE: !0,
    ROBUST: !0,
    OBSERVABILITY: !0,
    QUALITY: !0,
    PERSISTENCE: !0,
    OBSERVABILITY_ADVANCED: !0,
    RESILIENCE_ADVANCED: !0,
    PERFORMANCE: !0,
    // Configs
    BOOT_LOOP_CONFIG: e.BOOT_LOOP_CONFIG || null,
    GLOBAL_TIMEOUT_CONFIG: e.GLOBAL_TIMEOUT_CONFIG || null,
    PERIODIC_HEALTH_CONFIG: e.PERIODIC_HEALTH_CONFIG || null,
    // Debug
    _module: t,
    _instance: e,
    _preBootOrchestrator: _i(),
    _circuitBreakerRegistry: tt,
    _degradationNotifier: we
  };
}
function Dh() {
  return te("info", "Stage 0+: Bootstrap Platform starting"), va(), Promise.resolve().then(() => TE).then(function(e) {
    const t = sr && window.BOOTSTRAP_CONFIG || { debug: !1, telemetry: { enabled: !0 } }, r = e.getInstance ? e.getInstance(t) : e.createBootstrapV2(t);
    lf(r), r.getManifest && na(r.getManifest());
    const n = wh(r, e);
    return rh("BootstrapV2", n), te("info", "BootstrapV2 exposed globally (Complete Stack)", {
      version: n.VERSION,
      loaderVersion: rr,
      sprints: "1-9",
      totalImprovements: 26
    }), r.boot();
  });
}
function ki(e) {
  if (!sr) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get(e);
    if (t) return t;
  }
  return window[e] || null;
}
function ul() {
  if (!sr) return null;
  var e = ki("EventBus");
  if (e) return e;
  var t = ki("DShowDash");
  return t && t.eventBus ? t.eventBus : null;
}
function Ch(e) {
  te("info", "Post-Boot: Loading UI Feedback, Features Toolbar, Integration & Panel Loading Transition"), e.success && Po(
    e.totalTime,
    e.success,
    e.health ? e.health.status : "UNKNOWN",
    e.health ? e.health.score : 0
  );
  var t = import("/components/_shared/permissions/ui-feedback.js").then(function(o) {
    o.default && o.default.init({ debug: !1 });
  }).catch(function(o) {
    te("info", "UIFeedback failed (non-critical)", { error: o.message });
  }), r = import("/components/main/ui/container-main/utils/features-toolbar/index.js").then(function(o) {
    var l = 0, a = 20;
    function s() {
      var u = ki("ContainerMain"), c = document.getElementById("container-main");
      if (u && c) {
        o.init(c, ul()), te("info", "Features Toolbar initialized", { version: o.VERSION }), import("/components/main/ui/container-main/utils/toolbar-wiring.js").then(function(d) {
          d.wireToolbar(o).then(function(f) {
            te("info", "Toolbar wiring complete", {
              wired: f.wired ? f.wired.length : 0,
              failed: f.failed ? f.failed.length : 0,
              buttons: f.wired || []
            }), o.updateButtonStates && setTimeout(function() {
              o.updateButtonStates();
            }, z.UI_DELAY_SHORT);
          }).catch(function(f) {
            te("info", "Toolbar wiring failed (non-critical)", { error: f.message });
          });
        }).catch(function(d) {
          te("info", "Toolbar wiring module not found (non-critical)", { error: d.message });
        });
        return;
      }
      l++, l < a ? setTimeout(s, z.UI_DELAY_MEDIUM) : te("info", "Features Toolbar skipped (container not found after timeout)");
    }
    setTimeout(s, z.UI_DELAY_LONG);
  }).catch(function(o) {
    te("info", "Features Toolbar failed (non-critical)", { error: o.message });
  }), n = import("/components/main/ui/container-main/utils/features-integration/index.js").then(function(o) {
    var l = 0, a = 30;
    function s() {
      var u = ki("ContainerMain");
      if (u && document.getElementById("container-main")) {
        var c = o.init();
        c.ok && te("info", "Features Integration initialized", { version: o.VERSION });
        return;
      }
      l++, l < a ? setTimeout(s, z.UI_DELAY_RETRY) : te("info", "Features Integration skipped (ContainerMain not found after timeout)");
    }
    setTimeout(s, z.UI_DELAY_INIT);
  }).catch(function(o) {
    te("info", "Features Integration failed (non-critical)", { error: o.message });
  }), i = Promise.resolve().then(() => NE).then(function(o) {
    var l = ul();
    if (l) {
      var a = o.init(l);
      a.ok ? te("info", "Panel Loading Transition initialized", { version: o.VERSION }) : te("info", "Panel Loading Transition skipped", { reason: a.reason });
    } else
      te("info", "Panel Loading Transition skipped (no EventBus)");
  }).catch(function(o) {
    te("info", "Panel Loading Transition failed (non-critical)", { error: o.message });
  });
  return Promise.all([t, r, n, i]).then(function() {
    return e;
  });
}
function Lh() {
  const e = performance.now();
  return Lo("full-boot-sequence"), te("info", "Full Boot Sequence starting (Complete Stack)", { version: rr }), th().then(function(t) {
    return Fn() ? { success: !1, cancelled: !0, reason: Gn().reason } : Dh();
  }).then(function(t) {
    if (cf(t), _o(), t.cancelled)
      return te("info", "Boot was cancelled", t), t;
    if (t.bootLoopDetected)
      return te("error", "Boot blocked by loop detection", t), uo(Ot.BOOT_LOOP_DETECTED, t), t;
    if (!t.success)
      throw te("error", "Boot failed", { errors: t.errors || t.error }), new Error(t.error || "Boot failed");
    const r = Math.round(performance.now() - e);
    return te("info", "Full Boot Sequence complete (Complete Stack)", {
      totalTime: r,
      phases: t.phases ? t.phases.length : 0,
      health: t.health,
      sprints: "1-9",
      improvements: 26
    }), Ch(t);
  }).then(function(t) {
    const r = Math.round(performance.now() - e);
    return uo(Ot.BOOTSTRAP_V2_COMPLETE, {
      result: t,
      elapsed: r,
      preBootResult: zi(),
      complete: {
        sprints: 9,
        improvements: 26,
        version: rr
      }
    }), t;
  });
}
var co = !1, fn = null;
function gc() {
  return co && fn ? (te("info", "Bootstrap already started, returning existing promise"), fn) : (co = !0, te("info", "Bootstrap starting via explicit startBootstrap() call", { version: rr }), fn = Gd(Lh).catch(function(e) {
    throw te("error", "BootGuard intercepted critical failure", { error: e.message }), uo(Ot.BOOTSTRAP_V2_ERROR, { error: e.message }), we && Ra("Critical: " + e.message), e;
  }), fn);
}
function _h() {
  return co;
}
function Nh() {
  return fn;
}
(function() {
  if (!(typeof window > "u")) {
    if (window.__BOOTSTRAP_MANUAL_MODE__ === !0) {
      te("info", "Bootstrap in MANUAL MODE — call startBootstrap() to begin");
      return;
    }
    var e = window.__BOOTSTRAP_AUTO_START__;
    if (e === !1) {
      te("info", "Bootstrap auto-start DISABLED — call startBootstrap() to begin");
      return;
    }
    te("info", "Bootstrap auto-starting (backward compat mode)"), gc();
  }
})();
const ev = {
  // Existing APIs (backward compat)
  MODULE_ID: Or,
  VERSION: rr,
  getPreBootResult: zi,
  getBootResult: zl,
  getBootstrapInstance: yo,
  getPreBootOrchestrator: _i,
  getKernel: Wf,
  info: $f,
  healthCheck: Kf,
  // New APIs (v7.0.0)
  startBootstrap: gc,
  isBootStarted: _h,
  getBootPromise: Nh
};
var k = {
  INITIALIZING: "INITIALIZING",
  NORMAL: "NORMAL",
  DEGRADED: "DEGRADED",
  MAINTENANCE: "MAINTENANCE",
  RECOVERY: "RECOVERY",
  FAILED: "FAILED"
}, Mh = {
  COLD: "cold",
  INITIALIZING: "initializing",
  LOADING_CRITICAL: "loading-critical",
  LOADING_CORE: "loading-core",
  AUTHENTICATING: "authenticating",
  LOADING_SHELL: "loading-shell",
  LOADING_MAIN: "loading-main",
  LOADING_UI: "loading-ui",
  LOADING_PLATFORM: "loading-platform",
  READY: "ready",
  ERROR: "error",
  RECOVERING: "recovering"
}, Ph = {
  cold: k.INITIALIZING,
  initializing: k.INITIALIZING,
  "loading-critical": k.INITIALIZING,
  "loading-core": k.INITIALIZING,
  authenticating: k.INITIALIZING,
  "loading-shell": k.INITIALIZING,
  "loading-main": k.INITIALIZING,
  "loading-ui": k.INITIALIZING,
  "loading-platform": k.INITIALIZING,
  ready: k.NORMAL,
  error: k.FAILED,
  recovering: k.RECOVERY
};
function Rt(e, t) {
  t === void 0 && (t = !1);
  var r = Ph[e];
  return r ? r === k.NORMAL && t ? k.DEGRADED : r : k.INITIALIZING;
}
var Q = {
  AUTH: "AUTH",
  NAVIGATION: "NAVIGATION",
  TELEMETRY: "TELEMETRY",
  UI_COMPONENTS: "UI_COMPONENTS",
  SHELL: "SHELL",
  MAIN_CONTENT: "MAIN_CONTENT",
  PLATFORM_HOOKS: "PLATFORM_HOOKS",
  TOAST: "TOAST",
  TICKER: "TICKER",
  PERMISSIONS: "PERMISSIONS"
}, cl = {
  INITIALIZING: {
    AUTH: !1,
    NAVIGATION: !1,
    TELEMETRY: !1,
    UI_COMPONENTS: !1,
    SHELL: !1,
    MAIN_CONTENT: !1,
    PLATFORM_HOOKS: !1,
    TOAST: !1,
    TICKER: !1,
    PERMISSIONS: !1
  },
  NORMAL: {
    AUTH: !0,
    NAVIGATION: !0,
    TELEMETRY: !0,
    UI_COMPONENTS: !0,
    SHELL: !0,
    MAIN_CONTENT: !0,
    PLATFORM_HOOKS: !0,
    TOAST: !0,
    TICKER: !0,
    PERMISSIONS: !0
  },
  DEGRADED: {
    AUTH: !0,
    NAVIGATION: !0,
    TELEMETRY: !0,
    UI_COMPONENTS: !0,
    SHELL: !0,
    MAIN_CONTENT: !0,
    PLATFORM_HOOKS: !1,
    TOAST: !0,
    TICKER: !1,
    PERMISSIONS: !0
  },
  MAINTENANCE: {
    AUTH: !0,
    NAVIGATION: !1,
    TELEMETRY: !0,
    UI_COMPONENTS: !1,
    SHELL: !0,
    MAIN_CONTENT: !1,
    PLATFORM_HOOKS: !1,
    TOAST: !0,
    TICKER: !1,
    PERMISSIONS: !1
  },
  RECOVERY: {
    AUTH: !0,
    NAVIGATION: !1,
    TELEMETRY: !0,
    UI_COMPONENTS: !1,
    SHELL: !0,
    MAIN_CONTENT: !1,
    PLATFORM_HOOKS: !1,
    TOAST: !0,
    TICKER: !1,
    PERMISSIONS: !1
  },
  FAILED: {
    AUTH: !1,
    NAVIGATION: !1,
    TELEMETRY: !0,
    UI_COMPONENTS: !1,
    SHELL: !1,
    MAIN_CONTENT: !1,
    PLATFORM_HOOKS: !1,
    TOAST: !0,
    TICKER: !1,
    PERMISSIONS: !1
  }
}, Oe = {
  // Lifecycle
  INITIALIZED: "kernel:initialized",
  READY: "kernel:ready",
  SHUTDOWN: "kernel:shutdown",
  // Modo
  MODE_CHANGE: "kernel:mode-change",
  MODE_DEGRADED: "kernel:mode-degraded",
  MODE_RECOVERY: "kernel:mode-recovery",
  MODE_NORMAL: "kernel:mode-normal",
  // Capacidades
  CAPABILITY_ENABLED: "kernel:capability-enabled",
  CAPABILITY_DISABLED: "kernel:capability-disabled",
  CAPABILITY_CHANGE: "kernel:capability-change",
  // Saúde
  HEALTH_UPDATE: "kernel:health-update",
  HEALTH_DEGRADED: "kernel:health-degraded",
  HEALTH_RECOVERED: "kernel:health-recovered",
  // Estado
  STATE_CHANGE: "kernel:state-change",
  CONTEXT_UPDATE: "kernel:context-update",
  // #3: Circuit Breaker
  CIRCUIT_BREAKER_CHANGE: "kernel:circuit-breaker-change",
  // #10: Sincronização
  SYNC_STATE: "kernel:sync-state"
}, kh = {
  INITIALIZING: ["NORMAL", "DEGRADED", "FAILED"],
  NORMAL: ["DEGRADED", "MAINTENANCE", "RECOVERY", "FAILED"],
  DEGRADED: ["NORMAL", "RECOVERY", "MAINTENANCE", "FAILED"],
  MAINTENANCE: ["NORMAL", "DEGRADED", "RECOVERY"],
  RECOVERY: ["NORMAL", "DEGRADED", "FAILED"],
  FAILED: ["RECOVERY", "INITIALIZING"]
};
function mc(e, t) {
  var r = kh[e];
  return r && r.indexOf(t) !== -1;
}
function Xa(e) {
  return Object.assign({}, cl[e] || cl.FAILED);
}
var eo = "capability-manager", dl = "1.1.0-HEALTH-CONTRACT";
function qe(e) {
  e === void 0 && (e = {});
  var t = e.initialMode || "INITIALIZING", r = Xa(t), n = {}, i = [], o = [], l = e.eventBus || null;
  function a(D, U, G) {
    e.logger && e.logger[D] && e.logger[D]("[" + eo + "] " + U, G);
  }
  function s(D, U) {
    if (l && l.emit)
      try {
        l.emit(D, Object.assign({ timestamp: Date.now() }, U));
      } catch {
      }
    for (var G = 0; G < i.length; G++)
      try {
        i[G]({ event: D, data: U, timestamp: Date.now() });
      } catch {
      }
  }
  function u(D, U, G, j) {
    var $e = {
      action: D,
      capability: U,
      value: G,
      reason: j || null,
      mode: t,
      timestamp: Date.now()
    };
    o.push($e), o.length > 100 && o.shift();
  }
  function c(D) {
    return Q.hasOwnProperty(D);
  }
  function d(D) {
    return c(D) ? n.hasOwnProperty(D) ? n[D] : r[D] || !1 : (a("warn", "Unknown capability: " + D), !1);
  }
  function f(D) {
    return d(D);
  }
  function g(D, U) {
    if (!c(D))
      return a("warn", "Cannot enable unknown capability: " + D), { success: !1, error: "UNKNOWN_CAPABILITY" };
    var G = d(D);
    return n[D] = !0, G || (u("enable", D, !0, U), a("info", "Capability enabled: " + D, { reason: U }), s(Oe.CAPABILITY_ENABLED, { capability: D, reason: U }), s(Oe.CAPABILITY_CHANGE, { capability: D, enabled: !0, reason: U })), { success: !0, capability: D, enabled: !0 };
  }
  function h(D, U) {
    if (!c(D))
      return a("warn", "Cannot disable unknown capability: " + D), { success: !1, error: "UNKNOWN_CAPABILITY" };
    var G = d(D);
    return n[D] = !1, G && (u("disable", D, !1, U), a("info", "Capability disabled: " + D, { reason: U }), s(Oe.CAPABILITY_DISABLED, { capability: D, reason: U }), s(Oe.CAPABILITY_CHANGE, { capability: D, enabled: !1, reason: U })), { success: !0, capability: D, enabled: !1 };
  }
  function p(D, U) {
    return d(D) ? h(D, U) : g(D, U);
  }
  function A(D) {
    return n.hasOwnProperty(D) ? (delete n[D], u("clear-override", D, r[D], "reset to mode default"), a("info", "Capability override cleared: " + D), { success: !0, capability: D, value: r[D] }) : { success: !1, error: "NO_OVERRIDE" };
  }
  function T() {
    var D = Object.keys(n).length;
    return n = {}, u("clear-all-overrides", "*", null, "reset all to mode defaults"), a("info", "All capability overrides cleared", { count: D }), { success: !0, clearedCount: D };
  }
  function S(D) {
    var U = t;
    return t = D, r = Xa(D), u("mode-change", "*", D, "mode updated from " + U), a("info", "Capability mode updated", { from: U, to: D }), { success: !0, mode: D, capabilities: L() };
  }
  function L() {
    for (var D = {}, U = Object.keys(Q), G = 0; G < U.length; G++) {
      var j = U[G];
      D[j] = {
        enabled: d(j),
        default: r[j] || !1,
        overridden: n.hasOwnProperty(j)
      };
    }
    return D;
  }
  function H() {
    for (var D = [], U = Object.keys(Q), G = 0; G < U.length; G++)
      d(U[G]) && D.push(U[G]);
    return D;
  }
  function E() {
    for (var D = [], U = Object.keys(Q), G = 0; G < U.length; G++)
      d(U[G]) || D.push(U[G]);
    return D;
  }
  function m() {
    return o.slice();
  }
  function v(D) {
    return typeof D == "function" ? (i.push(D), function() {
      var G = i.indexOf(D);
      G !== -1 && i.splice(G, 1);
    }) : function() {
    };
  }
  function w() {
    return d(Q.NAVIGATION);
  }
  function y() {
    return d(Q.AUTH);
  }
  function R() {
    return d(Q.UI_COMPONENTS);
  }
  function O() {
    return d(Q.SHELL);
  }
  function b() {
    return d(Q.MAIN_CONTENT);
  }
  function P() {
    return d(Q.TELEMETRY);
  }
  function C() {
    t = "INITIALIZING", r = Xa(t), n = {}, i = [], o = [];
  }
  function $() {
    return {
      moduleId: eo,
      version: dl,
      mode: t,
      totalCapabilities: Object.keys(Q).length,
      enabledCount: H().length,
      disabledCount: E().length,
      overrideCount: Object.keys(n).length,
      historyLength: o.length,
      listeners: i.length
    };
  }
  function Y() {
    return ue({
      status: B.HEALTHY,
      moduleId: eo,
      version: dl,
      checks: {
        managerActive: !0,
        modeSet: !!t,
        capabilitiesLoaded: Object.keys(Q).length > 0
      },
      details: {
        mode: t,
        enabledCapabilities: H().length,
        disabledCapabilities: E().length,
        overrideCount: Object.keys(n).length
      }
    });
  }
  return {
    // Core
    isEnabled: d,
    isCapabilityEnabled: f,
    enable: g,
    disable: h,
    toggle: p,
    clearOverride: A,
    clearAllOverrides: T,
    setMode: S,
    // Queries
    isValidCapability: c,
    getAll: L,
    getEnabled: H,
    getDisabled: E,
    getHistory: m,
    // Convenience
    canNavigate: w,
    canAuthenticate: y,
    canShowUI: R,
    canShowShell: O,
    canShowMainContent: b,
    canUseTelemetry: P,
    // Lifecycle
    subscribe: v,
    reset: C,
    info: $,
    healthCheck: Y,
    // Constants
    CAPABILITIES: Q
  };
}
var Wt = {
  passed: 0,
  failed: 0,
  tests: []
};
function Te(e, t) {
  try {
    t(), Wt.passed++, Wt.tests.push({ name: e, status: "PASSED" }), console.log("✅ " + e);
  } catch (r) {
    Wt.failed++, Wt.tests.push({ name: e, status: "FAILED", error: r.message }), console.error("❌ " + e + ": " + r.message);
  }
}
function mt(e, t, r) {
  if (e !== t)
    throw new Error((r || "Assertion failed") + ": expected " + t + ", got " + e);
}
function ht(e, t) {
  if (!e)
    throw new Error(t || "Expected true but got false");
}
function Hh(e, t) {
  if (e)
    throw new Error(t);
}
function he(e, t) {
  if (e == null)
    throw new Error(t || "Expected value to be defined");
}
function Bh(e, t, r) {
  if (e.indexOf(t) === -1)
    throw new Error(r + ": " + t);
}
function Uh() {
  console.log(`
=== KERNEL CONSTANTS TESTS ===
`), Te("KERNEL_MODES should have all required modes", function() {
    he(k.INITIALIZING, "INITIALIZING mode"), he(k.NORMAL, "NORMAL mode"), he(k.DEGRADED, "DEGRADED mode"), he(k.RECOVERY, "RECOVERY mode"), he(k.FAILED, "FAILED mode");
  }), Te("KERNEL_EVENTS should have all required events", function() {
    he(Oe.MODE_CHANGE, "MODE_CHANGE event"), he(Oe.READY, "READY event"), he(Oe.CAPABILITY_CHANGE, "CAPABILITY_CHANGE event"), he(Oe.HEALTH_UPDATE, "HEALTH_UPDATE event");
  }), Te("CAPABILITIES should have all required capabilities", function() {
    he(Q.FULL_UI, "FULL_UI capability"), he(Q.AUTH, "AUTH capability"), he(Q.NAVIGATION, "NAVIGATION capability"), he(Q.TELEMETRY, "TELEMETRY capability");
  }), Te("mapStateToMode should map boot states to kernel modes", function() {
    mt(Rt("cold"), k.INITIALIZING, "cold → INITIALIZING"), mt(Rt("initializing"), k.INITIALIZING, "initializing → INITIALIZING"), mt(Rt("ready"), k.NORMAL, "ready → NORMAL"), mt(Rt("error"), k.FAILED, "error → FAILED"), mt(Rt("recovering"), k.RECOVERY, "recovering → RECOVERY");
  }), Te("mapStateToMode should return DEGRADED when isDegraded flag is true", function() {
    mt(Rt("ready", !0), k.DEGRADED, "ready + degraded → DEGRADED");
  }), Te("mapStateToMode should return INITIALIZING for unknown states", function() {
    mt(Rt("unknown-state"), k.INITIALIZING, "unknown → INITIALIZING");
  });
}
function xh() {
  console.log(`
=== CAPABILITY MANAGER TESTS ===
`), Te("createCapabilityManager should create manager with default capabilities", function() {
    var e = qe();
    he(e, "manager should be defined"), he(e.enable, "enable method"), he(e.disable, "disable method"), he(e.isEnabled, "isEnabled method");
  }), Te("manager should start with all capabilities enabled by default", function() {
    var e = qe();
    ht(e.isEnabled(Q.FULL_UI), "FULL_UI should be enabled"), ht(e.isEnabled(Q.AUTH), "AUTH should be enabled"), ht(e.isEnabled(Q.NAVIGATION), "NAVIGATION should be enabled");
  }), Te("manager should be able to disable capabilities", function() {
    var e = qe();
    e.disable(Q.TELEMETRY), Hh(e.isEnabled(Q.TELEMETRY), "TELEMETRY should be disabled");
  }), Te("manager should be able to re-enable capabilities", function() {
    var e = qe();
    e.disable(Q.TELEMETRY), e.enable(Q.TELEMETRY), ht(e.isEnabled(Q.TELEMETRY), "TELEMETRY should be re-enabled");
  }), Te("manager should return list of enabled capabilities", function() {
    var e = qe(), t = e.getEnabled();
    ht(Array.isArray(t), "getEnabled should return array"), ht(t.length > 0, "should have enabled capabilities");
  }), Te("manager should return list of disabled capabilities", function() {
    var e = qe();
    e.disable(Q.TELEMETRY);
    var t = e.getDisabled();
    ht(Array.isArray(t), "getDisabled should return array"), Bh(t, Q.TELEMETRY, "TELEMETRY should be in disabled list");
  }), Te("manager should apply mode presets correctly", function() {
    var e = qe();
    e.applyModePreset(k.DEGRADED);
    var t = e.getDisabled();
    ht(
      t.length > 0 || e.getEnabled().length < Object.keys(Q).length,
      "DEGRADED mode should affect capabilities"
    );
  }), Te("manager should apply FAILED mode preset (disable all)", function() {
    var e = qe();
    e.applyModePreset(k.FAILED);
    var t = e.getEnabled();
    mt(t.length, 0, "FAILED mode should disable all capabilities");
  }), Te("manager reset should restore all capabilities", function() {
    var e = qe();
    e.disable(Q.AUTH), e.disable(Q.NAVIGATION), e.reset(), ht(e.isEnabled(Q.AUTH), "AUTH should be restored"), ht(e.isEnabled(Q.NAVIGATION), "NAVIGATION should be restored");
  }), Te("manager info should return complete status", function() {
    var e = qe(), t = e.info();
    he(t.enabledCount, "enabledCount"), he(t.disabledCount, "disabledCount"), he(t.enabled, "enabled array"), he(t.disabled, "disabled array");
  }), Te("manager healthCheck should return valid status", function() {
    var e = qe(), t = e.healthCheck();
    he(t.status, "status"), he(t.enabledCount, "enabledCount"), mt(t.status, "HEALTHY", "should be HEALTHY with all enabled");
  }), Te("manager healthCheck should return DEGRADED when capabilities disabled", function() {
    var e = qe();
    e.disable(Q.FULL_UI);
    var t = e.healthCheck();
    mt(t.status, "DEGRADED", "should be DEGRADED with disabled capabilities");
  });
}
function Fh() {
  return console.log("╔════════════════════════════════════════════════════════════╗"), console.log("║           KERNEL UNIT TESTS - Sprint 4 #19                 ║"), console.log("╚════════════════════════════════════════════════════════════╝"), Wt = { passed: 0, failed: 0, tests: [] }, Uh(), xh(), console.log(`
════════════════════════════════════════════════════════════`), console.log("RESULTS: " + Wt.passed + " passed, " + Wt.failed + " failed"), console.log(`════════════════════════════════════════════════════════════
`), Wt;
}
const Gh = "1.0.0-P4-ENTERPRISE", zh = "bootstrap-v2.kernel.__tests__.test-runner";
let Ze = null;
function pc() {
  return console.log(`
🧪 Starting Kernel Tests...
`), Ze = Fh(), typeof window < "u" && (window.__KERNEL_TEST_RESULTS__ = Ze), Ze;
}
function Ec() {
  return Ze;
}
function vc() {
  return Ze ? {
    status: Ze.failed === 0 ? "ALL_PASSED" : "SOME_FAILED",
    passed: Ze.passed,
    failed: Ze.failed,
    total: Ze.passed + Ze.failed,
    passRate: Math.round(Ze.passed / (Ze.passed + Ze.failed) * 100) + "%"
  } : { status: "NOT_RUN", message: "Tests have not been executed yet" };
}
var Vh = { run: pc, getResults: Ec, getSummary: vc };
const Yh = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: zh,
  VERSION: Gh,
  default: Vh,
  getResults: Ec,
  getSummary: vc,
  run: pc
}, Symbol.toStringTag, { value: "Module" })), jh = "1.3.0-ROUTER-FIX", Wh = "1.3.0", Z = {
  version: jh,
  manifestVersion: Wh,
  // Configurações globais
  global: {
    defaultTimeout: z.DEFAULT_PHASE,
    defaultModuleTimeout: z.DEFAULT_MODULE,
    defaultRetry: { enabled: !0, maxAttempts: 2, delay: 1e3, backoff: 1.5 },
    telemetryEnabled: !0,
    loggingEnabled: !0,
    strictMode: !1
  },
  // Definição declarativa das fases
  phases: [
    {
      id: "phase-0-critical",
      name: "Critical Infrastructure",
      description: "EventBus, Logger, Config, ErrorBoundary, SecurityCSRF, Environment",
      order: 0,
      dependsOn: [],
      critical: !0,
      recoverable: !1,
      parallel: !1,
      timeout: z.PHASE_CRITICAL,
      retry: { enabled: !1, maxAttempts: 1 },
      onFail: {
        mode: ie.HALT,
        message: "Critical infrastructure failed - boot cannot continue",
        disable: ["*"],
        allow: []
      },
      modules: [
        { id: "eventbus", critical: !0, timeout: z.MODULE_EVENTBUS },
        { id: "logger", critical: !0, timeout: z.MODULE_LOGGER },
        { id: "error-boundary", critical: !0, timeout: z.MODULE_ERROR_BOUNDARY },
        { id: "config", critical: !0, timeout: z.MODULE_CONFIG },
        { id: "security-csrf", critical: !1, timeout: z.MODULE_SECURITY },
        { id: "environment", critical: !1, timeout: z.MODULE_ENVIRONMENT }
      ],
      healthWeight: 30
    },
    {
      id: "phase-1-core",
      name: "Core Services",
      description: "GlobalState, ReadyFlags, TelemetryCore, ContextProvider",
      order: 1,
      dependsOn: ["phase-0-critical"],
      critical: !0,
      recoverable: !0,
      parallel: !1,
      timeout: z.PHASE_CORE,
      retry: { enabled: !0, maxAttempts: 2, delay: 1e3 },
      onFail: {
        mode: ie.DEGRADED,
        message: "Core services degraded - limited functionality",
        disable: ["platform"],
        allow: ["shell", "auth", "main", "ui"]
      },
      modules: [
        { id: "global-state", critical: !0, timeout: z.MODULE_GLOBAL_STATE },
        { id: "ready-flags", critical: !1, timeout: z.MODULE_READY_FLAGS },
        { id: "telemetry-core", critical: !1, timeout: z.MODULE_TELEMETRY },
        { id: "context-provider", critical: !1, timeout: z.MODULE_CONTEXT_PROVIDER || z.DEFAULT_MODULE }
      ],
      healthWeight: 25
    },
    {
      id: "phase-2-auth",
      name: "Authentication",
      description: "SessionManager, AuthOrchestrator, LoginModal",
      order: 2,
      dependsOn: ["phase-1-core"],
      critical: !0,
      recoverable: !0,
      parallel: !1,
      timeout: z.PHASE_AUTH,
      retry: { enabled: !0, maxAttempts: 2, delay: 1500 },
      onFail: {
        mode: ie.ALLOW_LOGIN_ONLY,
        message: "Auth failed - login only mode",
        disable: ["shell", "main", "ui", "platform"],
        allow: ["login-modal"]
      },
      modules: [
        { id: "session-manager", critical: !0, timeout: z.MODULE_SESSION },
        { id: "auth-orchestrator", critical: !0, timeout: z.MODULE_AUTH },
        { id: "login-modal", critical: !1, timeout: z.MODULE_LOGIN }
      ],
      healthWeight: 20
    },
    {
      id: "phase-3-shell",
      name: "Shell & Navigation",
      description: "AppShell, Header, NavRail, Footer, Router integration",
      order: 3,
      dependsOn: ["phase-2-auth"],
      critical: !0,
      recoverable: !0,
      parallel: !1,
      timeout: z.PHASE_SHELL,
      retry: { enabled: !0, maxAttempts: 2, delay: 1e3 },
      onFail: {
        mode: ie.ALLOW_SHELL_ONLY,
        message: "Shell degraded - basic navigation only",
        disable: ["main", "ui", "platform"],
        allow: ["header", "footer", "login"]
      },
      suppressWhenUnauth: !0,
      modules: [
        { id: "app-shell", critical: !0, timeout: z.MODULE_APP_SHELL },
        { id: "router-global", critical: !0, timeout: z.MODULE_ROUTER, suppressWhenUnauth: !0 },
        { id: "header", critical: !1, timeout: z.MODULE_HEADER },
        { id: "nav-rail", critical: !1, timeout: z.MODULE_NAV },
        { id: "footer", critical: !1, timeout: z.MODULE_FOOTER }
      ],
      healthWeight: 10
    },
    {
      id: "phase-4-main",
      name: "Main Content",
      description: "Main Engine, ContainerMain, Panel system",
      order: 4,
      dependsOn: ["phase-3-shell"],
      critical: !0,
      recoverable: !0,
      parallel: !1,
      timeout: z.PHASE_MAIN,
      retry: { enabled: !0, maxAttempts: 2, delay: 1e3 },
      onFail: {
        mode: ie.DEGRADED,
        message: "Main content degraded - panels may not load",
        disable: ["platform"],
        allow: ["shell", "ui"]
      },
      requiresAuth: !0,
      deferWhenUnauth: !0,
      modules: [
        { id: "main-engine", critical: !0, timeout: z.MODULE_MAIN_ENGINE },
        { id: "container-main", critical: !1, timeout: z.MODULE_CONTAINER }
      ],
      healthWeight: 8
    },
    {
      id: "phase-5-ui",
      name: "UI Components",
      description: "UIOrchestrator, Toast, Ticker, Preloader fade",
      order: 5,
      dependsOn: ["phase-4-main"],
      critical: !1,
      recoverable: !0,
      parallel: !0,
      timeout: z.PHASE_UI,
      retry: { enabled: !0, maxAttempts: 1, delay: 500 },
      onFail: {
        mode: ie.SKIP,
        message: "UI components skipped - core functionality intact",
        disable: [],
        allow: ["*"]
      },
      modules: [
        { id: "ui-orchestrator", critical: !0, timeout: z.MODULE_UI_ORCHESTRATOR },
        { id: "ticker", critical: !1, timeout: z.MODULE_TICKER },
        { id: "toast", critical: !1, timeout: z.MODULE_TOAST },
        { id: "preloader-fade", critical: !1, timeout: z.MODULE_PRELOADER }
      ],
      healthWeight: 4
    },
    {
      id: "phase-6-platform",
      name: "Platform Hooks",
      description: "Platform-specific integrations and finalizations",
      order: 6,
      dependsOn: ["phase-5-ui"],
      critical: !1,
      recoverable: !0,
      parallel: !0,
      timeout: z.PHASE_PLATFORM,
      retry: { enabled: !1, maxAttempts: 1 },
      onFail: {
        mode: ie.SKIP,
        message: "Platform hooks skipped - non-essential",
        disable: [],
        allow: ["*"]
      },
      modules: [
        { id: "platform-init", critical: !1, timeout: z.MODULE_PLATFORM }
      ],
      healthWeight: 3
    }
  ]
};
var Ss = !0;
function $h(e) {
  Ss = e;
}
function wa() {
  return Ss;
}
function Cr(e) {
  for (let t = 0; t < Z.phases.length; t++)
    if (Z.phases[t].id === e)
      return Z.phases[t];
  return null;
}
function Os() {
  return Z.phases.slice().sort((e, t) => e.order - t.order).map((e) => e.id);
}
function yc() {
  return Z.phases.filter((e) => e.critical);
}
function Kh() {
  return Z.phases.filter((e) => !e.critical);
}
function qh(e) {
  const t = Cr(e);
  return t ? t.dependsOn.slice() : [];
}
function Ac(e, t) {
  if (!Ss)
    return {
      adjusted: e,
      original: e,
      multiplier: 1,
      networkQuality: "unknown",
      dynamic: !1
    };
  try {
    var r = {
      minMultiplier: t ? 0.8 : 0.5,
      // Fases críticas não reduzem muito
      maxMultiplier: t ? 2 : 3,
      // Fases críticas não estendem muito
      minTimeout: t ? 3e3 : 1e3,
      maxTimeout: t ? 6e4 : 12e4
    }, n = Bn(e, r);
    return {
      adjusted: n.adjusted,
      original: n.original,
      multiplier: n.multiplier,
      networkQuality: n.networkQuality,
      dynamic: !0
    };
  } catch (i) {
    return {
      adjusted: e,
      original: e,
      multiplier: 1,
      networkQuality: "error",
      dynamic: !1,
      error: i.message
    };
  }
}
function fo(e, t) {
  t === void 0 && (t = {});
  const r = Cr(e);
  if (!r) return null;
  const n = Z.global, i = r.timeout || n.defaultTimeout;
  var o = Ac(i, r.critical), l = t.ignoreDynamicTimeout ? i : o.adjusted;
  return {
    id: r.id,
    name: r.name,
    order: r.order,
    critical: r.critical,
    recoverable: r.recoverable,
    parallel: r.parallel,
    timeout: l,
    baseTimeout: i,
    timeoutInfo: o,
    // Sprint 7A #2: Info completo do timeout
    retry: { ...n.defaultRetry, ...r.retry || {} },
    onFail: r.onFail,
    suppressWhenUnauth: r.suppressWhenUnauth || !1,
    requiresAuth: r.requiresAuth || !1,
    deferWhenUnauth: r.deferWhenUnauth || !1,
    modules: r.modules || [],
    healthWeight: r.healthWeight || 0,
    circuitBreaker: r.circuitBreaker
  };
}
function Sc() {
  for (var e = {}, t = Z.phases, r = 0; r < t.length; r++) {
    var n = t[r], i = n.timeout || Z.global.defaultTimeout, o = Ac(i, n.critical);
    e[n.id] = {
      base: i,
      adjusted: o.adjusted,
      multiplier: o.multiplier,
      critical: n.critical
    };
  }
  return e._networkQuality = He().quality, e._timestamp = Date.now(), e;
}
function Da() {
  let e = 0;
  for (let t = 0; t < Z.phases.length; t++)
    e += Z.phases[t].healthWeight || 0;
  return e;
}
function Jh() {
  return Z.phases.length;
}
function Zh() {
  return { ...Z.global };
}
const Qh = "dependency-graph", Xh = "1.2.1-CONTRACTS";
function Oc() {
  let e = {}, t = {}, r = null;
  function n(E, m) {
    return m === void 0 && (m = {}), e[E] ? !1 : (e[E] = Object.assign({ id: E, status: "pending" }, m), t[E] = [], !0);
  }
  function i(E, m) {
    e[E] || n(E), e[m] || n(m), t[E].indexOf(m) === -1 && t[E].push(m);
  }
  function o(E) {
    return t[E] ? t[E].slice() : [];
  }
  function l(E) {
    const m = [];
    for (const v in t)
      t.hasOwnProperty(v) && t[v].indexOf(E) !== -1 && m.push(v);
    return m;
  }
  function a() {
    const E = {}, m = {};
    let v = [], w = !1;
    function y(R, O) {
      if (w) return !0;
      E[R] = !0, m[R] = !0, O.push(R);
      const b = t[R] || [];
      for (let P = 0; P < b.length; P++) {
        const C = b[P];
        if (E[C]) {
          if (m[C]) {
            const $ = O.indexOf(C);
            return v = O.slice($), v.push(C), w = !0, !0;
          }
        } else if (y(C, O)) return !0;
      }
      return O.pop(), m[R] = !1, !1;
    }
    for (const R in e)
      if (e.hasOwnProperty(R) && !E[R] && y(R, []))
        return r = {
          hasCycle: !0,
          cyclePath: v,
          cycleString: v.join(" → "),
          detectedAt: Date.now()
        }, r;
    return r = {
      hasCycle: !1,
      cyclePath: [],
      cycleString: null,
      detectedAt: Date.now()
    }, r;
  }
  function s() {
    return a().hasCycle;
  }
  function u() {
    return r || a(), r;
  }
  function c() {
    const E = a();
    if (E.hasCycle)
      throw new Error("Dependency graph has cycle: " + E.cycleString);
    const m = {}, v = [];
    function w(y) {
      if (m[y]) return;
      m[y] = !0;
      const R = t[y] || [];
      for (let O = 0; O < R.length; O++)
        w(R[O]);
      v.push(y);
    }
    for (const y in e)
      e.hasOwnProperty(y) && w(y);
    return v;
  }
  function d() {
    return c();
  }
  function f(E) {
    const m = o(E);
    for (let v = 0; v < m.length; v++) {
      const w = e[m[v]];
      if (!w || w.status !== "completed") return !1;
    }
    return !0;
  }
  function g(E, m) {
    return e[E] ? (e[E].status = m, !0) : !1;
  }
  function h(E) {
    return e[E] ? e[E].status : void 0;
  }
  function p(E) {
    return e[E];
  }
  function A() {
    const E = [];
    for (const m in e)
      e.hasOwnProperty(m) && E.push(e[m]);
    return E;
  }
  function T() {
    return A().filter(function(E) {
      return E.status === "pending" && f(E.id);
    });
  }
  function S() {
    const E = a(), m = [], v = [];
    E.hasCycle && m.push({
      type: "CIRCULAR_DEPENDENCY",
      message: "Circular dependency detected: " + E.cycleString,
      cyclePath: E.cyclePath
    });
    const w = Object.keys(e).length;
    if (w > 0) {
      for (const y in e)
        if (e.hasOwnProperty(y)) {
          const R = o(y);
          for (let O = 0; O < R.length; O++)
            e[R[O]] || m.push({
              type: "MISSING_DEPENDENCY",
              message: 'Node "' + y + '" depends on non-existent node "' + R[O] + '"',
              node: y,
              missingDep: R[O]
            });
        }
    }
    return {
      valid: m.length === 0,
      errors: m,
      warnings: v,
      nodeCount: w,
      edgeCount: Object.keys(t).reduce(function(y, R) {
        return y + t[R].length;
      }, 0),
      hasCycle: E.hasCycle,
      cycleInfo: E.hasCycle ? E : null
    };
  }
  function L() {
    e = {}, t = {}, r = null;
  }
  function H() {
    let E = 0;
    for (const w in t)
      t.hasOwnProperty(w) && (E += t[w].length);
    const m = Object.keys(e).length, v = u();
    return {
      moduleId: Qh,
      version: Xh,
      nodeCount: m,
      edgeCount: E,
      hasCycle: v.hasCycle,
      cycleInfo: v.hasCycle ? v : null,
      executionOrder: v.hasCycle ? [] : d(),
      improvements: ["#23-CircularDependencyValidation"]
    };
  }
  return {
    addNode: n,
    addEdge: i,
    getDependencies: o,
    getDependents: l,
    hasCycle: s,
    detectCycle: a,
    getCycleInfo: u,
    validate: S,
    topologicalSort: c,
    getExecutionOrder: d,
    canExecute: f,
    setStatus: g,
    getStatus: h,
    getNode: p,
    getAllNodes: A,
    getReadyNodes: T,
    clear: L,
    info: H
  };
}
function Ic() {
  const e = Oc();
  for (let t = 0; t < Z.phases.length; t++) {
    const r = Z.phases[t];
    e.addNode(r.id, {
      name: r.name,
      critical: r.critical,
      order: r.order
    });
  }
  for (let t = 0; t < Z.phases.length; t++) {
    const r = Z.phases[t];
    if (r.dependsOn && r.dependsOn.length > 0)
      for (let n = 0; n < r.dependsOn.length; n++)
        e.addEdge(r.dependsOn[n], r.id);
  }
  return e.validate();
}
function Xn() {
  const e = [], t = [], r = {};
  for (let i = 0; i < Z.phases.length; i++) {
    const o = Z.phases[i];
    if (!o.id) {
      e.push("Phase at index " + i + " missing id");
      continue;
    }
    if (r[o.id] && e.push("Duplicate phase id: " + o.id), r[o.id] = !0, typeof o.order != "number" && e.push("Phase " + o.id + " missing order"), o.dependsOn && o.dependsOn.length > 0)
      for (let l = 0; l < o.dependsOn.length; l++) {
        const a = o.dependsOn[l], s = Cr(a);
        s ? s.order >= o.order && e.push("Phase " + o.id + " depends on " + a + " but has lower or equal order") : e.push("Phase " + o.id + " depends on unknown phase: " + a);
      }
  }
  const n = Ic();
  if (n.hasCycle && e.push("Circular dependency detected: " + n.cycleInfo.cycleString), n.errors)
    for (let i = 0; i < n.errors.length; i++) {
      const o = n.errors[i];
      o.type !== "CIRCULAR_DEPENDENCY" && e.push(o.message);
    }
  return {
    valid: e.length === 0,
    errors: e,
    warnings: t,
    phaseCount: Z.phases.length,
    criticalCount: yc().length,
    circularDependencyCheck: {
      performed: !0,
      hasCycle: n.hasCycle,
      cycleInfo: n.cycleInfo
    }
  };
}
var Tr = Object.freeze({
  "phase-0-critical": {
    order: 0,
    creates: [
      "EventBus",
      "Logger",
      "ErrorBoundary",
      "Config",
      "SecurityCSRF",
      "Environment"
    ],
    requires: [],
    optional: []
  },
  "phase-1-core": {
    order: 1,
    creates: [
      "GlobalState",
      "ReadyFlags",
      "AssetLoader",
      "Telemetry",
      "TelemetryCore",
      "ContextProvider"
    ],
    requires: [
      "EventBus",
      "Logger"
    ],
    optional: []
  },
  "phase-2-auth": {
    order: 2,
    creates: [
      "AppContext",
      "SessionManager",
      "PermissionsGuard",
      "AuthAdapter"
    ],
    requires: [
      "EventBus",
      "Logger",
      "GlobalState"
    ],
    optional: [
      "ReadyFlags",
      "Config"
    ]
  },
  "phase-3-shell": {
    order: 3,
    creates: [
      "LayoutManager",
      "AppShell",
      "Header",
      "Sidebar",
      "NavRail",
      "Footer",
      "RouterGlobal"
    ],
    requires: [
      "EventBus",
      "Logger"
    ],
    optional: [
      "SessionManager",
      "GlobalState",
      "ReadyFlags"
    ]
  },
  "phase-4-main": {
    order: 4,
    creates: [
      "ContainerMain",
      "CMBootstrap",
      "ApplicationKernel"
    ],
    requires: [
      "EventBus",
      "Logger"
    ],
    optional: [
      "AppShell",
      "SessionManager",
      "GlobalState",
      "ContextProvider",
      "ReadyFlags"
    ]
  },
  "phase-5-ui": {
    order: 5,
    creates: [
      "OverlayLayer",
      "UIOrchestrator",
      "Toast"
    ],
    requires: [
      "EventBus"
    ],
    optional: [
      "AppShell",
      "ApplicationKernel",
      "PermissionsGuard",
      "HealthAggregator",
      "ContextProvider",
      "RuntimeContext"
    ]
  },
  "phase-6-platform": {
    order: 6,
    creates: [
      "Platform"
    ],
    requires: [
      "EventBus"
    ],
    optional: [
      "ContainerMain",
      "AppShell",
      "ReadyFlags"
    ]
  }
});
function eg(e) {
  return Tr[e] || null;
}
function tg(e) {
  for (var t = Object.keys(Tr), r = 0; r < t.length; r++) {
    var n = Tr[t[r]];
    if (n.creates.indexOf(e) !== -1)
      return t[r];
  }
  return null;
}
function rg(e) {
  for (var t = [], r = Object.keys(Tr), n = 0; n < r.length; n++) {
    var i = Tr[r[n]];
    i.requires.indexOf(e) !== -1 ? t.push({ phaseId: r[n], type: "required" }) : i.optional.indexOf(e) !== -1 && t.push({ phaseId: r[n], type: "optional" });
  }
  return t;
}
function Tc(e, t) {
  var r = Tr[e];
  if (!r)
    return { satisfied: !0, missingRequired: [], missingOptional: [] };
  for (var n = [], i = [], o = 0; o < r.requires.length; o++) {
    var l = r.requires[o];
    t(l) || n.push(l);
  }
  for (var a = 0; a < r.optional.length; a++) {
    var s = r.optional[a];
    t(s) || i.push(s);
  }
  return {
    satisfied: n.length === 0,
    missingRequired: n,
    missingOptional: i
  };
}
var Ca = "1.5.0-HEALTH-CONTRACT", La = "boot-manifest";
function bc() {
  var e = Xn(), t = null;
  try {
    t = He();
  } catch (r) {
    t = { quality: "error", error: r.message };
  }
  return {
    moduleId: La,
    version: Ca,
    manifestVersion: "1.4.0",
    phaseCount: e.phaseCount,
    criticalPhases: e.criticalCount,
    totalHealthWeight: Da(),
    phaseOrder: Os(),
    valid: e.valid,
    errors: e.errors,
    circularDependencyCheck: e.circularDependencyCheck,
    // Sprint 7A #2
    dynamicTimeoutEnabled: wa(),
    networkQuality: t.quality,
    quickWinsApplied: ["QW14-CentralizedTimeouts"],
    improvements: ["#2-DynamicTimeouts", "#23-CircularDependencyValidation", "Modularization", "ACTION3-PhaseGlobalsContract"]
  };
}
function Rc() {
  var e = Xn(), t = null;
  try {
    t = He();
  } catch {
    t = { quality: "unknown" };
  }
  var r = B.HEALTHY;
  return e.valid || (r = B.UNHEALTHY), ue({
    status: r,
    moduleId: La,
    version: Ca,
    checks: {
      manifestValid: e.valid,
      noCycles: !e.circularDependencyCheck.hasCycle,
      networkOnline: t.online !== !1
    },
    details: {
      valid: e.valid,
      errors: e.errors,
      hasCycle: e.circularDependencyCheck.hasCycle,
      dynamicTimeoutEnabled: wa(),
      networkQuality: t.quality,
      networkOnline: t.online
    }
  });
}
var ng = {
  VERSION: Ca,
  MODULE_ID: La,
  TIMEOUTS: void 0,
  // Re-exported
  DEGRADATION_MODES: void 0,
  // Re-exported
  BOOT_HEALTH: void 0,
  // Re-exported
  BOOT_MANIFEST: void 0,
  // Re-exported
  getPhaseById: void 0,
  // Re-exported
  getPhaseOrder: void 0,
  // Re-exported
  getCriticalPhases: void 0,
  // Re-exported
  getNonCriticalPhases: void 0,
  // Re-exported
  getPhaseDependencies: void 0,
  // Re-exported
  getPhaseConfig: void 0,
  // Re-exported
  getTimeout: void 0,
  // Re-exported
  getAllTimeouts: void 0,
  // Re-exported
  validateManifest: void 0,
  // Re-exported
  validateCircularDependencies: void 0,
  // Re-exported
  getTotalHealthWeight: void 0,
  // Re-exported
  // Sprint 7A #2
  setDynamicTimeoutEnabled: void 0,
  isDynamicTimeoutEnabled: void 0,
  getAllAdjustedTimeouts: void 0,
  // v1.4.0-ACTION3: Phase Globals Contract
  PHASE_GLOBALS_CONTRACT: void 0,
  getPhaseContract: void 0,
  getGlobalCreator: void 0,
  getGlobalConsumers: void 0,
  validateGlobalsAvailable: void 0,
  info: bc,
  healthCheck: Rc
};
const ig = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BOOT_HEALTH: N,
  BOOT_MANIFEST: Z,
  DEGRADATION_MODES: ie,
  MODULE_ID: La,
  PHASE_GLOBALS_CONTRACT: Tr,
  TIMEOUTS: z,
  VERSION: Ca,
  default: ng,
  getAllAdjustedTimeouts: Sc,
  getAllTimeouts: ff,
  getCriticalPhases: yc,
  getGlobalConfig: Zh,
  getGlobalConsumers: rg,
  getGlobalCreator: tg,
  getNonCriticalPhases: Kh,
  getPhaseById: Cr,
  getPhaseConfig: fo,
  getPhaseContract: eg,
  getPhaseCount: Jh,
  getPhaseDependencies: qh,
  getPhaseOrder: Os,
  getTimeout: df,
  getTotalHealthWeight: Da,
  healthCheck: Rc,
  info: bc,
  isDynamicTimeoutEnabled: wa,
  setDynamicTimeoutEnabled: $h,
  validateCircularDependencies: Ic,
  validateGlobalsAvailable: Tc,
  validateManifest: Xn
}, Symbol.toStringTag, { value: "Module" }));
var _a = "boot-errors", Na = "2.1.0-HEALTH-CONTRACT", Qe = {
  NETWORK: "NetworkError",
  TIMEOUT: "TimeoutError",
  AUTH: "AuthError",
  MODULE_LOAD: "ModuleLoadError",
  DEPENDENCY: "DependencyError",
  VALIDATION: "ValidationError",
  BOOT_LOOP: "BootLoopError",
  CIRCUIT_BREAKER: "CircuitBreakerError",
  UNKNOWN: "UnknownError"
}, bn = {
  NetworkError: { retry: !0, maxRetries: 3, backoff: !0, fallback: "offline-mode" },
  TimeoutError: { retry: !0, maxRetries: 2, backoff: !0, fallback: "skip" },
  AuthError: { retry: !1, fallback: "login-redirect" },
  ModuleLoadError: { retry: !0, maxRetries: 2, backoff: !1, fallback: "degraded" },
  DependencyError: { retry: !1, fallback: "abort" },
  ValidationError: { retry: !1, fallback: "abort" },
  BootLoopError: { retry: !1, fallback: "safe-mode" },
  CircuitBreakerError: { retry: !1, fallback: "degraded" },
  UnknownError: { retry: !0, maxRetries: 1, backoff: !1, fallback: "degraded" }
}, xe = [], ag = 50;
function Ma(e) {
  var t = (e.message || "").toLowerCase(), r = e.name || "";
  return t.indexOf("boot loop") !== -1 || t.indexOf("loop detected") !== -1 ? Qe.BOOT_LOOP : t.indexOf("circuit") !== -1 || t.indexOf("breaker") !== -1 || t.indexOf("open") !== -1 && t.indexOf("circuit") !== -1 ? Qe.CIRCUIT_BREAKER : t.indexOf("network") !== -1 || t.indexOf("fetch") !== -1 || t.indexOf("connection") !== -1 || t.indexOf("offline") !== -1 || r === "NetworkError" || r === "TypeError" && t.indexOf("failed to fetch") !== -1 ? Qe.NETWORK : t.indexOf("timeout") !== -1 || t.indexOf("timed out") !== -1 || t.indexOf("aborted") !== -1 || r === "AbortError" || r === "TimeoutError" ? Qe.TIMEOUT : t.indexOf("auth") !== -1 || t.indexOf("unauthorized") !== -1 || t.indexOf("forbidden") !== -1 || t.indexOf("401") !== -1 || t.indexOf("403") !== -1 || t.indexOf("session") !== -1 || t.indexOf("token") !== -1 ? Qe.AUTH : t.indexOf("module") !== -1 || t.indexOf("import") !== -1 || t.indexOf("load") !== -1 || t.indexOf("script") !== -1 || r === "SyntaxError" ? Qe.MODULE_LOAD : t.indexOf("dependency") !== -1 || t.indexOf("not met") !== -1 || t.indexOf("required") !== -1 ? Qe.DEPENDENCY : t.indexOf("validation") !== -1 || t.indexOf("invalid") !== -1 || t.indexOf("manifest") !== -1 ? Qe.VALIDATION : Qe.UNKNOWN;
}
function Is(e) {
  return bn[e] || bn[Qe.UNKNOWN];
}
function Ts(e) {
  for (var t = [], r = e, n = 10, i = 0; r && i < n; )
    t.push({
      level: i,
      name: r.name || "Error",
      message: r.message || "Unknown error",
      type: Ma(r),
      stack: r.stack ? r.stack.split(`
`).slice(0, 5).join(`
`) : null
    }), r = r.cause || r.originalError || r.innerError || null, i++;
  return {
    rootCause: t.length > 0 ? t[t.length - 1] : null,
    chain: t,
    depth: t.length,
    summary: t.map(function(o) {
      return o.type + ": " + o.message;
    }).join(" → ")
  };
}
function wc(e, t, r) {
  var n = Ma(e), i = Is(n), o = Ts(e), l = {
    id: "err-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 7),
    type: n,
    originalError: e,
    message: e.message || "Unknown error",
    stack: e.stack || null,
    phase: t || null,
    context: r || {},
    strategy: i,
    timestamp: Date.now(),
    recoverable: i.retry || i.fallback !== "abort",
    // #28: Informações de causa raiz
    rootCause: o.rootCause,
    errorChain: o.chain,
    chainDepth: o.depth,
    chainSummary: o.summary
  };
  return og(l), l;
}
function og(e) {
  for (xe.unshift({
    id: e.id,
    type: e.type,
    phase: e.phase,
    message: e.message,
    rootCause: e.rootCause ? e.rootCause.message : null,
    chainSummary: e.chainSummary,
    timestamp: e.timestamp
  }); xe.length > ag; )
    xe.pop();
}
function Dc() {
  return xe.slice();
}
function Cc(e) {
  return xe.filter(function(t) {
    return t.type === e;
  });
}
function Lc(e) {
  return xe.filter(function(t) {
    return t.phase === e;
  });
}
function Pa() {
  if (xe.length === 0)
    return {
      totalErrors: 0,
      byType: {},
      byPhase: {},
      mostCommon: null,
      recentTrend: "NONE"
    };
  var e = {}, t = {};
  xe.forEach(function(s) {
    e[s.type] = (e[s.type] || 0) + 1, s.phase && (t[s.phase] = (t[s.phase] || 0) + 1);
  });
  var r = null, n = 0;
  for (var i in e)
    e[i] > n && (n = e[i], r = i);
  var o = "STABLE";
  if (xe.length >= 10) {
    var l = xe.slice(0, 5).length, a = xe.slice(5, 10).length;
    l > a * 1.5 ? o = "INCREASING" : l < a * 0.5 && (o = "DECREASING");
  }
  return {
    totalErrors: xe.length,
    byType: e,
    byPhase: t,
    mostCommon: r ? { type: r, count: n } : null,
    recentTrend: o,
    lastError: xe[0] || null
  };
}
function _c() {
  return xe = [], !0;
}
function Nc(e, t) {
  var r = e.strategy;
  return !(!r.retry || t >= (r.maxRetries || 1));
}
function Mc(e) {
  return e.strategy.fallback || "degraded";
}
function Pc() {
  var e = Pa();
  return {
    moduleId: _a,
    version: Na,
    errorTypes: Object.keys(Qe),
    strategies: Object.keys(bn),
    errorHistory: xe.length,
    analysis: e,
    improvements: ["QW18-TypedErrors", "#28-RootCauseAnalysis"]
  };
}
function kc() {
  var e = Pa(), t = B.HEALTHY;
  return e.totalErrors >= 5 ? t = B.UNHEALTHY : e.totalErrors > 0 && (t = B.DEGRADED), ue({
    status: t,
    moduleId: _a,
    version: Na,
    details: {
      totalErrors: e.totalErrors,
      mostCommonError: e.mostCommon,
      recentTrend: e.recentTrend
    }
  });
}
var sg = {
  ERROR_TYPES: Qe,
  RECOVERY_STRATEGIES: bn,
  classifyError: Ma,
  getRecoveryStrategy: Is,
  createTypedError: wc,
  extractRootCause: Ts,
  shouldRetry: Nc,
  getFallbackAction: Mc,
  getErrorHistory: Dc,
  getErrorsByType: Cc,
  getErrorsByPhase: Lc,
  analyzeErrorPatterns: Pa,
  clearErrorHistory: _c,
  info: Pc,
  healthCheck: kc,
  MODULE_ID: _a,
  VERSION: Na
};
const fl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  ERROR_TYPES: Qe,
  MODULE_ID: _a,
  RECOVERY_STRATEGIES: bn,
  VERSION: Na,
  analyzeErrorPatterns: Pa,
  classifyError: Ma,
  clearErrorHistory: _c,
  createTypedError: wc,
  default: sg,
  extractRootCause: Ts,
  getErrorHistory: Dc,
  getErrorsByPhase: Lc,
  getErrorsByType: Cc,
  getFallbackAction: Mc,
  getRecoveryStrategy: Is,
  healthCheck: kc,
  info: Pc,
  shouldRetry: Nc
}, Symbol.toStringTag, { value: "Module" }));
let hl = !1, gl = !1;
function lg() {
  if (gl)
    return { redirected: hl, alreadyChecked: !0 };
  if (gl = !0, typeof window > "u" || !window.location)
    return { redirected: !1, reason: "no-window" };
  const e = window.location.hostname;
  if (e === "localhost" || e === "127.0.0.1" || e.indexOf("192.168.") === 0)
    return { redirected: !1, reason: "localhost-allowed" };
  if (window.location.protocol !== "https:") {
    hl = !0;
    const t = "https://" + window.location.host + window.location.pathname + window.location.search + window.location.hash;
    return window.location.replace(t), { redirected: !0, newUrl: t };
  }
  return { redirected: !1, reason: "already-https" };
}
var En = {
  // Boot Features
  PERIODIC_HEALTH_CHECK: { enabled: !1, description: "Habilita health check periódico pós-boot" },
  MEMORY_METRICS: { enabled: !0, description: "Coleta métricas de memória durante o boot" },
  BROWSER_CHECK: { enabled: !0, description: "Verifica compatibilidade do browser antes do boot" },
  TYPED_ERRORS: { enabled: !0, description: "Usa sistema de erros tipados" },
  PROGRESS_EVENTS: { enabled: !0, description: "Emite eventos de progresso durante o boot" },
  // Debug Features
  VERBOSE_LOGGING: { enabled: !1, description: "Logs detalhados de todas as operações" },
  TELEMETRY_DEBUG: { enabled: !1, description: "Logs de telemetria no console" },
  // Experimental Features
  PARALLEL_PHASES: { enabled: !1, description: "Executa fases não-dependentes em paralelo" },
  LAZY_MODULE_LOAD: { enabled: !1, description: "Carrega módulos sob demanda" },
  PRE_WARM_CACHE: { enabled: !1, description: "Pré-aquece cache de módulos críticos" }
}, Tt = {
  debug: !1,
  timeouts: { phase: 3e4, module: 1e4, critical: 5e3 },
  retry: { enabled: !0, maxAttempts: 2, delay: 1e3 },
  phases: {
    critical: !0,
    core: !0,
    auth: !0,
    shell: !0,
    main: !0,
    ui: !0,
    platform: !0
  },
  telemetry: { enabled: !0, namespace: "bootstrap-v2" },
  logging: { enabled: !0, level: "info" },
  manifest: {
    strictValidation: !1,
    allowOverrides: !0
  },
  // QW#19: Feature flags no config
  features: Object.keys(En).reduce(function(e, t) {
    return e[t] = En[t].enabled, e;
  }, {})
}, Ar = JSON.parse(JSON.stringify(Tt));
function ug(e) {
  return e === void 0 && (e = {}), Ar = {
    debug: e.debug !== void 0 ? e.debug : Tt.debug,
    timeouts: Object.assign({}, Tt.timeouts, e.timeouts || {}),
    retry: Object.assign({}, Tt.retry, e.retry || {}),
    phases: Object.assign({}, Tt.phases, e.phases || {}),
    telemetry: Object.assign({}, Tt.telemetry, e.telemetry || {}),
    logging: Object.assign({}, Tt.logging, e.logging || {}),
    manifest: Object.assign({}, Tt.manifest, e.manifest || {}),
    features: Object.assign({}, Tt.features, e.features || {})
  }, Ar;
}
function cg(e) {
  return Ar.features[e] === !0;
}
function dg() {
  var e = {};
  for (var t in En)
    En.hasOwnProperty(t) && (e[t] = {
      enabled: Ar.features[t],
      description: En[t].description
    });
  return e;
}
function Hc() {
  var e = [];
  for (var t in Ar.features)
    Ar.features.hasOwnProperty(t) && Ar.features[t] && e.push(t);
  return e;
}
const Rn = "application-kernel", bs = "1.2.0-MODULAR", fg = "__APPLICATION_KERNEL__";
function hg(e) {
  return function(r, n, i) {
    e && e[r] ? e[r]("[" + Rn + "] " + n, i) : typeof console < "u" && console[r] && console[r]("[" + Rn + "] " + n, i || "");
  };
}
function gg(e) {
  const t = e.eventBus, r = e.listeners, n = e.getMode, i = e.log;
  return function(l, a) {
    const s = Object.assign({ timestamp: Date.now(), mode: n() }, a);
    if (t && t.emit)
      try {
        t.emit(l, s);
      } catch (u) {
        i("warn", "EventBus emit failed", { event: l, error: u.message });
      }
    for (let u = 0; u < r.length; u++)
      try {
        r[u]({ event: l, data: s });
      } catch {
      }
  };
}
function mg(e) {
  e === void 0 && (e = 50);
  let t = [];
  return {
    record: function(r, n, i) {
      const o = {
        from: r,
        to: n,
        reason: i || null,
        timestamp: Date.now()
      };
      t.push(o), t.length > e && t.shift();
    },
    getHistory: function() {
      return t.slice();
    },
    getLength: function() {
      return t.length;
    },
    reset: function() {
      t = [];
    }
  };
}
function pg(e) {
  const t = e.log, r = e.cleanups, n = e.onEvent;
  if (!tt || !Mi)
    return t("warn", "CircuitBreaker module not available"), { enabled: !1 };
  const i = Mi(function(o) {
    n(o);
  });
  return typeof i == "function" && r.push(i), t("info", "Circuit Breaker integration enabled"), { enabled: !0 };
}
function Eg(e) {
  var t = e.log, r = e.emit, n = e.getMode, i = e.setModeInternal, o = e.checkIfDegraded, l = e.degradationThreshold || 1;
  function a(c) {
    if (!(!c || !c.event)) {
      var d = c.event, f = c.data || {};
      t("debug", "Circuit Breaker event", { type: d, moduleId: f.moduleId }), r(Oe.CIRCUIT_BREAKER_CHANGE, {
        breakerEvent: d,
        moduleId: f.moduleId,
        state: f.to || f.state,
        failures: f.failures
      }), d === vt.OPENED ? s() : d === vt.CLOSED && u();
    }
  }
  function s() {
    var c = lt();
    c >= l && n() === k.NORMAL && (t("warn", "Circuit Breakers degraded, switching to DEGRADED mode", { openCount: c }), i(k.DEGRADED, "Circuit Breakers OPEN: " + c, !1));
  }
  function u() {
    var c = lt(), d = o();
    c === 0 && n() === k.DEGRADED && !d && (t("info", "All Circuit Breakers recovered, switching to NORMAL mode"), i(k.NORMAL, "All Circuit Breakers recovered", !1));
  }
  return {
    handleEvent: a,
    checkHealth: s,
    checkRecovery: u
  };
}
function vg(e) {
  const t = e.isEnabled;
  return {
    getStatus: function() {
      return tt ? {
        enabled: t(),
        health: Dr(),
        info: gs()
      } : { enabled: !1 };
    },
    getBreaker: function(r, n) {
      return tt ? Wn(r, n) : null;
    },
    getOpenBreakers: function() {
      return tt ? Ia() : [];
    },
    getOpenCount: function() {
      return tt ? lt() : 0;
    }
  };
}
function yg(e) {
  const t = e.stateMachine, r = e.log, n = e.cleanups, i = e.onTransition, o = e.setLastSyncedState;
  if (!t || !t.on)
    return r("warn", "StateMachine does not support listeners, sync disabled"), { enabled: !1, initialState: null };
  const l = t.on("transition", function(s) {
    i(s);
  });
  typeof l == "function" && n.push(l);
  const a = t.getState ? t.getState() : null;
  return o(a), r("info", "StateMachine sync enabled", { initialState: a }), { enabled: !0, initialState: a };
}
function Ag(e) {
  var t = e.getMode, r = e.setModeInternal, n = e.checkIfDegraded, i = e.emit, o = e.setLastSyncedState;
  function l(a) {
    if (!(!a || !a.to)) {
      var s = a.to, u = n(), c = Rt(s, u);
      o(s);
      var d = t();
      if (c !== d && mc(d, c)) {
        var f = "StateMachine sync: " + a.from + " → " + a.to;
        r(c, f, !0), i(Oe.SYNC_STATE, {
          bootState: s,
          kernelMode: c,
          record: a
        });
      }
    }
  }
  return {
    handleTransition: l
  };
}
function Sg(e) {
  var t = e.stateMachine, r = e.getMode, n = e.setMode, i = e.checkIfDegraded;
  return {
    sync: function() {
      if (!t)
        return { success: !1, error: "NO_STATE_MACHINE" };
      var o = t.getState ? t.getState() : null;
      if (!o)
        return { success: !1, error: "CANNOT_GET_STATE" };
      var l = i(), a = Rt(o, l), s = r();
      if (a !== s) {
        var u = n(a, "Manual sync with StateMachine");
        return { success: u.success, from: s, to: a, bootState: o };
      }
      return { success: !0, noChange: !0, mode: s, bootState: o };
    }
  };
}
function Og(e) {
  const t = e.log, r = e.emit, n = e.modeHistoryManager, i = e.capabilityManager, o = e.getModeRef, l = e.setModeRef, a = e.setLastModeChange;
  function s() {
    return o();
  }
  function u(d, f, g) {
    const h = o();
    return l(d), a(Date.now()), n.record(h, d, f), i.setMode(d), t("info", "Mode changed", { from: h, to: d, reason: f, fromSync: !!g }), r(Oe.MODE_CHANGE, { from: h, to: d, reason: f, fromSync: !!g }), d === k.DEGRADED ? r(Oe.MODE_DEGRADED, { from: h, reason: f }) : d === k.NORMAL ? r(Oe.MODE_NORMAL, { from: h, reason: f }) : d === k.RECOVERY && r(Oe.MODE_RECOVERY, { from: h, reason: f }), { success: !0, from: h, to: d };
  }
  function c(d, f) {
    if (!k[d])
      return t("error", "Invalid mode: " + d), { success: !1, error: "INVALID_MODE" };
    const g = o();
    return mc(g, d) ? u(d, f, !1) : (t("warn", "Invalid mode transition", { from: g, to: d }), { success: !1, error: "INVALID_TRANSITION", from: g, to: d });
  }
  return {
    getMode: s,
    setMode: c,
    setModeInternal: u
  };
}
function Ig(e) {
  const t = e.getMode, r = e.isInitialized;
  return {
    isReady: function() {
      const n = t();
      return r() && (n === k.NORMAL || n === k.DEGRADED);
    },
    isDegraded: function() {
      return t() === k.DEGRADED;
    },
    isNormal: function() {
      return t() === k.NORMAL;
    },
    isFailed: function() {
      return t() === k.FAILED;
    },
    isInRecovery: function() {
      return t() === k.RECOVERY;
    },
    isInMaintenance: function() {
      return t() === k.MAINTENANCE;
    }
  };
}
function Tg(e) {
  const t = e.getHealthAggregator, r = e.getBootContext;
  return {
    getHealth: function() {
      const n = t();
      return n && n.calculate ? n.calculate() : null;
    },
    getHealthStatus: function() {
      const n = t();
      return n && n.getStatus ? n.getStatus() : "UNKNOWN";
    },
    getHealthScore: function() {
      const n = t();
      return n && n.getScore ? n.getScore() : 0;
    },
    isHealthy: function() {
      return tt && lt && lt() > 0 ? !1 : this.getHealthStatus() === "HEALTHY";
    },
    checkIfDegraded: function() {
      if (tt && lt && lt() > 0)
        return !0;
      const n = r();
      if (n && n.getSnapshot) {
        const o = n.getSnapshot();
        if (o && o.degradationCount > 0)
          return !0;
      }
      const i = t();
      return !!(i && i.getStatus && i.getStatus() === "DEGRADED");
    }
  };
}
function bg(e) {
  var t = e.getBootContext, r = e.getMode, n = e.isInitialized, i = e.getInitTimestamp, o = e.getLastModeChange, l = e.capabilityManager, a = e.healthManager, s = e.getSyncEnabled, u = e.getLastSyncedState, c = e.getCircuitBreakerEnabled, d = e.getCircuitBreakerStatus;
  return {
    getState: function() {
      var f = t();
      return f && f.getSnapshot ? f.getSnapshot() : null;
    },
    getSnapshot: function() {
      return {
        mode: r(),
        initialized: n(),
        initTimestamp: i(),
        lastModeChange: o(),
        capabilities: l.getAll(),
        enabledCapabilities: l.getEnabled(),
        health: a.getHealth(),
        bootState: this.getState(),
        syncEnabled: s(),
        lastSyncedState: u(),
        circuitBreakerEnabled: c(),
        circuitBreakerStatus: d(),
        timestamp: Date.now()
      };
    }
  };
}
function Rg(e) {
  var t = e.listeners, r = e.cleanups;
  return {
    subscribe: function(n) {
      return typeof n == "function" ? (t.push(n), function() {
        var o = t.indexOf(n);
        o !== -1 && t.splice(o, 1);
      }) : function() {
      };
    },
    on: function(n, i) {
      var o = this, l = o.subscribe(function(a) {
        a.event === n && i(a.data);
      });
      return r.push(l), l;
    }
  };
}
function wg(e) {
  var t = e.log, r = e.emit, n = e.setDependencies, i = e.setInitTimestamp, o = e.setInitialized, l = e.isInitialized, a = e.setupStateMachineSync, s = e.setupCircuitBreakerIntegration;
  return e.getSyncEnabled, e.getCircuitBreakerEnabled, {
    initialize: function(u) {
      if (u === void 0 && (u = {}), l())
        return t("warn", "Kernel already initialized"), { success: !1, reason: "ALREADY_INITIALIZED" };
      n(u);
      var c = Date.now();
      i(c), o(!0);
      var d = a(), f = s();
      return t("info", "Kernel initialized", {
        hasBootContext: !!u.bootContext,
        hasHealthAggregator: !!u.healthAggregator,
        hasOrchestrator: !!u.orchestrator,
        hasStateMachine: !!u.stateMachine,
        hasEventBus: !!u.eventBus,
        syncEnabled: d.enabled,
        circuitBreakerEnabled: f.enabled
      }), r(Oe.INITIALIZED, {
        timestamp: c,
        circuitBreakerEnabled: f.enabled
      }), {
        success: !0,
        timestamp: c,
        syncEnabled: d.enabled,
        circuitBreakerEnabled: f.enabled
      };
    }
  };
}
function Dg(e) {
  var t = e.log, r = e.cleanups, n = e.listeners, i = e.capabilityManager, o = e.modeHistoryManager, l = e.resetState;
  return {
    cleanupAll: function() {
      for (var a = 0; a < r.length; a++)
        try {
          typeof r[a] == "function" && r[a]();
        } catch (s) {
          t("warn", "Cleanup failed", { index: a, error: s.message });
        }
      r.length = 0;
    },
    reset: function() {
      this.cleanupAll(), i.reset(), o.reset(), n.length = 0, l({
        mode: k.INITIALIZING,
        initialized: !1,
        initTimestamp: null,
        lastModeChange: null,
        syncEnabled: !1,
        lastSyncedState: null,
        circuitBreakerEnabled: !1,
        bootContext: null,
        healthAggregator: null,
        orchestrator: null,
        stateMachine: null
      }), t("info", "Kernel reset (with cleanup)");
    }
  };
}
function Cg(e) {
  const t = e.getMode, r = e.isInitialized, n = e.getInitTimestamp, i = e.getLastModeChange, o = e.modeHistoryManager, l = e.listeners, a = e.cleanups, s = e.getSyncEnabled, u = e.getLastSyncedState, c = e.getCircuitBreakerEnabled, d = e.getCircuitBreakerStatus, f = e.capabilityManager;
  e.healthManager;
  const g = e.getBootContext, h = e.getHealthAggregator, p = e.getOrchestrator, A = e.getStateMachine, T = e.getEventBus;
  return {
    info: function() {
      const S = h(), L = g(), H = d();
      return {
        moduleId: Rn,
        version: bs,
        modular: !0,
        mode: t(),
        initialized: r(),
        initTimestamp: n(),
        lastModeChange: i(),
        modeHistoryLength: o.getLength(),
        listeners: l.length,
        cleanups: a.length,
        syncEnabled: s(),
        lastSyncedState: u(),
        circuitBreakerEnabled: c(),
        circuitBreakerOpenCount: H.enabled && H.health ? H.health.open : 0,
        hasBootContext: !!L,
        hasHealthAggregator: !!S,
        hasOrchestrator: !!p(),
        hasStateMachine: !!A(),
        hasEventBus: !!T(),
        capabilities: f.info(),
        health: S && typeof S.info == "function" ? S.info() : null,
        context: L && typeof L.info == "function" ? L.info() : null,
        circuitBreaker: H,
        improvements: ["#3-CircuitBreakerIntegration", "#10-StateMachineSync", "#26-CleanupListeners", "MODULAR-ARCHITECTURE"]
      };
    }
  };
}
function Lg(e) {
  const t = e.getMode, r = e.isInitialized, n = e.healthManager, i = e.capabilityManager, o = e.getSyncEnabled, l = e.getCircuitBreakerEnabled, a = e.cleanups;
  return {
    healthCheck: function() {
      const s = t();
      let u = "HEALTHY";
      r() ? s === k.FAILED ? u = "FAILED" : s === k.DEGRADED && (u = "DEGRADED") : u = "INITIALIZING";
      const c = tt ? Dr() : null;
      return c && c.status === "CRITICAL" ? u = "CRITICAL" : c && c.status === "DEGRADED" && u === "HEALTHY" && (u = "DEGRADED"), {
        status: u,
        moduleId: Rn,
        version: bs,
        modular: !0,
        mode: s,
        initialized: r(),
        healthScore: n.getHealthScore(),
        enabledCapabilities: i.getEnabled().length,
        syncEnabled: o(),
        circuitBreakerEnabled: l(),
        circuitBreakerHealth: c,
        cleanupCount: a.length,
        timestamp: Date.now()
      };
    }
  };
}
let Ut = null, nn = null;
function _g(e, t) {
  return Ut || (Ut = e(t), t && t.windowAdapter && (nn = t.windowAdapter), typeof window < "u" && (window[fg] = Ut, window.ApplicationKernel = Ut, window.Kernel = Ut), nn && nn.expose && (nn.expose("Kernel", Ut), nn.expose("ApplicationKernel", Ut))), Ut;
}
var an = "3.7.0-STRICT-MODE", hr = "runtime-context", dr = Kd(hr), Nr = Object.freeze({
  READY: "kernel.runtime-context.ready",
  UPDATED: "kernel.runtime-context.updated"
});
function Ng(e) {
  if (!e)
    throw new Error("[RuntimeContext] Kernel instance is required");
  var t = e, r = [], n = null, i = null, o = !1, l = null, a = null, s = [], u = 10;
  function c() {
    if (i) return i;
    var M = de();
    return t.getEventBus && (i = t.getEventBus()), !i && typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get && (i = window.Core.windowAdapter.get("EventBus")), M || !i && typeof window < "u" && window.EventBus && (Sn("WINDOW_EVENTBUS_FALLBACK", { module: hr, method: "_getEventBus" }), i = window.EventBus), i;
  }
  function d(M) {
    if (typeof window > "u") return null;
    var K = de();
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var W = window.Core.windowAdapter.get(M);
      if (W) return W;
    }
    return K ? null : window[M] ? (Sn("WINDOW_" + M.toUpperCase() + "_FALLBACK", { module: hr, method: "_resolveAuthProvider" }), window[M]) : null;
  }
  function f(M, K) {
    var W = c(), fe = Object.assign({
      source: hr,
      version: an,
      timestamp: Date.now()
    }, K || {});
    if (M === Nr.READY ? (l = fe, o = !0) : M === Nr.UPDATED && (a = fe, s.push({
      type: "UPDATED",
      data: fe,
      timestamp: Date.now()
    }), s.length > u && s.shift()), W && W.emit)
      try {
        W.emit(M, fe);
      } catch (Be) {
        dr.warn("EventBus emit failed: " + Be.message);
      }
  }
  function g(M) {
    if (!l || typeof M != "function")
      return !1;
    try {
      return M(l), !0;
    } catch (K) {
      return dr.error("replayReady error: " + K.message), !1;
    }
  }
  function h(M) {
    if (!a || typeof M != "function")
      return !1;
    try {
      return M(a), !0;
    } catch (K) {
      return dr.error("replayLastUpdate error: " + K.message), !1;
    }
  }
  function p(M, K) {
    K = K || { replayReady: !0, replayLastUpdate: !0 };
    var W = $e(M);
    if (K.replayReady && l)
      try {
        M(j(), { trigger: "replay-ready", replayed: !0 });
      } catch (fe) {
        dr.error("subscribeWithReplay ready error: " + fe.message);
      }
    else if (K.replayLastUpdate && a)
      try {
        M(a.snapshot, { trigger: "replay-update", replayed: !0 });
      } catch (fe) {
        dr.error("subscribeWithReplay update error: " + fe.message);
      }
    return W;
  }
  function A(M) {
    return M = M || 5, s.slice(-M);
  }
  function T() {
    return o;
  }
  function S() {
    return t.getMode ? t.getMode() : k.INITIALIZING;
  }
  function L() {
    var M = t.getSnapshot ? t.getSnapshot() : null;
    if (M && M.bootState) {
      var K = M.bootState;
      if (K.phase)
        return K.phase;
    }
    return t.isReady && t.isReady() ? "ready" : "initializing";
  }
  function H() {
    return t.isReady ? t.isReady() : !1;
  }
  function E() {
    return t.isDegraded ? t.isDegraded() : !1;
  }
  function m() {
    return t.isInMaintenance ? t.isInMaintenance() : !1;
  }
  function v() {
    return t.isFailed ? t.isFailed() : !1;
  }
  function w() {
    return t.isInRecovery ? t.isInRecovery() : !1;
  }
  function y() {
    if (typeof window < "u") {
      var M = d("SessionManager");
      if (M && M.isAuthenticated)
        return M.isAuthenticated();
      var K = d("CoreAuthAdapter");
      if (K && K.isAuthenticated)
        return K.isAuthenticated();
      var W = d("AppContext");
      if (W && W.auth)
        return !!W.auth.authenticated;
      if (document.body && document.body.dataset.authReady === "true")
        return !0;
    }
    return !1;
  }
  function R() {
    if (typeof window < "u") {
      var M = d("SessionManager");
      if (M && M.getUser) {
        var K = M.getUser();
        return K && K.level || 0;
      }
      var W = d("CoreAuthAdapter");
      if (W && W.getLevel)
        return W.getLevel();
    }
    return 0;
  }
  function O(M) {
    return t.isCapabilityEnabled ? t.isCapabilityEnabled(M) : !1;
  }
  function b() {
    return t.canNavigate ? t.canNavigate() : !1;
  }
  function P() {
    return t.canAuthenticate ? t.canAuthenticate() : !1;
  }
  function C() {
    return t.canShowUI ? t.canShowUI() : !1;
  }
  function $() {
    return t.getHealth ? t.getHealth() : { status: "UNKNOWN" };
  }
  function Y() {
    return t.getHealthScore ? t.getHealthScore() : 0;
  }
  function D() {
    return t.isHealthy ? t.isHealthy() : !1;
  }
  function U(M) {
    return M = M || {}, m() ? { allowed: !1, reason: "System in maintenance mode" } : M.requiresReady !== !1 && !H() ? { allowed: !1, reason: "System not ready (phase: " + L() + ")" } : M.requiresAuth && !y() ? { allowed: !1, reason: "Authentication required" } : M.minLevel && R() < M.minLevel ? { allowed: !1, reason: "Insufficient auth level: " + R() + " < " + M.minLevel } : v() ? { allowed: !1, reason: "System in failed state" } : { allowed: !0 };
  }
  function G() {
    var M = S();
    return M === k.MAINTENANCE ? { allowed: !1, reason: "Recovery blocked in maintenance mode" } : M === k.RECOVERY ? { allowed: !1, reason: "Already in recovery mode" } : M === k.FAILED ? { allowed: !1, reason: "System failed - manual intervention required" } : { allowed: !0 };
  }
  function j() {
    return n = {
      mode: S(),
      phase: L(),
      ready: H(),
      degraded: E(),
      maintenance: m(),
      failed: v(),
      recovery: w(),
      authenticated: y(),
      authLevel: R(),
      health: $(),
      healthScore: Y(),
      healthy: D(),
      capabilities: {
        navigate: b(),
        authenticate: P(),
        showUI: C()
      },
      timestamp: Date.now()
    }, n;
  }
  function $e(M) {
    if (typeof M != "function") return function() {
    };
    r.push(M);
    var K = null;
    return t.on && (K = t.on(Oe.MODE_CHANGE, function(W) {
      var fe = j();
      f(Nr.UPDATED, al(fe, "mode-change", {
        from: W.from,
        to: W.to,
        reason: W.reason
      }));
      for (var Be = 0; Be < r.length; Be++)
        try {
          r[Be](fe, W);
        } catch (rn) {
          dr.error("Subscriber error: " + rn.message);
        }
    })), function() {
      var fe = r.indexOf(M);
      fe >= 0 && r.splice(fe, 1), K && K();
    };
  }
  function nt(M, K) {
    var W = j();
    f(Nr.UPDATED, al(W, M || "manual", K));
    for (var fe = 0; fe < r.length; fe++)
      try {
        r[fe](W, { trigger: M });
      } catch (Be) {
        dr.error("Subscriber error: " + Be.message);
      }
  }
  function ct() {
    return {
      moduleId: hr,
      version: an,
      kernelConnected: !!t,
      eventBusConnected: !!c(),
      subscriberCount: r.length,
      lastSnapshot: n,
      hasEmittedReady: o,
      hasLastReadyEvent: !!l,
      hasLastUpdatedEvent: !!a,
      eventHistorySize: s.length,
      timestamp: Date.now()
    };
  }
  function F() {
    var M = !!t && typeof t.getMode == "function", K = !!c(), W = B.HEALTHY;
    return M || (W = B.DEGRADED), ue({
      status: W,
      moduleId: hr,
      version: an,
      checks: {
        kernelConnected: M,
        eventBusConnected: K,
        modeAccessible: M && !!S(),
        snapshotWorking: !!j(),
        replayAvailable: o
      },
      details: {
        mode: M ? S() : "N/A",
        subscriberCount: r.length,
        eventHistorySize: s.length
      }
    });
  }
  var me = Object.freeze({
    VERSION: an,
    MODULE_ID: hr,
    EVENTS: Nr,
    getMode: S,
    getPhase: L,
    isReady: H,
    isDegraded: E,
    isInMaintenance: m,
    isFailed: v,
    isInRecovery: w,
    isAuthenticated: y,
    getAuthLevel: R,
    isCapabilityEnabled: O,
    canNavigate: b,
    canAuthenticate: P,
    canShowUI: C,
    getHealth: $,
    getHealthScore: Y,
    isHealthy: D,
    canEnableFeature: U,
    canAttemptRecovery: G,
    getSnapshot: j,
    subscribe: $e,
    notifyUpdate: nt,
    // #04: Event Replay API
    subscribeWithReplay: p,
    replayReady: g,
    replayLastUpdate: h,
    getEventHistory: A,
    hasEmittedReady: T,
    info: ct,
    healthCheck: F,
    MODES: k,
    CAPABILITIES: Q
  });
  return setTimeout(function() {
    f(Nr.READY, $d(j(), an));
  }, 0), me;
}
var on = null;
function Rs(e) {
  if (!on && e && (on = Ng(e), typeof window < "u")) {
    var t = de();
    window.Core && window.Core.windowAdapter && window.Core.windowAdapter.expose && window.Core.windowAdapter.expose("RuntimeContext", on), t || (window.RuntimeContext = on);
  }
  return on;
}
function Mg(e) {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get(e);
    if (t) return t;
  }
  return window[e] || null;
}
function Pg(e) {
  e === void 0 && (e = {});
  var t = e.bootContext || null, r = e.healthAggregator || null, n = e.orchestrator || null, i = e.stateMachine || null, o = e.eventBus || null, l = e.logger || null, a = k.INITIALIZING, s = !1, u = null, c = null, d = !1, f = null, g = !1, h = [], p = [], A = hg(l), T = mg(50), S = qe({ initialMode: a, eventBus: o, logger: l }), L = function() {
    return a;
  }, H = function(F) {
    a = F;
  }, E = function(F) {
    c = F;
  }, m = gg({ eventBus: o, listeners: h, getMode: L, log: A }), v = Tg({
    getHealthAggregator: function() {
      return r;
    },
    getBootContext: function() {
      return t;
    }
  }), w = Og({
    log: A,
    emit: m,
    modeHistoryManager: T,
    capabilityManager: S,
    getModeRef: L,
    setModeRef: H,
    setLastModeChange: E
  }), y = Eg({
    log: A,
    emit: m,
    getMode: L,
    setModeInternal: w.setModeInternal,
    checkIfDegraded: v.checkIfDegraded,
    degradationThreshold: 1
  }), R = vg({ isEnabled: function() {
    return g;
  } }), O = Ag({
    getMode: L,
    setModeInternal: w.setModeInternal,
    checkIfDegraded: v.checkIfDegraded,
    emit: m,
    setLastSyncedState: function(F) {
      f = F;
    }
  }), b = Sg({
    stateMachine: i,
    getMode: L,
    setMode: w.setMode,
    checkIfDegraded: v.checkIfDegraded
  });
  function P() {
    if (!i) return { enabled: !1 };
    var F = yg({
      stateMachine: i,
      log: A,
      cleanups: p,
      onTransition: O.handleTransition,
      // @ts-expect-error strict migration — TS2322
      setLastSyncedState: function(me) {
        f = me;
      }
    });
    return d = F.enabled, F;
  }
  function C() {
    var F = pg({
      log: A,
      cleanups: p,
      onEvent: y.handleEvent
    });
    return g = F.enabled, F;
  }
  var $ = bg({
    getBootContext: function() {
      return t;
    },
    getMode: L,
    isInitialized: function() {
      return s;
    },
    getInitTimestamp: function() {
      return u;
    },
    getLastModeChange: function() {
      return c;
    },
    capabilityManager: S,
    healthManager: v,
    getSyncEnabled: function() {
      return d;
    },
    getLastSyncedState: function() {
      return f;
    },
    getCircuitBreakerEnabled: function() {
      return g;
    },
    getCircuitBreakerStatus: R.getStatus
  }), Y = Rg({ listeners: h, cleanups: p }), D = Ig({ getMode: L, isInitialized: function() {
    return s;
  } }), U = wg({
    log: A,
    emit: m,
    setDependencies: function(F) {
      t = F.bootContext || t, r = F.healthAggregator || r, n = F.orchestrator || n, i = F.stateMachine || i, o = F.eventBus || o, l = F.logger || l;
    },
    setInitTimestamp: function(F) {
      u = F;
    },
    setInitialized: function(F) {
      s = F;
    },
    isInitialized: function() {
      return s;
    },
    setupStateMachineSync: P,
    setupCircuitBreakerIntegration: C,
    getSyncEnabled: function() {
      return d;
    },
    getCircuitBreakerEnabled: function() {
      return g;
    }
  }), G = Dg({
    log: A,
    cleanups: p,
    listeners: h,
    capabilityManager: S,
    modeHistoryManager: T,
    resetState: function(F) {
      a = F.mode, s = F.initialized, u = F.initTimestamp, c = F.lastModeChange, d = F.syncEnabled, f = F.lastSyncedState, g = F.circuitBreakerEnabled, t = F.bootContext, r = F.healthAggregator, n = F.orchestrator, i = F.stateMachine;
    }
  }), j = {
    getMode: L,
    isInitialized: function() {
      return s;
    },
    getInitTimestamp: function() {
      return u;
    },
    getLastModeChange: function() {
      return c;
    },
    modeHistoryManager: T,
    listeners: h,
    cleanups: p,
    getSyncEnabled: function() {
      return d;
    },
    getLastSyncedState: function() {
      return f;
    },
    getCircuitBreakerEnabled: function() {
      return g;
    },
    getCircuitBreakerStatus: R.getStatus,
    capabilityManager: S,
    healthManager: v,
    getBootContext: function() {
      return t;
    },
    getHealthAggregator: function() {
      return r;
    },
    getOrchestrator: function() {
      return n;
    },
    getStateMachine: function() {
      return i;
    },
    getEventBus: function() {
      return o;
    }
  }, $e = Cg(j), nt = Lg(j), ct = {
    initialize: U.initialize,
    reset: G.reset,
    getMode: w.getMode,
    setMode: w.setMode,
    getModeHistory: function() {
      return T.getHistory();
    },
    syncWithStateMachine: b.sync,
    getCircuitBreakerStatus: R.getStatus,
    getCircuitBreaker: R.getBreaker,
    getOpenCircuitBreakers: R.getOpenBreakers,
    getState: $.getState,
    getSnapshot: $.getSnapshot,
    getHealth: v.getHealth,
    getHealthStatus: v.getHealthStatus,
    getHealthScore: v.getHealthScore,
    isHealthy: v.isHealthy,
    isCapabilityEnabled: function(F) {
      return S.isEnabled(F);
    },
    enableCapability: function(F, me) {
      return S.enable(F, me);
    },
    disableCapability: function(F, me) {
      return S.disable(F, me);
    },
    getCapabilities: function() {
      return S.getAll();
    },
    getEnabledCapabilities: function() {
      return S.getEnabled();
    },
    canNavigate: function() {
      return S.canNavigate();
    },
    canAuthenticate: function() {
      return S.canAuthenticate();
    },
    canShowUI: function() {
      return S.canShowUI();
    },
    canShowShell: function() {
      return S.canShowShell();
    },
    canShowMainContent: function() {
      return S.canShowMainContent();
    },
    isReady: D.isReady,
    isDegraded: D.isDegraded,
    isNormal: D.isNormal,
    isFailed: D.isFailed,
    isInRecovery: D.isInRecovery,
    isInMaintenance: D.isInMaintenance,
    subscribe: Y.subscribe,
    on: Y.on,
    getBootContext: function() {
      return t;
    },
    getHealthAggregator: function() {
      return r;
    },
    getOrchestrator: function() {
      return n;
    },
    getStateMachine: function() {
      return i;
    },
    info: $e.info,
    healthCheck: nt.healthCheck,
    MODES: k,
    EVENTS: Oe,
    CAPABILITIES: Q,
    BOOT_STATES: Mh,
    VERSION: bs,
    MODULE_ID: Rn
  };
  return ct.getRuntimeContext = function() {
    return Rs(ct);
  }, ct;
}
function kg(e) {
  var t = _g(
    Pg,
    e
  );
  return t && Rs(t), t;
}
function Hg() {
  return Rs() || Mg("RuntimeContext");
}
const ml = "boot-context", Bg = "1.1.0-MODULAR", Ie = {
  PENDING: "pending",
  INITIALIZING: "initializing",
  READY: "ready",
  DEGRADED: "degraded",
  FAILED: "failed"
}, hn = {
  START: "boot:progress:start",
  PHASE_START: "boot:progress:phase:start",
  PHASE_COMPLETE: "boot:progress:phase:complete",
  COMPLETE: "boot:progress:complete"
};
function Ug() {
  const e = {
    status: Ie.PENDING,
    phases: {},
    auth: { authenticated: !1, user: null, checked: !1 },
    permissions: { mode: "unknown", ready: !1 },
    navigation: { ready: !1, currentRoute: null },
    ui: { ready: !1, preloaderDismissed: !1 },
    metrics: {
      startTime: null,
      endTime: null,
      totalTime: 0,
      phaseTimings: {},
      recoveries: 0,
      failures: 0
    },
    degradations: [],
    errors: [],
    warnings: [],
    health: N.HEALTHY,
    healthScore: 0,
    progress: {
      currentPhase: null,
      currentPhaseIndex: 0,
      totalPhases: Z.phases.length,
      percentage: 0
    }
  };
  return {
    getStatus: function() {
      return e.status;
    },
    getPhases: function() {
      return e.phases;
    },
    getPhase: function(t) {
      return e.phases[t];
    },
    getAuth: function() {
      return e.auth;
    },
    getPermissions: function() {
      return e.permissions;
    },
    getNavigation: function() {
      return e.navigation;
    },
    getUI: function() {
      return e.ui;
    },
    getMetrics: function() {
      return e.metrics;
    },
    getDegradations: function() {
      return e.degradations;
    },
    getErrors: function() {
      return e.errors;
    },
    getWarnings: function() {
      return e.warnings;
    },
    getHealth: function() {
      return e.health;
    },
    getHealthScore: function() {
      return e.healthScore;
    },
    getProgress: function() {
      return e.progress;
    },
    setStatus: function(t) {
      e.status = t;
    },
    setPhase: function(t, r) {
      e.phases[t] = r, e.metrics.phaseTimings[t] = r.time || 0;
    },
    setAuth: function(t) {
      e.auth = {
        authenticated: t.authenticated || !1,
        user: t.user || null,
        checked: !0,
        loginRequired: t.loginRequired || !1,
        timestamp: Date.now()
      };
    },
    setPermissions: function(t) {
      e.permissions = {
        mode: t.mode || "unknown",
        ready: t.ready || !1,
        timestamp: Date.now()
      };
    },
    setNavigation: function(t) {
      e.navigation = {
        ready: t.ready || !1,
        currentRoute: t.currentRoute || null,
        timestamp: Date.now()
      };
    },
    setUI: function(t) {
      e.ui = {
        ready: t.ready || !1,
        preloaderDismissed: t.preloaderDismissed || !1,
        timestamp: Date.now()
      };
    },
    setHealth: function(t, r) {
      e.health = t, e.healthScore = r;
    },
    setProgress: function(t) {
      Object.assign(e.progress, t);
    },
    startMetrics: function() {
      e.metrics.startTime = performance.now();
    },
    endMetrics: function() {
      e.metrics.endTime = performance.now(), e.metrics.totalTime = Math.round(e.metrics.endTime - e.metrics.startTime);
    },
    incrementRecoveries: function() {
      e.metrics.recoveries++;
    },
    incrementFailures: function() {
      e.metrics.failures++;
    },
    addDegradation: function(t) {
      e.degradations.push(t);
    },
    addError: function(t) {
      e.errors.push(t);
    },
    addWarning: function(t) {
      e.warnings.push(t);
    },
    reset: function() {
      e.status = Ie.PENDING, e.phases = {}, e.auth = { authenticated: !1, user: null, checked: !1 }, e.permissions = { mode: "unknown", ready: !1 }, e.navigation = { ready: !1, currentRoute: null }, e.ui = { ready: !1, preloaderDismissed: !1 }, e.metrics = {
        startTime: null,
        endTime: null,
        totalTime: 0,
        phaseTimings: {},
        recoveries: 0,
        failures: 0
      }, e.degradations = [], e.errors = [], e.warnings = [], e.health = N.HEALTHY, e.healthScore = 0, e.progress = {
        currentPhase: null,
        currentPhaseIndex: 0,
        totalPhases: Z.phases.length,
        percentage: 0
      };
    }
  };
}
function xg(e) {
  e === void 0 && (e = {});
  const t = e.stateStore, r = e.notifyListeners, n = e.eventBus || null;
  function i(o, l) {
    if (r("progress", { event: o, data: l, timestamp: Date.now() }), n && n.emit)
      try {
        n.emit(o, Object.assign({}, l, { timestamp: Date.now() }));
      } catch {
      }
  }
  return {
    start: function() {
      t.setProgress({ percentage: 0 }), i(hn.START, { percentage: 0, phase: null });
    },
    onPhaseStart: function(o) {
      const l = Cr(o);
      let a = 0;
      for (let c = 0; c < Z.phases.length; c++)
        if (Z.phases[c].id === o) {
          a = c;
          break;
        }
      const s = Z.phases.length, u = Math.round(a / s * 100);
      t.setProgress({
        currentPhase: o,
        currentPhaseIndex: a,
        percentage: u
      }), i(hn.PHASE_START, {
        phase: o,
        phaseName: l ? l.name : o,
        phaseIndex: a,
        totalPhases: s,
        percentage: u
      });
    },
    onPhaseComplete: function(o) {
      const l = t.getProgress(), a = l.currentPhaseIndex + 1, s = l.totalPhases, u = Math.round(a / s * 100);
      t.setProgress({ percentage: u }), i(hn.PHASE_COMPLETE, {
        phase: o,
        phaseIndex: a,
        totalPhases: s,
        percentage: u
      });
    },
    onComplete: function(o, l, a) {
      t.setProgress({ percentage: 100 }), i(hn.COMPLETE, {
        success: o,
        state: l,
        totalTime: a,
        percentage: 100
      });
    },
    getProgress: function() {
      return Object.assign({}, t.getProgress());
    }
  };
}
function Fg(e) {
  e === void 0 && (e = {});
  const t = e.stateStore;
  return {
    recalculate: function() {
      const r = t.getPhases(), n = Da();
      let i = 0, o = !1;
      for (const s in r)
        if (r.hasOwnProperty(s)) {
          const u = r[s], c = Cr(s), d = c && c.healthWeight || 0;
          u.success || u.recovered ? u.degraded ? i += d * 0.5 : i += d : c && c.critical && (o = !0);
        }
      const l = n > 0 ? Math.round(i / n * 100) : 0;
      let a;
      return o ? a = N.FAILED : l >= 90 ? a = N.HEALTHY : l >= 60 ? a = N.DEGRADED : a = N.UNHEALTHY, t.setHealth(a, l), { health: a, healthScore: l };
    },
    getHealth: function() {
      return t.getHealth();
    },
    getHealthScore: function() {
      return t.getHealthScore();
    }
  };
}
function Gg(e) {
  e === void 0 && (e = {});
  const t = e.stateStore, r = e.healthCalculator, n = e.progressTracker, i = e.notifyListeners;
  return {
    setResult: function(o, l) {
      const a = Cr(o);
      t.getPhase(o) || n.onPhaseStart(o);
      const u = {
        id: o,
        status: l.success ? l.recovered ? "recovered" : "success" : "failed",
        success: l.success,
        recovered: l.recovered || !1,
        degraded: l.degraded || !1,
        suppressed: l.suppressed || !1,
        time: l.time || 0,
        error: l.error || null,
        timestamp: Date.now()
      };
      t.setPhase(o, u), l.recovered && (t.incrementRecoveries(), t.addWarning({
        phase: o,
        type: "recovery",
        message: (a && a.name ? a.name : o) + " recovered from error",
        originalError: l.error,
        timestamp: Date.now()
      }), a && a.onFail && t.addDegradation({
        phase: o,
        mode: a.onFail.mode,
        message: a.onFail.message,
        disabled: a.onFail.disable || [],
        allowed: a.onFail.allow || [],
        timestamp: Date.now()
      })), l.suppressed && t.addWarning({
        phase: o,
        type: "suppressed",
        message: (a && a.name ? a.name : o) + " error suppressed (unauth)",
        originalError: l.error,
        timestamp: Date.now()
      }), !l.success && !l.recovered && (t.incrementFailures(), t.addError({
        phase: o,
        // @ts-expect-error strict migration — TS2322
        error: l.error,
        critical: a ? a.critical : !1,
        timestamp: Date.now()
      })), r.recalculate(), i("phase", { phaseId: o, result: u }), n.onPhaseComplete(o);
    },
    getPhase: function(o) {
      return t.getPhase(o);
    },
    getPhases: function() {
      return Object.assign({}, t.getPhases());
    },
    getPhasesCount: function() {
      return Object.keys(t.getPhases()).length;
    }
  };
}
function zg(e) {
  e === void 0 && (e = {});
  const t = e.stateStore;
  return {
    isDisabled: function(r) {
      const n = t.getDegradations();
      for (let i = 0; i < n.length; i++) {
        const o = n[i];
        if (o.disabled.indexOf("*") !== -1)
          return o.allowed.indexOf(r) === -1;
        if (o.disabled.indexOf(r) !== -1)
          return !0;
      }
      return !1;
    },
    isAllowed: function(r) {
      return t.getDegradations().length === 0 ? !0 : !this.isDisabled(r);
    },
    getDegradations: function() {
      return t.getDegradations().slice();
    },
    getDegradationCount: function() {
      return t.getDegradations().length;
    }
  };
}
function ot(e) {
  if (e === null || typeof e != "object")
    return e;
  if (e instanceof Date)
    return new Date(e.getTime());
  if (Array.isArray(e)) {
    for (var t = [], r = 0; r < e.length; r++)
      t[r] = ot(e[r]);
    return t;
  }
  if (e instanceof Object) {
    var n = {};
    for (var i in e)
      e.hasOwnProperty(i) && (n[i] = ot(e[i]));
    return n;
  }
  return e;
}
function Bc(e) {
  if (e === null || typeof e != "object")
    return e;
  Object.freeze(e);
  for (var t in e)
    if (e.hasOwnProperty(t)) {
      var r = e[t];
      r !== null && typeof r == "object" && !Object.isFrozen(r) && Bc(r);
    }
  return e;
}
function Vg(e) {
  e === void 0 && (e = {});
  var t = e.stateStore, r = e.freezeSnapshots !== !1;
  return {
    // #21: Build retorna cópia profunda imutável
    build: function() {
      var n = t.getStatus(), i = t.getMetrics(), o = t.getDegradations(), l = {
        // Estado principal
        state: n,
        success: n === Ie.READY || n === Ie.DEGRADED,
        // Saúde
        health: t.getHealth(),
        healthScore: t.getHealthScore(),
        degraded: n === Ie.DEGRADED || o.length > 0,
        // Autenticação - deep clone
        auth: ot(t.getAuth()),
        // Permissões - deep clone
        permissions: ot(t.getPermissions()),
        // Navegação - deep clone
        navigation: ot(t.getNavigation()),
        // UI - deep clone
        ui: ot(t.getUI()),
        // Fases - deep clone
        phases: ot(t.getPhases()),
        phasesCompleted: Object.keys(t.getPhases()).length,
        // Degradações - deep clone
        degradations: ot(o),
        degradationCount: o.length,
        // Erros - deep clone
        errors: ot(t.getErrors()),
        errorCount: t.getErrors().length,
        // Warnings - deep clone
        warnings: ot(t.getWarnings()),
        warningCount: t.getWarnings().length,
        // Progresso - deep clone
        progress: ot(t.getProgress()),
        // Métricas - deep clone
        metrics: {
          totalTime: i.totalTime,
          phaseTimings: ot(i.phaseTimings),
          recoveries: i.recoveries,
          failures: i.failures
        },
        // Meta
        timestamp: Date.now(),
        version: Bg,
        immutable: r,
        snapshotVersion: "1.2.0-QUALITY"
      };
      return r ? Bc(l) : l;
    },
    // #21: Método para obter cópia mutável (uso interno)
    buildMutable: function() {
      var n = r;
      r = !1;
      var i = this.build();
      return r = n, i;
    },
    // #21: Verificar se snapshot é imutável
    isImmutable: function(n) {
      return n && Object.isFrozen(n);
    },
    // #21: Info do builder
    info: function() {
      return {
        moduleId: "snapshot-builder",
        version: "1.2.1-CONTRACTS",
        freezeSnapshots: r,
        improvements: ["#21-ImmutableSnapshot"]
      };
    }
  };
}
const pl = "1.2.0-HEALTH-CONTRACT";
function Yg(e) {
  let t = [];
  function r(v, w) {
    for (let y = 0; y < t.length; y++)
      try {
        t[y]({ event: v, data: w, timestamp: Date.now() });
      } catch {
      }
  }
  const n = Ug(), i = xg({
    stateStore: n,
    notifyListeners: r
  }), o = Fg({
    stateStore: n
  }), l = Gg({
    stateStore: n,
    healthCalculator: o,
    progressTracker: i,
    notifyListeners: r
  }), a = zg({
    stateStore: n
  }), s = Vg({
    stateStore: n
  });
  function u() {
    n.setStatus(Ie.INITIALIZING), n.startMetrics(), i.start(), r("start", { state: n.getStatus(), timestamp: Date.now() });
  }
  function c(v) {
    n.endMetrics();
    const w = n.getDegradations(), y = n.getMetrics();
    v && w.length === 0 ? n.setStatus(Ie.READY) : v && w.length > 0 ? n.setStatus(Ie.DEGRADED) : n.setStatus(Ie.FAILED), i.onComplete(v, n.getStatus(), y.totalTime), o.recalculate(), r("complete", s.build());
  }
  function d() {
    n.reset(), t = [];
  }
  function f(v) {
    n.setAuth(v), r("auth", n.getAuth());
  }
  function g(v) {
    n.setPermissions(v), r("permissions", n.getPermissions());
  }
  function h(v) {
    n.setNavigation(v), r("navigation", n.getNavigation());
  }
  function p(v) {
    n.setUI(v), r("ui", n.getUI());
  }
  function A(v) {
    n.addWarning({
      phase: v.phase || null,
      type: v.type || "general",
      message: v.message || "Unknown warning",
      data: v.data || null,
      timestamp: Date.now()
    }), r("warning", n.getWarnings()[n.getWarnings().length - 1]);
  }
  function T() {
    const v = n.getStatus();
    return v === Ie.READY || v === Ie.DEGRADED;
  }
  function S() {
    return n.getStatus() === Ie.DEGRADED || n.getDegradations().length > 0;
  }
  function L() {
    return n.getStatus() === Ie.FAILED;
  }
  function H(v) {
    return typeof v == "function" ? (t.push(v), function() {
      const y = t.indexOf(v);
      y !== -1 && t.splice(y, 1);
    }) : function() {
    };
  }
  function E() {
    return {
      moduleId: ml,
      version: pl,
      state: n.getStatus(),
      health: n.getHealth(),
      healthScore: n.getHealthScore(),
      phasesCompleted: l.getPhasesCount(),
      degradations: n.getDegradations().length,
      errors: n.getErrors().length,
      warnings: n.getWarnings().length,
      listeners: t.length,
      progress: n.getProgress(),
      quickWinsApplied: ["QW09-Progress", "QW24-Warnings"],
      modular: !0
    };
  }
  function m() {
    const v = n.getStatus();
    let w = B.HEALTHY;
    return v === Ie.FAILED ? w = B.UNHEALTHY : (v === Ie.DEGRADED || v !== Ie.READY) && (w = B.DEGRADED), ue({
      status: w,
      moduleId: ml,
      version: pl,
      checks: {
        contextReady: v === Ie.READY || v === Ie.DEGRADED,
        noErrors: n.getErrors().length === 0,
        noWarnings: n.getWarnings().length === 0
      },
      details: {
        bootHealth: n.getHealth(),
        bootHealthScore: n.getHealthScore(),
        warningCount: n.getWarnings().length,
        modular: !0
      }
    });
  }
  return {
    // Lifecycle
    start: u,
    complete: c,
    reset: d,
    // Setters
    setPhaseResult: l.setResult,
    setAuth: f,
    setPermissions: g,
    setNavigation: h,
    setUI: p,
    addWarning: A,
    // Getters
    getSnapshot: s.build,
    getProgress: i.getProgress,
    getWarnings: function() {
      return n.getWarnings().slice();
    },
    isReady: T,
    isDegraded: S,
    isFailed: L,
    isFeatureDisabled: a.isDisabled,
    isFeatureAllowed: a.isAllowed,
    // Subscriptions
    subscribe: H,
    // Meta
    info: E,
    healthCheck: m,
    // Constants
    STATES: Ie,
    PROGRESS_EVENTS: hn
  };
}
let to = null;
function jg() {
  return to || (to = Yg()), to;
}
var El = "boot-health-aggregator", ci = "1.3.0-HEALTH-CONTRACT", di = {
  HEALTHY: 90,
  DEGRADED: 60,
  UNHEALTHY: 30
}, vl = {
  interval: 3e4,
  maxChecks: 100
};
function Wg(e, t) {
  t === void 0 && (t = {});
  var r = e, n = t.eventBus || null, i = null, o = [], l = {
    running: !1,
    intervalId: null,
    checkCount: 0,
    history: []
  }, a = {
    phases: {},
    baseline: null,
    peak: null,
    current: null
  };
  function s() {
    return typeof window < "u" && window.performance && window.performance.memory ? {
      usedJSHeapSize: window.performance.memory.usedJSHeapSize,
      totalJSHeapSize: window.performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: window.performance.memory.jsHeapSizeLimit,
      timestamp: Date.now()
    } : null;
  }
  function u() {
    return a.baseline = s(), a.baseline;
  }
  function c(C, $) {
    var Y = s();
    return Y ? (a.phases[C] || (a.phases[C] = { start: null, end: null, delta: 0 }), $ === "start" ? a.phases[C].start = Y : $ === "end" && (a.phases[C].end = Y, a.phases[C].start && (a.phases[C].delta = Y.usedJSHeapSize - a.phases[C].start.usedJSHeapSize)), (!a.peak || Y.usedJSHeapSize > a.peak.usedJSHeapSize) && (a.peak = Y), a.current = Y, Y) : null;
  }
  function d() {
    return {
      baseline: a.baseline,
      peak: a.peak,
      current: s(),
      phases: Object.assign({}, a.phases),
      totalDelta: a.baseline && a.current ? a.current.usedJSHeapSize - a.baseline.usedJSHeapSize : 0
    };
  }
  function f() {
    var C = r ? r.getSnapshot() : null;
    if (!C)
      return g();
    for (var $ = C.phases || {}, Y = Da(), D = 0, U = {}, G = { total: 0, passed: 0, failed: 0 }, j = { total: 0, passed: 0, failed: 0, skipped: 0 }, $e = [], nt = [], ct = 0; ct < Z.phases.length; ct++) {
      var F = Z.phases[ct], me = F.id, M = $[me], K = F.healthWeight || 0, W = {
        id: me,
        name: F.name,
        critical: F.critical,
        weight: K,
        status: "pending",
        score: 0,
        issues: [],
        memory: a.phases[me] || null
      };
      M ? (M.success && !M.degraded ? (W.status = "healthy", W.score = K, D += K) : M.recovered || M.degraded ? (W.status = "degraded", W.score = K * 0.5, D += K * 0.5, nt.push({
        phase: me,
        type: "degraded",
        message: F.name + " is running in degraded mode"
      })) : M.suppressed ? (W.status = "suppressed", W.score = K * 0.7, D += K * 0.7) : (W.status = "failed", W.score = 0, F.critical ? $e.push({
        phase: me,
        type: "critical_failure",
        message: "Critical phase " + F.name + " failed",
        error: M.error
      }) : nt.push({
        phase: me,
        type: "failure",
        message: F.name + " failed but is non-critical"
      })), F.critical ? (G.total++, M.success || M.recovered ? G.passed++ : G.failed++) : (j.total++, M.success || M.recovered ? j.passed++ : j.failed++)) : (W.status = "pending", F.critical ? G.total++ : (j.total++, j.skipped++)), U[me] = W;
    }
    var fe = Y > 0 ? Math.round(D / Y * 100) : 0, Be = N.HEALTHY;
    G.failed > 0 ? Be = N.FAILED : fe < di.UNHEALTHY ? Be = N.UNHEALTHY : (fe < di.DEGRADED || fe < di.HEALTHY) && (Be = N.DEGRADED), C.degradationCount > 0 && Be === N.HEALTHY && (Be = N.DEGRADED);
    var rn = {
      status: Be,
      score: fe,
      scoreDisplay: fe + "/100",
      phases: U,
      critical: G,
      nonCritical: j,
      issues: $e,
      issueCount: $e.length,
      warnings: nt,
      warningCount: nt.length,
      totalTime: C.metrics ? C.metrics.totalTime : 0,
      recoveries: C.metrics ? C.metrics.recoveries : 0,
      failures: C.metrics ? C.metrics.failures : 0,
      degradations: C.degradationCount || 0,
      memory: d(),
      calculatedAt: Date.now(),
      version: ci
    };
    return i = rn, v(rn), rn;
  }
  function g() {
    return {
      status: N.UNHEALTHY,
      score: 0,
      scoreDisplay: "0/100",
      phases: {},
      critical: { total: 0, passed: 0, failed: 0 },
      nonCritical: { total: 0, passed: 0, failed: 0, skipped: 0 },
      issues: [{ type: "no_context", message: "Boot context not available" }],
      issueCount: 1,
      warnings: [],
      warningCount: 0,
      totalTime: 0,
      recoveries: 0,
      failures: 0,
      degradations: 0,
      memory: null,
      calculatedAt: Date.now(),
      version: ci
    };
  }
  function h(C) {
    C === void 0 && (C = {});
    var $ = C.interval || vl.interval, Y = C.maxChecks || vl.maxChecks, D = C.onCheck || null;
    return l.running ? { success: !1, reason: "already-running" } : (l.running = !0, l.checkCount = 0, l.history = [], l.intervalId = setInterval(function() {
      if (l.checkCount >= Y) {
        p();
        return;
      }
      var U = f();
      l.checkCount++;
      var G = {
        checkNumber: l.checkCount,
        status: U.status,
        score: U.score,
        timestamp: Date.now()
      };
      if (l.history.push(G), l.history.length > 20 && l.history.shift(), D && typeof D == "function")
        try {
          D(G, U);
        } catch {
        }
      if (n && n.emit)
        try {
          n.emit(Ot.HEALTH_PERIODIC, G);
        } catch {
        }
    }, $), { success: !0, interval: $, maxChecks: Y });
  }
  function p() {
    return l.intervalId && (clearInterval(l.intervalId), l.intervalId = null), l.running = !1, { stopped: !0, totalChecks: l.checkCount };
  }
  function A() {
    return {
      running: l.running,
      checkCount: l.checkCount,
      history: l.history.slice()
    };
  }
  function T() {
    return i;
  }
  function S() {
    var C = i || f();
    return C.status;
  }
  function L() {
    var C = i || f();
    return C.score;
  }
  function H() {
    return S() === N.HEALTHY;
  }
  function E() {
    return S() === N.DEGRADED;
  }
  function m() {
    var C = S();
    return C === N.UNHEALTHY || C === N.FAILED;
  }
  function v(C) {
    for (var $ = 0; $ < o.length; $++)
      try {
        o[$](C);
      } catch {
      }
  }
  function w(C) {
    return typeof C == "function" ? (o.push(C), function() {
      var Y = o.indexOf(C);
      Y !== -1 && o.splice(Y, 1);
    }) : function() {
    };
  }
  function y(C) {
    r = C, i = null;
  }
  function R(C) {
    n = C || null;
  }
  function O() {
    var C = i || f();
    return {
      moduleId: El,
      version: ci,
      status: C.status,
      score: C.score,
      issueCount: C.issueCount,
      warningCount: C.warningCount,
      hasContext: !!r,
      hasEventBus: !!n,
      listeners: o.length,
      periodicCheck: {
        running: l.running,
        checkCount: l.checkCount
      },
      memory: d(),
      quickWinsApplied: ["QW15-PeriodicCheck", "QW20-MemoryMetrics"]
    };
  }
  function b() {
    var C = i || f(), $ = B.HEALTHY;
    return r || ($ = B.DEGRADED), ue({
      status: $,
      moduleId: El,
      version: ci,
      checks: {
        hasContext: !!r,
        hasEventBus: !!n,
        periodicRunning: l.running
      },
      details: {
        bootStatus: C.status,
        bootScore: C.score,
        periodicRunning: l.running,
        hasEventBus: !!n
      }
    });
  }
  function P() {
    p(), i = null, l = { running: !1, intervalId: null, checkCount: 0, history: [] }, a = { phases: {}, baseline: null, peak: null, current: null };
  }
  return {
    calculate: f,
    getLastCalculation: T,
    getStatus: S,
    getScore: L,
    isHealthy: H,
    isDegraded: E,
    isUnhealthy: m,
    subscribe: w,
    setContext: y,
    setEventBus: R,
    info: O,
    healthCheck: b,
    reset: P,
    startPeriodicCheck: h,
    stopPeriodicCheck: p,
    getPeriodicHistory: A,
    captureMemoryBaseline: u,
    capturePhaseMemory: c,
    getMemoryMetrics: d,
    THRESHOLDS: di
  };
}
var sn = null;
function $g(e, t) {
  return sn ? (e && sn.setContext(e), t && t.eventBus && sn.setEventBus(t.eventBus)) : sn = Wg(e, t), sn;
}
var Uc = "boot-metrics-summary", xc = "1.0.1-CONTRACTS", x = {
  bootStartTime: null,
  bootEndTime: null,
  totalBootTime: 0,
  phases: {},
  modules: {},
  memory: {
    start: null,
    end: null,
    peak: null
  },
  errors: [],
  warnings: [],
  degradations: []
};
function ws() {
  return x.bootStartTime = Date.now(), x.phases = {}, x.modules = {}, x.errors = [], x.warnings = [], x.degradations = [], typeof window < "u" && window.performance && window.performance.memory && (x.memory.start = {
    usedJSHeapSize: window.performance.memory.usedJSHeapSize,
    totalJSHeapSize: window.performance.memory.totalJSHeapSize,
    timestamp: Date.now()
  }), { started: !0, timestamp: x.bootStartTime };
}
function Ds(e) {
  return x.bootEndTime = Date.now(), x.totalBootTime = x.bootEndTime - x.bootStartTime, typeof window < "u" && window.performance && window.performance.memory && (x.memory.end = {
    usedJSHeapSize: window.performance.memory.usedJSHeapSize,
    totalJSHeapSize: window.performance.memory.totalJSHeapSize,
    timestamp: Date.now()
  }), {
    success: e,
    totalTime: x.totalBootTime,
    timestamp: x.bootEndTime
  };
}
function Fc(e, t) {
  return x.phases[e] = {
    id: e,
    startTime: t.startTime || Date.now(),
    endTime: t.endTime || null,
    duration: t.duration || 0,
    status: t.status || "unknown",
    modulesLoaded: t.modulesLoaded || 0,
    modulesFailed: t.modulesFailed || 0,
    critical: t.critical || !1
  }, x.phases[e];
}
function Gc(e, t) {
  return x.modules[e] = {
    id: e,
    phaseId: t.phaseId || "unknown",
    loadTime: t.loadTime || 0,
    initTime: t.initTime || 0,
    totalTime: t.totalTime || 0,
    status: t.status || "unknown",
    critical: t.critical || !1,
    timeout: t.timeout || null
  }, x.modules[e];
}
function zc(e, t) {
  x.errors.push({
    message: e.message || String(e),
    context: t || {},
    timestamp: Date.now()
  });
}
function Vc(e, t) {
  x.warnings.push({
    message: e,
    context: t || {},
    timestamp: Date.now()
  });
}
function Yc(e, t) {
  x.degradations.push({
    moduleId: e,
    reason: t,
    timestamp: Date.now()
  });
}
function jc() {
  if (typeof window < "u" && window.performance && window.performance.memory) {
    var e = window.performance.memory.usedJSHeapSize;
    (!x.memory.peak || e > x.memory.peak.usedJSHeapSize) && (x.memory.peak = {
      usedJSHeapSize: e,
      totalJSHeapSize: window.performance.memory.totalJSHeapSize,
      timestamp: Date.now()
    });
  }
}
function mr() {
  var e = Object.keys(x.phases).length, t = Object.keys(x.modules).length, r = 0, n = 0;
  for (var i in x.modules)
    x.modules.hasOwnProperty(i) && (x.modules[i].status === "ready" || x.modules[i].status === "success" ? r++ : (x.modules[i].status === "error" || x.modules[i].status === "failed") && n++);
  var o = 0, l = 0;
  for (var a in x.modules)
    x.modules.hasOwnProperty(a) && (l += x.modules[a].totalTime || 0);
  t > 0 && (o = Math.round(l / t));
  var s = 0;
  return x.memory.start && x.memory.end && (s = x.memory.end.usedJSHeapSize - x.memory.start.usedJSHeapSize), {
    // Timing
    totalBootTime: x.totalBootTime,
    bootStartTime: x.bootStartTime,
    bootEndTime: x.bootEndTime,
    // Phases
    phaseCount: e,
    phases: x.phases,
    // Modules
    moduleCount: t,
    successfulModules: r,
    failedModules: n,
    avgModuleTime: o,
    // Memory
    memory: {
      start: x.memory.start ? x.memory.start.usedJSHeapSize : null,
      end: x.memory.end ? x.memory.end.usedJSHeapSize : null,
      peak: x.memory.peak ? x.memory.peak.usedJSHeapSize : null,
      delta: s
    },
    // Issues
    errorCount: x.errors.length,
    warningCount: x.warnings.length,
    degradationCount: x.degradations.length,
    errors: x.errors,
    warnings: x.warnings,
    degradations: x.degradations,
    // Meta
    timestamp: Date.now()
  };
}
function Cs() {
  x = {
    bootStartTime: null,
    bootEndTime: null,
    totalBootTime: 0,
    phases: {},
    modules: {},
    memory: { start: null, end: null, peak: null },
    errors: [],
    warnings: [],
    degradations: []
  };
}
function Wc() {
  return {
    moduleId: Uc,
    version: xc,
    hasMetrics: x.bootStartTime !== null,
    summary: mr()
  };
}
var Kg = {
  startBoot: ws,
  endBoot: Ds,
  recordPhase: Fc,
  recordModule: Gc,
  recordError: zc,
  recordWarning: Vc,
  recordDegradation: Yc,
  updateMemoryPeak: jc,
  getSummary: mr,
  reset: Cs,
  info: Wc
};
const fi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Uc,
  VERSION: xc,
  default: Kg,
  endBoot: Ds,
  getSummary: mr,
  info: Wc,
  recordDegradation: Yc,
  recordError: zc,
  recordModule: Gc,
  recordPhase: Fc,
  recordWarning: Vc,
  reset: Cs,
  startBoot: ws,
  updateMemoryPeak: jc
}, Symbol.toStringTag, { value: "Module" })), xt = "boot-orchestrator", Le = {
  IDLE: "idle",
  INITIALIZING: "initializing",
  RUNNING: "running",
  PHASE_EXECUTING: "phase-executing",
  PHASE_COMPLETE: "phase-complete",
  COMPLETED: "completed",
  FAILED: "failed",
  RECOVERING: "recovering",
  ROLLING_BACK: "rolling-back"
}, ke = {
  INIT: "orchestrator:init",
  PHASE_START: "orchestrator:phase:start",
  PHASE_COMPLETE: "orchestrator:phase:complete",
  PHASE_ERROR: "orchestrator:phase:error",
  PHASE_SKIPPED: "orchestrator:phase:skipped",
  COMPLETE: "orchestrator:complete",
  ERROR: "orchestrator:error",
  RECOVERY: "orchestrator:recovery",
  CONTEXT_READY: "orchestrator:context:ready",
  HEALTH_UPDATE: "orchestrator:health:update",
  MANIFEST_INVALID: "orchestrator:manifest:invalid",
  PHASE_ROLLBACK_START: "orchestrator:phase:rollback:start",
  PHASE_ROLLBACK_COMPLETE: "orchestrator:phase:rollback:complete",
  PHASE_ROLLBACK_ERROR: "orchestrator:phase:rollback:error"
};
function qg(e) {
  e === void 0 && (e = {});
  const t = e.logger, r = e.moduleId || "event-emitter";
  let n = {};
  function i(o, l, a) {
    t && t[o] && t[o](l, Object.assign({}, a, { module: r }));
  }
  return {
    emit: function(o, l) {
      l === void 0 && (l = {});
      const a = n[o] || [];
      for (let s = 0; s < a.length; s++)
        try {
          a[s](l);
        } catch (u) {
          i("error", "Event handler error", { event: o, error: u.message });
        }
    },
    on: function(o, l) {
      n[o] || (n[o] = []), n[o].push(l);
      const a = this;
      return function() {
        a.off(o, l);
      };
    },
    off: function(o, l) {
      const a = n[o] || [], s = a.indexOf(l);
      s !== -1 && a.splice(s, 1);
    },
    clear: function() {
      n = {};
    },
    listenerCount: function(o) {
      return (n[o] || []).length;
    }
  };
}
const yl = Object.freeze({
  // Situações onde retry É PERMITIDO
  ALLOWED_FOR: Object.freeze([
    "external-api-call",
    // Chamadas a APIs externas
    "network-request",
    // Requisições de rede
    "transient-failure",
    // Falhas transitórias conhecidas
    "dependency-unavailable",
    // Dependência temporariamente indisponível
    "timeout-exceeded",
    // Timeout que pode ser transitório
    "rate-limited",
    // Rate limiting temporário
    "service-overloaded"
    // Serviço temporariamente sobrecarregado
  ]),
  // Situações onde retry É PROIBIDO
  FORBIDDEN_FOR: Object.freeze([
    "internal-logic-error",
    // Erros de lógica interna
    "validation-failure",
    // Falhas de validação
    "auth-failure",
    // Falhas de autenticação
    "permission-denied",
    // Permissão negada
    "configuration-error",
    // Erros de configuração
    "critical-phase-error",
    // Erros em fases críticas (phase-0)
    "data-corruption",
    // Dados corrompidos
    "contract-violation",
    // Violação de contrato
    "missing-dependency",
    // Dependência ausente (não transitório)
    "boot-loop-detected"
    // Loop de boot detectado
  ])
}), Yt = Object.freeze({
  NONE: "none",
  // Sem resiliência — falha imediata
  MINIMAL: "minimal",
  // Apenas timeout, sem retry
  STANDARD: "standard",
  // Timeout + 1-2 retries
  AGGRESSIVE: "aggressive",
  // Timeout + múltiplos retries + backoff + jitter
  CRITICAL: "critical"
  // Para fases críticas — sem retry, falha rápida
}), ft = Object.freeze({
  SUCCESS: "success",
  // Operação bem-sucedida
  SUCCESS_AFTER_RETRY: "success-after-retry",
  // Sucesso após retry
  RETRY_EXHAUSTED: "retry-exhausted",
  // Todas tentativas falharam
  TIMEOUT_EXCEEDED: "timeout-exceeded",
  // Timeout excedido
  CIRCUIT_OPEN: "circuit-open",
  // Circuit breaker aberto
  BOOT_LOOP_DETECTED: "boot-loop-detected",
  // Loop de boot detectado
  POLICY_VIOLATION: "policy-violation",
  // Violação de política
  SKIPPED: "skipped",
  // Operação pulada
  DEGRADED: "degraded"
  // Completou em modo degradado
}), ve = Object.freeze({
  retry: Object.freeze({
    enabled: !0,
    maxAttempts: 2,
    baseDelay: 1e3,
    backoffMultiplier: 1.5,
    maxDelay: 3e4,
    jitterEnabled: !0,
    jitterFactor: 0.3
  }),
  timeout: Object.freeze({
    phase: 3e4,
    module: 1e4,
    global: 12e4,
    warning: 9e4,
    minimum: 1e3,
    maximum: 3e5
  }),
  circuitBreaker: Object.freeze({
    enabled: !0,
    failureThreshold: 3,
    successThreshold: 2,
    timeout: 3e4,
    resetTimeout: 6e4
  }),
  bootLoop: Object.freeze({
    maxBootsInWindow: 3,
    windowMs: 3e4,
    cooldownMs: 6e4
  })
});
Object.freeze({
  "phase-0-critical": Object.freeze({
    level: Yt.CRITICAL,
    retry: { enabled: !1, maxAttempts: 1 },
    timeout: 5e3,
    failFast: !0,
    description: "Fase crítica — EventBus/Logger obrigatórios, sem retry"
  }),
  "phase-1-core": Object.freeze({
    level: Yt.STANDARD,
    retry: { enabled: !0, maxAttempts: 2, baseDelay: 1e3 },
    timeout: 1e4,
    failFast: !1,
    description: "Core services — retry moderado"
  }),
  "phase-2-auth": Object.freeze({
    level: Yt.STANDARD,
    retry: { enabled: !0, maxAttempts: 2, baseDelay: 1500 },
    timeout: 15e3,
    failFast: !1,
    description: "Autenticação — retry com delay maior"
  }),
  "phase-3-shell": Object.freeze({
    level: Yt.STANDARD,
    retry: { enabled: !0, maxAttempts: 2, baseDelay: 1e3 },
    timeout: 2e4,
    failFast: !1,
    description: "Shell — retry padrão"
  }),
  "phase-4-main": Object.freeze({
    level: Yt.STANDARD,
    retry: { enabled: !0, maxAttempts: 2, baseDelay: 1e3 },
    timeout: 15e3,
    failFast: !1,
    description: "Main content — retry padrão"
  }),
  "phase-5-ui": Object.freeze({
    level: Yt.MINIMAL,
    retry: { enabled: !0, maxAttempts: 1, baseDelay: 500 },
    timeout: 1e4,
    failFast: !1,
    description: "UI components — retry mínimo, não crítico"
  }),
  "phase-6-platform": Object.freeze({
    level: Yt.NONE,
    retry: { enabled: !1, maxAttempts: 1 },
    timeout: 1e4,
    failFast: !1,
    description: "Platform — sem retry, pode ser pulado"
  })
});
Object.values(Yt);
const Jg = Object.values(ft);
function Zg(e) {
  return Jg.indexOf(e) !== -1;
}
function Qg(e, t) {
  return !e || typeof e != "string" || yl.FORBIDDEN_FOR.indexOf(e) !== -1 ? !1 : yl.ALLOWED_FOR.indexOf(e) !== -1 ? !0 : (t && (t.phaseId === "phase-0-critical" || t.attempt >= t.maxAttempts || t.circuitOpen), !1);
}
function Xg(e) {
  e || (e = {});
  const t = ve.retry;
  return {
    enabled: e.enabled !== void 0 ? e.enabled : t.enabled,
    maxAttempts: e.maxAttempts || t.maxAttempts,
    delay: e.delay || e.baseDelay || t.baseDelay,
    baseDelay: e.baseDelay || e.delay || t.baseDelay,
    backoff: e.backoff || e.backoffMultiplier || t.backoffMultiplier,
    backoffMultiplier: e.backoffMultiplier || e.backoff || t.backoffMultiplier,
    maxDelay: e.maxDelay || t.maxDelay,
    jitter: e.jitter !== void 0 ? e.jitter : t.jitterEnabled,
    jitterEnabled: e.jitterEnabled !== void 0 ? e.jitterEnabled : t.jitterEnabled,
    jitterFactor: e.jitterFactor || t.jitterFactor
  };
}
function em(e) {
  e || (e = {});
  const t = ve.timeout;
  let r = e.timeout || e.timeoutMs || t.module;
  return r < t.minimum && (r = t.minimum), r > t.maximum && (r = t.maximum), {
    timeout: r,
    timeoutMs: r,
    warning: e.warning || e.warningMs || Math.round(r * 0.75),
    warningMs: e.warningMs || e.warning || Math.round(r * 0.75),
    enabled: e.enabled !== void 0 ? e.enabled : !0
  };
}
function Hi(e) {
  e || (e = {});
  let t = e.outcome || ft.SUCCESS;
  Zg(t) || (t = ft.SUCCESS);
  const r = {
    outcome: t,
    success: t === ft.SUCCESS || t === ft.SUCCESS_AFTER_RETRY || t === ft.DEGRADED,
    timestamp: e.timestamp || Date.now(),
    duration: e.duration || 0
  };
  return e.phaseId && (r.phaseId = e.phaseId), e.attempt !== void 0 && (r.attempt = e.attempt, r.retriesUsed = e.attempt > 1 ? e.attempt - 1 : 0), e.error && (r.error = typeof e.error == "string" ? e.error : e.error.message || "Unknown error"), e.level && (r.level = e.level), e.details && typeof e.details == "object" && (r.details = e.details), r;
}
const tm = "retry-executor", rm = "3.1.0-RESILIENCE-CONTRACT";
function nm(e, t) {
  if (t === void 0 && (t = ve.retry.jitterFactor), t <= 0) return e;
  const r = (Math.random() * 2 - 1) * t, n = e * (1 + r);
  return Math.max(100, Math.round(n));
}
function im(e, t, r, n, i) {
  t === void 0 && (t = ve.retry.baseDelay), r === void 0 && (r = ve.retry.backoffMultiplier), n === void 0 && (n = ve.retry.jitterEnabled), i === void 0 && (i = ve.retry.jitterFactor);
  let o = Math.round(t * Math.pow(r, e - 1));
  return o > ve.retry.maxDelay && (o = ve.retry.maxDelay), n && (o = nm(o, i)), o;
}
function am(e) {
  e === void 0 && (e = {});
  const t = e.logger, r = e.onRetry, n = e.jitterEnabled !== void 0 ? e.jitterEnabled : ve.retry.jitterEnabled, i = e.jitterFactor || ve.retry.jitterFactor;
  let o = {
    totalExecutions: 0,
    successfulExecutions: 0,
    failedExecutions: 0,
    totalRetries: 0,
    successAfterRetry: 0
  };
  function l(a, s, u) {
    t && t[a] && t[a](s, u);
  }
  return {
    /**
     * execute — Executa função com retry
     * @param {Function} fn - Função a executar
     * @param {Object} retryConfig - Configuração de retry
     * @param {string} contextId - ID do contexto (ex: phaseId)
     * @returns {Promise} - Resultado da execução
     */
    execute: function(a, s, u) {
      const c = Xg(s), d = c.maxAttempts, f = c.baseDelay, g = c.backoffMultiplier;
      let h = 0;
      const p = Date.now(), A = c.jitterEnabled, T = c.jitterFactor;
      o.totalExecutions++;
      function S() {
        return h++, Promise.resolve().then(function() {
          return a();
        }).then(function(L) {
          const H = Date.now() - p;
          return o.successfulExecutions++, h > 1 && o.successAfterRetry++, s && s.returnResilienceResult ? Hi({
            outcome: h > 1 ? ft.SUCCESS_AFTER_RETRY : ft.SUCCESS,
            phaseId: u,
            attempt: h,
            duration: H,
            details: { result: L }
          }) : L;
        }).catch(function(L) {
          const H = h < d && c.enabled, E = L.type || L.code || "unknown", m = Qg(E, {
            phaseId: u,
            attempt: h,
            maxAttempts: d
          });
          if (H && m !== !1) {
            const v = im(h, f, g, A, T);
            return o.totalRetries++, r && r({
              attempt: h,
              maxAttempts: d,
              delay: v,
              contextId: u,
              jitterApplied: A,
              errorType: E
            }), l("warn", "Attempt " + h + " failed for " + u + ", retrying in " + v + "ms", {
              error: L.message,
              attempt: h,
              maxAttempts: d,
              nextDelay: v,
              jitterApplied: A,
              jitterFactor: T,
              errorType: E
            }), new Promise(function(w) {
              setTimeout(w, v);
            }).then(S);
          }
          if (o.failedExecutions++, s && s.returnResilienceResult)
            return Promise.reject(Hi({
              outcome: ft.RETRY_EXHAUSTED,
              phaseId: u,
              attempt: h,
              duration: Date.now() - p,
              error: L,
              details: {
                maxAttempts: d,
                errorType: E,
                policyAllowed: m
              }
            }));
          throw L;
        });
      }
      return S();
    },
    /**
     * getStats — Retorna estatísticas de execução
     * @returns {Object}
     */
    getStats: function() {
      return Object.assign({}, o);
    },
    /**
     * resetStats — Reseta estatísticas
     */
    resetStats: function() {
      o = {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        totalRetries: 0,
        successAfterRetry: 0
      };
    },
    /**
     * info — Informações do executor
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: tm,
        version: rm,
        jitterEnabled: n,
        jitterFactor: i,
        defaults: {
          maxAttempts: ve.retry.maxAttempts,
          baseDelay: ve.retry.baseDelay,
          backoffMultiplier: ve.retry.backoffMultiplier,
          maxDelay: ve.retry.maxDelay
        },
        stats: Object.assign({}, o),
        contractVersion: "1.0.0",
        improvements: ["#12-RetryWithJitter", "RESILIENCE-CONTRACT"]
      };
    }
  };
}
const Al = "degradation-handler", om = "2.4.0-DEGRADATION-CONTRACT";
function hi() {
  if (typeof window < "u") {
    if (window.RuntimeContext && window.RuntimeContext.isAuthenticated)
      try {
        return window.RuntimeContext.isAuthenticated();
      } catch {
      }
    if (typeof document < "u" && document.body && document.body.dataset)
      return document.body.dataset.state === "authenticated";
  }
  return !1;
}
function Sl(e) {
  e === void 0 && (e = {});
  const t = e.logger, r = e.moduleId || Al, n = e.metricsSummary, i = e.bootContext, o = [];
  function l(a, s, u) {
    t && t[a] && t[a](s, Object.assign({}, u, { module: r }));
  }
  return {
    /**
     * applyPolicy — Aplica política de degradação e retorna resultado padronizado
     * @param {string} phaseId - ID da fase
     * @param {object} manifestConfig - Configuração do manifest para a fase
     * @returns {object|null} - DegradationResult ou null se sem política
     */
    applyPolicy: function(a, s) {
      if (!s || !s.onFail) return null;
      const u = s.onFail, c = u.mode;
      l("info", "Applying degradation policy for " + a, {
        mode: c,
        message: u.message
      });
      const d = Eh({
        mode: c,
        phaseId: a,
        reason: u.message || "Phase degraded",
        details: {
          suppressWhenUnauth: s.suppressWhenUnauth || !1,
          originalPolicy: u
        }
      });
      return o.push(d), n && n.recordDegradation && n.recordDegradation(a, u.message || "Phase degraded"), i && l("info", "Degradation registered in BootContext", {
        phase: a,
        status: d.status,
        severity: d.severity,
        recoverable: d.recoverable
      }), d.notified = !0, d;
    },
    /**
     * shouldSuppressError — Verifica se erro deve ser suprimido
     * @param {string} phaseId - ID da fase
     * @param {object} manifestConfig - Configuração do manifest
     * @returns {boolean}
     */
    shouldSuppressError: function(a, s) {
      return !!(s && s.suppressWhenUnauth && !hi() || a === "phase-3-shell" && !hi());
    },
    /**
     * isAuthenticated — Expõe verificação de autenticação
     * @returns {boolean}
     */
    isAuthenticated: hi,
    /**
     * getAppliedPolicies — Retorna todas as políticas aplicadas
     * @returns {array}
     */
    getAppliedPolicies: function() {
      return o.slice();
    },
    /**
     * getAppliedPoliciesCount — Retorna contagem de políticas por status
     * @returns {object}
     */
    getAppliedPoliciesCount: function() {
      const a = {
        total: o.length,
        byStatus: {},
        bySeverity: {},
        recoverable: 0,
        nonRecoverable: 0
      };
      for (let s = 0; s < o.length; s++) {
        const u = o[s], c = u.status;
        a.byStatus[c] = (a.byStatus[c] || 0) + 1;
        const d = u.severity;
        a.bySeverity[d] = (a.bySeverity[d] || 0) + 1, u.recoverable ? a.recoverable++ : a.nonRecoverable++;
      }
      return a;
    },
    /**
     * reset — Limpa políticas aplicadas (para testes/reset)
     */
    reset: function() {
      o.length = 0, l("info", "Degradation handler reset");
    },
    /**
     * info — Informações do handler
     * @returns {object}
     */
    info: function() {
      return {
        moduleId: Al,
        version: om,
        handlerModuleId: r,
        appliedPoliciesCount: o.length,
        policiesSummary: this.getAppliedPoliciesCount(),
        isAuthenticated: hi(),
        contractVersion: "1.0.0",
        features: [
          "DEGRADATION-CONTRACT",
          "standardized-results",
          "policy-tracking",
          "auth-chain-AAA"
        ]
      };
    }
  };
}
const sm = "phase-executor", lm = "3.1.0-MODULAR", um = Object.freeze({
  failureThreshold: 2,
  successThreshold: 1,
  timeout: 6e4
});
function cm(e) {
  const t = e.logger, r = e.telemetry, n = e.eventEmitter, i = e.moduleId;
  return {
    log: function(o, l, a) {
      t && t[o] && t[o](l, Object.assign({}, a, { module: i }));
    },
    track: function(o, l) {
      r && r.track && r.track(o, Object.assign({}, l, { module: i }));
    },
    emit: function(o, l) {
      n && n.emit && n.emit(o, l);
    }
  };
}
function gi() {
  return typeof window < "u" && window.performance && window.performance.memory ? {
    usedJSHeapSize: window.performance.memory.usedJSHeapSize,
    totalJSHeapSize: window.performance.memory.totalJSHeapSize,
    timestamp: Date.now()
  } : null;
}
function dm(e) {
  return {
    resolve: function(t) {
      const r = e ? e(t.id) : null;
      return r || {
        id: t.id,
        name: t.name,
        critical: t.critical !== !1,
        recoverable: t.recoverable || !1,
        timeout: t.timeout || 3e4,
        retry: { enabled: !1, maxAttempts: 1, delay: 1e3, backoff: 1.5 },
        onFail: t.onFail || null,
        suppressWhenUnauth: t.suppressWhenUnauth || !1,
        circuitBreaker: t.circuitBreaker !== !1
      };
    }
  };
}
function fm(e) {
  const t = e.enabled !== !1, r = e.breakerConfig;
  return {
    isEnabled: function() {
      return t;
    },
    getPhaseBreaker: function(n) {
      return !t || !tt ? null : Wn("phase:" + n, r);
    },
    getAllPhaseBreakers: function() {
      if (!t || !tt)
        return {};
      const n = $n(), i = {};
      for (const o in n)
        o.indexOf("phase:") === 0 && (i[o] = n[o]);
      return i;
    },
    getStatus: function() {
      return !t || !tt ? { enabled: !1 } : {
        enabled: !0,
        breakers: this.getAllPhaseBreakers(),
        openCount: lt(),
        health: Dr()
      };
    }
  };
}
function hm(e) {
  const t = e.breakerManager, r = e.helpers, n = e.metrics, i = e.notificationsEnabled;
  return {
    canExecute: function(o, l) {
      if (!t.isEnabled())
        return { canExecute: !0 };
      if (l && l.circuitBreaker === !1)
        return { canExecute: !0 };
      const a = t.getPhaseBreaker(o);
      if (!a)
        return { canExecute: !0 };
      const s = a.canExecute();
      return s || (r.log("warn", "Phase " + o + " skipped - Circuit Breaker OPEN", {
        breakerState: a.getState(),
        stats: a.getStats()
      }), n.incrementCircuitBreakerTrips(), i && we && Es("phase:" + o, a.getStats())), {
        canExecute: s,
        breaker: a,
        state: a.getState()
      };
    }
  };
}
function gm(e) {
  const t = e.metricsSummary, r = e.healthAggregator, n = {
    phaseTimings: {},
    phasesExecuted: 0,
    phasesSucceeded: 0,
    phasesFailed: 0,
    phasesSkipped: 0,
    recoveries: 0,
    circuitBreakerTrips: 0,
    memoryMetrics: {}
  };
  return {
    recordPhase: function(i, o, l, a, s, u, c) {
      const d = Math.round(performance.now() - o);
      return n.phaseTimings[i] = d, n.phasesExecuted++, l === "success" ? n.phasesSucceeded++ : l === "skipped" ? n.phasesSkipped++ : n.phasesFailed++, u && c && (n.memoryMetrics[i] = {
        start: u.usedJSHeapSize,
        end: c.usedJSHeapSize,
        delta: c.usedJSHeapSize - u.usedJSHeapSize,
        duration: d
      }, r && r.capturePhaseMemory && (r.capturePhaseMemory(i, "start"), r.capturePhaseMemory(i, "end"))), t && t.recordPhase && t.recordPhase(i, {
        startTime: o,
        endTime: performance.now(),
        duration: d,
        status: l,
        modulesLoaded: a && a.initialized ? a.initialized.length : 0,
        modulesFailed: a && a.failed ? a.failed.length : 0,
        critical: s,
        memory: n.memoryMetrics[i] || null
      }), t && t.updateMemoryPeak && t.updateMemoryPeak(), d;
    },
    recordError: function(i, o) {
      t && t.recordError && t.recordError(i, o);
    },
    recordWarning: function(i, o) {
      t && t.recordWarning && t.recordWarning(i, o);
    },
    incrementRecoveries: function() {
      n.recoveries++;
    },
    incrementCircuitBreakerTrips: function() {
      n.circuitBreakerTrips++;
    },
    getPhaseMemory: function(i) {
      return n.memoryMetrics[i] || null;
    },
    getMemoryMetrics: function() {
      return Object.assign({}, n.memoryMetrics);
    },
    getMetrics: function() {
      return Object.assign({}, n);
    },
    reset: function() {
      n.phaseTimings = {}, n.phasesExecuted = 0, n.phasesSucceeded = 0, n.phasesFailed = 0, n.phasesSkipped = 0, n.recoveries = 0, n.circuitBreakerTrips = 0, n.memoryMetrics = {};
    }
  };
}
function mm(e, t) {
  t === void 0 && (t = {});
  const r = t.resolveGlobal || null, n = t.logger || null;
  return {
    check: function(i) {
      if (i.dependsOn && i.dependsOn.length)
        for (let o = 0; o < i.dependsOn.length; o++) {
          const l = i.dependsOn[o], a = e[l];
          if (!a || a.status !== "success" && a.status !== "recovered")
            return {
              satisfied: !1,
              missingDependency: l
            };
        }
      if (r && i.id) {
        const o = Tc(i.id, r);
        if (!o.satisfied)
          return {
            satisfied: !1,
            missingDependency: "required globals: " + o.missingRequired.join(", "),
            missingGlobals: o.missingRequired,
            type: "required_globals"
          };
        if (o.missingOptional.length > 0 && n)
          try {
            n.warn("[dependency-checker] Phase " + i.id + " — optional globals missing: " + o.missingOptional.join(", "));
          } catch {
          }
      }
      return { satisfied: !0 };
    }
  };
}
function pm(e) {
  const t = e.helpers, r = e.phaseMetrics, n = e.phaseResults;
  return {
    handle: function(i) {
      const o = i.phaseId, l = i.phaseStart, a = i.result, s = i.critical, u = i.memoryStart, c = i.memoryEnd, d = i.bootContext, f = i.setState, g = r.recordPhase(o, l, "success", a, s, u, c);
      return n[o] = { status: "success", result: a, time: g }, d && d.setPhaseResult(o, {
        success: !0,
        recovered: !1,
        degraded: !1,
        time: g,
        memory: r.getPhaseMemory(o)
      }), f(Le.PHASE_COMPLETE), t.log("info", "Phase " + o + " complete", {
        time: g,
        memoryDelta: r.getPhaseMemory(o) ? r.getPhaseMemory(o).delta : null
      }), t.emit(ke.PHASE_COMPLETE, { phaseId: o, result: a, time: g }), t.track("phase-complete", { phaseId: o, time: g }), { success: !0, result: a, time: g };
    }
  };
}
const re = Object.freeze({
  // ─────────────────────────────────────────────────────────────
  // ERROR OUTCOMES
  // ─────────────────────────────────────────────────────────────
  RECOVER: "recover",
  // Phase has recover() and is recoverable
  SUPPRESS: "suppress",
  // Error suppressed by policy
  FAIL_CRITICAL: "fail-critical",
  // Critical failure, boot stops
  FAIL_SOFT: "fail-soft",
  // Non-critical, boot continues
  ROLLBACK_THEN_SUPPRESS: "rollback-then-suppress",
  // Rollback first, then suppress
  ROLLBACK_THEN_FAIL: "rollback-then-fail",
  // Rollback first, then fail
  // ─────────────────────────────────────────────────────────────
  // SKIP OUTCOMES
  // ─────────────────────────────────────────────────────────────
  SKIP_CIRCUIT_OPEN: "skip-circuit-open",
  // Circuit breaker is open
  SKIP_DEPENDENCY_MISSING: "skip-dependency-missing",
  // Required dependency missing
  SKIP_OPTIONAL: "skip-optional",
  // Optional phase skipped
  SKIP_UNAUTH: "skip-unauth",
  // Skipped because not authenticated
  // ─────────────────────────────────────────────────────────────
  // PROCEED OUTCOMES
  // ─────────────────────────────────────────────────────────────
  PROCEED: "proceed",
  // Normal execution
  PROCEED_DEGRADED: "proceed-degraded",
  // Proceed in degraded mode
  // ─────────────────────────────────────────────────────────────
  // SUPPRESSION OUTCOMES
  // ─────────────────────────────────────────────────────────────
  SUPPRESS_UNAUTH: "suppress-unauth",
  // Suppressed because not authenticated
  SUPPRESS_POLICY: "suppress-policy",
  // Suppressed by explicit policy
  // ─────────────────────────────────────────────────────────────
  // DEPENDENCY OUTCOMES
  // ─────────────────────────────────────────────────────────────
  DEPS_SATISFIED: "deps-satisfied",
  // All dependencies met
  DEPS_MISSING_CRITICAL: "deps-missing-critical",
  // Critical dependency missing
  DEPS_MISSING_OPTIONAL: "deps-missing-optional"
  // Optional dependency missing
}), ge = Object.freeze({
  ERROR: "error",
  RECOVERY: "recovery",
  SKIP: "skip",
  SUPPRESSION: "suppression",
  DEPENDENCY: "dependency",
  PROCEED: "proceed"
});
Object.values(re);
Object.values(ge);
function Em(e) {
  if (!e)
    return Se({
      outcome: re.FAIL_SOFT,
      reason: "No input provided",
      context: ge.ERROR
    });
  const t = !!e.recoverable, r = !!e.hasRecover, n = !!e.critical, i = !!e.shouldSuppress;
  return Se(t && r ? {
    outcome: re.RECOVER,
    reason: "Phase is recoverable and has recover() method",
    context: ge.ERROR
  } : n ? i ? {
    outcome: re.SUPPRESS,
    reason: "Critical phase but suppression policy allows continuation",
    context: ge.ERROR
  } : {
    outcome: re.FAIL_CRITICAL,
    reason: "Critical phase failed with no recovery or suppression",
    context: ge.ERROR
  } : {
    outcome: re.FAIL_SOFT,
    reason: "Non-critical phase failed, boot continues",
    context: ge.ERROR
  });
}
function vm(e) {
  if (!e)
    return Se({
      outcome: re.FAIL_SOFT,
      reason: "No input provided",
      context: ge.RECOVERY
    });
  const t = !!e.critical, r = !!e.shouldSuppress, n = !!e.hasRollback;
  return Se(t ? r ? {
    outcome: n ? re.ROLLBACK_THEN_SUPPRESS : re.SUPPRESS,
    reason: "Recovery failed but suppression allows continuation" + (n ? " (with rollback)" : ""),
    context: ge.RECOVERY
  } : {
    outcome: n ? re.ROLLBACK_THEN_FAIL : re.FAIL_CRITICAL,
    reason: "Recovery failed, critical phase cannot continue" + (n ? " (with rollback)" : ""),
    context: ge.RECOVERY
  } : {
    outcome: re.FAIL_SOFT,
    reason: "Recovery failed but phase is non-critical",
    context: ge.RECOVERY
  });
}
function ym(e) {
  if (!e)
    return Se({
      outcome: re.PROCEED,
      reason: "No input provided, proceeding",
      context: ge.SKIP,
      shouldSkip: !1
    });
  const t = !!e.circuitOpen, r = !!e.dependencyMissing, n = !!e.optional, i = e.authenticated !== !1, o = e.phaseId || "unknown";
  return t ? Se({
    outcome: re.SKIP_CIRCUIT_OPEN,
    reason: "Circuit breaker is open for " + o,
    context: ge.SKIP,
    shouldSkip: !0
  }) : r ? Se({
    outcome: re.SKIP_DEPENDENCY_MISSING,
    reason: "Required dependency missing for " + o,
    context: ge.SKIP,
    shouldSkip: !0
  }) : !i && (o === "phase-3-shell" || o === "phase-4-main") ? Se({
    outcome: re.SKIP_UNAUTH,
    reason: "Phase " + o + " skipped because not authenticated",
    context: ge.SKIP,
    shouldSkip: !0
  }) : n && e.skipOptional ? Se({
    outcome: re.SKIP_OPTIONAL,
    reason: "Optional phase " + o + " skipped by configuration",
    context: ge.SKIP,
    shouldSkip: !0
  }) : Se({
    outcome: re.PROCEED,
    reason: "All checks passed, proceeding with " + o,
    context: ge.SKIP,
    shouldSkip: !1
  });
}
function Ol(e) {
  if (!e)
    return Se({
      outcome: re.FAIL_SOFT,
      reason: "No input provided",
      context: ge.SUPPRESSION,
      shouldSuppress: !1
    });
  const t = e.phaseId || "unknown", r = !!e.authenticated, n = !!e.suppressWhenUnauth, i = !!e.suppressPolicy;
  return Se(n && !r ? {
    outcome: re.SUPPRESS_UNAUTH,
    reason: "Suppressed because not authenticated (suppressWhenUnauth)",
    context: ge.SUPPRESSION,
    shouldSuppress: !0,
    phaseId: t
  } : t === "phase-3-shell" && !r ? {
    outcome: re.SUPPRESS_UNAUTH,
    reason: "phase-3-shell suppressed because not authenticated",
    context: ge.SUPPRESSION,
    shouldSuppress: !0,
    phaseId: t
  } : i ? {
    outcome: re.SUPPRESS_POLICY,
    reason: "Suppressed by explicit policy",
    context: ge.SUPPRESSION,
    shouldSuppress: !0,
    phaseId: t
  } : {
    outcome: re.PROCEED,
    reason: "No suppression conditions met",
    context: ge.SUPPRESSION,
    shouldSuppress: !1,
    phaseId: t
  });
}
function Se(e) {
  e || (e = {});
  const t = {
    outcome: e.outcome || re.PROCEED,
    reason: e.reason || "No reason provided",
    context: e.context || ge.PROCEED,
    timestamp: e.timestamp || Date.now()
  };
  return e.shouldSkip !== void 0 && (t.shouldSkip = e.shouldSkip), e.shouldSuppress !== void 0 && (t.shouldSuppress = e.shouldSuppress), e.canProceed !== void 0 && (t.canProceed = e.canProceed), e.missingDeps !== void 0 && (t.missingDeps = e.missingDeps), e.phaseId !== void 0 && (t.phaseId = e.phaseId), t;
}
const Am = "suppression-handler", Sm = "3.2.0-DECISION-CONTRACT";
function Om(e) {
  const t = e.helpers, r = e.phaseMetrics, n = e.phaseResults, i = e.degradationHandler, o = e.notificationsEnabled !== !1;
  return {
    /**
     * handle — Handle phase suppression
     * @param {Object} context - Phase context
     * @returns {Object} - Suppression result
     */
    handle: function(l) {
      const a = l.phaseId, s = l.phaseStart, u = l.manifestConfig, c = l.bootContext, d = l.authenticated;
      l.error;
      const f = Date.now() - s, g = Ol({
        phaseId: a,
        authenticated: d,
        suppressWhenUnauth: u && u.suppressWhenUnauth
      });
      t.log("info", "Suppressing phase " + a + " due to unauth", {
        decision: g.outcome,
        reason: g.reason
      }), c && c.registerSuppressedPhase(a, {
        reason: g.reason,
        decision: g.outcome,
        time: f,
        degraded: !0
      }), i && i.applyPolicy(a, u), o && we && Tn && Tn(a, "Suppressed due to unauth"), r.record(a, "suppressed", f);
      const h = {
        success: !0,
        recovered: !0,
        degraded: !0,
        suppressed: !0,
        time: f,
        decision: g.outcome,
        reason: g.reason
      };
      return n.set(a, h), {
        success: !0,
        recovered: !0,
        degraded: !0,
        time: f,
        decision: g
      };
    },
    /**
     * shouldSuppress — Check if phase should be suppressed
     * @param {Object} context - Phase context
     * @returns {boolean}
     */
    shouldSuppress: function(l) {
      return Ol({
        phaseId: l.phaseId,
        authenticated: l.authenticated,
        suppressWhenUnauth: l.manifestConfig && l.manifestConfig.suppressWhenUnauth
      }).shouldSuppress === !0;
    },
    /**
     * info — Module info
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: Am,
        version: Sm,
        contractVersion: "1.0.0",
        usesDecisionContract: !0
      };
    }
  };
}
re.RECOVER, re.SUPPRESS, re.FAIL_CRITICAL, re.FAIL_SOFT, re.ROLLBACK_THEN_SUPPRESS, re.ROLLBACK_THEN_FAIL;
function Im(e) {
  const t = Em(e);
  return {
    outcome: t.outcome,
    reason: t.reason
  };
}
function Tm(e) {
  const t = vm(e);
  return {
    outcome: t.outcome,
    reason: t.reason
  };
}
function bm(e) {
  const t = e.helpers, r = e.phaseMetrics, n = e.phaseResults, i = e.degradationHandler, o = e.suppressionHandler, l = e.notificationsEnabled, a = e.rollbackExecutor;
  function s(c, d) {
    if (!a)
      return t.log("debug", "No rollback executor configured, skipping rollback for: " + c), { skipped: !0, reason: "no-executor" };
    t.log("info", "Executing rollback for phase: " + c), t.emit(ke.PHASE_ROLLBACK_START || "phase:rollback:start", { phaseId: c });
    try {
      const f = a.rollbackPhase(c);
      return t.log("info", "Rollback completed for phase: " + c, {
        success: f.success,
        effectsReverted: f.effectsReverted,
        effectsFailed: f.effectsFailed
      }), t.emit(ke.PHASE_ROLLBACK_COMPLETE || "phase:rollback:complete", {
        phaseId: c,
        result: f
      }), l && we && Pi && Pi(c, f), f;
    } catch (f) {
      return t.log("error", "Rollback failed for phase: " + c, { error: f.message }), t.emit(ke.PHASE_ROLLBACK_ERROR || "phase:rollback:error", {
        phaseId: c,
        error: f.message
      }), { success: !1, error: f.message };
    }
  }
  function u(c, d, f) {
    const g = c.phaseId, h = c.phase, p = c.ports, A = c.manifestConfig, T = c.bootContext, S = c.setState, L = c.critical;
    return S(Le.RECOVERING), r.incrementRecoveries(), Promise.resolve(h.recover(d, p)).then(function() {
      return t.log("info", "Phase " + g + " recovered"), n[g] = { status: "recovered", error: d.message, time: f }, T && T.setPhaseResult(g, {
        success: !0,
        recovered: !0,
        degraded: !0,
        time: f,
        error: d.message,
        memory: r.getPhaseMemory(g)
      }), i.applyPolicy(g, A), t.emit(ke.RECOVERY, { phaseId: g }), l && we && Tn(g, "Recovered from error: " + d.message), { success: !0, recovered: !0, time: f };
    }).catch(function(H) {
      t.log("error", "Phase " + g + " recovery failed", { error: H.message });
      const E = Tm({
        critical: L,
        shouldSuppress: i.shouldSuppressError(g, A),
        hasRollback: !!a
      });
      t.log("info", "Recovery failure outcome decided", {
        phaseId: g,
        outcome: E.outcome,
        reason: E.reason
      });
      let m = null;
      if ((E.outcome === "rollback-then-suppress" || E.outcome === "rollback-then-fail") && (m = s(g)), E.outcome === "suppress" || E.outcome === "rollback-then-suppress")
        return o.handle({
          phaseId: g,
          error: d,
          phaseTime: f,
          manifestConfig: A,
          bootContext: T,
          setState: S,
          rollbackResult: m
        });
      if (E.outcome === "fail-critical" || E.outcome === "rollback-then-fail")
        throw T && T.setPhaseResult(g, {
          success: !1,
          recovered: !1,
          rolledBack: m && m.success,
          time: f,
          error: d.message
        }), S(Le.FAILED), new Error("Critical phase failed: " + g);
      return T && T.setPhaseResult(g, {
        success: !1,
        recovered: !1,
        rolledBack: m && m.success,
        time: f,
        error: d.message
      }), { success: !1, error: d.message, time: f, rollback: m };
    });
  }
  return {
    handle: function(c, d, f) {
      const g = c.phaseId, h = c.phaseStart, p = c.phase, A = c.critical, T = c.recoverable, S = c.manifestConfig, L = c.bootContext, H = c.setState, E = c.memoryStart, m = c.breaker, v = r.recordPhase(g, h, "failed", null, A, E, f);
      n[g] = { status: "failed", error: d.message, time: v }, r.recordError(d, { phaseId: g, critical: A }), t.log("error", "Phase " + g + " failed", {
        error: d.message,
        time: v,
        circuitBreakerState: m ? m.getState() : "n/a"
      }), t.emit(ke.PHASE_ERROR, { phaseId: g, error: d.message }), t.track("phase-error", { phaseId: g, error: d.message }), l && we && ps(g, d.message, A);
      const w = Im({
        recoverable: T,
        hasRecover: !!(p && p.recover),
        critical: A,
        shouldSuppress: i.shouldSuppressError(g, S)
      });
      if (t.log("info", "Error outcome decided", {
        phaseId: g,
        outcome: w.outcome,
        reason: w.reason
      }), w.outcome === "recover")
        return u(c, d, v);
      const y = s(g);
      if (w.outcome === "suppress")
        return o.handle({
          phaseId: g,
          error: d,
          phaseTime: v,
          manifestConfig: S,
          bootContext: L,
          setState: H,
          rollbackResult: y
        });
      if (w.outcome === "fail-critical")
        throw L && L.setPhaseResult(g, {
          success: !1,
          recovered: !1,
          rolledBack: y && y.success,
          time: v,
          error: d.message
        }), H(Le.FAILED), new Error("Critical phase failed: " + g);
      return L && L.setPhaseResult(g, {
        success: !1,
        recovered: !1,
        rolledBack: y && y.success,
        time: v,
        error: d.message
      }), { success: !1, error: d.message, time: v, rollback: y };
    },
    // Sprint 6 #8: Expor método de rollback para uso externo
    executeRollback: s
  };
}
const Rm = "skip-handler", wm = "3.2.0-DECISION-CONTRACT";
function Dm(e) {
  const t = e.helpers, r = e.phaseMetrics, n = e.phaseResults, i = e.degradationHandler;
  return {
    /**
     * handle — Handle circuit breaker OPEN skip
     * @param {Object} context - Phase context
     * @returns {Object} - Skip result
     */
    handle: function(o) {
      const l = o.phaseId, a = o.phaseStart, s = o.critical, u = o.manifestConfig, c = o.bootContext, d = Date.now() - a, f = ym({
        circuitOpen: !0,
        phaseId: l,
        optional: !s
      });
      t.log("warn", "Phase " + l + " skipped (Circuit Breaker OPEN)", {
        decision: f.outcome,
        reason: f.reason
      }), r.record(l, "skipped", d), t.emit(ke.PHASE_SKIPPED, {
        phaseId: l,
        reason: "circuit-breaker-open",
        decision: f.outcome,
        time: d
      }), c && c.registerSkippedPhase(l, {
        reason: "circuit-breaker-open",
        decision: f.outcome,
        time: d,
        degraded: !0
      }), i && i.applyPolicy(l, u);
      const g = {
        success: !0,
        skipped: !0,
        degraded: !0,
        time: d,
        decision: f.outcome,
        reason: f.reason
      };
      return n.set(l, g), s ? (t.log("error", "Critical phase " + l + " was skipped", {
        decision: f.outcome
      }), {
        success: !0,
        skipped: !0,
        degraded: !0,
        critical: !0,
        time: d,
        decision: f
      }) : {
        success: !0,
        skipped: !0,
        degraded: !0,
        time: d,
        decision: f
      };
    },
    /**
     * info — Module info
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: Rm,
        version: wm,
        contractVersion: "1.0.0",
        usesDecisionContract: !0
      };
    }
  };
}
function Cm(e) {
  var t = e.helpers, r = e.configResolver, n = e.executionGuard, i = e.dependencyChecker, o = e.successHandler, l = e.errorHandler, a = e.skipHandler, s = e.retryExecutor, u = e.breakerManager, c = e.rollbackRegistry;
  return {
    execute: function(d, f, g, h) {
      var p = d.id, A = performance.now(), T = gi(), S = r.resolve(d), L = S.critical, H = S.recoverable || d.recoverable, E = S.retry || { enabled: !1, maxAttempts: 1 }, m = n.canExecute(p, S);
      if (!m.canExecute) {
        var v = gi();
        return a.handle({
          phaseId: p,
          phaseStart: A,
          critical: L,
          manifestConfig: S,
          bootContext: g,
          breakerState: m.state,
          memoryStart: T,
          memoryEnd: v
        });
      }
      h(Le.PHASE_EXECUTING);
      var w = null;
      c && (w = c.startPhase(p)), t.log("info", "Phase " + p + " starting", {
        name: d.name,
        modules: d.modules ? d.modules.length : 0,
        critical: L,
        retryEnabled: E.enabled,
        circuitBreakerEnabled: u.isEnabled() && S.circuitBreaker !== !1,
        rollbackEnabled: !!c,
        memoryAtStart: T ? T.usedJSHeapSize : null
      }), t.emit(ke.PHASE_START, { phaseId: p, name: d.name }), t.track("phase-start", { phaseId: p, name: d.name });
      var y = function() {
        return Promise.resolve().then(function() {
          var P = i.check(d);
          if (!P.satisfied)
            throw new Error("Dependency not met: " + P.missingDependency);
          var C = Object.assign({}, f, {
            effectTracker: w
          });
          return d.execute(C);
        });
      }, R = m.breaker, O;
      R && u.isEnabled() ? O = R.execute(function() {
        return s.execute(y, E, p);
      }) : O = s.execute(y, E, p);
      var b = {
        phaseId: p,
        phaseStart: A,
        phase: d,
        ports: f,
        critical: L,
        recoverable: H,
        manifestConfig: S,
        bootContext: g,
        setState: h,
        memoryStart: T,
        breaker: R,
        effectTracker: w
      };
      return O.then(function(P) {
        var C = gi();
        if (c && c.hasEffects(p)) {
          var $ = c.info(), Y = $.phases.find(function(D) {
            return D.phaseId === p;
          });
          t.log("debug", "Phase " + p + " registered effects for potential rollback", {
            effectCount: Y ? Y.effectCount : 0
          });
        }
        return o.handle(Object.assign({}, b, {
          result: P,
          memoryEnd: C
        }));
      }).catch(function(P) {
        var C = gi();
        return l.handle(b, P, C);
      });
    }
  };
}
function Lm(e) {
  var t = e.moduleId, r = e.phaseResults, n = e.phaseMetrics, i = e.breakerManager, o = e.circuitBreakerEnabled, l = e.notificationsEnabled;
  return {
    getPhaseCircuitBreaker: function(a) {
      return i.getPhaseBreaker(a);
    },
    getCircuitBreakerStatus: function() {
      return i.getStatus();
    },
    getMemoryMetrics: function() {
      return n.getMemoryMetrics();
    },
    getPhaseResult: function(a) {
      return r[a];
    },
    getPhaseResults: function() {
      return Object.assign({}, r);
    },
    getMetrics: function() {
      return n.getMetrics();
    },
    reset: function() {
      for (var a in r)
        delete r[a];
      n.reset();
    },
    info: function() {
      return {
        moduleId: t,
        version: lm,
        modular: !0,
        circuitBreakerEnabled: o,
        notificationsEnabled: l,
        metrics: n.getMetrics(),
        circuitBreaker: i.getStatus(),
        improvements: ["#3-CircuitBreakerIntegration", "#6-MemoryMetrics", "#25-DegradationNotifier", "MODULAR-ARCHITECTURE"]
      };
    }
  };
}
var _m = "1.0.1-CONTRACTS", Il = "rollback-registry", be = Object.freeze({
  WINDOW_PROPERTY: "window-property",
  GLOBAL_OBJECT: "global-object",
  DOM_ELEMENT: "dom-element",
  EVENT_LISTENER: "event-listener",
  INTERVAL: "interval",
  TIMEOUT: "timeout",
  STORAGE: "storage",
  CUSTOM: "custom"
});
function Nm(e) {
  e === void 0 && (e = {});
  var t = e.logger, r = e.maxEffectsPerPhase || 100, n = /* @__PURE__ */ new Map(), i = {
    totalRegistered: 0,
    totalRolledBack: 0,
    byType: {},
    byPhase: {}
  };
  function o(h, p, A) {
    t && t[h] && t[h]("[" + Il + "] " + p, A);
  }
  function l(h, p) {
    i.totalRegistered++, i.byType[h] = (i.byType[h] || 0) + 1, i.byPhase[p] = (i.byPhase[p] || 0) + 1;
  }
  function a(h) {
    return n.has(h) || (n.set(h, []), o("debug", "Started tracking phase: " + h)), {
      register: function(p) {
        return s(h, p);
      },
      // Helpers de conveniência
      windowProperty: function(p, A) {
        return s(h, {
          type: be.WINDOW_PROPERTY,
          key: p,
          previousValue: A,
          hadPrevious: A !== void 0
        });
      },
      globalObject: function(p, A) {
        return s(h, {
          type: be.GLOBAL_OBJECT,
          path: p,
          previousValue: A,
          hadPrevious: A !== void 0
        });
      },
      domElement: function(p, A) {
        return s(h, {
          type: be.DOM_ELEMENT,
          element: p,
          parent: A || (p ? p.parentNode : null)
        });
      },
      eventListener: function(p, A, T, S) {
        return s(h, {
          type: be.EVENT_LISTENER,
          target: p,
          event: A,
          handler: T,
          options: S
        });
      },
      interval: function(p) {
        return s(h, {
          type: be.INTERVAL,
          intervalId: p
        });
      },
      timeout: function(p) {
        return s(h, {
          type: be.TIMEOUT,
          timeoutId: p
        });
      },
      storage: function(p, A, T) {
        return s(h, {
          type: be.STORAGE,
          storageType: p,
          key: A,
          previousValue: T,
          hadPrevious: T !== void 0
        });
      },
      custom: function(p, A) {
        return s(h, {
          type: be.CUSTOM,
          rollbackFn: p,
          description: A || "custom-effect"
        });
      }
    };
  }
  function s(h, p) {
    n.has(h) || n.set(h, []);
    var A = n.get(h);
    if (A.length >= r)
      return o("warn", "Max effects reached for phase: " + h, { max: r }), !1;
    var T = {
      id: h + "-" + A.length,
      type: p.type,
      data: p,
      registeredAt: Date.now()
    };
    return A.push(T), l(p.type, h), o("debug", "Registered effect", { phaseId: h, type: p.type, id: T.id }), T.id;
  }
  function u(h) {
    var p = n.get(h);
    return p ? p.slice().reverse() : [];
  }
  function c(h) {
    var p = n.get(h);
    return p ? (i.totalRolledBack += p.length, n.delete(h), o("debug", "Cleared phase: " + h, { effectsCleared: p.length }), !0) : !1;
  }
  function d(h) {
    var p = n.get(h);
    return p && p.length > 0;
  }
  function f() {
    n.clear(), i.totalRegistered = 0, i.totalRolledBack = 0, i.byType = {}, i.byPhase = {}, o("info", "Registry reset");
  }
  function g() {
    var h = [];
    return n.forEach(function(p, A) {
      h.push({ phaseId: A, effectCount: p.length });
    }), {
      moduleId: Il,
      version: _m,
      trackedPhases: n.size,
      phases: h,
      metrics: Object.assign({}, i),
      effectTypes: Object.keys(be)
    };
  }
  return {
    startPhase: a,
    registerEffect: s,
    getEffects: u,
    clearPhase: c,
    hasEffects: d,
    reset: f,
    info: g,
    EFFECT_TYPES: be
  };
}
var Mm = "1.0.1-CONTRACTS", Tl = "rollback-executor";
function Pm(e) {
  e === void 0 && (e = {});
  var t = e.logger, r = e.registry, n = e.eventEmitter, i = e.continueOnError !== !1, o = {
    rollbacksExecuted: 0,
    effectsReverted: 0,
    effectsFailed: 0,
    byType: {}
  };
  function l(E, m, v) {
    t && t[E] && t[E]("[" + Tl + "] " + m, v);
  }
  function a(E, m) {
    n && n.emit && n.emit(E, m);
  }
  function s(E) {
    var m = E.data;
    return m.hadPrevious ? window[m.key] = m.previousValue : delete window[m.key], { success: !0, action: m.hadPrevious ? "restored" : "deleted" };
  }
  function u(E) {
    for (var m = E.data, v = m.path.split("."), w = window, y = 0; y < v.length - 1; y++)
      if (w && w[v[y]])
        w = w[v[y]];
      else
        return { success: !1, reason: "path-not-found" };
    var R = v[v.length - 1];
    return m.hadPrevious ? w[R] = m.previousValue : delete w[R], { success: !0, action: m.hadPrevious ? "restored" : "deleted" };
  }
  function c(E) {
    var m = E.data;
    return m.element && m.element.parentNode ? (m.element.parentNode.removeChild(m.element), { success: !0, action: "removed" }) : { success: !1, reason: "element-not-in-dom" };
  }
  function d(E) {
    var m = E.data;
    if (m.target && m.handler)
      try {
        return m.target.removeEventListener(m.event, m.handler, m.options), { success: !0, action: "removed" };
      } catch (v) {
        return { success: !1, reason: v.message };
      }
    return { success: !1, reason: "invalid-listener-data" };
  }
  function f(E) {
    var m = E.data;
    return m.intervalId ? (clearInterval(m.intervalId), { success: !0, action: "cleared" }) : { success: !1, reason: "no-interval-id" };
  }
  function g(E) {
    var m = E.data;
    return m.timeoutId ? (clearTimeout(m.timeoutId), { success: !0, action: "cleared" }) : { success: !1, reason: "no-timeout-id" };
  }
  function h(E) {
    var m = E.data, v = m.storageType === "session" ? sessionStorage : localStorage;
    try {
      return m.hadPrevious ? v.setItem(m.key, m.previousValue) : v.removeItem(m.key), { success: !0, action: m.hadPrevious ? "restored" : "removed" };
    } catch (w) {
      return { success: !1, reason: w.message };
    }
  }
  function p(E) {
    var m = E.data;
    if (typeof m.rollbackFn == "function")
      try {
        return m.rollbackFn(), { success: !0, action: "custom-executed" };
      } catch (v) {
        return { success: !1, reason: v.message };
      }
    return { success: !1, reason: "no-rollback-function" };
  }
  function A(E) {
    var m;
    switch (E.type) {
      case be.WINDOW_PROPERTY:
        m = s(E);
        break;
      case be.GLOBAL_OBJECT:
        m = u(E);
        break;
      case be.DOM_ELEMENT:
        m = c(E);
        break;
      case be.EVENT_LISTENER:
        m = d(E);
        break;
      case be.INTERVAL:
        m = f(E);
        break;
      case be.TIMEOUT:
        m = g(E);
        break;
      case be.STORAGE:
        m = h(E);
        break;
      case be.CUSTOM:
        m = p(E);
        break;
      default:
        m = { success: !1, reason: "unknown-effect-type" };
    }
    return m.success ? o.effectsReverted++ : o.effectsFailed++, o.byType[E.type] = (o.byType[E.type] || 0) + 1, m;
  }
  function T(E) {
    if (!r)
      return l("error", "No registry provided"), { success: !1, reason: "no-registry" };
    var m = r.getEffects(E);
    if (m.length === 0)
      return l("debug", "No effects to rollback for phase: " + E), { success: !0, effectsReverted: 0, effectsFailed: 0 };
    l("info", "Starting rollback for phase: " + E, { effectCount: m.length }), a("rollback-start", { phaseId: E, effectCount: m.length });
    for (var v = [], w = 0, y = 0, R = 0; R < m.length; R++) {
      var O = m[R];
      try {
        var b = A(O);
        if (v.push({
          effectId: O.id,
          type: O.type,
          success: b.success,
          action: b.action,
          reason: b.reason
        }), b.success)
          w++, l("debug", "Reverted effect", { effectId: O.id, type: O.type, action: b.action });
        else if (y++, l("warn", "Failed to revert effect", { effectId: O.id, type: O.type, reason: b.reason }), !i)
          break;
      } catch (C) {
        if (y++, v.push({
          effectId: O.id,
          type: O.type,
          success: !1,
          reason: C.message
        }), l("error", "Error reverting effect", { effectId: O.id, error: C.message }), !i)
          break;
      }
    }
    r.clearPhase(E), o.rollbacksExecuted++;
    var P = {
      success: y === 0,
      phaseId: E,
      effectsReverted: w,
      effectsFailed: y,
      totalEffects: m.length,
      results: v
    };
    return l("info", "Rollback complete for phase: " + E, {
      reverted: w,
      failed: y,
      success: P.success
    }), a("rollback-complete", P), P;
  }
  function S(E) {
    for (var m = [], v = 0, w = 0, y = E.length - 1; y >= 0; y--) {
      var R = T(E[y]);
      m.push(R), v += R.effectsReverted, w += R.effectsFailed;
    }
    return {
      success: w === 0,
      phasesRolledBack: E.length,
      totalReverted: v,
      totalFailed: w,
      results: m
    };
  }
  function L() {
    o.rollbacksExecuted = 0, o.effectsReverted = 0, o.effectsFailed = 0, o.byType = {};
  }
  function H() {
    return {
      moduleId: Tl,
      version: Mm,
      metrics: Object.assign({}, o),
      continueOnError: i,
      hasRegistry: !!r
    };
  }
  return {
    revertEffect: A,
    rollbackPhase: T,
    rollbackPhases: S,
    reset: L,
    info: H,
    getMetrics: function() {
      return Object.assign({}, o);
    }
  };
}
function bl(e) {
  e === void 0 && (e = {});
  var t = e.moduleId || sm, r = e.circuitBreakerEnabled !== !1, n = e.circuitBreakerConfig || um, i = e.notificationsEnabled !== !1, o = e.rollbackEnabled !== !1, l = e.windowAdapter || null, a = null, s = cm({
    logger: e.logger,
    telemetry: e.telemetry,
    eventEmitter: e.eventEmitter,
    moduleId: t
  }), u = dm(e.getPhaseConfig), c = gm({
    metricsSummary: e.metricsSummary,
    healthAggregator: e.healthAggregator
  }), d = fm({
    enabled: r,
    breakerConfig: n
  }), f = hm({
    breakerManager: d,
    helpers: s,
    metrics: c,
    notificationsEnabled: i
  }), g = {};
  l && typeof l.get == "function" && (a = function(v) {
    return l.get(v);
  });
  var h = mm(g, {
    resolveGlobal: a,
    logger: e.logger
  }), p = null, A = null;
  o && (p = Nm({
    logger: e.logger,
    maxEffectsPerPhase: e.maxEffectsPerPhase || 100
  }), A = Pm({
    logger: e.logger,
    registry: p,
    eventEmitter: e.eventEmitter,
    continueOnError: e.rollbackContinueOnError !== !1
  }), s.log("info", "Rollback system initialized", {
    enabled: !0,
    maxEffectsPerPhase: e.maxEffectsPerPhase || 100
  }));
  var T = Om({
    helpers: s,
    phaseMetrics: c,
    phaseResults: g,
    // @ts-expect-error strict migration — TS2322
    degradationHandler: e.degradationHandler,
    notificationsEnabled: i
  }), S = pm({
    helpers: s,
    phaseMetrics: c,
    phaseResults: g
  }), L = bm({
    helpers: s,
    phaseMetrics: c,
    phaseResults: g,
    // @ts-expect-error strict migration — TS2322
    degradationHandler: e.degradationHandler,
    suppressionHandler: T,
    notificationsEnabled: i,
    rollbackExecutor: A
  }), H = Dm({
    helpers: s,
    phaseMetrics: c,
    phaseResults: g,
    // @ts-expect-error strict migration — TS2322
    degradationHandler: e.degradationHandler
  }), E = Cm({
    helpers: s,
    configResolver: u,
    executionGuard: f,
    dependencyChecker: h,
    successHandler: S,
    errorHandler: L,
    skipHandler: H,
    // @ts-expect-error strict migration — TS2322
    retryExecutor: e.retryExecutor,
    breakerManager: d,
    // @ts-expect-error strict migration — TS2322
    rollbackRegistry: p
  }), m = Lm({
    moduleId: t,
    phaseResults: g,
    phaseMetrics: c,
    breakerManager: d,
    circuitBreakerEnabled: r,
    notificationsEnabled: i
  });
  return {
    execute: E.execute,
    getPhaseCircuitBreaker: m.getPhaseCircuitBreaker,
    getCircuitBreakerStatus: m.getCircuitBreakerStatus,
    getMemoryMetrics: m.getMemoryMetrics,
    getPhaseResult: m.getPhaseResult,
    getPhaseResults: m.getPhaseResults,
    getMetrics: m.getMetrics,
    reset: function() {
      m.reset(), p && p.reset(), A && A.reset();
    },
    info: function() {
      var v = m.info();
      return Object.assign({}, v, {
        rollbackEnabled: o,
        globalsValidationEnabled: !!a,
        rollbackRegistry: p ? p.info() : null,
        rollbackExecutor: A ? A.info() : null
      });
    },
    // Sprint 6 #8: Expor rollback API
    getRollbackRegistry: function() {
      return p;
    },
    getRollbackExecutor: function() {
      return A;
    },
    rollbackPhase: function(v) {
      return A ? A.rollbackPhase(v) : { success: !1, reason: "rollback-disabled" };
    }
  };
}
const I = Object.freeze({
  // Estados iniciais
  COLD: "cold",
  // Sistema não iniciado
  INITIALIZING: "initializing",
  // Preparando para boot
  // Estados de fase (correspondem às fases 0-6)
  PHASE_0_CRITICAL: "phase-0-critical",
  // EventBus, Logger
  PHASE_1_CORE: "phase-1-core",
  // Core services
  PHASE_2_AUTH: "phase-2-auth",
  // Authentication
  PHASE_3_SHELL: "phase-3-shell",
  // App shell
  PHASE_4_MAIN: "phase-4-main",
  // Main content
  PHASE_5_UI: "phase-5-ui",
  // UI components
  PHASE_6_PLATFORM: "phase-6-platform",
  // Platform features
  // Estados finais
  READY: "ready",
  // Boot completo com sucesso
  DEGRADED: "degraded",
  // Boot completo mas degradado
  FAILED: "failed",
  // Boot falhou
  // Estados de recuperação
  RECOVERING: "recovering",
  // Tentando recuperar
  ROLLING_BACK: "rolling-back"
  // Executando rollback
}), fr = Object.freeze({
  PHASE_0: "phase-0-critical",
  PHASE_1: "phase-1-core",
  PHASE_2: "phase-2-auth",
  PHASE_3: "phase-3-shell",
  PHASE_4: "phase-4-main",
  PHASE_5: "phase-5-ui",
  PHASE_6: "phase-6-platform"
});
Object.freeze([
  fr.PHASE_0,
  fr.PHASE_1,
  fr.PHASE_2,
  fr.PHASE_3,
  fr.PHASE_4,
  fr.PHASE_5,
  fr.PHASE_6
]);
const $c = Object.freeze({
  // COLD só pode ir para INITIALIZING
  [I.COLD]: [I.INITIALIZING],
  // INITIALIZING → primeira fase ou erro
  [I.INITIALIZING]: [I.PHASE_0_CRITICAL, I.FAILED],
  // Fases seguem ordem linear (ou erro)
  [I.PHASE_0_CRITICAL]: [I.PHASE_1_CORE, I.FAILED, I.DEGRADED],
  [I.PHASE_1_CORE]: [I.PHASE_2_AUTH, I.FAILED, I.DEGRADED],
  [I.PHASE_2_AUTH]: [I.PHASE_3_SHELL, I.FAILED, I.DEGRADED],
  [I.PHASE_3_SHELL]: [I.PHASE_4_MAIN, I.FAILED, I.DEGRADED],
  [I.PHASE_4_MAIN]: [I.PHASE_5_UI, I.FAILED, I.DEGRADED],
  [I.PHASE_5_UI]: [I.PHASE_6_PLATFORM, I.READY, I.DEGRADED],
  [I.PHASE_6_PLATFORM]: [I.READY, I.DEGRADED],
  // Estados finais
  [I.READY]: [],
  // Estado terminal
  [I.DEGRADED]: [],
  // Estado terminal (mas funcional)
  [I.FAILED]: [I.RECOVERING, I.COLD],
  // Pode tentar recuperar
  // Recovery
  [I.RECOVERING]: [I.INITIALIZING, I.FAILED],
  [I.ROLLING_BACK]: [I.FAILED, I.DEGRADED]
}), Kc = Object.freeze({
  "phase-0-critical": I.PHASE_0_CRITICAL,
  "phase-1-core": I.PHASE_1_CORE,
  "phase-2-auth": I.PHASE_2_AUTH,
  "phase-3-shell": I.PHASE_3_SHELL,
  "phase-4-main": I.PHASE_4_MAIN,
  "phase-5-ui": I.PHASE_5_UI,
  "phase-6-platform": I.PHASE_6_PLATFORM
});
Object.freeze({
  [I.PHASE_0_CRITICAL]: "phase-0-critical",
  [I.PHASE_1_CORE]: "phase-1-core",
  [I.PHASE_2_AUTH]: "phase-2-auth",
  [I.PHASE_3_SHELL]: "phase-3-shell",
  [I.PHASE_4_MAIN]: "phase-4-main",
  [I.PHASE_5_UI]: "phase-5-ui",
  [I.PHASE_6_PLATFORM]: "phase-6-platform"
});
const ho = [I.READY, I.DEGRADED, I.FAILED];
I.PHASE_0_CRITICAL, I.PHASE_1_CORE, I.PHASE_2_AUTH, I.PHASE_3_SHELL, I.PHASE_4_MAIN, I.PHASE_5_UI, I.PHASE_6_PLATFORM;
function Ls(e, t) {
  if (!e || !t)
    return !1;
  const r = $c[e];
  return r ? r.indexOf(t) !== -1 : !1;
}
function km(e) {
  return e ? $c[e] || [] : [];
}
function qc(e, t, r) {
  const n = [], i = [], o = Object.values(I);
  return o.indexOf(e) === -1 && n.push("Invalid fromState: " + e), o.indexOf(t) === -1 && n.push("Invalid toState: " + t), n.length > 0 ? { valid: !1, errors: n, warnings: i } : (Ls(e, t) || (n.push("Transition not allowed: " + e + " → " + t), n.push("Valid targets from " + e + ": " + km(e).join(", "))), r && (t !== I.PHASE_0_CRITICAL && t !== I.COLD && t !== I.INITIALIZING && t !== I.FAILED && (r.phase0Complete || i.push("INV-002: Phase-0 should complete before proceeding")), r.skippedPhases && r.skippedPhases.length > 0 && t === I.READY && i.push("INV-003: Skipped phases detected, consider DEGRADED state")), {
    valid: n.length === 0,
    errors: n,
    warnings: i,
    fromState: e,
    toState: t
  });
}
function Hm(e) {
  if (!e || !Array.isArray(e) || e.length === 0)
    return {
      valid: !1,
      errors: ["Empty or invalid state history"],
      warnings: []
    };
  const t = [], r = [];
  e[0] !== I.COLD && t.push("Boot must start in COLD state, found: " + e[0]);
  for (let o = 0; o < e.length - 1; o++) {
    const l = e[o], a = e[o + 1];
    Ls(l, a) || t.push("Invalid transition at step " + o + ": " + l + " → " + a);
  }
  const n = e[e.length - 1];
  return ho.indexOf(n) === -1 && r.push("Boot did not reach terminal state, current: " + n), !(e.indexOf(I.PHASE_0_CRITICAL) !== -1) && n !== I.FAILED && t.push("INV-002 violated: Boot must pass through phase-0-critical"), {
    valid: t.length === 0,
    errors: t,
    warnings: r,
    statesVisited: e.length,
    finalState: n,
    isComplete: ho.indexOf(n) !== -1
  };
}
function Jc(e) {
  return e === I.READY || e === I.DEGRADED;
}
function Zc(e) {
  return e === I.FAILED;
}
function Bm(e) {
  return ho.indexOf(e) !== -1;
}
function Um(e) {
  return Kc[e] || null;
}
function xm(e) {
  e === void 0 && (e = {});
  var t = e.telemetry, r = e.logger, n = e.windowAdapter || null, i = Le.IDLE, o = null, l = null, a = [], s = I.COLD, u = [I.COLD], c = [], d = null, f = null, g = null, h = {
    totalTime: 0,
    retryAttempts: 0
  }, p = qg({ logger: r, moduleId: xt }), A = am({
    logger: r,
    onRetry: function(O) {
      h.retryAttempts++;
    }
  }), T = Sl({
    logger: r,
    moduleId: xt,
    metricsSummary: fi,
    bootContext: null
  });
  g = bl({
    logger: r,
    telemetry: t,
    eventEmitter: p,
    retryExecutor: A,
    degradationHandler: T,
    metricsSummary: fi,
    getPhaseConfig: fo,
    moduleId: xt,
    healthAggregator: null,
    notificationsEnabled: !0,
    circuitBreakerEnabled: !0,
    windowAdapter: n
  });
  function S(O, b, P) {
    P === void 0 && (P = {}), r && r[O] && r[O](b, Object.assign({}, P, { module: xt }));
  }
  function L(O, b) {
    b === void 0 && (b = {}), t && t.track && t.track(O, Object.assign({}, b, { module: xt }));
  }
  function H(O) {
    var b = i;
    i = O, S("info", "State: " + b + " → " + O), L("state-change", { from: b, to: O });
  }
  function E(O, b) {
    var P = qc(s, O, b);
    P.valid || (S("warn", "Invalid boot state transition", {
      from: s,
      to: O,
      errors: P.errors
    }), c.push({
      from: s,
      to: O,
      errors: P.errors,
      timestamp: Date.now()
    })), P.warnings && P.warnings.length > 0 && S("info", "Boot state transition warnings", { warnings: P.warnings });
    var C = s;
    s = O, u.push(O), S("info", "Boot state: " + C + " → " + O, {
      validated: P.valid,
      historyLength: u.length
    });
  }
  function m() {
    var O = Xn();
    return O.valid ? (S("info", "Manifest validated successfully", { phaseCount: O.phaseCount }), { valid: !0, errors: [] }) : (S("error", "Manifest validation failed", { errors: O.errors }), p.emit(ke.MANIFEST_INVALID, { errors: O.errors }), { valid: !1, errors: O.errors });
  }
  function v(O) {
    if (i !== Le.IDLE)
      return S("warn", "Orchestrator already running"), Promise.resolve({ success: !1, reason: "already-running" });
    var b = m();
    if (!b.valid)
      return S("error", "Boot aborted due to invalid manifest", { errors: b.errors }), E(I.FAILED, {}), Promise.resolve({
        success: !1,
        reason: "invalid-manifest",
        errors: b.errors
      });
    E(I.INITIALIZING, { phase0Complete: !1 }), ws(), d = jg(), f = $g(d), d.start(), f && f.captureMemoryBaseline && (f.captureMemoryBaseline(), S("info", "Memory baseline captured by orchestrator")), T = Sl({
      logger: r,
      moduleId: xt,
      metricsSummary: fi,
      bootContext: d
    }), g = bl({
      logger: r,
      telemetry: t,
      eventEmitter: p,
      retryExecutor: A,
      degradationHandler: T,
      metricsSummary: fi,
      getPhaseConfig: fo,
      moduleId: xt,
      healthAggregator: f,
      notificationsEnabled: !0,
      circuitBreakerEnabled: !0,
      windowAdapter: n
    }), S("info", "PhaseExecutor created with full integration", {
      healthAggregatorEnabled: !!f,
      notificationsEnabled: !0,
      circuitBreakerEnabled: !0,
      globalsValidationEnabled: !!n,
      bootContractEnabled: !0
    }), l = performance.now(), H(Le.INITIALIZING), S("info", "Boot pipeline starting", {
      phases: O.length,
      manifestIntegrated: !0,
      manifestValidated: !0,
      sprint3Integrated: !0,
      bootContractEnabled: !0
    }), p.emit(ke.INIT, { phases: O.length }), L("pipeline-start", { phases: O.length }), H(Le.RUNNING);
    var P = [], C = 0, $ = [], Y = !1;
    function D() {
      if (C >= O.length || i === Le.FAILED)
        return Promise.resolve();
      var U = O[C];
      C++, o = U.id;
      var G = Um(U.id);
      return G && E(G, {
        phase0Complete: Y,
        skippedPhases: $
      }), g.execute(U, e, d, H).then(function(j) {
        return j.error && a.push({ phase: U.id, error: j.error, time: Date.now() }), U.id === "phase-0-critical" && j.success && (Y = !0), j.skipped && $.push(U.id), P.push(Object.assign({ phaseId: U.id }, j)), D();
      });
    }
    return D().then(function() {
      h.totalTime = Math.round(performance.now() - l), i !== Le.FAILED && H(Le.COMPLETED);
      var U = i === Le.COMPLETED, G = $.length > 0 || a.length > 0;
      U && !G ? E(I.READY, { phase0Complete: Y }) : U && G ? E(I.DEGRADED, {
        phase0Complete: Y,
        skippedPhases: $
      }) : E(I.FAILED, {
        phase0Complete: Y
      }), Ds(U), d && d.complete(U);
      var j = f ? f.calculate() : null, $e = d ? d.getSnapshot() : null, nt = mr(), ct = g.getMetrics(), F = f && f.getMemoryMetrics ? f.getMemoryMetrics() : null, me = {
        success: U,
        state: i,
        bootState: s,
        totalTime: h.totalTime,
        p24Instrumented: !0,
        manifestIntegrated: !0,
        manifestValidated: !0,
        sprint3Integrated: !0,
        bootContractEnabled: !0,
        phases: P,
        metrics: Object.assign({}, ct, {
          totalTime: h.totalTime,
          retryAttempts: h.retryAttempts
        }),
        errors: a.slice(),
        context: $e,
        health: j,
        metricsSummary: nt,
        memory: F,
        bootStateHistory: u.slice(),
        transitionErrors: c.slice()
      };
      return S("info", "Boot pipeline finished", {
        success: me.success,
        bootState: s,
        totalTime: me.totalTime,
        health: j ? j.status : "unknown",
        healthScore: j ? j.score : 0,
        retryAttempts: h.retryAttempts,
        metricsErrors: nt.errorCount,
        metricsWarnings: nt.warningCount,
        memoryDelta: F ? F.totalDelta : null,
        bootStateHistoryLength: u.length,
        transitionErrorCount: c.length
      }), p.emit(ke.COMPLETE, me), p.emit(ke.CONTEXT_READY, { context: $e }), p.emit(ke.HEALTH_UPDATE, { health: j }), L("pipeline-complete", me), me;
    });
  }
  function w() {
    i = Le.IDLE, o = null, l = null, a = [], h.totalTime = 0, h.retryAttempts = 0, s = I.COLD, u = [I.COLD], c = [], g && g.reset(), Cs(), p.clear(), d && d.reset(), d = null, f && f.reset && f.reset(), f = null, S("info", "Orchestrator reset (boot-contract compliant)");
  }
  function y() {
    var O = d ? d.info() : null, b = f ? f.info() : null, P = g ? g.getMetrics() : {}, C = g && g.info ? g.info() : null;
    return {
      moduleId: xt,
      version: "2.5.0-BOOT-CONTRACT",
      state: i,
      bootState: s,
      currentPhase: o,
      phasesCompleted: g ? Object.keys(g.getPhaseResults()).length : 0,
      metrics: Object.assign({}, P, h),
      errors: a.slice(),
      manifestIntegrated: !0,
      sprint3Integrated: !0,
      bootContractEnabled: !0,
      quickWinsApplied: ["QW01-ValidateManifest", "QW04-BackoffRetry", "QW26-MetricsSummary"],
      improvements: ["#5-PeriodicHealth", "#6-MemoryMetrics", "#25-DegradationNotifier", "ACTION3-GlobalsValidation", "BOOT-CONTRACT"],
      modular: !0,
      globalsValidationEnabled: !!n,
      bootContext: O,
      healthAggregator: b,
      phaseExecutor: C,
      metricsSummary: mr(),
      bootStateHistory: u.slice(),
      transitionErrors: c.length
    };
  }
  function R() {
    var O = i === Le.COMPLETED ? "healthy" : i === Le.FAILED ? "unhealthy" : "initializing", b = f ? f.getStatus() : "unknown", P = f ? f.getScore() : 0, C = mr(), $ = g ? g.getMetrics() : {}, Y = f && f.getMemoryMetrics ? f.getMemoryMetrics() : null;
    return {
      status: O,
      state: i,
      bootState: s,
      bootStateValid: Jc(s) || Zc(s) || s === I.COLD,
      phasesSucceeded: $.phasesSucceeded || 0,
      phasesFailed: $.phasesFailed || 0,
      totalTime: h.totalTime,
      retryAttempts: h.retryAttempts,
      p24Instrumented: !0,
      manifestIntegrated: !0,
      sprint3Integrated: !0,
      bootContractEnabled: !0,
      modular: !0,
      bootHealth: b,
      bootScore: P,
      metricsErrors: C.errorCount,
      metricsWarnings: C.warningCount,
      memory: Y,
      transitionErrors: c.length
    };
  }
  return {
    run: v,
    getState: function() {
      return i;
    },
    getBootState: function() {
      return s;
    },
    getBootStateHistory: function() {
      return u.slice();
    },
    getCurrentPhase: function() {
      return o;
    },
    getPhaseResult: function(O) {
      return g ? g.getPhaseResult(O) : null;
    },
    getMetrics: function() {
      return Object.assign({}, g ? g.getMetrics() : {}, h);
    },
    getErrors: function() {
      return a.slice();
    },
    getTransitionErrors: function() {
      return c.slice();
    },
    reset: w,
    on: p.on,
    off: p.off,
    info: y,
    healthCheck: R,
    getBootContext: function() {
      return d;
    },
    getHealthAggregator: function() {
      return f;
    },
    getMetricsSummary: function() {
      return mr();
    },
    // #6: Expor métricas de memória
    getMemoryMetrics: function() {
      return f && f.getMemoryMetrics ? f.getMemoryMetrics() : null;
    },
    STATES: Le,
    EVENTS: ke,
    // v2.5.0: Expose boot contract states
    BOOT_STATES: I
  };
}
var Fm = "boot-state-machine", Gm = "2.0.0-BOOT-CONTRACT", Qc = {
  "loading-critical": I.PHASE_0_CRITICAL,
  "loading-core": I.PHASE_1_CORE,
  authenticating: I.PHASE_2_AUTH,
  "loading-shell": I.PHASE_3_SHELL,
  "loading-main": I.PHASE_4_MAIN,
  "loading-ui": I.PHASE_5_UI,
  "loading-platform": I.PHASE_6_PLATFORM,
  error: I.FAILED,
  recovering: I.RECOVERING
};
Object.keys(Qc).forEach(function(e) {
});
function mi(e) {
  return Qc[e] || e;
}
function zm(e) {
  e === void 0 && (e = {});
  var t = I.COLD, r = [], n = {}, i = e.maxHistory || 50, o = {
    phase0Complete: !1,
    skippedPhases: []
  };
  function l(v) {
    var w = mi(v);
    return Ls(t, w);
  }
  function a(v, w) {
    w === void 0 && (w = {});
    var y = mi(v), R = qc(t, y, o);
    if (!R.valid)
      return {
        success: !1,
        error: "Invalid transition: " + t + " → " + y,
        details: R.errors,
        warnings: R.warnings
      };
    var O = t;
    t = y, I.PHASE_0_CRITICAL, O === I.PHASE_0_CRITICAL && (o.phase0Complete = !0);
    var b = {
      from: O,
      to: y,
      timestamp: Date.now(),
      metadata: w,
      warnings: R.warnings
    };
    r.push(b), r.length > i && r.shift();
    for (var P = n.transition || [], C = 0; C < P.length; C++)
      try {
        P[C](b);
      } catch {
      }
    for (var $ = n[y] || [], Y = 0; Y < $.length; Y++)
      try {
        $[Y](b);
      } catch {
      }
    return {
      success: !0,
      record: b,
      warnings: R.warnings
    };
  }
  function s(v, w) {
    var y = Kc[v];
    return y ? a(y, Object.assign({ phaseId: v }, w || {})) : {
      success: !1,
      error: "Unknown phase: " + v
    };
  }
  function u(v) {
    o.skippedPhases.indexOf(v) === -1 && o.skippedPhases.push(v);
  }
  function c() {
    return t;
  }
  function d() {
    return r.slice();
  }
  function f() {
    return r.map(function(v) {
      return v.to;
    });
  }
  function g(v) {
    var w = mi(v);
    return t === w;
  }
  function h() {
    return t === I.READY;
  }
  function p() {
    return t === I.DEGRADED;
  }
  function A() {
    return Zc(t);
  }
  function T() {
    return Bm(t);
  }
  function S() {
    return Jc(t);
  }
  function L(v, w) {
    var y = mi(v);
    return n[y] || (n[y] = []), n[y].push(w), function() {
      var R = n[y] || [], O = R.indexOf(w);
      O !== -1 && R.splice(O, 1);
    };
  }
  function H() {
    var v = [I.COLD].concat(f());
    return Hm(v);
  }
  function E() {
    t = I.COLD, r.length = 0, o.phase0Complete = !1, o.skippedPhases = [];
  }
  function m() {
    return {
      moduleId: Fm,
      version: Gm,
      currentState: t,
      historyLength: r.length,
      isReady: h(),
      isDegraded: p(),
      isError: A(),
      isTerminal: T(),
      isComplete: S(),
      context: {
        phase0Complete: o.phase0Complete,
        skippedPhases: o.skippedPhases.slice()
      },
      contractIntegrated: !0
    };
  }
  return {
    // Core transitions
    transition: a,
    transitionToPhase: s,
    canTransition: l,
    markPhaseSkipped: u,
    // State accessors
    getState: c,
    getHistory: d,
    getStateHistory: f,
    isState: g,
    isReady: h,
    isDegraded: p,
    isError: A,
    isTerminal: T,
    isComplete: S,
    // Validation
    validateSequence: H,
    // Events
    on: L,
    // Lifecycle
    reset: E,
    info: m,
    // Expose states for backward compat
    STATES: I
  };
}
const Vm = "logger-adapter", Rl = "1.5.0-DOMAIN-PURE", Xc = typeof window < "u", vn = { logger: null, _initialized: !1 };
function Ym(e) {
  if (!Xc) return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const t = window.Core.windowAdapter.get(e);
    if (t) return t;
  }
  return window[e] || null;
}
function jm() {
  vn._initialized || (Xc && (vn.logger = Ym("Logger")), vn._initialized = !0);
}
function Mr(e) {
  return vn._initialized || jm(), vn[e] || null;
}
function Wm(e) {
  e === void 0 && (e = {});
  const t = e.prefix || "bootstrap-v2", r = e.debug || !1;
  function n(l) {
    return "[" + t + "] " + l;
  }
  function i(l) {
    return Object.assign({}, l, { module: t, timestamp: Date.now() });
  }
  function o(l) {
    return !(l === "debug" && !r);
  }
  return {
    debug: function(l, a) {
      if (a === void 0 && (a = {}), !o("debug")) return;
      const s = Mr("logger");
      s && s.debug && s.debug(n(l), i(a));
    },
    info: function(l, a) {
      if (a === void 0 && (a = {}), !o("info")) return;
      const s = Mr("logger");
      s && s.info && s.info(n(l), i(a));
    },
    warn: function(l, a) {
      if (a === void 0 && (a = {}), !o("warn")) return;
      const s = Mr("logger");
      s && s.warn && s.warn(n(l), i(a));
    },
    error: function(l, a) {
      a === void 0 && (a = {});
      const s = Mr("logger");
      s && s.error && s.error(n(l), i(a));
    },
    getInfo: function() {
      return { moduleId: Vm, version: Rl, hasGlobalLogger: !!Mr("logger"), debug: r };
    },
    healthCheck: function() {
      return { healthy: !!Mr("logger"), version: Rl };
    }
  };
}
const $m = "telemetry-adapter", Km = "1.2.0-DOMAIN-PURE";
function qm(e) {
  e === void 0 && (e = {});
  const t = e.namespace || "bootstrap-v2", r = e.enabled !== !1, n = {}, i = { events: 0, errors: 0, warnings: 0 };
  function o() {
    if (typeof window > "u") return null;
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      let s = window.Core.windowAdapter.get("Telemetry");
      if (s || (s = window.Core.windowAdapter.get("TelemetryCore"), s)) return s;
    }
    return window.Telemetry || window.TelemetryCore || null;
  }
  function l(s) {
    return t + ":" + s;
  }
  function a(s) {
    return Object.assign({}, s, { namespace: t, timestamp: Date.now() });
  }
  return {
    track: function(s, u) {
      if (u === void 0 && (u = {}), !r) return;
      i.events++;
      const c = o();
      c && c.track && c.track(l(s), a(u));
    },
    error: function(s, u) {
      u === void 0 && (u = {}), i.errors++;
      const c = o();
      c && c.error ? c.error(l(s), a(u)) : c && c.track && c.track(l(s), Object.assign({}, a(u), { level: "error" }));
    },
    logInfo: function(s, u) {
      if (u === void 0 && (u = {}), !r) return;
      const c = o();
      c && c.info ? c.info(l(s), a(u)) : this.track(s, Object.assign({}, u, { level: "info" }));
    },
    warn: function(s, u) {
      u === void 0 && (u = {}), i.warnings++;
      const c = o();
      c && c.warn ? c.warn(l(s), a(u)) : this.track(s, Object.assign({}, u, { level: "warn" }));
    },
    startTimer: function(s) {
      n[s] = performance.now();
    },
    endTimer: function(s) {
      const u = n[s];
      if (!u) return 0;
      const c = Math.round(performance.now() - u);
      return delete n[s], this.track("timer", { label: s, duration: c }), c;
    },
    getMetrics: function() {
      return Object.assign({}, i);
    },
    getInfo: function() {
      return { moduleId: $m, version: Km, hasTelemetry: !!o(), enabled: r, metrics: Object.assign({}, i) };
    }
  };
}
const Yr = Object.freeze({
  // ─────────────────────────────────────────────────────────────
  // GLOBAIS PERMITIDOS (APIs públicas documentadas)
  // ─────────────────────────────────────────────────────────────
  ALLOWED: Object.freeze({
    EventBus: {
      description: "Central event bus for cross-module communication",
      owner: "core/runtime/events",
      lifecycle: "persistent",
      apiType: "public",
      methods: ["emit", "on", "off", "once"],
      documentation: "/core/runtime/events/README.md"
    },
    Logger: {
      description: "Centralized logging system",
      owner: "core/runtime/logger",
      lifecycle: "persistent",
      apiType: "public",
      methods: ["info", "warn", "error", "debug", "log"],
      documentation: "/core/runtime/logger/README.md"
    },
    Kernel: {
      description: "Application kernel with capabilities and state",
      owner: "bootstrap-v2/kernel",
      lifecycle: "persistent",
      apiType: "public",
      methods: ["getCapability", "setCapability", "getState", "info"],
      documentation: "/bootstrap-v2/kernel/README.md"
    },
    ApplicationKernel: {
      description: "Alias for Kernel (legacy compatibility)",
      owner: "bootstrap-v2/kernel",
      lifecycle: "persistent",
      apiType: "legacy-alias",
      aliasOf: "Kernel",
      documentation: "/bootstrap-v2/kernel/README.md"
    },
    Bootstrap: {
      description: "Bootstrap API for external consumers",
      owner: "bootstrap-v2/loader",
      lifecycle: "persistent",
      apiType: "public",
      methods: ["getBootResult", "getKernel", "info", "healthCheck"],
      documentation: "/bootstrap-v2/README.md"
    }
  }),
  // ─────────────────────────────────────────────────────────────
  // GLOBAIS PROIBIDOS (não devem ser usados)
  // ─────────────────────────────────────────────────────────────
  FORBIDDEN: Object.freeze({
    __BOOT_STATE__: "Use BootContext instead",
    __BOOTSTRAP_INSTANCE__: "Use Bootstrap.getBootResult() instead",
    __KERNEL_INSTANCE__: "Use Kernel or window.Kernel instead",
    __DEBUG_MODE__: "Use DebugMode module instead"
  }),
  // ─────────────────────────────────────────────────────────────
  // GLOBAIS TEMPORÁRIOS (apenas durante boot)
  // ─────────────────────────────────────────────────────────────
  TEMPORARY: Object.freeze({
    __BOOT_LOOP_TRACKER__: {
      description: "Boot loop detection storage",
      lifecycle: "boot-only",
      clearedAfter: "boot-complete"
    },
    __PRE_BOOT_RESULT__: {
      description: "Pre-boot phase result",
      lifecycle: "boot-only",
      clearedAfter: "boot-complete"
    }
  })
}), Jm = Object.freeze({
  PERSISTENT: "persistent",
  // Vive durante toda a sessão
  BOOT_ONLY: "boot-only",
  // Limpo após boot completo
  TEMPORARY: "temporary",
  // Limpo após uso específico
  DEPRECATED: "deprecated"
  // Marcado para remoção
});
let pi = [];
const wl = 500;
function ed(e) {
  return !e || typeof e != "string" ? !1 : Yr.ALLOWED[e] || Yr.TEMPORARY[e] ? !0 : (Yr.FORBIDDEN[e], !1);
}
function Zm(e) {
  if (!e) return null;
  const t = Yr.ALLOWED, r = Yr.TEMPORARY, n = Yr.FORBIDDEN;
  return t[e] ? {
    status: "allowed",
    details: t[e],
    lifecycle: t[e].lifecycle
  } : r[e] ? {
    status: "temporary",
    details: r[e],
    lifecycle: Jm.BOOT_ONLY
  } : n[e] ? {
    status: "forbidden",
    reason: n[e],
    lifecycle: null
  } : {
    status: "unknown",
    reason: "Global not registered in contract",
    lifecycle: null
  };
}
function Qm(e, t, r) {
  const n = {
    globalName: e,
    accessType: t,
    callerModule: r,
    timestamp: Date.now(),
    allowed: ed(e)
  };
  return pi.push(n), pi.length > wl && (pi = pi.slice(-wl)), n;
}
const Dl = "eventbus-adapter", Xm = "2.2.0-GLOBALS-CONTRACT";
function ep(e) {
  e === void 0 && (e = {});
  const t = e.namespace || "bootstrap-v2", r = e.validateGlobals !== !1, n = {};
  let i = 0, o = !1;
  function l() {
    return typeof window < "u" && window.EventBus ? (r && (o || (ed("EventBus") || console.warn("[EventBusAdapter] window.EventBus access not allowed by globals-contract"), o = !0), Qm("EventBus", "read", Dl), i++), window.EventBus) : null;
  }
  function a(s) {
    return s.indexOf(t) === 0 ? s : t + ":" + s;
  }
  return {
    emit: function(s, u) {
      u === void 0 && (u = {});
      const c = l();
      if (c && c.emit) {
        c.emit(s, u);
        return;
      }
      const d = n[s] || [];
      for (let f = 0; f < d.length; f++)
        try {
          d[f](u);
        } catch {
        }
    },
    emitNamespaced: function(s, u) {
      u === void 0 && (u = {});
      const c = a(s), d = l();
      d && d.emit && d.emit(c, u);
    },
    on: function(s, u) {
      const c = this, d = l();
      return d && d.on ? d.on(s, u) : (n[s] || (n[s] = []), n[s].push(u), function() {
        c.off(s, u);
      });
    },
    off: function(s, u) {
      const c = l();
      if (c && c.off) {
        c.off(s, u);
        return;
      }
      const d = n[s] || [], f = d.indexOf(u);
      f !== -1 && d.splice(f, 1);
    },
    once: function(s, u) {
      const c = this, d = l();
      if (d && d.once)
        return d.once(s, u);
      const f = function(g) {
        c.off(s, f), u(g);
      };
      return c.on(s, f);
    },
    hasEventBus: function() {
      return !!l();
    },
    // v2.2.0: Get global access statistics
    getGlobalAccessStats: function() {
      return {
        accessCount: i,
        validated: o,
        globalPolicy: Zm("EventBus")
      };
    },
    info: function() {
      return {
        moduleId: Dl,
        version: Xm,
        hasGlobalEventBus: !!l(),
        localListenerCount: Object.keys(n).length,
        namespace: t,
        validateGlobals: r,
        globalAccessCount: i,
        usesGlobalsContract: !0
      };
    }
  };
}
const tp = "ready-flags-adapter", rp = "1.2.0-DOMAIN-PURE";
function np() {
  const e = {}, t = {};
  function r() {
    if (typeof window > "u") return null;
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      const n = window.Core.windowAdapter.get("ReadyFlags");
      if (n) return n;
    }
    return window.ReadyFlags || null;
  }
  return {
    setReady: function(n, i) {
      i === void 0 && (i = !0);
      const o = r();
      o && o.setReady && o.setReady(n, i);
      const l = e[n];
      if (e[n] = i, i && !l) {
        const a = t[n] || [];
        for (let s = 0; s < a.length; s++)
          try {
            a[s]();
          } catch {
          }
        delete t[n];
      }
      return !0;
    },
    isReady: function(n) {
      const i = r();
      return i && i.isReady ? i.isReady(n) : e[n] === !0;
    },
    waitFor: function(n, i) {
      const o = this;
      return i === void 0 && (i = 5e3), new Promise(function(l) {
        if (o.isReady(n)) {
          l(!0);
          return;
        }
        const a = r();
        if (a && a.waitFor) {
          a.waitFor(n, i).then(l);
          return;
        }
        let s = t[n] || [];
        s.push(function() {
          l(!0);
        }), t[n] = s, i > 0 && setTimeout(function() {
          l(!1);
        }, i);
      });
    },
    getAll: function() {
      const n = r();
      return n && n.getAll ? n.getAll() : Object.assign({}, e);
    },
    hasReadyFlags: function() {
      return !!r();
    },
    info: function() {
      return { moduleId: tp, version: rp, hasGlobalReadyFlags: !!r(), internalFlagsCount: Object.keys(e).length };
    }
  };
}
const ro = "window-adapter", Cl = "2.5.0-HARD-ENFORCE", no = [
  // Phase 0 — Critical Infrastructure
  "EventBus",
  "EventBusGlobal",
  "Logger",
  "LoggerGlobal",
  "ErrorBoundary",
  "Config",
  "APP_CONFIG",
  "SecurityCSRF",
  "EnvironmentManager",
  // Phase 1 — Core Services
  "GlobalState",
  "GlobalStateFacade",
  "ReadyFlags",
  "Telemetry",
  "TelemetryCore",
  "TelemetryKernel",
  "ContextProvider",
  "FeatureFlags",
  "AssetLoader",
  // Phase 2 — Authentication
  "AppContext",
  // Phase 3 — Shell & Router
  "LayoutManager",
  "AppShell",
  "Header",
  "Sidebar",
  "NavRail",
  "Footer",
  "RouterGlobal",
  // Phase 4 — Main Content
  "Main",
  "ContainerMain",
  "CMBootstrap",
  // Phase 5 — UI Components
  "UIOrchestrator",
  "OverlayLayer",
  "Toast",
  // Phase 6 — Platform
  "Platform",
  // Kernel & Runtime (instance-manager, runtime-context)
  "Kernel",
  "ApplicationKernel",
  "RuntimeContext",
  // Orchestrator & Health
  "Orchestrator",
  "HealthAggregator",
  // Core namespace
  "Core"
];
function ip() {
  const e = {}, t = [];
  function r() {
    return typeof window < "u";
  }
  function n(a) {
    if (!r()) return !1;
    const s = Object.getOwnPropertyDescriptor(window, a);
    return s ? s.writable !== !1 && s.configurable !== !1 : !0;
  }
  function i(a) {
    return no.indexOf(a) !== -1;
  }
  function o(a, s, u = {}) {
    const c = {
      operation: a,
      name: s,
      timestamp: Date.now(),
      strictMode: de(),
      allowed: i(s),
      ...u
    };
    return t.push(c), t.length > 200 && t.shift(), c;
  }
  function l() {
    return r() && window.GlobalState || null;
  }
  return {
    expose: function(a, s) {
      if (!r()) return !1;
      const u = i(a);
      if (de() && !u) {
        Sn("WINDOW_EXPOSE_NOT_ALLOWED", {
          name: a,
          moduleType: typeof s,
          source: "WindowAdapter.expose()",
          blocked: !0
        }), o("expose_blocked", a, { allowed: !1, moduleType: typeof s, blocked: !0 });
        try {
          console.warn("[" + ro + '] STRICT_BLOCK: Exposição de "' + a + '" BLOQUEADA (fora da allowlist)');
        } catch {
        }
        return !1;
      }
      if (o("expose", a, { allowed: u, moduleType: typeof s }), !n(a))
        return e[a] = { exposedAt: Date.now(), type: typeof window[a], readOnly: !0, skipped: !0, allowed: u }, !0;
      try {
        return window[a] = s, e[a] = { exposedAt: Date.now(), type: typeof s, readOnly: !1, skipped: !1, allowed: u }, !0;
      } catch (c) {
        return e[a] = { exposedAt: Date.now(), type: "error", error: c.message, skipped: !0, allowed: u }, !0;
      }
    },
    get: function(a) {
      return r() && window[a] || null;
    },
    has: function(a) {
      return r() ? a in window : !1;
    },
    unexpose: function(a) {
      if (!r() || (o("unexpose", a), !n(a))) return !1;
      try {
        return delete window[a], delete e[a], !0;
      } catch {
        return !1;
      }
    },
    waitFor: function(a, s) {
      const u = this;
      return s === void 0 && (s = 5e3), new Promise(function(c) {
        if (u.has(a)) {
          c(u.get(a));
          return;
        }
        const d = Date.now();
        function f() {
          if (u.has(a)) {
            c(u.get(a));
            return;
          }
          if (Date.now() - d > s) {
            c(null);
            return;
          }
          setTimeout(f, 50);
        }
        f();
      });
    },
    getExposed: function() {
      return Object.assign({}, e);
    },
    getDocument: function() {
      return r() ? document : null;
    },
    getWindow: function() {
      return r() ? window : null;
    },
    setBodyData: function(a, s) {
      if (!r()) return !1;
      try {
        const u = l();
        if (u && u.dispatch)
          try {
            u.dispatch({ type: "SET_BODY_DATA", payload: { key: a, value: s } });
          } catch {
          }
        return document.body && (document.body.dataset[a] = s), !0;
      } catch {
        return !1;
      }
    },
    getBodyData: function(a) {
      if (!r()) return null;
      const s = l();
      if (s && s.select)
        try {
          const u = s.select(function(c) {
            return c.bodyData ? c.bodyData[a] : void 0;
          });
          if (u !== void 0) return u;
        } catch {
        }
      return document.body && document.body.dataset ? document.body.dataset[a] : null;
    },
    isWritable: function(a) {
      return n(a);
    },
    info: function() {
      const a = de(), s = Object.keys(e), u = s.filter((c) => !i(c));
      return {
        moduleId: ro,
        version: Cl,
        compliance: "P1A-AAA",
        p24Instrumented: !0,
        hasWindow: r(),
        strictMode: a,
        exposedModules: s,
        exposedDetails: Object.assign({}, e),
        notAllowedExposures: u,
        allowlist: no,
        auditTrailSize: t.length
      };
    },
    healthCheck: function() {
      const a = l(), s = de(), u = Object.keys(e), c = u.filter((p) => !i(p)), d = {
        hasWindow: r(),
        globalStateAvailable: !!(a && a.dispatch),
        noUnallowedExposures: !s || c.length === 0,
        auditTrailHealthy: t.length < 150
      }, f = Object.values(d).filter(Boolean).length, g = Object.keys(d).length;
      return {
        status: f === g ? "HEALTHY" : f >= 2 ? "DEGRADED" : "UNHEALTHY",
        score: f + "/" + g,
        checks: d,
        hasWindow: r(),
        exposedCount: u.length,
        globalStateAvailable: !!(a && a.dispatch),
        strictMode: s,
        notAllowedExposuresCount: c.length,
        auditTrailSize: t.length,
        compliance: "P1A-AAA",
        p24Instrumented: !0,
        version: Cl,
        moduleId: ro,
        timestamp: Date.now()
      };
    },
    // v2.3.0: Retorna audit trail para diagnóstico
    getAuditTrail: function() {
      return [...t];
    },
    // v2.3.0: Retorna allowlist
    getAllowlist: function() {
      return [...no];
    },
    // v2.3.0: Verifica se nome está na allowlist
    isAllowed: function(a) {
      return i(a);
    }
  };
}
var ka = "root-cause-analyzer", Ha = "1.1.0-HEALTH-CONTRACT", ee = {
  DEPENDENCY_FAILED: "DEPENDENCY_FAILED",
  NETWORK_ERROR: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT",
  MODULE_LOAD_ERROR: "MODULE_LOAD_ERROR",
  INITIALIZATION_ERROR: "INITIALIZATION_ERROR",
  CONFIGURATION_ERROR: "CONFIGURATION_ERROR",
  RESOURCE_UNAVAILABLE: "RESOURCE_UNAVAILABLE",
  MEMORY_EXHAUSTED: "MEMORY_EXHAUSTED",
  CYCLIC_DEPENDENCY: "CYCLIC_DEPENDENCY",
  PERMISSION_DENIED: "PERMISSION_DENIED",
  BROWSER_INCOMPATIBLE: "BROWSER_INCOMPATIBLE",
  UNKNOWN: "UNKNOWN"
}, Xt = {
  SLOW_NETWORK: "SLOW_NETWORK",
  HIGH_MEMORY: "HIGH_MEMORY",
  MULTIPLE_TABS: "MULTIPLE_TABS",
  EXTENSIONS: "EXTENSIONS",
  LOW_BATTERY: "LOW_BATTERY",
  PREVIOUS_ERRORS: "PREVIOUS_ERRORS",
  COLD_START: "COLD_START"
}, io = [
  { pattern: /failed to fetch|network|ERR_NETWORK/i, cause: ee.NETWORK_ERROR },
  { pattern: /timeout|timed out|ETIMEDOUT/i, cause: ee.TIMEOUT },
  { pattern: /cannot read|undefined is not|null is not/i, cause: ee.INITIALIZATION_ERROR },
  { pattern: /module|import|export|require/i, cause: ee.MODULE_LOAD_ERROR },
  { pattern: /config|configuration|missing.*(key|property)/i, cause: ee.CONFIGURATION_ERROR },
  { pattern: /permission|denied|forbidden|401|403/i, cause: ee.PERMISSION_DENIED },
  { pattern: /memory|heap|allocation/i, cause: ee.MEMORY_EXHAUSTED },
  { pattern: /circular|cyclic|recursion/i, cause: ee.CYCLIC_DEPENDENCY },
  { pattern: /not supported|incompatible|polyfill/i, cause: ee.BROWSER_INCOMPATIBLE }
], rt = [], ap = 50, se = {
  networkInfo: null,
  memoryInfo: null,
  previousErrors: [],
  timestamp: null
};
function _s(e) {
  se = {
    networkInfo: e.networkInfo || se.networkInfo,
    memoryInfo: e.memoryInfo || se.memoryInfo,
    previousErrors: e.previousErrors || se.previousErrors,
    timestamp: Date.now()
  };
}
function Ns(e, t, r) {
  se.previousErrors.push({
    error: e.message || String(e),
    phaseId: t,
    moduleId: r,
    timestamp: Date.now()
  }), se.previousErrors.length > 20 && (se.previousErrors = se.previousErrors.slice(-20));
}
function op(e) {
  for (var t = e.message || String(e), r = 0; r < io.length; r++)
    if (io[r].pattern.test(t))
      return io[r].cause;
  return ee.UNKNOWN;
}
function sp(e, t, r) {
  if (!t || t.length === 0 || !r) return null;
  for (var n = 0; n < t.length; n++) {
    var i = t[n], o = r[i];
    if (!o || !o.success)
      return i;
  }
  return null;
}
function lp() {
  var e = [];
  if (se.networkInfo) {
    var t = se.networkInfo.quality;
    (t === "poor" || t === "fair") && e.push(Xt.SLOW_NETWORK);
  }
  if (se.memoryInfo) {
    var r = se.memoryInfo.usedJSHeapSize / se.memoryInfo.jsHeapSizeLimit;
    r > 0.8 && e.push(Xt.HIGH_MEMORY);
  }
  var n = se.previousErrors.filter(function(i) {
    return Date.now() - i.timestamp < 6e4;
  });
  return n.length > 2 && e.push(Xt.PREVIOUS_ERRORS), e;
}
function up(e, t) {
  var r = {
    [ee.DEPENDENCY_FAILED]: function() {
      return "A dependent phase (" + (t.failedDependency || "unknown") + ") failed. Check that phase's errors first.";
    },
    [ee.NETWORK_ERROR]: function() {
      return "Network request failed. Check internet connectivity and server availability.";
    },
    [ee.TIMEOUT]: function() {
      return "Operation timed out. This may be due to slow network or overloaded server. Consider increasing timeout.";
    },
    [ee.MODULE_LOAD_ERROR]: function() {
      return "Failed to load a JavaScript module. Check that all module paths are correct and files exist.";
    },
    [ee.INITIALIZATION_ERROR]: function() {
      return "Module initialization failed. Check for null/undefined values in the code.";
    },
    [ee.CONFIGURATION_ERROR]: function() {
      return "Configuration issue detected. Verify that all required config values are set.";
    },
    [ee.RESOURCE_UNAVAILABLE]: function() {
      return "A required resource is unavailable. Check server logs and resource paths.";
    },
    [ee.MEMORY_EXHAUSTED]: function() {
      return "Memory limit reached. Try closing other tabs or increasing available memory.";
    },
    [ee.CYCLIC_DEPENDENCY]: function() {
      return "Circular dependency detected. Review module imports and phase dependencies.";
    },
    [ee.PERMISSION_DENIED]: function() {
      return "Permission denied. Check authentication status and user permissions.";
    },
    [ee.BROWSER_INCOMPATIBLE]: function() {
      return "Browser compatibility issue. Some features may require a modern browser.";
    },
    [ee.UNKNOWN]: function() {
      return "Unknown error. Check browser console for more details.";
    }
  }, n = r[e];
  return n ? n() : "No specific suggestion available.";
}
function cp(e, t) {
  var r = 0.5;
  return t.failedDependency && e === ee.DEPENDENCY_FAILED && (r += 0.3), t.contributingFactors.indexOf(Xt.SLOW_NETWORK) !== -1 && (e === ee.NETWORK_ERROR || e === ee.TIMEOUT) && (r += 0.2), t.contributingFactors.indexOf(Xt.HIGH_MEMORY) !== -1 && e === ee.MEMORY_EXHAUSTED && (r += 0.25), t.contributingFactors.indexOf(Xt.PREVIOUS_ERRORS) !== -1 && (r += 0.1), Math.min(r, 0.95);
}
function Bi(e) {
  e === void 0 && (e = {});
  var t = e.error, r = e.phaseId, n = e.moduleId, i = e.dependencies || [], o = e.phaseResults || {}, l = e.networkState, a = e.memoryState;
  l && (se.networkInfo = l), a && (se.memoryInfo = a), t && Ns(t, r, n);
  var s = sp(r, i, o), u;
  s ? u = ee.DEPENDENCY_FAILED : t ? u = op(t) : u = ee.UNKNOWN;
  var c = lp(), d = {
    failedDependency: s,
    contributingFactors: c
  }, f = up(u, d), g = cp(u, d), h = {
    primaryCause: u,
    failedDependency: s,
    contributingFactors: c,
    suggestion: f,
    confidence: g,
    phaseId: r,
    moduleId: n,
    errorMessage: t ? t.message || String(t) : null,
    timestamp: Date.now(),
    context: {
      networkQuality: se.networkInfo ? se.networkInfo.quality : "unknown",
      memoryUsage: se.memoryInfo ? Math.round(se.memoryInfo.usedJSHeapSize / se.memoryInfo.jsHeapSizeLimit * 100) + "%" : "unknown",
      recentErrors: se.previousErrors.length
    }
  };
  for (rt.unshift(h); rt.length > ap; )
    rt.pop();
  return h;
}
function td(e) {
  return rt.filter(function(t) {
    return t.phaseId === e;
  });
}
function rd(e) {
  return rt.slice(0, e || 10);
}
function ei() {
  var e = {}, t = {};
  return rt.forEach(function(r) {
    e[r.primaryCause] = (e[r.primaryCause] || 0) + 1, r.phaseId && (t[r.phaseId] = (t[r.phaseId] || 0) + 1);
  }), {
    byCause: e,
    byPhase: t,
    totalAnalyses: rt.length,
    mostCommonCause: Object.keys(e).sort(function(r, n) {
      return e[n] - e[r];
    })[0] || null
  };
}
function Ms(e) {
  (!e || e.length === 0) && (e = rt.slice(0, 5));
  var t = [], r = {};
  return e.forEach(function(n) {
    r[n.primaryCause] || (r[n.primaryCause] = !0, t.push({
      cause: n.primaryCause,
      suggestion: n.suggestion,
      confidence: n.confidence,
      affectedPhases: e.filter(function(i) {
        return i.primaryCause === n.primaryCause;
      }).map(function(i) {
        return i.phaseId;
      })
    }));
  }), t.sort(function(n, i) {
    return i.confidence - n.confidence;
  });
}
function nd() {
  rt = [], se.previousErrors = [];
}
function Ps() {
  rt = [], se = {
    networkInfo: null,
    memoryInfo: null,
    previousErrors: [],
    timestamp: null
  };
}
function id() {
  var e = ei();
  return {
    moduleId: ka,
    version: Ha,
    analysisCount: rt.length,
    mostCommonCause: e.mostCommonCause,
    causeTypes: Object.keys(ee),
    contextAge: se.timestamp ? Date.now() - se.timestamp : null,
    improvements: ["#28-RootCauseAnalysis"]
  };
}
function ad() {
  var e = ei(), t = B.HEALTHY;
  return rt.length > 10 && (t = B.DEGRADED), ue({
    status: t,
    moduleId: ka,
    version: Ha,
    details: {
      totalAnalyses: rt.length,
      mostCommonCause: e.mostCommonCause
    }
  });
}
var dp = {
  CAUSE_TYPES: ee,
  CONTRIBUTING_FACTORS: Xt,
  analyze: Bi,
  updateContext: _s,
  recordError: Ns,
  getPhaseAnalysis: td,
  getRecentAnalyses: rd,
  getErrorTrends: ei,
  getSuggestions: Ms,
  clearHistory: nd,
  reset: Ps,
  info: id,
  healthCheck: ad,
  MODULE_ID: ka,
  VERSION: Ha
};
const fp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  CAUSE_TYPES: ee,
  CONTRIBUTING_FACTORS: Xt,
  MODULE_ID: ka,
  VERSION: Ha,
  analyze: Bi,
  clearHistory: nd,
  default: dp,
  getErrorTrends: ei,
  getPhaseAnalysis: td,
  getRecentAnalyses: rd,
  getSuggestions: Ms,
  healthCheck: ad,
  info: id,
  recordError: Ns,
  reset: Ps,
  updateContext: _s
}, Symbol.toStringTag, { value: "Module" }));
var ti = "otel-exporter", ri = "1.1.0-HEALTH-CONTRACT", q = {
  enabled: !1,
  endpoint: null,
  serviceName: "bootstrap-v2",
  serviceVersion: "3.3.0",
  environment: "production",
  batchSize: 10,
  flushIntervalMs: 5e3,
  timeout: 1e4,
  headers: {}
}, wn = !1, er = null, br = null, jr = [], Fe = [], Wr = null, Xe = {
  spansCreated: 0,
  spansExported: 0,
  spansFailed: 0,
  flushCount: 0
};
function od() {
  for (var e = "0123456789abcdef", t = "", r = 0; r < 32; r++)
    t += e[Math.floor(Math.random() * 16)];
  return t;
}
function hp() {
  for (var e = "0123456789abcdef", t = "", r = 0; r < 16; r++)
    t += e[Math.floor(Math.random() * 16)];
  return t;
}
function Oi() {
  return Date.now() * 1e6;
}
function ks(e) {
  return e === void 0 && (e = {}), q.enabled = e.enabled !== !1, q.endpoint = e.endpoint || null, q.serviceName = e.serviceName || q.serviceName, q.serviceVersion = e.serviceVersion || q.serviceVersion, q.environment = e.environment || q.environment, q.batchSize = e.batchSize || q.batchSize, q.flushIntervalMs = e.flushIntervalMs || q.flushIntervalMs, q.timeout = e.timeout || q.timeout, q.headers = e.headers || {}, wn = !0, q.enabled && q.endpoint && gp(), {
    success: !0,
    config: {
      enabled: q.enabled,
      endpoint: q.endpoint ? "configured" : "not-configured",
      serviceName: q.serviceName
    }
  };
}
function gp() {
  Wr && clearInterval(Wr), Wr = setInterval(function() {
    Fe.length > 0 && Rr();
  }, q.flushIntervalMs);
}
function sd() {
  Wr && (clearInterval(Wr), Wr = null);
}
function ni(e, t) {
  t === void 0 && (t = {});
  var r = hp(), n = t.traceId || er || od(), i = t.parentSpanId || br || null, o = {
    traceId: n,
    spanId: r,
    parentSpanId: i,
    name: e,
    kind: t.kind || "INTERNAL",
    startTimeUnixNano: Oi(),
    endTimeUnixNano: null,
    attributes: [],
    events: [],
    status: { code: "UNSET" },
    resource: {
      "service.name": q.serviceName,
      "service.version": q.serviceVersion,
      "deployment.environment": q.environment
    }
  };
  if (t.attributes) {
    var l = t.attributes;
    Object.keys(l).forEach(function(a) {
      o.attributes.push({
        key: a,
        value: { stringValue: String(l[a]) }
      });
    });
  }
  return jr.push(o), Xe.spansCreated++, {
    spanId: r,
    traceId: n,
    setAttribute: function(a, s) {
      return o.attributes.push({
        key: a,
        value: Ii(s)
      }), this;
    },
    setAttributes: function(a) {
      return Object.keys(a).forEach(function(s) {
        o.attributes.push({
          key: s,
          value: Ii(a[s])
        });
      }), this;
    },
    addEvent: function(a, s) {
      return o.events.push({
        name: a,
        timeUnixNano: Oi(),
        attributes: s ? Object.keys(s).map(function(u) {
          return { key: u, value: Ii(s[u]) };
        }) : []
      }), this;
    },
    setStatus: function(a, s) {
      return o.status = {
        code: a,
        message: s || null
      }, this;
    },
    end: function(a) {
      o.endTimeUnixNano = a ? a * 1e6 : Oi();
      var s = jr.indexOf(o);
      return s !== -1 && (jr.splice(s, 1), Fe.push(o)), Fe.length >= q.batchSize && Rr(), this;
    },
    getSpan: function() {
      return o;
    }
  };
}
function Ii(e) {
  return typeof e == "string" ? { stringValue: e } : typeof e == "number" ? Number.isInteger(e) ? { intValue: String(e) } : { doubleValue: e } : typeof e == "boolean" ? { boolValue: e } : Array.isArray(e) ? {
    arrayValue: {
      values: e.map(function(t) {
        return Ii(t);
      })
    }
  } : { stringValue: String(e) };
}
function ld(e) {
  er = od(), br = null;
  var t = ni("bootstrap-v2:boot", {
    traceId: er,
    kind: "INTERNAL",
    attributes: {
      "boot.id": e || er,
      "boot.start_time": (/* @__PURE__ */ new Date()).toISOString()
    }
  });
  return br = t.spanId, t;
}
function ud(e, t, r) {
  return r === void 0 && (r = {}), ni("phase:" + e, {
    traceId: er,
    parentSpanId: r.parentSpanId || br,
    kind: "INTERNAL",
    attributes: {
      "phase.id": e,
      "phase.name": t || e,
      "phase.critical": r.critical ? "true" : "false",
      "phase.order": r.order !== void 0 ? String(r.order) : null
    }
  });
}
function cd(e, t, r, n) {
  return ni("module:" + t, {
    traceId: er,
    parentSpanId: n || br,
    kind: "INTERNAL",
    attributes: {
      "module.id": t,
      "module.name": r || t,
      "module.phase": e
    }
  });
}
function dd(e) {
  return {
    resourceSpans: [{
      resource: {
        attributes: [
          { key: "service.name", value: { stringValue: q.serviceName } },
          { key: "service.version", value: { stringValue: q.serviceVersion } },
          { key: "deployment.environment", value: { stringValue: q.environment } }
        ]
      },
      scopeSpans: [{
        scope: {
          name: ti,
          version: ri
        },
        spans: e.map(function(t) {
          return {
            traceId: t.traceId,
            spanId: t.spanId,
            parentSpanId: t.parentSpanId || "",
            name: t.name,
            kind: t.kind === "INTERNAL" ? 1 : t.kind === "SERVER" ? 2 : t.kind === "CLIENT" ? 3 : 1,
            startTimeUnixNano: String(t.startTimeUnixNano),
            endTimeUnixNano: String(t.endTimeUnixNano || Oi()),
            attributes: t.attributes,
            events: t.events,
            status: t.status
          };
        })
      }]
    }]
  };
}
async function Rr() {
  if (!q.enabled || !q.endpoint || Fe.length === 0)
    return { success: !0, exported: 0, reason: "nothing-to-flush" };
  var e = Fe.slice();
  Fe = [];
  var t = dd(e);
  try {
    var r = await fetch(q.endpoint, {
      method: "POST",
      headers: Object.assign({
        "Content-Type": "application/json"
      }, q.headers),
      body: JSON.stringify(t),
      signal: AbortSignal.timeout ? AbortSignal.timeout(q.timeout) : void 0
    });
    return r.ok ? (Xe.spansExported += e.length, Xe.flushCount++, { success: !0, exported: e.length }) : (Fe = e.concat(Fe), Xe.spansFailed += e.length, { success: !1, error: "HTTP " + r.status, exported: 0 });
  } catch (n) {
    return Fe = e.concat(Fe), Xe.spansFailed += e.length, { success: !1, error: n.message, exported: 0 };
  }
}
function Hs() {
  var e = jr.concat(Fe);
  return e.length === 0 ? null : dd(e);
}
function Bs() {
  return {
    traceId: er,
    spanId: br
  };
}
function fd() {
  sd(), Fe.length > 0 && Rr(), wn = !1;
}
function Us() {
  sd(), er = null, br = null, jr = [], Fe = [], Xe = {
    spansCreated: 0,
    spansExported: 0,
    spansFailed: 0,
    flushCount: 0
  };
}
function xs() {
  return {
    moduleId: ti,
    version: ri,
    initialized: wn,
    enabled: q.enabled,
    endpoint: q.endpoint ? "configured" : null,
    serviceName: q.serviceName,
    activeSpans: jr.length,
    pendingSpans: Fe.length,
    metrics: Object.assign({}, Xe),
    traceContext: Bs(),
    improvements: ["#13-OpenTelemetryExport"]
  };
}
function hd() {
  var e = B.HEALTHY;
  return wn && q.enabled ? Xe.spansFailed > Xe.spansExported * 0.1 && (e = B.DEGRADED) : e = B.DEGRADED, ue({
    status: e,
    moduleId: ti,
    version: ri,
    details: {
      enabled: q.enabled,
      initialized: wn,
      pendingSpans: Fe.length,
      exportSuccessRate: Xe.spansExported > 0 ? Math.round(Xe.spansExported / (Xe.spansExported + Xe.spansFailed) * 100) : 100
    }
  });
}
var mp = {
  init: ks,
  createSpan: ni,
  startBootTrace: ld,
  startPhaseSpan: ud,
  startModuleSpan: cd,
  flush: Rr,
  getExportData: Hs,
  getTraceContext: Bs,
  shutdown: fd,
  reset: Us,
  info: xs,
  healthCheck: hd,
  MODULE_ID: ti,
  VERSION: ri
};
const pp = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ti,
  VERSION: ri,
  createSpan: ni,
  default: mp,
  flush: Rr,
  getExportData: Hs,
  getTraceContext: Bs,
  healthCheck: hd,
  info: xs,
  init: ks,
  reset: Us,
  shutdown: fd,
  startBootTrace: ld,
  startModuleSpan: cd,
  startPhaseSpan: ud
}, Symbol.toStringTag, { value: "Module" })), Dn = "3.4.0-SPRINT7", en = "bootstrap-v2", gd = "__BOOTSTRAP_V2_STATE__", Me = {
  IDLE: "idle",
  STARTING: "starting",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  SAFE_MODE: "safe_mode"
}, Ue = Object.freeze({
  maxBootsInWindow: 3,
  windowMs: 3e4,
  cooldownMs: 6e4,
  storageKey: "__BOOT_LOOP_TRACKER__"
}), go = Object.freeze({
  enabled: !0,
  timeoutMs: 12e4,
  warningMs: 9e4
}), Lt = Object.freeze({
  enabled: !0,
  autoStart: !0,
  interval: 3e4,
  maxChecks: 100,
  startDelay: 5e3
}), Ep = Ln({ moduleId: en + ":logger-helper" });
function md(e) {
  const t = Array.prototype.slice.call(arguments, 1), r = Ep.get("logger");
  r && typeof r[e] == "function" && r[e].apply(r, ["[" + en + "]"].concat(t));
}
function vp() {
  const e = Array.prototype.slice.call(arguments);
  md.apply(null, ["warn"].concat(e));
}
function Ll() {
  const e = Array.prototype.slice.call(arguments);
  md.apply(null, ["error"].concat(e));
}
function pd() {
  try {
    const e = sessionStorage.getItem(Ue.storageKey);
    if (e)
      return JSON.parse(e);
  } catch {
  }
  return { boots: [], cooldownUntil: null, loopDetected: !1 };
}
function _l(e) {
  try {
    sessionStorage.setItem(Ue.storageKey, JSON.stringify(e));
  } catch {
  }
}
function yp() {
  try {
    sessionStorage.removeItem(Ue.storageKey);
  } catch {
  }
}
function Ap(e) {
  const t = pd(), r = Date.now();
  if (t.cooldownUntil && r < t.cooldownUntil) {
    const i = t.cooldownUntil - r;
    return Ll("Boot blocked - in cooldown due to boot loop", {
      remainingMs: i,
      remainingSec: Math.ceil(i / 1e3)
    }), {
      allowed: !1,
      reason: "BOOT_LOOP_COOLDOWN",
      remainingMs: i,
      loopDetected: !0
    };
  }
  t.cooldownUntil && r >= t.cooldownUntil && (t.cooldownUntil = null, t.loopDetected = !1, t.boots = []);
  const n = r - Ue.windowMs;
  return t.boots = t.boots.filter(function(i) {
    return i > n;
  }), t.boots.length >= Ue.maxBootsInWindow ? (t.loopDetected = !0, t.cooldownUntil = r + Ue.cooldownMs, _l(t), Ll("Boot loop detected! Entering cooldown", {
    bootsInWindow: t.boots.length,
    maxAllowed: Ue.maxBootsInWindow,
    cooldownMs: Ue.cooldownMs
  }), e && e.notify && e.notify("boot-loop-detected", "Boot loop detectado - sistema em cooldown", {
    bootsInWindow: t.boots.length,
    cooldownMs: Ue.cooldownMs
  }), {
    allowed: !1,
    reason: "BOOT_LOOP_DETECTED",
    bootsInWindow: t.boots.length,
    cooldownMs: Ue.cooldownMs,
    loopDetected: !0
  }) : (t.boots.push(r), _l(t), {
    allowed: !0,
    bootsInWindow: t.boots.length,
    maxAllowed: Ue.maxBootsInWindow,
    loopDetected: !1
  });
}
function Fs() {
  const e = pd(), t = Date.now(), r = t - Ue.windowMs;
  return {
    bootsInWindow: e.boots.filter(function(i) {
      return i > r;
    }).length,
    maxAllowed: Ue.maxBootsInWindow,
    inCooldown: e.cooldownUntil && t < e.cooldownUntil,
    cooldownRemaining: e.cooldownUntil ? Math.max(0, e.cooldownUntil - t) : 0,
    loopDetected: e.loopDetected,
    config: Ue
  };
}
function Sp() {
  yp();
}
const Op = "timeout-manager", Ip = "2.7.0-RESILIENCE-CONTRACT";
function Tp(e) {
  e || (e = {});
  const t = e.onTimeout, r = e.onWarning, n = e.loggerAdapter, i = e.config || go, o = em({
    timeout: i.timeoutMs || ve.timeout.global,
    warning: i.warningMs || ve.timeout.warning,
    enabled: i.enabled !== void 0 ? i.enabled : !0
  });
  let l = null, a = null, s = null, u = !1, c = !1, d = !1, f = {
    starts: 0,
    clears: 0,
    warnings: 0,
    timeouts: 0,
    totalElapsed: 0
  };
  function g(h, p, A) {
    n && n[h] && n[h](p, A);
  }
  return {
    /**
     * start — Inicia o timeout global
     */
    start: function() {
      if (!o.enabled) {
        g("info", "Global timeout disabled, not starting");
        return;
      }
      this.clear("restart"), s = Date.now(), u = !1, c = !1, d = !1, f.starts++, o.warningMs < o.timeoutMs && (a = setTimeout(function() {
        if (!u && r) {
          c = !0, f.warnings++;
          const h = Date.now() - s, p = Hi({
            outcome: ft.DEGRADED,
            duration: h,
            details: {
              type: "warning",
              elapsed: h,
              remaining: o.timeoutMs - h,
              message: "Boot is taking longer than expected"
            }
          });
          r(p);
        }
      }, o.warningMs)), l = setTimeout(function() {
        if (!u && t) {
          d = !0, f.timeouts++;
          const h = Date.now() - s;
          f.totalElapsed += h;
          const p = Hi({
            outcome: ft.TIMEOUT_EXCEEDED,
            duration: h,
            details: {
              type: "timeout",
              elapsed: h,
              timeoutMs: o.timeoutMs,
              message: "Boot exceeded global timeout"
            }
          });
          t(p);
        }
      }, o.timeoutMs), g("info", "Global timeout started", {
        timeoutMs: o.timeoutMs,
        warningMs: o.warningMs
      });
    },
    /**
     * clear — Limpa o timeout (boot completou ou foi cancelado)
     * @param {string} reason — Motivo do clear
     */
    clear: function(h) {
      const p = !!l, A = s ? Date.now() - s : 0;
      u = !0, l && (clearTimeout(l), l = null), a && (clearTimeout(a), a = null), p && (f.clears++, f.totalElapsed += A, g("info", "Global timeout cleared", {
        reason: h,
        elapsed: A,
        warningFired: c,
        timeoutFired: d
      })), s = null, c = !1, d = !1;
    },
    /**
     * getStatus — Retorna status atual do timeout
     * @returns {Object}
     */
    getStatus: function() {
      return {
        enabled: o.enabled,
        running: !!l,
        elapsed: s ? Date.now() - s : 0,
        timeoutMs: o.timeoutMs,
        warningMs: o.warningMs,
        warningFired: c,
        timeoutFired: d,
        aborted: u
      };
    },
    /**
     * getElapsed — Retorna tempo decorrido
     * @returns {number}
     */
    getElapsed: function() {
      return s ? Date.now() - s : 0;
    },
    /**
     * getRemainingTime — Retorna tempo restante até timeout
     * @returns {number}
     */
    getRemainingTime: function() {
      if (!s || u) return 0;
      const h = o.timeoutMs - (Date.now() - s);
      return h > 0 ? h : 0;
    },
    /**
     * getStats — Retorna estatísticas
     * @returns {Object}
     */
    getStats: function() {
      return Object.assign({}, f);
    },
    /**
     * resetStats — Reseta estatísticas
     */
    resetStats: function() {
      f = {
        starts: 0,
        clears: 0,
        warnings: 0,
        timeouts: 0,
        totalElapsed: 0
      };
    },
    /**
     * info — Informações do manager
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: Op,
        version: Ip,
        config: {
          enabled: o.enabled,
          timeoutMs: o.timeoutMs,
          warningMs: o.warningMs
        },
        defaults: {
          global: ve.timeout.global,
          warning: ve.timeout.warning,
          minimum: ve.timeout.minimum,
          maximum: ve.timeout.maximum
        },
        status: this.getStatus(),
        stats: Object.assign({}, f),
        contractVersion: "1.0.0"
      };
    }
  };
}
function Ba() {
  if (!(typeof window > "u"))
    return window[gd];
}
function bp(e) {
  typeof window > "u" || (window[gd] = e);
}
function Rp() {
  if (typeof window > "u") return;
  const e = Ba();
  e ? (e.state === Me.RUNNING || e.state === Me.COMPLETED) && vp("Bootstrap already " + e.state + ", blocking duplicate execution") : bp({
    state: Me.IDLE,
    startCount: 0,
    timestamp: null,
    bootLoopDetected: !1
  });
}
function Gs() {
  return Ba() || null;
}
function Pr(e) {
  const t = Ba();
  if (t)
    for (const r in e)
      e.hasOwnProperty(r) && (t[r] = e[r]);
}
function wp() {
  const e = Ba();
  e && (e.state = Me.IDLE, e.bootLoopDetected = !1);
}
var gt = "phase-0-critical", Nl = "3.1.0-TIMEOUT-FORMALIZED", Ti = null;
typeof window < "u" && (window.__PRELOADER_MANAGED_BY_BOOTSTRAP__ = !0);
var $t = { total: 0, byEvent: {}, lastEmitAt: null };
function Ft(e) {
  $t.total++, $t.byEvent[e] = ($t.byEvent[e] || 0) + 1, $t.lastEmitAt = Date.now();
}
var mo = null;
function Dp() {
  if (mo) return mo;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var e = window.Core.windowAdapter.get("Logger");
    if (e) return e;
  }
  return typeof window < "u" ? window.Logger : null;
}
function dt(e, ...t) {
  var r = Array.prototype.slice.call(arguments, 1), n = Dp();
  n && typeof n[e] == "function" && n[e].apply(n, ["[phase-0]"].concat(r));
}
function Gt(e, t) {
  if (Ti && Ti.emit)
    try {
      Ti.emit(e, t);
    } catch {
    }
}
var Ed = {
  id: "phase-0-critical",
  name: "Critical Infrastructure",
  order: 0,
  critical: !0,
  recoverable: !1,
  dependsOn: [],
  parallel: !1,
  modules: [
    { id: "eventbus", name: "EventBus Enterprise", critical: !0, timeout: 3e3 },
    { id: "logger", name: "Logger Global", critical: !0, timeout: 5e3 },
    { id: "preloader", name: "Preloader System", critical: !1, timeout: 3e3 },
    { id: "error-boundary", name: "Error Boundary", critical: !0, timeout: 3e3 },
    { id: "config", name: "Config Loader", critical: !0, timeout: z.CONFIG_WAIT },
    { id: "security-csrf", name: "Security CSRF", critical: !1, timeout: 3e3 },
    { id: "environment", name: "Environment Manager", critical: !1, timeout: 3e3 }
  ],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = e.windowAdapter, i = { initialized: [], failed: [] }, o = performance.now();
    return mo = t, typeof window < "u" && (window.Core = window.Core || {}), dt("info", "Starting Critical Infrastructure v3.1.0-TIMEOUT-FORMALIZED"), Promise.resolve().then(function() {
      return import("/core/js/event-bus/dist/event-bus.bundle.js").then(function(l) {
        var a = l.default || l.eventBusInstance;
        if (!a) throw new Error("EventBus instance not found in module");
        Ti = a, typeof window < "u" && (window.EventBus && window.EventBus !== a && dt("warn", "Replacing existing window.EventBus with Enterprise version"), Object.defineProperty(window, "EventBus", { value: a, writable: !1, configurable: !1 }), window.isEnterpriseEventBus = function() {
          return a.version && a.version.includes("ENTERPRISE");
        }), n && n.expose && n.expose("EventBus", a), i.initialized.push("eventbus"), Ft("EVENTBUS_READY"), Gt(Bt.EVENTBUS_READY, { version: a.version, timestamp: Date.now(), source: gt }), dt("info", "EventBus Enterprise " + a.version + " ready (singleton, frozen)");
      }).catch(function(l) {
        throw i.failed.push({ id: "eventbus", error: l.message }), dt("error", "CRITICAL: EventBus failed", l), l;
      });
    }).then(function() {
      return import("/assets/js/core/logger-global/dist/logger-global.bundle.js").then(function(l) {
        var a = l.Logger || l.default;
        a && (n && n.expose && (n.expose("Logger", a), n.expose("LoggerGlobal", a)), i.initialized.push("logger"), t && t.info && t.info("Logger Global ready"), Ft("LOGGER_READY"), Gt(Bt.LOGGER_READY, { timestamp: Date.now(), source: gt }));
      }).catch(function(l) {
        throw i.failed.push({ id: "logger", error: l.message }), dt("error", "Logger Global failed", l), l;
      });
    }).then(function() {
      return import("/components/preloader/dist/preloader.bundle.js").then(function(l) {
        var a = l.startPreloader;
        if (a && typeof a == "function")
          return a({ useAAAMode: !0 }).then(function(u) {
            return u && (i.initialized.push("preloader"), Ft("PRELOADER_READY"), Gt(Bt.PRELOADER_READY, {
              version: l.VERSION || "unknown",
              managedByBootstrap: !0,
              timestamp: Date.now(),
              source: gt
            }), dt("info", "Preloader System ready (managed by Bootstrap)", { version: l.VERSION })), u;
          });
        dt("warn", "startPreloader not found, falling back to autoInit");
        var s = l.autoInit;
        if (s) return s();
      }).catch(function(l) {
        i.failed.push({ id: "preloader", error: l.message, critical: !1 }), dt("warn", "Preloader System failed (non-critical, continuing)", { error: l.message });
      });
    }).then(function() {
      return import("/components/error-boundary/dist/error-boundary.bundle.js").then(function(l) {
        var a = l.ErrorBoundary || l.default;
        if (a)
          return Promise.resolve(a.init({ autoCapture: !0 })).then(function() {
            var s = l.ErrorCatcher;
            s && s.startGlobalCapture({ rateLimitWindow: 6e4, rateLimitMax: 10 }), n && n.expose && n.expose("ErrorBoundary", a), i.initialized.push("error-boundary"), t && t.info && t.info("Error Boundary ready - Global capture active"), Ft("ERROR_BOUNDARY_READY"), Gt(Bt.ERROR_BOUNDARY_READY, { timestamp: Date.now(), source: gt });
          });
      }).catch(function(l) {
        i.failed.push({ id: "error-boundary", error: l.message }), t && t.warn && t.warn("Error Boundary failed (continuing)", { error: l.message });
      });
    }).then(function() {
      return import("/assets/js/core/config-loader/dist/config-loader.bundle.js").then(function(l) {
        var a = l.default || l;
        if (a) {
          a.load && typeof a.load == "function" && (a.load(), dt("info", "Config.load() called explicitly"));
          var s = a.waitReady ? a.waitReady(z.CONFIG_WAIT) : Promise.resolve();
          return Promise.race([s, new Promise(function(u, c) {
            setTimeout(function() {
              c(new Error("Config timeout"));
            }, z.CONFIG_WAIT);
          })]).then(function(u) {
            u === !1 && dt("warn", "Config.waitReady() resolved with false, proceeding anyway"), n && n.expose && (n.expose("Config", a), n.expose("APP_CONFIG", a.getAll ? a.getAll() : {})), i.initialized.push("config"), t && t.info && t.info("Config Loader ready"), Ft("CONFIG_READY"), Gt(Bt.CONFIG_READY, { timestamp: Date.now(), source: gt });
          });
        }
      }).catch(function(l) {
        throw i.failed.push({ id: "config", error: l.message }), t && t.error && t.error("Config Loader failed", { error: l.message }), l;
      });
    }).then(function() {
      return import("/components/security/csrf-token-manager/dist/csrf-token-manager.bundle.js").then(function(l) {
        var a = l.SecurityCSRF || l.default;
        a && (n && n.expose && n.expose("SecurityCSRF", a), i.initialized.push("security-csrf"), t && t.info && t.info("Security CSRF ready"), Ft("SECURITY_CSRF_READY"), Gt(Bt.SECURITY_CSRF_READY, { timestamp: Date.now(), source: gt }));
      }).catch(function(l) {
        i.failed.push({ id: "security-csrf", error: l.message }), t && t.warn && t.warn("Security CSRF failed (non-critical)", { error: l.message });
      });
    }).then(function() {
      return import("/assets/js/core/environment-manager/dist/environment-manager.bundle.js").then(function(l) {
        var a = l.default || l;
        a && (n && n.expose && n.expose("EnvironmentManager", a), i.initialized.push("environment"), t && t.info && t.info("Environment Manager ready"), Ft("ENVIRONMENT_READY"), Gt(Bt.ENVIRONMENT_READY, { timestamp: Date.now(), source: gt }));
      }).catch(function(l) {
        i.failed.push({ id: "environment", error: l.message }), t && t.warn && t.warn("Environment Manager failed (non-critical)", { error: l.message });
      });
    }).then(function() {
      var l = Math.round(performance.now() - o);
      Ft("PHASE0_COMPLETE"), Gt(Bt.PHASE0_COMPLETE, { initialized: i.initialized, failed: i.failed.map(function(s) {
        return s.id;
      }), time: l, timestamp: Date.now(), source: gt, preloaderManaged: !0 }), r && r.track && r.track("phase-0-complete", { initialized: i.initialized.length, failed: i.failed.length, time: l, preloaderManaged: !0 }), t && t.info && t.info("Phase 0 complete", { initialized: i.initialized, failed: i.failed, time: l, preloaderManaged: !0 }), dt("info", "Complete: " + i.initialized.length + " modules, " + l + "ms (Preloader managed by Bootstrap)");
      var a = i.failed.filter(function(s) {
        return s.id === "eventbus" || s.id === "logger" || s.id === "config";
      });
      return { success: a.length === 0, initialized: i.initialized, failed: i.failed, time: l, emitMetrics: Object.assign({}, $t), preloaderManaged: !0 };
    });
  },
  getEmitMetrics: function() {
    return Object.assign({}, $t);
  },
  healthCheck: function() {
    return ue({ status: B.HEALTHY, moduleId: gt, version: Nl, details: { emitMetrics: Object.assign({}, $t), p24Instrumented: !0, preloaderManaged: !0 } });
  },
  info: function() {
    return { moduleId: gt, version: Nl, modules: Ed.modules.map(function(e) {
      return e.id;
    }), emitMetrics: Object.assign({}, $t), preloaderManaged: !0 };
  }
}, Ei = "phase-1-core", vi = "3.12.0-FF-HEALTH-REGISTERED", _ = { executed: !1, executedAt: null, results: null, errors: [], featuresRegistered: !1, coreLoaded: !1, featureFlagsInitialized: !1, governanceValidated: !1, governanceScore: null, runtimeHealthScore: null, runtimeHealthStatus: null }, bi = null;
function ln() {
  if (bi && bi.get) {
    var e = bi.get("ReadyFlags");
    if (e) return e;
  }
  return typeof window < "u" ? window.ReadyFlags : null;
}
var bt = {
  id: "phase-1-core",
  name: "Core Systems",
  version: vi,
  order: 1,
  critical: !0,
  recoverable: !1,
  dependsOn: ["phase-0-critical"],
  parallel: !0,
  modules: [
    { id: "eventbus", name: "EventBus Global", critical: !0, timeout: 5e3 },
    { id: "globalstate", name: "Global State Manager", critical: !0, timeout: 5e3 },
    { id: "ready-flags", name: "ReadyFlags Provider", critical: !1, timeout: 2e3 },
    { id: "context-provider", name: "Context Provider", critical: !1, timeout: 3e3 },
    { id: "feature-flags", name: "Feature Flags Manager", critical: !1, timeout: 3e3 },
    // v3.8.0: Inicialização formal
    { id: "asset-loader", name: "AssetLoader Enterprise", critical: !1, timeout: 3e3 },
    { id: "telemetry-core", name: "Telemetry Core", critical: !1, timeout: 3e3 },
    { id: "feature-manifest", name: "Feature Manifest (P2)", critical: !1, timeout: 3e3 },
    { id: "core-enterprise", name: "Core Enterprise (AAA+)", critical: !1, timeout: 3e3 }
  ],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = e.windowAdapter, i = { initialized: [], failed: [] }, o = performance.now();
    bi = n, zd(), t && t.info("Phase 1 starting: Core Systems"), r && r.track("phase-1-start");
    var l = [];
    return l.push(import("/core/js/event-bus/dist/event-bus.bundle.js").then(function(a) {
      var s = a.default || a;
      if (s) {
        var u = s.init ? s.init() : Promise.resolve();
        return Promise.resolve(u).then(function() {
          n && n.expose && n.expose("EventBus", s);
          var c = ln();
          c && c.setReady && c.setReady("eventbus", !0), i.initialized.push("eventbus"), t && t.info("EventBus Global ready");
        });
      }
    }).catch(function(a) {
      throw i.failed.push({ id: "eventbus", error: a.message, critical: !0 }), t && t.error("EventBus Global failed", { error: a.message, strictMode: de() }), de() ? (r && r.error("eventbus-strict-failure", { error: a.message }), new Ht(
        "EventBus falhou em modo strict: " + a.message,
        { type: "EVENTBUS_CRITICAL_FAILURE", phase: "phase-1-core", originalError: a.message }
      )) : a;
    })), l.push(import("/modules/global-state/dist/global-state.bundle.js").then(function(a) {
      var s = a.default || a, u = a.GlobalStateFacade;
      if (s) {
        s.init && s.init({ debug: !1, telemetry: !0 }), n && n.expose && n.expose("GlobalState", u || s);
        var c = ln();
        c && c.setReady && c.setReady("globalstate", !0), i.initialized.push("globalstate"), t && t.info("GlobalState Manager ready (Facade exposed)", { strictMode: de() });
      } else if (de())
        throw new Ht(
          "GlobalState é obrigatório em modo strict mas retornou null",
          { type: "GLOBALSTATE_NULL", phase: "phase-1-core" }
        );
    }).catch(function(a) {
      throw i.failed.push({ id: "globalstate", error: a.message, critical: !0 }), t && t.error("GlobalState Manager failed", { error: a.message, strictMode: de() }), de() ? (r && r.error("globalstate-strict-failure", { error: a.message }), a instanceof Ht ? a : new Ht(
        "GlobalState falhou em modo strict: " + a.message,
        { type: "GLOBALSTATE_CRITICAL_FAILURE", phase: "phase-1-core", originalError: a.message }
      )) : a;
    })), l.push(import("/core/js/ready-flags/index.js").then(function(a) {
      var s = a.default || a.ReadyFlags;
      s && (n && n.expose && n.expose("ReadyFlags", s), i.initialized.push("ready-flags"), t && t.info("ReadyFlags Provider ready", { version: s.VERSION || "unknown" }));
    }).catch(function(a) {
      i.failed.push({ id: "ready-flags", error: a.message, critical: !1 }), t && t.warn("ReadyFlags Provider failed (non-critical)", { error: a.message });
    })), l.push(import("/core/js/asset-loader/dist/asset-loader.bundle.js").then(function(a) {
      var s = a.default || a;
      if (s) {
        s.init && s.init(), n && n.expose && n.expose("AssetLoader", s), i.initialized.push("asset-loader");
        var u = s.getVersion ? s.getVersion() : "unknown";
        t && t.info("AssetLoader Enterprise ready", { version: u });
      }
    }).catch(function(a) {
      i.failed.push({ id: "asset-loader", error: a.message, critical: !1 }), t && t.warn("AssetLoader failed (non-critical)", { error: a.message });
    })), l.push(import("/assets/js/core/telemetry-core/dist/telemetry-core.bundle.js").then(function(a) {
      var s = a.default || a;
      if (s) {
        var u = s.init ? s.init() : Promise.resolve();
        return Promise.resolve(u).then(function() {
          n && n.expose && (n.expose("Telemetry", s), n.expose("TelemetryCore", s));
          var c = ln();
          c && c.setReady && c.setReady("telemetry", !0), i.initialized.push("telemetry-core"), t && t.info("Telemetry Core ready");
        });
      }
    }).catch(function(a) {
      i.failed.push({ id: "telemetry-core", error: a.message, critical: !1 }), t && t.warn("Telemetry Core failed (non-critical)", { error: a.message });
    })), Promise.allSettled(l).then(function() {
      return import("/components/context-provider/dist/context-provider.bundle.js").then(function(a) {
        var s = a.default || a.ContextProvider;
        if (s) {
          s.init({ connectGlobalState: !0, connectOrchestrator: !0 }), n && n.expose && n.expose("ContextProvider", s);
          var u = ln();
          u && u.setReady && u.setReady("context-provider", !0), i.initialized.push("context-provider");
          var c = s.getVersion ? s.getVersion() : "unknown";
          t && t.info("Context Provider ready", { version: c });
        }
      }).catch(function(a) {
        var s = de();
        if (i.failed.push({ id: "context-provider", error: a.message, critical: s }), s)
          throw t && t.error("Context Provider failed (BLOCKING in strict)", { error: a.message }), r && r.error("context-provider-strict-failure", { error: a.message }), new Ht(
            "ContextProvider falhou em modo strict: " + a.message,
            { type: "CONTEXTPROVIDER_CRITICAL_FAILURE", phase: "phase-1-core", originalError: a.message }
          );
        t && t.warn("Context Provider failed (non-critical)", { error: a.message });
      });
    }).then(function() {
      return import("/components/feature-flags/dist/feature-flags.bundle.js").then(function(a) {
        var s = a.default || a.FeatureFlags;
        if (s)
          return s.init({ fetchFromServer: !1 }).then(function() {
            n && n.expose && n.expose("FeatureFlags", s);
            var u = ln();
            u && u.setReady && u.setReady("feature-flags", !0), _.featureFlagsInitialized = !0, i.initialized.push("feature-flags");
            var c = s.getVersion ? s.getVersion() : s.VERSION || "unknown";
            s.healthCheck && Jd("feature-flags", s.healthCheck, "component"), t && t.info("Feature Flags Manager ready (formal init)", { version: c, strictMode: de() });
          });
      }).catch(function(a) {
        i.failed.push({ id: "feature-flags", error: a.message, critical: !1 }), t && t.warn("Feature Flags Manager failed (non-critical)", { error: a.message });
      });
    }).then(function() {
      return import("/core/kernel/feature-definitions.js").then(function(a) {
        var s = a.default || a;
        if (s && s.registerAllFeatures) {
          var u = s.registerAllFeatures({ lock: !0, silent: !1 });
          u.ok ? (_.featuresRegistered = !0, i.initialized.push("feature-manifest"), t && t.info("Feature Manifest registered", {
            total: u.results.total,
            success: u.results.success,
            locked: u.results.locked
          })) : (i.failed.push({ id: "feature-manifest", error: "Registration failed", critical: !1 }), t && t.warn("Feature Manifest registration failed", u));
        }
      }).catch(function(a) {
        i.failed.push({ id: "feature-manifest", error: a.message, critical: !1 }), t && t.warn("Feature Manifest failed (non-critical)", { error: a.message });
      });
    }).then(function() {
      return import("/core/index.js").then(function(a) {
        var s = a.default || a;
        s && (_.coreLoaded = !0, i.initialized.push("core-enterprise"), t && t.info("Core Enterprise loaded", {
          version: s.version,
          kernelVersion: s.Kernel ? s.Kernel.VERSION : "unknown",
          hasGovernance: !!s.Governance,
          hasGovernancePanel: !!s.GovernancePanel
        }));
      }).catch(function(a) {
        i.failed.push({ id: "core-enterprise", error: a.message, critical: !1 }), t && t.warn("Core Enterprise failed (non-critical)", { error: a.message });
      });
    }).then(function() {
      try {
        var a = qd({ phase: "phase-1", module: Ei });
        if (_.governanceValidated = a.passed, _.governanceScore = a.score, i.initialized.push("governance-validation"), t && t.info("Governance rules validated", {
          passed: a.passed,
          score: a.score,
          results: a.results
        }), !a.passed && de()) {
          var s = a.results.filter(function(u) {
            return !u.passed;
          });
          t && t.error("Governance validation failed in strict mode", { failures: s }), r && r.error("governance-strict-failure", { score: a.score, failures: s });
        }
      } catch (u) {
        i.failed.push({ id: "governance-validation", error: u.message, critical: !1 }), t && t.warn("Governance validation error (non-critical)", { error: u.message });
      }
    }).then(function() {
      try {
        var a = Zd();
        _.runtimeHealthScore = a.score, _.runtimeHealthStatus = a.status, i.initialized.push("runtime-health-aggregator"), t && t.info("Runtime health aggregated", {
          status: a.status,
          score: a.score,
          totalModules: a.totalModules
        });
      } catch (s) {
        i.failed.push({ id: "runtime-health-aggregator", error: s.message, critical: !1 }), t && t.warn("Runtime health aggregation error (non-critical)", { error: s.message });
      }
    }).then(function() {
      var a = Math.round(performance.now() - o), s = i.failed.filter(function(h) {
        return h.critical;
      }), u = de(), c = s.some(function(h) {
        return h.id === "globalstate";
      }), d = s.some(function(h) {
        return h.id === "eventbus";
      }), f = s.some(function(h) {
        return h.id === "context-provider";
      });
      if (u && c)
        throw new Ht(
          "GlobalState falhou - boot bloqueado em modo strict",
          { type: "GLOBALSTATE_BOOT_BLOCKED", phase: "phase-1-core", failedModules: s }
        );
      if (u && d)
        throw new Ht(
          "EventBus falhou - boot bloqueado em modo strict",
          { type: "EVENTBUS_BOOT_BLOCKED", phase: "phase-1-core", failedModules: s }
        );
      if (u && f)
        throw new Ht(
          "ContextProvider falhou - boot bloqueado em modo strict",
          { type: "CONTEXTPROVIDER_BOOT_BLOCKED", phase: "phase-1-core", failedModules: s }
        );
      if (s.length > 0) {
        var g = s.map(function(h) {
          return h.id;
        }).join(", ");
        throw new Error("Critical modules failed: " + g);
      }
      return _.executed = !0, _.executedAt = Date.now(), _.results = i, _.errors = i.failed, r && r.track("phase-1-complete", {
        initialized: i.initialized.length,
        failed: i.failed.length,
        featuresRegistered: _.featuresRegistered,
        featureFlagsInitialized: _.featureFlagsInitialized,
        coreLoaded: _.coreLoaded,
        governanceValidated: _.governanceValidated,
        governanceScore: _.governanceScore,
        runtimeHealthStatus: _.runtimeHealthStatus,
        runtimeHealthScore: _.runtimeHealthScore,
        strictMode: u,
        time: a
      }), t && t.info("Phase 1 complete", {
        initialized: i.initialized,
        failed: i.failed,
        featuresRegistered: _.featuresRegistered,
        featureFlagsInitialized: _.featureFlagsInitialized,
        coreLoaded: _.coreLoaded,
        governanceValidated: _.governanceValidated,
        governanceScore: _.governanceScore,
        runtimeHealthStatus: _.runtimeHealthStatus,
        runtimeHealthScore: _.runtimeHealthScore,
        strictMode: u,
        time: a
      }), {
        success: s.length === 0,
        initialized: i.initialized,
        failed: i.failed,
        featuresRegistered: _.featuresRegistered,
        featureFlagsInitialized: _.featureFlagsInitialized,
        coreLoaded: _.coreLoaded,
        governanceValidated: _.governanceValidated,
        governanceScore: _.governanceScore,
        runtimeHealthStatus: _.runtimeHealthStatus,
        runtimeHealthScore: _.runtimeHealthScore,
        strictMode: u,
        time: a
      };
    });
  },
  healthCheck: function() {
    var e = bt.modules.length, t = _.results && _.results.initialized ? _.results.initialized.length : 0, r = _.results && _.results.failed ? _.results.failed.length : 0, n = (_.results && _.results.failed ? _.results.failed : []).filter(function(a) {
      return a.critical;
    }).length, i = de(), o = _.results && _.results.initialized && _.results.initialized.indexOf("globalstate") !== -1, l = B.HEALTHY;
    return _.executed ? n > 0 ? l = B.UNHEALTHY : r > 0 ? l = B.DEGRADED : i && !o && (l = B.UNHEALTHY) : l = B.DEGRADED, ue({
      status: l,
      moduleId: Ei,
      version: vi,
      checks: {
        executed: _.executed,
        criticalModulesLoaded: n === 0,
        allModulesLoaded: r === 0,
        featuresRegistered: _.featuresRegistered,
        featureFlagsInitialized: _.featureFlagsInitialized,
        coreLoaded: _.coreLoaded,
        // @ts-expect-error strict migration — TS2322
        globalStateReady: o,
        governanceValidated: _.governanceValidated,
        runtimeHealthAggregated: !!_.runtimeHealthStatus,
        // @ts-expect-error strict migration — TS2322
        strictModeCompliant: !i || o
      },
      details: {
        executed: _.executed,
        executedAt: _.executedAt,
        featuresRegistered: _.featuresRegistered,
        featureFlagsInitialized: _.featureFlagsInitialized,
        coreLoaded: _.coreLoaded,
        governanceValidated: _.governanceValidated,
        governanceScore: _.governanceScore,
        runtimeHealthStatus: _.runtimeHealthStatus,
        runtimeHealthScore: _.runtimeHealthScore,
        strictMode: i,
        globalStateInitialized: o,
        modules: { total: e, initialized: t, failed: r, criticalFailed: n },
        errors: _.errors
      }
    });
  },
  info: function() {
    return {
      moduleId: Ei,
      version: vi,
      name: bt.name,
      order: bt.order,
      critical: bt.critical,
      dependsOn: bt.dependsOn,
      executed: _.executed,
      executedAt: _.executedAt,
      featuresRegistered: _.featuresRegistered,
      featureFlagsInitialized: _.featureFlagsInitialized,
      coreLoaded: _.coreLoaded,
      governanceValidated: _.governanceValidated,
      governanceScore: _.governanceScore,
      runtimeHealthStatus: _.runtimeHealthStatus,
      runtimeHealthScore: _.runtimeHealthScore,
      strictMode: de(),
      modules: bt.modules.map(function(e) {
        return { id: e.id, name: e.name, critical: e.critical };
      }),
      results: _.results,
      timestamp: Date.now()
    };
  },
  getManifest: function() {
    return {
      registryId: Ei,
      version: vi,
      loadedAt: _.executedAt,
      itemCount: bt.modules.length,
      items: bt.modules.map(function(e) {
        return e.id;
      }),
      initialized: _.results ? _.results.initialized : [],
      failed: _.results && _.results.failed ? _.results.failed.map(function(e) {
        return e.id;
      }) : [],
      featuresRegistered: _.featuresRegistered,
      featureFlagsInitialized: _.featureFlagsInitialized,
      coreLoaded: _.coreLoaded,
      governanceValidated: _.governanceValidated,
      governanceScore: _.governanceScore,
      runtimeHealthStatus: _.runtimeHealthStatus,
      runtimeHealthScore: _.runtimeHealthScore,
      strictMode: de(),
      timestamp: Date.now()
    };
  }
}, ae = "phase-2-auth", gn = "3.11.0-AUTHCONTEXT-FIX", po = Ln({ moduleId: ae }), Ml = ["/login", "/login.html", "/logout", "/logout.html", "/forgot-password", "/reset-password", "/public"], pr = null, Je = null;
function Pl(e, ...t) {
  var r = Array.prototype.slice.call(arguments, 1), n = "[" + ae + "]", i = po.get("logger");
  i ? e === "error" && i.error ? i.error.apply(i, [n].concat(r)) : e === "warn" && i.warn ? i.warn.apply(i, [n].concat(r)) : e === "info" && i.info ? i.info.apply(i, [n].concat(r)) : i.debug && i.debug.apply(i, [n].concat(r)) : (e === "error" || e === "warn") && (e === "error" ? console.error.apply(console, [n].concat(r)) : e === "warn" && console.warn.apply(console, [n].concat(r)));
}
function Cp() {
  for (var e = window.location && window.location.pathname ? window.location.pathname.toLowerCase() : "/", t = window.location && window.location.hash ? window.location.hash.replace("#", "").toLowerCase() : "/", r = 0; r < Ml.length; r++) {
    var n = Ml[r];
    if (e === n || e.indexOf(n + "/") === 0 || t === n || t.indexOf(n + "/") === 0)
      return !0;
  }
  return !1;
}
var kl = ["/login", "/login.html", "/login/"];
function Lp() {
  for (var e = window.location && window.location.pathname ? window.location.pathname.toLowerCase() : "/", t = 0; t < kl.length; t++) {
    var r = kl[t];
    if (e === r || e.indexOf(r + "/") === 0) return !0;
  }
  return !1;
}
function yi() {
  return import("/core/auth/bridges/auth-ready-dom-bridge.js").then(function() {
    Pl("debug", "auth-ready-dom-bridge loaded successfully");
  }).catch(function(e) {
    Pl("warn", "auth-ready-dom-bridge failed to load (non-critical)", { error: e.message });
  });
}
function un(e) {
  if (pr && pr.get) {
    var t = pr.get(e);
    if (t) return t;
  }
  return typeof window < "u" ? window[e] : null;
}
var _p = {
  id: "phase-2-auth",
  name: "Authentication Enterprise",
  order: 2,
  critical: !0,
  recoverable: !0,
  dependsOn: ["phase-1-core"],
  parallel: !1,
  modules: [
    { id: "auth-orchestrator", name: "Auth Orchestrator Enterprise", critical: !0, timeout: 1e4 },
    { id: "login-modal", name: "Login Modal", critical: !0, timeout: 5e3 },
    { id: "auth-ready-dom-bridge", name: "Auth Ready DOM Bridge", critical: !1, timeout: 2e3 }
  ],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = e.eventBusAdapter, i = e.readyFlagsAdapter, o = e.windowAdapter, l = { initialized: [], failed: [], authState: null }, a = performance.now();
    pr = o, Je = nf({
      logger: t,
      telemetry: r,
      eventBusAdapter: n,
      windowAdapter: o
    }), t && t.info("[" + ae + "] Phase 2 starting: Authentication Enterprise v" + gn), r && r.track("phase-2-start", { version: gn });
    var s = o && o.get ? o.get("EventBus") : null, u = null;
    return Promise.resolve().then(function() {
      return t && t.info("[" + ae + "] Initializing SessionManager singleton..."), ne.init({ checkOnInit: !1, trackActivity: !0, autoRefresh: !0 });
    }).then(function() {
      t && t.info("[" + ae + "] Creating enterprise auth modules...");
      var c = Qd({ eventBus: s }), d = Xd({ eventBus: s }), f = {
        isAuthenticated: function() {
          return ne.isAuthenticated();
        },
        getUser: function() {
          return ne.getUser();
        },
        getRoles: function() {
          return ne.getRoles();
        },
        getLevel: function() {
          var h = ne.getUser();
          return h && h.level || 0;
        },
        getAuthContext: function() {
          return ne.getAuthContext();
        },
        checkSession: function() {
          return ne.checkSession();
        },
        subscribe: function(h) {
          return ne.subscribe ? ne.subscribe(h) : function() {
          };
        },
        refreshSession: function() {
          return ne.refresh ? ne.refresh() : Promise.resolve();
        },
        healthCheck: function() {
          return ne.healthCheck ? ne.healthCheck() : { status: "UNKNOWN" };
        },
        info: function() {
          return ne.info ? ne.info() : { moduleId: "session-manager-adapter" };
        },
        _injectSession: function(h) {
          return ne.checkSession();
        },
        _clearSession: function() {
          return ne.logout();
        },
        _isLiveProxy: !1,
        _isSingletonAdapter: !0,
        _version: ne.version
      }, g = ef({
        eventBus: s,
        sessionManager: f,
        permissionsGuard: c,
        policiesManager: d
      });
      return rf(g), t && t.info("[" + ae + "] Initializing Auth Orchestrator..."), g.init({
        session: {},
        permissions: {
          routePermissions: {
            "/admin": { minLevel: 4, allowedRoles: ["admin", "super_admin"] },
            "/settings": { minLevel: 3, allowedRoles: ["manager", "admin", "super_admin"] }
          },
          panelPermissions: {
            "panel-user-management": { minLevel: 4, requiredCapability: "users:view" },
            "panel-audit-trail": { minLevel: 4, requiredCapability: "admin:audit" }
          }
        },
        policies: { policies: [] }
      }), t && t.info("[" + ae + "] Checking existing session via SessionManager..."), ne.checkSession().then(function() {
        return g;
      });
    }).then(function(c) {
      var d = ne.isAuthenticated(), f = ne.getUser();
      if (d && Je) {
        var g = Je.execute(d);
        g.executed && t && t.info("[" + ae + "] Post-auth redirect executed", {
          from: "/login",
          to: g.target.path,
          source: g.target.source
        });
      }
      return t && t.info("[" + ae + "] Loading login-modal module..."), import("/components/login-modal/dist/login-modal.bundle.js").then(function(h) {
        if (u = h.default || h, u && u.mount)
          return Promise.resolve(u.mount({ integrateWithGlobalEventBus: !0 })).then(function() {
            l.initialized.push("login-modal"), t && t.info("[" + ae + "] Login modal mounted successfully");
          });
        t && t.warn("[" + ae + "] Login modal mount function not found");
      }).catch(function(h) {
        t && t.error("[" + ae + "] Failed to load login-modal", { error: h.message }), l.failed.push({ module: "login-modal", error: h.message });
      }).then(function() {
        return { authOrchestrator: c, isAuthenticated: d, userData: f };
      });
    }).then(function(c) {
      var d = c.authOrchestrator, f = c.isAuthenticated, g = c.userData;
      if (!f && (!Cp() || Lp())) {
        if (t && t.warn("[" + ae + "] NOT AUTHENTICATED - Opening login modal and waiting..."), r && r.track("auth-login-required", { reason: "unauthenticated" }), document.body && (document.body.setAttribute("data-auth-ready", "true"), document.body.setAttribute("data-state", "unauthenticated")), n && n.emit && n.emit(st.LOGIN_REQUIRED, {
          reason: "unauthenticated",
          attemptedPath: window.location.pathname + window.location.hash,
          source: ae
        }), u && u.show)
          u.show("phase-2-auth-unauthenticated");
        else {
          var h = un("LoginModal");
          h && h.show && h.show("phase-2-auth-unauthenticated");
        }
        return t && t.info("[" + ae + "] Waiting for LOGIN_SUCCESS event..."), new Promise(function(p) {
          var A = setTimeout(function() {
            t && t.warn("[" + ae + "] Login timeout after 5 minutes"), p({ timeout: !0 });
          }, 3e5), T = n && n.on ? n.on(st.LOGIN_SUCCESS, function(S) {
            if (clearTimeout(A), typeof T == "function" && T(), t && t.info("[" + ae + "] LOGIN_SUCCESS received", { userId: S && S.user ? S.user.id : null }), Je) {
              var L = Je.execute(!0);
              L.executed && t && t.info("[" + ae + "] Post-login redirect executed", {
                to: L.target.path,
                source: L.target.source
              });
            }
            p({ success: !0, user: S ? S.user : null });
          }) : null;
        }).then(function(p) {
          if (p.success) {
            var A = ne.getUser();
            return l.authState = { authenticated: !0, user: A, checked: !0, loginWasRequired: !0 }, document.body && document.body.setAttribute("data-state", "authenticated"), n && n.emit && n.emit(st.READY, { authenticated: !0, user: A, source: "bootstrap-v2-post-login" }), i && i.setReady && i.setReady("auth", !0), t && t.info("[" + ae + "] Post-login reload scheduled - re-executing full boot with valid session"), r && r.track("auth-post-login-reload", { userId: A ? A.id : null }), setTimeout(function() {
              window.location.reload();
            }, 500), yi().then(function() {
              return l.initialized.push("auth-ready-dom-bridge"), t && t.info("[" + ae + "] Auth complete after interactive login", { userId: A ? A.id : null }), { authOrchestrator: d };
            });
          } else
            return l.authState = { authenticated: !1, user: null, checked: !0, loginWasRequired: !0, loginTimedOut: !0 }, i && i.setReady && i.setReady("auth", !0), yi().then(function() {
              return l.initialized.push("auth-ready-dom-bridge"), { authOrchestrator: d };
            });
        });
      }
      return f && g ? t && t.info("[" + ae + "] Session restored from API", { userId: g.id }) : t && t.info("[" + ae + "] Public path, continuing without auth"), l.authState = { authenticated: f, user: g, checked: !0 }, document.body && (document.body.setAttribute("data-auth-ready", "true"), document.body.setAttribute("data-state", f ? "authenticated" : "unauthenticated")), f ? n && n.emit && (n.emit(st.READY, { authenticated: !0, user: g, source: "bootstrap-v2" }), n.emit(st.LOGIN_SUCCESS, { user: g, source: "bootstrap-v2-restore" })) : n && n.emit && n.emit(st.READY, { authenticated: !1, source: "bootstrap-v2" }), i && i.setReady && i.setReady("auth", !0), yi().then(function() {
        return l.initialized.push("auth-ready-dom-bridge"), { authOrchestrator: d };
      });
    }).then(function(c) {
      var d = c.authOrchestrator, f = un("AppContext") || {};
      f.getAuth = function() {
        return d.getAuthContext();
      }, f.auth = tf, pr && pr.expose && pr.expose("AppContext", f), window.AppContext = f, l.initialized.push("auth-orchestrator"), l.initialized.push("session-manager-singleton");
      var g = performance.now() - a;
      return t && t.info("[" + ae + "] Phase 2 complete", {
        duration: g.toFixed(0) + "ms",
        authenticated: l.authState ? l.authState.authenticated : !1,
        sessionManagerVersion: ne.version,
        redirectControllerActive: !!Je
      }), { success: !0, results: l, duration: g };
    }).catch(function(c) {
      return t && t.error("[" + ae + "] Phase 2 failed", { error: c.message }), l.failed.push({ module: "auth-orchestrator", error: c.message }), document.body && (document.body.setAttribute("data-auth-ready", "true"), document.body.setAttribute("data-state", "error")), i && i.setReady && i.setReady("auth", !0), yi().then(function() {
        return { success: !1, results: l, error: c.message };
      });
    });
  },
  rollback: function(e) {
    var t = e.logger;
    t && t.warn("[" + ae + "] Rolling back phase 2");
    var r = un("AppContext");
    return r && (delete r.getAuth, delete r.auth), ne.shutdown && ne.shutdown(), Je = null, Promise.resolve({ success: !0 });
  },
  healthCheck: function() {
    var e = un("AppContext"), t = e ? e.auth : null, r = ne.isInitialized ? ne.isInitialized() : !1, n = un("LoginModal"), i = n && n.isInitialized ? n.isInitialized() : !1, o = t && t.isReady ? t.isReady() : !1;
    return ue({
      status: o && r ? B.HEALTHY : B.DEGRADED,
      moduleId: ae,
      version: gn,
      checks: {
        authReady: o,
        sessionManagerHealthy: r,
        loginModalLoaded: i,
        portsInitialized: po.isInitialized(),
        redirectControllerActive: !!Je
      },
      details: {
        portsInitialized: po.isInitialized(),
        sessionManagerVersion: ne.version,
        loginModalLoaded: i,
        redirectController: Je ? Je.info() : null
      }
    });
  },
  info: function() {
    return {
      moduleId: ae,
      version: gn,
      redirectController: Je ? Je.info() : null
    };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.phase2 = {
  version: gn,
  getRedirectController: function() {
    return Je;
  }
});
var Ui = "phase-3-shell", Ri = "5.20.0-AUTH-STATE-FIX", wi = null;
function Hl(e) {
  var t = de();
  if (wi && wi.get) {
    var r = wi.get(e);
    if (r) return r;
  }
  if (t) return null;
  var n = window;
  return typeof window < "u" && n[e] ? (Sn("WINDOW_" + e.toUpperCase() + "_FALLBACK", { module: Ui, method: "_resolveGlobal" }), n[e]) : null;
}
function kr(e, t) {
  e && (e.classList.remove("hidden"), e.classList.remove("dsd-shell__region--hidden"), e.classList.add("dsd-shell__region--visible"), e.setAttribute("data-visibility", "visible"), t && t.debug("Region revealed with fade transition", {
    region: e.id || e.className
  }));
}
function Np(e, t) {
  var r = e.logger, n = e.eventBusAdapter;
  try {
    var i = Di(e);
    if (!i) return;
    r && r.info("Revealing regions with fade transitions"), t && t.setFullscreen ? t.setFullscreen(!1) : n && n.emit && n.emit(af.LAYOUT_REQUEST, {
      mode: "default",
      source: Ui,
      timestamp: Date.now()
    });
    var o = pt(Et.HEADER), l = pt(Et.TICKER), a = pt(Et.NAV_RAIL), s = pt(Et.SIDEBAR), u = pt(Et.MAIN), c = pt(Et.FOOTER);
    kr(o, r), kr(l, r), kr(a, r), kr(s, r), kr(u, r), kr(c, r), u && u.classList.remove("full-screen-mode"), n && n.emit && n.emit(Gl.LAYOUT_CHANGED, {
      hideNav: !1,
      source: "phase-3",
      transition: "fade-cascade"
    }), r && r.info("All regions revealed with fade transitions");
  } catch (d) {
    r && r.warn("Layout reveal warning (non-critical)", { error: d.message });
  }
}
function Di(e) {
  try {
    if (typeof window < "u" && window.location) {
      for (var t = (window.location.pathname || "").toLowerCase(), r = (window.location.hash || "").toLowerCase(), n = ["/login", "login.html", "#login", "#/login"], i = 0; i < n.length; i++)
        if (t.indexOf(n[i]) !== -1 || r.indexOf(n[i]) !== -1)
          return !1;
    }
    if (typeof document < "u") {
      var o = document.querySelector(".login-modal, #login-modal, [data-login-modal]");
      if (o && o.offsetParent !== null)
        return !1;
    }
    if (typeof document < "u" && document.body) {
      var l = document.body.getAttribute("data-state");
      if (l === "unauthenticated") return !1;
      if (l === "authenticated") return !0;
    }
    var a = Hl("SessionManager");
    if (a && a.isAuthenticated) return !!a.isAuthenticated();
    var s = Hl("GlobalState");
    if (s && s.getState) {
      var u = s.getState();
      return !!(u && u.auth && u.auth.isAuthenticated);
    }
  } catch {
  }
  return !1;
}
var vd = {
  id: "phase-3-shell",
  name: "Shell & Router",
  order: 3,
  critical: !0,
  recoverable: !1,
  dependsOn: ["phase-2-auth"],
  parallel: !1,
  modules: [
    { id: "layout-manager", name: "Layout Manager", critical: !1, timeout: 5e3 },
    { id: "app-shell", name: "App Shell", critical: !0, timeout: 1e4 },
    { id: "header", name: "Header", critical: !1, timeout: 8e3 },
    { id: "sidebar", name: "Sidebar", critical: !1, timeout: 8e3 },
    { id: "nav-rail", name: "NavRail", critical: !1, timeout: 5e3 },
    { id: "footer", name: "Footer", critical: !1, timeout: 5e3 },
    { id: "router-global", name: "Router Global", critical: !0, timeout: 5e3 }
  ],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = e.windowAdapter, i = e.readyFlagsAdapter, o = e.eventBusAdapter;
    wi = n;
    var l = { initialized: [], failed: [], skipped: [] }, a = typeof performance < "u" && performance.now ? performance.now() : Date.now(), s = null;
    return t && t.info("Phase 3 starting: Shell & Router", { version: Ri }), r && r.track && r.track("phase-3-start"), Promise.resolve().then(function() {
      return import("/components/layout-manager/dist/layout-manager.bundle.js").then(function(u) {
        return s = u.default || u.LayoutManager, s ? (t && t.info("Initializing LayoutManager..."), Promise.resolve(s.init()).then(function(c) {
          return n && n.expose && n.expose("LayoutManager", s), l.initialized.push("layout-manager"), t && t.info("LayoutManager initialized", {
            alreadyInitialized: c && c.alreadyInitialized
          }), null;
        }).catch(function(c) {
          return l.failed.push({ id: "layout-manager", error: c.message, critical: !1 }), t && t.warn("LayoutManager init failed (non-critical)", { error: c.message }), null;
        })) : null;
      }).catch(function(u) {
        return l.failed.push({ id: "layout-manager", error: u.message, critical: !1 }), t && t.warn("LayoutManager import failed (non-critical)", { error: u.message }), null;
      });
    }).then(function() {
      var u = Di();
      return u ? (t && t.info("Initializing AppShell (authenticated)..."), import("/components/app-shell/dist/app-shell.bundle.js").then(function(c) {
        var d = c.default || c;
        if (!d) throw new Error("AppShell not found in module");
        return Promise.resolve(d.init()).then(function(f) {
          if (!f || f.ok !== !0) {
            var g = f && f.error ? f.error : "AppShell.init() failed";
            throw new Error(g);
          }
          return d.finalize && d.finalize(), n && n.expose && n.expose("AppShell", d), i && i.setReady && i.setReady("appshell", !0), l.initialized.push("app-shell"), t && t.info("AppShell initialized and finalized", {
            alreadyInitialized: f.alreadyInitialized,
            version: d.version
          }), null;
        });
      }).catch(function(c) {
        throw l.failed.push({ id: "app-shell", error: c.message, critical: !0 }), t && t.error("AppShell init failed (CRITICAL)", { error: c.message }), c;
      })) : (l.skipped.push({ id: "app-shell", reason: "not-authenticated" }), t && t.warn("AppShell skipped (not authenticated) — login mode"), null);
    }).then(function() {
      return Mp(e, l, t, n, i);
    }).then(function() {
      var u = Di();
      return u ? import("/app/router/dist/app-router.bundle.js").then(function(c) {
        var d = c.RouterGlobal || c.default;
        if (!d) throw new Error("RouterGlobal not found in module");
        return t && t.info("Initializing RouterGlobal..."), Promise.resolve(d.init()).then(function() {
          return n && n.expose && n.expose("RouterGlobal", d), i && i.setReady && i.setReady("router", !0), l.initialized.push("router-global"), o && o.emit && o.emit(Gl.READY, { router: d }), t && t.info("RouterGlobal initialized"), null;
        });
      }).catch(function(c) {
        throw l.failed.push({ id: "router-global", error: c.message, critical: !0 }), t && t.error("RouterGlobal init failed (CRITICAL)", { error: c.message }), c;
      }) : (l.skipped.push({ id: "router-global", reason: "not-authenticated" }), t && t.warn("RouterGlobal skipped (not authenticated) — boot continues"), null);
    }).then(function() {
      return Np(e, s), null;
    }).then(function() {
      var u = Math.round((typeof performance < "u" && performance.now ? performance.now() : Date.now()) - a);
      r && r.track && r.track("phase-3-complete", { initialized: l.initialized.length, failed: l.failed.length, time: u }), t && t.info("Phase 3 complete", {
        initialized: l.initialized,
        failed: l.failed.length,
        skipped: l.skipped.length,
        time: u
      });
      var c = l.failed.filter(function(d) {
        return d.critical;
      });
      return {
        success: c.length === 0,
        initialized: l.initialized,
        failed: l.failed,
        skipped: l.skipped,
        time: u
      };
    }).catch(function(u) {
      var c = Di();
      if (!c)
        return l.failed.push({ id: "phase-3-shell", error: u.message, critical: !1 }), t && t.warn("Phase 3 error suppressed (unauthenticated, BOOT-SAFE)", { error: u.message }), {
          success: !0,
          initialized: l.initialized,
          failed: l.failed,
          skipped: l.skipped,
          degraded: !0
        };
      throw l.failed.push({ id: "phase-3-shell", error: u.message, critical: !0 }), t && t.error("Phase 3 failed (CRITICAL)", { error: u.message }), u;
    });
  },
  healthCheck: function() {
    return tc({ status: ec.HEALTHY, moduleId: Ui, version: Ri });
  },
  info: function() {
    return { moduleId: Ui, version: Ri, modules: vd.modules.map(function(e) {
      return e.id;
    }) };
  }
};
function Mp(e, t, r, n, i) {
  return Promise.resolve().then(function() {
    var o = pt(Et.HEADER);
    return o ? (r && r.info("Loading Header module..."), import("/components/header/dist/header.bundle.js").then(function(l) {
      var a = l.mount || (l.default ? l.default.mount : null);
      return a ? Promise.resolve(a(o)).then(function() {
        return n && n.expose && n.expose("Header", l.default || l), i && i.setReady && i.setReady("header", !0), t.initialized.push("header"), r && r.info("Header mounted successfully", { version: l.VERSION }), null;
      }) : (t.skipped.push({ id: "header", reason: "mount function not found" }), r && r.warn("Header mount function not found"), null);
    }).catch(function(l) {
      return t.failed.push({ id: "header", error: l.message, critical: !1 }), r && r.warn("Header mount failed (non-critical)", { error: l.message }), null;
    })) : (t.skipped.push({ id: "header", reason: "region not found" }), r && r.warn("Header region not found, skipping"), null);
  }).then(function() {
    var o = pt(Et.SIDEBAR);
    return o ? (r && r.info("Loading Sidebar module..."), import("/components/sidebar/dist/sidebar.bundle.js").then(function(l) {
      var a = l.createSidebar || (l.default ? l.default.createSidebar : null);
      if (!a)
        return t.skipped.push({ id: "sidebar", reason: "createSidebar function not found" }), r && r.warn("Sidebar createSidebar function not found"), null;
      var s = a();
      return !s || !s.init ? null : Promise.resolve(s.init({ containerSelector: '[data-region="sidebar"], #shell-sidebar-region, #sidebar' })).then(function() {
        return n && n.expose && n.expose("Sidebar", l.default || l), i && i.setReady && i.setReady("sidebar", !0), t.initialized.push("sidebar"), r && r.info("Sidebar mounted successfully", { version: l.VERSION || "unknown" }), null;
      });
    }).catch(function(l) {
      return t.failed.push({ id: "sidebar", error: l.message, critical: !1 }), r && r.warn("Sidebar mount failed (non-critical)", { error: l.message }), null;
    })) : (t.skipped.push({ id: "sidebar", reason: "region not found" }), r && r.warn("Sidebar region not found, skipping"), null);
  }).then(function() {
    var o = pt(Et.NAV_RAIL);
    return o ? (r && r.info("Loading NavRail module..."), import("/components/nav-rail/dist/nav-rail.bundle.js").then(function(l) {
      var a = l.NavRail || l.default;
      return !a || !a.init ? (t.skipped.push({ id: "nav-rail", reason: "init function not found" }), r && r.warn("NavRail init function not found"), null) : Promise.resolve(a.init(o)).then(function() {
        return n && n.expose && n.expose("NavRail", a), i && i.setReady && i.setReady("navRail", !0), t.initialized.push("nav-rail"), r && r.info("NavRail mounted successfully", { version: l.VERSION }), null;
      });
    }).catch(function(l) {
      return t.failed.push({ id: "nav-rail", error: l.message, critical: !1 }), r && r.warn("NavRail mount failed (non-critical)", { error: l.message }), null;
    })) : (t.skipped.push({ id: "nav-rail", reason: "region not found" }), r && r.warn("NavRail region not found, skipping"), null);
  }).then(function() {
    var o = pt(Et.FOOTER);
    return o ? (r && r.info("Loading Footer module..."), import("/components/footer/dist/footer.bundle.js").then(function(l) {
      var a = l.mount || (l.default ? l.default.mount : null);
      return a ? Promise.resolve(a(o)).then(function() {
        return n && n.expose && n.expose("Footer", l.default || l), i && i.setReady && i.setReady("footer", !0), t.initialized.push("footer"), r && r.info("Footer mounted successfully", { version: l.VERSION }), null;
      }) : (t.skipped.push({ id: "footer", reason: "mount function not found" }), r && r.warn("Footer mount function not found"), null);
    }).catch(function(l) {
      return t.failed.push({ id: "footer", error: l.message, critical: !1 }), r && r.warn("Footer mount failed (non-critical)", { error: l.message }), null;
    })) : (t.skipped.push({ id: "footer", reason: "region not found" }), r && r.warn("Footer region not found, skipping"), null);
  });
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.phase3 = { version: Ri });
var ao = "4.2.1-CONTRACTS", Pp = "phase-4-main", kp = Object.freeze({
  autoStart: !0,
  enableLazyLoading: !0,
  waitForLazyComponents: !1,
  enablePerformanceMonitor: !0,
  enableFallbackSystem: !0,
  enablePlugins: !0,
  enableLifecycleHooks: !0,
  enableBootMetrics: !0,
  enableEventBusAdapter: !0,
  enableStateSnapshots: !0,
  enableDebugMode: !1,
  enableConfigPersistence: !0,
  enableSlotPresets: !0,
  enableSanitizer: !0,
  enableRateLimiter: !0,
  enableDevToolsPanel: !1,
  enableWorkerManager: !0,
  enableConsoleCommands: !1,
  enableTelemetryDashboard: !1,
  enableRequestQueue: !0,
  enableCacheManager: !0,
  enableEventRecorder: !1,
  enableNotificationManager: !0,
  enableFormValidator: !0,
  enableStorageManager: !0,
  enableClipboardManager: !0,
  enableDragDropManager: !0,
  enableModalManager: !0,
  enableTooltipManager: !0,
  enableContextMenuManager: !0,
  enableHotkeyManager: !0,
  enableScrollManager: !0,
  enableFocusManager: !0,
  enableUndoManager: !0,
  enableThemeManager: !0,
  enableAnimationManager: !0,
  enableMediaQueryManager: !0,
  enableIntersectionManager: !0,
  enableResizeManager: !0,
  enableMutationManager: !0,
  enablePermissionManager: !0,
  enableNetworkManager: !0,
  enableGeolocationManager: !1,
  enableDeviceManager: !0,
  enableBatteryManager: !0,
  enableFullscreenManager: !0,
  enableVisibilityManager: !0,
  enableWakeLockManager: !1,
  enableShareManager: !0
});
function zt(e) {
  if (typeof window < "u") {
    if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var t = window.Core.windowAdapter.get(e);
      if (t) return t;
    }
    return window[e] || null;
  }
  return null;
}
function Hp() {
  var e = {
    sessionManager: null,
    appContext: null,
    eventBus: null,
    routerGlobal: null,
    globalState: null,
    telemetryCore: null,
    sidebarRegistry: null,
    _initialized: !1
  };
  return {
    init: function() {
      e._initialized || (e.sessionManager = zt("SessionManager"), e.appContext = zt("AppContext"), e.eventBus = zt("EventBus"), e.routerGlobal = zt("RouterGlobal"), e.globalState = zt("GlobalState") || zt("GlobalStateManager"), e.telemetryCore = zt("TelemetryCore"), e.sidebarRegistry = zt("SidebarRegistry"), e._initialized = !0);
    },
    get: function(t) {
      return e._initialized || this.init(), e[t] || null;
    },
    inject: function(t) {
      if (t)
        for (var r in t)
          r !== "_initialized" && t.hasOwnProperty(r) && (e[r] = t[r]);
      e._initialized = !0;
    },
    getAll: function() {
      return Object.assign({}, e);
    },
    isInitialized: function() {
      return e._initialized;
    },
    reset: function() {
      e._initialized = !1;
    },
    exposeGlobal: function(t, r) {
      typeof window < "u" && (window[t] = r);
    }
  };
}
function Bp(e) {
  e === void 0 && (e = {});
  var t = e.portsManager, r = e.runtimeContext || null;
  function n() {
    if (r) return r;
    if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
      var i = window.Core.windowAdapter.get("RuntimeContext");
      if (i)
        return r = i, r;
    }
    return typeof window < "u" && window.RuntimeContext && (r = window.RuntimeContext), r;
  }
  return {
    checkAuthentication: function() {
      var i = n();
      if (i && i.isAuthenticated)
        try {
          return i.isAuthenticated();
        } catch {
        }
      return this._legacyCheckAuthentication();
    },
    _legacyCheckAuthentication: function() {
      var i = typeof document < "u" ? document : null, o = i && i.body && i.body.dataset ? i.body.dataset.state : null;
      if (o === "authenticated")
        return !0;
      var l = t ? t.get("appContext") : null;
      if (l && l.auth && typeof l.auth.isAuthenticated == "function")
        try {
          if (l.auth.isAuthenticated()) return !0;
        } catch {
        }
      var a = t ? t.get("sessionManager") : null;
      if (a && typeof a.isAuthenticated == "function")
        try {
          if (a.isAuthenticated()) return !0;
        } catch {
        }
      var s = i && i.body && i.body.dataset ? i.body.dataset.authReady : null;
      if (s === "true" && o !== "unauthenticated" && o !== "error" && a && typeof a.isAuthenticated == "function")
        try {
          if (a.isAuthenticated()) return !0;
        } catch {
        }
      return !1;
    },
    getDataState: function() {
      var i = typeof document < "u" ? document : null;
      return i && i.body && i.body.dataset ? i.body.dataset.state : null;
    },
    getAuthReady: function() {
      var i = typeof document < "u" ? document : null;
      return i && i.body && i.body.dataset ? i.body.dataset.authReady : null;
    },
    getAuthSource: function() {
      var i = n();
      return i ? "RuntimeContext" : "legacy";
    },
    info: function() {
      var i = n();
      return {
        moduleId: "phase-4-auth-detector",
        version: "5.1.0-DOMAIN-PURE",
        source: this.getAuthSource(),
        runtimeContextAvailable: !!i,
        isAuthenticated: this.checkAuthentication(),
        dataState: this.getDataState(),
        authReady: this.getAuthReady()
      };
    }
  };
}
function Up(e) {
  var t = !1, r = [], n = null;
  return {
    // v4.2.0: Register listeners for both LOGIN_SUCCESS and READY
    register: function(i, o) {
      if (!t) {
        var l = i.logger, a = i.eventBusAdapter;
        if (n = i, !a || !a.on) {
          l && l.warn("[P14] eventBusAdapter.on not available");
          return;
        }
        var s = function(d) {
          l && l.info("[P14] Auth event received", { data: d }), o && o(n, d);
        }, u = a.on(st.LOGIN_SUCCESS, s);
        if (typeof u == "function" ? r.push(u) : r.push(function() {
          a.off && a.off(st.LOGIN_SUCCESS, s);
        }), st.READY) {
          var c = a.on(st.READY, function(d) {
            d && d.authenticated && (l && l.info("[P14] AUTH_EVENTS.READY with authenticated=true"), s(d));
          });
          typeof c == "function" && r.push(c);
        }
        t = !0, l && l.info("[P14] Auth listeners registered", {
          events: [st.LOGIN_SUCCESS, st.READY || "N/A"],
          hasCleanup: r.length > 0
        });
      }
    },
    isRegistered: function() {
      return t;
    },
    getCleanups: function() {
      return r.slice();
    },
    getPhasePorts: function() {
      return n;
    },
    cleanup: function() {
      r.forEach(function(i) {
        try {
          i();
        } catch {
        }
      }), r = [];
    },
    reset: function() {
      this.cleanup(), t = !1, n = null;
    }
  };
}
function xp() {
  if (typeof document > "u") return null;
  const e = document.getElementById("container-main") || document.querySelector(".dsd-container__content") || document.querySelector('[data-container-main="true"]') || document.querySelector(".dsd-container");
  if (!e) return null;
  let t = e, r = e;
  return e.classList.contains("dsd-container__content") ? r = e.closest(".dsd-container") || e.parentElement || e : (e.classList.contains("dsd-container") || e.id === "container-main") && (t = e.querySelector(".dsd-container__content") || e, r = e), { rootEl: r, contentEl: t, mode: "existing" };
}
function Fp(e) {
  e === void 0 && (e = {});
  var t = e.portsManager, r = !1;
  return {
    isMounted: function() {
      return r;
    },
    mount: function(n, i) {
      if (r) {
        var o = n.logger;
        return o && o.info("[P14] Main already mounted - skipping mountMain"), Promise.resolve(null);
      }
      var o = n.logger, l = n.eventBusAdapter, a = n.readyFlagsAdapter, s = n.windowAdapter;
      return import("/components/main/dist/main.bundle.js").then(function(u) {
        var c = u && (typeof u.init == "function" || typeof u.createMain == "function") ? u : u && u.default && (typeof u.default.init == "function" || typeof u.default.createMain == "function") ? u.default : null;
        if (!c)
          throw o && o.error("[P14] Main module missing init/createMain", {
            keys: Object.keys(u || {}),
            defaultKeys: Object.keys(u && u.default || {})
          }), new Error("Main module does not export init or createMain");
        o && o.info("[P14] MainAPI normalized", {
          hasInit: typeof c.init == "function",
          hasCreateMain: typeof c.createMain == "function"
        });
        var d = typeof document < "u" ? document : null, f = {
          // @ts-expect-error strict migration — TS18049
          eventBus: t.get("eventBus"),
          // @ts-expect-error strict migration — TS18049
          router: t.get("routerGlobal"),
          // @ts-expect-error strict migration — TS18049
          globalState: t.get("globalState"),
          // @ts-expect-error strict migration — TS18049
          telemetryCore: t.get("telemetryCore"),
          document: d,
          defaultPanel: "panel-01"
        };
        o && o.info("[P14] External deps prepared via ports", {
          hasEventBus: !!f.eventBus,
          hasRouter: !!f.router,
          hasDocument: !!f.document
        });
        var g = c.init || c.createMain;
        return Promise.resolve(g(f)).then(function(h) {
          return o && o.info("[P14] Main instance created", { hasEngine: !!h, type: typeof h }), h && typeof h.mount == "function" ? Promise.resolve(h.mount()).then(function() {
            return o && o.info("[P14] Main mount() called successfully"), h;
          }).catch(function(p) {
            return o && o.warn("[P14] Main mount() failed", { error: p.message }), h;
          }) : h;
        }).then(function(h) {
          var p = Object.assign({}, c, {
            getInstance: function() {
              return h;
            },
            VERSION: c.VERSION || u.VERSION || ao
          });
          return t.exposeGlobal("Main", p), t.exposeGlobal("MainModule", u), s && s.expose && s.expose("Main", p), o && o.info("[P14] Main exposed to window"), a && a.setReady && a.setReady("main", !0), i.initialized.push("main"), r = !0, l && l.emit && l.emit(of.MAIN_READY, { version: ao }), o && o.info("[P14] Main Enterprise v2 mounted successfully", { version: ao }), h;
        });
      }).catch(function(u) {
        throw i.failed.push({ id: "main", error: u.message }), o && o.error("[P14] Main Enterprise v2 mount failed", {
          error: u.message,
          stack: u.stack ? u.stack.substring(0, 500) : ""
        }), u;
      });
    },
    reset: function() {
      r = !1;
    }
  };
}
function Gp(e) {
  e === void 0 && (e = {});
  var t = e.portsManager, r = !1;
  return {
    isMounted: function() {
      return r;
    },
    // v4.4.0: Permite sincronizar estado de montagem externamente
    _setMounted: function(n) {
      r = !!n;
    },
    mount: function(n, i) {
      var l;
      if (r)
        return n && n.info("[P14] container-main already mounted - skipping"), Promise.resolve(null);
      var o = xp();
      return o && n && n.info("[P14] Existing container detected", {
        mode: o.mode,
        rootId: (l = o.rootEl) == null ? void 0 : l.id,
        hasContent: !!o.contentEl
      }), import("/components/main/dist/main.bundle.js").then(function(a) {
        var s = a.boot || a.default && a.default.boot, u = a.getBootstrap || a.default && a.default.getBootstrap, c = a.ContainerMain || a.default, d = a.injectEventBus || a.default && a.default.injectEventBus, f = a.injectSidebarRegistry || a.default && a.default.injectSidebarRegistry, g = t ? t.get("eventBus") : null, h = t ? t.get("sidebarRegistry") : null;
        if (d && g && (d(g), n && n.info("[P14] EventBus injected into container-main module")), f && h && (f(h), n && n.info("[P14] SidebarRegistry injected into container-main module")), !s)
          return n && n.warn("[P14] container-main boot() not available"), { container: null, bootFn: null, getBootstrapFn: null, ContainerMainAPI: null };
        var p = null;
        if (o && o.rootEl)
          p = {
            element: o.rootEl,
            contentElement: o.contentEl,
            id: o.rootEl.id || "container-main",
            mode: "existing",
            mount: function() {
            },
            unmount: function() {
            },
            getElement: function() {
              return o.rootEl;
            },
            getContentElement: function() {
              return o.contentEl;
            }
          }, n && n.info("[P14] Using existing container from DOM", { id: p.id });
        else {
          var A = document.querySelector("#shell-main-region");
          if (A) {
            var T = A.querySelector("#container-main") || A.querySelector(".dsd-container") || A.querySelector('[data-container-main="true"]');
            T && (p = {
              element: T,
              contentElement: T.querySelector(".dsd-container__content") || T,
              id: T.id || "container-main",
              mode: "fallback",
              mount: function() {
              },
              unmount: function() {
              },
              getElement: function() {
                return T;
              },
              getContentElement: function() {
                return this.contentElement;
              }
            }, n && n.info("[P14] Using fallback container from shell-main-region", { id: p.id }));
          }
        }
        return p || (n && n.warn("[P14] No container found in DOM - bootstrap will create one"), p = {
          element: null,
          contentElement: null,
          id: "container-main",
          mode: "virtual",
          mount: function() {
          },
          unmount: function() {
          },
          getElement: function() {
            return document.getElementById("container-main");
          },
          getContentElement: function() {
            var S = this.getElement();
            return S ? S.querySelector(".dsd-container__content") || S : null;
          }
        }), r = !0, {
          container: p,
          bootFn: s,
          getBootstrapFn: u,
          ContainerMainAPI: c,
          existingContainer: o
        };
      }).catch(function(a) {
        return n && n.warn("[P14] container-main mount failed (non-critical)", { error: a.message }), { container: null, bootFn: null, getBootstrapFn: null, ContainerMainAPI: null };
      });
    },
    reset: function() {
      r = !1;
    }
  };
}
function zp(e) {
  e === void 0 && (e = {});
  var t = e.portsManager, r = null;
  return {
    getBootstrap: function() {
      return r;
    },
    // v4.3.0: Permite sincronizar com bootstrap existente (feito por Main.init)
    _setBootstrap: function(n) {
      r = n;
    },
    boot: function(n, i, o, l, a, s) {
      var u = performance.now();
      return r ? (a && a.info("[P14] Bootstrap already exists - skipping boot"), Promise.resolve(r)) : n ? (a && a.info("[P14] Booting container-main Bootstrap platform..."), Promise.resolve().then(function() {
        return n(l, kp);
      }).then(function(c) {
        var d = Math.round(performance.now() - u);
        if (!c)
          return a && a.warn("[P14] container-main boot() returned null"), null;
        r = c, t && t.exposeGlobal && t.exposeGlobal("CMBootstrap", c), s && s.expose && s.expose("CMBootstrap", c), o && t && t.exposeGlobal && t.exposeGlobal("ContainerMainPlatform", o);
        var f = c, g = f.info ? f.info() : {}, h = f.getState ? f.getState() : "unknown";
        a && a.info("[P14] container-main Bootstrap initialized", {
          bootTime: d,
          state: h,
          version: g.version || "unknown",
          managersActive: g.managersActive || 0
        });
        var p = t ? t.get("telemetryCore") : null;
        return p && p.track && p.track("container-main:bootstrapped", {
          bootTime: d,
          state: h,
          managersActive: g.managersActive || 0
        }), c;
      }).catch(function(c) {
        return a && a.warn("[P14] container-main Bootstrap failed (non-critical)", { error: c.message }), null;
      })) : (a && a.info("[P14] container-main boot() not available - skipping Bootstrap initialization"), Promise.resolve(null));
    },
    reset: function() {
      r = null;
    }
  };
}
var xi = "4.6.0-HEALTH-CONTRACT", ar = Hp(), oo = Bp({ portsManager: ar }), $r = Up(), Sr = Fp({ portsManager: ar }), Fi = Gp({ portsManager: ar }), yd = zp({ portsManager: ar });
function Eo(e) {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get(e);
    if (t) return t;
  }
  return window[e] || null;
}
function vo() {
  return yd.getBootstrap() || Eo("CMBootstrap");
}
function Bl(e, t, r) {
  return Sr.mount(e, t).then(function(n) {
    return n ? (Vp(r, e.windowAdapter), n) : null;
  });
}
function Vp(e, t) {
  var r = Eo("CMBootstrap");
  if (!r) {
    e && e.info("[P14] CMBootstrap not yet available - Main.init may still be initializing");
    return;
  }
  e && e.info("[P14] Bootstrap found - syncing reference"), yd._setBootstrap(r), Fi._setMounted(!0);
  var n = Eo("ContainerMain");
  if (!n) {
    var i = document.getElementById("container-main") || document.querySelector(".dsd-container") || document.querySelector('[data-container-main="true"]'), o = {
      element: i,
      contentElement: i ? i.querySelector(".dsd-container__content") : null,
      id: "container-main",
      mode: "synced",
      mount: function() {
      },
      unmount: function() {
      },
      getElement: function() {
        return i;
      },
      getContentElement: function() {
        return this.contentElement;
      },
      getBootstrap: function() {
        return r;
      },
      isBootstrapped: function() {
        return !0;
      }
    };
    t && t.expose && t.expose("ContainerMain", o), ar.exposeGlobal("ContainerMain", o);
  }
  var l = r.info ? r.info() : {};
  e && e.info("[P14] container-main Bootstrap synced", {
    state: r.getState ? r.getState() : "unknown",
    version: l.version || "unknown",
    managersActive: l.managersActive || 0
  });
}
var Yp = {
  id: "phase-4-main",
  name: "Main Enterprise v2",
  order: 4,
  critical: !0,
  recoverable: !0,
  dependsOn: ["phase-3-shell"],
  parallel: !1,
  modules: [{ id: "main", name: "Main Enterprise Engine v2", critical: !0, timeout: 15e3 }],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = { initialized: [], failed: [] }, i = performance.now();
    if (ar.init(), Sr.isMounted())
      return t && t.info("[P14] Main already mounted - skipping"), Promise.resolve({ success: !0, skipped: !0, reason: "already-mounted", time: 0 });
    t && t.info("[P14] Phase 4 starting: Main Enterprise v2", { version: xi }), r && r.track("phase-4-start", { version: xi }), $r.register(e, function(a, s) {
      if (Sr.isMounted()) {
        t && t.info("[P14] Main already mounted - skipping");
        return;
      }
      t && t.info("[P14] Auth event received - mounting Main", { data: s });
      var u = { initialized: [], failed: [] };
      Bl(a, u, t).catch(function(c) {
        t && t.error("[P14] Mount after auth event failed", { error: c.message });
      });
    });
    var o = oo.checkAuthentication(), l = oo.getDataState();
    return t && t.info("[P14] Auth check result", {
      isAuthenticated: o,
      dataState: l,
      authReady: oo.getAuthReady()
    }), !o && l === null ? (t && t.info("[P14] User not authenticated - Main mount deferred"), Promise.resolve({
      success: !0,
      deferred: !0,
      reason: "awaiting-auth",
      listenersActive: !0,
      initialized: n.initialized,
      failed: n.failed,
      time: Math.round(performance.now() - i)
    })) : o || l === "authenticated" ? Bl(e, n, t).then(function() {
      var a = Math.round(performance.now() - i);
      return r && r.track("phase-4-complete", { initialized: n.initialized.length, time: a }), t && t.info("[P14] Phase 4 complete", { initialized: n.initialized, time: a }), { success: n.failed.length === 0, initialized: n.initialized, failed: n.failed, time: a };
    }) : (t && t.info("[P14] User not authenticated - Main mount deferred"), Promise.resolve({
      success: !0,
      deferred: !0,
      reason: "awaiting-auth",
      listenersActive: !0,
      initialized: n.initialized,
      failed: n.failed,
      time: Math.round(performance.now() - i)
    }));
  },
  recover: function(e, t) {
    var r = t.logger, n = t.telemetry;
    return r && r.warn("[P14] Phase 4 recovery: Main will operate in degraded mode", { error: e.message }), n && n.track("phase-4-recovery", { error: e.message }), Promise.resolve();
  }
};
function jp() {
  var e = vo(), t = e && e.info ? e.info() : null, r = e && e.healthCheck ? e.healthCheck() : null;
  return ue({
    status: Sr.isMounted() ? B.HEALTHY : B.DEGRADED,
    moduleId: Pp,
    version: xi,
    checks: {
      mainMounted: Sr.isMounted(),
      containerMainMounted: Fi.isMounted(),
      containerMainBootstrapped: !!e,
      authListenerRegistered: $r.isRegistered()
    },
    details: {
      modular: !0,
      mainMounted: Sr.isMounted(),
      containerMainMounted: Fi.isMounted(),
      containerMainBootstrapped: !!e,
      containerMainState: e && e.getState ? e.getState() : null,
      containerMainManagers: t ? t.managersActive : 0,
      containerMainHealth: r ? r.status : null,
      authListenerRegistered: $r.isRegistered(),
      cleanups: $r.getCleanups().length,
      p21Compliant: !0,
      p0Compliant: !0,
      diEnabled: !0,
      unifiedIntegration: !0
    }
  });
}
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.phase4 = {
  getState: function() {
    return {
      authListenerRegistered: $r.isRegistered(),
      mainMounted: Sr.isMounted(),
      containerMainMounted: Fi.isMounted(),
      containerMainBootstrapped: !!vo(),
      cleanups: $r.getCleanups().length,
      portsInitialized: ar.isInitialized()
    };
  },
  getPorts: function() {
    return ar.getAll();
  },
  getBootstrap: function() {
    return vo();
  },
  healthCheck: jp,
  version: xi
});
var so = "phase-5-ui", Ci = "5.7.0-ROUTE-CHANGED-EVENT", Ur = ["appshell", "header", "sidebar", "navRail", "footer"], Ad = 8e3, Hr = null;
function Ai() {
  if (Hr) return Hr;
  var e = Hg();
  return e ? (Hr = e, Hr) : (typeof window < "u" && window.RuntimeContext && (Hr = window.RuntimeContext), Hr);
}
function Wp() {
  return typeof window < "u" && window.ReadyFlags ? window.ReadyFlags : null;
}
function $p(e) {
  var t = Wp();
  if (!t || !t.waitFor)
    return e && e.warn("[phase-5] ReadyFlags not available, skipping shell wait"), Promise.resolve({ allReady: !1, readyCount: 0, total: 0, notReady: [], reason: "ReadyFlags not available" });
  e && e.info("[phase-5] Waiting for shell components...", { flags: Ur });
  var r = Ur.map(function(n) {
    return t.waitFor(n, Ad).then(function(i) {
      return { flag: n, ready: i };
    });
  });
  return Promise.all(r).then(function(n) {
    var i = n.filter(function(l) {
      return l.ready;
    }).length, o = n.filter(function(l) {
      return !l.ready;
    }).map(function(l) {
      return l.flag;
    });
    return e && (o.length > 0 ? e.warn("[phase-5] Some shell components not ready (timeout)", {
      ready: i + "/" + Ur.length,
      notReady: o
    }) : e.info("[phase-5] All shell components ready", {
      ready: i + "/" + Ur.length
    })), {
      allReady: o.length === 0,
      readyCount: i,
      total: Ur.length,
      notReady: o
    };
  });
}
var it = null, Ke = null;
function Kp(e) {
  var t = de(), r = null;
  typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get && (r = window.Core.windowAdapter.get("ContextProvider"));
  var n = {
    appShell: typeof window < "u" && window.AppShell ? window.AppShell : null,
    applicationKernel: typeof window < "u" && window.ApplicationKernel ? window.ApplicationKernel : null,
    permissionsGuard: typeof window < "u" && window.PermissionsGuard ? window.PermissionsGuard : null,
    healthAggregator: typeof window < "u" && window.HealthAggregator ? window.HealthAggregator : null,
    contextProvider: r
  }, i = Object.keys(n).filter(function(o) {
    return n[o] === null;
  });
  return i.length > 0 && e && e.warn("[phase-5] Optional dependencies not available", { missing: i, available: Object.keys(n).filter(function(o) {
    return n[o] !== null;
  }), strictMode: t }), n;
}
function qp() {
  return typeof window > "u" ? null : window.Core && window.Core.EventBus ? window.Core.EventBus : window.EventBus || window.EventBusGlobal || null;
}
var Sd = {
  id: "phase-5-ui",
  name: "UI Components",
  order: 5,
  critical: !1,
  recoverable: !0,
  dependsOn: ["phase-4-main"],
  parallel: !0,
  modules: [
    { id: "overlay-layer", name: "Overlay Layer", critical: !0, timeout: 5e3 },
    { id: "ui-orchestrator", name: "UI Orchestrator", critical: !0, timeout: 5e3 },
    { id: "ticker", name: "Ticker", critical: !1, timeout: 5e3 },
    { id: "toast", name: "Toast Service", critical: !1, timeout: 3e3 },
    { id: "shell-ready-wait", name: "Shell Ready Wait", critical: !1, timeout: 1e4 },
    { id: "preloader-fade", name: "Preloader Fade", critical: !1, timeout: 2e3 }
  ],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = e.windowAdapter, i = { initialized: [], failed: [], skipped: [] }, o = performance.now(), l = Kp(t), a = qp();
    return !a && t && t.error("[phase-5] CRITICAL: EventBus not available — UI components may fail"), t && t.info("Phase 5 starting: UI Components", { version: Ci, optionalDepsAvailable: Object.keys(l).filter(function(s) {
      return l[s] !== null;
    }).length + "/5" }), r && r.track("phase-5-start"), Promise.resolve().then(function() {
      if (it && it.info) {
        var s = it.info();
        if (s && s.initialized)
          return i.skipped.push({ id: "overlay-layer", reason: "already initialized" }), t && t.info("OverlayLayer already initialized"), null;
      }
      var s = typeof window < "u" && window.OverlayLayer && window.OverlayLayer.info ? window.OverlayLayer.info() : null;
      return s && s.initialized ? (it = window.OverlayLayer, i.skipped.push({ id: "overlay-layer", reason: "already initialized" }), t && t.info("OverlayLayer already initialized"), null) : import("/components/overlay-layer/dist/overlay-layer.bundle.js").then(function(u) {
        var c = u.default || u.OverlayLayer;
        if (c && c.init) {
          var d = Ai();
          t && (d ? t.info("RuntimeContext obtained from Kernel", {
            version: d.VERSION || "unknown",
            mode: d.getMode ? d.getMode() : "unknown",
            ready: d.isReady ? d.isReady() : !1
          }) : t.warn("RuntimeContext not available from Kernel, OverlayLayer may have limited functionality"));
          var f = d ? {
            runtimeContext: d,
            eventBus: a,
            applicationKernel: l.applicationKernel,
            permissionsGuard: l.permissionsGuard,
            healthAggregator: l.healthAggregator,
            contextProvider: l.contextProvider,
            appShell: l.appShell,
            kernelMode: d.getMode ? d.getMode() : "INITIALIZING",
            kernelReady: d.isReady ? d.isReady() : !1,
            kernelHealthy: d.isHealthy ? d.isHealthy() : !1
          } : {
            eventBus: a,
            applicationKernel: l.applicationKernel,
            permissionsGuard: l.permissionsGuard,
            healthAggregator: l.healthAggregator,
            contextProvider: l.contextProvider,
            appShell: l.appShell
          };
          return Promise.resolve(c.init(f)).then(function(g) {
            it = c, n && n.expose && n.expose("OverlayLayer", c), typeof window < "u" && (window.OverlayLayer = c), i.initialized.push("overlay-layer"), t && t.info("OverlayLayer initialized with RuntimeContext", {
              version: c.getVersion ? c.getVersion() : "unknown",
              kernelIntegrated: c.isKernelIntegrated ? c.isKernelIntegrated() : !1,
              kernelMode: c.getKernelMode ? c.getKernelMode() : "unknown",
              runtimeContextProvided: !!d
            }), Ke && Ke.connectOverlayLayer && (Ke.connectOverlayLayer(c), t && t.info("OverlayLayer connected to UIOrchestrator"));
          });
        } else
          i.failed.push({ id: "overlay-layer", error: "No init function" }), t && t.error("OverlayLayer module missing init function");
      }).catch(function(u) {
        i.failed.push({ id: "overlay-layer", error: u.message }), t && t.error("OverlayLayer init error", { error: u.message });
      });
    }).then(function() {
      if (Ke && Ke.info) {
        var s = Ke.info();
        if (s && s.initialized)
          return i.skipped.push({ id: "ui-orchestrator", reason: "already initialized" }), t && t.info("UIOrchestrator already initialized"), it && Ke.connectOverlayLayer && (Ke.connectOverlayLayer(it), t && t.info("OverlayLayer connected to existing UIOrchestrator")), null;
      }
      var s = typeof window < "u" && window.UIOrchestrator && window.UIOrchestrator.info ? window.UIOrchestrator.info() : null;
      return s && s.initialized ? (Ke = window.UIOrchestrator, i.skipped.push({ id: "ui-orchestrator", reason: "already initialized" }), t && t.info("UIOrchestrator already initialized"), it && Ke.connectOverlayLayer && (Ke.connectOverlayLayer(it), t && t.info("OverlayLayer connected to existing UIOrchestrator")), null) : import("/core/ui-orchestrator/dist/ui-orchestrator.bundle.js").then(function(u) {
        var c = u.default || u;
        if (c && c.init) {
          var d = Ai();
          return Promise.resolve(c.init({
            eventBus: a,
            overlayLayer: it,
            runtimeContext: d,
            config: { enableTelemetry: !0, enableLogging: !0, autoSyncAuth: !0 }
          })).then(function(f) {
            if (f.success) {
              Ke = c, n && n.expose && n.expose("UIOrchestrator", c), typeof window < "u" && (window.UIOrchestrator = c), i.initialized.push("ui-orchestrator"), t && t.info("UIOrchestrator initialized", {
                version: c.VERSION,
                runtimeContextProvided: !!d
              });
              var g = typeof window < "u" && window.location ? window.location.hash : "#/";
              if (g && g !== "#/" && g !== "#//") {
                t && t.info("Resolving current route after UIOrchestrator init", { hash: g });
                var h = c.resolveFromURL(g);
                if (h && h.success) {
                  var p = h.panel, A = h.route, T = p ? p.id : null;
                  t && t.info("Route resolved from URL", {
                    hash: g,
                    panelId: T,
                    region: h.region,
                    routeId: A ? A.id : null
                  }), a && a.emit && a.emit("router.route.changed", {
                    path: g,
                    hash: g,
                    route: h.route || null,
                    panel: h.panel || null,
                    region: h.region || "main",
                    source: so,
                    timestamp: Date.now()
                  });
                } else
                  t && t.warn("No route found for current hash", {
                    hash: g,
                    error: h ? h.error : "no resolution"
                  });
              }
            } else
              i.failed.push({ id: "ui-orchestrator", error: f.error }), t && t.error("UIOrchestrator init failed", { error: f.error });
          });
        } else
          i.failed.push({ id: "ui-orchestrator", error: "No init function" }), t && t.error("UIOrchestrator module missing init function");
      }).catch(function(u) {
        i.failed.push({ id: "ui-orchestrator", error: u.message }), t && t.error("UIOrchestrator init error", { error: u.message });
      });
    }).then(function() {
      var s = l.appShell;
      return s && s.adapters && s.adapters.ticker ? (t && t.info("Connecting Ticker via AppShell adapter..."), Promise.resolve(s.adapters.ticker.connect("shell-ticker-region")).then(function(u) {
        u ? (i.initialized.push("ticker"), t && t.info("Ticker connected via AppShell adapter")) : (i.skipped.push({ id: "ticker", reason: "connect returned false" }), t && t.warn("Ticker connect returned false"));
      })) : (t && t.warn("AppShell.adapters.ticker not available, using direct import"), import("/components/app-shell/adapters/ticker-adapter.js").then(function(u) {
        return Promise.resolve(u.default.connect("shell-ticker-region")).then(function(c) {
          c ? i.initialized.push("ticker") : i.skipped.push({ id: "ticker", reason: "fallback connect failed" });
        });
      }).catch(function(u) {
        i.failed.push({ id: "ticker", error: u.message }), t && t.warn("Ticker init failed (non-critical)", { error: u.message });
      }));
    }).then(function() {
      return typeof window < "u" && window.Toast ? (i.skipped.push({ id: "toast", reason: "already initialized" }), null) : import("/components/toast/service/dist/toast-service.bundle.js").then(function(s) {
        var u = s.default || s.ToastService;
        if (u && u.init)
          return Promise.resolve(u.init()).then(function() {
            n && n.expose && n.expose("Toast", u), i.initialized.push("toast"), t && t.info("Toast service initialized");
          });
      }).catch(function(s) {
        i.failed.push({ id: "toast", error: s.message }), t && t.warn("Toast init failed (non-critical)", { error: s.message });
      });
    }).then(function() {
      return $p(t).then(function(s) {
        return i.initialized.push("shell-ready-wait"), r && r.track("shell-components-ready", {
          allReady: s.allReady,
          readyCount: s.readyCount,
          total: s.total,
          notReady: s.notReady
        }), s;
      });
    }).then(function() {
      try {
        if (typeof window < "u" && window.PreloaderController && window.PreloaderController.hide)
          window.PreloaderController.hide(function() {
            t && t.info("Preloader hidden via PreloaderController API");
          }), i.initialized.push("preloader-fade");
        else if (l.appShell && l.appShell.fadeOutPreloader)
          l.appShell.fadeOutPreloader(500), i.initialized.push("preloader-fade"), t && t.info("Preloader fade triggered via AppShell");
        else {
          var s = document.querySelector("[data-preloader-root]") || document.getElementById("shell-preloader-region") || document.getElementById("loading-screen");
          s ? (s.style.transition = "opacity 0.5s ease-out", s.style.opacity = "0", setTimeout(function() {
            s && s.parentNode && (s.style.display = "none", s.style.visibility = "hidden");
          }, 550), i.initialized.push("preloader-fade"), t && t.info("Preloader fade via DOM fallback", { element: s.className || s.id })) : (i.skipped.push({ id: "preloader-fade", reason: "no preloader found" }), t && t.warn("No preloader element found for fade"));
        }
      } catch (u) {
        i.failed.push({ id: "preloader-fade", error: u.message }), t && t.error("Preloader fade error", { error: u.message });
      }
    }).then(function() {
      try {
        var s = l.appShell;
        s && s.finalize && !(typeof window < "u" && window.AppShellReady) && (s.finalize(), t && t.info("AppShell finalized"));
      } catch (u) {
        t && t.warn("AppShell finalize warning", { error: u.message });
      }
    }).then(function() {
      var s = Math.round(performance.now() - o);
      return r && r.track("phase-5-complete", { initialized: i.initialized.length, failed: i.failed.length, skipped: i.skipped.length, time: s }), t && t.info("Phase 5 complete", { initialized: i.initialized, failed: i.failed.length, skipped: i.skipped.length, time: s }), { success: !0, initialized: i.initialized, failed: i.failed, skipped: i.skipped, time: s };
    });
  },
  healthCheck: function() {
    var e = Ai(), t = it || (typeof window < "u" ? window.OverlayLayer : null), r = Ke || (typeof window < "u" ? window.UIOrchestrator : null), n = !!(t && t.isInitialized && t.isInitialized()), i = !!(r && r.info), o = !!e, l = B.HEALTHY;
    return !n && !i && !o ? l = B.UNHEALTHY : (!n || !i || !o) && (l = B.DEGRADED), ue({
      status: l,
      moduleId: so,
      version: Ci,
      checks: {
        overlayLayerReady: n,
        uiOrchestratorReady: i,
        runtimeContextAvailable: o
      },
      details: {
        overlayLayerReady: n,
        uiOrchestratorReady: i,
        runtimeContextAvailable: o
      }
    });
  },
  info: function() {
    var e = Ai(), t = it || (typeof window < "u" ? window.OverlayLayer : null);
    return {
      moduleId: so,
      version: Ci,
      modules: Sd.modules.map(function(r) {
        return r.id;
      }),
      overlayLayerIntegrated: !!(t && t.isKernelIntegrated && t.isKernelIntegrated()),
      runtimeContextVersion: e ? e.VERSION : null,
      shellReadyFlags: Ur,
      shellReadyTimeout: Ad
    };
  }
};
typeof window < "u" && (window.__dev = window.__dev || {}, window.__dev.phase5 = { version: Ci });
var Ul = "phase-6-platform", Si = "3.3.0-HEALTH-CONTRACT", Jp = {
  id: "phase-6-platform",
  name: "Platform Runtime",
  order: 6,
  critical: !1,
  recoverable: !0,
  dependsOn: ["phase-5-ui"],
  parallel: !1,
  modules: [{ id: "platform", name: "Platform Runtime v3", critical: !1, timeout: 1e4 }],
  execute: function(e) {
    var t = e.logger, r = e.telemetry, n = e.windowAdapter, i = e.readyFlagsAdapter, o = { initialized: [], failed: [] }, l = performance.now();
    return t && t.info("Phase 6 starting: Platform Runtime v3"), r && r.track("phase-6-start", { version: Si }), Promise.all([
      import("/platform/runtime/dist/platform-runtime.bundle.js"),
      import("/platform/shell/dist/platform-shell.bundle.js")
    ]).then(function(a) {
      var s = a[0], u = a[1], c = n && n.getWindow ? n.getWindow() : typeof window < "u" ? window : {}, d = {
        eventBus: c.EventBus || null,
        document: c.document || null,
        mainEngine: c.Main || null
      };
      return Promise.resolve(s.init(d)).then(function(f) {
        return u.init(d), n && n.expose && n.expose("Platform", {
          runtime: s,
          shell: u,
          navigate: s.navigate,
          info: s.info,
          getRuntime: s.getRuntime,
          VERSION: s.VERSION
        }), i && i.setReady && i.setReady("platform", !0), o.initialized.push("platform"), t && t.info("Platform Runtime v3 initialized", { version: Si }), f;
      });
    }).catch(function(a) {
      o.failed.push({ id: "platform", error: a.message }), t && t.warn("Platform Runtime failed (non-critical)", { error: a.message });
    }).then(function() {
      var a = Math.round(performance.now() - l);
      return r && r.track("phase-6-complete", { initialized: o.initialized.length, time: a }), { success: !0, initialized: o.initialized, failed: o.failed, time: a };
    });
  },
  recover: function(e, t) {
    var r = t.logger;
    return r && r.warn("Phase 6 recovery: Platform will be unavailable", { error: e.message }), Promise.resolve();
  },
  healthCheck: function() {
    return ue({ status: B.HEALTHY, moduleId: Ul, version: Si });
  },
  info: function() {
    return { moduleId: Ul, version: Si };
  }
};
const Zp = {
  "phase-0-critical": Ed,
  "phase-1-core": bt,
  "phase-2-auth": _p,
  "phase-3-shell": vd,
  "phase-4-main": Yp,
  "phase-5-ui": Sd,
  "phase-6-platform": Jp
}, Qp = {
  "phase-0-critical": "critical",
  "phase-1-core": "core",
  "phase-2-auth": "auth",
  "phase-3-shell": "shell",
  "phase-4-main": "main",
  "phase-5-ui": "ui",
  "phase-6-platform": "platform"
};
function Xp(e, t) {
  const r = [], n = Os();
  for (let i = 0; i < n.length; i++) {
    const o = n[i], l = Zp[o];
    if (l) {
      const a = Qp[o];
      if (a && e.phases[a] !== !1 && (r.push(l), t && t.addNode && (t.addNode(o, {
        name: l.name,
        critical: l.critical
      }), l.dependsOn)))
        for (let s = 0; s < l.dependsOn.length; s++)
          t.addEdge(l.dependsOn[s], o);
    }
  }
  return r;
}
function eE(e) {
  return e.map(function(t) {
    return t.id;
  });
}
function tE(e, t, r) {
  return function(n) {
    const i = n.phaseId, o = e.transitionToPhase(i);
    o.success || r.warn("StateMachine transition failed", {
      phaseId: i,
      error: o.error,
      currentState: e.getState()
    }), t && t.capturePhaseMemory && t.capturePhaseMemory(i, "start");
  };
}
function rE(e) {
  return function(t) {
    const r = t.phaseId;
    e && e.capturePhaseMemory && e.capturePhaseMemory(r, "end");
  };
}
function nE(e) {
  return !e || !e.reason ? { mode: k.FAILED, reason: "Boot loop detected - unknown" } : {
    mode: k.FAILED,
    reason: "Boot loop detected - " + e.reason
  };
}
function iE(e, t) {
  if (t === k.FAILED)
    return { mode: null, reason: "Already FAILED, no change needed" };
  var r = e && e.message ? e.message : "unknown";
  return {
    mode: k.FAILED,
    reason: "Boot crashed: " + r
  };
}
function aE(e) {
  e || (e = {});
  var t = e.contextSnapshot || null, r = e.healthResult || null, n = e.currentMode || null;
  if (n !== k.INITIALIZING)
    return {
      mode: null,
      reason: "Mode already set to " + n + ", no change needed"
    };
  var i = t && t.degradationCount > 0, o = r && r.status === "DEGRADED";
  return i || o ? {
    mode: k.DEGRADED,
    reason: "Boot completed with degradations",
    details: {
      hasDegradations: i,
      degradationCount: t ? t.degradationCount : 0,
      healthDegraded: o,
      healthStatus: r ? r.status : "unknown"
    }
  } : {
    mode: k.NORMAL,
    reason: "Boot completed successfully",
    details: {
      hasDegradations: !1,
      degradationCount: 0,
      healthDegraded: !1,
      healthStatus: r ? r.status : "unknown"
    }
  };
}
function oE(e, t) {
  if (t === k.FAILED)
    return { mode: null, reason: "Already FAILED, no change needed" };
  var r = e && e.error ? e.error : "unknown";
  return {
    mode: k.FAILED,
    reason: "Boot failed: " + r
  };
}
function sE(e) {
  e.config;
  const t = e.orchestrator, r = e.stateMachine, n = e.kernel, i = e.globalTimeout, o = e.loggerAdapter, l = e.telemetryAdapter, a = e.eventBusAdapter, s = e.degradationNotifier, u = e.phases, c = e.onPeriodicHealthStart, d = e.onBootComplete;
  let f = null;
  function g(T) {
    return !T || !T.mode ? !1 : n ? (n.setMode(T.mode, T.reason), o.info("Mode decision applied", {
      mode: T.mode,
      reason: T.reason,
      details: T.details || null
    }), !0) : !1;
  }
  function h() {
    const T = Gs(), S = Ap(s);
    if (!S.allowed) {
      o.error("Boot blocked by loop detection", S), l.error("boot-loop-blocked", S), Pr({ state: Me.SAFE_MODE, bootLoopDetected: !0 });
      const E = nE(S);
      return g(E), Promise.resolve({
        success: !1,
        error: S.reason,
        bootLoopDetected: !0,
        cooldownMs: S.cooldownMs || S.remainingMs
      });
    }
    if (T.state === Me.RUNNING)
      return o.warn("Boot already RUNNING, blocking duplicate"), Promise.resolve({ success: !1, error: "DUPLICATE_BOOT_BLOCKED", reason: "already_running" });
    if (T.state === Me.COMPLETED)
      return o.warn("Boot already COMPLETED, returning cached result"), Promise.resolve(f || { success: !0, cached: !0 });
    if (f)
      return o.warn("Boot already executed (local guard)"), Promise.resolve(f);
    Pr({
      state: Me.STARTING,
      startCount: T.startCount + 1,
      timestamp: Date.now(),
      bootLoopDetected: !1
    });
    const L = performance.now(), H = t.getHealthAggregator();
    return H && H.captureMemoryBaseline && (H.captureMemoryBaseline(), o.info("Memory baseline captured")), o.info("Boot pipeline starting", {
      phases: u.length,
      startCount: T.startCount + 1,
      manifestControlled: !0,
      kernelMode: n ? n.getMode() : "unknown",
      bootLoopStatus: S
    }), Pr({ state: Me.RUNNING }), i.start(), l.track("boot-start", {
      phases: u.length,
      bootAttempt: S.bootsInWindow
    }), r.transition(r.STATES.INITIALIZING), t.run(u).then(function(E) {
      i.clear("boot-completed"), f = E;
      const m = E.context || null, v = E.health || null;
      if (n) {
        const w = n.initialize({
          bootContext: t.getBootContext(),
          healthAggregator: t.getHealthAggregator(),
          orchestrator: t,
          stateMachine: r,
          eventBus: a && a.getEventBus ? a.getEventBus() : null,
          logger: o
        });
        o.info("Kernel initialized with StateMachine sync", {
          success: w.success,
          syncEnabled: w.syncEnabled
        });
      }
      if (f.success ? p(f, m, v, H) : A(f), d && typeof d == "function")
        try {
          d(f), o.info("Boot result persisted", { success: f.success });
        } catch (w) {
          o.warn("Failed to persist boot result", { error: w.message });
        }
      return l.track("boot-complete", {
        success: f.success,
        totalTime: f.totalTime,
        health: f.health ? f.health.status : "unknown",
        kernelMode: n ? n.getMode() : "unknown",
        kernelSyncEnabled: n ? n.info().syncEnabled : !1,
        persisted: !!d
      }), f;
    }).catch(function(E) {
      i.clear("boot-error"), Pr({ state: Me.FAILED }), r.transition(r.STATES.ERROR);
      const m = iE(E, n ? n.getMode() : null);
      if (g(m), s && s.notifyBootFailed && s.notifyBootFailed("Crash: " + E.message), f = { success: !1, error: E.message, totalTime: Math.round(performance.now() - L) }, d && typeof d == "function")
        try {
          d(f);
        } catch {
        }
      return o.error("Boot crashed", { error: E.message, kernelMode: n ? n.getMode() : "unknown" }), l.error("boot-crash", { error: E.message }), f;
    });
  }
  function p(T, S, L, H, E) {
    Pr({ state: Me.COMPLETED });
    const m = r.transition(r.STATES.READY);
    m.success || o.warn("StateMachine READY transition failed", {
      error: m.error,
      currentState: r.getState()
    });
    const v = aE({
      contextSnapshot: S,
      healthResult: L,
      currentMode: n ? n.getMode() : null
    }), w = g(v);
    v.mode === k.DEGRADED && s && s.notifyBootDegraded && s.notifyBootDegraded("Boot completou com degradações", {
      degradationCount: v.details ? v.details.degradationCount : 0,
      healthStatus: v.details ? v.details.healthStatus : "unknown"
    }), o.info("Kernel mode after boot", {
      mode: n ? n.getMode() : "unknown",
      decision: v.reason,
      modeApplied: w,
      hasDegradations: v.details ? v.details.hasDegradations : !1,
      healthDegraded: v.details ? v.details.healthDegraded : !1,
      syncEnabled: n ? n.info().syncEnabled : !1
    }), a.emit(Ot.READY, {
      totalTime: T.totalTime,
      // @ts-expect-error strict migration — TS18048
      phases: T.phases.length,
      context: S,
      health: L,
      kernelMode: n ? n.getMode() : null,
      kernelSyncEnabled: n ? n.info().syncEnabled : !1
    }), a.emit(Ot.CONTEXT_READY, {
      context: S,
      health: L,
      kernel: n ? n.getSnapshot() : null,
      timestamp: Date.now()
    }), n && a.emit(Oe.READY, {
      mode: n.getMode(),
      capabilities: n.getEnabledCapabilities(),
      health: L,
      syncEnabled: n.info().syncEnabled,
      timestamp: Date.now()
    }), Lt.enabled && Lt.autoStart && c && setTimeout(function() {
      c(H);
    }, Lt.startDelay), typeof window < "u" && window.scrollTo && window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    const y = H && H.getMemoryMetrics ? H.getMemoryMetrics() : null;
    o.info("Boot complete", {
      totalTime: T.totalTime,
      success: !0,
      stateMachineState: r.getState(),
      health: L ? L.status : "unknown",
      healthScore: L ? L.score : 0,
      degradations: S ? S.degradationCount : 0,
      kernelMode: n ? n.getMode() : "unknown",
      kernelCapabilities: n ? n.getEnabledCapabilities().length : 0,
      kernelSyncEnabled: n ? n.info().syncEnabled : !1,
      globalTimeoutStatus: i.getStatus(),
      memoryDelta: y ? y.totalDelta : null,
      periodicHealthEnabled: Lt.enabled,
      persistenceEnabled: !!d
    });
  }
  function A(T) {
    Pr({ state: Me.FAILED }), r.transition(r.STATES.ERROR);
    const S = oE(T, n ? n.getMode() : null);
    g(S), s && s.notifyBootFailed && s.notifyBootFailed(T.error || "unknown"), o.error("Boot failed", {
      errors: T.errors,
      decision: S.reason,
      kernelMode: n ? n.getMode() : "unknown"
    });
  }
  return {
    execute: h,
    getResult: function() {
      return f;
    },
    setResult: function(T) {
      f = T;
    }
  };
}
function lE(e, t, r, n) {
  if (!e || !e.startPeriodicCheck)
    return t.warn("Health Aggregator does not support periodic checks"), { success: !1, reason: "not_supported" };
  const i = e.startPeriodicCheck({
    interval: Lt.interval,
    maxChecks: Lt.maxChecks,
    onCheck: function(o, l) {
      (o.status === "DEGRADED" || o.status === "UNHEALTHY") && n && n.notify && n.notify("health-degraded", "Saúde do sistema: " + o.status, {
        score: o.score,
        status: o.status
      }), r.emit(Ot.HEALTH_PERIODIC, o);
    }
  });
  return i.success && t.info("Periodic health check started", {
    interval: Lt.interval,
    maxChecks: Lt.maxChecks
  }), i;
}
function uE(e) {
  e && e.stopPeriodicCheck && e.stopPeriodicCheck();
}
function cE(e) {
  var t = e.orchestrator, r = e.stateMachine, n = e.kernel, i = e.globalTimeout, o = e.degradationNotifier, l = e.listeners, a = e.cleanups;
  return function() {
    var u = t.getHealthAggregator(), c = u ? u.getStatus() : "unknown", d = u ? u.getScore() : 0, f = n ? n.healthCheck() : null, g = Fs(), h = i ? i.getStatus() : null, p = Gs(), A = { running: !1, checkCount: 0, history: [] };
    u && u.getPeriodicHistory && (A = u.getPeriodicHistory());
    var T = null;
    u && u.getMemoryMetrics && (T = u.getMemoryMetrics());
    var S = o ? o.info() : null, L = B.HEALTHY;
    return r.isReady() || (L = B.DEGRADED), ue({
      status: L,
      moduleId: en,
      version: Dn,
      checks: {
        stateMachineReady: r.isReady(),
        kernelIntegrated: !!n,
        orchestratorActive: !!t,
        healthAggregatorAvailable: !!u
      },
      details: {
        modular: !0,
        longLived: !0,
        listeners: l.length,
        cleanups: a.length,
        singletonState: p ? p.state : "unknown",
        p21Compliant: !0,
        p24Instrumented: !0,
        p25Compliant: !0,
        manifestIntegrated: !0,
        kernelIntegrated: !0,
        stateMachineSyncEnabled: f ? f.syncEnabled : !1,
        quickWinsApplied: !0,
        bootHealth: c,
        bootScore: d,
        kernel: f,
        bootLoop: g,
        globalTimeout: h,
        periodicHealth: A,
        memory: T,
        degradationNotifier: S,
        improvements: [
          "#10-StateMachineSync",
          "#26-CleanupListeners",
          "#12-RetryJitter",
          "#16-BootLoopDetection",
          "#24-GlobalTimeout",
          "#5-PeriodicHealthCheck",
          "#6-MemoryMetrics",
          "#25-DegradationNotifier",
          "MODULAR-ARCHITECTURE"
        ]
      }
    });
  };
}
function dE(e) {
  var t = e.config, r = e.orchestrator, n = e.stateMachine, i = e.kernel, o = e.globalTimeout, l = e.bootExecutor, a = e.listeners, s = e.cleanups;
  return function() {
    var c = null, d = r.getBootContext();
    d && (c = d.getSnapshot());
    var f = null, g = r.getHealthAggregator();
    g && (f = g.calculate());
    var h = i ? i.info() : null, p = Fs(), A = o ? o.getStatus() : null, T = l.getResult(), S = { running: !1, checkCount: 0, history: [] };
    g && g.getPeriodicHistory && (S = g.getPeriodicHistory());
    var L = null;
    return g && g.getMemoryMetrics && (L = g.getMemoryMetrics()), {
      version: Dn,
      moduleId: en,
      modular: !0,
      state: n ? n.getState() : "unknown",
      isReady: n ? n.isReady() : !1,
      singletonState: Gs(),
      longLived: !0,
      listeners: a.length,
      cleanups: s.length,
      p21Compliant: !0,
      p24Instrumented: !0,
      p25Compliant: !0,
      manifestIntegrated: !0,
      kernelIntegrated: !0,
      quickWinsApplied: ["QW01", "QW04", "QW08", "QW10", "QW11", "QW19", "QW21", "QW22", "KERNEL"],
      improvements: [
        "#10-StateMachineSync",
        "#26-CleanupListeners",
        "#12-RetryJitter",
        "#16-BootLoopDetection",
        "#24-GlobalTimeout",
        "#5-PeriodicHealthCheck",
        "#6-MemoryMetrics",
        "#25-DegradationNotifier",
        "MODULAR-ARCHITECTURE"
      ],
      manifestVersion: Z.version,
      enabledFeatures: Hc(),
      bootLoop: p,
      globalTimeout: A,
      periodicHealth: S,
      memory: L,
      bootResult: T ? {
        success: T.success,
        totalTime: T.totalTime,
        phasesCompleted: T.phases ? T.phases.length : 0
      } : null,
      bootContext: c ? {
        state: c.state,
        health: c.health,
        healthScore: c.healthScore,
        degraded: c.degraded,
        phasesCompleted: c.phasesCompleted
      } : null,
      bootHealth: f ? {
        status: f.status,
        score: f.score,
        issues: f.issueCount,
        warnings: f.warningCount
      } : null,
      kernel: h ? {
        mode: h.mode,
        initialized: h.initialized,
        syncEnabled: h.syncEnabled,
        capabilities: h.capabilities ? h.capabilities.enabledCount : 0
      } : null,
      config: {
        debug: t.debug,
        enabledPhases: Object.keys(t.phases).filter(function(H) {
          return t.phases[H];
        })
      }
    };
  };
}
function fE(e) {
  const t = e.orchestrator, r = e.stateMachine, n = e.kernel, i = e.globalTimeout, o = e.degradationNotifier, l = e.loggerAdapter, a = e.bootExecutor, s = e.cleanups, u = e.listeners, c = e.dependencyGraphRef, d = e.periodicHealthStartedRef;
  function f() {
    i && i.clear("reset");
    const h = t.getHealthAggregator();
    uE(h), d.value = !1, o && o.reset && o.reset();
    for (let p = 0; p < s.length; p++)
      try {
        const A = s[p];
        typeof A == "function" && A();
      } catch (A) {
        l.warn("Cleanup failed", { index: p, error: A.message });
      }
    s.length = 0, u.length = 0, a.setResult(null), t.reset(), r && r.reset(), c.value = null, n && n.reset(), wp(), l.info("Bootstrap reset (Modular Architecture)");
  }
  function g() {
    Sp(), l.info("Boot loop tracker reset");
  }
  return {
    reset: f,
    resetBootLoopTracker: g
  };
}
const Ua = "1.1.0-HEALTH-CONTRACT", xa = "boot-persistence", or = {
  CURRENT_BOOT: "__BOOTSTRAP_V2_CURRENT_BOOT__",
  BOOT_HISTORY: "__BOOTSTRAP_V2_BOOT_HISTORY__",
  LAST_SUCCESSFUL: "__BOOTSTRAP_V2_LAST_SUCCESSFUL__"
}, ut = {
  maxHistorySize: 10,
  persistenceEnabled: !0,
  useSessionStorage: !0,
  // true = sessionStorage, false = localStorage
  historyInLocalStorage: !0
  // histórico sempre em localStorage para persistir entre sessões
};
function zs(e) {
  return typeof window > "u" ? null : e && ut.historyInLocalStorage ? window.localStorage : ut.useSessionStorage ? window.sessionStorage : window.localStorage;
}
function Vs(e, t) {
  try {
    const r = zs(t);
    if (!r) return null;
    const n = r.getItem(e);
    return n ? JSON.parse(n) : null;
  } catch (r) {
    return console.warn("[boot-persistence] Failed to read:", e, r.message), null;
  }
}
function Gi(e, t, r) {
  try {
    const n = zs(r);
    return n ? (n.setItem(e, JSON.stringify(t)), !0) : !1;
  } catch (n) {
    return console.warn("[boot-persistence] Failed to write:", e, n.message), !1;
  }
}
function hE(e, t) {
  try {
    const r = zs(t);
    return r ? (r.removeItem(e), !0) : !1;
  } catch {
    return !1;
  }
}
function Ys(e) {
  if (!ut.persistenceEnabled) return !1;
  const t = {
    success: e.success,
    state: e.state,
    totalTime: e.totalTime,
    phases: e.phases ? e.phases.map((n) => ({
      id: n.id,
      success: n.success,
      duration: n.duration,
      degraded: n.degraded
    })) : [],
    health: e.health ? {
      status: e.health.status,
      score: e.health.score
    } : null,
    degraded: e.degraded || !1,
    timestamp: Date.now(),
    version: e.version || "2.7.0-QUALITY",
    sessionId: mE()
  }, r = Gi(or.CURRENT_BOOT, t, !1);
  return r && e.success && Gi(or.LAST_SUCCESSFUL, t, !1), r;
}
function ii() {
  return Vs(or.CURRENT_BOOT, !1);
}
function Fa() {
  return Vs(or.LAST_SUCCESSFUL, !1);
}
function js(e) {
  e === void 0 && (e = 3e4);
  const t = ii();
  if (!t) return !1;
  const r = Date.now() - t.timestamp;
  return t.success && r < e;
}
function Od() {
  return hE(or.CURRENT_BOOT, !1);
}
function Ws(e) {
  const t = tn(), r = {
    id: gE(),
    success: e.success,
    totalTime: e.totalTime,
    phasesCompleted: e.phases ? e.phases.filter((n) => n.success).length : 0,
    phasesTotal: e.phases ? e.phases.length : 0,
    degraded: e.degraded || !1,
    health: e.health ? e.health.status : "UNKNOWN",
    score: e.health ? e.health.score : 0,
    errors: e.errors ? e.errors.slice(0, 3) : [],
    // Máximo 3 erros
    timestamp: Date.now(),
    version: e.version || "2.7.0-QUALITY",
    userAgent: typeof navigator < "u" ? navigator.userAgent.substring(0, 100) : "unknown"
  };
  for (t.unshift(r); t.length > ut.maxHistorySize; )
    t.pop();
  return Gi(or.BOOT_HISTORY, t, !0);
}
function tn() {
  return Vs(or.BOOT_HISTORY, !0) || [];
}
function $s() {
  return Gi(or.BOOT_HISTORY, [], !0);
}
function ai() {
  const e = tn();
  if (e.length === 0)
    return {
      totalBoots: 0,
      successRate: 0,
      averageTime: 0,
      degradedRate: 0,
      recentTrend: "UNKNOWN",
      commonErrors: []
    };
  const t = e.filter((a) => a.success).length, r = e.filter((a) => a.degraded).length, n = e.reduce((a, s) => a + (s.totalTime || 0), 0);
  let i = "STABLE";
  if (e.length >= 5) {
    const a = e.slice(0, 3), s = e.slice(3), u = a.filter((d) => d.success).length / a.length, c = s.filter((d) => d.success).length / s.length;
    u > c + 0.1 ? i = "IMPROVING" : u < c - 0.1 && (i = "DEGRADING");
  }
  const o = {};
  e.forEach((a) => {
    a.errors && a.errors.forEach((s) => {
      const u = typeof s == "string" ? s : s.message || "Unknown";
      o[u] = (o[u] || 0) + 1;
    });
  });
  const l = Object.entries(o).sort((a, s) => s[1] - a[1]).slice(0, 5).map(([a, s]) => ({ error: a, count: s }));
  return {
    totalBoots: e.length,
    successRate: Math.round(t / e.length * 100),
    averageTime: Math.round(n / e.length),
    degradedRate: Math.round(r / e.length * 100),
    recentTrend: i,
    commonErrors: l,
    lastBoot: e[0] || null,
    oldestBoot: e[e.length - 1] || null
  };
}
function gE() {
  return "boot-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 7);
}
function mE() {
  if (typeof window > "u") return "unknown";
  let e = window.sessionStorage.getItem("__SESSION_ID__");
  return e || (e = "sess-" + Date.now().toString(36) + "-" + Math.random().toString(36).substring(2, 9), window.sessionStorage.setItem("__SESSION_ID__", e)), e;
}
function Id(e) {
  e.maxHistorySize !== void 0 && (ut.maxHistorySize = e.maxHistorySize), e.persistenceEnabled !== void 0 && (ut.persistenceEnabled = e.persistenceEnabled), e.useSessionStorage !== void 0 && (ut.useSessionStorage = e.useSessionStorage), e.historyInLocalStorage !== void 0 && (ut.historyInLocalStorage = e.historyInLocalStorage);
}
function Td() {
  return { ...ut };
}
function bd() {
  const e = ai();
  return {
    moduleId: xa,
    version: Ua,
    config: ut,
    currentBoot: ii(),
    lastSuccessful: Fa(),
    historySize: tn().length,
    analysis: e,
    improvements: ["#1-SessionStoragePersistence", "#4-BootHistory"]
  };
}
function Rd() {
  var e = typeof window < "u" && window.sessionStorage && window.localStorage, t = ai(), r = B.HEALTHY;
  return e || (r = B.DEGRADED), ue({
    status: r,
    moduleId: xa,
    version: Ua,
    checks: {
      storageAvailable: !!e,
      persistenceEnabled: ut.persistenceEnabled,
      historyAccessible: t.totalBoots >= 0
    },
    details: {
      storageAvailable: !!e,
      persistenceEnabled: ut.persistenceEnabled,
      historySize: t.totalBoots,
      successRate: t.successRate,
      recentTrend: t.recentTrend
    }
  });
}
var pE = {
  VERSION: Ua,
  MODULE_ID: xa,
  // #1: Persistência
  saveCurrentBoot: Ys,
  getCurrentBoot: ii,
  getLastSuccessfulBoot: Fa,
  hasRecentValidBoot: js,
  clearCurrentBoot: Od,
  // #4: Histórico
  addToHistory: Ws,
  getHistory: tn,
  clearHistory: $s,
  analyzeHistory: ai,
  // Config
  configure: Id,
  getConfig: Td,
  info: bd,
  healthCheck: Rd
};
const EE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: xa,
  VERSION: Ua,
  addToHistory: Ws,
  analyzeHistory: ai,
  clearCurrentBoot: Od,
  clearHistory: $s,
  configure: Id,
  default: pE,
  getConfig: Td,
  getCurrentBoot: ii,
  getHistory: tn,
  getLastSuccessfulBoot: Fa,
  hasRecentValidBoot: js,
  healthCheck: Rd,
  info: bd,
  saveCurrentBoot: Ys
}, Symbol.toStringTag, { value: "Module" })), Ga = "1.2.0-DOMAIN-PURE", oi = "debug-mode";
var si = Ln({ moduleId: oi });
let le = {
  enabled: !1,
  level: "info",
  modules: {},
  startedAt: null
};
const Cn = {
  OFF: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  TRACE: 5
}, Ks = [
  "VERBOSE_LOGGING",
  "TELEMETRY_DEBUG",
  "MEMORY_METRICS",
  "PROGRESS_EVENTS"
];
function vE() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var e = window.Core.windowAdapter.get("BootstrapV2");
    if (e) return e;
  }
  return window.BootstrapV2 || null;
}
function li(e) {
  return e === void 0 && (e = {}), le.enabled = !0, le.level = e.level || "debug", le.startedAt = Date.now(), Dd(!0), Cd(!0), e.exposeGlobal !== !1 && yE(), kt("info", "Debug mode ENABLED", { level: le.level, options: e }), Lr();
}
function ui() {
  return kt("info", "Debug mode DISABLED", { duration: Date.now() - le.startedAt }), le.enabled = !1, le.startedAt = null, Dd(!1), Cd(!1), AE(), Lr();
}
function za() {
  return le.enabled ? ui() : li();
}
function qs() {
  return le.enabled === !0;
}
function Lr() {
  return {
    enabled: le.enabled,
    level: le.level,
    levelValue: Cn[le.level.toUpperCase()] || 3,
    startedAt: le.startedAt,
    duration: le.startedAt ? Date.now() - le.startedAt : 0,
    modules: { ...le.modules },
    controlledFlags: Ks
  };
}
function Js(e) {
  return le.modules[e] = !0, kt("debug", "Module debug enabled: " + e), !0;
}
function Zs(e) {
  return le.modules[e] = !1, kt("debug", "Module debug disabled: " + e), !0;
}
function wd(e) {
  return !(!le.enabled || le.modules[e] === !1);
}
function kt(e, t, r) {
  if (!le.enabled) return;
  const n = Cn[e.toUpperCase()] || 3, i = Cn[le.level.toUpperCase()] || 3;
  if (n > i) return;
  const o = "[DEBUG][" + e.toUpperCase() + "]", l = console;
  r !== void 0 ? l[e] ? l[e](o, t, r) : console.log(o, t, r) : l[e] ? l[e](o, t) : console.log(o, t);
}
function Qs(e, t) {
  if (!le.enabled) return t();
  const r = performance.now(), n = t(), i = performance.now() - r;
  return kt("debug", "MEASURE [" + e + "]: " + i.toFixed(2) + "ms"), n;
}
async function Xs(e, t) {
  if (!le.enabled) return t();
  const r = performance.now(), n = await t(), i = performance.now() - r;
  return kt("debug", "MEASURE [" + e + "]: " + i.toFixed(2) + "ms"), n;
}
function Dd(e) {
  try {
    var t = vE();
    t && t._instance && t._instance.config && Ks.forEach(function(r) {
      t._instance.config.features[r] = e;
    });
  } catch {
  }
}
function Cd(e) {
  try {
    var t = si.get("logger");
    t && (e ? typeof t.enableLevel == "function" && (t.enableLevel("debug"), t.enableLevel("trace")) : typeof t.disableLevel == "function" && (t.disableLevel("debug"), t.disableLevel("trace")));
  } catch {
  }
}
function yE() {
  typeof window > "u" || (window.__debug = {
    log: kt,
    measure: Qs,
    measureAsync: Xs,
    state: Lr,
    enable: li,
    disable: ui,
    toggle: za,
    enableModule: Js,
    disableModule: Zs
  });
}
function AE() {
  typeof window > "u" || delete window.__debug;
}
function Ld() {
  return {
    moduleId: oi,
    version: Ga,
    state: Lr(),
    levels: Object.keys(Cn),
    controlledFlags: Ks,
    portsInitialized: si.isInitialized(),
    improvements: ["#20-UnifiedDebugMode"]
  };
}
function _d() {
  return ue({
    status: B.HEALTHY,
    moduleId: oi,
    version: Ga,
    details: {
      enabled: le.enabled,
      level: le.level,
      portsInitialized: si.isInitialized()
    }
  });
}
function Nd(e) {
  return si.inject(e);
}
function Md() {
  return si.snapshot();
}
var SE = {
  VERSION: Ga,
  MODULE_ID: oi,
  DEBUG_LEVELS: Cn,
  enable: li,
  disable: ui,
  toggle: za,
  isEnabled: qs,
  getState: Lr,
  enableModule: Js,
  disableModule: Zs,
  isModuleEnabled: wd,
  log: kt,
  measure: Qs,
  measureAsync: Xs,
  info: Ld,
  healthCheck: _d,
  injectPorts: Nd,
  getPorts: Md
};
const OE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: oi,
  VERSION: Ga,
  default: SE,
  disable: ui,
  disableModule: Zs,
  enable: li,
  enableModule: Js,
  getPorts: Md,
  getState: Lr,
  healthCheck: _d,
  info: Ld,
  injectPorts: Nd,
  isEnabled: qs,
  isModuleEnabled: wd,
  log: kt,
  measure: Qs,
  measureAsync: Xs,
  toggle: za
}, Symbol.toStringTag, { value: "Module" }));
lg();
Rp();
var jt = null;
function el(e) {
  e === void 0 && (e = {});
  var t = ug(e), r = Xn();
  r.valid || console.error("[bootstrap-v2] Boot Manifest validation failed", r.errors);
  try {
    na(Z);
  } catch (b) {
    console.warn("[bootstrap-v2] Failed to store manifest hash", b.message);
  }
  var n = ip(), i = Wm({ prefix: "bootstrap-v2", debug: t.debug }), o = qm({ namespace: t.telemetry.namespace, enabled: t.telemetry.enabled }), l = ep({ namespace: "bootstrap-v2" }), a = np();
  typeof window < "u" && (window.Core = window.Core || {}, window.Core.windowAdapter = n);
  var s = { logger: i, telemetry: o, eventBusAdapter: l, readyFlagsAdapter: a, windowAdapter: n };
  Vd(function() {
    return n && n.get ? n.get("EventBus") : null;
  });
  try {
    Vt.injectPorts({
      eventBus: l,
      telemetry: o,
      logger: i
    }), Vt.init({ healthCheckInterval: 6e4 }), i.debug("GovernanceTelemetryBridge initialized");
  } catch (b) {
    i.warn("Failed to initialize GovernanceTelemetryBridge", { error: b.message });
  }
  typeof window < "u" && (window.Core = window.Core || {}, window.Core.strictMode = {
    isStrict: de,
    getViolations: jd,
    healthCheck: Yd,
    recordViolation: Sn,
    version: Va
  }, window.Core.governanceBridge = {
    healthCheck: Vt.healthCheck,
    info: Vt.info,
    emitComplianceReport: Vt.emitComplianceReport,
    emitViolationSummary: Vt.emitViolationSummary,
    version: Vt.VERSION
  }, i.debug("window.Core.strictMode and window.Core.governanceBridge exposed"));
  var u = zm(), c = xm(s), d = { value: Oc() }, f = kg({
    windowAdapter: n,
    logger: i,
    // @ts-expect-error strict migration — TS2322
    eventBus: n && n.get ? n.get("EventBus") : null
  });
  t.otel && t.otel.enabled && ks({
    enabled: !0,
    endpoint: t.otel.endpoint,
    serviceName: t.otel.serviceName || "bootstrap-v2"
  });
  try {
    _s({
      networkInfo: He()
    });
  } catch {
  }
  var g = Tp({
    onTimeout: function(b) {
      i.error("GLOBAL TIMEOUT - Boot exceeded maximum time", b), o.error("boot-global-timeout", b), l.emit(Ot.TIMEOUT, b), we && Ra("Timeout: " + b.timeoutMs + "ms"), Bi({ error: new Error("Global timeout"), phaseId: "global" });
    },
    onWarning: function(b) {
      i.warn("Boot is taking longer than expected", b), o.track("boot-timeout-warning", b), l.emit(Ot.TIMEOUT_WARNING, b), we && vs(b.elapsed, go.timeoutMs);
    },
    loggerAdapter: i
  }), h = [], p = [], A = { value: !1 }, T = Xp(t, d.value), S = c.getHealthAggregator(), L = tE(u, S, i), H = rE(S), E = c.on(ke.PHASE_START, L);
  typeof E == "function" && p.push(E), h.push({ event: "PHASE_START", handler: "phaseStartHandler", registeredAt: Date.now(), longLived: !0 });
  var m = c.on(ke.PHASE_COMPLETE, H);
  typeof m == "function" && p.push(m), h.push({ event: "PHASE_COMPLETE", handler: "phaseCompleteHandler", registeredAt: Date.now(), longLived: !0 }), i.info("Bootstrap-V2 created (Sprint 7 + Enterprise Strict)", {
    version: Dn,
    phases: eE(T),
    debug: t.debug,
    manifestVersion: Z.version,
    manifestValid: r.valid,
    enabledFeatures: Hc(),
    kernelIntegrated: !0,
    modularArchitecture: !0,
    persistenceEnabled: !0,
    // Sprint 7 info
    dynamicTimeoutEnabled: wa(),
    networkQuality: He().quality,
    otelEnabled: !!(t.otel && t.otel.enabled),
    // Enterprise Strict Mode
    strictMode: de(),
    strictModeVersion: Va
  });
  var v = sE({
    config: t,
    orchestrator: c,
    stateMachine: u,
    kernel: f,
    globalTimeout: g,
    loggerAdapter: i,
    telemetryAdapter: o,
    eventBusAdapter: l,
    degradationNotifier: we,
    phases: T,
    onPeriodicHealthStart: function(b) {
      if (!A.value) {
        var P = lE(b, i, l, we);
        P.success && (A.value = !0);
      }
    },
    // Sprint 5: Hook para persistir resultado do boot
    onBootComplete: function(b) {
      try {
        Ys(b), Ws(b), Wd(), t.otel && t.otel.enabled && Rr().catch(function() {
        });
      } catch (P) {
        i.warn("Failed to persist boot result", { error: P.message });
      }
    }
  }), w = {
    config: t,
    orchestrator: c,
    stateMachine: u,
    kernel: f,
    globalTimeout: g,
    degradationNotifier: we,
    bootExecutor: v,
    listeners: h,
    cleanups: p
  }, y = cE(w), R = dE(w), O = fE({
    orchestrator: c,
    stateMachine: u,
    kernel: f,
    globalTimeout: g,
    degradationNotifier: we,
    loggerAdapter: i,
    bootExecutor: v,
    cleanups: p,
    listeners: h,
    dependencyGraphRef: d,
    periodicHealthStartedRef: A
  });
  return {
    // Core
    boot: function() {
      return v.execute();
    },
    getState: function() {
      return u.getState();
    },
    isReady: function() {
      return u.isReady();
    },
    getResult: function() {
      return v.getResult();
    },
    reset: O.reset,
    resetBootLoopTracker: O.resetBootLoopTracker,
    healthCheck: y,
    info: R,
    // Context
    getContext: function() {
      return c.getBootContext();
    },
    getContextSnapshot: function() {
      var b = c.getBootContext();
      return b ? b.getSnapshot() : null;
    },
    getHealthAggregator: function() {
      return c.getHealthAggregator();
    },
    getHealthStatus: function() {
      var b = c.getHealthAggregator();
      return b ? b.calculate() : null;
    },
    getManifest: function() {
      return JSON.parse(JSON.stringify(Z));
    },
    getDependencyGraph: function() {
      return d.value;
    },
    getFeatureFlags: dg,
    isFeatureEnabled: cg,
    // Kernel
    getKernel: function() {
      return f;
    },
    getStateMachine: function() {
      return u;
    },
    // Sprint 2: Robust
    getBootLoopStatus: function() {
      return Fs();
    },
    getGlobalTimeoutStatus: function() {
      return g ? g.getStatus() : null;
    },
    // Sprint 3: Observability
    getPeriodicHealthStatus: function() {
      var b = c.getHealthAggregator();
      return b && b.getPeriodicHistory ? b.getPeriodicHistory() : { running: !1, checkCount: 0, history: [] };
    },
    getMemoryMetrics: function() {
      var b = c.getHealthAggregator();
      return b && b.getMemoryMetrics ? b.getMemoryMetrics() : null;
    },
    getDegradationNotifier: function() {
      return we;
    },
    // Sprint 5: #1 Persistência
    getCurrentBoot: ii,
    getLastSuccessfulBoot: Fa,
    hasRecentValidBoot: js,
    // Sprint 5: #4 Histórico
    getBootHistory: tn,
    clearBootHistory: $s,
    analyzeBootHistory: ai,
    // Sprint 5: #20 Debug Mode
    enableDebug: li,
    disableDebug: ui,
    toggleDebug: za,
    isDebugEnabled: qs,
    getDebugState: Lr,
    // =========================================================================
    // Sprint 7: Novos Módulos Integrados
    // =========================================================================
    // Sprint 7A #2: Network & Dynamic Timeout
    getNetworkInfo: function() {
      return He();
    },
    getNetworkQuality: function() {
      return He().quality;
    },
    isNetworkPoor: function() {
      return Qr();
    },
    getAllAdjustedTimeouts: Sc,
    // Sprint 7A #7: Manifest Integrity
    validateManifestIntegrity: function() {
      return Xr(Z);
    },
    wasManifestTampered: function() {
      return ia(Z);
    },
    getManifestIntegrityInfo: function() {
      return aa();
    },
    // Sprint 7B #9: Module Events & Metrics
    getModuleMetrics: function() {
      return Pn();
    },
    getModuleTimeline: function(b) {
      return ji(b);
    },
    getModulePerformance: function(b) {
      return Wi(b);
    },
    getAllModulePerformance: function() {
      return To();
    },
    // Sprint 7B #13: OpenTelemetry
    getOTelExportData: function() {
      return Hs();
    },
    flushOTelTraces: function() {
      return Rr();
    },
    getOTelInfo: function() {
      return xs();
    },
    // Sprint 7C #14: Lazy Loading
    loadDeferredPhases: function() {
      return { ok: !0, message: "deferred phases not implemented" };
    },
    isDeferredLoaded: function() {
      return !1;
    },
    getDeferredStatus: function() {
      return { ok: !0, loaded: !1, message: "deferred phases not implemented" };
    },
    getLazyLoaderInfo: function() {
      return ha();
    },
    // Sprint 7C #17: Boot Cancellation
    // @ts-expect-error strict migration — TS2345
    cancelBoot: function(b) {
      return pa(b);
    },
    canCancelBoot: function() {
      return wr();
    },
    isBootCancelled: function() {
      return Fn();
    },
    getCancellationState: function() {
      return Gn();
    },
    // Sprint 7D #28: Root Cause Analysis
    analyzeError: function(b, P) {
      return Bi(Object.assign({ error: b }, P || {}));
    },
    getErrorTrends: function() {
      return ei();
    },
    getRootCauseSuggestions: function() {
      return Ms();
    },
    // Sprint 7D #29: Partial Reinit
    // @ts-expect-error strict migration — TS2345
    reinitPhase: function(b, P) {
      return Yn(b, P);
    },
    // @ts-expect-error strict migration — TS2345
    reinitPhases: function(b, P) {
      return jn(b, P);
    },
    supportsReinit: function(b) {
      return Vn(b);
    },
    getReinitInfo: function() {
      return Oa();
    },
    // Sprint 7: Módulos Diretos (namespace access)
    NetworkDetector: mu,
    ManifestIntegrity: Iu,
    ModuleEvents: au,
    LazyLoader: Bu,
    BootCancellation: ju,
    RootCauseAnalyzer: fp,
    PartialReinit: Qu,
    OTelExporter: pp,
    // Módulos Sprint 5
    BootPersistence: EE,
    DebugMode: OE,
    // Singleton
    getSingletonState: function() {
      return typeof window < "u" ? window.__BOOTSTRAP_V2_STATE__ : null;
    },
    // Meta
    VERSION: Dn,
    MODULE_ID: en,
    BOOT_LOOP_CONFIG: Ue,
    GLOBAL_TIMEOUT_CONFIG: go,
    PERIODIC_HEALTH_CONFIG: Lt,
    // Enterprise Strict Mode
    isStrictMode: de,
    STRICT_MODE_VERSION: Va
  };
}
function Pd(e) {
  e === void 0 && (e = {});
  var t = typeof window < "u" ? window.__BOOTSTRAP_V2_STATE__ : null;
  return t && (t.state === Me.RUNNING || t.state === Me.COMPLETED) && jt || jt || (jt = el(e)), jt;
}
function kd() {
  jt && jt.reset(), jt = null;
  try {
    bo(), Ps(), Us(), (void 0)(), va();
  } catch {
  }
  try {
    Vt.shutdown();
  } catch {
  }
  typeof window < "u" && window.Core && delete window.Core.windowAdapter;
}
var IE = {
  createBootstrapV2: el,
  getInstance: Pd,
  resetInstance: kd,
  VERSION: Dn,
  MODULE_ID: en,
  SINGLETON_STATES: Me,
  BOOT_MANIFEST: Z,
  KERNEL_MODES: k,
  KERNEL_EVENTS: Oe
};
const TE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  BOOT_MANIFEST: Z,
  KERNEL_EVENTS: Oe,
  KERNEL_MODES: k,
  SINGLETON_STATES: Me,
  createBootstrapV2: el,
  default: IE,
  getInstance: Pd,
  resetInstance: kd
}, Symbol.toStringTag, { value: "Module" }));
var tl = "1.0.0-LOTTIE-TRANSITION", rl = "bootstrap-v2.loader.stages.panel-loading-transition", bE = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js", RE = "/assets/animacoes/Loading_Cube.json", tr = "dsd-panel-lottie-loading", Hd = 300, wE = 80, mn = null, yn = null, xr = null, Li = null, An = !1, xl = !1, Er = null;
function Bd() {
  return typeof lottie < "u" ? Promise.resolve(!0) : new Promise(function(e) {
    var t = document.querySelector('script[src*="lottie-web"]');
    if (t) {
      if (typeof lottie < "u") {
        e(!0);
        return;
      }
      t.addEventListener("load", function() {
        e(!0);
      }), setTimeout(function() {
        e(typeof lottie < "u");
      }, 3e3);
      return;
    }
    var r = document.createElement("script");
    r.src = bE, r.onload = function() {
      e(!0);
    }, r.onerror = function() {
      e(!1);
    }, document.head.appendChild(r);
  });
}
function DE() {
  if (!xl) {
    var e = document.createElement("style");
    e.id = "dsd-panel-lottie-transition-styles", e.textContent = [
      "." + tr + " {",
      "  display: flex;",
      "  align-items: center;",
      "  justify-content: center;",
      "  width: 100%;",
      "  height: 100%;",
      "  min-height: 300px;",
      "  position: absolute;",
      "  top: 0; left: 0; right: 0; bottom: 0;",
      "  z-index: 50;",
      "  background: var(--dsd-bg-primary, #0a0c14);",
      "  opacity: 1;",
      "  transition: opacity " + Hd + "ms ease;",
      "  pointer-events: none;",
      "}",
      "." + tr + "__anim {",
      "  width: 120px;",
      "  height: 120px;",
      "}",
      "." + tr + "--hiding {",
      "  opacity: 0;",
      "}"
    ].join(`
`), document.head.appendChild(e), xl = !0;
  }
}
function Ud() {
  var e = document.getElementById("container-main");
  if (e) {
    var t = e.querySelector(".dsd-container__content");
    if (t) return t;
  }
  var r = document.querySelector('#shell-main-region, [data-region="main"], #main');
  if (r) {
    var n = r.querySelector(".dsd-container__content");
    if (n) return n;
  }
  return null;
}
function Fl() {
  if (!An) {
    var e = Ud();
    if (e) {
      An = !0, Er && (clearTimeout(Er), Er = null), DE();
      var t = getComputedStyle(e).position;
      (t === "static" || t === "") && (e.style.position = "relative");
      var r = document.createElement("div");
      r.className = tr, r.setAttribute("data-lottie-transition", "active");
      var n = document.createElement("div");
      n.className = tr + "__anim", r.appendChild(n), e.appendChild(r), CE(e), Bd().then(function(i) {
        if (!(!i || typeof lottie > "u") && !(!r.parentNode || !An))
          try {
            Li = lottie.loadAnimation({
              container: n,
              renderer: "svg",
              loop: !0,
              autoplay: !0,
              path: RE
            });
          } catch {
          }
      }), Er = setTimeout(function() {
        nl();
      }, 8e3);
    }
  }
}
function nl() {
  if (An) {
    An = !1, Er && (clearTimeout(Er), Er = null), il();
    var e = Ud();
    if (e) {
      var t = e.querySelector("." + tr);
      if (t) {
        if (Li) {
          try {
            Li.destroy();
          } catch {
          }
          Li = null;
        }
        t.classList.add(tr + "--hiding"), setTimeout(function() {
          t.parentNode && t.parentNode.removeChild(t);
        }, Hd + 50);
      }
    }
  }
}
function CE(e) {
  il(), yn = new MutationObserver(function(t) {
    for (var r = 0; r < t.length; r++)
      for (var n = t[r].addedNodes, i = 0; i < n.length; i++) {
        var o = n[i];
        if (o.nodeType === 1 && !o.classList.contains(tr)) {
          setTimeout(function() {
            nl();
          }, wE);
          return;
        }
      }
  }), yn.observe(e, { childList: !0 });
}
function il() {
  yn && (yn.disconnect(), yn = null);
}
function LE(e) {
  e && (mn = e, e.on ? xr = e.on("router.route.changed", function() {
    Fl();
  }) : e.subscribe && (xr = e.subscribe("router.route.changed", function() {
    Fl();
  })));
}
function xd(e) {
  return e ? (LE(e), Bd(), { ok: !0, version: tl, moduleId: rl }) : { ok: !1, reason: "No EventBus" };
}
function Fd() {
  nl(), xr && typeof xr == "function" ? xr() : mn && mn.off && mn.off("router.route.changed"), il(), mn = null, xr = null;
}
var _E = { init: xd, destroy: Fd, VERSION: tl, MODULE_ID: rl };
const NE = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: rl,
  VERSION: tl,
  default: _E,
  destroy: Fd,
  init: xd
}, Symbol.toStringTag, { value: "Module" }));
export {
  Or as MODULE_ID,
  rr as VERSION,
  ev as default,
  Nh as getBootPromise,
  zl as getBootResult,
  yo as getBootstrapInstance,
  Wf as getKernel,
  _i as getPreBootOrchestrator,
  zi as getPreBootResult,
  Kf as healthCheck,
  $f as info,
  _h as isBootStarted,
  gc as startBootstrap
};
