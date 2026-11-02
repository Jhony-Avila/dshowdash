import { createCorePorts as U, createUiPorts as Ne } from "/core/runtime/ports-profiles.js";
import { isStrict as Be, recordViolation as He } from "/core/runtime/enterprise/strict-mode.js";
import { CONTEXT_EVENTS as B, TELEMETRY_EVENTS as je } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const T = "context-provider", ze = 5, Me = 300, $e = 5e4, ne = "5.3.1-ENTERPRISE", J = "context-registry", pe = U({ moduleId: J });
function Ee(e) {
  return pe.get(e);
}
const d = Object.freeze({ GLOBAL_STATE: "globalState", SESSION: "session", ENVIRONMENT: "environment", VERSION: "version", CONNECTIVITY: "connectivity", ORCHESTRATOR_INITIALIZED: "orchestrator.initialized", ORCHESTRATOR_TIMESTAMP: "orchestrator.timestamp", ORCHESTRATOR_PRESET: "orchestrator.preset", APP_SHELL: "appShell", ROUTER: "router", THEME: "theme", LAYOUT: "layout", LOCALE: "locale", ACCESSIBILITY: "accessibility", PERMISSIONS: "permissions", UI_MODAL: "ui.modal", UI_OVERLAY: "ui.overlay" });
function Fe() {
  const e = [], t = Object.keys(d);
  for (let r = 0; r < t.length; r++)
    e.push(d[t[r]]);
  return Object.freeze(e);
}
const ge = Fe(), q = Object.freeze(["__internal", "core.", "system."]), he = Object.freeze(["ui."]), y = /* @__PURE__ */ new Map(), z = /* @__PURE__ */ new Map(), Ye = () => {
  const e = Ee("config");
  return !!(e && e.app && e.app.debug);
}, M = function(e) {
  const t = Ee("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${J}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  Ye() && t.debug && t.debug(...[o].concat(r));
};
let A = { registerCount: 0, unregisterCount: 0, registerBlockedCount: 0, unregisterBlockedCount: 0, schemaCount: 0, uiAutoRegisters: 0, lastRegisterAt: null, lastUnregisterAt: null };
const a = {
  setDebug(e) {
  },
  register(e, t, r) {
    r || (r = {});
    try {
      if (!e || typeof e != "string")
        return M("warn", "Invalid context name"), A.registerBlockedCount++, !1;
      if (y.has(e))
        return M("info", "Context already registered:", e), !1;
      const o = { name: e, registeredAt: Date.now(), schema: t || null, active: !0, owner: r.owner || "unknown", type: r.type || (this.isCoreContext(e) ? "core" : "custom"), lifetime: r.lifetime || "app", description: r.description || "" };
      return y.set(e, o), t && (z.set(e, t), A.schemaCount++), A.registerCount++, A.lastRegisterAt = Date.now(), M("info", "Context registered:", e, "(type:", `${o.type})`), !0;
    } catch (o) {
      return M("error", "register error:", o.message), !1;
    }
  },
  unregister(e) {
    try {
      if (!y.has(e)) return !1;
      if (this.isCoreContext(e))
        return M("warn", "Cannot unregister core context:", e), A.unregisterBlockedCount++, !1;
      const t = z.has(e);
      return y.delete(e), z.delete(e), t && A.schemaCount--, A.unregisterCount++, A.lastUnregisterAt = Date.now(), M("info", "Context unregistered:", e), !0;
    } catch (t) {
      return M("error", "unregister error:", t.message), !1;
    }
  },
  has(e) {
    return y.has(e);
  },
  get(e) {
    return y.get(e) || null;
  },
  getSchema(e) {
    return z.get(e) || null;
  },
  isCoreContext(e) {
    if (!e) return !1;
    if (ge.indexOf(e) !== -1) return !0;
    for (let t = 0; t < q.length; t++)
      if (e.indexOf(q[t]) === 0) return !0;
    return e.indexOf("orchestrator.") === 0 || e.indexOf("ui.modal.") === 0 || e.indexOf("ui.overlay.") === 0;
  },
  isUIContext(e) {
    if (!e) return !1;
    for (let t = 0; t < he.length; t++)
      if (e.indexOf(he[t]) === 0) return !0;
    return !1;
  },
  isReservedPrefix(e) {
    if (!e) return !1;
    for (let t = 0; t < q.length; t++)
      if (e.indexOf(q[t]) === 0) return !0;
    return !1;
  },
  getContextMeta(e) {
    return y.get(e) || null;
  },
  listCoreContexts() {
    return ge;
  },
  list() {
    return Array.from(y.keys());
  },
  listAll() {
    const e = [];
    return y.forEach((t, r) => {
      e.push(Object.assign({ name: r }, t));
    }), e;
  },
  listByType(e) {
    const t = [];
    return y.forEach((r, o) => {
      r.type === e && t.push(Object.assign({ name: o }, r));
    }), t;
  },
  listUIContexts() {
    const e = this, t = [];
    return y.forEach((r, o) => {
      e.isUIContext(o) && t.push(Object.assign({ name: o }, r));
    }), t;
  },
  clear() {
    y.clear(), z.clear(), M("info", "All contexts cleared");
  },
  clearCustomOnly() {
    const e = this, t = [];
    return y.forEach((r, o) => {
      r.type !== "core" && !e.isCoreContext(o) && t.push(o);
    }), t.forEach((r) => {
      y.delete(r), z.delete(r);
    }), M("info", "Custom contexts cleared:", t.length), t.length;
  },
  count() {
    return y.size;
  },
  _hasReservedPrefixCustom() {
    const e = this;
    let t = !1;
    return y.forEach((r, o) => {
      r.type === "custom" && e.isReservedPrefix(o) && (t = !0);
    }), t;
  },
  trackUIAutoRegister() {
    A.uiAutoRegisters++;
  },
  healthCheck() {
    const e = pe.snapshot(), t = { hasContexts: y.size > 0, hasCoreContexts: this.listByType("core").length > 0, hasUIContexts: this.listUIContexts().length > 0, schemasValid: A.schemaCount >= 0, lowBlockedRegisters: A.registerBlockedCount < 5, noReservedPrefixCustom: !this._hasReservedPrefixCustom(), loggerAvailable: !!Ee("logger"), portsInitialized: e._initialized }, r = Object.keys(t);
    let o = 0;
    for (let c = 0; c < r.length; c++)
      t[r[c]] && o++;
    const i = r.length;
    let l = "HEALTHY";
    o < i * 0.5 ? l = "UNHEALTHY" : o < i && (l = "DEGRADED");
    const n = [];
    return t.hasContexts || n.push("No contexts registered"), t.hasCoreContexts || n.push("No core contexts registered"), t.hasUIContexts || n.push("No UI contexts registered"), t.lowBlockedRegisters || n.push(`${A.registerBlockedCount} blocked register attempts`), t.noReservedPrefixCustom || n.push("Custom context using reserved prefix"), { status: l, score: `${o}/${i}`, healthy: o >= 5, checks: t, issues: n.length > 0 ? n : null, version: ne, moduleId: J, portsInitialized: e._initialized, timestamp: Date.now() };
  },
  getStats() {
    let e = 0, t = 0, r = 0;
    const o = this;
    return y.forEach((i, l) => {
      i.type === "core" || o.isCoreContext(l) ? e++ : t++, o.isUIContext(l) && r++;
    }), { version: ne, moduleId: J, total: y.size, core: e, custom: t, ui: r, withSchema: z.size, contexts: this.list() };
  },
  info() {
    const e = pe.snapshot();
    return { version: ne, moduleId: J, counts: { total: y.size, core: this.listByType("core").length, custom: this.listByType("custom").length, ui: this.listUIContexts().length, withSchema: z.size }, metrics: Object.assign({}, A), portsInitialized: e._initialized, healthCheck: this.healthCheck(), coreContextsAvailable: ge.length, reservedPrefixes: q, uiPrefixes: he, timestamp: Date.now() };
  },
  resetMetrics() {
    A = { registerCount: 0, unregisterCount: 0, registerBlockedCount: 0, unregisterBlockedCount: 0, schemaCount: z.size, uiAutoRegisters: 0, lastRegisterAt: null, lastUnregisterAt: null };
  },
  getVersion() {
    return ne;
  }
}, ie = "4.4.0-P17WI", F = "context-store", be = U({ moduleId: F });
function se(e) {
  return be.get(e);
}
const qe = !0, Xe = () => {
  const e = se("config");
  return !!(e && e.app && e.app.debug);
}, O = function(e) {
  const t = se("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${F}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  Xe() && t.debug && t.debug(...[o].concat(r));
}, m = /* @__PURE__ */ new Map(), L = /* @__PURE__ */ new Set();
let S = { setCount: 0, getCount: 0, deleteCount: 0, clearCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, listenerNotifyCount: 0, listenerErrorCount: 0, lastSetAt: null, lastGetAt: null, lastClearAt: null };
function Ke(e, t) {
  t || (t = {});
  try {
    const r = se("telemetry");
    r && r.track && r.track(e, Object.assign({ component: F }, t));
  } catch {
  }
}
const C = {
  set(e, t) {
    try {
      const r = m.get(e);
      return m.set(e, t), S.setCount++, S.lastSetAt = Date.now(), this._notifyListeners("set", e, t, r), O("info", "Set:", e), !0;
    } catch (r) {
      return O("error", "set error:", r.message), !1;
    }
  },
  get(e) {
    try {
      return S.getCount++, S.lastGetAt = Date.now(), m.get(e);
    } catch (t) {
      O("error", "get error:", t.message);
      return;
    }
  },
  has(e) {
    return m.has(e);
  },
  delete(e) {
    try {
      const t = m.has(e);
      if (t) {
        const r = m.get(e);
        m.delete(e), S.deleteCount++, this._notifyListeners("delete", e, void 0, r), O("info", "Deleted:", e);
      }
      return t;
    } catch (t) {
      return O("error", "delete error:", t.message), !1;
    }
  },
  clear() {
    try {
      const e = m.size;
      m.clear(), S.clearCount++, S.lastClearAt = Date.now(), this._notifyListeners("clear", null, null, null), O("info", "Store cleared"), Ke("context:store:cleared", { previousSize: e, clearCount: S.clearCount });
    } catch (e) {
      O("error", "clear error:", e.message);
    }
  },
  keys() {
    try {
      return Array.from(m.keys());
    } catch {
      return [];
    }
  },
  values() {
    try {
      return Array.from(m.values());
    } catch {
      return [];
    }
  },
  entries() {
    try {
      return Array.from(m.entries());
    } catch {
      return [];
    }
  },
  size() {
    return m.size;
  },
  toObject() {
    try {
      const e = {};
      return m.forEach((t, r) => {
        e[r] = t;
      }), e;
    } catch (e) {
      return O("error", "toObject error:", e.message), {};
    }
  },
  subscribe(e) {
    return typeof e != "function" ? (O("error", "Listener must be a function"), () => {
    }) : (L.add(e), S.listenerAddCount++, O("info", "Listener added, total:", L.size), () => {
      L.delete(e), S.listenerRemoveCount++, O("info", "Listener removed, total:", L.size);
    });
  },
  _notifyListeners(e, t, r, o) {
    S.listenerNotifyCount++, L.forEach((i) => {
      try {
        i({ action: e, key: t, newValue: r, oldValue: o });
      } catch (l) {
        S.listenerErrorCount++, O("error", "Error in listener:", l.message);
      }
    });
  },
  healthCheck() {
    const e = be.snapshot(), t = { storeInitialized: m instanceof Map, listenersInitialized: L instanceof Set, noListenerErrors: S.listenerErrorCount === 0, hasData: m.size > 0, lowClearCount: S.clearCount < 10, loggerAvailable: !!se("logger"), telemetryAvailable: !!se("telemetry"), portsInitialized: e._initialized }, r = Object.values(t).filter(Boolean).length, o = Object.keys(t).length;
    let i = "HEALTHY";
    r < o * 0.5 ? i = "UNHEALTHY" : r < o && (i = "DEGRADED");
    const l = [];
    return t.storeInitialized || l.push("Store not initialized"), t.listenersInitialized || l.push("Listeners not initialized"), t.noListenerErrors || l.push(`${S.listenerErrorCount} listener errors`), t.hasData || l.push("Store is empty"), t.lowClearCount || l.push(`High clear count: ${S.clearCount}`), { status: i, score: r, maxScore: o, scoreDisplay: `${r}/${o}`, checks: t, issues: l, version: ie, moduleId: F, portsInitialized: e._initialized, timestamp: Date.now() };
  },
  getStats() {
    return { version: ie, moduleId: F, size: m.size, keys: Array.from(m.keys()), listenerCount: L.size };
  },
  info() {
    const e = be.snapshot();
    return { version: ie, moduleId: F, internalUseOnly: qe, size: m.size, listenerCount: L.size, metrics: Object.assign({}, S), portsInitialized: e._initialized, healthCheck: this.healthCheck(), note: "Este modulo e interno. Use ContextProvider.set/get." };
  },
  resetMetrics() {
    S = { setCount: 0, getCount: 0, deleteCount: 0, clearCount: 0, listenerAddCount: 0, listenerRemoveCount: 0, listenerNotifyCount: 0, listenerErrorCount: 0, lastSetAt: null, lastGetAt: null, lastClearAt: null };
  },
  getVersion() {
    return ie;
  }
}, Te = "4.4.0-P17WI", fe = "context-telemetry", Ue = U({ moduleId: fe });
function de(e) {
  return Ue.get(e);
}
const We = () => {
  const e = de("config");
  return !!(e && e.app && e.app.debug);
}, Le = function(e) {
  const t = de("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${fe}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  We() && t.debug && t.debug(...[o].concat(r));
}, _e = "context-provider", k = [], Pe = 1e3;
let Ze = !1, f = { totalEvents: 0, eventsByType: {}, contextMetrics: {}, globalStateUpdates: 0, orchestratorUpdates: 0, subscriberErrors: 0, telemetryCoreForwards: 0, eventBusForwards: 0, sanitizationCount: 0, lastEventAt: null };
const g = (e, t) => {
  t || (t = {});
  try {
    const r = { timestamp: Date.now(), component: _e, event: e, data: Qe(t), sessionId: De() };
    k.push(r), k.length > Pe && k.shift(), f.totalEvents++, f.eventsByType[e] = (f.eventsByType[e] || 0) + 1, f.lastEventAt = Date.now(), t.key && (f.contextMetrics[t.key] || (f.contextMetrics[t.key] = { events: 0, lastEventAt: null }), f.contextMetrics[t.key].events++, f.contextMetrics[t.key].lastEventAt = Date.now()), e.indexOf("global-state") !== -1 && f.globalStateUpdates++, e.indexOf("orchestrator") !== -1 && f.orchestratorUpdates++, e.indexOf("subscriber:error") !== -1 && f.subscriberErrors++;
    try {
      const o = de("telemetry");
      o && o.track && (o.track(e, Object.assign({ component: _e }, t)), f.telemetryCoreForwards++);
    } catch {
    }
    try {
      const o = de("eventBus");
      o && o.emit && (o.emit(je.EVENT, r), f.eventBusForwards++);
    } catch {
    }
    return r;
  } catch (r) {
    return Le("error", "trackContextEvent error:", r.message), null;
  }
}, Qe = (e) => {
  if (!e || typeof e != "object") return e;
  try {
    f.sanitizationCount++;
    const t = {}, r = 200, o = 10;
    let i = 0;
    for (const l in e) {
      if (!e.hasOwnProperty(l)) continue;
      if (i >= o) {
        t._truncated = !0;
        break;
      }
      const n = e[l];
      typeof n == "string" && n.length > r ? t[l] = `${n.substring(0, r)}...` : typeof n == "object" && n !== null ? t[l] = "[Object]" : t[l] = n, i++;
    }
    return t;
  } catch {
    return { error: "sanitization-failed" };
  }
}, De = () => {
  try {
    return typeof window > "u" ? "server-side" : (window._contextProviderSessionId || (window._contextProviderSessionId = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`), window._contextProviderSessionId);
  } catch {
    return "unknown";
  }
}, Je = () => {
  try {
    return k.slice();
  } catch {
    return [];
  }
}, et = (e) => {
  e || (e = 10);
  try {
    const t = Math.min(Math.max(1, e), k.length);
    return k.slice(-t);
  } catch {
    return [];
  }
}, tt = (e) => {
  const t = [];
  for (const r in f.contextMetrics)
    if (f.contextMetrics.hasOwnProperty(r)) {
      const o = f.contextMetrics[r];
      o.events > e && t.push({ context: r, events: o.events, lastEventAt: o.lastEventAt });
    }
  return t.sort((r, o) => o.events - r.events);
}, X = () => {
  const e = Ue.snapshot();
  try {
    const t = tt(50);
    return { version: Te, moduleId: fe, eventsCount: k.length, maxSize: Pe, recentCount: Math.min(k.length, 10), sessionId: De(), metrics: { totalEvents: f.totalEvents, globalStateUpdates: f.globalStateUpdates, orchestratorUpdates: f.orchestratorUpdates, subscriberErrors: f.subscriberErrors, lastEventAt: f.lastEventAt, topEvents: rt(5), contextCount: Object.keys(f.contextMetrics).length }, hotContexts: t.length > 0 ? t : null, portsInitialized: e._initialized };
  } catch (t) {
    return { version: Te, moduleId: fe, eventsCount: 0, error: t.message };
  }
}, rt = (e) => {
  try {
    const t = Object.entries(f.eventsByType).sort((r, o) => o[1] - r[1]).slice(0, e);
    return Object.fromEntries(t);
  } catch {
    return {};
  }
}, ot = () => {
  f = { totalEvents: 0, eventsByType: {}, contextMetrics: {}, globalStateUpdates: 0, orchestratorUpdates: 0, subscriberErrors: 0, telemetryCoreForwards: 0, eventBusForwards: 0, sanitizationCount: 0, lastEventAt: null }, Le("info", "Metrics reset");
}, st = "context-helpers";
U({ moduleId: st });
let V = { deepCloneCount: 0, deepMergeCount: 0, isEqualCount: 0, validationCount: 0, validationFailures: 0, selectorCount: 0, debounceCount: 0, throttleCount: 0 };
const ye = (e, t) => {
  try {
    if (V.isEqualCount++, e === t) return !0;
    if (e === null || t === null || typeof e != typeof t) return !1;
    if (typeof e != "object") return e === t;
    if (Array.isArray(e) !== Array.isArray(t)) return !1;
    if (Array.isArray(e))
      return e.length !== t.length ? !1 : e.every((i, l) => ye(i, t[l]));
    const r = Object.keys(e), o = Object.keys(t);
    return r.length !== o.length ? !1 : r.every((i) => ye(e[i], t[i]));
  } catch {
    return !1;
  }
}, nt = (e, t) => {
  try {
    if (V.validationCount++, !t) return { valid: !0 };
    if (t.type) {
      const r = Array.isArray(e) ? "array" : typeof e;
      if (r !== t.type)
        return V.validationFailures++, { valid: !1, error: `Expected type "${t.type}", got "${r}"`, details: { expected: t.type, received: r } };
    }
    if (t.required && e === void 0)
      return V.validationFailures++, { valid: !1, error: "Value is required" };
    if (t.properties && typeof e == "object" && e !== null) {
      for (const r in t.properties)
        if (t.properties.hasOwnProperty(r) && t.properties[r].required && e[r] === void 0)
          return V.validationFailures++, { valid: !1, error: `Property "${r}" is required`, details: { missingProperty: r } };
    }
    return t.enum && t.enum.indexOf(e) === -1 ? (V.validationFailures++, { valid: !1, error: `Value must be one of: ${t.enum.join(", ")}`, details: { allowedValues: t.enum, received: e } }) : { valid: !0 };
  } catch (r) {
    return V.validationFailures++, { valid: !1, error: r.message };
  }
}, ae = "5.3.1-ENTERPRISE", ee = "context-provider-core", Ce = U({ moduleId: ee });
function xe(e) {
  return Ce.get(e);
}
const b = /* @__PURE__ */ new Map(), it = () => {
  const e = xe("config");
  return !!(e && e.app && e.app.debug);
}, p = function(e) {
  const t = xe("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${ee}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  it() && t.debug && t.debug(...[o].concat(r));
};
let u = { totalSets: 0, totalGets: 0, setsByContext: {}, subscriberErrors: 0, skippedUpdates: 0, blockedSets: 0, autoRegisters: 0, uiAutoRegisters: 0, validationFailures: 0, lastSetAt: null, lastGetAt: null };
const te = Object.freeze(["AppShell", "RouterGlobal", "Main", "Orchestrator", "LoginModal", "Preloader", "GlobalState", "SessionManager", "ContextLifecycle", "ContextProvider", "LayoutManager", "PermissionsGuard", "ThemeManager", "ModalManager", "OverlayLayer"]), h = {
  setDebug(e) {
    a.setDebug && a.setDebug(e), C.setDebug && C.setDebug(e);
  },
  set(e, t, r, o) {
    r === void 0 && (r = !1), o || (o = {});
    try {
      const i = a.isCoreContext(e), l = a.isUIContext ? a.isUIContext(e) : !1, n = o.owner || "unknown";
      if (i && r && te.indexOf(n) === -1) {
        p("warn", `Blocked: unauthorized set on core context "${e}" by "${n}"`), u.blockedSets++;
        try {
          g("context:core:blocked", { key: e, owner: n, reason: "unauthorized", authorizedOwners: te });
        } catch {
        }
        return !1;
      }
      if (!a.has(e)) {
        if (a.isReservedPrefix(e))
          return p("warn", `Blocked: reserved prefix in context name "${e}"`), u.blockedSets++, !1;
        if (l) {
          p("warn", `UI Context "${e}" not pre-registered. Auto-registering...`), u.uiAutoRegisters++, a.trackUIAutoRegister && a.trackUIAutoRegister();
          try {
            g("context:ui:auto-register", { key: e, owner: n });
          } catch {
          }
        } else
          p("warn", `Context "${e}" not registered. Auto-registering...`);
        u.autoRegisters++, a.register(e, null, { owner: n, type: l ? "ui" : "custom" });
      }
      if (r) {
        const x = a.getSchema(e);
        if (x) {
          const _ = nt(t, x);
          if (!_.valid) {
            u.validationFailures++;
            const v = a.getContextMeta(e), Re = { key: e, error: _.error, owner: v ? v.owner : null, lifetime: v ? v.lifetime : null, expectedType: x.type, receivedType: Array.isArray(t) ? "array" : typeof t };
            try {
              g("context:value:invalid", Re);
            } catch {
            }
            return p("warn", `Value for "${e}" failed validation:`, Re), !1;
          }
        }
      }
      const c = C.get(e);
      if (ye(c, t))
        return u.skippedUpdates++, !0;
      C.set(e, t), u.totalSets++, u.setsByContext[e] = (u.setsByContext[e] || 0) + 1, u.lastSetAt = Date.now();
      try {
        g("context:value:set", { key: e, hasOldValue: c !== void 0, owner: n, isUI: l });
      } catch {
      }
      return this._notifySubscribers(e, t, c), p("info", "Set:", e, "(owner:", `${n})`), !0;
    } catch (i) {
      return p("error", "set error:", i.message), !1;
    }
  },
  get(e) {
    try {
      if (u.totalGets++, u.lastGetAt = Date.now(), !a.has(e)) {
        p("warn", `Context "${e}" not registered`);
        return;
      }
      return C.get(e);
    } catch (t) {
      p("error", "get error:", t.message);
      return;
    }
  },
  getAll() {
    try {
      const e = {};
      return a.list().forEach((t) => {
        e[t] = C.get(t);
      }), e;
    } catch (e) {
      return p("error", "getAll error:", e.message), {};
    }
  },
  inspectAll() {
    const e = this;
    try {
      const t = [];
      return a.list().forEach((r) => {
        const o = a.getContextMeta(r);
        t.push({ name: r, value: C.get(r), meta: o ? { owner: o.owner, type: o.type, lifetime: o.lifetime, description: o.description, registeredAt: o.registeredAt } : null, subscribers: e.getSubscriberCount(r), setCount: u.setsByContext[r] || 0 });
      }), t;
    } catch (t) {
      return p("error", "inspectAll error:", t.message), [];
    }
  },
  subscribe(e, t, r) {
    const o = this;
    r || (r = {});
    try {
      if (typeof t != "function")
        return p("error", "Handler must be a function"), () => {
        };
      if (r.strict && !a.has(e))
        return p("warn", `Cannot subscribe to unregistered context "${e}" in strict mode`), () => {
        };
      b.has(e) || b.set(e, /* @__PURE__ */ new Set()), b.get(e).add(t), p("info", "Subscriber added for:", e);
      try {
        g("context:subscriber:added", { key: e, totalForKey: b.get(e).size });
      } catch {
      }
      return () => {
        o.unsubscribe(e, t);
      };
    } catch (i) {
      return p("error", "subscribe error:", i.message), () => {
      };
    }
  },
  unsubscribe(e, t) {
    try {
      if (!b.has(e)) return !1;
      const r = b.get(e).delete(t);
      if (r) {
        p("info", "Subscriber removed for:", e);
        try {
          g("context:subscriber:removed", { key: e });
        } catch {
        }
      }
      return b.get(e).size === 0 && b.delete(e), r;
    } catch (r) {
      return p("error", "unsubscribe error:", r.message), !1;
    }
  },
  _notifySubscribers(e, t, r) {
    if (!b.has(e)) return;
    b.get(e).forEach((i) => {
      try {
        i(t, r, e);
      } catch (l) {
        u.subscriberErrors++;
        const n = { key: e, error: l.message || "Unknown error", handlerName: i.name || "anonymous" };
        p("error", `Error in subscriber for "${e}":`, n);
        try {
          g("context:subscriber:error", n);
        } catch {
        }
      }
    });
  },
  hasSubscribers(e) {
    return b.has(e) && b.get(e).size > 0;
  },
  getSubscriberCount(e) {
    return b.has(e) ? b.get(e).size : 0;
  },
  getSubscriberStats() {
    let e = 0;
    const t = {};
    return b.forEach((r, o) => {
      const i = r.size;
      e += i, t[o] = i;
    }), { version: ae, moduleId: ee, total: e, contextCount: b.size, byContext: t, metrics: Object.assign({}, u) };
  },
  clearSubscribers(e) {
    try {
      if (b.has(e)) {
        b.delete(e), p("info", "Subscribers cleared for:", e);
        try {
          g("context:subscribers:cleared", { key: e });
        } catch {
        }
        return !0;
      }
      return !1;
    } catch (t) {
      return p("error", "clearSubscribers error:", t.message), !1;
    }
  },
  clearAllSubscribers() {
    try {
      b.clear(), p("info", "All subscribers cleared");
      try {
        g("context:subscribers:all-cleared");
      } catch {
      }
    } catch (e) {
      p("error", "clearAllSubscribers error:", e.message);
    }
  },
  healthCheck() {
    const e = Ce.snapshot(), t = { subscribersInitialized: b instanceof Map, registryAvailable: typeof a.has == "function", storeAvailable: typeof C.get == "function", lowBlockedSets: u.blockedSets < 10, lowSubscriberErrors: u.subscriberErrors < 5, lowValidationFailures: u.validationFailures < 10, lowUIAutoRegisters: u.uiAutoRegisters < 5, loggerAvailable: !!xe("logger"), portsInitialized: e._initialized }, r = Object.keys(t);
    let o = 0;
    for (let c = 0; c < r.length; c++)
      t[r[c]] && o++;
    const i = r.length;
    let l = "HEALTHY";
    o < i * 0.5 ? l = "UNHEALTHY" : o < i && (l = "DEGRADED");
    const n = [];
    return t.subscribersInitialized || n.push("Subscribers not initialized"), t.registryAvailable || n.push("Registry not available"), t.storeAvailable || n.push("Store not available"), t.lowBlockedSets || n.push(`${u.blockedSets} blocked set attempts`), t.lowSubscriberErrors || n.push(`${u.subscriberErrors} subscriber errors`), t.lowValidationFailures || n.push(`${u.validationFailures} validation failures`), t.lowUIAutoRegisters || n.push(`${u.uiAutoRegisters} UI auto-registers`), { status: l, score: `${o}/${i}`, healthy: o >= 6, checks: t, issues: n.length > 0 ? n : null, version: ae, moduleId: ee, portsInitialized: e._initialized, timestamp: Date.now() };
  },
  info() {
    const e = Ce.snapshot();
    return { version: ae, moduleId: ee, subscriberCount: b.size, totalSubscribers: this.getSubscriberStats().total, metrics: Object.assign({}, u), portsInitialized: e._initialized, healthCheck: this.healthCheck(), authorizedOwners: te, timestamp: Date.now() };
  },
  resetMetrics() {
    u = { totalSets: 0, totalGets: 0, setsByContext: {}, subscriberErrors: 0, skippedUpdates: 0, blockedSets: 0, autoRegisters: 0, uiAutoRegisters: 0, validationFailures: 0, lastSetAt: null, lastGetAt: null };
  },
  getVersion() {
    return ae;
  }
}, le = "5.3.1-ENTERPRISE", re = "context-lifecycle", oe = U({ moduleId: re });
function at() {
  oe.init();
}
function ve(e) {
  return oe.get(e);
}
const lt = () => {
  const e = ve("config");
  return !!(e && e.app && e.app.debug);
}, w = function(e) {
  const t = ve("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${re}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  lt() && t.debug && t.debug(...[o].concat(r));
};
let P = !1, H = !1, I = { initCount: 0, hydrateCount: 0, resetCount: 0, resetPartialCount: 0, cleanupCount: 0, lastInitAt: null, lastHydrateAt: null, lastResetAt: null, lastCleanupAt: null };
const K = Object.freeze([
  { name: d.SESSION, defaultValue: { authenticated: !1, user: null, token: null }, owner: "SessionManager", type: "core", lifetime: "session", description: "Dados de autenticacao do usuario" },
  { name: d.ENVIRONMENT, defaultValue: { mode: "production", endpoints: {} }, owner: "EnvironmentManager", type: "core", lifetime: "app", description: "Configuracoes de ambiente" },
  { name: d.THEME, defaultValue: { active: "light", tokens: {} }, owner: "ThemeManager", type: "core", lifetime: "app", description: "Tema ativo e tokens de design" },
  { name: d.LAYOUT, defaultValue: { mode: "default", breakpoint: "desktop", compact: !1 }, owner: "LayoutManager", type: "core", lifetime: "app", description: "Estado do layout" },
  { name: d.LOCALE, defaultValue: { language: "pt-BR", fallback: "en-US" }, owner: "LocaleManager", type: "core", lifetime: "app", description: "Configuracoes de idioma" },
  { name: d.ACCESSIBILITY, defaultValue: { reducedMotion: !1, highContrast: !1 }, owner: "AccessibilityManager", type: "core", lifetime: "app", description: "Preferencias de acessibilidade" },
  { name: d.PERMISSIONS, defaultValue: { roles: [], capabilities: [] }, owner: "PermissionsGuard", type: "core", lifetime: "session", description: "Roles e capabilities" },
  { name: d.CONNECTIVITY, defaultValue: { online: !0, slow: !1 }, owner: "ConnectivityMonitor", type: "core", lifetime: "app", description: "Status de conectividade" },
  { name: d.VERSION, defaultValue: { app: "4.0.0", swUpdated: !1 }, owner: "VersionManager", type: "core", lifetime: "app", description: "Versao da aplicacao" },
  { name: d.GLOBAL_STATE, defaultValue: null, owner: "GlobalState", type: "core", lifetime: "session", description: "Snapshot mapeado do GlobalState" },
  { name: d.UI_MODAL, defaultValue: { stack: [], hasBlocking: !1, activeCount: 0 }, owner: "ModalManager", type: "ui", lifetime: "app", description: "Estado centralizado de modais" },
  { name: d.UI_OVERLAY, defaultValue: { stack: [], hasBlocking: !1, activeCount: 0 }, owner: "OverlayLayer", type: "ui", lifetime: "app", description: "Estado centralizado de overlays" }
]), R = {
  setDebug(e) {
    a.setDebug && a.setDebug(e), h.setDebug && h.setDebug(e), C.setDebug && C.setDebug(e);
  },
  init(e) {
    if (e || (e = {}), P) {
      w("warn", "Already initialized");
      try {
        g("context:lifecycle:init:skipped", { reason: "already-initialized" });
      } catch {
      }
      return Promise.resolve(!1);
    }
    at();
    try {
      g("context:lifecycle:init:start");
    } catch {
    }
    try {
      K.forEach((o) => {
        a.has(o.name) || (a.register(o.name, o.schema || null, { owner: o.owner || "unknown", type: o.type || "core", lifetime: o.lifetime || "app", description: o.description || "" }), o.defaultValue !== void 0 && C.set(o.name, o.defaultValue));
      }), e.contexts && Array.isArray(e.contexts) && e.contexts.forEach((o) => {
        a.has(o.name) || (a.register(o.name, o.schema || null, { owner: o.owner || "unknown", type: o.type || "custom", lifetime: o.lifetime || "app", description: o.description || "" }), o.defaultValue !== void 0 && C.set(o.name, o.defaultValue));
      }), P = !0, I.initCount++, I.lastInitAt = Date.now();
      const t = a.count(), r = a.listUIContexts ? a.listUIContexts().length : 0;
      w("info", "Lifecycle initialized with", t, "contexts (", r, "UI)");
      try {
        g("context:lifecycle:init:complete", { coreContexts: K.length, uiContexts: r, customContexts: e.contexts ? e.contexts.length : 0, totalContexts: t, initCount: I.initCount });
      } catch {
      }
      return Promise.resolve(!0);
    } catch (t) {
      w("error", "Init failed:", t.message);
      try {
        g("context:lifecycle:init:error", { error: t.message });
      } catch {
      }
      return Promise.resolve(!1);
    }
  },
  hydrate(e) {
    if (e || (e = {}), !P)
      return w("warn", "Must initialize before hydrating"), Promise.resolve(!1);
    if (H)
      return w("warn", "Already hydrated"), Promise.resolve(!1);
    try {
      g("context:lifecycle:hydrate:start");
    } catch {
    }
    try {
      let t = 0;
      Object.keys(e).forEach((r) => {
        a.has(r) ? (h.set(r, e[r], !1, { owner: "ContextLifecycle" }), t++) : w("warn", `Unknown context "${r}" during hydration`);
      }), H = !0, I.hydrateCount++, I.lastHydrateAt = Date.now(), w("info", "Hydrated", t, "contexts");
      try {
        g("context:lifecycle:hydrate:complete", { keysHydrated: t });
      } catch {
      }
      return Promise.resolve(!0);
    } catch (t) {
      w("error", "Hydration failed:", t.message);
      try {
        g("context:lifecycle:hydrate:error", { error: t.message });
      } catch {
      }
      return Promise.resolve(!1);
    }
  },
  reset(e) {
    e || (e = {});
    try {
      g("context:lifecycle:reset:start", { keepCore: e.keepCore || !1 });
    } catch {
    }
    try {
      if (e.keepCore) {
        const t = a.clearCustomOnly();
        h.clearAllSubscribers(), h.resetMetrics(), K.forEach((r) => {
          r.defaultValue !== void 0 && C.set(r.name, r.defaultValue);
        }), I.resetPartialCount++, I.lastResetAt = Date.now(), w("info", "Lifecycle partial reset complete (kept core)", { clearedCustom: t });
        try {
          g("context:lifecycle:reset:complete", { mode: "custom-only", resetPartialCount: I.resetPartialCount, clearedCustom: t });
        } catch {
        }
        return !0;
      }
      h.clearAllSubscribers(), h.resetMetrics(), C.clear(), a.clear();
      try {
        ot();
      } catch {
      }
      P = !1, H = !1, I.resetCount++, I.lastResetAt = Date.now(), w("info", "Lifecycle reset complete");
      try {
        g("context:lifecycle:reset:complete", { mode: "full", resetCount: I.resetCount });
      } catch {
      }
      return !0;
    } catch (t) {
      return w("error", "Reset failed:", t.message), !1;
    }
  },
  cleanup() {
    try {
      g("context:lifecycle:cleanup:start");
    } catch {
    }
    try {
      h.clearAllSubscribers(), I.cleanupCount++, I.lastCleanupAt = Date.now(), w("info", "Lifecycle cleanup complete");
      try {
        g("context:lifecycle:cleanup:complete", { cleanupCount: I.cleanupCount });
      } catch {
      }
      return !0;
    } catch (e) {
      return w("error", "Cleanup failed:", e.message), !1;
    }
  },
  isInitialized() {
    return P;
  },
  isHydrated() {
    return H;
  },
  healthCheck() {
    const e = oe.snapshot(), t = a.listUIContexts ? a.listUIContexts().length : 0, r = { initialized: P, registryAvailable: typeof a.has == "function", providerAvailable: typeof h.set == "function", storeAvailable: typeof C.get == "function", hasContexts: a.count() > 0, hasCoreContexts: a.listByType("core").length > 0, hasUIContexts: t > 0, loggerAvailable: !!ve("logger"), portsInitialized: e._initialized }, o = Object.keys(r);
    let i = 0;
    for (let x = 0; x < o.length; x++)
      r[o[x]] && i++;
    const l = o.length;
    let n = "HEALTHY";
    i < l * 0.5 ? n = "UNHEALTHY" : i < l && (n = "DEGRADED");
    const c = [];
    return r.initialized || c.push("Not initialized"), r.registryAvailable || c.push("Registry not available"), r.providerAvailable || c.push("Provider not available"), r.storeAvailable || c.push("Store not available"), r.hasContexts || c.push("No contexts registered"), r.hasCoreContexts || c.push("No core contexts registered"), r.hasUIContexts || c.push("No UI contexts registered"), { status: n, score: `${i}/${l}`, healthy: i >= 6, checks: r, issues: c.length > 0 ? c : null, version: le, moduleId: re, portsInitialized: e._initialized, timestamp: Date.now() };
  },
  getStatus() {
    const e = oe.snapshot();
    return { version: le, moduleId: re, initialized: P, hydrated: H, contextsCount: a.count(), contexts: a.list(), metrics: Object.assign({}, I), portsInitialized: e._initialized };
  },
  info() {
    const e = oe.snapshot(), t = a.listUIContexts ? a.listUIContexts().length : 0;
    return { version: le, moduleId: re, initialized: P, hydrated: H, contextsCount: a.count(), coreContextsCount: a.listByType("core").length, uiContextsCount: t, customContextsCount: a.listByType("custom").length, metrics: Object.assign({}, I), portsInitialized: e._initialized, healthCheck: this.healthCheck(), defaultContextsCount: K.length, defaultContextNames: K.map((r) => r.name), timestamp: Date.now() };
  },
  resetMetrics() {
    I = { initCount: 0, hydrateCount: 0, resetCount: 0, resetPartialCount: 0, cleanupCount: 0, lastInitAt: null, lastHydrateAt: null, lastResetAt: null, lastCleanupAt: null };
  },
  getVersion() {
    return le;
  }
}, s = {
  // Cleanup arrays
  orchestratorCleanups: [],
  globalStateCleanups: [],
  // Config
  strictMode: !1,
  mapGlobalStateContext: null,
  // State
  lastValidGlobalState: null,
  lastGlobalStateOwner: null,
  lastOrchestratorOwner: null,
  // Retry counters
  globalStateRetryCount: 0,
  orchestratorRetryCount: 0,
  // Timeout IDs para cancelamento (P1-TIMEOUT)
  globalStateRetryTimeoutId: null,
  orchestratorRetryTimeoutId: null
}, E = {
  initCount: 0,
  resetCount: 0,
  cleanupCount: 0,
  globalStateSyncs: 0,
  globalStateErrors: 0,
  globalStateFallbacks: 0,
  orchestratorEvents: 0,
  orchestratorErrors: 0,
  payloadTooLarge: 0,
  retryCancellations: 0,
  // P1-TIMEOUT: conta cancelamentos de retry
  lastInitAt: null,
  lastResetAt: null
};
function ct() {
  s.globalStateRetryTimeoutId !== null && (clearTimeout(s.globalStateRetryTimeoutId), E.retryCancellations++), s.orchestratorRetryTimeoutId !== null && (clearTimeout(s.orchestratorRetryTimeoutId), E.retryCancellations++), s.orchestratorCleanups = [], s.globalStateCleanups = [], s.strictMode = !1, s.mapGlobalStateContext = null, s.lastValidGlobalState = null, s.globalStateRetryCount = 0, s.orchestratorRetryCount = 0, s.lastGlobalStateOwner = null, s.lastOrchestratorOwner = null, s.globalStateRetryTimeoutId = null, s.orchestratorRetryTimeoutId = null;
}
function ut() {
  return s.globalStateRetryTimeoutId !== null ? (clearTimeout(s.globalStateRetryTimeoutId), s.globalStateRetryTimeoutId = null, E.retryCancellations++, !0) : !1;
}
function ft() {
  return s.orchestratorRetryTimeoutId !== null ? (clearTimeout(s.orchestratorRetryTimeoutId), s.orchestratorRetryTimeoutId = null, E.retryCancellations++, !0) : !1;
}
const Ge = "context-provider:mapper", dt = U({ moduleId: Ge });
function gt(e) {
  return dt.get(e);
}
function ht(e) {
  try {
    if (!e || typeof e != "object") return e;
    const t = {};
    return t[d.GLOBAL_STATE] = { session: e.session, navigation: e.navigation, preferences: e.preferences, ui: e.ui }, e.session && (t[d.SESSION] = { authenticated: e.session.isAuthenticated || e.session.authenticated || !1, user: e.session.user || null, token: e.session.token || null }), (e.ui && e.ui.layout || e.layout) && (t[d.LAYOUT] = { mode: e.ui && e.ui.layout && e.ui.layout.mode || e.layout && e.layout.mode || "default", breakpoint: e.ui && e.ui.layout && e.ui.layout.breakpoint || e.layout && e.layout.breakpoint || "desktop", compact: e.ui && e.ui.layout && e.ui.layout.compact || e.layout && e.layout.compact || !1 }), e.preferences && (e.preferences.language || e.preferences.locale) && (t[d.LOCALE] = { language: e.preferences.language || e.preferences.locale || "pt-BR", fallback: "en-US" }), (e.session && e.session.user && e.session.user.roles || e.permissions) && (t[d.PERMISSIONS] = { roles: e.session && e.session.user && e.session.user.roles || e.permissions && e.permissions.roles || [], capabilities: e.session && e.session.user && e.session.user.capabilities || e.permissions && e.permissions.capabilities || [] }), t;
  } catch (t) {
    const r = gt("logger");
    return r && r.warn && r.warn(`[${Ge}]`, "defaultGlobalStateMapper error:", t.message), s.lastValidGlobalState;
  }
}
function pt() {
  return s.mapGlobalStateContext || ht;
}
const bt = Ne({ moduleId: `${T}:globalstate` });
function Ie(e) {
  return bt.get(e);
}
const yt = () => {
  const e = Ie("config");
  return !!(e && e.app && e.app.debug);
}, $ = function(e) {
  const t = Ie("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${T}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  yt() && t.debug && t.debug(...[o].concat(r));
};
function ce(e) {
  if (!(!e || typeof e != "object")) {
    for (const t in e)
      if (e.hasOwnProperty(t))
        try {
          h.set(t, e[t], !1, {
            owner: "GlobalState",
            silent: !0
          });
        } catch (r) {
          $("warn", `Failed to set context ${t}:`, r.message);
        }
  }
}
function Ae() {
  if (s.globalStateCleanups.length > 0)
    return !0;
  const e = Ie("globalState");
  if (!e) {
    if (s.globalStateRetryCount < ze) {
      s.globalStateRetryCount++;
      const t = Me * s.globalStateRetryCount;
      $("info", "GlobalState not available, retrying", {
        attempt: s.globalStateRetryCount,
        delay: t
      }), s.globalStateRetryTimeoutId = setTimeout(Ae, t);
    } else
      $("warn", "GlobalState not available after max retries");
    return !1;
  }
  s.globalStateRetryTimeoutId !== null && (clearTimeout(s.globalStateRetryTimeoutId), s.globalStateRetryTimeoutId = null);
  try {
    const t = pt();
    s.lastGlobalStateOwner = "GlobalState";
    const r = e.subscribe((o) => {
      try {
        const i = t(o), l = JSON.stringify(i);
        if (l && l.length > $e) {
          if ($("warn", "GlobalState payload too large"), E.payloadTooLarge++, s.lastValidGlobalState) {
            ce(s.lastValidGlobalState);
            try {
              g("context:global-state:fallback-applied", { reason: "payload-too-large" });
            } catch {
            }
          }
          return;
        }
        s.lastValidGlobalState = i, ce(i), E.globalStateSyncs++;
      } catch (i) {
        if (E.globalStateErrors++, $("error", "GlobalState sync error:", i.message), s.lastValidGlobalState) {
          E.globalStateFallbacks++, ce(s.lastValidGlobalState);
          try {
            g("context:global-state:fallback-applied", { reason: "sync-error" });
          } catch {
          }
        }
      }
    });
    s.globalStateCleanups.push(r);
    try {
      const o = e.getState ? e.getState() : e.get ? e.get() : null;
      if (o) {
        const i = t(o);
        s.lastValidGlobalState = i, ce(i);
      }
    } catch (o) {
      $("warn", "Failed to get initial GlobalState:", o.message);
    }
    $("info", "GlobalState integration setup complete");
    try {
      g("context:integration:globalstate:connected");
    } catch {
    }
    return !0;
  } catch (t) {
    return $("error", "Failed to setup GlobalState integration:", t.message), !1;
  }
}
function me() {
  ut();
  for (let e = 0; e < s.globalStateCleanups.length; e++)
    try {
      typeof s.globalStateCleanups[e] == "function" && s.globalStateCleanups[e]();
    } catch {
    }
  s.globalStateCleanups = [], $("info", "GlobalState integration cleaned up");
}
function ke() {
  return me(), s.globalStateRetryCount = 0, Ae();
}
const Ct = U({ moduleId: `${T}:orchestrator` });
function N(e) {
  return Ct.get(e);
}
const mt = () => {
  const e = N("config");
  return !!(e && e.app && e.app.debug);
}, D = function(e) {
  const t = N("logger");
  if (!t) return;
  const r = Array.prototype.slice.call(arguments, 1), o = `[${T}]`;
  if (e === "error") {
    t.error && t.error(...[o].concat(r));
    return;
  }
  if (e === "warn") {
    t.warn && t.warn(...[o].concat(r));
    return;
  }
  mt() && t.debug && t.debug(...[o].concat(r));
};
let W = null, Z = null, Q = null;
function we() {
  if (s.orchestratorCleanups.length > 0)
    return !0;
  const e = N("eventBus");
  if (!e) {
    if (s.orchestratorRetryCount < ze) {
      s.orchestratorRetryCount++;
      const t = Me * s.orchestratorRetryCount;
      D("info", "EventBus not available, retrying", {
        attempt: s.orchestratorRetryCount,
        delay: t
      }), s.orchestratorRetryTimeoutId = setTimeout(we, t);
    } else
      D("warn", "EventBus not available after max retries");
    return !1;
  }
  s.orchestratorRetryTimeoutId !== null && (clearTimeout(s.orchestratorRetryTimeoutId), s.orchestratorRetryTimeoutId = null);
  try {
    s.lastOrchestratorOwner = "Orchestrator", W = (t) => {
      if (!(!t || !t.context))
        try {
          h.set(t.context, t.value, !1, {
            owner: t.owner || "Orchestrator",
            silent: t.silent
          }), E.orchestratorEvents++;
        } catch (r) {
          E.orchestratorErrors++, D("warn", "Orchestrator context update failed:", r.message);
        }
    }, Z = (t) => {
      if (!(!t || !t.context))
        try {
          const r = h.get(t.context);
          t.callback && typeof t.callback == "function" && t.callback(r);
          const o = N("eventBus");
          t.responseEvent && o && o.emit && o.emit(t.responseEvent, { context: t.context, value: r });
        } catch (r) {
          D("warn", "Orchestrator context request failed:", r.message);
        }
    }, Q = (t) => {
      try {
        t && t.context && h.reset(t.context, {
          owner: t.owner || "Orchestrator"
        });
      } catch (r) {
        D("warn", "Orchestrator context reset failed:", r.message);
      }
    }, e.on(B.UPDATE, W), e.on(B.REQUEST, Z), e.on(B.RESET, Q), s.orchestratorCleanups.push(() => {
      const t = N("eventBus");
      t && t.off && W && t.off(B.UPDATE, W);
    }), s.orchestratorCleanups.push(() => {
      const t = N("eventBus");
      t && t.off && Z && t.off(B.REQUEST, Z);
    }), s.orchestratorCleanups.push(() => {
      const t = N("eventBus");
      t && t.off && Q && t.off(B.RESET, Q);
    }), D("info", "Orchestrator integration setup complete");
    try {
      g("context.integration.orchestrator.connected");
    } catch {
    }
    return !0;
  } catch (t) {
    return D("error", "Failed to setup Orchestrator integration:", t.message), !1;
  }
}
function Se() {
  ft();
  for (let e = 0; e < s.orchestratorCleanups.length; e++)
    try {
      typeof s.orchestratorCleanups[e] == "function" && s.orchestratorCleanups[e]();
    } catch {
    }
  s.orchestratorCleanups = [], W = null, Z = null, Q = null, D("info", "Orchestrator integration cleaned up");
}
function Ve() {
  return Se(), s.orchestratorRetryCount = 0, we();
}
const j = "5.8.0-P2-ENTERPRISE", Rt = () => j, Y = U({ moduleId: T }), St = () => Y.init(), Oe = (e) => Y.get(e), Et = (e) => Y.inject(e), xt = () => Y.snapshot(), vt = () => {
  var e, t;
  return ((t = (e = Oe("config")) == null ? void 0 : e.app) == null ? void 0 : t.debug) || !1;
}, ue = (e, ...t) => {
  var r, o, i;
  const l = Oe("logger");
  if (!l) return;
  const n = `[${T}]`;
  if (e === "error") {
    (r = l.error) == null || r.call(l, n, ...t);
    return;
  }
  if (e === "warn") {
    (o = l.warn) == null || o.call(l, n, ...t);
    return;
  }
  vt() && ((i = l.debug) == null || i.call(l, n, ...t));
}, G = {
  getVersion: () => j,
  getModuleId: () => T,
  init: (e = {}) => {
    try {
      return St(), R.init(e).then((t) => t ? (e.strictMode !== void 0 && (s.strictMode = e.strictMode), e.mapGlobalStateContext && (s.mapGlobalStateContext = e.mapGlobalStateContext), Ae(), we(), ue("info", `ContextProvider v${j} initialized (AAA)`), !0) : (ue("warn", "Lifecycle init returned false"), !1));
    } catch (t) {
      return ue("error", "Init failed:", t.message), Promise.resolve(!1);
    }
  },
  hydrate: (e) => R.hydrate(e),
  set: (e, t, r = {}) => h.set(e, t, s.strictMode, r),
  get: (e) => h.get(e),
  getAll: () => h.getAll(),
  subscribe: (e, t, r = {}) => h.subscribe(e, t, r),
  unsubscribe: (e, t) => h.unsubscribe(e, t),
  has: (e) => a.has(e),
  register: (e, t, r) => a.register(e, t, r),
  unregister: (e) => a.unregister(e),
  isCoreContext: (e) => a.isCoreContext(e),
  isUIContext: (e) => {
    var t;
    return ((t = a.isUIContext) == null ? void 0 : t.call(a, e)) || !1;
  },
  reset: (e = {}) => (me(), Se(), ct(), R.reset(e)),
  cleanup: () => (me(), Se(), R.cleanup()),
  destroy: () => {
    G.cleanup(), G.reset(), ue("info", "ContextProvider destroyed");
  },
  isInitialized: () => R.isInitialized(),
  isHydrated: () => R.isHydrated(),
  status: () => R.getStatus(),
  healthCheck: () => {
    var e, t;
    const r = Y.snapshot(), o = R.healthCheck(), i = h.healthCheck(), l = a.healthCheck(), n = {
      lifecycle: o.status === "HEALTHY",
      provider: i.status === "HEALTHY",
      registry: l.status === "HEALTHY",
      globalStateConnected: s.globalStateCleanups.length > 0,
      orchestratorConnected: s.orchestratorCleanups.length > 0,
      lowGlobalStateErrors: E.globalStateErrors < 5,
      lowOrchestratorErrors: E.orchestratorErrors < 5,
      hasUIContexts: (((t = (e = a.listUIContexts) == null ? void 0 : e.call(a)) == null ? void 0 : t.length) || 0) > 0,
      loggerAvailable: !!Oe("logger"),
      portsInitialized: r._initialized
    }, c = Object.values(n).filter(Boolean).length, x = Object.keys(n).length;
    let _ = "HEALTHY";
    const v = [];
    return c < x * 0.5 ? _ = "UNHEALTHY" : c < x && (_ = "DEGRADED"), n.lifecycle || v.push("Lifecycle unhealthy"), n.provider || v.push("Provider unhealthy"), n.registry || v.push("Registry unhealthy"), n.globalStateConnected || v.push("GlobalState not connected"), n.orchestratorConnected || v.push("Orchestrator not connected"), n.lowGlobalStateErrors || v.push(`${E.globalStateErrors} GlobalState errors`), n.lowOrchestratorErrors || v.push(`${E.orchestratorErrors} Orchestrator errors`), n.hasUIContexts || v.push("No UI contexts registered"), { status: _, score: `${c}/${x}`, healthy: c >= 6, checks: n, issues: v.length > 0 ? v : null, version: j, moduleId: T, strictMode: s.strictMode, globalStateRetryCount: s.globalStateRetryCount, orchestratorRetryCount: s.orchestratorRetryCount, portsInitialized: r._initialized, timestamp: Date.now() };
  },
  info: () => {
    var e, t, r, o, i;
    const l = Y.snapshot(), n = a.getStats(), c = ((e = C.info) == null ? void 0 : e.call(C)) || { size: 0, keys: [] }, x = h.getSubscriberStats(), _ = (X == null ? void 0 : X()) || { eventsCount: 0, metrics: {} }, v = () => ({ version: "1.0.0" });
    return {
      name: T,
      version: j,
      status: R.getStatus(),
      strictMode: s.strictMode,
      mapping: { usesCustomMapper: s.mapGlobalStateContext !== null, maxPayloadSize: $e, payloadTooLargeCount: E.payloadTooLarge, globalStateErrorCount: E.globalStateErrors, fallbacksApplied: E.globalStateFallbacks, contextsFromGlobalState: [d.GLOBAL_STATE, d.SESSION, d.LAYOUT, d.LOCALE, d.PERMISSIONS] },
      owners: { authorizedCore: te, lastGlobalStateOwner: s.lastGlobalStateOwner, lastOrchestratorOwner: s.lastOrchestratorOwner },
      metrics: { ...E },
      retryStats: { globalStateRetryCount: s.globalStateRetryCount, orchestratorRetryCount: s.orchestratorRetryCount },
      registry: { total: n.total, core: n.core, custom: n.custom, ui: n.ui || 0 },
      store: { size: c.size, keys: c.keys },
      subscribers: { total: x.total, byContext: x.byContext },
      telemetry: { eventsCount: _.eventsCount, metrics: _.metrics },
      integrations: { orchestratorConnected: s.orchestratorCleanups.length > 0, globalStateConnected: s.globalStateCleanups.length > 0 },
      healthCheck: G.healthCheck(),
      portsInitialized: l._initialized,
      submodules: { lifecycle: ((t = R.info) == null ? void 0 : t.call(R)) || null, provider: ((r = h.info) == null ? void 0 : r.call(h)) || null, registry: ((o = a.info) == null ? void 0 : o.call(a)) || null, store: ((i = C.info) == null ? void 0 : i.call(C)) || null, telemetry: (X == null ? void 0 : X()) || null, helpers: v() },
      timestamp: Date.now()
    };
  },
  debug: { getEventLog: Je, getRecentEvents: et, getStore: () => C.toObject(), getRegistry: () => a.listAll(), getRegistryStats: () => a.getStats(), getSubscriberStats: () => h.getSubscriberStats(), getTelemetryInfo: () => X(), getCoreContexts: () => d, getUIContexts: () => {
    var e;
    return ((e = a.listUIContexts) == null ? void 0 : e.call(a)) || [];
  }, getAuthorizedOwners: () => te, retryGlobalState: ke, retryOrchestrator: Ve, inspectAll: () => h.inspectAll() },
  setDebug: (e) => R.setDebug(e),
  injectPorts: Et,
  getPorts: xt
};
typeof window < "u" && (Be() ? He("MODULE_STRICT_BLOCK", { module: T }) : window.ContextProvider = G, window.__dev = window.__dev || {}, window.__dev.contextProvider = { getVersion: () => j, info: () => G.info(), healthCheck: () => G.healthCheck(), status: () => G.status(), debug: G.debug, retryGlobalState: ke, retryOrchestrator: Ve });
export {
  te as AUTHORIZED_OWNERS,
  d as CORE_CONTEXTS,
  R as ContextLifecycle,
  G as ContextProvider,
  h as ContextProviderCore,
  a as ContextRegistry,
  T as MODULE_ID,
  j as VERSION,
  C as contextStore,
  G as default,
  xt as getPorts,
  Rt as getVersion,
  Et as injectPorts
};
