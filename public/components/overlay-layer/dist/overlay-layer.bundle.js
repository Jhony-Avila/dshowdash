import { isStrict as Ds } from "/core/runtime/enterprise/strict-mode.js";
import { createUiPorts as Lo, createCorePorts as Rs } from "/core/runtime/ports-profiles.js";
import { OVERLAY_EVENTS as ye, OVERLAY_INTENTS as Eo, KERNEL_RUNTIME_EVENTS as ko } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { createLogger as An } from "/assets/js/core/logger-global/dist/logger-global.bundle.js";
import { OVERLAY_EVENT_NAMES as Ls } from "/core/runtime/constants/event-names.js";
const $s = "overlay-layer.telemetry.tracker", xs = Lo({ moduleId: $s });
function Oo(e) {
  return xs.get(e);
}
const pn = "overlay-layer", Ao = 100;
let At = [];
const $o = Object.freeze({
  LIFECYCLE_INIT: "overlay.lifecycle.init",
  LIFECYCLE_READY: "overlay.lifecycle.ready",
  LIFECYCLE_DESTROY: "overlay.lifecycle.destroy",
  OPEN: Eo.OPEN,
  CLOSE: Eo.CLOSE,
  ERROR_INIT: ye.ERROR,
  ERROR_RENDER: "overlay.error.render",
  ERROR_CLOSE: "overlay.error.close",
  STACK_PUSH: "overlay.stack.push",
  STACK_POP: "overlay.stack.pop"
});
function Ts(e, t) {
  t || (t = {});
  const n = { id: `${pn}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, namespace: pn, type: e, data: t, timestamp: Date.now() };
  return At.push(n), At.length > Ao && (At = At.slice(-Ao)), n.timestamp, n;
}
function zt(e, t) {
  t || (t = {});
  const n = Ts(e, t);
  e.indexOf("stack");
  const o = Oo("telemetry");
  if (o && o.track)
    try {
      o.track(`${pn}.${e.replace(/[:.]/g, ".")}`, t);
    } catch {
    }
  const r = Oo("eventBus");
  if (r && r.emit)
    try {
      r.emit(e, t);
    } catch {
    }
  return n;
}
function _s(e, t, n) {
  return zt($o.OPEN, { id: e, type: t, scope: n });
}
function Ns(e, t) {
  return zt($o.CLOSE, { id: e, reason: t });
}
const Ms = ["modal", "drawer", "dialog", "loading", "toast", "sheet"], Ps = ["global", "page", "component"];
function Hs(e) {
  const t = [];
  return e ? (e.id || t.push("id is required"), e.type ? Ms.includes(e.type) || t.push(`invalid type: ${e.type}`) : t.push("type is required"), e.scope && !Ps.includes(e.scope) && t.push(`invalid scope: ${e.scope}`), t.length > 0 ? { valid: !1, errors: t } : { valid: !0, normalized: { id: e.id, type: e.type, scope: e.scope || "global", content: e.content || null, config: e.config || {}, meta: e.meta || {} } }) : (t.push("descriptor is required"), { valid: !1, errors: t });
}
const Us = "overlay-layer-container";
function Bs() {
  return document.getElementById(Us);
}
function zs() {
  return !!Bs();
}
const jt = "2.0.0-ENTERPRISE-AAA", In = "overlay-layer-store";
let w = { stack: [], overlays: {}, config: { maxStack: 10 } }, Ze = [];
function js() {
  return { ...w };
}
function Fs() {
  return [...w.stack];
}
function qs(e) {
  return w.overlays[e] || null;
}
function Gs() {
  return { ...w.overlays };
}
function xo() {
  return { ...w.config };
}
function Vs(e) {
  return e != null && e.id ? (w.overlays[e.id] = e, w.stack.includes(e.id) || w.stack.push(e.id), Ft(), !0) : !1;
}
function Ks(e) {
  return w.overlays[e] ? (delete w.overlays[e], w.stack = w.stack.filter((t) => t !== e), Ft(), !0) : !1;
}
function Ws(e, t) {
  return w.overlays[e] ? (w.overlays[e] = { ...w.overlays[e], runtime: { ...w.overlays[e].runtime, ...t } }, Ft(), !0) : !1;
}
function Ys() {
  w = { stack: [], overlays: {}, config: w.config }, Ft();
}
function Qs(e) {
  return typeof e == "function" && Ze.push(e), () => {
    Ze = Ze.filter((t) => t !== e);
  };
}
function Ft() {
  Ze.forEach((e) => {
    try {
      e(w);
    } catch {
    }
  });
}
function Xs() {
  const e = { hasState: !!w, stackHealthy: w.stack.length < w.config.maxStack, noOrphans: w.stack.every((o) => !!w.overlays[o]) }, t = Object.values(e).filter(Boolean).length, n = Object.keys(e).length;
  return { status: t === n ? "HEALTHY" : t >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${t}/${n}`, checks: e, stackSize: w.stack.length, overlayCount: Object.keys(w.overlays).length, version: jt, moduleId: In, timestamp: Date.now() };
}
function Js() {
  return { moduleId: In, version: jt, stackSize: w.stack.length, overlayCount: Object.keys(w.overlays).length, subscriberCount: Ze.length, config: xo(), timestamp: Date.now() };
}
const m = { getState: js, getStack: Fs, getOverlay: qs, getOverlays: Gs, getConfig: xo, addOverlay: Vs, removeOverlay: Ks, updateOverlayRuntime: Ws, clear: Ys, subscribe: Qs, healthCheck: Xs, info: Js, VERSION: jt, MODULE_ID: In }, je = "1.0.0-ELEVATION", Ne = "overlay-kernel:runtime-integration", I = {
  initialized: !1,
  runtimeContext: null,
  applicationKernel: null,
  eventBus: null,
  permissionsGuard: null,
  healthAggregator: null,
  currentMode: "INITIALIZING",
  lastModeChange: null,
  subscriptions: [],
  metrics: {
    modeChanges: 0,
    healthReports: 0,
    degradationEvents: 0
  }
};
function xt() {
  return I.initialized;
}
function Zs(e) {
  I.initialized = !0;
}
function ea(e) {
  I.runtimeContext = e;
}
function et() {
  return I.applicationKernel;
}
function ta(e) {
  I.applicationKernel = e;
}
function pt() {
  return I.eventBus;
}
function na(e) {
  I.eventBus = e;
}
function oa(e) {
  I.permissionsGuard = e;
}
function gn() {
  return I.healthAggregator;
}
function ra(e) {
  I.healthAggregator = e;
}
function ee() {
  return I.currentMode;
}
function qt(e) {
  I.currentMode = e;
}
function To(e) {
  I.lastModeChange = e;
}
function _o() {
  return I.subscriptions;
}
function Ae(e) {
  I.subscriptions.push(e);
}
function sa() {
  I.subscriptions = [];
}
function aa() {
  return Object.assign({}, I.metrics);
}
function wn(e) {
  I.metrics[e] !== void 0 && I.metrics[e]++;
}
function ia() {
  I.initialized = !1, I.runtimeContext = null, I.applicationKernel = null, I.eventBus = null, I.permissionsGuard = null, I.healthAggregator = null, I.currentMode = "INITIALIZING", I.lastModeChange = null, I.subscriptions = [];
}
const Gt = "1.0.0-ELEVATION", No = "overlay-kernel:manifest", j = Object.freeze({
  CRITICAL: 100,
  // Login modal, error boundaries
  HIGH: 75,
  // Confirmações críticas, alerts
  NORMAL: 50,
  // Modais padrão, drawers
  LOW: 25,
  // Toasts, tooltips
  BACKGROUND: 10
  // Preloaders, loading states
}), he = Object.freeze({
  ALL: ["NORMAL", "DEGRADED", "MAINTENANCE", "RECOVERY"],
  NORMAL_ONLY: ["NORMAL"],
  NORMAL_DEGRADED: ["NORMAL", "DEGRADED"],
  CRITICAL_ALWAYS: ["NORMAL", "DEGRADED", "MAINTENANCE", "RECOVERY", "FAILED"]
}), B = Object.freeze({
  NONE: "none",
  // Sem verificação (público)
  AUTH_REQUIRED: "auth:required",
  // Requer autenticação
  ROLE_ADMIN: "role:admin",
  // Requer role admin
  ROLE_USER: "role:user",
  // Requer role user
  CAPABILITY: "capability:check",
  // Verifica capability específica
  CUSTOM: "custom:gate"
  // Gate customizado
}), ke = Object.freeze({
  version: Gt,
  manifestVersion: "1.0.0",
  // Configurações globais
  global: {
    defaultPriority: j.NORMAL,
    defaultBlocking: !1,
    defaultPersist: !1,
    maxStackDepth: 10,
    autoCloseOnNavigation: !0,
    respectReducedMotion: !0
  },
  // Definição declarativa dos tipos de overlay
  types: [
    {
      id: "login-modal",
      type: "modal",
      priority: j.CRITICAL,
      blocking: !0,
      persist: !0,
      requiresAuth: !1,
      permissionTrigger: B.NONE,
      allowedModes: he.CRITICAL_ALWAYS,
      healthWeight: 10,
      closeOnEscape: !1,
      closeOnBackdrop: !1,
      description: "Modal de autenticação - sempre permitido"
    },
    {
      id: "error-modal",
      type: "modal",
      priority: j.CRITICAL,
      blocking: !0,
      persist: !0,
      requiresAuth: !1,
      permissionTrigger: B.NONE,
      allowedModes: he.CRITICAL_ALWAYS,
      healthWeight: 10,
      closeOnEscape: !0,
      closeOnBackdrop: !1,
      description: "Modal de erro crítico"
    },
    {
      id: "confirmation-modal",
      type: "modal",
      priority: j.HIGH,
      blocking: !0,
      persist: !1,
      requiresAuth: !0,
      permissionTrigger: B.AUTH_REQUIRED,
      allowedModes: he.NORMAL_DEGRADED,
      healthWeight: 5,
      closeOnEscape: !0,
      closeOnBackdrop: !1,
      description: "Modal de confirmação de ações"
    },
    {
      id: "standard-modal",
      type: "modal",
      priority: j.NORMAL,
      blocking: !0,
      persist: !1,
      requiresAuth: !0,
      permissionTrigger: B.AUTH_REQUIRED,
      allowedModes: he.NORMAL_DEGRADED,
      healthWeight: 3,
      closeOnEscape: !0,
      closeOnBackdrop: !0,
      description: "Modal padrão da aplicação"
    },
    {
      id: "drawer",
      type: "drawer",
      priority: j.NORMAL,
      blocking: !1,
      persist: !1,
      requiresAuth: !0,
      permissionTrigger: B.AUTH_REQUIRED,
      allowedModes: he.NORMAL_ONLY,
      healthWeight: 2,
      closeOnEscape: !0,
      closeOnBackdrop: !0,
      description: "Drawer lateral"
    },
    {
      id: "admin-drawer",
      type: "drawer",
      priority: j.NORMAL,
      blocking: !1,
      persist: !1,
      requiresAuth: !0,
      permissionTrigger: B.ROLE_ADMIN,
      allowedModes: he.NORMAL_ONLY,
      healthWeight: 2,
      description: "Drawer administrativo"
    },
    {
      id: "toast",
      type: "toast",
      priority: j.LOW,
      blocking: !1,
      persist: !1,
      requiresAuth: !1,
      permissionTrigger: B.NONE,
      allowedModes: he.ALL,
      healthWeight: 1,
      autoClose: !0,
      autoCloseDelay: 5e3,
      description: "Notificação toast"
    },
    {
      id: "loading",
      type: "loading",
      priority: j.BACKGROUND,
      blocking: !0,
      persist: !1,
      requiresAuth: !1,
      permissionTrigger: B.NONE,
      allowedModes: he.ALL,
      healthWeight: 1,
      description: "Overlay de carregamento"
    },
    {
      id: "preloader",
      type: "loading",
      priority: j.BACKGROUND,
      blocking: !0,
      persist: !1,
      requiresAuth: !1,
      permissionTrigger: B.NONE,
      allowedModes: he.CRITICAL_ALWAYS,
      healthWeight: 1,
      description: "Preloader inicial da aplicação"
    }
  ]
});
function Ye(e) {
  const t = ke.types;
  for (let n = 0; n < t.length; n++)
    if (t[n].id === e) return t[n];
  return null;
}
function Mo() {
  const e = ke.types, t = [];
  for (let n = 0; n < e.length; n++)
    e[n].priority >= j.CRITICAL && t.push(e[n]);
  return t;
}
function la(e, t) {
  const n = Ye(e);
  return n ? n.allowedModes ? n.allowedModes.indexOf(t) !== -1 : !0 : !1;
}
function ca(e) {
  const t = Ye(e);
  return t ? t.requiresAuth === !0 : !0;
}
function ua(e) {
  const t = Ye(e);
  return t ? t.permissionTrigger : B.AUTH_REQUIRED;
}
function Po() {
  const e = ke.types;
  let t = 0;
  for (let n = 0; n < e.length; n++)
    t += e[n].healthWeight || 0;
  return t;
}
function da() {
  const e = ke.types, t = [];
  for (let n = 0; n < e.length; n++)
    t.push(e[n].id);
  return t;
}
function fa() {
  return Object.assign({}, ke.global);
}
function Ho() {
  const e = [], t = ke.types, n = {};
  for (let o = 0; o < t.length; o++) {
    const r = t[o];
    r.id || e.push(`Type at index ${o} missing id`), n[r.id] && e.push(`Duplicate type id: ${r.id}`), n[r.id] = !0, r.type || e.push(`Type ${r.id} missing type`), typeof r.priority != "number" && e.push(`Type ${r.id} missing priority`);
  }
  return {
    valid: e.length === 0,
    errors: e,
    typeCount: t.length,
    criticalCount: Mo().length,
    totalHealthWeight: Po()
  };
}
function pa() {
  const e = Ho(), t = {
    manifestValid: e.valid,
    hasTypes: ke.types.length > 0,
    hasCriticalTypes: Mo().length > 0,
    globalConfigValid: !!ke.global
  };
  let n = 0;
  const o = Object.keys(t);
  for (let r = 0; r < o.length; r++)
    t[o[r]] && n++;
  return {
    status: n === o.length ? "HEALTHY" : "DEGRADED",
    score: n,
    maxScore: o.length,
    scoreDisplay: `${n}/${o.length}`,
    checks: t,
    validation: e,
    moduleId: No,
    version: Gt,
    timestamp: Date.now()
  };
}
function ga() {
  const e = Ho();
  return {
    moduleId: No,
    version: Gt,
    manifestVersion: ke.manifestVersion,
    typeCount: e.typeCount,
    criticalCount: e.criticalCount,
    totalHealthWeight: e.totalHealthWeight,
    typeIds: da(),
    valid: e.valid,
    globalConfig: fa(),
    timestamp: Date.now()
  };
}
const Cn = "1.0.0-ELEVATION", Uo = "overlay-kernel:degradation-policy", E = Object.freeze({
  ALLOW: "allow",
  // Permite abertura normal
  BLOCK: "block",
  // Bloqueia completamente
  QUEUE: "queue",
  // Enfileira para quando sair do modo
  DOWNGRADE: "downgrade",
  // Abre com funcionalidade reduzida
  FORCE_CLOSE: "force-close"
  // Fecha overlays existentes deste tipo
}), te = Object.freeze({
  // Modo NORMAL - tudo permitido
  NORMAL: {
    description: "Operação normal - todos os overlays permitidos",
    defaultAction: E.ALLOW,
    rules: []
  },
  // Modo DEGRADED - apenas essenciais
  DEGRADED: {
    description: "Modo degradado - apenas overlays essenciais e críticos",
    defaultAction: E.BLOCK,
    rules: [
      { priority: { min: j.CRITICAL }, action: E.ALLOW },
      { priority: { min: j.HIGH }, action: E.ALLOW },
      { type: "toast", action: E.ALLOW },
      { type: "loading", action: E.ALLOW },
      { typeId: "login-modal", action: E.ALLOW },
      { typeId: "error-modal", action: E.ALLOW },
      { typeId: "confirmation-modal", action: E.ALLOW }
    ],
    forceClose: [
      { priority: { max: j.LOW }, reason: "degraded-mode" }
    ]
  },
  // Modo MAINTENANCE - apenas informativos e login
  MAINTENANCE: {
    description: "Modo manutenção - apenas toasts informativos e login",
    defaultAction: E.BLOCK,
    rules: [
      { typeId: "login-modal", action: E.ALLOW },
      { typeId: "error-modal", action: E.ALLOW },
      { type: "toast", action: E.ALLOW },
      { type: "loading", action: E.ALLOW }
    ],
    forceClose: [
      { type: "drawer", reason: "maintenance-mode" },
      { type: "modal", except: ["login-modal", "error-modal"], reason: "maintenance-mode" }
    ],
    message: "Sistema em manutenção. Funcionalidades limitadas."
  },
  // Modo RECOVERY - mínimo necessário
  RECOVERY: {
    description: "Modo recuperação - apenas críticos",
    defaultAction: E.BLOCK,
    rules: [
      { priority: { min: j.CRITICAL }, action: E.ALLOW },
      { typeId: "login-modal", action: E.ALLOW },
      { typeId: "error-modal", action: E.ALLOW },
      { type: "toast", action: E.ALLOW }
    ],
    forceClose: [
      { priority: { max: j.NORMAL }, reason: "recovery-mode" }
    ]
  },
  // Modo FAILED - apenas erros e login
  FAILED: {
    description: "Modo falha - apenas modais de erro e login",
    defaultAction: E.BLOCK,
    rules: [
      { typeId: "login-modal", action: E.ALLOW },
      { typeId: "error-modal", action: E.ALLOW },
      { type: "toast", action: E.ALLOW, downgrade: { autoCloseDelay: 3e3 } }
    ],
    forceClose: [
      { all: !0, except: ["login-modal", "error-modal"], reason: "system-failed" }
    ],
    message: "Sistema em estado de falha. Contate o suporte."
  },
  // Modo INITIALIZING - apenas preloader e erros
  INITIALIZING: {
    description: "Inicializando - apenas preloader e erros críticos",
    defaultAction: E.QUEUE,
    rules: [
      { typeId: "preloader", action: E.ALLOW },
      { typeId: "error-modal", action: E.ALLOW },
      { type: "loading", action: E.ALLOW }
    ]
  }
});
function Bo(e, t, n) {
  return e.typeId && e.typeId === t ? !0 : e.type && n && n.type === e.type ? !(e.except && e.except.indexOf(t) !== -1) : e.priority && e.priority.min !== void 0 && n && n.priority >= e.priority.min || e.priority && e.priority.max !== void 0 && n && n.priority <= e.priority.max ? !0 : e.all === !0 ? !(e.except && e.except.indexOf(t) !== -1) : !1;
}
function zo(e, t) {
  const n = te[e];
  if (!n)
    return {
      action: E.ALLOW,
      reason: "unknown-mode-fallback",
      mode: e
    };
  const o = Ye(t), r = n.rules || [];
  for (let s = 0; s < r.length; s++) {
    const a = r[s];
    if (Bo(a, t, o))
      return {
        action: a.action,
        reason: "rule-match",
        rule: a,
        mode: e,
        downgrade: a.downgrade || null
      };
  }
  return {
    action: n.defaultAction,
    reason: "default-policy",
    mode: e,
    message: n.message || null
  };
}
function ma(e, t) {
  const n = te[e];
  if (!n || !n.forceClose)
    return { shouldClose: !1 };
  const o = Ye(t), r = n.forceClose;
  for (let s = 0; s < r.length; s++) {
    const a = r[s];
    if (Bo(a, t, o))
      return {
        shouldClose: !0,
        reason: a.reason || "policy-force-close",
        rule: a
      };
  }
  return { shouldClose: !1 };
}
function ya(e, t) {
  const n = [];
  for (let o = 0; o < t.length; o++) {
    const r = t[o], s = r.typeId || r.id || r.type, a = ma(e, s);
    a.shouldClose && n.push({
      id: r.id || r.handle,
      typeId: s,
      reason: a.reason
    });
  }
  return n;
}
function ha(e) {
  return te[e] || null;
}
function va(e) {
  const t = te[e];
  if (!t) return [];
  const n = [], o = t.rules || [];
  for (let r = 0; r < o.length; r++)
    o[r].action === E.ALLOW && o[r].typeId && n.push(o[r].typeId);
  return n;
}
function ba(e) {
  const t = te[e];
  return t && t.message || null;
}
function Ea() {
  const e = Object.keys(te), t = {
    hasPolicies: e.length > 0,
    hasNormalMode: !!te.NORMAL,
    hasDegradedMode: !!te.DEGRADED,
    hasFailedMode: !!te.FAILED,
    allModesValid: !0
  };
  for (let r = 0; r < e.length; r++) {
    const s = te[e[r]];
    if (!s.defaultAction || !s.description) {
      t.allModesValid = !1;
      break;
    }
  }
  let n = 0;
  const o = Object.keys(t);
  for (let r = 0; r < o.length; r++)
    t[o[r]] && n++;
  return {
    status: n === o.length ? "HEALTHY" : "DEGRADED",
    score: n,
    maxScore: o.length,
    scoreDisplay: `${n}/${o.length}`,
    checks: t,
    modes: e,
    moduleId: Uo,
    version: Cn,
    timestamp: Date.now()
  };
}
function ka() {
  const e = Object.keys(te), t = {};
  for (let n = 0; n < e.length; n++) {
    const o = e[n], r = te[o];
    t[o] = {
      description: r.description,
      defaultAction: r.defaultAction,
      rulesCount: (r.rules || []).length,
      forceCloseRulesCount: (r.forceClose || []).length,
      hasMessage: !!r.message
    };
  }
  return {
    moduleId: Uo,
    version: Cn,
    modesCount: e.length,
    modes: t,
    actions: Object.keys(E),
    timestamp: Date.now()
  };
}
const Oa = An(Ne);
function Io(e, t) {
  const n = pt();
  n && n.emit && n.emit(e, Object.assign({
    source: Ne,
    timestamp: Date.now()
  }, t || {}));
}
function jo(e, t, n) {
  const o = {};
  Oa.debug(t, o);
}
function gt(e, t) {
  t = t || ee(), qt(e), To(Date.now()), wn("modeChanges"), jo("info", `Runtime mode changed: ${t} -> ${e}`), Io("overlay-kernel.mode-change", {
    newMode: e,
    previousMode: t,
    policy: ha(e)
  }), Aa(e), (e === "DEGRADED" || e === "MAINTENANCE" || e === "FAILED") && Io("overlay-kernel.degradation-active", {
    mode: e,
    message: ba(e),
    allowedTypes: va(e)
  });
}
function Aa(e) {
  if (typeof window > "u" || !window.OverlayKernel) return;
  const t = window.OverlayKernel.listStack();
  if (!t.ok || t.data.stack.length === 0) return;
  const n = ya(e, t.data.stack);
  for (let o = 0; o < n.length; o++) {
    const r = n[o];
    jo("info", `Force closing overlay due to mode change: ${r.id}`), window.OverlayKernel.close(r.id), wn("degradationEvents");
  }
}
const Vt = "2.2.0-STEP8", rt = "overlay-kernel:permission-gate";
function Le() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const e = window.Core.windowAdapter.get("RuntimeContext");
    if (e) return e;
  }
  return window.RuntimeContext || null;
}
const p = {
  initialized: !1,
  permissionsGuard: null,
  runtimeKernel: null,
  eventBus: null,
  metrics: {
    checks: 0,
    granted: 0,
    denied: 0,
    errors: 0
  },
  lastDenial: null
}, ve = Object.freeze({
  NOT_INITIALIZED: "gate:not-initialized",
  TYPE_NOT_FOUND: "type:not-found",
  MODE_NOT_ALLOWED: "mode:not-allowed",
  AUTH_REQUIRED: "auth:required",
  PERMISSION_DENIED: "permission:denied",
  CAPABILITY_MISSING: "capability:missing",
  RUNTIME_DEGRADED: "runtime:degraded",
  CUSTOM_GATE_DENIED: "custom:denied",
  UNKNOWN: "unknown"
});
function Sn(e, t) {
  p.eventBus && p.eventBus.emit && p.eventBus.emit(e, Object.assign({
    source: rt,
    timestamp: Date.now()
  }, t || {}));
}
function Ia() {
  const e = Le();
  if (e && e.getMode)
    try {
      return e.getMode();
    } catch {
    }
  return p.runtimeKernel && typeof p.runtimeKernel.getMode == "function" ? p.runtimeKernel.getMode() : "NORMAL";
}
function wa() {
  const e = Le();
  if (e && e.isAuthenticated)
    try {
      return e.isAuthenticated();
    } catch {
    }
  return p.permissionsGuard && typeof p.permissionsGuard.getUserLevel == "function" ? Je().isAuthenticated : !1;
}
function Je() {
  const e = Le();
  if (e)
    try {
      return {
        isAuthenticated: e.isAuthenticated(),
        level: e.getAuthLevel ? e.getAuthLevel() : 0,
        roles: [],
        capabilities: []
      };
    } catch {
    }
  if (typeof window < "u" && window.AuthState) {
    const t = window.AuthState.getState ? window.AuthState.getState() : window.AuthState;
    return {
      isAuthenticated: t.isAuthenticated || !1,
      roles: t.roles || [],
      capabilities: t.capabilities || [],
      level: t.level || 0
    };
  }
  return {
    isAuthenticated: !1,
    roles: [],
    capabilities: [],
    level: 0
  };
}
function Ie(e, t) {
  return p.metrics.denied++, p.lastDenial = {
    reason: e,
    details: t || null,
    timestamp: Date.now()
  }, Sn("overlay-permission.denied", { reason: e, details: t }), { allowed: !1, reason: e, details: t || null };
}
function cn(e) {
  return p.metrics.granted++, Sn("overlay-permission.granted", { typeId: e }), { allowed: !0, reason: null, details: null };
}
function Fo(e) {
  return e = e || {}, p.initialized ? { ok: !0, alreadyInitialized: !0 } : (p.permissionsGuard = e.permissionsGuard || null, p.runtimeKernel = e.runtimeKernel || null, p.eventBus = e.eventBus || null, p.initialized = !0, Sn("overlay-permission-gate.ready", { version: Vt }), {
    ok: !0,
    initialized: !0,
    hasPermissionsGuard: !!p.permissionsGuard,
    hasRuntimeKernel: !!p.runtimeKernel,
    hasRuntimeContext: !!Le()
  });
}
function Kt(e) {
  if (e = e || {}, p.metrics.checks++, !p.initialized)
    return console.debug(`[${rt}] Gate not initialized, allowing by default`), cn(e.typeId || "unknown");
  const t = e.typeId || e.trigger || e.overlayType;
  e.scope;
  const n = e.capability || null, o = Ye(t);
  if (!o && t)
    return console.debug(`[${rt}] Type not in manifest: ${t}, allowing`), cn(t);
  const r = Ia();
  if (o && !la(t, r))
    return Ie(ve.MODE_NOT_ALLOWED, {
      typeId: t,
      currentMode: r,
      allowedModes: o.allowedModes
    });
  if (o && ca(t) && !wa())
    return Ie(ve.AUTH_REQUIRED, { typeId: t });
  switch (o ? ua(t) : B.NONE) {
    case B.NONE:
      break;
    case B.AUTH_REQUIRED:
      break;
    case B.ROLE_ADMIN:
      const u = Je();
      if (!u.roles.includes("admin") && !u.roles.includes("super_admin"))
        return Ie(ve.PERMISSION_DENIED, {
          typeId: t,
          required: "admin role"
        });
      break;
    case B.ROLE_USER:
      const i = Je();
      if (!i.roles.includes("user") && !i.roles.includes("admin") && !i.roles.includes("super_admin"))
        return Ie(ve.PERMISSION_DENIED, {
          typeId: t,
          required: "user role"
        });
      break;
    case B.CAPABILITY:
      if (n && p.permissionsGuard && !p.permissionsGuard.can(n, Je()))
        return Ie(ve.CAPABILITY_MISSING, {
          typeId: t,
          capability: n
        });
      break;
    case B.CUSTOM:
      if (e.customGate && typeof e.customGate == "function" && !e.customGate(Je(), o))
        return Ie(ve.CUSTOM_GATE_DENIED, { typeId: t });
      break;
  }
  const a = Le();
  if (a && a.isCapabilityEnabled) {
    if (!a.isCapabilityEnabled("UI_COMPONENTS") && (!o || o.priority < 100))
      return Ie(ve.RUNTIME_DEGRADED, {
        typeId: t,
        capability: "UI_COMPONENTS"
      });
  } else if (p.runtimeKernel && typeof p.runtimeKernel.isCapabilityEnabled == "function" && !p.runtimeKernel.isCapabilityEnabled("UI_COMPONENTS") && (!o || o.priority < 100))
    return Ie(ve.RUNTIME_DEGRADED, {
      typeId: t,
      capability: "UI_COMPONENTS"
    });
  return cn(t);
}
function qo(e, t) {
  return Kt(Object.assign({ typeId: e }, {})).allowed;
}
function Go() {
  return Object.assign({}, p.metrics);
}
function Ca() {
  return p.lastDenial ? Object.assign({}, p.lastDenial) : null;
}
function Sa() {
  return p.initialized;
}
function wo() {
  return p.metrics.checks === 0 ? 0 : p.metrics.denied / p.metrics.checks * 100;
}
function Vo() {
  return Le() ? "RuntimeContext" : p.permissionsGuard ? "permissionsGuard" : "none";
}
function Da() {
  p.initialized = !1, p.permissionsGuard = null, p.runtimeKernel = null, p.eventBus = null, p.metrics = { checks: 0, granted: 0, denied: 0, errors: 0 }, p.lastDenial = null;
}
function Ra() {
  const e = {
    initialized: p.initialized,
    hasPermissionsGuard: !!p.permissionsGuard,
    hasRuntimeKernel: !!p.runtimeKernel,
    hasRuntimeContext: !!Le(),
    lowDenialRate: wo() < 50,
    noExcessiveErrors: p.metrics.errors < 100
  };
  let t = 0;
  const n = Object.keys(e);
  for (let r = 0; r < n.length; r++)
    e[n[r]] && t++;
  let o = "HEALTHY";
  return t < n.length * 0.5 ? o = "UNHEALTHY" : t < n.length && (o = "DEGRADED"), {
    status: o,
    score: t,
    maxScore: n.length,
    scoreDisplay: `${t}/${n.length}`,
    checks: e,
    metrics: Go(),
    authSource: Vo(),
    denialRate: `${wo().toFixed(2)}%`,
    lastDenial: Ca(),
    moduleId: rt,
    version: Vt,
    timestamp: Date.now()
  };
}
function La() {
  return {
    moduleId: rt,
    version: Vt,
    initialized: p.initialized,
    hasPermissionsGuard: !!p.permissionsGuard,
    hasRuntimeKernel: !!p.runtimeKernel,
    hasRuntimeContext: !!Le(),
    hasEventBus: !!p.eventBus,
    authSource: Vo(),
    metrics: Go(),
    denialReasons: Object.keys(ve),
    timestamp: Date.now()
  };
}
const un = An(Ne);
function Ko(e, t) {
  const n = pt();
  n && n.emit && n.emit(e, Object.assign({
    source: Ne,
    timestamp: Date.now()
  }, t || {}));
}
function K(e, t, n) {
  const o = n ? { data: n } : {};
  e === "error" ? un.error(t, o) : e === "warn" ? un.warn(t, o) : un.debug(t, o);
}
function $a(e) {
  try {
    const t = e && e.snapshot ? e.snapshot : null, n = e && e.trigger ? e.trigger : "unknown";
    if (!t) {
      K("warn", "[P4] RuntimeContext update sem snapshot");
      return;
    }
    K("info", "[P4] RuntimeContext updated", {
      trigger: n,
      mode: t.mode,
      authenticated: t.authenticated
    }), wn("modeChanges");
    const o = ee();
    t.mode && t.mode !== o && (gt(t.mode, o), qt(t.mode)), t.maintenance && Ta(t), t.failed && _a(t), (n === "auth-change" || !t.authenticated) && Na(t), Ko("overlay-kernel:runtime-context-updated", {
      snapshot: t,
      trigger: n
    });
  } catch (t) {
    K("error", "[P4] handleRuntimeContextUpdated error", t.message);
  }
}
function xa(e) {
  try {
    const t = e && e.snapshot ? e.snapshot : null;
    if (K("info", "[P4] RuntimeContext ready", {
      mode: t ? t.mode : "N/A",
      authenticated: t ? t.authenticated : "N/A"
    }), t && t.mode) {
      const n = ee();
      t.mode !== n && (gt(t.mode, n), qt(t.mode));
    }
  } catch (t) {
    K("error", "[P4] handleRuntimeContextReady error", t.message);
  }
}
function Ta(e) {
  if (K("warn", "[P4] Sistema em MAINTENANCE - fechando overlays não-essenciais"), typeof window > "u" || !window.OverlayKernel) return;
  const t = window.OverlayKernel.listStack();
  if (!t.ok) return;
  const n = t.data.stack;
  for (let o = 0; o < n.length; o++) {
    const r = n[o];
    r.adapterId !== "error-modal" && r.adapterId !== "alert-modal" && (K("info", `[P4] Closing overlay in MAINTENANCE: ${r.handle}`), window.OverlayKernel.close(r.handle));
  }
}
function _a(e) {
  if (K("error", "[P4] Sistema em FAILED - fechando TODOS os overlays"), typeof window > "u" || !window.OverlayKernel) return;
  const t = window.OverlayKernel.listStack();
  if (!t.ok) return;
  const n = t.data.stack;
  for (let o = 0; o < n.length; o++) {
    const r = n[o];
    K("info", `[P4] Closing overlay in FAILED: ${r.handle}`), window.OverlayKernel.close(r.handle);
  }
}
function Na(e) {
  if (K("info", "[P4] Auth state from RuntimeContext, re-syncing permissions"), !(typeof window > "u" || !window.OverlayKernel) && !e.authenticated) {
    const t = window.OverlayKernel.listStack();
    if (!t.ok) return;
    const n = t.data.stack;
    for (let o = 0; o < n.length; o++) {
      const r = n[o];
      qo(r.adapterId) || (K("info", `[P4] Closing overlay due to auth change: ${r.handle}`), window.OverlayKernel.close(r.handle));
    }
  }
}
function Ma(e) {
  K("info", "Runtime ready, syncing mode");
  const t = et(), n = ee();
  if (t && typeof t.getMode == "function") {
    const o = t.getMode();
    o !== n && gt(o, n);
  }
  Ko(ye.KERNEL_READY, {
    version: je,
    mode: ee(),
    integratedWithRuntime: !0
  });
}
function Pa(e) {
  K("warn", "Runtime degraded", e), e && e.mode && e.mode !== ee() && gt(e.mode, ee());
}
function dn(e) {
  if (K("info", "Auth state changed, re-syncing permissions"), typeof window > "u" || !window.OverlayKernel) return;
  const t = window.OverlayKernel.listStack();
  if (!t.ok) return;
  const n = t.data.stack;
  for (let o = 0; o < n.length; o++) {
    const r = n[o];
    qo(r.adapterId) || (K("info", `Closing overlay due to auth change: ${r.handle}`), window.OverlayKernel.close(r.handle));
  }
}
function Ha(e) {
  e && e.mode && gt(e.mode, ee());
}
function Wo() {
  const e = pa(), t = Ra(), n = Ea(), o = [
    { name: "manifest", health: e },
    { name: "permission-gate", health: t },
    { name: "degradation-policy", health: n }
  ];
  let r = 0, s = 0, a = !0;
  for (let c = 0; c < o.length; c++) {
    const f = o[c];
    r += f.health.score || 0, s += f.health.maxScore || 0, f.health.status !== "HEALTHY" && (a = !1);
  }
  let u = a ? "HEALTHY" : "DEGRADED";
  xt() || (u = "UNHEALTHY");
  const i = aa();
  return i.healthReports = (i.healthReports || 0) + 1, {
    status: u,
    score: r,
    maxScore: s,
    scoreDisplay: `${r}/${s}`,
    mode: ee(),
    integrated: xt() && !!et(),
    components: {
      manifest: e.status,
      permissionGate: t.status,
      degradationPolicy: n.status
    },
    moduleId: Ne,
    version: je,
    timestamp: Date.now()
  };
}
const Ua = An(Ne);
function Co() {
  if (typeof window > "u") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const e = window.Core.windowAdapter.get("RuntimeContext");
    if (e) return e;
  }
  return window.RuntimeContext || null;
}
function Yo(e, t) {
  const n = pt();
  n && n.emit && n.emit(e, Object.assign({
    source: Ne,
    timestamp: Date.now()
  }, t || {}));
}
function st(e, t, n) {
  const o = n ? { data: n } : {};
  Ua.debug(t, o);
}
function Ba() {
  const e = _o();
  for (let t = 0; t < e.length; t++) {
    const n = e[t];
    if (typeof n == "function")
      try {
        n();
      } catch {
      }
  }
  sa();
}
function za() {
  const e = pt();
  if (!e || !e.on) return;
  const t = e.on(ko.RUNTIME_CONTEXT_UPDATED, $a);
  t && Ae(t);
  const n = e.on(ko.RUNTIME_CONTEXT_READY, xa);
  n && Ae(n);
  const o = e.on("kernel:mode-change", Ha);
  o && Ae(o);
  const r = e.on("runtime:ready", Ma);
  r && Ae(r);
  const s = e.on("runtime:degraded", Pa);
  s && Ae(s);
  const a = e.on("auth:state-change", dn);
  a && Ae(a);
  const u = e.on("auth:login-success", dn);
  u && Ae(u);
  const i = e.on("auth:logout", dn);
  i && Ae(i), st("info", `[P4] Event listeners configured (${_o().length} total)`);
}
function ja() {
  const e = gn();
  !e || typeof e.register != "function" || (e.register({
    id: "overlay-kernel",
    name: "Overlay Kernel",
    version: je,
    healthCheck: Wo,
    weight: Po()
  }), st("info", "Registered with health aggregator"));
}
function Fa(e) {
  if (e = e || {}, xt())
    return {
      ok: !0,
      alreadyInitialized: !0,
      version: je
    };
  st("info", "Initializing runtime integration (P4)"), ea(e), ta(e.applicationKernel || null), na(e.eventBus || null), oa(e.permissionsGuard || null), ra(e.healthAggregator || null);
  let t = "INITIALIZING";
  const n = Co();
  if (n && n.getMode)
    t = n.getMode(), st("info", `[P4] Initial mode from RuntimeContext: ${t}`);
  else {
    const o = et();
    o && typeof o.getMode == "function" ? t = o.getMode() : e.mode && (t = e.mode);
  }
  return qt(t), Fo({
    permissionsGuard: e.permissionsGuard || null,
    runtimeKernel: e.applicationKernel || null,
    eventBus: e.eventBus || null
  }), za(), ja(), Zs(), To(Date.now()), Yo("overlay-kernel.integration-ready", {
    version: je,
    mode: ee(),
    hasApplicationKernel: !!et(),
    hasPermissionsGuard: !!e.permissionsGuard,
    hasHealthAggregator: !!gn(),
    p4RuntimeContext: !0
  }), {
    ok: !0,
    initialized: !0,
    version: je,
    mode: ee(),
    p4RuntimeContext: !0,
    integrations: {
      applicationKernel: !!et(),
      permissionsGuard: !!e.permissionsGuard,
      healthAggregator: !!gn(),
      eventBus: !!pt(),
      runtimeContext: !!Co()
    }
  };
}
function qa(e) {
  if (!xt())
    return { ok: !0, alreadyShutdown: !0 };
  st("info", "Shutting down runtime integration", { reason: e });
  const t = require("../state.js").getLastModeChange();
  return Ba(), Da(), Yo(ye.KERNEL_SHUTDOWN, {
    reason: e || "manual",
    uptime: t ? Date.now() - t : 0
  }), ia(), {
    ok: !0,
    shutdown: !0,
    reason: e
  };
}
function Ga() {
  return ee();
}
function Va(e, t) {
  const n = ee(), o = zo(n, e);
  if (o.action === E.BLOCK)
    return {
      allowed: !1,
      reason: "blocked-by-degradation-policy",
      mode: n,
      policy: o
    };
  const r = Kt(Object.assign({ typeId: e }, t || {}));
  return r.allowed ? {
    allowed: !0,
    mode: n,
    policy: o,
    permission: r
  } : {
    allowed: !1,
    reason: r.reason,
    mode: n,
    permission: r
  };
}
const Ka = "3.0.0-ELEVATION", Oe = "overlay-kernel", ge = "3.0.0-ELEVATION", Me = Lo({ moduleId: Oe });
function Wa() {
  Me.init();
}
function tt(e) {
  return Me.get(e);
}
function Ya(e) {
  return Me.inject(e);
}
function Qa() {
  return Me.snapshot();
}
const ae = { IDLE: "idle", INITIALIZING: "initializing", READY: "ready", DEGRADED: "degraded", SHUTDOWN: "shutdown", ERROR: "error" }, oe = { REGISTERED: "registered", ENABLED: "enabled", DISABLED: "disabled", DEGRADED: "degraded", ERROR: "error" }, mn = { critical: 100, high: 75, normal: 50, low: 25 }, l = {
  status: ae.IDLE,
  adapters: /* @__PURE__ */ new Map(),
  stack: [],
  idCounter: 0,
  initTime: null,
  shutdownTime: null,
  errors: [],
  runtimeIntegrated: !1,
  currentMode: "INITIALIZING",
  metrics: {
    inits: 0,
    shutdowns: 0,
    adapterRegistrations: 0,
    opens: 0,
    closes: 0,
    adapterErrors: 0,
    permissionDenials: 0,
    policyBlocks: 0
  }
};
function k(e, t, n) {
  return {
    ok: e,
    data: t || null,
    meta: {
      moduleId: Oe,
      version: ge,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      status: l.status,
      mode: l.currentMode
    },
    errors: n || []
  };
}
function Xa(e, t, n, o) {
  return {
    status: e,
    score: t,
    moduleId: Oe,
    version: ge,
    checks: n || {},
    issues: o || [],
    metrics: Ln().data,
    mode: l.currentMode,
    runtimeIntegrated: l.runtimeIntegrated,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function Ce(e, t) {
  try {
    const n = tt("telemetry");
    n && n.track && n.track(e, Object.assign({ moduleId: Oe }, t || {}));
  } catch {
  }
}
function Pe(e, t) {
  try {
    const n = tt("eventBus");
    n && n.emit && n.emit(e, Object.assign({ source: Oe, timestamp: Date.now() }, t || {}));
  } catch {
  }
}
function Qo(e) {
  if (l.status === ae.READY) return k(!0, { alreadyInitialized: !0 });
  if (l.status === ae.INITIALIZING) return k(!1, null, [{ code: "INIT_IN_PROGRESS", message: "Initialization in progress" }]);
  l.status = ae.INITIALIZING;
  try {
    Wa(), e && e.ports && Me.inject(e.ports), l.initTime = Date.now(), l.shutdownTime = null, l.metrics.inits++;
    const t = tt("telemetry");
    if (t && t.register && t.register({ id: Oe, version: ge, healthCheck: Wt, info: $n }), e && (e.applicationKernel || e.runtimeContext)) {
      const n = e.runtimeContext || {
        applicationKernel: e.applicationKernel,
        eventBus: e.eventBus || tt("eventBus"),
        permissionsGuard: e.permissionsGuard,
        healthAggregator: e.healthAggregator
      };
      Fa(n).ok && (l.runtimeIntegrated = !0, l.currentMode = Ga());
    } else
      Fo({
        eventBus: tt("eventBus")
      });
    return l.status = ae.READY, Ce("kernel:init", {
      version: ge,
      runtimeIntegrated: l.runtimeIntegrated,
      mode: l.currentMode
    }), Pe(ye.KERNEL_READY, {
      version: ge,
      runtimeIntegrated: l.runtimeIntegrated,
      mode: l.currentMode
    }), k(!0, {
      initialized: !0,
      version: ge,
      status: l.status,
      runtimeIntegrated: l.runtimeIntegrated,
      mode: l.currentMode
    });
  } catch (t) {
    return l.status = ae.ERROR, l.errors.push({ code: "INIT_ERROR", message: t.message, timestamp: Date.now() }), k(!1, null, [{ code: "INIT_ERROR", message: t.message }]);
  }
}
function Dn(e) {
  if (l.status === ae.SHUTDOWN) return k(!0, { alreadyShutdown: !0 });
  try {
    return Jo(), l.adapters.forEach((t, n) => {
      t.status === oe.ENABLED && Xo(n, "kernel_shutdown");
    }), l.runtimeIntegrated && qa(e), l.shutdownTime = Date.now(), l.metrics.shutdowns++, l.status = ae.SHUTDOWN, l.runtimeIntegrated = !1, Ce("kernel:shutdown", {
      reason: e || "manual",
      uptime: l.shutdownTime - l.initTime
    }), Pe(ye.KERNEL_SHUTDOWN, { reason: e }), k(!0, { shutdown: !0, reason: e });
  } catch (t) {
    return l.errors.push({ code: "SHUTDOWN_ERROR", message: t.message, timestamp: Date.now() }), k(!1, null, [{ code: "SHUTDOWN_ERROR", message: t.message }]);
  }
}
function Ja(e) {
  if (!e || !e.id)
    return k(!1, null, [{ code: "INVALID_ADAPTER", message: "Adapter must have id" }]);
  const t = e.id, n = l.adapters.get(t), o = {
    id: t,
    version: e.version || "0.0.0",
    type: e.type || "custom",
    priority: e.priority || "normal",
    instance: e,
    status: oe.REGISTERED,
    registeredAt: n ? n.registeredAt : Date.now(),
    enabledAt: null,
    lastError: null,
    errorCount: 0,
    openCount: 0,
    closeCount: 0
  };
  return l.adapters.set(t, o), l.metrics.adapterRegistrations++, Ce("adapter:registered", { adapterId: t, type: o.type }), Pe(ye.ADAPTER_REGISTERED, { adapterId: t }), k(!0, { adapterId: t, registered: !0 });
}
function Za(e, t) {
  const n = l.adapters.get(e);
  if (!n) return k(!1, null, [{ code: "NOT_FOUND", message: `Adapter not found: ${e}` }]);
  if (n.status === oe.ENABLED) return k(!0, { adapterId: e, alreadyEnabled: !0 });
  try {
    if (n.instance && typeof n.instance.init == "function") {
      const o = Object.assign({ ports: Me.snapshot() }, t || {}), r = n.instance.init(o);
      if (r && !r.ok)
        return n.status = oe.ERROR, n.lastError = r.errors[0], n.errorCount++, r;
    }
    return n.status = oe.ENABLED, n.enabledAt = Date.now(), Ce("adapter:enabled", { adapterId: e }), Pe(ye.ADAPTER_ENABLED, { adapterId: e }), k(!0, { adapterId: e, enabled: !0 });
  } catch (o) {
    return n.status = oe.ERROR, n.lastError = { code: "ENABLE_ERROR", message: o.message }, n.errorCount++, l.metrics.adapterErrors++, k(!1, null, [{ code: "ENABLE_ERROR", message: o.message }]);
  }
}
function Xo(e, t) {
  const n = l.adapters.get(e);
  if (!n) return k(!1, null, [{ code: "NOT_FOUND", message: `Adapter not found: ${e}` }]);
  if (n.status === oe.DISABLED) return k(!0, { adapterId: e, alreadyDisabled: !0 });
  if (l.stack = l.stack.filter((o) => {
    if (o.adapterId === e) {
      try {
        n.instance && n.instance.close && n.instance.close(o.handle);
      } catch {
      }
      return !1;
    }
    return !0;
  }), n.instance && typeof n.instance.cleanup == "function")
    try {
      n.instance.cleanup();
    } catch {
    }
  return n.status = oe.DISABLED, Pe(ye.ADAPTER_DISABLED, { adapterId: e, reason: t }), k(!0, { adapterId: e, disabled: !0 });
}
function ei(e, t, n) {
  n = n || {};
  const o = l.adapters.get(e);
  if (!o)
    return k(!1, null, [{ code: "ADAPTER_NOT_FOUND", message: `Adapter not found: ${e}` }]);
  if (o.status !== oe.ENABLED && o.status !== oe.REGISTERED)
    return k(!1, null, [{ code: "ADAPTER_NOT_READY", message: `Adapter not enabled: ${e}` }]);
  if (!n.bypassPermission) {
    const r = Kt({
      typeId: e,
      scope: n.scope || "global",
      capability: n.capability
    });
    if (!r.allowed)
      return l.metrics.permissionDenials++, Ce("overlay:permission-denied", {
        adapterId: e,
        reason: r.reason
      }), k(!1, null, [{
        code: "PERMISSION_DENIED",
        message: `Permission denied: ${r.reason}`,
        details: r
      }]);
  }
  if (!n.bypassPolicy) {
    const r = zo(l.currentMode, e);
    if (r.action === E.BLOCK)
      return l.metrics.policyBlocks++, Ce("overlay:policy-blocked", {
        adapterId: e,
        mode: l.currentMode,
        reason: r.reason
      }), k(!1, null, [{
        code: "POLICY_BLOCKED",
        message: `Blocked by degradation policy in mode: ${l.currentMode}`,
        details: r
      }]);
  }
  try {
    const r = `${Oe}-${++l.idCounter}`, s = mn[o.priority] || mn.normal, a = {
      handle: r,
      adapterId: e,
      priority: s,
      payload: t,
      openedAt: Date.now(),
      mode: l.currentMode
    };
    if (l.stack.push(a), l.stack.sort((u, i) => i.priority - u.priority), o.instance && typeof o.instance.open == "function") {
      const u = o.instance.open(t, r);
      if (u && !u.ok)
        return l.stack = l.stack.filter((i) => i.handle !== r), u;
    }
    return o.openCount++, l.metrics.opens++, Ce("overlay:opened", { handle: r, adapterId: e, mode: l.currentMode }), Pe(ye.KERNEL_OPENED, {
      handle: r,
      adapterId: e,
      stackDepth: l.stack.length,
      mode: l.currentMode
    }), k(!0, {
      handle: r,
      adapterId: e,
      stackDepth: l.stack.length,
      mode: l.currentMode
    });
  } catch (r) {
    return o.errorCount++, l.metrics.adapterErrors++, k(!1, null, [{ code: "OPEN_ERROR", message: r.message }]);
  }
}
function ti(e) {
  const t = l.stack.findIndex((n) => n.handle === e);
  if (t === -1) return k(!1, null, [{ code: "HANDLE_NOT_FOUND", message: `Handle not found: ${e}` }]);
  try {
    const n = l.stack[t], o = l.adapters.get(n.adapterId);
    return o && o.instance && typeof o.instance.close == "function" && o.instance.close(e), l.stack.splice(t, 1), o && o.closeCount++, l.metrics.closes++, Ce("overlay:closed", { handle: e, adapterId: n.adapterId }), Pe(ye.KERNEL_CLOSED, {
      handle: e,
      adapterId: n.adapterId,
      stackDepth: l.stack.length
    }), k(!0, { handle: e, closed: !0, stackDepth: l.stack.length });
  } catch (n) {
    return k(!1, null, [{ code: "CLOSE_ERROR", message: n.message }]);
  }
}
function Jo() {
  const e = [];
  for (; l.stack.length > 0; ) {
    const t = l.stack.pop(), n = l.adapters.get(t.adapterId);
    if (n && n.instance && typeof n.instance.close == "function")
      try {
        n.instance.close(t.handle);
      } catch {
      }
    e.push(t.handle), l.metrics.closes++;
  }
  return k(!0, { closed: e, count: e.length });
}
function ni() {
  const e = l.stack.map((t) => ({
    handle: t.handle,
    adapterId: t.adapterId,
    priority: t.priority,
    openedAt: t.openedAt,
    mode: t.mode
  }));
  return k(!0, { stack: e, depth: e.length });
}
function oi() {
  const e = [];
  return l.adapters.forEach((t) => {
    e.push({
      id: t.id,
      version: t.version,
      type: t.type,
      status: t.status,
      openCount: t.openCount,
      errorCount: t.errorCount
    });
  }), k(!0, { adapters: e, count: e.length });
}
function ri(e) {
  const t = l.adapters.get(e);
  if (!t) return k(!1, null, [{ code: "NOT_FOUND", message: `Adapter not found: ${e}` }]);
  let n = null;
  if (t.instance && typeof t.instance.healthCheck == "function")
    try {
      n = t.instance.healthCheck();
    } catch (o) {
      n = { status: "error", error: o.message };
    }
  return k(!0, {
    id: t.id,
    version: t.version,
    type: t.type,
    status: t.status,
    openCount: t.openCount,
    closeCount: t.closeCount,
    errorCount: t.errorCount,
    lastError: t.lastError,
    health: n
  });
}
function Zo() {
  return l.currentMode;
}
function si() {
  return l.runtimeIntegrated;
}
function Rn(e, t) {
  return l.runtimeIntegrated ? Va(e, t) : Kt(Object.assign({ typeId: e }, t || {}));
}
function ai() {
  return ga();
}
function ii() {
  return ka();
}
function li() {
  return La();
}
function Ln() {
  let e = 0, t = 0;
  return l.adapters.forEach((n) => {
    n.status === oe.ENABLED ? e++ : n.status === oe.ERROR && t++;
  }), k(!0, {
    kernelStatus: l.status,
    mode: l.currentMode,
    runtimeIntegrated: l.runtimeIntegrated,
    uptime: l.initTime ? Date.now() - l.initTime : 0,
    adaptersTotal: l.adapters.size,
    adaptersEnabled: e,
    adaptersError: t,
    stackDepth: l.stack.length,
    counters: l.metrics,
    errorsRecorded: l.errors.length
  });
}
function Wt() {
  const e = Ln().data, t = {
    initialized: { ok: l.status === ae.READY, severity: "crit" },
    adaptersLoaded: { ok: l.adapters.size > 0, severity: "warn" },
    stackHealthy: { ok: l.stack.length < 10, severity: "warn" },
    noAdapterErrors: { ok: e.adaptersError === 0, severity: "warn" },
    runtimeIntegrated: { ok: l.runtimeIntegrated, severity: "info" },
    permissionGateReady: { ok: Sa(), severity: "warn" }
  }, n = [];
  let o = 100;
  l.status !== ae.READY && (n.push({ code: "NOT_READY", severity: "crit", message: `Kernel status: ${l.status}` }), o -= 50), l.adapters.size === 0 && (n.push({ code: "NO_ADAPTERS", severity: "warn", message: "No adapters registered" }), o -= 10), l.stack.length >= 10 && (n.push({ code: "STACK_OVERFLOW", severity: "warn", message: "Stack depth >= 10" }), o -= 20), e.adaptersError > 0 && (n.push({ code: "ADAPTERS_ERROR", severity: "warn", message: `${e.adaptersError} adapters in error state` }), o -= 15), l.runtimeIntegrated || n.push({ code: "NOT_RUNTIME_INTEGRATED", severity: "info", message: "Running in standalone mode" });
  const r = o >= 80 ? "HEALTHY" : o >= 50 ? "DEGRADED" : "UNHEALTHY";
  return l.runtimeIntegrated && Wo(), Xa(r, Math.max(0, o), t, n);
}
function $n() {
  return k(!0, {
    moduleId: Oe,
    version: ge,
    status: l.status,
    mode: l.currentMode,
    runtimeIntegrated: l.runtimeIntegrated,
    capabilities: {
      supportsFeatures: !1,
      supportsAdapters: !0,
      supportsDegradedMode: !0,
      supportsHotReload: !0,
      supportsRuntimeIntegration: !0,
      supportsUARPS: !0,
      supportsDegradationPolicies: !0
    },
    adaptersCount: l.adapters.size,
    stackDepth: l.stack.length,
    uptime: l.initTime ? Date.now() - l.initTime : 0,
    portsInitialized: Me.isInitialized(),
    subModules: {
      manifest: Gt,
      permissionGate: Vt,
      degradationPolicy: Cn,
      runtimeIntegration: Ka
    }
  });
}
function ci() {
  return Dn("cleanup");
}
typeof window < "u" && (window.OverlayKernel = {
  // Identity
  MODULE_ID: Oe,
  VERSION: ge,
  STATUS: ae,
  PRIORITY: mn,
  // Lifecycle
  init: Qo,
  shutdown: Dn,
  cleanup: ci,
  // Adapter management
  registerAdapter: Ja,
  enableAdapter: Za,
  disableAdapter: Xo,
  listAdapters: oi,
  getAdapterStatus: ri,
  // Stack operations
  open: ei,
  close: ti,
  closeAll: Jo,
  listStack: ni,
  // Runtime integration (NOVO)
  getMode: Zo,
  isRuntimeIntegrated: si,
  canOpenOverlay: Rn,
  getManifestInfo: ai,
  getPolicyInfo: ii,
  getPermissionGateInfo: li,
  // Diagnostics
  healthCheck: Wt,
  info: $n,
  metrics: Ln,
  // Ports
  injectPorts: Ya,
  getPorts: Qa
});
const mt = "1.0.0", Yt = "overlay-layer-schema-validator", Qe = ["modal", "drawer", "dialog", "loading", "toast", "sheet"], yt = ["global", "page", "component"], er = ["fade", "slide-up", "slide-down", "slide-left", "slide-right", "scale", "none"], Ke = {
  blocking: { type: "boolean", default: !1 },
  closable: { type: "boolean", default: !0 },
  backdrop: { type: "boolean", default: !0 },
  backdropClose: { type: "boolean", default: !0 },
  escapeClose: { type: "boolean", default: !0 },
  timeout: { type: "number", min: 0, default: 0 },
  priority: { type: "number", min: 0, max: 100, default: 50 },
  transition: { type: "string", enum: er, default: "fade" },
  zIndex: { type: "number", min: 0 },
  className: { type: "string" },
  ariaLabel: { type: "string" },
  ariaDescribedBy: { type: "string" },
  focusFirst: { type: "boolean", default: !0 },
  trapFocus: { type: "boolean", default: !0 },
  restoreFocus: { type: "boolean", default: !0 }
}, Fe = {
  id: { type: "string", required: !1, pattern: /^[a-zA-Z0-9_-]+$/ },
  type: { type: "string", required: !0, enum: Qe },
  scope: { type: "string", required: !1, enum: yt, default: "global" },
  template: { type: "string", required: !1 },
  content: { type: ["string", "object", "null"], required: !1, default: null },
  config: { type: "object", required: !1, schema: Ke, default: {} },
  meta: { type: "object", required: !1, default: {} },
  data: { type: "object", required: !1, default: {} }
};
let J = {
  validations: 0,
  passed: 0,
  failed: 0,
  errors: []
};
function ui(e, t, n) {
  const o = [], r = Array.isArray(t) ? t : [t];
  let s = !1;
  for (const a of r) {
    if (a === "null" && e === null) {
      s = !0;
      break;
    }
    if (a === "string" && typeof e == "string") {
      s = !0;
      break;
    }
    if (a === "number" && typeof e == "number" && !isNaN(e)) {
      s = !0;
      break;
    }
    if (a === "boolean" && typeof e == "boolean") {
      s = !0;
      break;
    }
    if (a === "object" && typeof e == "object" && e !== null && !Array.isArray(e)) {
      s = !0;
      break;
    }
    if (a === "array" && Array.isArray(e)) {
      s = !0;
      break;
    }
    if (a === "function" && typeof e == "function") {
      s = !0;
      break;
    }
  }
  return s || o.push(`${n}: expected ${r.join(" | ")}, got ${typeof e}`), o;
}
function xn(e, t, n) {
  const o = [];
  if (e == null)
    return t.required && o.push(`${n}: field is required`), o;
  if (t.type) {
    const r = ui(e, t.type, n);
    if (o.push(...r), r.length > 0) return o;
  }
  if (t.enum && !t.enum.includes(e) && o.push(`${n}: must be one of [${t.enum.join(", ")}], got "${e}"`), t.pattern && typeof e == "string" && !t.pattern.test(e) && o.push(`${n}: does not match required pattern`), typeof e == "number" && (t.min !== void 0 && e < t.min && o.push(`${n}: must be >= ${t.min}, got ${e}`), t.max !== void 0 && e > t.max && o.push(`${n}: must be <= ${t.max}, got ${e}`)), typeof e == "string" && (t.minLength !== void 0 && e.length < t.minLength && o.push(`${n}: length must be >= ${t.minLength}`), t.maxLength !== void 0 && e.length > t.maxLength && o.push(`${n}: length must be <= ${t.maxLength}`)), t.schema && typeof e == "object" && e !== null)
    for (const [r, s] of Object.entries(t.schema)) {
      const a = xn(e[r], s, `${n}.${r}`);
      o.push(...a);
    }
  return o;
}
function Tn(e, t) {
  const n = { ...e };
  for (const [o, r] of Object.entries(t))
    n[o] === void 0 && r.default !== void 0 && (n[o] = typeof r.default == "object" ? { ...r.default } : r.default), r.schema && typeof n[o] == "object" && n[o] !== null && (n[o] = Tn(n[o], r.schema));
  return n;
}
function ht(e, t = {}) {
  var n, o, r;
  J.validations++;
  const s = performance.now(), a = [], u = [];
  if (!e || typeof e != "object")
    return J.failed++, J.errors.push("descriptor-invalid"), {
      valid: !1,
      errors: ["descriptor must be a non-null object"],
      warnings: [],
      normalized: null,
      duration: performance.now() - s
    };
  for (const [f, b] of Object.entries(Fe)) {
    const g = xn(e[f], b, f);
    a.push(...g);
  }
  if (t.strict) {
    const f = Object.keys(Fe);
    for (const b of Object.keys(e))
      f.includes(b) || u.push(`unknown field: ${b}`);
  }
  (n = e.config) != null && n.timeout && e.config.timeout > 0 && e.type === "modal" && e.config.blocking && u.push("blocking modal with timeout may cause UX issues"), ((o = e.config) == null ? void 0 : o.priority) > 90 && !((r = e.config) != null && r.blocking) && u.push("high priority overlay should typically be blocking");
  const i = a.length === 0;
  i ? J.passed++ : (J.failed++, J.errors.push(...a.slice(0, 3)));
  const c = i ? Tn(e, Fe) : null;
  return c && !c.id && (c.id = `${c.type}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`), {
    valid: i,
    errors: a,
    warnings: u,
    normalized: c,
    duration: performance.now() - s
  };
}
function tr(e) {
  const t = [];
  if (!e || typeof e != "object")
    return { valid: !0, errors: [], normalized: {} };
  for (const [n, o] of Object.entries(Ke))
    if (e[n] !== void 0) {
      const r = xn(e[n], o, `config.${n}`);
      t.push(...r);
    }
  return {
    valid: t.length === 0,
    errors: t,
    normalized: t.length === 0 ? Tn(e, Ke) : null
  };
}
function nr(e) {
  return Qe.includes(e);
}
function or(e) {
  return yt.includes(e);
}
function rr() {
  return [...Qe];
}
function sr() {
  return [...yt];
}
function ar() {
  return JSON.parse(JSON.stringify(Fe));
}
function ir() {
  return JSON.parse(JSON.stringify(Ke));
}
function _n() {
  return { ...J, errorSample: J.errors.slice(-10) };
}
function lr() {
  J = { validations: 0, passed: 0, failed: 0, errors: [] };
}
function cr() {
  const e = J.validations > 0 ? J.passed / J.validations * 100 : 100, t = {
    schemaLoaded: Object.keys(Fe).length > 0,
    configSchemaLoaded: Object.keys(Ke).length > 0,
    validTypesLoaded: Qe.length > 0,
    passRateHealthy: e >= 80
  }, n = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
  return {
    status: n === o ? "HEALTHY" : n >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${n}/${o}`,
    checks: t,
    metrics: {
      validations: J.validations,
      passRate: `${e.toFixed(1)}%`
    },
    version: mt,
    moduleId: Yt,
    timestamp: Date.now()
  };
}
function Nn() {
  return {
    moduleId: Yt,
    version: mt,
    validTypes: Qe,
    validScopes: yt,
    validTransitions: er,
    schemaFields: Object.keys(Fe),
    configFields: Object.keys(Ke),
    metrics: _n(),
    timestamp: Date.now()
  };
}
const di = {
  validate: ht,
  validateConfig: tr,
  isValidType: nr,
  isValidScope: or,
  getValidTypes: rr,
  getValidScopes: sr,
  getSchema: ar,
  getConfigSchema: ir,
  getMetrics: _n,
  resetMetrics: lr,
  healthCheck: cr,
  info: Nn,
  VERSION: mt,
  MODULE_ID: Yt,
  VALID_TYPES: Qe,
  VALID_SCOPES: yt
}, fi = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Yt,
  VERSION: mt,
  default: di,
  getConfigSchema: ir,
  getMetrics: _n,
  getSchema: ar,
  getValidScopes: sr,
  getValidTypes: rr,
  healthCheck: cr,
  info: Nn,
  isValidScope: or,
  isValidType: nr,
  resetMetrics: lr,
  validate: ht,
  validateConfig: tr
}, Symbol.toStringTag, { value: "Module" })), ur = "1.0.0", pi = "overlay-kernel-rate-limiter", gi = {
  maxPerSecond: 5,
  maxPerMinute: 30,
  burstAllowance: 3,
  windowMs: 1e3,
  minuteWindowMs: 6e4,
  bypassTypes: ["system-modal", "error-modal", "login-modal"],
  enabled: !0
};
let h = { ...gi }, y = {
  secondWindow: [],
  minuteWindow: [],
  blocked: 0,
  allowed: 0,
  lastReset: Date.now(),
  burstUsed: 0
};
function Qt() {
  const e = Date.now();
  y.secondWindow = y.secondWindow.filter(
    (t) => e - t < h.windowMs
  ), y.minuteWindow = y.minuteWindow.filter(
    (t) => e - t < h.minuteWindowMs
  );
}
function mi(e, t = {}) {
  if (!h.enabled)
    return { allowed: !0, reason: "rate-limiter-disabled" };
  if (e && h.bypassTypes.includes(e))
    return { allowed: !0, reason: "bypass-type", typeId: e };
  if (t.bypassRateLimit)
    return { allowed: !0, reason: "bypass-forced" };
  Qt();
  const n = Date.now(), o = y.secondWindow.length, r = y.minuteWindow.length;
  return o >= h.maxPerSecond ? y.burstUsed < h.burstAllowance ? (y.burstUsed++, {
    allowed: !0,
    reason: "burst-allowance",
    burstRemaining: h.burstAllowance - y.burstUsed
  }) : (y.blocked++, {
    allowed: !1,
    reason: "second-limit-exceeded",
    limit: h.maxPerSecond,
    current: o,
    retryAfter: h.windowMs - (n - y.secondWindow[0])
  }) : r >= h.maxPerMinute ? (y.blocked++, {
    allowed: !1,
    reason: "minute-limit-exceeded",
    limit: h.maxPerMinute,
    current: r,
    retryAfter: h.minuteWindowMs - (n - y.minuteWindow[0])
  }) : {
    allowed: !0,
    reason: "within-limits",
    secondRemaining: h.maxPerSecond - o,
    minuteRemaining: h.maxPerMinute - r
  };
}
function yi(e) {
  if (e && h.bypassTypes.includes(e))
    return;
  const t = Date.now();
  y.secondWindow.push(t), y.minuteWindow.push(t), y.allowed++, y.secondWindow.length === 1 && (y.burstUsed = 0);
}
function hi() {
  return Qt(), {
    perSecond: Math.max(0, h.maxPerSecond - y.secondWindow.length),
    perMinute: Math.max(0, h.maxPerMinute - y.minuteWindow.length),
    burstRemaining: Math.max(0, h.burstAllowance - y.burstUsed)
  };
}
function vi() {
  return Qt(), {
    secondWindow: y.secondWindow.length,
    minuteWindow: y.minuteWindow.length,
    secondLimit: h.maxPerSecond,
    minuteLimit: h.maxPerMinute,
    secondUsagePercent: y.secondWindow.length / h.maxPerSecond * 100,
    minuteUsagePercent: y.minuteWindow.length / h.maxPerMinute * 100
  };
}
function dr() {
  y = {
    secondWindow: [],
    minuteWindow: [],
    blocked: 0,
    allowed: 0,
    lastReset: Date.now(),
    burstUsed: 0
  };
}
function bi(e) {
  return !e || typeof e != "object" ? !1 : (h = { ...h, ...e }, h.maxPerSecond < 1 && (h.maxPerSecond = 1), h.maxPerMinute < 1 && (h.maxPerMinute = 1), h.burstAllowance < 0 && (h.burstAllowance = 0), !0);
}
function Ei() {
  return { ...h };
}
function ki() {
  return h.enabled;
}
function Oi() {
  Qt();
  const e = y.allowed + y.blocked, t = e > 0 ? y.blocked / e * 100 : 0;
  return {
    allowed: y.allowed,
    blocked: y.blocked,
    total: e,
    blockRate: `${t.toFixed(1)}%`,
    currentSecondUsage: y.secondWindow.length,
    currentMinuteUsage: y.minuteWindow.length,
    burstUsed: y.burstUsed,
    lastReset: y.lastReset,
    uptime: Date.now() - y.lastReset
  };
}
function fr() {
  return {
    moduleId: pi,
    version: ur,
    enabled: h.enabled,
    config: Ei(),
    usage: vi(),
    remaining: hi(),
    metrics: Oi(),
    timestamp: Date.now()
  };
}
const Ai = "1.2.0-EVENT-CONSTANTS", pr = "overlay-kernel-auto-cleanup", Ii = {
  enabled: !1,
  scanInterval: 1e4,
  defaultMaxAge: 3e5,
  maxAgeByType: {
    toast: 1e4,
    loading: 6e4,
    modal: 0,
    dialog: 0,
    drawer: 0,
    sheet: 18e4
  },
  exemptTypes: ["system-modal", "login-modal", "error-modal"],
  exemptIds: [],
  closeReason: "auto-cleanup-expired",
  onCleanup: null
};
let L = { ...Ii }, R = {
  enabled: !1,
  intervalId: null,
  lastScan: null,
  cleanedCount: 0,
  scansCount: 0,
  exemptedCount: 0,
  startTime: null
}, ie = null, yn = null, It = null;
function wi(e) {
  e.store && (ie = e.store), e.closeOverlay && (yn = e.closeOverlay), e.eventBus && (It = e.eventBus);
}
function Tt(e) {
  var t, n;
  if (!e) return 0;
  const o = e.createdAt || ((t = e.runtime) == null ? void 0 : t.createdAt) || ((n = e.meta) == null ? void 0 : n.createdAt);
  return o ? Date.now() - o : 0;
}
function Xt(e) {
  return L.maxAgeByType[e] !== void 0 ? L.maxAgeByType[e] : L.defaultMaxAge;
}
function gr(e) {
  var t, n;
  if (!e || L.exemptIds.includes(e.id))
    return !0;
  const o = e.typeId || e.type;
  return !!(L.exemptTypes.includes(o) || (t = e.config) != null && t.noAutoCleanup || (n = e.meta) != null && n.exempt || Xt(o) === 0);
}
function mr(e) {
  if (gr(e)) return !1;
  const t = e.typeId || e.type, n = Xt(t);
  return Tt(e) > n;
}
function hn() {
  if (!ie)
    return console.debug(`[${pr}] Store not injected, cannot scan`), { scanned: 0, cleaned: 0, exempted: 0, errors: ["store-not-injected"] };
  R.lastScan = Date.now(), R.scansCount++;
  const e = ie.getStack ? ie.getStack() : [], t = ie.getOverlays ? ie.getOverlays() : {}, n = {
    scanned: 0,
    cleaned: 0,
    exempted: 0,
    expired: [],
    errors: []
  };
  for (const o of e) {
    const r = t[o];
    if (r) {
      if (n.scanned++, gr(r)) {
        n.exempted++, R.exemptedCount++;
        continue;
      }
      if (mr(r))
        if (n.expired.push({
          id: r.id,
          type: r.type || r.typeId,
          age: Tt(r),
          maxAge: Xt(r.type || r.typeId)
        }), yn)
          try {
            const s = yn(r.id, L.closeReason);
            if ((s == null ? void 0 : s.ok) !== !1) {
              if (n.cleaned++, R.cleanedCount++, typeof L.onCleanup == "function")
                try {
                  L.onCleanup(r, "expired");
                } catch {
                }
              It != null && It.emit && It.emit(Ls.AUTO_CLEANED, {
                id: r.id,
                type: r.type,
                reason: "expired",
                age: Tt(r)
              });
            } else
              n.errors.push(`failed-to-close:${r.id}`);
          } catch (s) {
            n.errors.push(`error-closing:${r.id}:${s.message}`);
          }
        else
          n.errors.push("close-function-not-injected");
    }
  }
  return n;
}
function yr(e = {}) {
  return R.enabled && Mn(), Object.keys(e).length > 0 && Si(e), L.enabled = !0, R.enabled = !0, R.startTime = Date.now(), R.intervalId = setInterval(() => {
    R.enabled && hn();
  }, L.scanInterval), hn(), {
    ok: !0,
    enabled: !0,
    scanInterval: L.scanInterval,
    startTime: R.startTime
  };
}
function Mn() {
  return L.enabled = !1, R.enabled = !1, R.intervalId && (clearInterval(R.intervalId), R.intervalId = null), { ok: !0, enabled: !1 };
}
function Ci() {
  return R.enabled;
}
function Si(e) {
  return !e || typeof e != "object" ? !1 : (e.maxAgeByType && (L.maxAgeByType = { ...L.maxAgeByType, ...e.maxAgeByType }, delete e.maxAgeByType), e.exemptTypes && (L.exemptTypes = [.../* @__PURE__ */ new Set([...L.exemptTypes, ...e.exemptTypes])], delete e.exemptTypes), e.exemptIds && (L.exemptIds = [.../* @__PURE__ */ new Set([...L.exemptIds, ...e.exemptIds])], delete e.exemptIds), L = { ...L, ...e }, R.enabled && e.scanInterval && (Mn(), yr()), !0);
}
function Di() {
  return { ...L, maxAgeByType: { ...L.maxAgeByType } };
}
function hr() {
  if (!ie) return [];
  const e = ie.getStack ? ie.getStack() : [], t = ie.getOverlays ? ie.getOverlays() : {}, n = [];
  for (const o of e) {
    const r = t[o];
    r && mr(r) && n.push({
      id: r.id,
      type: r.type || r.typeId,
      age: Tt(r),
      maxAge: Xt(r.type || r.typeId)
    });
  }
  return n;
}
function Ri() {
  return {
    enabled: R.enabled,
    cleanedCount: R.cleanedCount,
    scansCount: R.scansCount,
    exemptedCount: R.exemptedCount,
    lastScan: R.lastScan,
    uptime: R.startTime ? Date.now() - R.startTime : 0,
    currentExpired: hr().length
  };
}
function Li() {
  return {
    moduleId: pr,
    version: Ai,
    enabled: R.enabled,
    config: Di(),
    metrics: Ri(),
    expired: hr(),
    timestamp: Date.now()
  };
}
const Pn = "1.0.0", Hn = "overlay-kernel-circuit-breaker", O = {
  CLOSED: "CLOSED",
  // Normal - permite operações
  OPEN: "OPEN",
  // Falhas detectadas - bloqueia operações
  HALF_OPEN: "HALF_OPEN"
  // Testando recuperação
}, $i = {
  failureThreshold: 5,
  successThreshold: 3,
  timeout: 3e4,
  monitoredOperations: ["open", "render", "close"],
  enabled: !0,
  resetOnSuccess: !0,
  halfOpenMaxAttempts: 3
};
let P = { ...$i }, d = {
  current: O.CLOSED,
  failures: 0,
  successes: 0,
  lastFailure: null,
  lastSuccess: null,
  lastStateChange: Date.now(),
  openedAt: null,
  halfOpenAttempts: 0,
  totalFailures: 0,
  totalSuccesses: 0,
  totalBlocked: 0,
  stateHistory: []
}, wt = null;
function xi(e) {
  e.eventBus && (wt = e.eventBus);
}
function Un(e, t) {
  wt != null && wt.emit && wt.emit(e, { ...t, moduleId: Hn, timestamp: Date.now() });
}
function Jt(e, t, n) {
  d.stateHistory.push({
    from: e,
    to: t,
    reason: n,
    timestamp: Date.now(),
    failures: d.failures,
    successes: d.successes
  }), d.stateHistory.length > 20 && d.stateHistory.shift(), Un("circuit-breaker:state-change", { from: e, to: t, reason: n });
}
function vn(e) {
  if (d.current === O.OPEN) return;
  const t = d.current;
  d.current = O.OPEN, d.openedAt = Date.now(), d.lastStateChange = Date.now(), d.halfOpenAttempts = 0, Jt(t, O.OPEN, e), setTimeout(() => {
    d.current === O.OPEN && vr("timeout-expired");
  }, P.timeout);
}
function vr(e) {
  if (d.current === O.HALF_OPEN) return;
  const t = d.current;
  d.current = O.HALF_OPEN, d.lastStateChange = Date.now(), d.successes = 0, d.halfOpenAttempts = 0, Jt(t, O.HALF_OPEN, e);
}
function Ti(e) {
  if (d.current === O.CLOSED) return;
  const t = d.current;
  d.current = O.CLOSED, d.lastStateChange = Date.now(), d.failures = 0, d.successes = 0, d.openedAt = null, d.halfOpenAttempts = 0, Jt(t, O.CLOSED, e);
}
function br() {
  return d.current;
}
function _i(e) {
  if (!P.enabled)
    return { allowed: !0, reason: "circuit-breaker-disabled" };
  if (!P.monitoredOperations.includes(e))
    return { allowed: !0, reason: "operation-not-monitored" };
  switch (d.current) {
    case O.CLOSED:
      return { allowed: !0, reason: "circuit-closed", state: O.CLOSED };
    case O.OPEN:
      d.totalBlocked++;
      const t = Date.now() - d.openedAt;
      return {
        allowed: !1,
        reason: "circuit-open",
        state: O.OPEN,
        retryAfter: Math.max(0, P.timeout - t),
        blockedCount: d.totalBlocked
      };
    case O.HALF_OPEN:
      return d.halfOpenAttempts < P.halfOpenMaxAttempts ? (d.halfOpenAttempts++, {
        allowed: !0,
        reason: "circuit-half-open-testing",
        state: O.HALF_OPEN,
        attempt: d.halfOpenAttempts,
        maxAttempts: P.halfOpenMaxAttempts
      }) : (d.totalBlocked++, {
        allowed: !1,
        reason: "circuit-half-open-limit-reached",
        state: O.HALF_OPEN
      });
    default:
      return { allowed: !0, reason: "unknown-state" };
  }
}
function Ni(e) {
  if (d.lastSuccess = Date.now(), d.totalSuccesses++, !!P.enabled && P.monitoredOperations.includes(e)) {
    switch (d.current) {
      case O.CLOSED:
        P.resetOnSuccess && (d.failures = 0);
        break;
      case O.HALF_OPEN:
        d.successes++, d.successes >= P.successThreshold && Ti("success-threshold-reached");
        break;
      case O.OPEN:
        vr("unexpected-success-in-open");
        break;
    }
    Un("circuit-breaker:success", { operation: e, state: d.current });
  }
}
function So(e, t) {
  if (d.lastFailure = Date.now(), d.totalFailures++, !!P.enabled && P.monitoredOperations.includes(e)) {
    switch (d.current) {
      case O.CLOSED:
        d.failures++, d.failures >= P.failureThreshold && vn("failure-threshold-reached");
        break;
      case O.HALF_OPEN:
        vn("failure-in-half-open");
        break;
    }
    Un("circuit-breaker:failure", { operation: e, error: t == null ? void 0 : t.message, state: d.current });
  }
}
function Er() {
  const e = d.current;
  return d = {
    current: O.CLOSED,
    failures: 0,
    successes: 0,
    lastFailure: null,
    lastSuccess: null,
    lastStateChange: Date.now(),
    openedAt: null,
    halfOpenAttempts: 0,
    totalFailures: d.totalFailures,
    totalSuccesses: d.totalSuccesses,
    totalBlocked: d.totalBlocked,
    stateHistory: d.stateHistory
  }, e !== O.CLOSED && Jt(e, O.CLOSED, "manual-reset"), { ok: !0, previousState: e };
}
function Mi(e = "manual") {
  return vn(`forced:${e}`), { ok: !0, state: O.OPEN };
}
function Pi() {
  return { ...P };
}
function kr() {
  const e = Date.now();
  return {
    state: d.current,
    enabled: P.enabled,
    currentFailures: d.failures,
    currentSuccesses: d.successes,
    totalFailures: d.totalFailures,
    totalSuccesses: d.totalSuccesses,
    totalBlocked: d.totalBlocked,
    lastFailure: d.lastFailure,
    lastSuccess: d.lastSuccess,
    lastStateChange: d.lastStateChange,
    timeInCurrentState: e - d.lastStateChange,
    openedAt: d.openedAt,
    timeOpen: d.openedAt ? e - d.openedAt : 0,
    stateChanges: d.stateHistory.length
  };
}
function Hi() {
  const e = kr(), t = {
    enabled: P.enabled,
    configValid: P.failureThreshold > 0 && P.timeout > 0,
    notOpen: d.current !== O.OPEN,
    lowFailureRate: e.totalSuccesses === 0 || e.totalFailures / (e.totalSuccesses + e.totalFailures) < 0.3
  }, n = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
  let r = "HEALTHY";
  return d.current === O.OPEN ? r = "UNHEALTHY" : d.current === O.HALF_OPEN ? r = "DEGRADED" : t.lowFailureRate || (r = "DEGRADED"), {
    status: r,
    score: `${n}/${o}`,
    checks: t,
    state: d.current,
    metrics: {
      failures: d.failures,
      threshold: P.failureThreshold,
      totalBlocked: d.totalBlocked
    },
    version: Pn,
    moduleId: Hn,
    timestamp: Date.now()
  };
}
function Or() {
  return {
    moduleId: Hn,
    version: Pn,
    enabled: P.enabled,
    state: d.current,
    config: Pi(),
    metrics: kr(),
    recentHistory: d.stateHistory.slice(-5),
    timestamp: Date.now()
  };
}
const Ui = "1.0.0", Ar = "overlay-kernel-orphan-detector", Bi = {
  enabled: !0,
  autoScanEnabled: !1,
  scanInterval: 3e4,
  minAgeToConsiderOrphan: 5e3,
  autoCleanup: !1,
  containerSelector: "#overlay-container",
  overlaySelector: "[data-overlay-id]",
  onOrphanDetected: null,
  onOrphanCleaned: null
};
let z = { ...Bi }, N = {
  autoScanIntervalId: null,
  lastScan: null,
  scansCount: 0,
  orphansDetected: 0,
  orphansCleaned: 0,
  currentOrphans: []
}, Be = null, bn = null, Ct = null;
function zi(e) {
  e.store && (Be = e.store), e.closeOverlay && (bn = e.closeOverlay), e.eventBus && (Ct = e.eventBus);
}
function Ir(e, t) {
  Ct != null && Ct.emit && Ct.emit(e, { ...t, moduleId: Ar, timestamp: Date.now() });
}
function ji() {
  if (typeof document > "u") return [];
  const e = document.querySelector(z.containerSelector);
  if (!e) {
    const n = document.getElementById("overlay-container") || document.querySelector("[data-overlay-container]");
    if (!n) return [];
    const o = n.querySelectorAll(z.overlaySelector);
    return Array.from(o).map((r) => r.dataset.overlayId).filter(Boolean);
  }
  const t = e.querySelectorAll(z.overlaySelector);
  return Array.from(t).map((n) => n.dataset.overlayId).filter(Boolean);
}
function wr(e) {
  var t, n, o;
  if (!e) return 0;
  const r = ((t = e.runtime) == null ? void 0 : t.createdAt) || ((n = e.runtime) == null ? void 0 : n.openedAt) || e.createdAt || ((o = e.meta) == null ? void 0 : o.createdAt);
  return r ? Date.now() - r : 1 / 0;
}
function Fi(e, t, n) {
  return !n.includes(e) && wr(t) >= z.minAgeToConsiderOrphan;
}
function at() {
  if (!Be)
    return {
      ok: !1,
      error: "store-not-injected",
      orphans: [],
      scanned: 0
    };
  N.lastScan = Date.now(), N.scansCount++;
  const e = Be.getStack ? Be.getStack() : [], t = Be.getOverlays ? Be.getOverlays() : {}, n = ji(), o = [];
  for (const r of e) {
    const s = t[r];
    if (!s) {
      o.push({
        id: r,
        type: "unknown",
        reason: "not-in-store",
        age: 0,
        inDOM: n.includes(r)
      });
      continue;
    }
    Fi(r, s, n) && o.push({
      id: r,
      type: s.type || "unknown",
      reason: "not-in-dom",
      age: wr(s),
      inDOM: !1,
      scope: s.scope
    });
  }
  if (N.currentOrphans = o, N.orphansDetected += o.length, o.length > 0) {
    if (typeof z.onOrphanDetected == "function")
      try {
        z.onOrphanDetected(o);
      } catch {
      }
    Ir("orphan-detector:orphans-found", { count: o.length, orphans: o });
  }
  return {
    ok: !0,
    orphans: o,
    scanned: e.length,
    domCount: n.length,
    timestamp: N.lastScan
  };
}
function qi() {
  return [...N.currentOrphans];
}
function Cr() {
  if (!bn)
    return {
      ok: !1,
      error: "close-function-not-injected",
      cleaned: 0
    };
  at();
  const e = [...N.currentOrphans], t = [], n = [];
  for (const o of e)
    try {
      const r = bn(o.id, "orphan-cleanup");
      if ((r == null ? void 0 : r.ok) !== !1) {
        if (t.push(o.id), N.orphansCleaned++, typeof z.onOrphanCleaned == "function")
          try {
            z.onOrphanCleaned(o);
          } catch {
          }
      } else
        n.push({ id: o.id, reason: (r == null ? void 0 : r.reason) || "unknown" });
    } catch (r) {
      n.push({ id: o.id, reason: r.message });
    }
  return N.currentOrphans = N.currentOrphans.filter(
    (o) => !t.includes(o.id)
  ), t.length > 0 && Ir("orphan-detector:cleanup-complete", { cleaned: t.length, failed: n.length }), {
    ok: !0,
    cleaned: t,
    failed: n,
    cleanedCount: t.length,
    failedCount: n.length
  };
}
function Gi(e) {
  N.autoScanIntervalId && Sr();
  const t = e;
  return z.autoScanEnabled = !0, N.autoScanIntervalId = setInterval(() => {
    const n = at();
    z.autoCleanup && n.orphans.length > 0 && Cr();
  }, t), at(), {
    ok: !0,
    interval: t,
    autoCleanup: z.autoCleanup
  };
}
function Sr() {
  return z.autoScanEnabled = !1, N.autoScanIntervalId && (clearInterval(N.autoScanIntervalId), N.autoScanIntervalId = null), { ok: !0 };
}
function Bn() {
  return z.autoScanEnabled && N.autoScanIntervalId !== null;
}
function Vi() {
  return { ...z };
}
function Ki() {
  return {
    enabled: z.enabled,
    autoScanEnabled: Bn(),
    autoCleanup: z.autoCleanup,
    scansCount: N.scansCount,
    lastScan: N.lastScan,
    orphansDetected: N.orphansDetected,
    orphansCleaned: N.orphansCleaned,
    currentOrphanCount: N.currentOrphans.length
  };
}
function Wi() {
  return {
    moduleId: Ar,
    version: Ui,
    enabled: z.enabled,
    autoScanEnabled: Bn(),
    config: Vi(),
    metrics: Ki(),
    currentOrphans: qi(),
    timestamp: Date.now()
  };
}
const Yi = "1.0.0", Qi = "overlay-layer-snapshot-manager", _t = "1.0.0", Xi = Object.freeze({
  maxSnapshots: 10,
  includeMetrics: !0,
  includeTimestamps: !0,
  compressData: !1
});
let zn = Object.assign({}, Xi);
const se = {
  snapshots: [],
  lastSnapshot: null,
  snapshotsCreated: 0,
  restoresPerformed: 0
}, qe = {
  store: null,
  openOverlay: null,
  closeOverlay: null
};
function Ji(e) {
  e.store && (qe.store = e.store), e.openOverlay && (qe.openOverlay = e.openOverlay), e.closeOverlay && (qe.closeOverlay = e.closeOverlay);
}
function Dr() {
  return qe.store;
}
function Zi() {
  return qe.openOverlay;
}
function el() {
  return qe.closeOverlay;
}
function tl() {
  return Object.assign({}, zn);
}
function Rr() {
  return zn.maxSnapshots;
}
function nl() {
  return zn.includeMetrics;
}
function Lr() {
  return se.snapshots;
}
function ol(e) {
  se.snapshots.push(e);
}
function rl(e) {
  se.snapshots.splice(e, 1);
}
function sl() {
  const e = se.snapshots.length;
  return se.snapshots = [], e;
}
function al() {
  return se.snapshots.length;
}
function il() {
  return se.lastSnapshot;
}
function $r(e) {
  se.lastSnapshot = e;
}
function ll() {
  return se.snapshotsCreated;
}
function cl() {
  se.snapshotsCreated++;
}
function ul() {
  return se.restoresPerformed;
}
function dl() {
  se.restoresPerformed++;
}
function fl(e) {
  return e ? {
    id: e.id,
    type: e.type,
    scope: e.scope || "global",
    content: typeof e.content == "string" ? e.content : null,
    config: e.config ? Object.assign({}, e.config) : {},
    meta: e.meta ? Object.assign({}, e.meta) : {},
    data: e.data ? Object.assign({}, e.data) : {},
    runtime: e.runtime ? {
      visible: e.runtime.visible,
      createdAt: e.runtime.createdAt,
      openedAt: e.runtime.openedAt
    } : null
  } : null;
}
function pl(e, t) {
  const n = {};
  for (let o = 0; o < e.length; o++) {
    const r = e[o], s = t[r];
    s && (n[r] = fl(s));
  }
  return n;
}
function xr(e) {
  e = e || {};
  const t = Dr();
  if (!t)
    return { ok: !1, error: "store-not-injected", snapshot: null };
  const n = t.getStack ? t.getStack() : [], o = t.getOverlays ? t.getOverlays() : {}, r = Date.now(), s = pl(n, o), a = {
    version: _t,
    timestamp: r,
    id: `snapshot-${r}-${Math.random().toString(36).slice(2, 8)}`,
    name: e.name || null,
    description: e.description || null,
    stack: n.slice(),
    overlays: s,
    metadata: {
      source: e.source || "manual",
      overlayCount: n.length,
      hasBlocking: n.some((c) => {
        const f = o[c];
        return f && f.config && f.config.blocking || f && f.type === "modal";
      })
    }
  };
  nl() && t.getMetrics && (a.storeMetrics = t.getMetrics()), ol({
    id: a.id,
    timestamp: r,
    name: a.name,
    overlayCount: n.length,
    data: a
  });
  const u = Lr(), i = Rr();
  for (; u.length > i; )
    rl(0);
  return $r(a), cl(), {
    ok: !0,
    snapshot: a,
    id: a.id
  };
}
function gl(e, t) {
  t = t || {};
  const n = Dr(), o = Zi(), r = el();
  if (!n)
    return { ok: !1, error: "store-not-injected" };
  if (!e || !e.version)
    return { ok: !1, error: "invalid-snapshot" };
  if (e.version !== _t && !t.ignoreVersion)
    return {
      ok: !1,
      error: "version-mismatch",
      expected: _t,
      received: e.version
    };
  const s = {
    closed: [],
    opened: [],
    failed: [],
    skipped: []
  };
  if (t.clearCurrent !== !1 && r) {
    const a = n.getStack ? n.getStack() : [];
    for (let u = 0; u < a.length; u++) {
      const i = a[u];
      try {
        const c = r(i, "snapshot-restore");
        c && c.ok !== !1 ? s.closed.push(i) : s.failed.push({ id: i, action: "close", reason: c ? c.reason : "unknown" });
      } catch (c) {
        s.failed.push({ id: i, action: "close", reason: c.message });
      }
    }
  }
  if (o && e.stack && e.overlays)
    for (let a = 0; a < e.stack.length; a++) {
      const u = e.stack[a], i = e.overlays[u];
      if (!i) {
        s.skipped.push({ id: u, reason: "no-data" });
        continue;
      }
      if (!i.content && t.requireContent) {
        s.skipped.push({ id: u, reason: "no-content" });
        continue;
      }
      try {
        const c = {
          id: t.preserveIds ? i.id : void 0,
          type: i.type,
          scope: i.scope,
          content: i.content,
          config: i.config,
          meta: Object.assign({}, i.meta, {
            restoredFrom: e.id,
            restoredAt: Date.now()
          }),
          data: i.data
        }, f = o(c, {
          bypassRateLimit: !0,
          bypassKernelCheck: t.bypassKernelCheck
        });
        if (f && f.ok)
          s.opened.push(f.id || i.id);
        else {
          let b = "unknown";
          f && (b = f.reason || (f.errors ? f.errors.join(", ") : "unknown")), s.failed.push({ id: i.id, action: "open", reason: b });
        }
      } catch (c) {
        s.failed.push({ id: i.id, action: "open", reason: c.message });
      }
    }
  return dl(), {
    ok: s.failed.length === 0,
    results: s,
    snapshotId: e.id,
    closedCount: s.closed.length,
    openedCount: s.opened.length,
    failedCount: s.failed.length,
    skippedCount: s.skipped.length
  };
}
function jn() {
  return Lr().map((t) => ({
    id: t.id,
    timestamp: t.timestamp,
    name: t.name,
    overlayCount: t.overlayCount,
    imported: t.imported || !1
  }));
}
function ml() {
  const e = sl();
  return $r(null), { ok: !0, cleared: e };
}
function yl() {
  const e = il();
  return {
    snapshotsStored: al(),
    maxSnapshots: Rr(),
    snapshotsCreated: ll(),
    restoresPerformed: ul(),
    lastSnapshotAt: e ? e.timestamp : null
  };
}
function hl() {
  return {
    moduleId: Qi,
    version: Yi,
    formatVersion: _t,
    config: tl(),
    metrics: yl(),
    snapshots: jn(),
    timestamp: Date.now()
  };
}
const vl = "1.0.0", bl = "overlay-layer-lifecycle-hooks", Xe = [
  "beforeOpen",
  "afterOpen",
  "beforeClose",
  "afterClose",
  "beforeUpdate",
  "afterUpdate",
  "beforeCloseAll",
  "afterCloseAll",
  "beforeCloseMany",
  "afterCloseMany"
], El = {
  enabled: !0,
  asyncHooks: !0,
  timeoutMs: 5e3,
  continueOnError: !0,
  logErrors: !0
}, kl = "overlay-layer.core.lifecycle-hooks.state";
let le = { ...El };
const F = {}, $ = {
  totalCalls: 0,
  cancelledByHook: 0,
  errors: 0,
  hookExecutions: {}
};
let St = null;
function Ol(e) {
  St = e;
}
function Al() {
  for (const e of Xe)
    F[e] || (F[e] = []), $.hookExecutions[e] || ($.hookExecutions[e] = { calls: 0, cancelled: 0, errors: 0 });
}
function Tr(e, t) {
  le.logErrors && (St != null && St.error) && St.error(`[${kl}]`, e, (t == null ? void 0 : t.message) || t);
}
function vt(e) {
  return Xe.includes(e);
}
Al();
function Il(e, t, n = {}) {
  if (!vt(e))
    throw new Error(`Invalid hook type: ${e}. Valid types: ${Xe.join(", ")}`);
  if (typeof t != "function")
    throw new Error("Hook handler must be a function");
  const o = {
    id: `hook-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    handler: t,
    priority: n.priority || 0,
    once: n.once || !1,
    name: n.name || null,
    async: n.async !== !1
  };
  return F[e].push(o), F[e].sort((r, s) => s.priority - r.priority), () => Zt(e, o.id);
}
function Zt(e, t) {
  if (!vt(e)) return !1;
  const n = F[e].length;
  return typeof t == "string" ? F[e] = F[e].filter((o) => o.id !== t) : typeof t == "function" && (F[e] = F[e].filter((o) => o.handler !== t)), F[e].length < n;
}
async function De(e, t = {}) {
  if (!le.enabled)
    return { ok: !0, skipped: !0, reason: "hooks-disabled" };
  if (!vt(e))
    return { ok: !1, error: `Invalid hook type: ${e}` };
  const n = F[e];
  if (!n || n.length === 0)
    return { ok: !0, executed: 0, cancelled: !1 };
  $.totalCalls++, $.hookExecutions[e].calls++;
  const o = [], r = [];
  let s = !1, a = null, u = { ...t };
  for (const i of n) {
    if (s && e.startsWith("before"))
      break;
    try {
      let c;
      i.async && le.asyncHooks ? c = await Promise.race([
        Promise.resolve(i.handler(u, { type: e, hookId: i.id })),
        new Promise(
          (f, b) => setTimeout(() => b(new Error("Hook timeout")), le.timeoutMs)
        )
      ]) : c = i.handler(u, { type: e, hookId: i.id }), o.push({ hookId: i.id, name: i.name, result: c, error: null }), e.startsWith("before") && (c === !1 ? (s = !0, a = `Cancelled by hook: ${i.name || i.id}`, $.cancelledByHook++, $.hookExecutions[e].cancelled++) : c && typeof c == "object" && (c.cancel === !0 ? (s = !0, a = c.reason || `Cancelled by hook: ${i.name || i.id}`, $.cancelledByHook++, $.hookExecutions[e].cancelled++) : c.modified && (u = { ...u, ...c.modified }))), i.once && r.push(i.id);
    } catch (c) {
      if ($.errors++, $.hookExecutions[e].errors++, Tr(`Error in hook ${i.name || i.id}:`, c), o.push({ hookId: i.id, name: i.name, result: null, error: c.message }), !le.continueOnError)
        return {
          ok: !1,
          error: `Hook error: ${c.message}`,
          hookId: i.id,
          executed: o.length,
          cancelled: !1
        };
    }
  }
  for (const i of r)
    Zt(e, i);
  return {
    ok: !s,
    executed: o.length,
    cancelled: s,
    cancelReason: a,
    modifiedContext: e.startsWith("before") ? u : null,
    results: o
  };
}
function Do(e, t = {}) {
  if (!le.enabled)
    return { ok: !0, skipped: !0, reason: "hooks-disabled" };
  if (!vt(e))
    return { ok: !1, error: `Invalid hook type: ${e}` };
  const n = F[e];
  if (!n || n.length === 0)
    return { ok: !0, executed: 0, cancelled: !1 };
  $.totalCalls++, $.hookExecutions[e].calls++;
  const o = [], r = [];
  let s = !1, a = null, u = { ...t };
  for (const i of n) {
    if (s && e.startsWith("before"))
      break;
    try {
      const c = i.handler(u, { type: e, hookId: i.id });
      o.push({ hookId: i.id, name: i.name, result: c, error: null }), e.startsWith("before") && (c === !1 ? (s = !0, a = `Cancelled by hook: ${i.name || i.id}`, $.cancelledByHook++, $.hookExecutions[e].cancelled++) : c && typeof c == "object" && (c.cancel === !0 ? (s = !0, a = c.reason || `Cancelled by hook: ${i.name || i.id}`, $.cancelledByHook++, $.hookExecutions[e].cancelled++) : c.modified && (u = { ...u, ...c.modified }))), i.once && r.push(i.id);
    } catch (c) {
      if ($.errors++, $.hookExecutions[e].errors++, Tr(`Error in hook ${i.name || i.id}:`, c), o.push({ hookId: i.id, name: i.name, result: null, error: c.message }), !le.continueOnError)
        return {
          ok: !1,
          error: `Hook error: ${c.message}`,
          hookId: i.id,
          executed: o.length,
          cancelled: !1
        };
    }
  }
  for (const i of r)
    Zt(e, i);
  return {
    ok: !s,
    executed: o.length,
    cancelled: s,
    cancelReason: a,
    modifiedContext: e.startsWith("before") ? u : null,
    results: o
  };
}
function me(e) {
  return vt(e) ? F[e] && F[e].length > 0 : !1;
}
function wl(e) {
  var t;
  let n = 0;
  for (const o of Xe)
    n += ((t = F[o]) == null ? void 0 : t.length) || 0;
  return n;
}
function Cl(e) {
  const t = {};
  for (const n of Xe)
    t[n] = F[n].map((o) => ({
      id: o.id,
      name: o.name,
      priority: o.priority,
      once: o.once
    }));
  return t;
}
function Sl(e) {
  e.logger && Ol(e.logger);
}
function Dl() {
  return { ...le };
}
function Rl() {
  return le.enabled;
}
function Ll() {
  return {
    enabled: le.enabled,
    totalHooks: wl(),
    totalCalls: $.totalCalls,
    cancelledByHook: $.cancelledByHook,
    errors: $.errors,
    byType: { ...$.hookExecutions }
  };
}
function $l() {
  return {
    moduleId: bl,
    version: vl,
    enabled: le.enabled,
    hookTypes: Xe,
    config: Dl(),
    metrics: Ll(),
    hooks: Cl(),
    timestamp: Date.now()
  };
}
const Fn = "1.0.0", qn = "overlay-kernel-pending-queue", xl = {
  enabled: !0,
  maxSize: 20,
  maxAge: 6e4,
  autoProcess: !0,
  processInterval: 5e3,
  processOnModeChange: !0,
  retryLimit: 3
}, H = { ...xl };
let D = [];
const U = {
  processIntervalId: null,
  totalEnqueued: 0,
  totalProcessed: 0,
  totalExpired: 0,
  totalFailed: 0,
  lastProcess: null
}, ne = {
  openOverlay: null,
  canOpenOverlay: null,
  eventBus: null
};
function Gn(e) {
  D = e;
}
function it(e, t) {
  var n;
  (n = ne.eventBus) != null && n.emit && ne.eventBus.emit(e, { ...t, moduleId: qn, timestamp: Date.now() });
}
function Tl(e) {
  var t;
  e.openOverlay && (ne.openOverlay = e.openOverlay), e.canOpenOverlay && (ne.canOpenOverlay = e.canOpenOverlay), e.eventBus && (ne.eventBus = e.eventBus), H.processOnModeChange && ((t = ne.eventBus) != null && t.on) && ne.eventBus.on("overlay:mode-change", () => {
    H.autoProcess && Promise.resolve().then(() => Ul).then((n) => n.process());
  });
}
function _l() {
  return `queue-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
function Dt(e, t, n = {}) {
  var o;
  if (!H.enabled)
    return { ok: !1, error: "queue-disabled" };
  if (D.length >= H.maxSize)
    if (n.evictOldest) {
      const a = D.shift();
      it("overlay:queue-evicted", { id: a.queueId, reason: "max-size" });
    } else
      return { ok: !1, error: "queue-full", maxSize: H.maxSize };
  const r = {
    queueId: _l(),
    descriptor: { ...e },
    reason: t,
    enqueuedAt: Date.now(),
    expiresAt: Date.now() + (n.maxAge || H.maxAge),
    retries: 0,
    maxRetries: n.retryLimit || H.retryLimit,
    priority: ((o = e.config) == null ? void 0 : o.priority) || n.priority || 50,
    options: n.openOptions || {}
  };
  let s = !1;
  for (let a = 0; a < D.length; a++)
    if (r.priority > D[a].priority) {
      D.splice(a, 0, r), s = !0;
      break;
    }
  return s || D.push(r), U.totalEnqueued++, it("overlay:queued", {
    queueId: r.queueId,
    type: e.type,
    reason: t,
    priority: r.priority,
    queueSize: D.length
  }), {
    ok: !0,
    queueId: r.queueId,
    position: D.findIndex((a) => a.queueId === r.queueId) + 1,
    queueSize: D.length
  };
}
function _r() {
  return D.map((e) => ({
    queueId: e.queueId,
    type: e.descriptor.type,
    reason: e.reason,
    priority: e.priority,
    enqueuedAt: e.enqueuedAt,
    expiresAt: e.expiresAt,
    retries: e.retries,
    age: Date.now() - e.enqueuedAt
  }));
}
function Nl() {
  const e = D.length;
  return Gn([]), it("overlay:queue-cleared", { count: e }), { ok: !0, cleared: e };
}
function Ml() {
  const e = Date.now(), t = [], n = D.filter((o) => o.expiresAt <= e ? (t.push(o), U.totalExpired++, !1) : !0);
  return Gn(n), t.length > 0 && it("overlay:queue-expired", {
    count: t.length,
    items: t.map((o) => ({ queueId: o.queueId, type: o.descriptor.type }))
  }), { ok: !0, expired: t.length };
}
const Pl = "3.0.0-ELEVATION", Hl = "overlay-layer.kernel.pending-queue.process";
function en() {
  if (!H.enabled || D.length === 0)
    return { ok: !0, processed: 0, remaining: D.length };
  if (U.lastProcess = Date.now(), Ml(), !ne.openOverlay)
    return { ok: !1, error: "open-function-not-injected" };
  const e = {
    processed: 0,
    opened: [],
    requeued: [],
    failed: [],
    expired: []
  }, t = [...D];
  Gn([]);
  for (const n of t) {
    if (n.expiresAt <= Date.now()) {
      e.expired.push(n.queueId), U.totalExpired++;
      continue;
    }
    if (ne.canOpenOverlay) {
      const o = ne.canOpenOverlay(n.descriptor.type, {
        scope: n.descriptor.scope || "global"
      });
      if (!o.allowed) {
        n.retries++, n.retries >= n.maxRetries ? (e.failed.push({
          queueId: n.queueId,
          reason: "max-retries-exceeded",
          lastBlockReason: o.reason
        }), U.totalFailed++) : (D.push(n), e.requeued.push(n.queueId));
        continue;
      }
    }
    try {
      const o = ne.openOverlay(n.descriptor, {
        ...n.options,
        bypassRateLimit: !0,
        fromQueue: !0
      });
      o != null && o.ok ? (e.opened.push({
        queueId: n.queueId,
        overlayId: o.id,
        waitTime: Date.now() - n.enqueuedAt
      }), e.processed++, U.totalProcessed++, it("overlay:queue-processed", {
        queueId: n.queueId,
        overlayId: o.id,
        waitTime: Date.now() - n.enqueuedAt
      })) : (n.retries++, n.retries >= n.maxRetries ? (e.failed.push({
        queueId: n.queueId,
        reason: "open-failed",
        errors: o == null ? void 0 : o.errors
      }), U.totalFailed++) : (D.push(n), e.requeued.push(n.queueId)));
    } catch (o) {
      n.retries++, n.retries >= n.maxRetries ? (e.failed.push({
        queueId: n.queueId,
        reason: "exception",
        error: o.message
      }), U.totalFailed++) : (D.push(n), e.requeued.push(n.queueId));
    }
  }
  return {
    ok: !0,
    processed: e.processed,
    remaining: D.length,
    results: e
  };
}
function Nr(e) {
  U.processIntervalId && Vn();
  const t = e || H.processInterval;
  return H.autoProcess = !0, U.processIntervalId = setInterval(() => {
    H.autoProcess && D.length > 0 && en();
  }, t), { ok: !0, interval: t };
}
function Vn() {
  return H.autoProcess = !1, U.processIntervalId && (clearInterval(U.processIntervalId), U.processIntervalId = null), { ok: !0 };
}
function Mr() {
  return H.autoProcess && U.processIntervalId !== null;
}
const Ul = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: Hl,
  VERSION: Pl,
  isAutoProcessEnabled: Mr,
  process: en,
  startAutoProcess: Nr,
  stopAutoProcess: Vn
}, Symbol.toStringTag, { value: "Module" }));
function Bl() {
  return D.length;
}
function Ro() {
  return D.length >= H.maxSize;
}
function zl() {
  return { ...H };
}
function fn() {
  return H.enabled;
}
function Pr() {
  return {
    enabled: H.enabled,
    autoProcess: Mr(),
    currentSize: D.length,
    maxSize: H.maxSize,
    totalEnqueued: U.totalEnqueued,
    totalProcessed: U.totalProcessed,
    totalExpired: U.totalExpired,
    totalFailed: U.totalFailed,
    lastProcess: U.lastProcess
  };
}
function jl() {
  const e = Pr(), t = e.currentSize / e.maxSize * 100, n = {
    enabled: H.enabled,
    notFull: !Ro(),
    lowUtilization: t < 80,
    hasOpenFunction: !!ne.openOverlay
  }, o = Object.values(n).filter(Boolean).length, r = Object.keys(n).length;
  let s = "HEALTHY";
  return n.hasOpenFunction ? (Ro() || o < r) && (s = "DEGRADED") : s = "UNHEALTHY", {
    status: s,
    score: `${o}/${r}`,
    checks: n,
    queue: {
      size: e.currentSize,
      maxSize: e.maxSize,
      utilization: `${t.toFixed(0)}%`
    },
    version: Fn,
    moduleId: qn,
    timestamp: Date.now()
  };
}
function Hr() {
  return {
    moduleId: qn,
    version: Fn,
    enabled: H.enabled,
    config: zl(),
    metrics: Pr(),
    queue: _r(),
    timestamp: Date.now()
  };
}
const Fl = "1.0.0", ql = "overlay-layer-template-registry", Gl = {
  enabled: !0,
  allowOverwrite: !1,
  validateOnRegister: !0
}, Ur = {
  confirm: {
    type: "dialog",
    scope: "global",
    config: {
      blocking: !0,
      closable: !0,
      backdrop: !0,
      backdropClose: !1,
      escapeClose: !0,
      priority: 80,
      transition: "scale"
    },
    meta: { template: "confirm", builtin: !0 }
  },
  alert: {
    type: "dialog",
    scope: "global",
    config: {
      blocking: !0,
      closable: !0,
      backdrop: !0,
      backdropClose: !1,
      escapeClose: !0,
      priority: 85,
      transition: "scale"
    },
    meta: { template: "alert", builtin: !0 }
  },
  "toast-success": {
    type: "toast",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !1,
      timeout: 5e3,
      priority: 30,
      transition: "slide-up"
    },
    meta: { template: "toast-success", variant: "success", builtin: !0 }
  },
  "toast-error": {
    type: "toast",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !1,
      timeout: 8e3,
      priority: 35,
      transition: "slide-up"
    },
    meta: { template: "toast-error", variant: "error", builtin: !0 }
  },
  "toast-warning": {
    type: "toast",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !1,
      timeout: 6e3,
      priority: 32,
      transition: "slide-up"
    },
    meta: { template: "toast-warning", variant: "warning", builtin: !0 }
  },
  "toast-info": {
    type: "toast",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !1,
      timeout: 5e3,
      priority: 30,
      transition: "slide-up"
    },
    meta: { template: "toast-info", variant: "info", builtin: !0 }
  },
  loading: {
    type: "loading",
    scope: "global",
    config: {
      blocking: !0,
      closable: !1,
      backdrop: !0,
      backdropClose: !1,
      escapeClose: !1,
      priority: 70,
      transition: "fade"
    },
    meta: { template: "loading", builtin: !0 }
  },
  modal: {
    type: "modal",
    scope: "global",
    config: {
      blocking: !0,
      closable: !0,
      backdrop: !0,
      backdropClose: !0,
      escapeClose: !0,
      priority: 60,
      transition: "fade"
    },
    meta: { template: "modal", builtin: !0 }
  },
  "drawer-left": {
    type: "drawer",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !0,
      backdropClose: !0,
      escapeClose: !0,
      priority: 50,
      transition: "slide-right"
    },
    meta: { template: "drawer-left", position: "left", builtin: !0 }
  },
  "drawer-right": {
    type: "drawer",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !0,
      backdropClose: !0,
      escapeClose: !0,
      priority: 50,
      transition: "slide-left"
    },
    meta: { template: "drawer-right", position: "right", builtin: !0 }
  },
  "sheet-bottom": {
    type: "sheet",
    scope: "global",
    config: {
      blocking: !1,
      closable: !0,
      backdrop: !0,
      backdropClose: !0,
      escapeClose: !0,
      priority: 45,
      transition: "slide-up"
    },
    meta: { template: "sheet-bottom", position: "bottom", builtin: !0 }
  }
}, ce = {}, lt = { ...Gl }, nt = {
  totalRegistered: 0,
  totalApplied: 0,
  totalRemoved: 0
}, En = {
  schemaValidator: null
};
function Vl(e) {
  e.schemaValidator && (En.schemaValidator = e.schemaValidator);
}
function Kl() {
  for (const [e, t] of Object.entries(Ur))
    ce[e] || (ce[e] = { ...t, _builtin: !0 });
}
Kl();
function Wl(e, t, n = {}) {
  var o, r;
  if (!e || typeof e != "string")
    return { ok: !1, error: "invalid-template-id" };
  if (!t || typeof t != "object")
    return { ok: !1, error: "invalid-base-config" };
  if (ce[e] && !lt.allowOverwrite && !n.force)
    return { ok: !1, error: "template-exists", templateId: e };
  if (lt.validateOnRegister && ((o = En.schemaValidator) != null && o.validate)) {
    const a = En.schemaValidator.validate(t);
    if (!a.valid)
      return {
        ok: !1,
        error: "validation-failed",
        errors: a.errors
      };
  }
  const s = (r = ce[e]) == null ? void 0 : r._builtin;
  return ce[e] = {
    ...t,
    meta: {
      ...t.meta,
      templateId: e,
      registeredAt: Date.now(),
      overwrittenBuiltin: s
    },
    _builtin: !1,
    _custom: !0
  }, nt.totalRegistered++, {
    ok: !0,
    templateId: e,
    overwritten: s
  };
}
function Yl(e) {
  const t = ce[e];
  if (!t) return null;
  const { _builtin: n, _custom: o, ...r } = t;
  return { ...r };
}
function tn() {
  return Object.keys(ce).map((e) => ({
    id: e,
    type: ce[e].type,
    builtin: !!ce[e]._builtin,
    custom: !!ce[e]._custom
  }));
}
function Br(e, t) {
  const n = { ...e };
  for (const o of Object.keys(t))
    t[o] && typeof t[o] == "object" && !Array.isArray(t[o]) ? e[o] && typeof e[o] == "object" ? n[o] = Br(e[o], t[o]) : n[o] = { ...t[o] } : t[o] !== void 0 && (n[o] = t[o]);
  return n;
}
function zr(e, t = {}) {
  const n = ce[e];
  if (!n)
    return { ok: !1, error: "template-not-found", templateId: e };
  const { _builtin: o, _custom: r, ...s } = n, a = Br(s, t);
  return a.meta = {
    ...a.meta,
    appliedTemplate: e,
    appliedAt: Date.now()
  }, nt.totalApplied++, {
    ok: !0,
    descriptor: a,
    templateId: e,
    templateType: n.type
  };
}
function Ql() {
  return { ...lt };
}
function Xl() {
  const e = tn();
  return {
    enabled: lt.enabled,
    totalTemplates: e.length,
    builtinCount: e.filter((t) => t.builtin).length,
    customCount: e.filter((t) => t.custom).length,
    totalRegistered: nt.totalRegistered,
    totalApplied: nt.totalApplied,
    totalRemoved: nt.totalRemoved
  };
}
function Jl() {
  return {
    moduleId: ql,
    version: Fl,
    enabled: lt.enabled,
    config: Ql(),
    metrics: Xl(),
    templates: tn(),
    builtinTemplateIds: Object.keys(Ur),
    timestamp: Date.now()
  };
}
const Zl = "1.0.0", ec = "overlay-layer-transitions", tc = {
  enabled: !0,
  defaultTransition: "fade",
  defaultDuration: 300,
  useReducedMotion: !0,
  cssPrefix: "overlay-transition"
}, jr = {
  none: {
    enter: null,
    exit: null,
    duration: 0,
    easing: "linear"
  },
  fade: {
    enter: {
      from: { opacity: "0" },
      to: { opacity: "1" }
    },
    exit: {
      from: { opacity: "1" },
      to: { opacity: "0" }
    },
    duration: 300,
    easing: "ease-out"
  },
  scale: {
    enter: {
      from: { opacity: "0", transform: "scale(0.9)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.9)" }
    },
    duration: 250,
    easing: "ease-out"
  },
  "scale-up": {
    enter: {
      from: { opacity: "0", transform: "scale(0.8)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(1.1)" }
    },
    duration: 300,
    easing: "cubic-bezier(0.34, 1.56, 0.64, 1)"
  },
  "slide-up": {
    enter: {
      from: { opacity: "0", transform: "translateY(20px)" },
      to: { opacity: "1", transform: "translateY(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateY(0)" },
      to: { opacity: "0", transform: "translateY(20px)" }
    },
    duration: 300,
    easing: "ease-out"
  },
  "slide-down": {
    enter: {
      from: { opacity: "0", transform: "translateY(-20px)" },
      to: { opacity: "1", transform: "translateY(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateY(0)" },
      to: { opacity: "0", transform: "translateY(-20px)" }
    },
    duration: 300,
    easing: "ease-out"
  },
  "slide-left": {
    enter: {
      from: { opacity: "0", transform: "translateX(100%)" },
      to: { opacity: "1", transform: "translateX(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateX(0)" },
      to: { opacity: "0", transform: "translateX(100%)" }
    },
    duration: 350,
    easing: "ease-out"
  },
  "slide-right": {
    enter: {
      from: { opacity: "0", transform: "translateX(-100%)" },
      to: { opacity: "1", transform: "translateX(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "translateX(0)" },
      to: { opacity: "0", transform: "translateX(-100%)" }
    },
    duration: 350,
    easing: "ease-out"
  },
  zoom: {
    enter: {
      from: { opacity: "0", transform: "scale(0.5)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.5)" }
    },
    duration: 300,
    easing: "cubic-bezier(0.175, 0.885, 0.32, 1.275)"
  },
  flip: {
    enter: {
      from: { opacity: "0", transform: "perspective(400px) rotateX(-90deg)" },
      to: { opacity: "1", transform: "perspective(400px) rotateX(0)" }
    },
    exit: {
      from: { opacity: "1", transform: "perspective(400px) rotateX(0)" },
      to: { opacity: "0", transform: "perspective(400px) rotateX(90deg)" }
    },
    duration: 400,
    easing: "ease-in-out"
  },
  bounce: {
    enter: {
      from: { opacity: "0", transform: "scale(0.3)" },
      to: { opacity: "1", transform: "scale(1)" }
    },
    exit: {
      from: { opacity: "1", transform: "scale(1)" },
      to: { opacity: "0", transform: "scale(0.3)" }
    },
    duration: 400,
    easing: "cubic-bezier(0.68, -0.55, 0.265, 1.55)"
  }
};
let nc = { ...tc };
function Nt() {
  return nc;
}
const xe = {}, Fr = {
  totalApplied: 0,
  activeTransitions: /* @__PURE__ */ new Map()
};
function oc() {
  return Fr.totalApplied;
}
function qr() {
  return Fr.activeTransitions;
}
function rc() {
  for (const [e, t] of Object.entries(jr))
    xe[e] = { ...t, _builtin: !0 };
}
rc();
function sc(e, t) {
  return !e || typeof e != "string" ? { ok: !1, error: "invalid-name" } : !t || typeof t != "object" ? { ok: !1, error: "invalid-config" } : (xe[e] = {
    enter: t.enter || null,
    exit: t.exit || null,
    duration: t.duration || Nt().defaultDuration,
    easing: t.easing || "ease-out",
    _builtin: !1,
    _custom: !0
  }, { ok: !0, name: e });
}
function ct() {
  return Object.keys(xe).map((e) => ({
    name: e,
    duration: xe[e].duration,
    builtin: !!xe[e]._builtin,
    custom: !!xe[e]._custom
  }));
}
function ac() {
  var e;
  return typeof window > "u" ? !1 : ((e = window.matchMedia) == null ? void 0 : e.call(window, "(prefers-reduced-motion: reduce)").matches) || !1;
}
function ic() {
  let e = 0;
  const t = qr();
  for (const [n, o] of t)
    try {
      o.cancel(), e++;
    } catch {
    }
  return t.clear(), { ok: !0, cancelled: e };
}
function lc() {
  const e = Nt();
  return {
    enabled: e.enabled,
    defaultTransition: e.defaultTransition,
    totalTransitions: Object.keys(xe).length,
    builtinCount: ct().filter((t) => t.builtin).length,
    customCount: ct().filter((t) => t.custom).length,
    totalApplied: oc(),
    activeTransitions: qr().size,
    reducedMotion: ac()
  };
}
function cc() {
  return {
    moduleId: ec,
    version: Zl,
    enabled: Nt().enabled,
    config: Nt(),
    metrics: lc(),
    transitions: ct(),
    builtinNames: Object.keys(jr),
    timestamp: Date.now()
  };
}
const uc = "1.0.0", dc = "overlay-layer-focus-manager", Gr = [
  "a[href]",
  "button:not([disabled])",
  'input:not([disabled]):not([type="hidden"])',
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
  "audio[controls]",
  "video[controls]",
  "details > summary"
].join(", "), fc = Object.freeze({
  enabled: !0,
  autoFocusFirst: !0,
  trapFocus: !0,
  restoreFocus: !0,
  focusDelay: 50,
  scrollIntoView: !0,
  historyLimit: 10
}), C = {
  config: Object.assign({}, fc),
  trapped: !1,
  trapElement: null,
  trapHandler: null,
  savedFocus: null,
  focusHistory: [],
  totalTraps: 0,
  totalRestores: 0
};
function nn() {
  return C.config;
}
function Kn() {
  return C.trapped;
}
function Vr(e) {
  C.trapped = !!e;
}
function Kr(e) {
  C.trapElement = e;
}
function pc() {
  return C.trapHandler;
}
function Wr(e) {
  C.trapHandler = e;
}
function gc() {
  C.totalTraps++;
}
function mc() {
  return C.savedFocus;
}
function kn(e) {
  C.savedFocus = e;
}
function yc() {
  C.totalRestores++;
}
function hc(e) {
  C.focusHistory.push(e);
  const t = C.config.historyLimit;
  for (; C.focusHistory.length > t; )
    C.focusHistory.shift();
}
function vc() {
  return {
    enabled: C.config.enabled,
    trapped: C.trapped,
    totalTraps: C.totalTraps,
    totalRestores: C.totalRestores,
    historyLength: C.focusHistory.length
  };
}
function Yr() {
  return {
    trapped: C.trapped,
    trapElement: C.trapElement ? C.trapElement.tagName : null,
    hasSavedFocus: !!C.savedFocus,
    savedFocusElement: C.savedFocus ? C.savedFocus.tagName : null,
    historyLength: C.focusHistory.length
  };
}
function On(e) {
  return !e || typeof e.querySelectorAll != "function" ? [] : Array.from(e.querySelectorAll(Gr)).filter((n) => {
    if (n.offsetParent === null && n.style.position !== "fixed" || n.getAttribute("aria-hidden") === "true")
      return !1;
    let o = n.parentElement;
    for (; o; ) {
      if (o.getAttribute("aria-hidden") === "true")
        return !1;
      o = o.parentElement;
    }
    return !0;
  });
}
function bc(e) {
  return On(e)[0] || null;
}
function Ec(e, t) {
  if (t = t || {}, !e || typeof e.focus != "function")
    return { ok: !1, error: "invalid-element" };
  const n = nn(), o = t.delay !== void 0 ? t.delay : n.focusDelay, r = () => {
    try {
      return e.focus({ preventScroll: !n.scrollIntoView }), n.scrollIntoView && t.scrollIntoView !== !1 && e.scrollIntoView && e.scrollIntoView({ block: "nearest", behavior: "smooth" }), { ok: !0, element: e.tagName };
    } catch (s) {
      return { ok: !1, error: s.message };
    }
  };
  return o > 0 ? new Promise((s) => {
    setTimeout(() => {
      s(r());
    }, o);
  }) : r();
}
function kc() {
  if (typeof document > "u")
    return { ok: !1, error: "no-document" };
  const e = document.activeElement;
  return e && e !== document.body ? (kn(e), hc({
    element: e,
    timestamp: Date.now()
  }), { ok: !0, element: e.tagName, id: e.id }) : { ok: !1, error: "no-active-element" };
}
function Oc(e) {
  e = e || {};
  const t = nn();
  if (!t.restoreFocus && !e.force)
    return { ok: !1, skipped: !0, reason: "restore-disabled" };
  const n = e.element || mc();
  if (!n)
    return { ok: !1, error: "no-saved-focus" };
  if (typeof document < "u" && !document.contains(n))
    return kn(null), { ok: !1, error: "element-removed-from-dom" };
  const o = e.delay !== void 0 ? e.delay : t.focusDelay, r = () => {
    try {
      return n.focus({ preventScroll: e.preventScroll }), kn(null), yc(), { ok: !0, element: n.tagName };
    } catch (s) {
      return { ok: !1, error: s.message };
    }
  };
  return o > 0 ? new Promise((s) => {
    setTimeout(() => {
      s(r());
    }, o);
  }) : r();
}
function Ac(e, t) {
  t = t || {};
  const n = nn();
  if (!n.enabled || !n.trapFocus)
    return { ok: !1, skipped: !0, reason: "trap-disabled" };
  if (!e || typeof e != "object")
    return { ok: !1, error: "invalid-container" };
  Kn() && bt(), t.saveFocus !== !1 && kc();
  const o = (r) => {
    if (r.key !== "Tab") return;
    const s = On(e);
    if (s.length === 0) return;
    const a = s[0], u = s[s.length - 1], i = document.activeElement;
    r.shiftKey ? (i === a || !e.contains(i)) && (r.preventDefault(), u.focus()) : (i === u || !e.contains(i)) && (r.preventDefault(), a.focus());
  };
  if (typeof document < "u" && document.addEventListener("keydown", o, !0), Vr(!0), Kr(e), Wr(o), gc(), n.autoFocusFirst && t.autoFocus !== !1) {
    const r = t.initialFocus ? e.querySelector(t.initialFocus) : bc(e);
    r && setTimeout(() => {
      Ec(r);
    }, n.focusDelay);
  }
  return {
    ok: !0,
    trapped: !0,
    container: e.tagName,
    focusableCount: On(e).length
  };
}
function bt(e) {
  if (e = e || {}, !Kn())
    return { ok: !1, error: "not-trapped" };
  const t = pc();
  return typeof document < "u" && t && document.removeEventListener("keydown", t, !0), Vr(!1), Kr(null), Wr(null), e.restoreFocus !== !1 && Oc({ delay: e.restoreDelay }), { ok: !0, released: !0 };
}
function Ic() {
  return Kn();
}
function wc() {
  const e = nn();
  return {
    moduleId: dc,
    version: uc,
    enabled: e.enabled,
    config: Object.assign({}, e),
    state: Yr(),
    metrics: vc(),
    focusableSelectors: Gr,
    timestamp: Date.now()
  };
}
function Cc() {
  return Yr();
}
const Sc = "1.0.0", Dc = "overlay-layer-zindex-manager", Wn = {
  base: { min: 1, max: 99, current: 1 },
  dropdown: { min: 100, max: 199, current: 100 },
  sticky: { min: 200, max: 299, current: 200 },
  tooltip: { min: 300, max: 399, current: 300 },
  popover: { min: 400, max: 499, current: 400 },
  overlay: { min: 500, max: 799, current: 500 },
  modal: { min: 800, max: 999, current: 800 },
  toast: { min: 1e3, max: 1099, current: 1e3 },
  system: { min: 1100, max: 1199, current: 1100 },
  maximum: { min: 1200, max: 9999, current: 1200 }
}, Rc = {
  enabled: !0,
  baseOffset: 0,
  autoRelease: !0,
  trackAllocations: !0
};
let Ee = { ...Rc }, ut = JSON.parse(JSON.stringify(Wn)), we = /* @__PURE__ */ new Map(), Se = {
  totalAcquired: 0,
  totalReleased: 0,
  peakUsage: {}
};
for (const e of Object.keys(Wn))
  Se.peakUsage[e] = 0;
function Qr(e, t = {}) {
  if (!Ee.enabled)
    return { ok: !1, error: "manager-disabled" };
  const n = ut[e];
  if (!n)
    return { ok: !1, error: "invalid-layer", validLayers: Object.keys(ut) };
  if (n.current >= n.max)
    if (t.wrap)
      n.current = n.min;
    else
      return {
        ok: !1,
        error: "layer-exhausted",
        layer: e,
        max: n.max
      };
  const o = n.current + Ee.baseOffset;
  n.current++, Se.totalAcquired++, Ee.trackAllocations && t.id && we.set(t.id, {
    zIndex: o,
    layer: e,
    acquiredAt: Date.now(),
    metadata: t.metadata || {}
  });
  const r = n.current - n.min;
  return r > Se.peakUsage[e] && (Se.peakUsage[e] = r), {
    ok: !0,
    zIndex: o,
    layer: e,
    remaining: n.max - n.current
  };
}
function Xr(e) {
  if (Se.totalReleased++, typeof e == "string") {
    const t = we.get(e);
    return t ? (we.delete(e), { ok: !0, released: e, zIndex: t.zIndex }) : { ok: !1, error: "allocation-not-found" };
  }
  for (const [t, n] of we)
    if (n.zIndex === e)
      return we.delete(t), { ok: !0, released: t, zIndex: e };
  return { ok: !1, error: "zindex-not-tracked" };
}
function Lc(e) {
  const t = ut[e];
  return t ? {
    layer: e,
    min: t.min + Ee.baseOffset,
    max: t.max + Ee.baseOffset,
    current: t.current + Ee.baseOffset,
    used: t.current - t.min,
    remaining: t.max - t.current,
    utilizationPercent: (t.current - t.min) / (t.max - t.min) * 100
  } : null;
}
function $c() {
  const e = [];
  for (const [t, n] of we)
    e.push({
      id: t,
      ...n
    });
  return e.sort((t, n) => t.zIndex - n.zIndex);
}
function xc() {
  return ut = JSON.parse(JSON.stringify(Wn)), we.clear(), { ok: !0, reset: !0 };
}
function Yn() {
  return Object.keys(ut).map((e) => Lc(e));
}
function Tc() {
  return { ...Ee };
}
function _c() {
  const e = Yn();
  return {
    enabled: Ee.enabled,
    totalLayers: e.length,
    totalAcquired: Se.totalAcquired,
    totalReleased: Se.totalReleased,
    activeAllocations: we.size,
    peakUsage: { ...Se.peakUsage },
    layerUtilization: e.reduce((t, n) => (t[n.layer] = `${n.utilizationPercent.toFixed(0)}%`, t), {})
  };
}
function Nc() {
  return {
    moduleId: Dc,
    version: Sc,
    enabled: Ee.enabled,
    config: Tc(),
    layers: Yn(),
    allocations: $c(),
    metrics: _c(),
    timestamp: Date.now()
  };
}
const Qn = "1.0.0", Xn = "overlay-layer-debug-panel.constants", Mc = Object.freeze({
  enabled: !1,
  position: "bottom-right",
  collapsed: !0,
  opacity: 0.95,
  showMetrics: !0,
  showStack: !0,
  showEvents: !0,
  showHealth: !0,
  maxEvents: 50,
  refreshInterval: 1e3,
  hotkey: "ctrl+shift+o"
}), T = {
  config: Object.assign({}, Mc),
  panelElement: null,
  refreshIntervalId: null,
  eventLog: [],
  isVisible: !1,
  overlayLayer: null
};
function ue() {
  return T.config;
}
function on(e) {
  T.config = Object.assign({}, T.config, e);
}
function He() {
  return T.panelElement;
}
function Jr(e) {
  T.panelElement = e;
}
function Pc(e) {
  T.refreshIntervalId = e;
}
function Zr() {
  T.refreshIntervalId && (clearInterval(T.refreshIntervalId), T.refreshIntervalId = null);
}
function Re() {
  return T.isVisible;
}
function es(e) {
  T.isVisible = !!e;
}
function Jn() {
  return T.eventLog;
}
function Hc(e) {
  T.eventLog.push(e);
  const t = T.config.maxEvents;
  for (; T.eventLog.length > t; )
    T.eventLog.shift();
}
function Uc() {
  T.eventLog = [];
}
function Et() {
  return T.overlayLayer;
}
function ts(e) {
  T.overlayLayer = e;
}
function Bc() {
  Zr(), T.panelElement = null, T.eventLog = [], T.isVisible = !1;
}
const zc = '  .overlay-debug-panel {    position: fixed;    z-index: 99999;    font-family: "Monaco", "Consolas", monospace;    font-size: 11px;    background: rgba(0, 0, 0, 0.92);    color: #0f0;    border: 1px solid #0f0;    border-radius: 4px;    max-width: 420px;    max-height: 500px;    overflow: hidden;    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.2);    transition: all 0.2s ease;  }  .overlay-debug-panel.collapsed {    max-height: 32px;    overflow: hidden;  }  .overlay-debug-panel.bottom-right { bottom: 10px; right: 10px; }  .overlay-debug-panel.bottom-left { bottom: 10px; left: 10px; }  .overlay-debug-panel.top-right { top: 10px; right: 10px; }  .overlay-debug-panel.top-left { top: 10px; left: 10px; }  .overlay-debug-header {    background: rgba(0, 255, 0, 0.1);    padding: 6px 10px;    cursor: pointer;    display: flex;    justify-content: space-between;    align-items: center;    border-bottom: 1px solid rgba(0, 255, 0, 0.2);  }  .overlay-debug-header:hover { background: rgba(0, 255, 0, 0.2); }  .overlay-debug-title { font-weight: bold; }  .overlay-debug-status { font-size: 10px; opacity: 0.8; }  .overlay-debug-body {    padding: 8px;    overflow-y: auto;    max-height: 460px;  }  .overlay-debug-section {    margin-bottom: 10px;    padding-bottom: 8px;    border-bottom: 1px solid rgba(0, 255, 0, 0.1);  }  .overlay-debug-section:last-child { border-bottom: none; margin-bottom: 0; }  .overlay-debug-section-title {    color: #0ff;    font-weight: bold;    margin-bottom: 4px;    font-size: 10px;    text-transform: uppercase;  }  .overlay-debug-row {    display: flex;    justify-content: space-between;    padding: 2px 0;  }  .overlay-debug-label { opacity: 0.7; }  .overlay-debug-value { font-weight: bold; }  .overlay-debug-value.healthy { color: #0f0; }  .overlay-debug-value.degraded { color: #ff0; }  .overlay-debug-value.unhealthy { color: #f00; }  .overlay-debug-stack-item {    background: rgba(0, 255, 0, 0.05);    padding: 4px 6px;    margin: 2px 0;    border-radius: 2px;    font-size: 10px;  }  .overlay-debug-event {    font-size: 10px;    padding: 2px 0;    opacity: 0.8;  }  .overlay-debug-event-time { color: #666; margin-right: 6px; }  .overlay-debug-event-type { color: #0ff; }  .overlay-debug-actions {    display: flex;    gap: 4px;    margin-top: 8px;  }  .overlay-debug-btn {    background: rgba(0, 255, 0, 0.1);    border: 1px solid #0f0;    color: #0f0;    padding: 4px 8px;    font-size: 10px;    cursor: pointer;    border-radius: 2px;  }  .overlay-debug-btn:hover { background: rgba(0, 255, 0, 0.2); }';
function jc() {
  if (typeof document > "u" || document.getElementById("overlay-debug-styles")) return;
  const e = document.createElement("style");
  e.id = "overlay-debug-styles", e.textContent = zc, document.head.appendChild(e);
}
function Fc() {
  if (typeof document > "u") return;
  const e = document.getElementById("overlay-debug-styles");
  e && e.remove();
}
function qc() {
  jc();
  const e = ue(), t = document.createElement("div");
  return t.id = "overlay-debug-panel", t.className = `overlay-debug-panel ${e.position}${e.collapsed ? " collapsed" : ""}`, t.style.opacity = e.opacity, t;
}
function Gc() {
  let e = He();
  return e || (e = qc(), document.body.appendChild(e), Jr(e)), e;
}
function Vc() {
  const e = He();
  e && e.parentNode && e.parentNode.removeChild(e), Jr(null);
}
function Kc() {
  const e = He(), t = ue();
  e && (e.className = `overlay-debug-panel ${t.position}${t.collapsed ? " collapsed" : ""}`, e.style.opacity = t.opacity);
}
function Wc(e) {
  const t = new Date(e), n = t.getHours().toString().padStart(2, "0"), o = t.getMinutes().toString().padStart(2, "0"), r = t.getSeconds().toString().padStart(2, "0");
  return `${n}:${o}:${r}`;
}
function Yc(e, t) {
  return `    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Health</div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Status</span>        <span class="overlay-debug-value ${(e.status || "").toLowerCase()}">${e.status || "N/A"}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Score</span>        <span class="overlay-debug-value">${e.scoreDisplay || "N/A"}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Kernel</span>        <span class="overlay-debug-value">${t.kernelIntegrated ? "✓" : "✗"} ${t.kernelMode || "N/A"}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Circuit Breaker</span>        <span class="overlay-debug-value">${t.circuitBreakerState || "N/A"}</span>      </div>    </div>  `;
}
function Qc(e, t) {
  return `    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Metrics</div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Active</span>        <span class="overlay-debug-value">${t.activeCount || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Total Opens</span>        <span class="overlay-debug-value">${e.totalOpens || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Total Closes</span>        <span class="overlay-debug-value">${e.totalCloses || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Queue Size</span>        <span class="overlay-debug-value">${t.pendingQueueSize || 0}</span>      </div>      <div class="overlay-debug-row">        <span class="overlay-debug-label">Focus Trapped</span>        <span class="overlay-debug-value">${t.focusTrapped ? "Yes" : "No"}</span>      </div>    </div>  `;
}
function Xc(e, t) {
  let n = `    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Stack (${e.length})</div>  `;
  const o = t.debug && t.debug.getStore && t.debug.getStore().overlays || {}, r = e.slice(-5).reverse();
  for (let s = 0; s < r.length; s++) {
    const a = r[s], u = o[a] || {}, i = u.config && u.config.zIndex || "auto";
    n += `      <div class="overlay-debug-stack-item">        <strong>${u.type || "unknown"}</strong> - ${a.slice(0, 12)}...        <br>scope: ${u.scope || "global"} | z: ${i}      </div>    `;
  }
  return e.length > 5 && (n += `<div style="opacity:0.5;font-size:10px;">...and ${e.length - 5} more</div>`), n += "</div>", n;
}
function Jc(e) {
  let t = '    <div class="overlay-debug-section">      <div class="overlay-debug-section-title">Recent Events</div>  ';
  const n = e.slice(-10).reverse();
  for (let o = 0; o < n.length; o++) {
    const r = n[o], s = r.id ? ` - ${r.id.slice(0, 8)}` : "";
    t += `      <div class="overlay-debug-event">        <span class="overlay-debug-event-time">${Wc(r.timestamp)}</span>        <span class="overlay-debug-event-type">${r.type}</span>        ${s}      </div>    `;
  }
  return t += "</div>", t;
}
function Zc() {
  return '    <div class="overlay-debug-actions">      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.closeAll()">Close All</button>      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.scanOrphans()">Scan Orphans</button>      <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.exportInfo()">Export</button>    </div>  ';
}
function eu() {
  const e = Et();
  if (!e)
    return '<div class="overlay-debug-body">OverlayLayer not injected</div>';
  const t = ue(), n = e.status && e.status() || {}, o = e.healthCheck && e.healthCheck() || {}, r = e.info && e.info() || {}, s = e.getStack && e.getStack() || [], a = Jn();
  let u = `    <div class="overlay-debug-header" onclick="window.__overlayDebugPanel?.toggle()">      <span class="overlay-debug-title">🔍 Overlay Debug</span>      <span class="overlay-debug-status">${n.activeCount || 0} active | ${o.status || "N/A"}</span>    </div>  `;
  if (!t.collapsed) {
    if (u += '<div class="overlay-debug-body">', t.showHealth && (u += Yc(o, n)), t.showMetrics) {
      const i = r.metrics || {};
      u += Qc(i, n);
    }
    t.showStack && s.length > 0 && (u += Xc(s, e)), t.showEvents && a.length > 0 && (u += Jc(a)), u += Zc(), u += "</div>";
  }
  return u;
}
function dt() {
  const e = He();
  !e || !Re() || (e.innerHTML = eu());
}
function kt(e, t) {
  t = t || {}, Hc({
    type: e,
    id: t.id || null,
    action: t.action || null,
    timestamp: Date.now()
  }), Re() && dt();
}
function ns() {
  return Uc(), Re() && dt(), { ok: !0 };
}
function Zn() {
  const e = Et();
  e && e.closeAll && (e.closeAll({ reason: "debug-panel" }), kt("DEBUG_ACTION", { action: "closeAll" }));
}
function eo() {
  const e = Et();
  if (e && e.scanOrphans) {
    const t = e.scanOrphans(), n = t && t.orphans && t.orphans.length || 0;
    kt("DEBUG_ACTION", { action: "scanOrphans", orphans: n }), n > 0 && console.log("[OverlayDebug] Orphans found:", t.orphans);
  }
}
function to() {
  const e = Et();
  if (e && e.info) {
    const t = e.info();
    console.log("[OverlayDebug] Full Info:", JSON.stringify(t, null, 2)), kt("DEBUG_ACTION", { action: "exportInfo" });
  }
}
function Mt() {
  const e = ue(), t = He(), n = Re(), o = Jn(), r = Et(), s = {
    enabled: e.enabled,
    overlayLayerInjected: !!r,
    panelCreated: !!t || !n
  };
  let a = 0;
  const u = Object.keys(s);
  for (let c = 0; c < u.length; c++)
    s[u[c]] && a++;
  const i = u.length;
  return {
    status: a === i ? "HEALTHY" : "DEGRADED",
    score: `${a}/${i}`,
    checks: s,
    visible: n,
    eventLogSize: o.length,
    version: Qn,
    moduleId: Xn,
    timestamp: Date.now()
  };
}
function Pt() {
  const e = ue(), t = Jn();
  return {
    moduleId: Xn,
    version: Qn,
    enabled: e.enabled,
    visible: Re(),
    collapsed: e.collapsed,
    position: e.position,
    hotkey: e.hotkey,
    eventLogSize: t.length,
    timestamp: Date.now()
  };
}
function os(e) {
  e && e.overlayLayer && ts(e.overlayLayer);
}
function no() {
  if (typeof document > "u")
    return { ok: !1, error: "no-document" };
  const e = Gc();
  es(!0), e.style.display = "block", dt();
  const t = ue();
  if (t.refreshInterval > 0) {
    const n = setInterval(dt, t.refreshInterval);
    Pc(n);
  }
  return { ok: !0 };
}
function rn() {
  es(!1);
  const e = He();
  return e && (e.style.display = "none"), Zr(), { ok: !0 };
}
function oo() {
  return Re() ? rn() : no(), { ok: !0, visible: Re() };
}
function ro() {
  const e = ue();
  on({ collapsed: !e.collapsed });
  const t = He();
  return t && (t.classList.toggle("collapsed", ue().collapsed), dt()), { ok: !0, collapsed: ue().collapsed };
}
function tu() {
  typeof document > "u" || document.addEventListener("keydown", (e) => {
    const o = ue().hotkey.toLowerCase().split("+"), r = o.indexOf("ctrl") >= 0 === e.ctrlKey, s = o.indexOf("shift") >= 0 === e.shiftKey, a = o.indexOf("alt") >= 0 === e.altKey;
    let u = !1;
    for (let i = 0; i < o.length; i++) {
      const c = o[i];
      if (c !== "ctrl" && c !== "shift" && c !== "alt" && e.key.toLowerCase() === c) {
        u = !0;
        break;
      }
    }
    r && s && a && u && (e.preventDefault(), oo());
  });
}
function rs(e) {
  return e && ts(e), tu(), typeof window < "u" && (window.__overlayDebugPanel = {
    toggle: ro,
    closeAll: Zn,
    scanOrphans: eo,
    exportInfo: to
  }), on({ enabled: !0 }), { ok: !0 };
}
function ss() {
  return rn(), Vc(), Fc(), typeof window < "u" && delete window.__overlayDebugPanel, on({ enabled: !1 }), Bc(), { ok: !0 };
}
function as(e) {
  return !e || typeof e != "object" ? !1 : (on(e), Kc(), !0);
}
function is() {
  return Re();
}
function ls() {
  return Object.assign({}, ue());
}
const nu = {
  inject: os,
  init: rs,
  destroy: ss,
  show: no,
  hide: rn,
  toggle: oo,
  toggleCollapse: ro,
  logEvent: kt,
  clearEventLog: ns,
  closeAll: Zn,
  scanOrphans: eo,
  exportInfo: to,
  configure: as,
  getConfig: ls,
  isVisible: is,
  healthCheck: Mt,
  info: Pt,
  VERSION: Qn,
  MODULE_ID: Xn
}, so = "4.0.0-P4-ENTERPRISE", ou = "overlay-layer.telemetry.metrics-collector", ru = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  MODULE_ID: ou,
  VERSION: so,
  clearEventLog: ns,
  closeAll: Zn,
  configure: as,
  default: nu,
  destroy: ss,
  exportInfo: to,
  getConfigExport: ls,
  healthCheck: Mt,
  hide: rn,
  info: Pt,
  init: rs,
  inject: os,
  isVisible: is,
  logEvent: kt,
  scanOrphans: eo,
  show: no,
  toggle: oo,
  toggleCollapse: ro
}, Symbol.toStringTag, { value: "Module" })), sn = "1.0.0", Ht = "overlay-layer-error-boundary", V = {
  RENDER: "RENDER_ERROR",
  LIFECYCLE: "LIFECYCLE_ERROR",
  VALIDATION: "VALIDATION_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  NETWORK: "NETWORK_ERROR",
  PERMISSION: "PERMISSION_ERROR",
  STATE: "STATE_ERROR",
  UNKNOWN: "UNKNOWN_ERROR"
}, Te = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
}, su = {
  enabled: !0,
  maxErrors: 100,
  errorTTL: 3e5,
  autoRecover: !0,
  recoverAttempts: 3,
  recoverDelay: 1e3,
  fallbackContent: null,
  reportErrors: !0,
  logToConsole: !0
};
let Z = { ...su }, de = [], ot = [], au = {};
const Y = {
  totalErrors: 0,
  recoveredErrors: 0,
  fatalErrors: 0,
  lastError: null
};
let Rt = null, Lt = null;
function iu(e) {
  Rt = e;
}
function lu(e) {
  Lt = e;
}
function cu(e) {
  de = e;
}
function uu() {
  return ot;
}
function cs() {
  return au;
}
function Ut(e, ...t) {
  var n;
  Z.logToConsole && (Rt != null && Rt[e] ? Rt[e](`[${Ht}]`, ...t) : typeof console < "u" && ((n = console[e]) == null || n.call(console, `[${Ht}]`, ...t)));
}
function du(e) {
  e.logger && iu(e.logger), e.metricsCollector && lu(e.metricsCollector);
}
function fu(e, t = {}) {
  var n;
  if (t.type) return t.type;
  const o = ((n = e == null ? void 0 : e.message) == null ? void 0 : n.toLowerCase()) || "";
  return o.includes("render") || o.includes("dom") ? V.RENDER : o.includes("timeout") || o.includes("timed out") ? V.TIMEOUT : o.includes("network") || o.includes("fetch") ? V.NETWORK : o.includes("permission") || o.includes("denied") ? V.PERMISSION : o.includes("validation") || o.includes("invalid") ? V.VALIDATION : o.includes("state") || o.includes("undefined") ? V.STATE : o.includes("lifecycle") || o.includes("mount") ? V.LIFECYCLE : V.UNKNOWN;
}
function pu(e, t = {}) {
  if (t.severity) return t.severity;
  switch (e) {
    case V.RENDER:
    case V.STATE:
      return Te.HIGH;
    case V.TIMEOUT:
    case V.NETWORK:
      return Te.MEDIUM;
    case V.VALIDATION:
    case V.PERMISSION:
      return Te.LOW;
    default:
      return Te.MEDIUM;
  }
}
function gu(e, t = {}) {
  const n = fu(e, t), o = pu(n, t);
  return {
    id: `err-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type: n,
    severity: o,
    message: (e == null ? void 0 : e.message) || String(e),
    stack: (e == null ? void 0 : e.stack) || null,
    context: {
      overlayId: t.overlayId || null,
      overlayType: t.overlayType || null,
      operation: t.operation || null,
      ...t
    },
    timestamp: Date.now(),
    recovered: !1,
    recoveryAttempts: 0
  };
}
async function mu(e) {
  const n = cs()[e.type];
  if (!n) return !1;
  for (let o = 1; o <= Z.recoverAttempts; o++) {
    e.recoveryAttempts = o;
    try {
      await new Promise((s) => setTimeout(s, Z.recoverDelay * o));
      const r = await n(e);
      if (r != null && r.recovered)
        return e.recovered = !0, Y.recoveredErrors++, Ut("info", `Error recovered after ${o} attempts:`, e.id), !0;
    } catch (r) {
      Ut("warn", `Recovery attempt ${o} failed:`, r.message);
    }
  }
  return e.severity === Te.HIGH && Y.fatalErrors++, !1;
}
function yu(e, t = {}) {
  if (!Z.enabled) return null;
  const n = gu(e, t);
  for (de.push(n), Y.totalErrors++, Y.lastError = n; de.length > Z.maxErrors; )
    de.shift();
  Ut("error", `[${n.type}] ${n.message}`, {
    severity: n.severity,
    context: n.context
  }), Z.reportErrors && (Lt != null && Lt.recordError) && Lt.recordError(n.context.overlayType, e, n.context);
  const o = uu();
  for (const r of o)
    try {
      r(n);
    } catch (s) {
      Ut("warn", "Error handler threw:", s.message);
    }
  return Z.autoRecover && n.severity !== Te.CRITICAL && mu(n), n;
}
function us(e, t = {}) {
  return async (...n) => {
    try {
      return await e(...n);
    } catch (o) {
      const r = yu(o, t);
      if (t.fallback !== void 0)
        return t.fallback;
      if (Z.fallbackContent !== null && t.returnFallback)
        return { ok: !1, error: r, fallback: Z.fallbackContent };
      if (t.rethrow)
        throw o;
      return { ok: !1, error: r };
    }
  };
}
function ds(e = 20) {
  return de.slice(-e).reverse();
}
function fs() {
  const e = de.length;
  return cu([]), { ok: !0, cleared: e };
}
function hu(e) {
  if (typeof e != "function")
    throw new Error("Handler must be a function");
  return ot.push(e), () => {
    const t = ot.indexOf(e);
    t > -1 && ot.splice(t, 1);
  };
}
function Ot() {
  const e = {}, t = {};
  for (const n of de)
    e[n.type] = (e[n.type] || 0) + 1, t[n.severity] = (t[n.severity] || 0) + 1;
  return {
    total: Y.totalErrors,
    current: de.length,
    recovered: Y.recoveredErrors,
    fatal: Y.fatalErrors,
    recoveryRate: Y.totalErrors > 0 ? `${(Y.recoveredErrors / Y.totalErrors * 100).toFixed(1)}%` : "0%",
    byType: e,
    bySeverity: t,
    hasUnrecovered: de.some((n) => !n.recovered)
  };
}
function vu() {
  return { ...Z };
}
function bu() {
  const e = Ot(), t = de.filter((a) => Date.now() - a.timestamp < 6e4), n = {
    enabled: Z.enabled,
    noFatalErrors: Y.fatalErrors === 0,
    lowRecentErrors: t.length < 10,
    goodRecoveryRate: e.recoveryRate === "0%" || parseFloat(e.recoveryRate) > 50,
    historyNotFull: de.length < Z.maxErrors * 0.9
  }, o = Object.values(n).filter(Boolean).length, r = Object.keys(n).length;
  let s = "HEALTHY";
  return Y.fatalErrors > 0 ? s = "UNHEALTHY" : (t.length >= 10 || o < r) && (s = "DEGRADED"), {
    status: s,
    score: `${o}/${r}`,
    checks: n,
    stats: {
      total: Y.totalErrors,
      recent: t.length,
      fatal: Y.fatalErrors
    },
    version: sn,
    moduleId: Ht,
    timestamp: Date.now()
  };
}
function Eu() {
  const e = cs();
  return {
    moduleId: Ht,
    version: sn,
    enabled: Z.enabled,
    config: vu(),
    stats: Ot(),
    errorTypes: V,
    severityLevels: Te,
    registeredStrategies: Object.keys(e),
    handlerCount: ot.length,
    timestamp: Date.now()
  };
}
const ao = "1.0.0", ku = "overlay-layer-debug-panel.devtools.debug-panel", Ou = {
  enabled: !1,
  position: "bottom-right",
  collapsed: !0,
  opacity: 0.95,
  showMetrics: !0,
  showStack: !0,
  showEvents: !0,
  showHealth: !0,
  maxEvents: 50,
  refreshInterval: 1e3,
  hotkey: "ctrl+shift+o"
};
let x = { ...Ou }, v = {
  panelElement: null,
  refreshIntervalId: null,
  eventLog: [],
  isVisible: !1
}, _ = null;
function Au(e) {
  e.overlayLayer && (_ = e.overlayLayer);
}
const Iu = `
  .overlay-debug-panel {
    position: fixed;
    z-index: 99999;
    font-family: 'Monaco', 'Consolas', monospace;
    font-size: 11px;
    background: rgba(0, 0, 0, 0.92);
    color: #0f0;
    border: 1px solid #0f0;
    border-radius: 4px;
    max-width: 420px;
    max-height: 500px;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 255, 0, 0.2);
  }
  .overlay-debug-panel.collapsed { max-height: 32px; }
  .overlay-debug-panel.bottom-right { bottom: 10px; right: 10px; }
  .overlay-debug-panel.bottom-left { bottom: 10px; left: 10px; }
  .overlay-debug-panel.top-right { top: 10px; right: 10px; }
  .overlay-debug-panel.top-left { top: 10px; left: 10px; }
  .overlay-debug-header {
    background: rgba(0, 255, 0, 0.1);
    padding: 6px 10px;
    cursor: pointer;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border-bottom: 1px solid #0f03;
  }
  .overlay-debug-header:hover { background: rgba(0, 255, 0, 0.2); }
  .overlay-debug-title { font-weight: bold; }
  .overlay-debug-status { font-size: 10px; opacity: 0.8; }
  .overlay-debug-body { padding: 8px; overflow-y: auto; max-height: 460px; }
  .overlay-debug-section { margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #0f02; }
  .overlay-debug-section:last-child { border-bottom: none; margin-bottom: 0; }
  .overlay-debug-section-title { color: #0ff; font-weight: bold; margin-bottom: 4px; font-size: 10px; text-transform: uppercase; }
  .overlay-debug-row { display: flex; justify-content: space-between; padding: 2px 0; }
  .overlay-debug-label { opacity: 0.7; }
  .overlay-debug-value { font-weight: bold; }
  .overlay-debug-value.healthy { color: #0f0; }
  .overlay-debug-value.degraded { color: #ff0; }
  .overlay-debug-value.unhealthy { color: #f00; }
  .overlay-debug-stack-item { background: rgba(0, 255, 0, 0.05); padding: 4px 6px; margin: 2px 0; border-radius: 2px; font-size: 10px; }
  .overlay-debug-event { font-size: 10px; padding: 2px 0; opacity: 0.8; }
  .overlay-debug-event-time { color: #666; margin-right: 6px; }
  .overlay-debug-event-type { color: #0ff; }
  .overlay-debug-actions { display: flex; gap: 4px; margin-top: 8px; }
  .overlay-debug-btn { background: rgba(0, 255, 0, 0.1); border: 1px solid #0f0; color: #0f0; padding: 4px 8px; font-size: 10px; cursor: pointer; border-radius: 2px; }
  .overlay-debug-btn:hover { background: rgba(0, 255, 0, 0.2); }
`;
function wu() {
  if (typeof document < "u" && !document.getElementById("overlay-debug-styles")) {
    const t = document.createElement("style");
    t.id = "overlay-debug-styles", t.textContent = Iu, document.head.appendChild(t);
  }
  const e = document.createElement("div");
  return e.id = "overlay-debug-panel", e.className = `overlay-debug-panel ${x.position} ${x.collapsed ? "collapsed" : ""}`, e.style.opacity = x.opacity, e;
}
function Cu(e) {
  const t = new Date(e);
  return `${t.getHours().toString().padStart(2, "0")}:${t.getMinutes().toString().padStart(2, "0")}:${t.getSeconds().toString().padStart(2, "0")}`;
}
function Su() {
  var e, t, n, o, r, s, a, u;
  if (!_) return '<div class="overlay-debug-body">OverlayLayer not injected</div>';
  const i = ((e = _.status) == null ? void 0 : e.call(_)) || {}, c = ((t = _.healthCheck) == null ? void 0 : t.call(_)) || {}, f = ((n = _.info) == null ? void 0 : n.call(_)) || {}, b = ((o = _.getStack) == null ? void 0 : o.call(_)) || [];
  let g = `
    <div class="overlay-debug-header" onclick="window.__overlayDebugPanel?.toggle()">
      <span class="overlay-debug-title">🔍 Overlay Debug</span>
      <span class="overlay-debug-status">${i.activeCount || 0} active | ${c.status || "N/A"}</span>
    </div>
  `;
  if (!x.collapsed) {
    if (g += '<div class="overlay-debug-body">', x.showHealth) {
      const S = (c.status || "").toLowerCase();
      g += `
        <div class="overlay-debug-section">
          <div class="overlay-debug-section-title">Health</div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Status</span><span class="overlay-debug-value ${S}">${c.status || "N/A"}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Score</span><span class="overlay-debug-value">${c.scoreDisplay || "N/A"}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Kernel</span><span class="overlay-debug-value">${i.kernelIntegrated ? "✓" : "✗"} ${i.kernelMode || "N/A"}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Circuit Breaker</span><span class="overlay-debug-value">${i.circuitBreakerState || "N/A"}</span></div>
        </div>
      `;
    }
    if (x.showMetrics) {
      const S = f.metrics || {};
      g += `
        <div class="overlay-debug-section">
          <div class="overlay-debug-section-title">Metrics</div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Active</span><span class="overlay-debug-value">${i.activeCount || 0}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Total Opens</span><span class="overlay-debug-value">${S.totalOpens || 0}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Queue Size</span><span class="overlay-debug-value">${i.pendingQueueSize || 0}</span></div>
          <div class="overlay-debug-row"><span class="overlay-debug-label">Focus Trapped</span><span class="overlay-debug-value">${i.focusTrapped ? "Yes" : "No"}</span></div>
        </div>
      `;
    }
    if (x.showStack && b.length > 0) {
      g += `<div class="overlay-debug-section"><div class="overlay-debug-section-title">Stack (${b.length})</div>`;
      const S = ((a = (s = (r = _.debug) == null ? void 0 : r.getStore) == null ? void 0 : s.call(r)) == null ? void 0 : a.overlays) || {};
      for (const fe of b.slice(-5).reverse()) {
        const Q = S[fe] || {};
        g += `<div class="overlay-debug-stack-item"><strong>${Q.type || "unknown"}</strong> - ${fe.slice(0, 12)}...<br>scope: ${Q.scope || "global"} | z: ${((u = Q.config) == null ? void 0 : u.zIndex) || "auto"}</div>`;
      }
      b.length > 5 && (g += `<div style="opacity:0.5;font-size:10px;">...and ${b.length - 5} more</div>`), g += "</div>";
    }
    if (x.showEvents && v.eventLog.length > 0) {
      g += '<div class="overlay-debug-section"><div class="overlay-debug-section-title">Recent Events</div>';
      for (const S of v.eventLog.slice(-10).reverse())
        g += `<div class="overlay-debug-event"><span class="overlay-debug-event-time">${Cu(S.timestamp)}</span><span class="overlay-debug-event-type">${S.type}</span>${S.id ? ` - ${S.id.slice(0, 8)}` : ""}</div>`;
      g += "</div>";
    }
    g += `
      <div class="overlay-debug-actions">
        <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.closeAll()">Close All</button>
        <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.scanOrphans()">Scan Orphans</button>
        <button class="overlay-debug-btn" onclick="window.__overlayDebugPanel?.exportInfo()">Export</button>
      </div>
    </div>`;
  }
  return g;
}
function Bt() {
  !v.panelElement || !v.isVisible || (v.panelElement.innerHTML = Su());
}
function io() {
  return typeof document > "u" ? { ok: !1, error: "no-document" } : (v.panelElement || (v.panelElement = wu(), document.body.appendChild(v.panelElement)), v.isVisible = !0, v.panelElement.style.display = "block", Bt(), !v.refreshIntervalId && x.refreshInterval > 0 && (v.refreshIntervalId = setInterval(Bt, x.refreshInterval)), { ok: !0 });
}
function an() {
  return v.isVisible = !1, v.panelElement && (v.panelElement.style.display = "none"), v.refreshIntervalId && (clearInterval(v.refreshIntervalId), v.refreshIntervalId = null), { ok: !0 };
}
function lo() {
  return v.isVisible ? an() : io(), { ok: !0, visible: v.isVisible };
}
function Du() {
  return x.collapsed = !x.collapsed, v.panelElement && (v.panelElement.classList.toggle("collapsed", x.collapsed), Bt()), { ok: !0, collapsed: x.collapsed };
}
function Ue(e, t = {}) {
  for (v.eventLog.push({ type: e, ...t, timestamp: Date.now() }); v.eventLog.length > x.maxEvents; ) v.eventLog.shift();
  v.isVisible && Bt();
}
function Ru() {
  _ != null && _.closeAll && (_.closeAll({ reason: "debug-panel" }), Ue("DEBUG_ACTION", { action: "closeAll" }));
}
function Lu() {
  var e;
  if (_ != null && _.scanOrphans) {
    const t = _.scanOrphans();
    Ue("DEBUG_ACTION", { action: "scanOrphans", orphans: ((e = t == null ? void 0 : t.orphans) == null ? void 0 : e.length) || 0 });
  }
}
function $u() {
  _ != null && _.info && (console.log("[OverlayDebug] Full Info:", JSON.stringify(_.info(), null, 2)), Ue("DEBUG_ACTION", { action: "exportInfo" }));
}
function xu() {
  typeof document > "u" || document.addEventListener("keydown", (e) => {
    const t = x.hotkey.toLowerCase().split("+");
    t.includes("ctrl") === e.ctrlKey && t.includes("shift") === e.shiftKey && t.some((n) => !["ctrl", "shift", "alt"].includes(n) && e.key.toLowerCase() === n) && (e.preventDefault(), lo());
  });
}
function Tu(e) {
  return e && (_ = e), xu(), typeof window < "u" && (window.__overlayDebugPanel = { toggle: Du, closeAll: Ru, scanOrphans: Lu, exportInfo: $u }), x.enabled = !0, { ok: !0 };
}
function _u() {
  var e, t;
  an(), (e = v.panelElement) != null && e.parentNode && (v.panelElement.parentNode.removeChild(v.panelElement), v.panelElement = null);
  const n = (t = document.getElementById) == null ? void 0 : t.call(document, "overlay-debug-styles");
  return n && n.remove(), typeof window < "u" && delete window.__overlayDebugPanel, x.enabled = !1, { ok: !0 };
}
function Nu() {
  return v.isVisible;
}
function Mu() {
  return { moduleId: ku, version: ao, enabled: x.enabled, visible: v.isVisible, collapsed: x.collapsed, position: x.position, hotkey: x.hotkey, eventLogSize: v.eventLog.length, timestamp: Date.now() };
}
const ln = { initialized: !1, mounted: !1, ready: !1 };
function Pu() {
  return ln.initialized = !0, !0;
}
function ps() {
  return ln.mounted = !1, !0;
}
function Hu() {
  return ln.initialized;
}
function co() {
  return Object.assign({}, ln);
}
const _e = "2.7.0-P2-ENTERPRISE", uo = "overlay-layer", gs = 5, ms = 300, pe = Rs({ moduleId: uo }), Uu = () => pe.init(), re = (e) => pe.get(e), Bu = (e) => pe.inject(e), zu = () => pe.snapshot(), ju = () => {
  var e, t;
  return ((t = (e = re("config")) == null ? void 0 : e.app) == null ? void 0 : t.debug) || !1;
}, fo = (e, ...t) => {
  var n, o, r;
  const s = re("logger");
  if (!s) return;
  const a = `[${uo}]`;
  if (e === "error") {
    (n = s.error) == null || n.call(s, a, ...t);
    return;
  }
  if (e === "warn") {
    (o = s.warn) == null || o.call(s, a, ...t);
    return;
  }
  ju() && ((r = s.debug) == null || r.call(s, a, ...t));
}, q = { appShellAttempts: 0, appShellConnected: !1, contextProviderAttempts: 0, contextProviderConnected: !1, kernelIntegrated: !1 };
let Ge = { open: null, close: null };
const Fu = (e) => {
  Ge = e;
}, po = (e = 1) => {
  var t, n, o, r;
  q.appShellAttempts = e;
  const s = re("appShell");
  if (!(s && (s.getContainer || ((t = s.adapter) == null ? void 0 : t.getContainer))))
    return e < gs ? new Promise((u) => setTimeout(u, ms * e)).then(() => po(e + 1)) : (zt("appshell:using-fallback", { attempts: e }), Promise.resolve(!1));
  try {
    const u = ((n = s.getContainer) == null ? void 0 : n.call(s, "overlay")) || ((r = (o = s.adapter) == null ? void 0 : o.getContainer) == null ? void 0 : r.call(o, "overlay"));
    if (u)
      return q.appShellConnected = !0, Promise.resolve(u);
  } catch (u) {
    fo("error", "AppShell error:", u.message);
  }
  return Promise.resolve(!1);
}, $e = () => {
  const e = re("contextProvider");
  if (!(e != null && e.set)) return !1;
  try {
    const t = m.getStack();
    return e.set("ui.overlay.stack", t), e.set("ui.overlay.hasBlocking", qu()), e.set("ui.overlay.activeCount", t.length), !0;
  } catch {
    return !1;
  }
}, qu = () => {
  const e = m.getStack(), t = m.getOverlays();
  return e.some((n) => {
    var o;
    const r = t[n];
    return ((o = r == null ? void 0 : r.config) == null ? void 0 : o.blocking) === !0 || (r == null ? void 0 : r.type) === "modal";
  });
}, go = (e = 1) => {
  q.contextProviderAttempts = e;
  const t = re("contextProvider");
  if (!(t != null && t.set))
    return e < gs ? new Promise((n) => setTimeout(n, ms * e)).then(() => go(e + 1)) : Promise.resolve(!1);
  try {
    return $e(), q.contextProviderConnected = !0, Promise.resolve(!0);
  } catch {
    return Promise.resolve(!1);
  }
}, Gu = (e = {}) => {
  var t;
  try {
    const n = Qo({ eventBus: e.eventBus || re("eventBus"), ports: pe.snapshot(), applicationKernel: e.applicationKernel || (window == null ? void 0 : window.ApplicationKernel), permissionsGuard: e.permissionsGuard || (window == null ? void 0 : window.PermissionsGuard) });
    return n.ok ? (q.kernelIntegrated = ((t = n.data) == null ? void 0 : t.runtimeIntegrated) || !1, !0) : !1;
  } catch (n) {
    return fo("error", "Kernel error:", n.message), !1;
  }
}, Vu = () => {
  wi({ store: m, closeOverlay: (e, t) => Ge.close(e, t), eventBus: re("eventBus") }), yr({ scanInterval: 3e4 });
}, Ku = () => {
  xi({ eventBus: re("eventBus") }), zi({ store: m, closeOverlay: (e, t) => Ge.close(e, t), eventBus: re("eventBus") }), Gi(6e4), Ji({ store: m, openOverlay: (e, t) => Ge.open(e, t), closeOverlay: (e, t) => Ge.close(e, t) }), Sl({ logger: re("logger") });
}, Wu = () => {
  Tl({ openOverlay: (e, t) => Ge.open(e, { ...t, bypassQueue: !0 }), canOpenOverlay: (e, t) => Rn(e, t), eventBus: re("eventBus") }), Nr(5e3), Vl({ schemaValidator: fi });
}, Yu = (e) => {
  (void 0)(), du({ logger: re("logger"), metricsCollector: ru }), Au({ overlayLayer: e }), Tu(e), fo("info", "Sprint 4 modules initialized");
}, ys = () => (q.appShellConnected = !1, po(1)), hs = () => (q.contextProviderConnected = !1, go(1)), Qu = () => Promise.all([ys(), hs()]).then((e) => ({ appShell: !!e[0], contextProvider: e[1], kernel: q.kernelIntegrated })), Xu = (e) => (t = {}) => (Uu(), t.eventBus && pe.inject({ eventBus: t.eventBus }), t.contextProvider && pe.inject({ contextProvider: t.contextProvider }), t.appShell && pe.inject({ appShell: t.appShell }), t.logger && pe.inject({ logger: t.logger }), t.config && pe.inject({ config: t.config }), Gu(t), Vu(), Ku(), Wu(), Yu(e), po().then((n) => Pu()).then((n) => go().then(() => (m.subscribe(() => $e()), n)))), Ju = () => (q.appShellConnected = !1, q.contextProviderConnected = !1, q.kernelIntegrated = !1, Mn(), Sr(), Vn(), bt(), ic(), _u(), Dn("overlay-layer-shutdown"), ps(), m.clear(), !0), Zu = () => (m.clear(), ps(), dr(), Er(), ml(), Nl(), xc(), (void 0)(), fs(), !0), ed = () => Hu(), ft = { openCount: 0, closeCount: 0, closeManyCount: 0, errors: 0 };
function td(e) {
  const t = Hs(e);
  if (!t.valid)
    return ft.errors++, { ok: !1, errors: t.errors };
  const n = t.normalized;
  return m.getOverlay(n.id) ? (m.updateOverlayRuntime(n.id, { visible: !0, openedAt: Date.now(), closing: !1 }), { ok: !0, id: n.id, action: "updated" }) : (m.addOverlay(Object.assign({}, n, { runtime: { visible: !0, openedAt: Date.now(), closing: !1, createdAt: Date.now() } })), ft.openCount++, { ok: !0, id: n.id, action: "opened" });
}
function mo(e, t) {
  return t = t || "explicit", m.getOverlay(e) ? (m.removeOverlay(e), ft.closeCount++, { ok: !0, id: e, reason: t, wasOpen: !0 }) : { ok: !1, reason: "not-found" };
}
function nd(e) {
  e = e || "closeAll";
  const t = m.getStack(), n = [];
  for (let o = 0; o < t.length; o++)
    mo(t[o], e).ok && n.push(t[o]);
  return { ok: !0, closed: n, count: n.length };
}
function od(e, t) {
  var n, o, r, s, a, u;
  if (t = t || "closeMany", !e || typeof e != "object")
    return { ok: !1, error: "filter-required", closed: [], failed: [], count: 0 };
  const i = m.getStack(), c = m.getOverlays(), f = [], b = Date.now();
  for (let fe = 0; fe < i.length; fe++) {
    const Q = i[fe], M = c[Q];
    if (!M) continue;
    let A = !0;
    if (e.ids && Array.isArray(e.ids) && (e.ids.includes(Q) || (A = !1)), A && e.excludeIds && Array.isArray(e.excludeIds) && e.excludeIds.includes(Q) && (A = !1), A && e.type && M.type !== e.type && (A = !1), A && e.types && Array.isArray(e.types) && (e.types.includes(M.type) || (A = !1)), A && e.excludeTypes && Array.isArray(e.excludeTypes) && e.excludeTypes.includes(M.type) && (A = !1), A && e.scope && M.scope !== e.scope && (A = !1), A && typeof e.olderThan == "number") {
      const W = ((n = M.runtime) == null ? void 0 : n.createdAt) || ((o = M.runtime) == null ? void 0 : o.openedAt) || M.createdAt;
      W ? b - W < e.olderThan && (A = !1) : A = !1;
    }
    if (A && typeof e.newerThan == "number") {
      const W = ((r = M.runtime) == null ? void 0 : r.createdAt) || ((s = M.runtime) == null ? void 0 : s.openedAt) || M.createdAt;
      W && b - W > e.newerThan && (A = !1);
    }
    if (A && e.priority && typeof e.priority == "object") {
      const W = ((a = M.config) == null ? void 0 : a.priority) || 50;
      e.priority.lt !== void 0 && W >= e.priority.lt && (A = !1), e.priority.gt !== void 0 && W <= e.priority.gt && (A = !1), e.priority.eq !== void 0 && W !== e.priority.eq && (A = !1), e.priority.lte !== void 0 && W > e.priority.lte && (A = !1), e.priority.gte !== void 0 && W < e.priority.gte && (A = !1);
    }
    if (A && e.blocking !== void 0) {
      const W = ((u = M.config) == null ? void 0 : u.blocking) || M.type === "modal";
      e.blocking !== W && (A = !1);
    }
    if (A && typeof e.custom == "function")
      try {
        e.custom(M) || (A = !1);
      } catch {
        A = !1;
      }
    A && f.push(Q);
  }
  const g = [], S = [];
  for (let fe = 0; fe < f.length; fe++) {
    const Q = f[fe];
    try {
      const M = mo(Q, t);
      M.ok ? g.push(Q) : S.push({ id: Q, reason: M.reason || "unknown" });
    } catch (M) {
      S.push({ id: Q, reason: M.message });
    }
  }
  return ft.closeManyCount++, {
    ok: !0,
    closed: g,
    failed: S,
    count: g.length,
    filtered: f.length,
    reason: t
  };
}
function vs(e) {
  var t, n, o, r;
  if (!e || typeof e != "object")
    return [];
  const s = m.getStack(), a = m.getOverlays(), u = [], i = Date.now();
  for (let c = 0; c < s.length; c++) {
    const f = s[c], b = a[f];
    if (!b) continue;
    let g = !0;
    if (e.ids && Array.isArray(e.ids) && (e.ids.includes(f) || (g = !1)), g && e.excludeIds && Array.isArray(e.excludeIds) && e.excludeIds.includes(f) && (g = !1), g && e.type && b.type !== e.type && (g = !1), g && e.types && Array.isArray(e.types) && (e.types.includes(b.type) || (g = !1)), g && e.excludeTypes && Array.isArray(e.excludeTypes) && e.excludeTypes.includes(b.type) && (g = !1), g && e.scope && b.scope !== e.scope && (g = !1), g && typeof e.olderThan == "number") {
      const S = ((t = b.runtime) == null ? void 0 : t.createdAt) || ((n = b.runtime) == null ? void 0 : n.openedAt) || b.createdAt;
      S ? i - S < e.olderThan && (g = !1) : g = !1;
    }
    if (g && e.priority && typeof e.priority == "object") {
      const S = ((o = b.config) == null ? void 0 : o.priority) || 50;
      e.priority.lt !== void 0 && S >= e.priority.lt && (g = !1), e.priority.gt !== void 0 && S <= e.priority.gt && (g = !1), e.priority.eq !== void 0 && S !== e.priority.eq && (g = !1);
    }
    if (g && e.blocking !== void 0) {
      const S = ((r = b.config) == null ? void 0 : r.blocking) || b.type === "modal";
      e.blocking !== S && (g = !1);
    }
    if (g && typeof e.custom == "function")
      try {
        e.custom(b) || (g = !1);
      } catch {
        g = !1;
      }
    g && u.push(b);
  }
  return u;
}
function rd(e) {
  return vs(e).length;
}
function sd() {
  return Object.assign({}, ft);
}
const yo = () => {
  const e = m.getStack(), t = m.getOverlays();
  return e.some((n) => {
    var o;
    const r = t[n];
    return ((o = r == null ? void 0 : r.config) == null ? void 0 : o.blocking) === !0 || (r == null ? void 0 : r.type) === "modal";
  });
}, ho = (e) => {
  var t;
  const n = m.getStack(), o = m.getOverlays();
  if (n.length === 0) return null;
  if (e) {
    for (let r = n.length - 1; r >= 0; r--)
      if (((t = o[n[r]]) == null ? void 0 : t.scope) === e) return o[n[r]];
    return null;
  }
  return o[n[n.length - 1]] || null;
}, bs = us(async (e, t = {}) => {
  var n, o;
  const r = (void 0)("open");
  if (e.template && !t.templateResolved) {
    const c = zr(e.template, e);
    if (!c.ok) return { ok: !1, error: "template-not-found", template: e.template };
    e = c.descriptor, t.templateResolved = !0;
  }
  if (me("beforeOpen")) {
    const c = await De("beforeOpen", { descriptor: e, options: t });
    if (c.cancelled) return { ok: !1, cancelled: !0, reason: c.cancelReason };
    (n = c.modifiedContext) != null && n.descriptor && (e = c.modifiedContext.descriptor);
  }
  if (!t.bypassCircuitBreaker) {
    const c = _i("open");
    if (!c.allowed) {
      if (!t.bypassQueue && fn()) {
        const f = Dt(e, "circuit-breaker", { openOptions: t });
        if (f.ok)
          return (void 0)(e.type, "circuit-breaker"), { ok: !1, queued: !0, queueId: f.queueId };
      }
      return (void 0)(e.type, "circuit-breaker"), { ok: !1, circuitBreakerOpen: !0, reason: c.reason };
    }
  }
  const s = ht(e);
  if (!s.valid)
    return So("open", { type: "validation" }), { ok: !1, errors: s.errors };
  const a = s.normalized;
  if (!t.bypassRateLimit) {
    const c = mi(a.type);
    if (!c.allowed) {
      if (!t.bypassQueue && fn()) {
        const f = Dt(a, "rate-limited", { openOptions: t });
        if (f.ok)
          return (void 0)(a.type, "rate-limited"), { ok: !1, queued: !0, queueId: f.queueId };
      }
      return (void 0)(a.type, "rate-limited"), { ok: !1, rateLimited: !0, reason: c.reason };
    }
  }
  if (q.kernelIntegrated && !t.bypassKernelCheck) {
    const c = Rn(a.type, { scope: a.scope || "global" });
    if (!c.allowed) {
      if (!t.bypassQueue && fn()) {
        const f = Dt(a, c.reason, { openOptions: t });
        if (f.ok)
          return (void 0)(a.type, c.reason), { ok: !1, queued: !0, queueId: f.queueId };
      }
      return (void 0)(a.type, c.reason), { ok: !1, blocked: !0, reason: c.reason };
    }
  }
  yi(a.type);
  const u = Qr(a.type === "modal" ? "modal" : "overlay", { id: a.id });
  u.ok && !a.config.zIndex && (a.config.zIndex = u.zIndex);
  const i = td(a);
  return i.ok ? (Ni("open"), (void 0)(i.id, a.type, { scope: a.scope, template: e.template }), _s(i.id, a.type, a.scope || "global"), $e(), Ue("OPEN", { id: i.id, type: a.type }), me("afterOpen") && De("afterOpen", { overlay: a, result: i, id: i.id })) : (So("open", { errors: i.errors }), (void 0)(a.type, (o = i.errors) == null ? void 0 : o[0], { operation: "open" })), (void 0)(r), i;
}, { operation: "open" }), ad = (e, t) => {
  var n;
  const o = m.getOverlay(e);
  if (!o) return { ok: !1, error: "not-found" };
  if (me("beforeUpdate")) {
    const s = Do("beforeUpdate", { id: e, patch: t, overlay: o });
    if (s.cancelled) return { ok: !1, cancelled: !0, reason: s.cancelReason };
    (n = s.modifiedContext) != null && n.patch && (t = s.modifiedContext.patch);
  }
  return m.updateOverlayRuntime(e, t) ? ($e(), me("afterUpdate") && Do("afterUpdate", { id: e, patch: t }), { ok: !0, id: e }) : { ok: !1, error: "update-failed" };
}, Es = us(async (e, t = "manual", n = {}) => {
  var o, r, s, a;
  const u = (void 0)("close"), i = m.getOverlay(e);
  if (me("beforeClose")) {
    const f = await De("beforeClose", { id: e, reason: t });
    if (f.cancelled) return { ok: !1, cancelled: !0, reason: f.cancelReason };
  }
  ((o = i == null ? void 0 : i.config) == null ? void 0 : o.trapFocus) !== !1 && bt({ restoreFocus: ((r = i == null ? void 0 : i.config) == null ? void 0 : r.restoreFocus) !== !1 }), (s = i == null ? void 0 : i.config) != null && s.zIndex && Xr(e);
  const c = mo(e, t);
  if (c.ok) {
    const f = (a = i == null ? void 0 : i.runtime) != null && a.createdAt ? Date.now() - i.runtime.createdAt : 0;
    (void 0)(e, i == null ? void 0 : i.type, f, t), Ns(e, t), $e(), Ue("CLOSE", { id: e, type: i == null ? void 0 : i.type, reason: t }), me("afterClose") && De("afterClose", { id: e, reason: t, result: c });
  }
  return (void 0)(u), c;
}, { operation: "close" }), id = async (e = {}) => {
  var t;
  if (me("beforeCloseAll") && (await De("beforeCloseAll", { options: e })).cancelled)
    return { ok: !1, cancelled: !0 };
  bt();
  const n = nd(e.reason || "closeAll");
  return $e(), Ue("CLOSE_ALL", { count: ((t = n.closed) == null ? void 0 : t.length) || 0 }), me("afterCloseAll") && De("afterCloseAll", { options: e, result: n }), n;
}, ld = async (e, t = "closeMany") => {
  if (me("beforeCloseMany") && (await De("beforeCloseMany", { filter: e, reason: t })).cancelled)
    return { ok: !1, cancelled: !0 };
  const n = od(e, t);
  return n.ok && n.count > 0 && ($e(), Ue("CLOSE_MANY", { count: n.count })), me("afterCloseMany") && De("afterCloseMany", { filter: e, reason: t, result: n }), n;
}, cd = (e) => vs(e), ud = (e) => rd(e), dd = (e) => {
  const t = m.getStack();
  if (!e) return t;
  const n = m.getOverlays();
  return t.filter((o) => {
    const r = n[o];
    return r && (!e.type || r.type === e.type) && (!e.scope || r.scope === e.scope);
  });
}, fd = (e) => ho(e), pd = (e) => {
  if (!e) return yo();
  const t = m.getStack(), n = m.getOverlays();
  return t.some((o) => {
    var r;
    const s = n[o];
    return (s == null ? void 0 : s.scope) === e && (((r = s == null ? void 0 : s.config) == null ? void 0 : r.blocking) || (s == null ? void 0 : s.type) === "modal");
  });
}, gd = (e) => m.subscribe(e), vo = "1.0.0", md = "overlay-layer-lazy-loader", yd = {
  IDLE: "IDLE",
  LOADING: "LOADING",
  LOADED: "LOADED",
  ERROR: "ERROR"
}, hd = {
  enabled: !0,
  prefetchEnabled: !0,
  prefetchDelay: 1e3,
  cacheEnabled: !0,
  cacheTTL: 3e5,
  maxCacheSize: 50,
  timeout: 1e4,
  retryAttempts: 2,
  retryDelay: 500
};
let G = { ...hd }, be = /* @__PURE__ */ new Map(), Ve = /* @__PURE__ */ new Map(), We = [];
const X = {
  totalLoads: 0,
  cacheHits: 0,
  cacheMisses: 0,
  errors: 0,
  prefetched: 0
};
function $t(e) {
  X.hasOwnProperty(e) && X[e]++;
}
function vd(e, t) {
  return e ? typeof t != "function" ? { ok: !1, error: "loader-must-be-function" } : (Ve.set(e, {
    loader: t,
    pattern: e instanceof RegExp ? e : null
  }), { ok: !0, type: e.toString() }) : { ok: !1, error: "invalid-type" };
}
function bd(e) {
  if (Ve.has(e))
    return Ve.get(e).loader;
  for (const [t, n] of Ve)
    if (n.pattern && n.pattern.test(e))
      return n.loader;
  return null;
}
function Ed() {
  const e = [];
  for (const [t, n] of Ve)
    e.push({
      type: t.toString(),
      isPattern: !!n.pattern
    });
  return e;
}
function ks(e, t) {
  return `${e}:${t || "default"}`;
}
function bo(e) {
  if (!G.cacheEnabled) return null;
  const t = be.get(e);
  return t ? Date.now() - t.timestamp > G.cacheTTL ? (be.delete(e), null) : (X.cacheHits++, t.data) : null;
}
function kd(e, t) {
  if (G.cacheEnabled) {
    if (be.size >= G.maxCacheSize) {
      const n = be.keys().next().value;
      be.delete(n);
    }
    be.set(e, {
      data: t,
      timestamp: Date.now()
    });
  }
}
async function Os(e, t, n = 0) {
  try {
    const o = new Promise((a, u) => {
      setTimeout(() => u(new Error("Load timeout")), G.timeout);
    }), r = Promise.resolve(e(t));
    return { ok: !0, data: await Promise.race([r, o]) };
  } catch (o) {
    return n < G.retryAttempts ? (await new Promise((r) => setTimeout(r, G.retryDelay * (n + 1))), Os(e, t, n + 1)) : { ok: !1, error: o.message };
  }
}
async function As(e, t = {}) {
  if (!G.enabled)
    return { ok: !1, error: "lazy-loader-disabled" };
  $t("totalLoads");
  const n = ks(e, t.id);
  if (!t.skipCache) {
    const s = bo(n);
    if (s)
      return { ok: !0, data: s, fromCache: !0 };
  }
  $t("cacheMisses");
  const o = bd(e);
  if (!o)
    return { ok: !1, error: "no-loader-registered", type: e };
  const r = await Os(o, { type: e, ...t });
  return r.ok ? (kd(n, r.data), { ok: !0, data: r.data, fromCache: !1 }) : ($t("errors"), { ok: !1, error: r.error });
}
function Od(e, t = {}) {
  if (!G.enabled || !G.prefetchEnabled)
    return { ok: !1, skipped: !0 };
  const n = ks(e, t.id);
  return bo(n) ? { ok: !0, alreadyCached: !0 } : We.some((o) => o.cacheKey === n) ? { ok: !0, alreadyQueued: !0 } : (We.push({
    type: e,
    options: t,
    cacheKey: n,
    queuedAt: Date.now()
  }), setTimeout(() => Ad(), G.prefetchDelay), { ok: !0, queued: !0 });
}
async function Ad() {
  for (; We.length > 0; ) {
    const e = We.shift();
    bo(e.cacheKey) || (await As(e.type, { ...e.options, skipCache: !1 })).ok && $t("prefetched");
  }
}
function Id() {
  return We.map((e) => ({
    type: e.type,
    cacheKey: e.cacheKey,
    queuedAt: e.queuedAt,
    waitTime: Date.now() - e.queuedAt
  }));
}
function Is() {
  const e = [], t = Date.now();
  for (const [n, o] of be)
    e.push({
      key: n,
      age: t - o.timestamp,
      ttlRemaining: Math.max(0, G.cacheTTL - (t - o.timestamp))
    });
  return {
    size: be.size,
    maxSize: G.maxCacheSize,
    items: e
  };
}
function wd() {
  return { ...G };
}
function Cd() {
  const e = X.cacheHits + X.cacheMisses > 0 ? X.cacheHits / (X.cacheHits + X.cacheMisses) * 100 : 0;
  return {
    enabled: G.enabled,
    totalLoads: X.totalLoads,
    cacheHits: X.cacheHits,
    cacheMisses: X.cacheMisses,
    hitRate: `${e.toFixed(1)}%`,
    errors: X.errors,
    prefetched: X.prefetched,
    currentCacheSize: be.size,
    prefetchQueueSize: We.length,
    registeredLoaders: Ve.size
  };
}
function ws() {
  return {
    moduleId: md,
    version: vo,
    enabled: G.enabled,
    config: wd(),
    metrics: Cd(),
    cache: Is(),
    loaders: Ed(),
    prefetchQueue: Id(),
    loadStatuses: yd,
    timestamp: Date.now()
  };
}
const Sd = (e) => ht(e), Dd = (e) => bi(e), Rd = () => br(), Ld = () => Er(), $d = () => at(), xd = () => Cr(), Td = (e) => xr(e), _d = (e, t) => gl(e, t), Nd = () => jn(), Md = (e, t, n) => Il(e, t, n), Pd = (e, t) => Zt(e, t), Hd = (e, t, n) => Dt(e, t, n), Ud = () => en(), Bd = () => _r(), zd = (e, t) => Wl(e, t), jd = (e) => Yl(e), Fd = () => tn(), qd = (e, t) => zr(e, t), Gd = (e, t) => sc(e, t), Vd = () => ct(), Kd = (e, t) => Ac(e, t), Wd = (e) => bt(e), Yd = (e, t) => Qr(e, t), Qd = (e) => Xr(e), Xd = () => ({}), Jd = () => ({}), Zd = (e) => ds(e), ef = () => Ot(), tf = (e) => hu(e), nf = (e, t) => vd(e, t), of = (e, t) => As(e, t), rf = (e, t) => Od(e, t), sf = () => io(), af = () => an(), lf = () => lo(), cf = () => {
  var e;
  return {
    initialized: co().initialized,
    activeCount: m.getStack().length,
    hasBlocking: yo(),
    topOverlay: ((e = ho()) == null ? void 0 : e.id) || null,
    appShellConnected: q.appShellConnected,
    contextProviderConnected: q.contextProviderConnected,
    kernelIntegrated: q.kernelIntegrated,
    kernelMode: Zo(),
    rateLimiterEnabled: ki(),
    autoCleanupEnabled: Ci(),
    circuitBreakerState: br(),
    orphanDetectorEnabled: Bn(),
    lifecycleHooksEnabled: Rl(),
    pendingQueueSize: Bl(),
    focusTrapped: Ic(),
    metricsEnabled: !1,
    errorCount: Ot().current,
    debugPanelVisible: Nu()
  };
}, uf = () => ({
  name: uo,
  version: _e,
  status: co().initialized ? "READY" : "NOT_INITIALIZED",
  stack: { count: m.getStack().length, hasBlocking: yo(), top: ho() },
  metrics: sd(),
  sprint1: { schemaValidator: Nn(), rateLimiter: fr(), autoCleanup: Li() },
  sprint2: { circuitBreaker: Or(), orphanDetector: Wi(), snapshotManager: hl(), lifecycleHooks: $l() },
  sprint3: { pendingQueue: Hr(), templateRegistry: Jl(), transitions: cc(), focusManager: wc(), zIndexManager: Nc() },
  sprint4: { metricsCollector: (Pt == null ? void 0 : Pt()) || { status: "MODULE_CORRUPTED" }, errorBoundary: Eu(), lazyLoader: ws(), debugPanel: Mu() },
  components: { store: jt, kernel: ge, schemaValidator: mt, rateLimiter: ur, circuitBreaker: Pn, pendingQueue: Fn, metricsCollector: so, errorBoundary: sn, lazyLoader: vo, debugPanel: ao }
}), df = () => {
  var e;
  const t = {
    initialized: co().initialized,
    containerMounted: zs(),
    storeAvailable: !!m,
    kernelReady: Wt().status !== "UNHEALTHY",
    kernelIntegrated: q.kernelIntegrated,
    circuitBreakerHealthy: Hi().status !== "UNHEALTHY",
    pendingQueueHealthy: jl().status !== "UNHEALTHY",
    metricsHealthy: ((e = Mt == null ? void 0 : Mt()) == null ? void 0 : e.status) !== "UNHEALTHY",
    errorBoundaryHealthy: bu().status !== "UNHEALTHY"
  }, n = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
  return { status: n === o ? "HEALTHY" : n < o * 0.5 ? "UNHEALTHY" : "DEGRADED", score: n, maxScore: o, scoreDisplay: `${n}/${o}`, checks: t, version: _e, timestamp: Date.now() };
}, ff = () => _e, pf = () => ({
  getStore: () => m.getState(),
  getStackSnapshot: () => ({ stack: m.getStack(), overlays: m.getOverlays() }),
  kernel: { info: () => $n(), health: () => Wt() },
  sprint1: { schemaValidator: { validate: (e) => ht(e) }, rateLimiter: { info: () => fr(), reset: () => dr() }, autoCleanup: { scan: () => hn() } },
  sprint2: { circuitBreaker: { info: () => Or(), forceOpen: () => Mi("debug") }, orphanDetector: { scan: () => at() }, snapshotManager: { snapshot: (e) => xr(e), list: () => jn() } },
  sprint3: { pendingQueue: { info: () => Hr(), process: () => en() }, templateRegistry: { list: () => tn() }, transitions: { list: () => ct() }, focusManager: { state: () => Cc() }, zIndexManager: { layers: () => Yn() } },
  sprint4: { metricsCollector: { all: () => ({}), performance: () => ({}), reset: () => {
  } }, errorBoundary: { errors: () => ds(), stats: () => Ot(), clear: () => fs() }, lazyLoader: { info: () => ws(), cache: () => Is() }, debugPanel: { show: () => io(), hide: () => an(), toggle: () => lo() } },
  versions: { main: _e, kernel: ge, metricsCollector: so, errorBoundary: sn, lazyLoader: vo, debugPanel: ao }
});
Fu({ open: bs, close: Es });
const Cs = pf(), ze = {
  init: null,
  // set below after object creation (needs self-reference for setupSprint4)
  isInitialized: ed,
  shutdown: Ju,
  reset: Zu,
  open: bs,
  update: ad,
  close: Es,
  closeAll: id,
  closeMany: ld,
  findMany: cd,
  countMany: ud,
  getStack: dd,
  getTop: fd,
  hasBlocking: pd,
  onChange: gd,
  status: cf,
  info: uf,
  healthCheck: df,
  getVersion: ff,
  retryAppShell: ys,
  retryContextProvider: hs,
  retryAllIntegrations: Qu,
  syncWithContextProvider: $e,
  injectPorts: Bu,
  getPorts: zu,
  // Sprint 1
  validateDescriptor: Sd,
  configureRateLimiter: Dd,
  // Sprint 2
  getCircuitBreakerState: Rd,
  resetCircuitBreaker: Ld,
  scanOrphans: $d,
  cleanupOrphans: xd,
  createSnapshot: Td,
  restoreSnapshot: _d,
  listSnapshots: Nd,
  onHook: Md,
  offHook: Pd,
  // Sprint 3
  enqueueOverlay: Hd,
  processQueue: Ud,
  getQueuedOverlays: Bd,
  registerTemplate: zd,
  getTemplate: jd,
  listTemplates: Fd,
  applyTemplate: qd,
  registerTransition: Gd,
  listTransitions: Vd,
  trapFocus: Kd,
  releaseFocus: Wd,
  acquireZIndex: Yd,
  releaseZIndex: Qd,
  // Sprint 4
  getMetrics: Xd,
  getPerformanceStats: Jd,
  getErrors: Zd,
  getErrorStats: ef,
  onError: tf,
  registerLoader: nf,
  lazyLoad: of,
  prefetch: rf,
  showDebugPanel: sf,
  hideDebugPanel: af,
  toggleDebugPanel: lf,
  debug: Cs
};
ze.init = Xu(ze);
typeof window < "u" && (Ds() || (window.OverlayLayer = ze, window.OverlayLayerVersion = _e, zt("global:exposed", { version: _e })), window.__dev = window.__dev || {}, window.__dev.overlayLayer = { healthCheck: () => ze.healthCheck(), info: () => ze.info(), status: () => ze.status(), debug: Cs, version: _e });
export {
  ze as OverlayLayer,
  _e as VERSION,
  ze as default,
  zu as getPorts,
  Bu as injectPorts
};
