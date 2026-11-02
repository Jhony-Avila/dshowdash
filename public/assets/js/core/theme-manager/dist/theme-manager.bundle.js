import { createCorePorts as E } from "/core/runtime/ports-profiles.js";
import { isStrict as d, recordViolation as c } from "/core/runtime/enterprise/strict-mode.js";
var Te = "4.3.0-STRICT-MODE", p = "theme-helpers", Ce = E({ moduleId: p });
function P(e) {
  return Ce.get(e);
}
var J = function(e, ...r) {
  var t = P("logger");
  if (t) {
    var n = Array.prototype.slice.call(arguments, 1), a = "[" + p + "]";
    {
      t.warn && t.warn.apply(t, [a].concat(n));
      return;
    }
  }
};
function ae() {
  var e = P("window");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("window");
    if (r) return r;
  }
  return d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: p, target: "window" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: p, target: "window", fallback: !0 }), typeof window < "u" ? window : null);
}
function ie() {
  var e = P("localStorage");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("localStorage");
    if (r) return r;
  }
  var t = ae();
  return t ? d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: p, target: "localStorage" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: p, target: "localStorage", fallback: !0 }), t.localStorage || null) : null;
}
function Ee() {
  var e = P("matchMedia");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("matchMedia");
    if (r) return r;
  }
  var t = ae();
  return !t || typeof t.matchMedia != "function" ? null : d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: p, target: "matchMedia" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: p, target: "matchMedia", fallback: !0 }), function(n) {
    return t.matchMedia(n);
  });
}
function oe() {
  return Te;
}
var z = "dshowdash-theme";
function se(e) {
  return !e || typeof e != "string" ? null : e.toLowerCase().trim();
}
function Ze(e, r) {
  if (r || (r = []), !e || typeof e != "string") return !1;
  var t = se(e);
  return r.indexOf(t) > -1;
}
function Fe(e, r) {
  return r || (r = "dark"), !e || typeof e != "string" ? r : e.trim() || r;
}
function Se(e) {
  try {
    var r = ie();
    return r ? r.getItem(e) : null;
  } catch (t) {
    return J("warn", "localStorage get failed:", t.message), null;
  }
}
function Z(e, r) {
  try {
    var t = ie();
    return t ? (t.setItem(e, r), !0) : !1;
  } catch (n) {
    return J("warn", "localStorage set failed:", n.message), !1;
  }
}
function Ae(e) {
  try {
    var r = ie();
    return r ? (r.removeItem(e), !0) : !1;
  } catch (t) {
    return J("warn", "localStorage remove failed:", t.message), !1;
  }
}
function B() {
  try {
    var e = Ee();
    if (!e) return "unknown";
    var r = e("(prefers-color-scheme: dark)"), t = e("(prefers-color-scheme: light)");
    return r && r.matches ? "dark" : t && t.matches ? "light" : "unknown";
  } catch (n) {
    return J("warn", "System theme detection failed:", n.message), "unknown";
  }
}
function S() {
  var e = ae();
  return !!e && typeof document < "u";
}
function pe() {
  var e = Ee();
  return !!e;
}
function Qe(e, r) {
  return { themeId: e, source: r, timestamp: Date.now(), systemPreference: B(), hasDOMSupport: S() };
}
function er(e, r) {
  return e ? r ? Object.assign({}, e, r) : e : r || {};
}
function rr(e, r) {
  r || (r = 100);
  var t = null;
  return function() {
    var n = this, a = arguments;
    t && clearTimeout(t), t = setTimeout(function() {
      e.apply(n, Array.prototype.slice.call(a)), t = null;
    }, r);
  };
}
var Cr = { STORAGE_KEY: z, normalizeThemeId: se, isValidThemeId: Ze, safeParseTheme: Fe, safeLocalStorageGet: Se, safeLocalStorageSet: Z, safeLocalStorageRemove: Ae, getSystemThemePreference: B, hasDOMSupport: S, hasMatchMediaSupport: pe, buildThemeContext: Qe, mergeTokens: er, debounce: rr, getVersion: oe, healthCheck: function() {
  return { healthy: !0, version: Te, moduleId: p, hasDOMSupport: S(), hasMatchMediaSupport: pe(), systemPreference: B(), issues: null, loggerAvailable: !!P("logger"), portsInitialized: Ce.isInitialized(), strictMode: d() };
} }, _e = "4.3.0-STRICT-MODE", R = "theme-applier", be = E({ moduleId: R });
function ue(e) {
  return be.get(e);
}
var V = function(e, ...r) {
  var t = ue("logger");
  if (t) {
    var n = Array.prototype.slice.call(arguments, 1), a = "[" + R + "]";
    if (e === "error") {
      t.error && t.error.apply(t, [a].concat(n));
      return;
    }
    if (e === "warn") {
      t.warn && t.warn.apply(t, [a].concat(n));
      return;
    }
  }
};
function N() {
  var e = ue("document");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("document");
    if (r) return r;
  }
  return d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: R, target: "document" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: R, target: "document", fallback: !0 }), typeof document < "u" ? document : null);
}
function le() {
  return _e;
}
var $ = "data-theme", we = "theme-transitioning";
function H(e, r) {
  r || (r = {});
  var t = r.applyTokens !== !1, n = r.useTransition !== !1, a = r.transitionDuration || 200;
  if (!S())
    return V("warn", "No DOM support, skipping apply"), { applied: !1, reason: "no-dom" };
  if (!e || !e.id)
    return V("warn", "Invalid theme object"), { applied: !1, reason: "invalid-theme" };
  try {
    var o = N();
    if (!o)
      return V("warn", "Document not available"), { applied: !1, reason: "no-document" };
    var i = o.documentElement, w = i.getAttribute($);
    return w === e.cssVariant ? { applied: !1, reason: "already-applied", themeId: e.id } : (n && i.classList.add(we), i.setAttribute($, e.cssVariant), t && e.tokens && tr(e.tokens, o), n && setTimeout(function() {
      i.classList.remove(we);
    }, a), nr(e, o), { applied: !0, themeId: e.id, previousTheme: w });
  } catch (v) {
    return V("error", "Apply error:", v), { applied: !1, reason: "error", error: v.message };
  }
}
function tr(e, r) {
  if (!(!e || typeof e != "object")) {
    var t = r || N();
    if (t) {
      var n = t.documentElement;
      for (var a in e)
        e.hasOwnProperty(a) && a.indexOf("--") === 0 && n.style.setProperty(a, e[a]);
    }
  }
}
function nr(e, r) {
  try {
    var t = r || N();
    if (!t) return;
    var n = t.querySelector('meta[name="theme-color"]');
    n || (n = t.createElement("meta"), n.name = "theme-color", t.head.appendChild(n));
    var a = e.tokens, o = a && a["--bg-primary"] || a && a["--dark"] || "#0a0e27";
    n.content = o;
  } catch {
  }
}
function F() {
  if (!S()) return null;
  try {
    var e = N();
    return e ? e.documentElement.getAttribute($) : null;
  } catch {
    return null;
  }
}
function ar() {
  if (!S()) return !1;
  try {
    var e = N();
    return e ? (e.documentElement.removeAttribute($), !0) : !1;
  } catch {
    return !1;
  }
}
var Er = { applyTheme: H, getCurrentAppliedTheme: F, removeTheme: ar, THEME_ATTRIBUTE: $, getVersion: le, healthCheck: function() {
  return { healthy: !0, version: _e, moduleId: R, currentApplied: F(), hasDOMSupport: S(), issues: null, loggerAvailable: !!ue("logger"), portsInitialized: be.isInitialized(), strictMode: d() };
} }, ir = {
  id: "dark",
  label: "Tema Escuro",
  cssVariant: "dark",
  tokens: {
    "--primary": "#667eea",
    "--primary-dark": "#5a67d8",
    "--primary-light": "#7c8aef",
    "--secondary": "#764ba2",
    "--success": "#10b981",
    "--warning": "#f59e0b",
    "--danger": "#ef4444",
    "--info": "#3b82f6",
    "--dark": "#0a0e27",
    "--dark-secondary": "#151924",
    "--light": "#f5f5f5",
    "--white": "#ffffff",
    "--muted": "#9aa3b2",
    "--bg-primary": "#0a0e27",
    "--bg-secondary": "#151924",
    "--bg-tertiary": "#1a1f35",
    "--bg-card": "#12162a",
    "--bg-input": "#0d1025",
    "--text-primary": "#ffffff",
    "--text-secondary": "#e2e8f0",
    "--text-tertiary": "#9aa3b2",
    "--text-muted": "#64748b",
    "--border-primary": "rgba(255, 255, 255, 0.1)",
    "--border-secondary": "rgba(255, 255, 255, 0.05)",
    "--glass-bg": "rgba(0, 0, 0, 0.02)",
    "--glass-border": "rgba(255, 255, 255, 0.1)",
    "--glass-hover": "rgba(255, 255, 255, 0.08)",
    "--shadow-sm": "0 2px 8px rgba(0, 0, 0, 0.15)",
    "--shadow-md": "0 4px 16px rgba(0, 0, 0, 0.25)",
    "--shadow-lg": "0 8px 32px rgba(0, 0, 0, 0.4)",
    "--shadow-xl": "0 12px 48px rgba(0, 0, 0, 0.5)",
    "--particles-color": "255, 255, 255",
    "--particles-opacity": "0.10"
  },
  meta: { contrast: "normal", preferredFor: "night", isDefault: !0 }
}, or = {
  id: "light",
  label: "Tema Claro",
  cssVariant: "light",
  tokens: {
    "--primary": "#5a67d8",
    "--primary-dark": "#4c51bf",
    "--primary-light": "#667eea",
    "--secondary": "#6b46c1",
    "--success": "#059669",
    "--warning": "#d97706",
    "--danger": "#dc2626",
    "--info": "#2563eb",
    "--dark": "#1e293b",
    "--dark-secondary": "#334155",
    "--light": "#f8fafc",
    "--white": "#ffffff",
    "--muted": "#64748b",
    "--bg-primary": "#f8fafc",
    "--bg-secondary": "#f1f5f9",
    "--bg-tertiary": "#e2e8f0",
    "--bg-card": "#ffffff",
    "--bg-input": "#ffffff",
    "--text-primary": "#0f172a",
    "--text-secondary": "#1e293b",
    "--text-tertiary": "#475569",
    "--text-muted": "#94a3b8",
    "--border-primary": "rgba(0, 0, 0, 0.1)",
    "--border-secondary": "rgba(0, 0, 0, 0.05)",
    "--glass-bg": "rgba(255, 255, 255, 0.7)",
    "--glass-border": "rgba(0, 0, 0, 0.1)",
    "--glass-hover": "rgba(0, 0, 0, 0.05)",
    "--shadow-sm": "0 1px 3px rgba(0, 0, 0, 0.08)",
    "--shadow-md": "0 4px 12px rgba(0, 0, 0, 0.1)",
    "--shadow-lg": "0 8px 24px rgba(0, 0, 0, 0.12)",
    "--shadow-xl": "0 12px 40px rgba(0, 0, 0, 0.15)",
    "--particles-color": "0, 0, 0",
    "--particles-opacity": "0.08"
  },
  meta: { contrast: "normal", preferredFor: "day", isDefault: !1 }
};
const De = "4.0.0-ENTERPRISE", sr = "theme-catalog";
function ce() {
  return De;
}
const M = {
  dark: ir,
  light: or
}, Q = Object.keys(M), k = "dark";
function U(e) {
  return M[e] || null;
}
function ur() {
  return Object.values(M);
}
function Oe(e) {
  return e in M;
}
function lr() {
  return M[k];
}
const j = {
  THEMES_MAP: M,
  AVAILABLE_THEME_IDS: Q,
  DEFAULT_THEME_ID: k,
  getThemeById: U,
  getAllThemes: ur,
  isValidThemeId: Oe,
  getDefaultTheme: lr,
  getVersion: ce,
  healthCheck() {
    return {
      healthy: !0,
      version: De,
      moduleId: sr,
      availableThemes: Q,
      defaultTheme: k,
      issues: null
    };
  }
};
var ke = "4.3.0-STRICT-MODE", A = "theme-detector", Me = E({ moduleId: A });
function Y(e) {
  return Me.get(e);
}
function cr() {
  var e = Y("window");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("window");
    if (r) return r;
  }
  return d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: A, target: "window" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: A, target: "window", fallback: !0 }), typeof window < "u" ? window : null);
}
function dr() {
  var e = Y("matchMedia");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("matchMedia");
    if (r) return r;
  }
  var t = cr();
  return !t || typeof t.matchMedia != "function" ? null : d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: A, target: "matchMedia" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: A, target: "matchMedia", fallback: !0 }), function(n) {
    return t.matchMedia(n);
  });
}
var Le = function(e, ...r) {
  var t = Array.prototype.slice.call(arguments, 1), n = Y("logger");
  if (n) {
    n.warn && n.warn.apply(n, ["[" + A + "]"].concat(t));
    return;
  }
};
function de() {
  return ke;
}
function ee(e) {
  e || (e = {});
  var r = e.defaultThemeId || k, t = e.availableThemeIds || Q, n = e.storageKey || z, a = e.respectSystemPreference !== void 0 ? e.respectSystemPreference : !0, o = r, i = "default";
  try {
    var w = Se(n);
    if (w) {
      var v = se(w);
      if (v && t.indexOf(v) !== -1)
        return o = v, i = "user", { themeId: o, source: i, detected: !0 };
    }
    if (a) {
      var y = B();
      if (y !== "unknown" && t.indexOf(y) !== -1)
        return o = y, i = "system", { themeId: o, source: i, detected: !0 };
    }
    return { themeId: o, source: i, detected: !1 };
  } catch (me) {
    return Le("warn", "Detection error, using default:", me.message), { themeId: r, source: "default", detected: !1, error: me.message };
  }
}
function ze(e, r) {
  try {
    var t = dr();
    if (!t) return null;
    var n = t("(prefers-color-scheme: dark)");
    if (!n) return null;
    var a = function(o) {
      var i = o.matches ? "dark" : "light";
      i !== e && typeof r == "function" && r(i, "system");
    };
    return n.addEventListener ? (n.addEventListener("change", a), function() {
      n.removeEventListener("change", a);
    }) : n.addListener ? (n.addListener(a), function() {
      n.removeListener(a);
    }) : null;
  } catch (o) {
    return Le("warn", "System theme listener setup failed:", o.message), null;
  }
}
var Sr = {
  detectInitialTheme: ee,
  detectSystemThemeChange: ze,
  getVersion: de,
  healthCheck: function() {
    var e = ee(), r = Y("logger");
    return { healthy: !0, version: ke, moduleId: A, detection: e, loggerAvailable: !!r, portsInitialized: Me.isInitialized(), strictMode: d(), issues: null };
  }
}, Re = "4.3.0-STRICT-MODE", fe = "theme-store", $e = E({ moduleId: fe });
function xe(e) {
  return $e.get(e);
}
var re = function(e) {
  var r = xe("logger");
  if (r) {
    var t = Array.prototype.slice.call(arguments, 1), n = "[" + fe + "]";
    if (e === "error") {
      r.error && r.error.apply(r, [n].concat(t));
      return;
    }
    if (e === "warn") {
      r.warn && r.warn.apply(r, [n].concat(t));
      return;
    }
  }
};
function Pe() {
  return Re;
}
var g = { currentTheme: "dark", source: "default", lastChangedAt: null, isApplying: !1, error: null }, L = /* @__PURE__ */ new Set();
function G() {
  return Object.assign({}, g);
}
function ve() {
  var e = G();
  L.forEach(function(r) {
    try {
      r(e);
    } catch (t) {
      re("error", "Listener error:", t);
    }
  });
}
var l = {
  getState: function() {
    return G();
  },
  get: function(e) {
    if (e in g) return g[e];
  },
  set: function(e) {
    if (!e || typeof e != "object") return !1;
    try {
      var r = !1, t = g.currentTheme, n = g.source, a = e;
      for (var o in a)
        o in g && g[o] !== a[o] && (g[o] = a[o], r = !0);
      return (g.currentTheme !== t || g.source !== n) && (g.lastChangedAt = Date.now()), r && ve(), r;
    } catch (i) {
      return re("error", "Set error:", i), !1;
    }
  },
  // @ts-expect-error TS migration - TS2554
  subscribe: function(e) {
    return typeof e != "function" ? (re("warn", "Subscribe: listener must be function"), function() {
    }) : (L.add(e), function() {
      L.delete(e);
    });
  },
  getListenerCount: function() {
    return L.size;
  },
  reset: function(e) {
    return e || (e = "dark"), g.currentTheme = e, g.source = "default", g.lastChangedAt = null, g.isApplying = !1, g.error = null, ve(), !0;
  },
  toJSON: function() {
    return G();
  },
  healthCheck: function() {
    return { healthy: !0, version: Re, moduleId: fe, state: G(), listenerCount: L.size, issues: null, loggerAvailable: !!xe("logger"), portsInitialized: $e.isInitialized(), strictMode: d() };
  }
}, Ne = "4.3.0-STRICT-MODE", ge = "theme-engine", We = E({ moduleId: ge });
function Ve(e) {
  return We.get(e);
}
var q = function(e, ...r) {
  var t = Ve("logger");
  if (t) {
    var n = Array.prototype.slice.call(arguments, 1), a = "[" + ge + "]";
    if (e === "error") {
      t.error && t.error.apply(t, [a].concat(n));
      return;
    }
    if (e === "warn") {
      t.warn && t.warn.apply(t, [a].concat(n));
      return;
    }
  }
};
function He() {
  return Ne;
}
var s = { initialized: !1, config: null, systemThemeCleanup: null, lastError: null }, T = {
  init: function(e) {
    e || (e = {});
    var r = e.defaultThemeId || k, t = e.storageKey || z, n = e.respectSystemPreference !== !1, a = e.listenToSystemChanges !== !1, o = e.applyTokens !== !1;
    try {
      s.config = { defaultThemeId: r, storageKey: t, respectSystemPreference: n, applyTokens: o };
      var i = ee({ defaultThemeId: r, storageKey: t, respectSystemPreference: n }), w = U(i.themeId);
      if (!w) throw new Error("Theme not found: " + i.themeId);
      l.set({ currentTheme: i.themeId, source: i.source, isApplying: !0, error: null });
      var v = H(w, { applyTokens: o });
      return l.set({ isApplying: !1 }), (i.source === "user" || i.source === "default") && Z(t, i.themeId), a && n && this._setupSystemThemeListener(), s.initialized = !0, s.lastError = null, { success: !0, themeId: i.themeId, source: i.source, applied: v.applied };
    } catch (y) {
      return q("error", "Init error:", y), s.lastError = y.message, l.set({ error: y.message, isApplying: !1 }), { success: !1, error: y.message, themeId: r };
    }
  },
  changeTheme: function(e, r) {
    r || (r = "user");
    try {
      if (!Oe(e))
        return q("warn", "Invalid theme:", e), { success: !1, error: "invalid-theme" };
      var t = l.getState();
      if (t.currentTheme === e) return { success: !0, changed: !1, reason: "already-current" };
      var n = U(e);
      if (!n) return { success: !1, error: "theme-not-found" };
      l.set({ currentTheme: e, source: r, isApplying: !0, error: null });
      var a = H(n, { applyTokens: s.config ? s.config.applyTokens !== !1 : !0 });
      if (l.set({ isApplying: !1 }), r === "user") {
        var o = s.config ? s.config.storageKey : z;
        Z(o, e);
      }
      return { success: !0, changed: !0, themeId: e, source: r, applied: a.applied };
    } catch (i) {
      return q("error", "Change theme error:", i), l.set({ error: i.message, isApplying: !1 }), { success: !1, error: i.message };
    }
  },
  toggleTheme: function() {
    var e = l.getState(), r = e.currentTheme === "dark" ? "light" : "dark";
    return this.changeTheme(r, "user");
  },
  getCurrentTheme: function() {
    return l.getState();
  },
  getAvailableThemes: function() {
    return j.getAllThemes();
  },
  _setupSystemThemeListener: function() {
    var e = this;
    s.systemThemeCleanup && s.systemThemeCleanup();
    var r = l.get("currentTheme");
    s.systemThemeCleanup = ze(r, function(t, n) {
      var a = l.get("source");
      a === "system" && e.changeTheme(t, "system");
    });
  },
  reset: function() {
    var e = s.config ? s.config.defaultThemeId : k, r = s.config ? s.config.storageKey : z;
    Ae(r), l.reset(e);
    var t = U(e);
    return t && H(t), { success: !0, themeId: e };
  },
  cleanup: function() {
    s.systemThemeCleanup && (s.systemThemeCleanup(), s.systemThemeCleanup = null), s.initialized = !1;
  },
  isInitialized: function() {
    return s.initialized;
  },
  healthCheck: function() {
    return { healthy: s.initialized && !s.lastError, version: Ne, moduleId: ge, initialized: s.initialized, currentTheme: l.get("currentTheme"), appliedTheme: F(), lastError: s.lastError, issues: s.lastError ? s.lastError : null, loggerAvailable: !!Ve("logger"), portsInitialized: We.isInitialized(), strictMode: d() };
  }
}, Ue = "4.3.0-STRICT-MODE", he = "theme-lifecycle", je = E({ moduleId: he });
function Ge(e) {
  return je.get(e);
}
var X = function(e, ...r) {
  var t = Array.prototype.slice.call(arguments, 1), n = Ge("logger");
  if (n) {
    n.error && n.error.apply(n, ["[" + he + "]"].concat(t));
    return;
  }
};
function Ke() {
  return Ue;
}
var u = { initialized: !1, destroyed: !1, initCount: 0, resetCount: 0, lastInitAt: null, lastResetAt: null, config: null }, I = {
  init: function(e) {
    if (e || (e = {}), u.initialized && !u.destroyed) return { success: !0, alreadyInitialized: !0, themeId: l.get("currentTheme"), initCount: u.initCount };
    try {
      u.config = e, u.destroyed = !1;
      var r = T.init(e);
      return r.success && (u.initialized = !0, u.initCount++, u.lastInitAt = Date.now()), { success: r.success, alreadyInitialized: !1, themeId: r.themeId, source: r.source, initCount: u.initCount, error: r.error };
    } catch (t) {
      return X("error", "Init error:", t), { success: !1, error: t.message };
    }
  },
  reset: function() {
    try {
      var e = T.reset();
      return u.resetCount++, u.lastResetAt = Date.now(), { success: !0, resetCount: u.resetCount, themeId: e.themeId };
    } catch (r) {
      return X("error", "Reset error:", r), { success: !1, error: r.message };
    }
  },
  cleanup: function() {
    try {
      return T.cleanup(), u.destroyed = !0, u.initialized = !1, { success: !0 };
    } catch (e) {
      return X("error", "Cleanup error:", e), { success: !1, error: e.message };
    }
  },
  destroy: function() {
    return this.cleanup();
  },
  isInitialized: function() {
    return u.initialized && !u.destroyed;
  },
  getStatus: function() {
    return { initialized: u.initialized, destroyed: u.destroyed, initCount: u.initCount, resetCount: u.resetCount, lastInitAt: u.lastInitAt, lastResetAt: u.lastResetAt, currentTheme: l.get("currentTheme"), engineInitialized: T.isInitialized() };
  },
  healthCheck: function() {
    var e = T.healthCheck(), r = l.healthCheck(), t = e.healthy && r.healthy, n = Ge("logger");
    return { healthy: t && u.initialized, version: Ue, moduleId: he, status: this.getStatus(), components: { engine: e, store: r }, loggerAvailable: !!n, portsInitialized: je.isInitialized(), strictMode: d(), issues: u.initialized ? t ? null : "Component issues" : "Not initialized" };
  }
}, Be = "4.4.0-STRICT-MODE", C = "theme-telemetry", b = "theme-manager", Je = E({ moduleId: C });
function W(e) {
  return Je.get(e);
}
function Ye() {
  return Be;
}
function qe() {
  var e = W("window");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("window");
    if (r) return r;
  }
  return d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: C, target: "window" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: C, target: "window", fallback: !0 }), typeof window < "u" ? window : null);
}
function fr() {
  var e = W("appConfig");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("APP_CONFIG");
    if (r) return r;
  }
  var t = qe();
  return !t || !t.APP_CONFIG ? null : d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: C, target: "APP_CONFIG" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: C, target: "APP_CONFIG", fallback: !0 }), t.APP_CONFIG);
}
function Xe() {
  var e = W("telemetry");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var r = window.Core.windowAdapter.get("Telemetry");
    if (r) return r;
  }
  var t = qe();
  return !t || !t.Telemetry ? null : d() ? (c("WINDOW_DIRECT_ACCESS", { moduleId: C, target: "Telemetry" }), null) : (c("WINDOW_DIRECT_ACCESS", { moduleId: C, target: "Telemetry", fallback: !0 }), t.Telemetry);
}
var gr = function() {
  var e = fr();
  return e && e.app && e.app.debug;
}, ye = function(e, ...r) {
  var t = Array.prototype.slice.call(arguments, 1), n = W("logger");
  if (n) {
    if (e === "error") {
      n.error && n.error.apply(n, ["[" + b + "]"].concat(t));
      return;
    }
    if (e === "warn") {
      n.warn && n.warn.apply(n, ["[" + b + "]"].concat(t));
      return;
    }
    gr() && n.debug && n.debug.apply(n, ["[" + b + "]"].concat(t));
  }
}, _ = { enabled: !0, maxEventLogSize: 100 }, D = [], f = { totalEvents: 0, totalErrors: 0, themeChanges: 0, lastChangeAt: null, lastThemeId: null };
function hr() {
  var e = Xe();
  return !!(e && e.track);
}
function mr(e) {
  D.length >= _.maxEventLogSize && D.shift(), D.push(e);
}
var h = {
  track: function(e, r) {
    if (r || (r = {}), !_.enabled) return !1;
    var t = { namespace: b, event: e, timestamp: Date.now() };
    for (var n in r)
      r.hasOwnProperty(n) && (t[n] = r[n]);
    try {
      mr(t), f.totalEvents++;
      var a = Xe();
      return a && a.track && a.track(b + ":" + e, t), ye("info", e, t), !0;
    } catch (o) {
      return ye("warn", "Track failed:", o.message), !1;
    }
  },
  trackThemeChange: function(e, r, t) {
    return f.themeChanges++, f.lastChangeAt = Date.now(), f.lastThemeId = e, this.track("change", { themeId: e, source: r, previousTheme: t || null, changeCount: f.themeChanges });
  },
  trackError: function(e, r) {
    return f.totalErrors++, this.track("error", Object.assign({ error: e && e.message ? e.message : String(e) }, r || {}));
  },
  trackLifecycle: function(e, r) {
    return this.track("lifecycle:" + e, r || {});
  },
  trackDetection: function(e) {
    return this.track("detect", { themeId: e.themeId, source: e.source, detected: e.detected });
  },
  trackApply: function(e) {
    return this.track("apply", { applied: e.applied, themeId: e.themeId, reason: e.reason });
  },
  getEventLog: function(e) {
    var r = D.slice().reverse();
    return e ? r.slice(0, e) : r;
  },
  getRecentEvents: function(e) {
    return this.getEventLog(e || 10);
  },
  getTrackerStats: function() {
    return { totalEvents: f.totalEvents, totalErrors: f.totalErrors, themeChanges: f.themeChanges, lastChangeAt: f.lastChangeAt, lastThemeId: f.lastThemeId, eventLogSize: D.length, telemetryCoreAvailable: hr() };
  },
  clearEventLog: function() {
    return D.length = 0, !0;
  },
  resetMetrics: function() {
    return f.totalEvents = 0, f.totalErrors = 0, f.themeChanges = 0, f.lastChangeAt = null, f.lastThemeId = null, !0;
  },
  configure: function(e) {
    return e || (e = {}), typeof e.enabled == "boolean" && (_.enabled = e.enabled), typeof e.maxEventLogSize == "number" && (_.maxEventLogSize = e.maxEventLogSize), Object.assign({}, _);
  },
  healthCheck: function() {
    var e = W("logger");
    return { healthy: !0, version: Be, moduleId: C, namespace: b, enabled: _.enabled, stats: this.getTrackerStats(), loggerAvailable: !!e, portsInitialized: Je.isInitialized(), strictMode: d(), issues: null };
  }
};
const m = "5.1.0-STRICT-MODE", O = "theme-manager", x = E({ moduleId: O }), pr = (e) => x.get(e), wr = (e) => x.inject(e), vr = () => x.snapshot();
function Ar() {
  return m;
}
const K = [];
function te(e, r, t = {}) {
  try {
    const n = `[${O}]`;
    K.push({ level: e, message: r, data: t, ts: Date.now() }), K.length > 50 && K.shift();
    const a = pr("logger");
    a != null && a[e] && a[e](n, r, t);
  } catch {
  }
}
function Ie() {
  return [...K];
}
function _r(e) {
}
const yr = () => ({
  main: m,
  store: Pe(),
  catalog: ce(),
  helpers: oe(),
  detector: de(),
  applier: le(),
  engine: He(),
  lifecycle: Ke(),
  telemetry: Ye()
}), ne = {
  async init(e = {}) {
    h.trackLifecycle("init:start");
    const r = await I.init(e);
    return r.success ? (te("info", `Theme Manager ${m} initialized - Theme: ${r.themeId}`), h.trackLifecycle("init:complete", { themeId: r.themeId })) : h.trackError(r.error, { phase: "init" }), r;
  },
  reset() {
    return h.trackLifecycle("reset"), I.reset();
  },
  cleanup() {
    return h.trackLifecycle("cleanup"), I.cleanup();
  },
  isInitialized() {
    return I.isInitialized();
  },
  // `isReady` exige os DOIS: ciclo de vida E engine.
  isReady() {
    return I.isInitialized() && T.isInitialized();
  },
  changeTheme(e, r = "user") {
    const t = l.get("currentTheme"), n = T.changeTheme(e, r);
    return n.changed && h.trackThemeChange(e, r, t), n;
  },
  toggleTheme() {
    return T.toggleTheme();
  },
  getTheme() {
    return l.getState();
  },
  getCurrentThemeId() {
    return l.get("currentTheme");
  },
  getAvailableThemes() {
    return j.getAllThemes();
  },
  isValidTheme(e) {
    return j.isValidThemeId(e);
  },
  subscribe(e) {
    return l.subscribe(e);
  },
  info() {
    return {
      name: O,
      version: m,
      status: I.isInitialized() ? "READY" : "NOT_INITIALIZED",
      currentTheme: l.get("currentTheme"),
      source: l.get("source"),
      availableThemes: j.AVAILABLE_THEME_IDS,
      portsInitialized: x.isInitialized(),
      telemetry: h.getTrackerStats(),
      components: {
        store: Pe(),
        catalog: ce(),
        helpers: oe(),
        detector: de(),
        applier: le(),
        engine: He(),
        lifecycle: Ke(),
        telemetry: Ye()
      }
    };
  },
  healthCheck() {
    const e = I.healthCheck();
    return {
      healthy: e.healthy,
      version: m,
      moduleId: O,
      initialized: this.isInitialized(),
      ready: this.isReady(),
      currentTheme: this.getCurrentThemeId(),
      portsInitialized: x.isInitialized(),
      components: e.components,
      issues: e.issues
    };
  },
  debug: {
    getEventLog: () => h.getEventLog(),
    getRecentEvents: (e) => h.getRecentEvents(e),
    getTrackerStats: () => h.getTrackerStats(),
    getStore: () => l.toJSON(),
    getStatus: () => I.getStatus(),
    getLogs: () => Ie(),
    versions: yr()
  },
  getVersion() {
    return m;
  },
  getModuleId() {
    return O;
  },
  setDebug(e) {
  },
  getLogs() {
    return Ie();
  },
  injectPorts: wr,
  getPorts: vr
};
typeof window < "u" && (d() ? (c(
  "GLOBAL_EXPOSURE_BLOCKED",
  { module: O, property: "window.ThemeManager", version: m }
), te("info", `Theme Manager ${m} loaded (strict mode: window.ThemeManager blocked)`)) : (window.ThemeManager = ne, window.ThemeManagerVersion = m, te("info", `Theme Manager ${m} loaded (window.ThemeManager available)`)), window.__dev = window.__dev || {}, window.__dev.themeManager = ne);
var br = ne;
export {
  O as MODULE_ID,
  Er as ThemeApplier,
  j as ThemeCatalog,
  Sr as ThemeDetector,
  T as ThemeEngine,
  Cr as ThemeHelpers,
  I as ThemeLifecycle,
  ne as ThemeManager,
  l as ThemeStore,
  h as ThemeTelemetry,
  m as VERSION,
  br as default,
  Ie as getLogs,
  vr as getPorts,
  Ar as getVersion,
  wr as injectPorts,
  _r as setDebug
};
