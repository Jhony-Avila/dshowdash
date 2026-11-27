import { PERMISSIONS_EVENTS } from "/core/runtime/events/catalog/permissions.events.js";
import { Api } from "../api/client.js";
import { Telemetry } from "../telemetry/tracker.js";
import { emit, showToast } from "./ports.js";
import { alterarTrigger, mensagemDoResultado } from "./alteracao-servidor.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "uarps-admin-controller:toggle-operations";
function toggleTrigger(store, triggerId) {
  const userId = store.getSelectedUserId();
  if (!userId || !triggerId) return Promise.resolve();
  const perms = store.getUserPermissions(userId);
  const hasPermission = perms.triggers.indexOf(triggerId) !== -1;
  const acao = hasPermission ? "negar" : "permitir";
  Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "trigger:alterar:start", userId, triggerId, acao });
  return alterarTrigger(store, { userId, triggerId, acao }).then((r) => {
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "trigger:alterar:" + r.etapa, userId, triggerId, acao, operacaoId: r.operacaoId, ok: r.ok });
    if (r.gravado) emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: "trigger", triggerId, acao, releitura: r.releitura, operacaoId: r.operacaoId }, MODULE_ID);
    showToast(r.ok ? "success" : r.etapa === "reler" || r.etapa === "pendente" ? "warning" : "error", r.ok ? "Permiss\xE3o gravada" : r.etapa === "reler" ? "Gravado sem releitura" : r.etapa === "pendente" ? "Confirma\xE7\xE3o pendente" : "N\xE3o gravado", mensagemDoResultado(r));
    return r;
  });
}
function toggleRegion(store, regionId) {
  const userId = store.getSelectedUserId();
  if (!userId || !regionId) return Promise.resolve();
  const perms = store.getUserPermissions(userId);
  const hasPermission = perms.regions.indexOf(regionId) !== -1;
  const action = hasPermission ? "revoke" : "grant";
  Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "region:toggle:start", userId, regionId, toggleAction: action });
  store.toggleRegionPermission(userId, regionId);
  return Api.setRegionPermission(userId, regionId, !hasPermission).then((res) => {
    if (!res.success) {
      store.toggleRegionPermission(userId, regionId);
      throw new Error(res.error || "Falha ao atualizar permiss\xE3o");
    }
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "region:toggle:success", userId, regionId, toggleAction: action });
    emit(PERMISSIONS_EVENTS.CHANGED, { userId, type: "region", regionId, granted: !hasPermission }, MODULE_ID);
  }).catch((error) => {
    Telemetry.track(PERMISSIONS_EVENTS.CHANGED, { action: "region:toggle:error", userId, regionId, error: error.message });
    showToast("error", "Erro", error.message);
  });
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { apiAvailable: typeof Api !== "undefined", telemetryAvailable: typeof Telemetry !== "undefined" }, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var toggle_operations_default = { toggleTrigger, toggleRegion, healthCheck, info };
export {
  MODULE_ID,
  VERSION,
  toggle_operations_default as default,
  healthCheck,
  info,
  toggleRegion,
  toggleTrigger
};
