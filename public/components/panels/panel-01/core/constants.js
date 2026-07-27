const PANEL_ID = "panel-01";
const MODULE_ID = "panel-01.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CSS_PATH = "/components/panels/panel-01/styles/index.css";
const API_PATH = "/api/modules/panels/panel-01/api.php";
const REFRESH_INTERVAL = 3e4;
const REQUEST_TIMEOUT = 3e4;
const ITEMS_PER_PAGE = 25;
const VIRTUAL_THRESHOLD = 100;
const STATES = Object.freeze({
  IDLE: "IDLE",
  MOUNTING: "MOUNTING",
  MOUNTED: "MOUNTED",
  LOADING: "LOADING",
  READY: "READY",
  ERROR: "ERROR",
  DEGRADED: "DEGRADED",
  UNMOUNTING: "UNMOUNTING",
  DESTROYED: "DESTROYED"
});
const SITUACOES = Object.freeze({
  PENDENTE_LANCAMENTO: { id: 1304, nome: "Pendente de Lancamento", cor: "#F59E0B", icon: "clock" },
  PENDENTE_PAGAMENTO: { id: 1305, nome: "Pendente de Pagamento", cor: "#3B82F6", icon: "creditCard" },
  PAGO: { id: 1306, nome: "Pago", cor: "#10B981", icon: "checkCircle" },
  CANCELADO: { id: 1308, nome: "Cancelado", cor: "#EF4444", icon: "xCircle" }
});
const EDITABLE_FIELDS = ["descricao", "observacao", "centro_custo"];
const STICKY_LEFT = ["select", "id"];
const STICKY_RIGHT = ["actions"];
const getSituacaoById = (id) => Object.values(SITUACOES).find((s) => s.id === id) || { nome: "Desconhecido", cor: "#6B7280", icon: "helpCircle" };
var constants_default = {
  PANEL_ID,
  MODULE_ID,
  VERSION,
  CSS_PATH,
  API_PATH,
  REFRESH_INTERVAL,
  REQUEST_TIMEOUT,
  ITEMS_PER_PAGE,
  VIRTUAL_THRESHOLD,
  STATES,
  SITUACOES,
  EDITABLE_FIELDS,
  STICKY_LEFT,
  STICKY_RIGHT,
  getSituacaoById
};
function info() {
  return { moduleId: "panels-panel-01-core-constants", version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-01-core-constants", version: VERSION, checks: { constantsLoaded: true } };
}
export {
  API_PATH,
  CSS_PATH,
  EDITABLE_FIELDS,
  ITEMS_PER_PAGE,
  MODULE_ID,
  PANEL_ID,
  REFRESH_INTERVAL,
  REQUEST_TIMEOUT,
  SITUACOES,
  STATES,
  STICKY_LEFT,
  STICKY_RIGHT,
  VERSION,
  VIRTUAL_THRESHOLD,
  constants_default as default,
  getSituacaoById,
  healthCheck,
  info
};
