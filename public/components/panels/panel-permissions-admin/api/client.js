import { createPanelPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-permissions-admin.api.client";
const BASE_URL = "/api/permissions/uarps.php";
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
function _csrfToken() {
  const porta = _getPort("securityCSRF");
  const t1 = porta?.getToken?.();
  if (t1) return String(t1);
  const g = window.SecurityCSRF;
  const t2 = g?.getToken?.();
  if (t2) return String(t2);
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta?.content) return meta.content;
  const c = document.cookie.split(";").map((x) => x.trim()).find((x) => x.startsWith("csrf_token="));
  return c ? c.slice(11) : "";
}
function _getBaseUrl() {
  _initPorts();
  const config = _getPort("config");
  if (config && config.app && config.app.baseUrl) return config.app.baseUrl;
  if (config && config.baseUrl) return config.baseUrl;
  const routeState = _getPort("routeState");
  if (routeState && routeState.getBaseUrl) return routeState.getBaseUrl();
  return "";
}
async function _request(action, params = {}, { signal } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || window.location.origin);
    url.searchParams.set("action", action);
    Object.entries(params).forEach(([key, value]) => {
      if (value !== void 0 && value !== null) {
        url.searchParams.set(key, String(value));
      }
    });
    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { "Accept": "application/json" },
      credentials: "same-origin",
      signal
    });
    return await _envelope(response);
  } catch (error) {
    return { success: false, error: error?.name === "AbortError" ? "ABORTADO" : error instanceof TypeError || /fetch|network|load failed/i.test(String(error?.message)) ? "FALHA_DE_REDE" : "ERRO_NO_CLIENTE", data: null };
  }
}
async function _envelope(response) {
  let json = null;
  try {
    json = await response.json();
  } catch (_) {
    return { success: false, data: null, error: response.ok ? "RESPOSTA_FORA_DO_CONTRATO" : "HTTP_" + response.status };
  }
  if (!json || typeof json !== "object" || !("ok" in json)) return { success: false, data: null, error: "RESPOSTA_FORA_DO_CONTRATO" };
  if (json.ok !== true || !response.ok) return { success: false, data: null, error: typeof json.error === "string" ? json.error : "HTTP_" + response.status };
  return { success: true, data: json.data, error: null };
}
async function _post(action, data = {}, { signal, operacaoId } = {}) {
  try {
    const base = _getBaseUrl();
    const url = new URL(BASE_URL, base || window.location.origin);
    url.searchParams.set("action", action);
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json", "X-CSRF-Token": _csrfToken(), "Idempotency-Key": operacaoId || novaOperacao() },
      credentials: "same-origin",
      signal,
      body: JSON.stringify(data)
    });
    return await _envelope(response);
  } catch (error) {
    return { success: false, error: error?.name === "AbortError" ? "ABORTADO" : error instanceof TypeError || /fetch|network|load failed/i.test(String(error?.message)) ? "FALHA_DE_REDE" : "ERRO_NO_CLIENTE", data: null };
  }
}
function novaOperacao() {
  const c = globalThis.crypto;
  if (c?.randomUUID) return c.randomUUID();
  return "op-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 12);
}
async function _delete(action, params, { operacaoId } = {}) {
  try {
    const url = new URL(BASE_URL, _getBaseUrl() || window.location.origin);
    url.searchParams.set("action", action);
    const op = operacaoId || novaOperacao();
    url.searchParams.set("operacao_id", op);
    const { reason, ...naUrl } = params;
    Object.entries(naUrl).forEach(([k, v]) => {
      if (v !== void 0 && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
    const temMotivo = typeof reason === "string" && reason !== "";
    const response = await fetch(url.toString(), { method: "DELETE", headers: { "Accept": "application/json", "X-CSRF-Token": _csrfToken(), "Idempotency-Key": op, ...temMotivo ? { "Content-Type": "application/json" } : {} }, credentials: "same-origin", ...temMotivo ? { body: JSON.stringify({ reason }) } : {} });
    return await _envelope(response);
  } catch (error) {
    return { success: false, error: error?.name === "AbortError" ? "ABORTADO" : error instanceof TypeError || /fetch|network|load failed/i.test(String(error?.message)) ? "FALHA_DE_REDE" : "ERRO_NO_CLIENTE", data: null };
  }
}
async function inheritTrigger(userId, triggerId, opts = {}) {
  return _delete("remove-trigger", { user_id: userId, trigger_id: triggerId, reason: opts.reason }, { operacaoId: opts.operacaoId });
}
async function inheritRegion(userId, regionId, opts = {}) {
  return _delete("remove-region", { user_id: userId, region_id: regionId, reason: opts.reason }, { operacaoId: opts.operacaoId });
}
async function previewTrigger(userId, triggerId, state) {
  return _request("preview-trigger", { user_id: userId, trigger_id: triggerId, state });
}
async function getUsers() {
  const res = await _request("all-users");
  if (!res.success) return res;
  if (!Array.isArray(res.data?.users)) return { success: false, data: null, error: "RESPOSTA_FORA_DO_CONTRATO" };
  {
    return {
      success: true,
      data: res.data.users.map((u) => ({
        id: u.id,
        nome: u.nome || u.nome_completo || u.username,
        name: u.nome || u.nome_completo || u.username,
        // o repositório manda 'nome'
        email: u.email,
        nivel: u.level,
        level: u.level,
        ativo: true
      }))
    };
  }
  return res;
}
async function getInventory() {
  try {
    const inventory = window.Permissions?.getInventory?.() || window.PermissionsInventory?.getAll?.();
    if (inventory) {
      const triggers = [];
      const regions = [];
      if (inventory.triggers) {
        Object.entries(inventory.triggers).forEach(([id, data]) => {
          triggers.push({ id, label: data.label || _formatLabel(id), area: _extractArea(id), ...data });
        });
      }
      if (inventory.regions) {
        Object.entries(inventory.regions).forEach(([id, data]) => {
          regions.push({ id, label: data.label || _formatLabel(id), ...data });
        });
      }
      return { success: true, data: { triggers, regions } };
    }
    return _scanDOMForInventory();
  } catch (error) {
    return { success: false, error: error.message, data: { triggers: [], regions: [] } };
  }
}
function _scanDOMForInventory() {
  const triggers = [];
  const regions = [];
  document.querySelectorAll("[data-uarps-trigger]").forEach((el) => {
    const id = el.getAttribute("data-uarps-trigger");
    if (id && !triggers.find((t) => t.id === id)) {
      triggers.push({ id, label: el.textContent?.trim() || _formatLabel(id), area: _extractArea(id) });
    }
  });
  document.querySelectorAll("[data-uarps-region]").forEach((el) => {
    const id = el.getAttribute("data-uarps-region");
    if (id && !regions.find((r) => r.id === id)) {
      regions.push({ id, label: el.getAttribute("data-region-label") || _formatLabel(id) });
    }
  });
  return { success: true, data: { triggers, regions } };
}
function _extractArea(triggerId) {
  const parts = triggerId.split(":");
  return parts.length >= 2 ? parts[1] : "other";
}
function _formatLabel(id) {
  const parts = id.split(":");
  const last = parts[parts.length - 1] || id;
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, " ");
}
function _detalhe(r) {
  return {
    state: r.state,
    estado_efetivo: r.estado_efetivo,
    vigente: r.vigente,
    vencida: r.vencida,
    expires_at: r.expires_at ?? null,
    reason: r.reason ?? null,
    granted_by: r.granted_by ?? null,
    granted_at: r.granted_at ?? null,
    // E3.2 (escritor v4.6/v4.7): concedente original, nível EXATO dele agora e a alçada dele AGORA sobre ESTA capacidade (só informação)
    concedente_id: r.concedente_id ?? null,
    concedente_nivel_atual: r.concedente_nivel_atual ?? null,
    concedente_alcada_atual: r.concedente_alcada_atual ?? null,
    perdeu_alcada: r.perdeu_alcada ?? null,
    nivel_minimo_capacidade: r.nivel_minimo_capacidade ?? null,
    alcada_estado: r.alcada_estado ?? void 0,
    alcada_motivo: r.alcada_motivo ?? null,
    // v4.8: motivo quando sem alçada
    concedente_administra_permissoes: r.concedente_administra_permissoes ?? null,
    concedente_possui_capacidade: r.concedente_possui_capacidade ?? null
  };
}
function projetarPermissoes(data) {
  const linhas = [...data?.triggers || [], ...data?.regions || []];
  if (linhas.some((r) => typeof r.vigente !== "boolean" || typeof r.estado_efetivo !== "string")) return null;
  const mapa = (lista, k) => Object.fromEntries(lista.map((r) => [String(r[k]), _detalhe(r)]));
  const por = (lista, k, est) => lista.filter((r) => r.estado_efetivo === est).map((r) => String(r[k]));
  const t = data.triggers || [];
  const g = data.regions || [];
  return {
    triggers: por(t, "trigger_id", "allow"),
    regions: por(g, "region_id", "allow"),
    negados: { triggers: por(t, "trigger_id", "deny"), regions: por(g, "region_id", "deny") },
    expirados: { triggers: por(t, "trigger_id", "expirada"), regions: por(g, "region_id", "expirada") },
    detalhes: { triggers: mapa(t, "trigger_id"), regions: mapa(g, "region_id") },
    contagem: { linhas_triggers: t.length, linhas_regions: g.length }
  };
}
async function getUserPermissions(userId) {
  const res = await _request("user-permissions", { user_id: userId });
  if (res.success && (!Array.isArray(res.data?.triggers) || !Array.isArray(res.data?.regions))) return { success: false, data: null, error: "RESPOSTA_FORA_DO_CONTRATO" };
  if (res.success && res.data) {
    const proj = projetarPermissoes(res.data);
    if (!proj) return { success: false, data: null, error: "RESPOSTA_SEM_VIGENCIA" };
    return { success: true, data: proj };
  }
  return res;
}
async function setTriggerPermission(userId, triggerId, granted, opts = {}) {
  return _post("set-trigger", { user_id: userId, trigger_id: triggerId, state: granted ? "allow" : "deny", reason: opts.reason }, { operacaoId: opts.operacaoId });
}
async function setRegionPermission(userId, regionId, granted, opts = {}) {
  return _post("set-region", { user_id: userId, region_id: regionId, state: granted ? "allow" : "deny", reason: opts.reason }, { operacaoId: opts.operacaoId });
}
async function bulkSetTriggers(userId, triggerIds, granted) {
  const permissions = {};
  triggerIds.forEach((id) => {
    permissions[id] = granted ? "allow" : "deny";
  });
  return _post("bulk-set-triggers", { user_id: userId, permissions });
}
async function bulkSetRegions(userId, regionIds, granted) {
  const permissions = {};
  regionIds.forEach((id) => {
    permissions[id] = granted ? "allow" : "deny";
  });
  return _post("bulk-set-regions", { user_id: userId, permissions });
}
async function syncInventory() {
  return getInventory();
}
function prazoParaEscrita(exp) {
  if (exp === null || exp === void 0 || exp === "") return null;
  const m = /^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}:\d{2})(?:\.(\d{1,6}))?$/.exec(String(exp).trim());
  if (!m) return "INVALIDO";
  if (m[3] && /[1-9]/.test(m[3].slice(3))) return "INVALIDO";
  return m[3] ? `${m[1]} ${m[2]}.${(m[3] + "000").slice(0, 3)}` : `${m[1]} ${m[2]}`;
}
function planoDeCopia(origem) {
  const itens = [];
  ["trigger", "region"].forEach((tipo) => {
    const det = origem?.detalhes?.[tipo + "s"] || {};
    Object.keys(det).sort().forEach((id) => {
      const d = det[id];
      const exp = prazoParaEscrita(d.expires_at);
      if (d.estado_efetivo === "expirada" || d.vigente !== true) itens.push({ tipo, id, state: String(d.state), expires_at: d.expires_at, acao: "pular", motivo: "expirada na origem" });
      else if (exp === "INVALIDO") itens.push({ tipo, id, state: String(d.state), expires_at: d.expires_at, acao: "pular", motivo: "prazo ileg\xEDvel" });
      else itens.push({ tipo, id, state: String(d.estado_efetivo), expires_at: exp, acao: "copiar" });
    });
  });
  return itens;
}
async function copyPermissions(fromUserId, toUserId, opts = {}) {
  const origem = await getUserPermissions(fromUserId);
  if (!origem.success) return origem;
  const base = (opts.operacaoId || novaOperacao()).slice(0, 36);
  const plano = planoDeCopia(origem.data);
  const itens = [];
  for (let i = 0; i < plano.length; i++) {
    const it = plano[i];
    if (it.acao === "pular") {
      itens.push({ ...it, resultado: "pulado" });
      continue;
    }
    const chave = `${base}-${it.tipo === "trigger" ? "t" : "r"}${i}`;
    const corpo = { user_id: toUserId, state: it.state, reason: opts.reason, expires_at: it.expires_at };
    corpo[it.tipo === "trigger" ? "trigger_id" : "region_id"] = it.id;
    const r = await _post(it.tipo === "trigger" ? "set-trigger" : "set-region", corpo, { operacaoId: chave });
    itens.push({ ...it, operacao_id: chave, resultado: r.success ? "gravado" : "falhou", erro: r.error });
  }
  const falhas = itens.filter((x) => x.resultado === "falhou").length;
  return { success: falhas === 0, data: { itens, copiados: itens.filter((x) => x.resultado === "gravado").length, pulados: itens.filter((x) => x.resultado === "pulado").length, falhas, operacao_base: base }, error: falhas ? "FALHA_NA_COPIA" : null };
}
async function getStats() {
  const users = await getUsers();
  const inventory = await getInventory();
  return { success: true, data: { users: users.data?.length || 0, triggers: inventory.data?.triggers?.length || 0, regions: inventory.data?.regions?.length || 0 } };
}
async function healthCheck() {
  return { success: true, status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
const Api = {
  inheritTrigger,
  inheritRegion,
  novaOperacao,
  previewTrigger,
  projetarPermissoes,
  planoDeCopia,
  prazoParaEscrita,
  getUsers,
  getInventory,
  getUserPermissions,
  setTriggerPermission,
  setRegionPermission,
  bulkSetTriggers,
  bulkSetRegions,
  syncInventory,
  copyPermissions,
  getStats,
  healthCheck,
  injectPorts,
  getPorts,
  VERSION,
  MODULE_ID
};
var client_default = Api;
export {
  Api,
  MODULE_ID,
  VERSION,
  bulkSetRegions,
  bulkSetTriggers,
  copyPermissions,
  client_default as default,
  getInventory,
  getPorts,
  getStats,
  getUserPermissions,
  getUsers,
  healthCheck,
  inheritRegion,
  inheritTrigger,
  injectPorts,
  novaOperacao,
  planoDeCopia,
  prazoParaEscrita,
  previewTrigger,
  projetarPermissoes,
  setRegionPermission,
  setTriggerPermission,
  syncInventory
};
