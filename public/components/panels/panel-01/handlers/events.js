import { store } from "../state/store.js";
import * as Toast from "../ui/toast.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01:handlers:events";
function handleSort(ctx, field, isShiftKey) {
  if (!field) {
    ctx.loadAllData();
    return;
  }
  if (ctx.multiSort && isShiftKey) {
    ctx.multiSort.addSort(field, "DESC", true);
  } else {
    const state = store.getState();
    const newOrder = state.sort.field === field && state.sort.order === "DESC" ? "ASC" : "DESC";
    store.setSort(field, newOrder);
    ctx.loadRequisicoes();
  }
}
function handleKeyboardAction(ctx, action) {
  if (action === "refresh") {
    ctx.loadAllData();
  } else if (action === "export") {
    ctx.exportCSV();
  } else if (action === "escape") {
    if (ctx.drawer) ctx.drawer.close();
    if (ctx.selection) ctx.selection.deselectAll();
  }
}
function handleContextAction(ctx, action, item) {
  const ctxFns = ctx;
  if (action === "view") {
    ctxFns.loadDetail(item.id);
  } else if (action === "copy-id") {
    if (navigator.clipboard) navigator.clipboard.writeText(String(item.id));
    Toast.success("ID copiado!");
  } else if (action === "export-item") {
    ctxFns.exportSinglePDF(item.id);
  } else if (action === "print-item") {
    ctxFns.printSingle(item.id);
  } else if (action === "duplicate") {
    ctxFns.duplicateItem(item.id);
  } else if (action === "add-tag") {
    ctxFns.showTagDialog(item.id);
  }
}
function handleDrawerAction(ctx, action, data) {
  const requisicao = data.requisicao;
  const id = requisicao ? requisicao.Id_Requisicao : data.id;
  const ctxFns = ctx;
  if (action === "print") {
    ctxFns.printSingle(id);
  } else if (action === "export-pdf") {
    ctxFns.exportSinglePDF(id);
  } else if (action === "preview") {
    if (ctx.preview && data.url) ctx.preview.show(data.url, data.filename);
  } else if (action === "duplicate") {
    ctxFns.duplicateItem(id);
  }
}
function handleBulkAction(ctx, action) {
  const selected = ctx.selection ? ctx.selection.getSelected() : [];
  if (selected.length === 0) return;
  if (ctx.haptic) ctx.haptic.medium();
  if (action === "export") {
    Toast.info(`Exportando ${selected.length} itens...`);
  } else if (action === "cancel") {
    Toast.warning("Cancelamento em lote nao implementado");
  } else if (action === "edit") {
    ctx.showBulkEditDialog();
  }
}
function handleWebSocketMessage(ctx, data) {
  if (data.type === "update") {
    ctx.loadAllData();
    Toast.info("Dados atualizados em tempo real");
  } else if (data.type === "notification") {
    Toast.info(data.message);
  }
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
var events_default = { handleSort, handleKeyboardAction, handleContextAction, handleDrawerAction, handleBulkAction, handleWebSocketMessage, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  handleBulkAction,
  handleContextAction,
  handleDrawerAction,
  handleKeyboardAction,
  handleSort,
  handleWebSocketMessage,
  healthCheck,
  info
};
