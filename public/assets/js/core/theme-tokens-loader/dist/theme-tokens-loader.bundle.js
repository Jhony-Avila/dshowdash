import { createCorePorts as A } from "/core/runtime/ports-profiles.js";
import { isStrict as _, recordViolation as Z } from "/core/runtime/enterprise/strict-mode.js";
var H = "1.3.0-STRICT-MODE", P = "theme-tokens-css-parser", W = A({ moduleId: P });
function Ee(e) {
  return W.get(e);
}
function X() {
  var e = Ee("logger");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("Logger");
    if (t) return t;
  }
  return null;
}
var J = function(e, ...t) {
  var r = X();
  if (r) {
    var n = Array.prototype.slice.call(arguments, 1), o = "[" + P + "]";
    {
      r.warn && r.warn.apply(r, [o].concat(n));
      return;
    }
  }
};
function x() {
  return H;
}
var Ie = /--[\w-]+\s*:\s*[^;]+/g, Le = /^(--[\w-]+)\s*:\s*(.+)$/;
function q(e, t) {
  t || (t = {});
  var r = t.prefix !== void 0 ? t.prefix : "--", n = t.includeComments || !1;
  if (!e || typeof e != "string") return {};
  var o = {};
  try {
    var i = e;
    n || (i = e.replace(/\/\*[\s\S]*?\*\//g, ""));
    var u = i.match(Ie);
    if (!u) return o;
    for (var f = 0; f < u.length; f++) {
      var p = u[f].match(Le);
      if (p && p.length === 3) {
        var C = p[1].trim(), ve = p[2].trim();
        if (r && C.indexOf(r) !== 0) continue;
        o[C] = ve;
      }
    }
  } catch (Te) {
    J("warn", "Parse error:", Te.message);
  }
  return o;
}
function Oe(e, t) {
  t || (t = {});
  var r = t.removePrefix !== !1, n = t.prefix || "--";
  if (!e || typeof e != "string") return e;
  var o = e;
  return r && o.indexOf(n) === 0 && (o = o.substring(n.length)), o = o.replace(/-/g, "."), o;
}
function Q(e, t) {
  t || (t = {});
  var r = t.group || "global", n = t.source || "unknown", o = q(e), i = {};
  for (var u in o)
    o.hasOwnProperty(u) && (i[u] = o[u]);
  return { group: r, source: n, tokens: i, count: Object.keys(i).length, extractedAt: Date.now() };
}
function Ce(e) {
  var t = { colors: {}, spacing: {}, typography: {}, shadows: {}, borders: {}, transitions: {}, zIndex: {}, other: {} }, r = { colors: /^--(color|primary|secondary|success|warning|danger|info|dark|light|white|muted|bg|text|glass|particles)/, spacing: /^--(spacing|padding|margin|gap)/, typography: /^--(font|text|leading)/, shadows: /^--shadow/, borders: /^--(border|radius)/, transitions: /^--transition/, zIndex: /^--z-/ };
  for (var n in e)
    if (e.hasOwnProperty(n)) {
      var o = !1;
      for (var i in r)
        if (r[i].test(n)) {
          t[i][n] = e[n], o = !0;
          break;
        }
      o || (t.other[n] = e[n]);
    }
  return t;
}
function Se() {
  if (typeof window > "u" || typeof document > "u") return {};
  try {
    for (var e = document.documentElement, t = window.getComputedStyle(e), r = {}, n = 0; n < t.length; n++) {
      var o = t[n];
      o.indexOf("--") === 0 && (r[o] = t.getPropertyValue(o).trim());
    }
    return r;
  } catch (i) {
    return J("warn", "DOM extraction error:", i.message), {};
  }
}
var qe = { extractCssVariables: q, normalizeTokenName: Oe, parseCssToTokens: Q, categorizeTokens: Ce, extractTokensFromDOM: Se, getVersion: x, healthCheck: function() {
  return { healthy: !0, version: H, moduleId: P, issues: null, loggerAvailable: !!X(), portsInitialized: W.isInitialized(), strictMode: _() };
} };
const ee = "1.0.0-ENTERPRISE", Ae = "theme-tokens-helpers";
function j() {
  return ee;
}
async function te(e, t = {}) {
  const { timeout: r = 5e3, ...n } = t;
  try {
    const o = new AbortController(), i = setTimeout(() => o.abort(), r), u = await fetch(e, {
      ...n,
      signal: o.signal
    });
    return clearTimeout(i), u.ok ? { ok: !0, data: await u.text(), status: u.status } : { ok: !1, error: `HTTP ${u.status}`, status: u.status };
  } catch (o) {
    return o.name === "AbortError" ? { ok: !1, error: "timeout", status: 0 } : { ok: !1, error: o.message, status: 0 };
  }
}
function _e(...e) {
  const t = {};
  for (const r of e)
    r && typeof r == "object" && Object.assign(t, r);
  return t;
}
function Re(e) {
  return !e || typeof e != "string" ? "dark" : e.toLowerCase().trim();
}
function ze(e) {
  return !e || typeof e != "string" ? "unknown" : e.toLowerCase().trim().replace(/\s+/g, ".");
}
function be(e = "token") {
  const t = Date.now().toString(36), r = Math.random().toString(36).substr(2, 6);
  return `${e}-${t}-${r}`;
}
function De(e) {
  return !e || typeof e != "string" ? !1 : e.startsWith("/") || e.startsWith("http://") || e.startsWith("https://");
}
function $e(e) {
  if (!e || typeof e != "string") return "";
  const t = e.split("/");
  return t[t.length - 1] || "";
}
function re(e, t = "", r = ".") {
  const n = {};
  function o(i, u) {
    for (const f in i) {
      if (!Object.prototype.hasOwnProperty.call(i, f)) continue;
      const p = i[f], C = u ? `${u}${r}${f}` : f;
      p && typeof p == "object" && !Array.isArray(p) ? o(p, C) : n[C] = p;
    }
  }
  return o(e, t), n;
}
function Ge(e, t = ".") {
  const r = {};
  for (const n in e) {
    if (!Object.prototype.hasOwnProperty.call(e, n)) continue;
    const o = n.split(t);
    let i = r;
    for (let u = 0; u < o.length - 1; u++) {
      const f = o[u];
      f in i || (i[f] = {}), i = i[f];
    }
    i[o[o.length - 1]] = e[n];
  }
  return r;
}
function D(e) {
  if (!e || typeof e != "object") return 0;
  let t = 0;
  for (const r in e) {
    if (!Object.prototype.hasOwnProperty.call(e, r)) continue;
    const n = e[r];
    n && typeof n == "object" && !Array.isArray(n) ? t += D(n) : t++;
  }
  return t;
}
const Qe = {
  safeFetch: te,
  mergeTokenMaps: _e,
  normalizeThemeName: Re,
  normalizeGroupName: ze,
  generateId: be,
  isValidUrl: De,
  extractFileName: $e,
  flattenTokens: re,
  unflattenTokens: Ge,
  countTokens: D,
  getVersion: j,
  healthCheck() {
    return {
      healthy: !0,
      version: ee,
      moduleId: Ae,
      issues: null
    };
  }
};
var M = "1.3.0-STRICT-MODE", U = "theme-tokens-store", ne = A({ moduleId: U });
function Ne(e) {
  return ne.get(e);
}
function oe() {
  var e = Ne("logger");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("Logger");
    if (t) return t;
  }
  return null;
}
var K = function(e, ...t) {
  var r = oe();
  if (r) {
    var n = Array.prototype.slice.call(arguments, 1), o = "[" + U + "]";
    if (e === "error") {
      r.error && r.error.apply(r, [o].concat(n));
      return;
    }
    if (e === "warn") {
      r.warn && r.warn.apply(r, [o].concat(n));
      return;
    }
  }
};
function se() {
  return M;
}
var s = { version: M, initialized: !1, lastUpdated: null, tokensByGroup: {}, sources: { css: [], js: [] }, stats: { totalTokens: 0, groupCount: 0, cssSourcesLoaded: 0, jsSourcesLoaded: 0 } };
function E(e) {
  if (e === null || typeof e != "object") return e;
  if (Array.isArray(e)) return e.map(E);
  var t = {};
  for (var r in e)
    Object.prototype.hasOwnProperty.call(e, r) && (t[r] = E(e[r]));
  return t;
}
function Pe() {
  for (var e = 0, t = Object.keys(s.tokensByGroup), r = 0; r < t.length; r++) {
    var n = s.tokensByGroup[t[r]];
    n && typeof n == "object" && (e += Object.keys(n).length);
  }
  s.stats.totalTokens = e, s.stats.groupCount = t.length, s.stats.cssSourcesLoaded = s.sources.css.length, s.stats.jsSourcesLoaded = s.sources.js.length;
}
var d = {
  setTokens: function(e, t, r) {
    if (r || (r = {}), !e || typeof e != "string")
      return K("warn", "setTokens: invalid groupName"), !1;
    try {
      return s.tokensByGroup[e] = E(t || {}), s.lastUpdated = Date.now(), r.type === "css" && r.path ? s.sources.css.indexOf(r.path) === -1 && s.sources.css.push(r.path) : r.type === "js" && r.path && s.sources.js.indexOf(r.path) === -1 && s.sources.js.push(r.path), Pe(), !0;
    } catch (n) {
      return K("error", "setTokens error:", n), !1;
    }
  },
  getTokens: function(e) {
    if (!e) return null;
    var t = s.tokensByGroup[e];
    return t ? E(t) : null;
  },
  getAllTokens: function() {
    return E(s.tokensByGroup);
  },
  getGroups: function() {
    return Object.keys(s.tokensByGroup);
  },
  hasGroup: function(e) {
    return e in s.tokensByGroup;
  },
  getSources: function() {
    return E(s.sources);
  },
  getStats: function() {
    return Object.assign({}, s.stats);
  },
  setInitialized: function(e) {
    s.initialized = e !== !1, s.initialized && (s.lastUpdated = Date.now());
  },
  isInitialized: function() {
    return s.initialized;
  },
  getLastUpdated: function() {
    return s.lastUpdated;
  },
  reset: function() {
    return s.initialized = !1, s.lastUpdated = null, s.tokensByGroup = {}, s.sources = { css: [], js: [] }, s.stats = { totalTokens: 0, groupCount: 0, cssSourcesLoaded: 0, jsSourcesLoaded: 0 }, !0;
  },
  getSnapshot: function() {
    return { version: s.version, initialized: s.initialized, lastUpdated: s.lastUpdated, groups: this.getGroups(), sources: this.getSources(), stats: this.getStats() };
  },
  healthCheck: function() {
    return { healthy: !0, version: M, moduleId: U, initialized: s.initialized, stats: this.getStats(), issues: null, loggerAvailable: !!oe(), portsInitialized: ne.isInitialized(), strictMode: _() };
  }
}, ae = "1.3.0-STRICT-MODE", B = "theme-tokens-registry", ie = A({ moduleId: B });
function xe(e) {
  return ie.get(e);
}
function ue() {
  var e = xe("logger");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("Logger");
    if (t) return t;
  }
  return null;
}
var $ = function(e, ...t) {
  var r = ue();
  if (r) {
    var n = Array.prototype.slice.call(arguments, 1), o = "[" + B + "]";
    if (e === "error") {
      r.error && r.error.apply(r, [o].concat(n));
      return;
    }
    if (e === "warn") {
      r.warn && r.warn.apply(r, [o].concat(n));
      return;
    }
  }
};
function le() {
  return ae;
}
var w = { GLOBAL_TOKENS: "global.tokens", GLOBAL_EXTENDED: "global.extended", COMPONENT_MAIN: "component.main", COMPONENT_LOGIN: "component.login-modal", COMPONENT_SIDEBAR: "component.sidebar", COMPONENT_TICKER: "component.header.ticker" }, v = {}, c = {
  registerTokens: function(e, t, r) {
    if (r || (r = {}), !e || typeof e != "string")
      return $("warn", "registerTokens: invalid groupName"), { success: !1, error: "invalid-group-name" };
    if (!t || typeof t != "object")
      return $("warn", "registerTokens: invalid tokenMap"), { success: !1, error: "invalid-token-map" };
    try {
      var n = d.setTokens(e, t, r);
      return n && (v[e] = { registeredAt: Date.now(), source: r.path || r.source || "unknown", type: r.type || "unknown", tokenCount: D(t) }), { success: n, groupName: e, tokenCount: D(t) };
    } catch (o) {
      return $("error", "registerTokens error:", o), { success: !1, error: o.message };
    }
  },
  getTokens: function(e) {
    return d.getTokens(e);
  },
  getAllGroups: function() {
    return d.getGroups();
  },
  getAllTokens: function() {
    return d.getAllTokens();
  },
  getGroupMeta: function(e) {
    return v[e] || null;
  },
  getAllMeta: function() {
    return Object.assign({}, v);
  },
  hasGroup: function(e) {
    return d.hasGroup(e);
  },
  getTokensByPattern: function(e) {
    if (!e) return {};
    var t = d.getAllTokens(), r = {};
    for (var n in t)
      t.hasOwnProperty(n) && (n.indexOf(e) > -1 || n.indexOf(e) === 0) && (r[n] = t[n]);
    return r;
  },
  getComponentTokens: function() {
    return this.getTokensByPattern("component.");
  },
  getGlobalTokens: function() {
    return this.getTokensByPattern("global.");
  },
  // @ts-expect-error strict migration — TS7053
  clearRegistry: function() {
    d.reset();
    for (var e in v) delete v[e];
    return !0;
  },
  getSummary: function() {
    for (var e = this.getAllGroups(), t = { totalGroups: e.length, totalTokens: 0, groups: {} }, r = 0; r < e.length; r++) {
      var n = e[r], o = v[n] || {}, i = d.getTokens(n), u = i ? Object.keys(i).length : 0;
      t.groups[n] = { tokenCount: u, source: o.source, type: o.type }, t.totalTokens += u;
    }
    return t;
  },
  healthCheck: function() {
    var e = this.getSummary();
    return { healthy: !0, version: ae, moduleId: B, totalGroups: e.totalGroups, totalTokens: e.totalTokens, issues: null, loggerAvailable: !!ue(), portsInitialized: ie.isInitialized(), strictMode: _() };
  }
};
const ce = "1.0.0-ENTERPRISE", je = "theme-tokens-loader-core";
function de() {
  return ce;
}
const R = {
  css: [
    {
      path: "/assets/css/theme.tokens.css",
      group: w.GLOBAL_TOKENS,
      description: "Global theme tokens"
    },
    {
      path: "/assets/css/design-system/01-tokens-extended.css",
      group: w.GLOBAL_EXTENDED,
      description: "Extended design system tokens"
    },
    {
      path: "/components/main/styles/main.tokens.css",
      group: w.COMPONENT_MAIN,
      description: "Main component tokens"
    },
    {
      path: "/components/login-modal/styles/tokens.css",
      group: w.COMPONENT_LOGIN,
      description: "Login modal tokens"
    },
    {
      path: "/components/sidebar/styles/tokens.css",
      group: w.COMPONENT_SIDEBAR,
      description: "Sidebar tokens"
    }
  ],
  js: [
    {
      path: "/components/header/components/ticker/config/design-tokens.js",
      group: w.COMPONENT_TICKER,
      exportName: "TICKER_TOKENS",
      description: "Ticker design tokens"
    }
  ]
}, l = {
  loading: !1,
  lastLoadAt: null,
  errors: []
};
async function Me(e) {
  try {
    const t = await te(e.path);
    if (!t.ok)
      return {
        success: !1,
        source: e.path,
        group: e.group,
        error: t.error
      };
    const r = Q(t.data, {
      group: e.group,
      source: e.path
    });
    return c.registerTokens(e.group, r.tokens, {
      type: "css",
      path: e.path,
      description: e.description
    }), {
      success: !0,
      source: e.path,
      group: e.group,
      tokenCount: r.count
    };
  } catch (t) {
    return {
      success: !1,
      source: e.path,
      group: e.group,
      error: t.message
    };
  }
}
async function Ue(e) {
  try {
    const t = await import(e.path), r = t[e.exportName] || t.default;
    if (!r)
      return {
        success: !1,
        source: e.path,
        group: e.group,
        error: `Export "${e.exportName}" not found`
      };
    const n = re(r);
    return c.registerTokens(e.group, n, {
      type: "js",
      path: e.path,
      description: e.description,
      exportName: e.exportName
    }), {
      success: !0,
      source: e.path,
      group: e.group,
      tokenCount: Object.keys(n).length
    };
  } catch (t) {
    return {
      success: !1,
      source: e.path,
      group: e.group,
      error: t.message
    };
  }
}
const I = {
  // Carregar todos os tokens CSS
  async loadCssTokens() {
    const e = [];
    for (const t of R.css) {
      const r = await Me(t);
      e.push(r), r.success || l.errors.push({
        type: "css",
        source: t.path,
        error: r.error,
        at: Date.now()
      });
    }
    return {
      type: "css",
      total: e.length,
      success: e.filter((t) => t.success).length,
      failed: e.filter((t) => !t.success).length,
      results: e
    };
  },
  // Carregar todos os tokens JS
  async loadJsTokens() {
    const e = [];
    for (const t of R.js) {
      const r = await Ue(t);
      e.push(r), r.success || l.errors.push({
        type: "js",
        source: t.path,
        error: r.error,
        at: Date.now()
      });
    }
    return {
      type: "js",
      total: e.length,
      success: e.filter((t) => t.success).length,
      failed: e.filter((t) => !t.success).length,
      results: e
    };
  },
  // Carregar todas as fontes
  async loadAllSources() {
    if (l.loading)
      return { ok: !1, error: "already-loading" };
    l.loading = !0, l.errors = [];
    const e = performance.now();
    try {
      const [t, r] = await Promise.all([
        this.loadCssTokens(),
        this.loadJsTokens()
      ]);
      l.lastLoadAt = Date.now(), l.loading = !1;
      const n = performance.now() - e;
      return {
        ok: !0,
        duration: Math.round(n),
        sources: {
          css: t,
          js: r
        },
        summary: {
          totalSources: t.total + r.total,
          successfulSources: t.success + r.success,
          failedSources: t.failed + r.failed,
          totalTokens: c.getSummary().totalTokens
        }
      };
    } catch (t) {
      return l.loading = !1, {
        ok: !1,
        error: t.message,
        duration: performance.now() - e
      };
    }
  },
  // Recarregar todas as fontes
  async reload() {
    return c.clearRegistry(), this.loadAllSources();
  },
  // Obter estado do loader
  getState() {
    return {
      loading: l.loading,
      lastLoadAt: l.lastLoadAt,
      errorCount: l.errors.length,
      errors: [...l.errors]
    };
  },
  // Obter configuração de fontes
  getSources() {
    return {
      css: R.css.map((e) => ({ path: e.path, group: e.group })),
      js: R.js.map((e) => ({ path: e.path, group: e.group }))
    };
  },
  // Health check
  healthCheck() {
    return {
      healthy: !l.loading && l.errors.length === 0,
      version: ce,
      moduleId: je,
      state: this.getState(),
      issues: l.errors.length > 0 ? `${l.errors.length} load errors` : null
    };
  }
}, fe = "1.0.0-ENTERPRISE", Be = "theme-tokens-lifecycle";
function ge() {
  return fe;
}
const a = {
  status: "NOT_INITIALIZED",
  initialized: !1,
  initCount: 0,
  lastInitAt: null,
  lastError: null
}, m = {
  NOT_INITIALIZED: "NOT_INITIALIZED",
  INITIALIZING: "INITIALIZING",
  READY: "READY",
  ERROR: "ERROR"
}, h = {
  // Inicializar (idempotente)
  async init(e = {}) {
    if (a.initialized && a.status === m.READY)
      return {
        ok: !0,
        alreadyInitialized: !0,
        status: a.status,
        initCount: a.initCount
      };
    a.status = m.INITIALIZING;
    try {
      const t = await I.loadAllSources();
      return t.ok ? (d.setInitialized(!0), a.initialized = !0, a.status = m.READY, a.initCount++, a.lastInitAt = Date.now(), a.lastError = null, {
        ok: !0,
        alreadyInitialized: !1,
        status: a.status,
        initCount: a.initCount,
        summary: t.summary
      }) : (a.status = m.ERROR, a.lastError = t.error, {
        ok: !1,
        error: t.error,
        status: a.status
      });
    } catch (t) {
      return a.status = m.ERROR, a.lastError = t.message, {
        ok: !1,
        error: t.message,
        status: a.status
      };
    }
  },
  // Reset completo
  reset() {
    return c.clearRegistry(), d.reset(), a.status = m.NOT_INITIALIZED, a.initialized = !1, a.lastError = null, { ok: !0 };
  },
  // Reload (reset + init)
  async reload() {
    return this.reset(), this.init();
  },
  // Verificar se inicializado
  isInitialized() {
    return a.initialized;
  },
  // Obter status
  getStatus() {
    return a.status;
  },
  // Obter informações do lifecycle
  getLifecycleInfo() {
    return {
      status: a.status,
      initialized: a.initialized,
      initCount: a.initCount,
      lastInitAt: a.lastInitAt,
      lastError: a.lastError,
      storeInitialized: d.isInitialized()
    };
  },
  // Health check
  healthCheck() {
    const e = d.healthCheck(), t = c.healthCheck(), r = I.healthCheck(), n = e.healthy && t.healthy && r.healthy && a.status === m.READY;
    return {
      healthy: n,
      version: fe,
      moduleId: Be,
      lifecycle: this.getLifecycleInfo(),
      components: {
        store: e,
        registry: t,
        loader: r
      },
      issues: n ? null : a.lastError || "Not ready"
    };
  }
};
var pe = "1.4.0-STRICT-MODE", V = "theme-tokens-telemetry", z = "theme-tokens-loader";
function he() {
  return pe;
}
var ye = A({ moduleId: V });
function ke(e) {
  return ye.get(e);
}
function me() {
  var e = ke("logger");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("Logger");
    if (t) return t;
  }
  return null;
}
function we() {
  var e = ke("telemetry");
  if (e) return e;
  if (typeof window < "u" && window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    var t = window.Core.windowAdapter.get("Telemetry");
    if (t) return t;
  }
  return typeof window < "u" && window.Telemetry ? (Z("WINDOW_TELEMETRY_FALLBACK", { module: V }), window.Telemetry) : null;
}
var Y = function(e, ...t) {
  var r = me();
  if (r) {
    var n = Array.prototype.slice.call(arguments, 1), o = "[" + z + "]";
    if (e === "error") {
      r.error && r.error.apply(r, [o].concat(n));
      return;
    }
    if (e === "warn") {
      r.warn && r.warn.apply(r, [o].concat(n));
      return;
    }
    if (e === "info") {
      r.info && r.info.apply(r, [o].concat(n));
      return;
    }
  }
}, T = { enabled: !0, maxEventLogSize: 100 }, L = [], g = { totalEvents: 0, totalErrors: 0, loadEvents: 0, lastEventAt: null };
function Ve() {
  var e = we();
  return e && e.track;
}
function Ke(e) {
  L.length >= T.maxEventLogSize && L.shift(), L.push(e);
}
var y = {
  track: function(e, t) {
    if (t || (t = {}), !T.enabled) return !1;
    var r = Object.assign({ namespace: z, event: e, timestamp: Date.now() }, t);
    try {
      Ke(r), g.totalEvents++, g.lastEventAt = r.timestamp;
      var n = we();
      return n && n.track && n.track(z + ":" + e, r), Y("info", e, r), !0;
    } catch (o) {
      return Y("warn", "Track failed:", o.message), !1;
    }
  },
  trackTokensEvent: function(e, t) {
    return this.track("tokens:" + e, t);
  },
  trackError: function(e, t, r) {
    return r || (r = {}), g.totalErrors++, this.track("error", Object.assign({ context: e, error: t && t.message ? t.message : String(t) }, r));
  },
  trackTiming: function(e, t, r) {
    return this.track("timing", { operation: e, durationMs: t, success: r !== !1 });
  },
  trackSourceLoaded: function(e, t, r, n) {
    return g.loadEvents++, this.track("source:" + e + ":loaded", { source: t, tokenCount: r, success: n !== !1 });
  },
  trackLifecycle: function(e, t) {
    return this.track("lifecycle:" + e, t);
  },
  getEventLog: function(e) {
    var t = L.slice().reverse();
    return e ? t.slice(0, e) : t;
  },
  // @ts-expect-error strict migration — TS2345
  getRecentEvents: function(e) {
    return this.getEventLog(e || 10);
  },
  getTrackerStats: function() {
    return { totalEvents: g.totalEvents, totalErrors: g.totalErrors, loadEvents: g.loadEvents, lastEventAt: g.lastEventAt, eventLogSize: L.length, telemetryCoreAvailable: Ve() };
  },
  clearEventLog: function() {
    return L.length = 0, !0;
  },
  resetMetrics: function() {
    return g.totalEvents = 0, g.totalErrors = 0, g.loadEvents = 0, g.lastEventAt = null, !0;
  },
  configure: function(e) {
    return e || (e = {}), typeof e.enabled == "boolean" && (T.enabled = e.enabled), typeof e.maxEventLogSize == "number" && (T.maxEventLogSize = e.maxEventLogSize), Object.assign({}, T);
  },
  healthCheck: function() {
    return { healthy: !0, version: pe, moduleId: V, namespace: z, enabled: T.enabled, stats: this.getTrackerStats(), issues: null, loggerAvailable: !!me(), portsInitialized: ye.isInitialized(), strictMode: _() };
  }
};
const k = "2.1.0-STRICT-MODE", O = "theme-tokens-loader", et = m, Ye = w, S = A({ moduleId: O }), Fe = (e) => S.get(e), Ze = (e) => S.inject(e), He = () => S.snapshot();
function tt() {
  return k;
}
const b = [];
function G(e, t, r = {}) {
  try {
    const n = `[${O}]`;
    b.push({ level: e, message: t, data: r, ts: Date.now() }), b.length > 50 && b.shift();
    const o = Fe("logger");
    o != null && o[e] && o[e](n, t, r);
  } catch {
  }
}
function F() {
  return [...b];
}
function rt(e) {
}
const We = () => ({
  main: k,
  store: se(),
  registry: le(),
  loader: de(),
  lifecycle: ge(),
  helpers: j(),
  cssParser: x(),
  telemetry: he()
}), N = {
  async init(e = {}) {
    y.trackLifecycle("init:start");
    const t = await h.init(e);
    return t.ok ? (G("info", `Theme Tokens Loader ${k} initialized`), y.trackLifecycle("init:complete", { tokensLoaded: t.summary?.totalTokens })) : y.trackError("init", t.error), t;
  },
  // NÃO é alias de init: já inicializado → reload.
  async load(e = {}) {
    return h.isInitialized() ? h.reload() : this.init(e);
  },
  reset() {
    return y.trackLifecycle("reset"), h.reset();
  },
  async reload() {
    y.trackLifecycle("reload:start");
    const e = await h.reload();
    return y.trackLifecycle("reload:complete", { ok: e.ok }), e;
  },
  isInitialized() {
    return h.isInitialized();
  },
  getTokens() {
    return c.getAllTokens();
  },
  getTokensByGroup(e) {
    return c.getTokens(e);
  },
  getGlobalTokens() {
    return c.getGlobalTokens();
  },
  getComponentTokens() {
    return c.getComponentTokens();
  },
  getGroups() {
    return c.getAllGroups();
  },
  hasGroup(e) {
    return c.hasGroup(e);
  },
  getToken(e, t) {
    const r = c.getTokens(e);
    return r ? r[t] : void 0;
  },
  status() {
    const e = d.getSnapshot(), t = I.getState();
    return {
      initialized: h.isInitialized(),
      status: h.getStatus(),
      sourcesLoaded: { css: e.sources.css.length, js: e.sources.js.length },
      tokensCount: e.stats.totalTokens,
      groupsCount: e.stats.groupCount,
      lastUpdated: e.lastUpdated,
      errors: t.errorCount
    };
  },
  info() {
    const e = c.getSummary(), t = h.getLifecycleInfo();
    return {
      name: O,
      version: k,
      status: t.status,
      initialized: t.initialized,
      groups: e.groups,
      totalGroups: e.totalGroups,
      totalTokens: e.totalTokens,
      sources: I.getSources(),
      lifecycle: t,
      portsInitialized: S.isInitialized(),
      components: {
        store: se(),
        registry: le(),
        loader: de(),
        lifecycle: ge(),
        helpers: j(),
        cssParser: x(),
        telemetry: he()
      }
    };
  },
  healthCheck() {
    const e = h.healthCheck();
    return {
      healthy: e.healthy,
      version: k,
      moduleId: O,
      initialized: this.isInitialized(),
      status: this.status(),
      portsInitialized: S.isInitialized(),
      components: e.components,
      issues: e.issues
    };
  },
  debug: {
    getStore: () => d.getSnapshot(),
    getEventLog: () => y.getEventLog(),
    getRecentEvents: (e) => y.getRecentEvents(e),
    getTrackerStats: () => y.getTrackerStats(),
    getSources: () => I.getSources(),
    getLoaderState: () => I.getState(),
    getRegistrySummary: () => c.getSummary(),
    getLogs: () => F(),
    TOKEN_GROUPS: Ye,
    versions: We()
  },
  getVersion() {
    return k;
  },
  getModuleId() {
    return O;
  },
  setDebug(e) {
  },
  getLogs() {
    return F();
  },
  injectPorts: Ze,
  getPorts: He
};
typeof window < "u" && (_() ? (Z(
  "GLOBAL_EXPOSURE_BLOCKED",
  { module: O, property: "window.ThemeTokensLoader", version: k }
), G("info", `Theme Tokens Loader ${k} loaded (strict mode: window.ThemeTokensLoader blocked)`)) : (window.ThemeTokensLoader = N, G("info", `Theme Tokens Loader ${k} loaded (window.ThemeTokensLoader available)`)), window.__dev = window.__dev || {}, window.__dev.themeTokensLoader = N);
var nt = N;
export {
  qe as CssParser,
  et as LIFECYCLE_STATUS,
  O as MODULE_ID,
  Ye as TOKEN_GROUPS,
  N as ThemeTokensLoader,
  Qe as TokensHelpers,
  h as TokensLifecycle,
  I as TokensLoader,
  c as TokensRegistry,
  d as TokensStore,
  y as TokensTelemetry,
  k as VERSION,
  nt as default,
  F as getLogs,
  He as getPorts,
  tt as getVersion,
  Ze as injectPorts,
  rt as setDebug
};
