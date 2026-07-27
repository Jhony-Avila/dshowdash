import { apiClient } from "../services/api.js";
import { store } from "../state/store.js";
import * as Toast from "../ui/toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:handlers:edit";
async function saveInlineEdit(ctx, data) {
  try {
    const updateData = {};
    updateData[data.field] = data.newValue;
    await apiClient.updateRequisicao(data.rowId, updateData);
    Toast.success("Salvo!");
    if (ctx.haptic) ctx.haptic.success();
  } catch (error) {
    Toast.error("Erro ao salvar");
    if (ctx.haptic) ctx.haptic.error();
  }
}
async function saveBulkEdit(ctx, data) {
  try {
    await apiClient.updateRequisicao(data.id, data.changes);
    return true;
  } catch (error) {
    throw error;
  }
}
function applyView(ctx, config) {
  if (config.filters) {
    Object.entries(config.filters).forEach((entry) => {
      store.setFilter(entry[0], entry[1]);
    });
  }
  if (config.sort) store.setSort(config.sort.field, config.sort.order);
  if (config.density) ctx.setDensity(config.density);
  ctx.loadRequisicoes();
  Toast.success("View aplicada");
}
async function duplicateItem(ctx, id) {
  if (!ctx.duplicateManager) return;
  const state = store.getState();
  const item = state.requisicoes.find((r) => String(r.id || r.Id_Requisicao) === String(id));
  if (item) {
    try {
      await ctx.duplicateManager.execute(item, apiClient);
      if (ctx.haptic) ctx.haptic.success();
    } catch (error) {
      Toast.error(error.message);
      if (ctx.haptic) ctx.haptic.error();
    }
  }
}
function healthCheck() {
  const checks = { apiClientAvailable: !!apiClient, storeAvailable: !!store };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var edit_default = { saveInlineEdit, saveBulkEdit, applyView, duplicateItem, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  applyView,
  edit_default as default,
  duplicateItem,
  healthCheck,
  info,
  saveBulkEdit,
  saveInlineEdit
};
