import { store } from "../state/store.js";
import * as Toast from "../ui/toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:handlers:dialogs";
function showBulkEditDialog(ctx) {
  const selected = ctx.selection ? ctx.selection.getSelected() : [];
  if (selected.length === 0) {
    Toast.warning("Selecione itens primeiro");
    return;
  }
  if (ctx.bulkEdit) ctx.bulkEdit.setSelection(selected);
  Toast.info(`Bulk edit: ${selected.length} itens selecionados`);
}
function showImportDialog(ctx) {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".csv,.xlsx,.xls";
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file && ctx.importManager) ctx.importManager.importFile(file);
  };
  input.click();
}
function showSaveViewDialog(ctx) {
  const name = prompt("Nome da view:");
  if (!name) return;
  const state = store.getState();
  const config = { filters: state.filters, sort: state.sort, density: ctx.density };
  if (ctx.savedViews) ctx.savedViews.create(name, config);
  Toast.success(`View salva: ${name}`);
}
function showTagDialog(ctx, itemId) {
  const tagName = prompt("Nome da tag:");
  if (!tagName || !ctx.tags) return;
  const tags = ctx.tags;
  const tag = tags.createTag(tagName);
  tags.addTagToItem(itemId, tag.id);
  Toast.success("Tag adicionada");
}
function healthCheck() {
  const checks = { storeAvailable: !!store, toastAvailable: !!Toast };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, p25Compliant: true };
}
var dialogs_default = { showBulkEditDialog, showImportDialog, showSaveViewDialog, showTagDialog, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  dialogs_default as default,
  healthCheck,
  info,
  showBulkEditDialog,
  showImportDialog,
  showSaveViewDialog,
  showTagDialog
};
