import { store } from "../state/store.js";
import { exportManager } from "../utils/export-manager.js";
import { toastManager } from "../ui/toast.js";
import * as Telemetry from "../telemetry/tracker.js";
import { log } from "../utils/lifecycle.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:managers:export-controller";
const DEFAULT_COLUMNS = [
  { key: "Id_Organizacao", label: "ID" },
  { key: "Nome_Empresa", label: "Empresa" },
  { key: "Cnpj", label: "CNPJ" },
  { key: "Municipio_Endereco", label: "Cidade" },
  { key: "Uf_Endereco", label: "UF" },
  { key: "Receita_Gerada", label: "Receita" },
  { key: "Status", label: "Status" }
];
async function exportData(format) {
  const clientes = store.get("clientes") || [];
  if (!clientes.length) {
    toastManager.warning("Nenhum dado para exportar");
    return false;
  }
  toastManager.info(`Exportando ${clientes.length} registros...`);
  try {
    await exportManager.export(format, clientes, { filename: `clientes_${(/* @__PURE__ */ new Date()).toISOString().split("T")[0]}`, columns: DEFAULT_COLUMNS });
    toastManager.success("Exporta\xE7\xE3o conclu\xEDda!");
    Telemetry.trackAction("export", { format, count: clientes.length });
    return true;
  } catch (error) {
    log("error", "Export error:", error);
    toastManager.error(`Erro ao exportar: ${error.message}`);
    return false;
  }
}
function healthCheck() {
  const checks = { storeAvailable: !!store, exportManagerAvailable: !!exportManager, toastAvailable: !!toastManager };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, columnsConfigured: DEFAULT_COLUMNS.length, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, columns: DEFAULT_COLUMNS.length, p25Compliant: true };
}
var export_controller_default = { exportData, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  export_controller_default as default,
  exportData,
  healthCheck,
  info
};
