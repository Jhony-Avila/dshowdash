import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { API_PATH, REQUEST_TIMEOUT } from "../core/constants.js";
const MODULE_ID = "panel-01.services.api";
const VERSION = "9.3.1-URL-FIX";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
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
function _getBaseUrl() {
  _initPorts();
  var cfg = _getPort("config");
  if (cfg?.app?.baseUrl) return cfg.app.baseUrl;
  if (cfg?.baseUrl) return cfg.baseUrl;
  var router = _getPort("router");
  if (router?.getBaseUrl) return router.getBaseUrl();
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "";
}
function ApiClient() {
  this._baseUrl = API_PATH;
  this._timeout = REQUEST_TIMEOUT;
  this._cache = /* @__PURE__ */ new Map();
  this._cacheTTL = 3e4;
  this._controller = null;
  _initPorts();
}
ApiClient.prototype.fetchKPIs = function() {
  return this._request({ action: "kpis" }, "kpis");
};
ApiClient.prototype.fetchRequisicoes = function(params) {
  return this._request(Object.assign({ action: "list" }, params || {}), null);
};
ApiClient.prototype.fetchRequisicao360 = function(id) {
  return this._request({ id }, "req360_" + id, 6e4);
};
ApiClient.prototype.fetchSituacoes = function() {
  return this._request({ action: "situacoes" }, "situacoes", 3e5);
};
ApiClient.prototype.fetchCentrosCusto = function() {
  return this._request({ action: "centros" }, "centros", 3e5);
};
ApiClient.prototype.fetchCategorias = function() {
  return this._request({ action: "categorias" }, "categorias", 3e5);
};
ApiClient.prototype.fetchFornecedores = function() {
  return this._request({ action: "fornecedores" }, "fornecedores", 3e5);
};
ApiClient.prototype.fetchResumoMensal = function() {
  return this._request({ action: "resumo-mensal" }, "resumo", 6e4);
};
ApiClient.prototype.fetchTopFornecedores = function(limit) {
  return this._request({ action: "top-fornecedores", limit: limit || 10 }, "topforn", 6e4);
};
ApiClient.prototype.fetchTopCategorias = function() {
  return this._request({ action: "top-categorias" }, "topcat", 6e4);
};
ApiClient.prototype.searchRequisicoes = function(query, limit) {
  if (query.length < 2) return Promise.resolve({ ok: true, data: [] });
  return this._request({ action: "search", q: query, limit: limit || 10 }, null);
};
ApiClient.prototype.updateRequisicao = function(id, data) {
  return this._post({ action: "update", id }, data);
};
ApiClient.prototype.createRequisicao = function(data) {
  return this._post({ action: "create" }, data);
};
ApiClient.prototype.deleteRequisicao = function(id) {
  return this._post({ action: "delete", id }, {});
};
ApiClient.prototype.duplicateRequisicao = function(id) {
  return this._post({ action: "duplicate", id }, {});
};
ApiClient.prototype.bulkUpdate = function(ids, data) {
  return this._post({ action: "bulk-update" }, { ids, data });
};
ApiClient.prototype.importData = function(data) {
  return this._post({ action: "import" }, { data });
};
ApiClient.prototype.getExportUrl = function(params) {
  var base = _getBaseUrl();
  var url = new URL(this._baseUrl, base || void 0);
  url.searchParams.append("action", "export");
  if (params) {
    Object.entries(params).forEach(function(entry) {
      if (entry[1] && entry[1] !== "all") url.searchParams.append(entry[0], entry[1]);
    });
  }
  return url.toString();
};
ApiClient.prototype.getExportPDFUrl = function(params) {
  var base = _getBaseUrl();
  var url = new URL(this._baseUrl, base || void 0);
  url.searchParams.append("action", "export-pdf");
  if (params) {
    Object.entries(params).forEach(function(entry) {
      if (entry[1] && entry[1] !== "all") url.searchParams.append(entry[0], entry[1]);
    });
  }
  return url.toString();
};
ApiClient.prototype.fetchAllData = function(params) {
  var self = this;
  return Promise.all([self.fetchKPIs(), self.fetchRequisicoes(params), self.fetchSituacoes(), self.fetchCentrosCusto()]).then(function(results) {
    var kpis = results[0], requisicoes = results[1], situacoes = results[2], centros = results[3];
    return { ok: true, kpis: kpis.ok ? kpis.data : null, requisicoes: requisicoes.ok ? requisicoes.data : null, pagination: requisicoes.ok ? requisicoes.pagination : null, filters: { situacoes: situacoes.ok ? situacoes.data : [], centros: centros.ok ? centros.data : [] } };
  });
};
ApiClient.prototype._request = function(params, cacheKey, cacheTTL) {
  if (cacheKey) {
    var cached = this._getCache(cacheKey);
    if (cached) return Promise.resolve(cached);
  }
  this._controller = new AbortController();
  var self = this;
  var timeout = setTimeout(function() {
    self._controller.abort();
  }, this._timeout);
  var base = _getBaseUrl();
  var url = new URL(this._baseUrl, base || void 0);
  Object.entries(params).forEach(function(entry) {
    if (entry[1] !== void 0 && entry[1] !== null && entry[1] !== "") url.searchParams.append(entry[0], entry[1]);
  });
  return fetch(url.toString(), { method: "GET", signal: this._controller.signal, headers: { "Accept": "application/json" } }).then(function(response) {
    clearTimeout(timeout);
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }).then(function(data) {
    if (cacheKey && data.ok) self._setCache(cacheKey, data, cacheTTL || self._cacheTTL);
    return data;
  }).catch(function(error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") return { ok: false, error: "TIMEOUT" };
    return { ok: false, error: error.message };
  });
};
ApiClient.prototype._post = function(params, body) {
  this._controller = new AbortController();
  var self = this;
  var timeout = setTimeout(function() {
    self._controller.abort();
  }, this._timeout);
  var base = _getBaseUrl();
  var url = new URL(this._baseUrl, base || void 0);
  Object.entries(params).forEach(function(entry) {
    if (entry[1] !== void 0 && entry[1] !== null) url.searchParams.append(entry[0], entry[1]);
  });
  return fetch(url.toString(), { method: "POST", signal: this._controller.signal, headers: { "Accept": "application/json", "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(function(response) {
    clearTimeout(timeout);
    if (!response.ok) throw new Error("HTTP " + response.status);
    return response.json();
  }).then(function(data) {
    self.clearCache();
    return data;
  }).catch(function(error) {
    clearTimeout(timeout);
    if (error.name === "AbortError") return { ok: false, error: "TIMEOUT" };
    return { ok: false, error: error.message };
  });
};
ApiClient.prototype._getCache = function(key) {
  var item = this._cache.get(key);
  if (!item) return null;
  if (Date.now() > item.expires) {
    this._cache.delete(key);
    return null;
  }
  return item.data;
};
ApiClient.prototype._setCache = function(key, data, ttl) {
  this._cache.set(key, { data, expires: Date.now() + ttl });
};
ApiClient.prototype.clearCache = function() {
  this._cache.clear();
};
ApiClient.prototype.cancel = function() {
  if (this._controller) this._controller.abort();
};
ApiClient.prototype.healthCheck = function() {
  var checks = { hasBaseUrl: !!this._baseUrl, hasTimeout: this._timeout > 0, cacheAvailable: !!this._cache };
  var passed = Object.values(checks).filter(Boolean).length;
  var total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: passed + "/" + total, checks, cacheSize: this._cache.size, p25Compliant: true, timestamp: Date.now() };
};
ApiClient.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, baseUrl: this._baseUrl, timeout: this._timeout, cacheSize: this._cache.size, p25Compliant: true };
};
function healthCheck() {
  return apiClient.healthCheck();
}
function info() {
  return apiClient.info();
}
var apiClient = new ApiClient();
var api_default = apiClient;
export {
  ApiClient,
  MODULE_ID,
  VERSION,
  apiClient,
  api_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts
};
