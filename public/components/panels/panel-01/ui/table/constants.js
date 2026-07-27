const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/constants";
const COLUMNS = [
  { id: "select", label: "", sortable: false, visible: true, width: 40 },
  { id: "id", label: "ID", sortable: true, visible: true, width: 60, field: "Id_Requisicao" },
  { id: "descricao", label: "Descri\xE7\xE3o", sortable: true, visible: true, width: null, field: "Descricao_Requisicao" },
  { id: "situacao", label: "Situa\xE7\xE3o", sortable: true, visible: true, width: 180, field: "Situacao" },
  { id: "centro", label: "Centro Custo", sortable: true, visible: true, width: 140, field: "Centro_De_Custo" },
  { id: "fornecedor", label: "Fornecedor", sortable: true, visible: true, width: 160, field: "Fornecedor" },
  { id: "total", label: "Total", sortable: true, visible: true, width: 100, align: "right", field: "Total" },
  { id: "data", label: "Data", sortable: true, visible: true, width: 100, field: "Data_Requisicao" },
  { id: "actions", label: "", sortable: false, visible: true, width: 80 }
];
const SITUACAO_COLORS = {
  1: "#F59E0B",
  2: "#3B82F6",
  3: "#10B981",
  4: "#EF4444",
  5: "#6B7280"
};
const GROUP_LABELS = {
  "situacao": { 1: "Pendente Lan\xE7amento", 2: "Aguardando Pagamento", 3: "Pago", 4: "Cancelado", 5: "Outros" },
  "centro": {}
};
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var constants_default = { COLUMNS, SITUACAO_COLORS, GROUP_LABELS };
export {
  COLUMNS,
  GROUP_LABELS,
  MODULE_ID,
  SITUACAO_COLORS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
