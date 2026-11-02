import { createUiPorts as N } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS as B } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
import { isStrict as z, recordViolation as gt } from "/core/runtime/enterprise/strict-mode.js";
const v = "toast.service.config", a = {
  maxVisible: 3,
  stackGap: 12,
  position: "bottom-right",
  zIndex: 10003,
  durations: {
    success: 3e3,
    info: 4e3,
    warning: 5e3,
    error: 7e3,
    critical: 0
  },
  colors: {
    success: { accent: "#22c55e", rgb: "34, 197, 94" },
    info: { accent: "#3b82f6", rgb: "59, 130, 246" },
    warning: { accent: "#f59e0b", rgb: "245, 158, 11" },
    error: { accent: "#ef4444", rgb: "239, 68, 68" },
    critical: { accent: "#dc2626", rgb: "220, 38, 38" }
  },
  badges: {
    success: "SUCESSO",
    info: "INFO",
    warning: "ATENÇÃO",
    error: "ERRO",
    critical: "CRÍTICO"
  }
}, M = "1.6.0-P2-ENTERPRISE", R = "toast-queue", ft = typeof window < "u", S = N({ moduleId: R });
function mt() {
  S.init();
}
function et(t) {
  return S.get(t);
}
function pt(t) {
  return S.inject(t);
}
function _t() {
  return S.snapshot();
}
let m = [], d = [], bt = 0;
function xt(t) {
  mt();
  try {
    const e = et("eventBus");
    e && e.emit && e.emit(B.TOAST_SHOW, Object.assign({}, t, { source: R, timestamp: Date.now() }));
  } catch {
  }
}
function it() {
  return `toast-${++bt}-${Date.now().toString(36)}`;
}
function nt(t) {
  m.push(t), U();
}
function ot(t) {
  d = d.filter((e) => e.id !== t), U();
}
function U() {
  for (; d.length < a.maxVisible && m.length > 0; ) {
    const t = m.shift();
    d.push(t), xt(t);
  }
}
function O() {
  return m.slice();
}
function k() {
  return d.slice();
}
function st() {
  m = [];
  const t = d.map((e) => e.id);
  return d = [], t;
}
function ht(t) {
  for (let e = 0; e < d.length; e++)
    if (d[e].id === t) return d[e];
  for (let e = 0; e < m.length; e++)
    if (m[e].id === t) return m[e];
  return null;
}
function vt() {
  return { moduleId: R, version: M, p03PortsOnly: !0, portsInitialized: S.isInitialized(), strictMode: z(), strictModeCompliant: !0 };
}
function yt() {
  const t = !!et("eventBus");
  return {
    status: t ? "HEALTHY" : "DEGRADED",
    moduleId: R,
    version: M,
    p03PortsOnly: !0,
    strictMode: z(),
    strictModeCompliant: !0,
    checks: { ready: !0, hasEventBus: t, portsInitialized: S.isInitialized() }
  };
}
const Et = {
  generateId: it,
  addToQueue: nt,
  removeFromVisible: ot,
  processQueue: U,
  getQueue: O,
  getVisible: k,
  clearAll: st,
  findById: ht,
  VERSION: M,
  MODULE_ID: R,
  info: vt,
  healthCheck: yt,
  injectPorts: pt,
  getPorts: _t
};
ft && typeof window.__DEVTOOLS__ < "u" && (window.__DEVTOOLS__.ToastQueue = Et);
const $ = {
  success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>',
  warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
  error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
  critical: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>'
};
function wt(t) {
  return $[t] || $.info;
}
function It(t) {
  const { id: e, type: i, title: n, message: o, badge: l, actions: c, countdown: _, duration: C } = t, Q = a.colors[i] || a.colors.info, u = document.createElement("div");
  u.className = `toast-item toast-item--${i}`, u.id = e, u.setAttribute("role", "alert"), u.setAttribute("aria-live", i === "error" || i === "critical" ? "assertive" : "polite"), u.dataset.type = i;
  const ct = C > 0 ? `
    <div class="toast-item__circle-progress">
      <svg viewBox="0 0 24 24" class="toast-item__circle-svg">
        <circle class="toast-item__circle-bg" cx="12" cy="12" r="10" />
        <circle class="toast-item__circle-fill" cx="12" cy="12" r="10" data-duration="${C}" />
      </svg>
    </div>
  ` : "", lt = c != null && c.length ? `
    <div class="toast-item__actions">
      ${c.map((G, ut) => `
        <button class="toast-item__btn ${G.primary ? "toast-item__btn--primary" : "toast-item__btn--ghost"}" data-action-index="${ut}">${G.label}</button>
      `).join("")}
    </div>
  ` : "", dt = _ ? `<span class="toast-item__countdown" data-remaining="${_}"></span>` : "";
  return u.innerHTML = `
    <div class="toast-item__icon">${wt(i)}</div>
    <div class="toast-item__content">
      <div class="toast-item__header">
        <span class="toast-item__badge">${l || a.badges[i]}</span>
        <div class="toast-item__header-actions">
          ${ct}
          <button class="toast-item__close" data-action="close" aria-label="Fechar">${$.close}</button>
        </div>
      </div>
      ${n ? `<strong class="toast-item__title">${n}</strong>` : ""}
      ${o ? `<p class="toast-item__message">${o}${dt}</p>` : ""}
      ${lt}
    </div>
  `, u.style.setProperty("--toast-type-accent", Q.accent), u.style.setProperty("--toast-type-rgb", Q.rgb), u;
}
function K(t) {
  const e = Math.ceil(t / 1e3), i = Math.floor(e / 60), n = e % 60;
  return `${i}:${n.toString().padStart(2, "0")}`;
}
const X = "toast-service-styles", St = `
#toast-container {
  position: fixed;
  z-index: var(--toast-z-index, 10003);
  display: flex;
  flex-direction: column-reverse;
  gap: 12px;
  pointer-events: none;
}
#toast-container.position-bottom-right { bottom: 24px; right: 24px; }
#toast-container.position-bottom-left { bottom: 24px; left: 24px; }
#toast-container.position-top-right { top: 24px; right: 24px; flex-direction: column; }
#toast-container.position-top-left { top: 24px; left: 24px; flex-direction: column; }

.toast-item {
  position: relative;
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 18px;
  min-width: 300px;
  max-width: 420px;
  background: linear-gradient(135deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%);
  border: 1px solid rgba(var(--toast-type-rgb), 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(16px);
  font-family: 'Inter', system-ui, sans-serif;
  pointer-events: auto;
  transform: translateX(120%) scale(0.95);
  opacity: 0;
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
}
.toast-item.is-visible { transform: translateX(0) scale(1); opacity: 1; }
.toast-item.is-exiting { transform: translateX(50%) scale(0.95); opacity: 0; transition-duration: 0.2s; }

.toast-item--warning,
.toast-item--error,
.toast-item--critical { animation: toast-glow-pulse 3s ease-in-out infinite; }

@keyframes toast-glow-pulse {
  0%, 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 8px rgba(var(--toast-type-rgb), 0.15); }
  50% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), 0 0 16px rgba(var(--toast-type-rgb), 0.25); }
}

.toast-item__icon {
  width: 42px; height: 42px; min-width: 42px;
  display: flex; align-items: center; justify-content: center;
  background: rgba(var(--toast-type-rgb), 0.12);
  border: 1px solid rgba(var(--toast-type-rgb), 0.25);
  border-radius: 10px;
  color: var(--toast-type-accent);
  box-shadow: 0 0 10px rgba(var(--toast-type-rgb), 0.2);
  animation: toast-icon-glow 3s ease-in-out infinite;
}
.toast-item__icon svg { width: 22px; height: 22px; }

@keyframes toast-icon-glow {
  0%, 100% { box-shadow: 0 0 8px rgba(var(--toast-type-rgb), 0.2); }
  50% { box-shadow: 0 0 14px rgba(var(--toast-type-rgb), 0.3); }
}

.toast-item__content { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 8px; }
.toast-item__header { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.toast-item__header-actions { display: flex; align-items: center; gap: 8px; }

.toast-item__circle-progress { width: 24px; height: 24px; }
.toast-item__circle-svg { width: 24px; height: 24px; transform: rotate(-90deg); }
.toast-item__circle-bg { fill: none; stroke: rgba(255, 255, 255, 0.1); stroke-width: 2.5; }
.toast-item__circle-fill {
  fill: none;
  stroke: var(--toast-type-accent);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 62.83;
  stroke-dashoffset: 0;
  transition: stroke-dashoffset 0.1s linear;
}

.toast-item__badge {
  display: inline-flex; align-items: center; gap: 4px;
  padding: 4px 10px;
  font-size: 10px; font-weight: 700;
  letter-spacing: 0.5px; text-transform: uppercase;
  background: rgba(var(--toast-type-rgb), 0.15);
  color: var(--toast-type-accent);
  border: 1px solid rgba(var(--toast-type-rgb), 0.3);
  border-radius: 4px;
  white-space: nowrap;
}

.toast-item__close {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  background: transparent; border: none; border-radius: 6px;
  color: #94a3b8;
  cursor: pointer; transition: all 0.15s ease;
}
.toast-item__close:hover { background: rgba(255, 255, 255, 0.1); color: #f1f5f9; }
.toast-item__close svg { width: 16px; height: 16px; }

.toast-item__title { font-size: 14px; font-weight: 600; color: #f1f5f9; line-height: 1.45; margin: 0; }
.toast-item__message { font-size: 13px; font-weight: 400; color: #94a3b8; line-height: 1.45; margin: 0; }
.toast-item__countdown { font-weight: 700; color: var(--toast-type-accent); font-variant-numeric: tabular-nums; }

.toast-item__actions { display: flex; gap: 10px; margin-top: 4px; }
.toast-item__btn {
  display: inline-flex; align-items: center; justify-content: center; gap: 8px;
  padding: 10px 18px;
  font-size: 13px; font-weight: 600;
  font-family: 'Inter', system-ui, sans-serif;
  border-radius: 8px;
  cursor: pointer; transition: all 0.2s ease; white-space: nowrap; border: none;
}
.toast-item__btn--primary {
  background: linear-gradient(135deg, var(--toast-type-accent) 0%, color-mix(in srgb, var(--toast-type-accent) 80%, black) 100%);
  color: #111827;
  box-shadow: 0 2px 8px rgba(var(--toast-type-rgb), 0.25);
}
.toast-item__btn--primary:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(var(--toast-type-rgb), 0.35); }
.toast-item__btn--ghost {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #94a3b8;
}
.toast-item__btn--ghost:hover { background: rgba(255, 255, 255, 0.08); color: #f1f5f9; }

@media (max-width: 480px) {
  #toast-container { left: 16px !important; right: 16px !important; }
  #toast-container.position-bottom-right,
  #toast-container.position-bottom-left { bottom: 16px; }
  .toast-item { min-width: auto; max-width: none; transform: translateY(100%) scale(0.95); }
  .toast-item.is-visible { transform: translateY(0) scale(1); }
  .toast-item.is-exiting { transform: translateY(30%) scale(0.95); }
  .toast-item__actions { width: 100%; }
  .toast-item__btn { flex: 1; justify-content: center; }
}

@media (prefers-reduced-motion: reduce) {
  .toast-item, .toast-item__icon { animation: none !important; transition: opacity 0.1s ease !important; }
  .toast-item { transform: translateX(0); opacity: 0; }
  .toast-item.is-visible { opacity: 1; }
}

[data-theme="light"] .toast-item {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(248, 250, 252, 0.98) 100%);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
}
[data-theme="light"] .toast-item__title { color: #1e293b; }
[data-theme="light"] .toast-item__message { color: #64748b; }
[data-theme="light"] .toast-item__close:hover { background: rgba(0, 0, 0, 0.08); }
[data-theme="light"] .toast-item__circle-bg { stroke: rgba(0, 0, 0, 0.1); }
`;
function Ot() {
  if (document.getElementById(X)) return;
  const t = document.createElement("style");
  t.id = X, t.textContent = St, document.head.appendChild(t);
}
const s = Object.freeze({
  SHOWN: "toast:shown",
  DISMISSED: "toast:dismissed",
  DISMISSED_ALL: "toast:dismissed:all",
  READY: "toast:ready",
  QUEUE_UPDATED: "toast:queue:updated",
  ERROR: "toast:error",
  CLOSE_CLICKED: "toast:close:clicked",
  ACTION_CLICKED: "toast:action:clicked"
}), b = Object.freeze({
  SHOW: "toast:show",
  DISMISS: "toast:dismiss",
  DISMISS_ALL: "toast:dismiss:all",
  APP_ERROR: "app:error",
  API_ERROR: "api:error",
  AUTH_ERROR: "auth:error",
  VALIDATION_ERROR: "validation:error"
}), D = Object.freeze({
  SUCCESS: "success",
  INFO: "info",
  WARNING: "warning",
  ERROR: "error",
  CRITICAL: "critical"
}), kt = "2.1.0-P18EC", V = "toast.telemetry.tracker", H = N({ moduleId: V });
function q(t) {
  return H.get(t);
}
let g = { shown: 0, dismissed: 0, dismissedByUser: 0, dismissedByTimeout: 0, actionsClicked: 0, byType: { success: 0, info: 0, warning: 0, error: 0, critical: 0 }, errors: 0 };
function Dt(t) {
  return t === void 0 && (t = {}), t.eventBus && H.inject({ eventBus: t.eventBus }), { success: !0, hasEventBus: !!q("eventBus") };
}
function E(t, e) {
  e === void 0 && (e = {});
  const i = Object.assign({}, e, { module: V, timestamp: Date.now() });
  switch (t) {
    case s.SHOWN:
      g.shown++, e.type && g.byType[e.type] !== void 0 && g.byType[e.type]++;
      break;
    case s.DISMISSED:
      g.dismissed++, e.source === "user" && g.dismissedByUser++, e.source === "timeout" && g.dismissedByTimeout++;
      break;
    case s.ACTION_CLICKED:
      g.actionsClicked++;
      break;
    case s.ERROR:
      g.errors++;
      break;
  }
  const n = q("eventBus");
  return n && n.emit && n.emit(t, i), i;
}
function W() {
  return Object.assign({}, g);
}
function Ct() {
  return { moduleId: V, version: kt, metrics: W(), hasEventBus: !!q("eventBus"), portsInitialized: H.isInitialized(), catalogVersion: "TOAST_EVENTS" };
}
const w = "3.7.0-P2-ENTERPRISE", Tt = typeof window < "u", p = N({ moduleId: v });
function Rt() {
  p.init();
}
function f(t) {
  return p.get(t);
}
function At(t) {
  return p.inject(t);
}
function Lt() {
  return p.snapshot();
}
const Bt = function(t) {
  const e = Array.prototype.slice.call(arguments, 1), i = f("logger");
  if (!i) return;
  const n = i[t] || i.info;
  typeof n == "function" && n.apply(i, [`[${v}]`].concat(e));
};
let L = !1, r = null;
const x = /* @__PURE__ */ new Map();
let A = null, h = !1;
function Y() {
  if (r) return r;
  Ot(), r = document.getElementById("shell-toast-region"), r ? (h = !0, r.className = `position-${a.position}`) : (r = document.getElementById("toast-container"), r || (r = document.createElement("div"), r.id = "toast-container", r.className = `position-${a.position}`, document.body.appendChild(r)), h = !1);
  const t = f("eventBus");
  if (t && t.on) {
    const e = t.on(B.TOAST_SHOW, J);
    A = typeof e == "function" ? e : () => {
      t && t.off && t.off(B.TOAST_SHOW, J);
    };
  }
  return L = !0, r;
}
function J(t) {
  const e = t && t.detail ? t.detail : t;
  $t(e);
}
function $t(t) {
  const e = Y(), i = It(t), n = i.querySelector('[data-action="close"]');
  n && n.addEventListener("click", () => {
    E(s.CLOSE_CLICKED, { id: t.id, type: t.type }), I(t.id, "user");
  }), t.actions && t.actions.forEach((o, l) => {
    const c = i.querySelector(`[data-action-index="${l}"]`);
    c && c.addEventListener("click", () => {
      E(s.ACTION_CLICKED, { id: t.id, actionIndex: l, label: o.label }), o.onClick && o.onClick(), o.dismissOnClick !== !1 && I(t.id, "action");
    });
  }), e.appendChild(i), requestAnimationFrame(() => {
    i.classList.add("is-visible");
  }), E(s.SHOWN, { id: t.id, type: t.type, hasActions: t.actions && t.actions.length > 0 }), t.duration > 0 && Pt(t), t.countdown && jt(t, i);
}
function Pt(t) {
  const e = Date.now(), i = t.duration, n = document.getElementById(t.id), o = n ? n.querySelector(".toast-item__circle-fill") : null, l = 2 * Math.PI * 10, c = () => {
    const _ = Date.now() - e, C = Math.min(_ / i, 1);
    o && (o.style.strokeDashoffset = l * C), C >= 1 ? I(t.id, "timeout") : x.has(t.id) && requestAnimationFrame(c);
  };
  x.set(t.id, { startTime: e, duration: i }), requestAnimationFrame(c);
}
function jt(t, e) {
  const i = e.querySelector(".toast-item__countdown");
  if (!i) return;
  let n = t.countdown;
  i.textContent = K(n);
  const o = setInterval(() => {
    if (n -= 1e3, n <= 0) {
      clearInterval(o), t.onCountdownEnd && t.onCountdownEnd();
      return;
    }
    i.textContent = K(n);
  }, 1e3), l = x.get(t.id) || {};
  l.countdownInterval = o, x.set(t.id, l);
}
function rt(t) {
  const e = x.get(t);
  e && e.countdownInterval && clearInterval(e.countdownInterval), x.delete(t);
}
function T(t, e) {
  e === void 0 && (e = {});
  const i = f("eventBus");
  i && i.emit && i.emit(t, Object.assign({}, e, { source: v, timestamp: Date.now() }));
}
function Nt() {
  const t = f("eventBus");
  !t || !t.on || (t.on(b.SHOW, (e) => {
    y(e);
  }), t.on(b.DISMISS, (e) => {
    I(e.id, "external");
  }), t.on(b.DISMISS_ALL, () => {
    F();
  }), t.on(b.APP_ERROR, (e) => {
    j(e.message || "Erro na aplicação", { title: e.title || "Erro" });
  }), t.on(b.API_ERROR, (e) => {
    j(e.message || "Erro na API", { title: e.title || "Erro de API" });
  }), t.on(b.AUTH_ERROR, (e) => {
    P(e.message || "Erro de autenticação", { title: e.title || "Sessão" });
  }), t.on(b.VALIDATION_ERROR, (e) => {
    P(e.message || "Erro de validação", { title: e.title || "Validação" });
  }));
}
const Z = { success: "Sucesso", info: "Informação", warning: "Atenção", error: "Erro", critical: "Crítico" };
function zt(t) {
  return t === void 0 && (t = {}), t.position && (a.position = t.position), t.maxVisible && (a.maxVisible = t.maxVisible), t.zIndex && (a.zIndex = t.zIndex), Rt(), t.eventBus && p.inject({ eventBus: t.eventBus }), Dt({ eventBus: f("eventBus") }), Y(), Nt(), T(s.READY, { version: w }), E(s.READY, { version: w, usingEnterpriseRegion: h }), Bt("info", `v${w} initialized (EventBus: ${!!f("eventBus")}, EnterpriseRegion: ${h})`), Promise.resolve(!0);
}
function y(t, e, i) {
  Y();
  let n = {};
  if (typeof t == "string") {
    const l = t, c = e || "info", _ = i;
    n = { message: l, type: c, title: Z[c] || "Notificação" }, _ !== void 0 && (n.duration = _);
  } else
    n = t || {};
  const o = {
    id: n.id || it(),
    type: n.type || "info",
    title: n.title || Z[n.type] || "",
    message: n.message || "",
    badge: n.badge,
    actions: n.actions || [],
    countdown: n.countdown || 0,
    duration: n.duration !== void 0 ? n.duration : a.durations[n.type || "info"],
    onCountdownEnd: n.onCountdownEnd,
    createdAt: Date.now()
  };
  return nt(o), T(s.QUEUE_UPDATED, { queueLength: O().length, visibleCount: k().length }), o.id;
}
function Mt(t, e) {
  return e === void 0 && (e = {}), y(Object.assign({}, e, { type: D.SUCCESS, message: t, title: e.title || "Sucesso" }));
}
function Ut(t, e) {
  return e === void 0 && (e = {}), y(Object.assign({}, e, { type: D.INFO, message: t, title: e.title || "Informação" }));
}
function P(t, e) {
  return e === void 0 && (e = {}), y(Object.assign({}, e, { type: D.WARNING, message: t, title: e.title || "Atenção" }));
}
function j(t, e) {
  return e === void 0 && (e = {}), y(Object.assign({}, e, { type: D.ERROR, message: t, title: e.title || "Erro" }));
}
function Vt(t, e) {
  return e === void 0 && (e = {}), y(Object.assign({}, e, { type: D.CRITICAL, message: t, title: e.title || "Crítico", duration: 0 }));
}
function I(t, e) {
  e === void 0 && (e = "unknown");
  const i = document.getElementById(t);
  return i ? (i.classList.add("is-exiting"), rt(t), E(s.DISMISSED, { id: t, source: e }), T(s.DISMISSED, { id: t, source: e }), setTimeout(() => {
    i.remove(), ot(t), T(s.QUEUE_UPDATED, { queueLength: O().length, visibleCount: k().length });
  }, 200), !0) : !1;
}
function F() {
  const t = st();
  return t.forEach((e) => {
    const i = document.getElementById(e);
    i && (i.classList.add("is-exiting"), rt(e), setTimeout(() => {
      i.remove();
    }, 200));
  }), E(s.DISMISSED_ALL, { count: t.length }), T(s.DISMISSED_ALL, { count: t.length }), t.length;
}
function Ht(t) {
  a.position = t, r && (r.className = `position-${t}`);
}
function at() {
  return Object.assign({}, W(), {
    queueLength: O().length,
    visibleCount: k().length,
    activeTimers: x.size
  });
}
function qt() {
  if (A) {
    try {
      A();
    } catch {
    }
    A = null;
  }
  L = !1;
}
function Wt() {
  const t = f("logger"), e = {
    initialized: L,
    containerExists: !!r,
    hasEventBus: !!f("eventBus"),
    lowErrors: W().errors < 5,
    loggerReady: !!t,
    portsInitialized: p.isInitialized(),
    usingEnterpriseRegion: h
  }, i = Object.values(e).filter(Boolean).length;
  return {
    status: i >= 4 ? "HEALTHY" : i >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: `${i}/7`,
    checks: e,
    queueLength: O().length,
    visibleCount: k().length,
    position: a.position,
    version: w,
    moduleId: v,
    portsInitialized: p.isInitialized(),
    usingEnterpriseRegion: h,
    p18DualEmit: !0
  };
}
function Yt() {
  return {
    version: w,
    moduleId: v,
    initialized: L,
    hasEventBus: !!f("eventBus"),
    config: Object.assign({}, a),
    metrics: at(),
    telemetry: Ct(),
    portsInitialized: p.isInitialized(),
    usingEnterpriseRegion: h,
    p18DualEmit: !0
  };
}
const Ft = I, Qt = F, tt = {
  init: zt,
  show: y,
  success: Mt,
  info: Ut,
  warning: P,
  error: j,
  critical: Vt,
  dismiss: I,
  dismissAll: F,
  destroy: qt,
  setPosition: Ht,
  getQueue: O,
  getVisible: k,
  getMetrics: at,
  healthCheck: Wt,
  getInfo: Yt,
  remove: Ft,
  clear: Qt,
  injectPorts: At,
  getPorts: Lt,
  TOAST_EVENTS: s,
  TOAST_TYPES: D,
  VERSION: w,
  MODULE_ID: v
};
Tt && (z() ? gt("GLOBAL_EXPOSURE_BLOCKED", {
  module: v,
  target: "window.Toast",
  suggestion: "import ToastService from '/components/toast/service/dist/toast-service.bundle.js'"
}) : window.Toast = tt, typeof window.__DEVTOOLS__ < "u" && (window.__DEVTOOLS__.Toast = tt));
export {
  v as MODULE_ID,
  w as VERSION,
  Qt as clear,
  Vt as critical,
  tt as default,
  qt as destroy,
  I as dismiss,
  F as dismissAll,
  j as error,
  Yt as getInfo,
  at as getMetrics,
  Lt as getPorts,
  Wt as healthCheck,
  Ut as info,
  zt as init,
  At as injectPorts,
  Ft as remove,
  Ht as setPosition,
  y as show,
  Mt as success,
  P as warning
};
