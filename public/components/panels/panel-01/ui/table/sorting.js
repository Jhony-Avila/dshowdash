const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/sorting";
class SortingManager {
  constructor(options = {}) {
    this.field = options.defaultField || "Data_Requisicao";
    this.order = options.defaultOrder || "DESC";
    this.onSort = options.onSort || (() => {
    });
  }
  toggle(field) {
    if (this.field === field) {
      this.order = this.order === "DESC" ? "ASC" : "DESC";
    } else {
      this.field = field;
      this.order = "DESC";
    }
    this.onSort({ field: this.field, order: this.order });
  }
  set(field, order) {
    this.field = field;
    this.order = order;
  }
  get() {
    return { field: this.field, order: this.order };
  }
  compare(a, b) {
    const aVal = this._getValue(a, this.field);
    const bVal = this._getValue(b, this.field);
    let result = 0;
    if (aVal === null || aVal === void 0) result = 1;
    else if (bVal === null || bVal === void 0) result = -1;
    else if (typeof aVal === "string") {
      result = aVal.localeCompare(bVal, "pt-BR", { numeric: true });
    } else if (aVal instanceof Date || this._isDateField(this.field)) {
      result = new Date(aVal).getTime() - new Date(bVal).getTime();
    } else {
      result = aVal - bVal;
    }
    return this.order === "DESC" ? -result : result;
  }
  sortArray(array) {
    return [...array].sort((a, b) => this.compare(a, b));
  }
  _getValue(obj, field) {
    const fieldMap = {
      "Data_Requisicao": ["data_requisicao", "Data_Requisicao"],
      "Id_Requisicao": ["id", "Id_Requisicao"],
      "Descricao_Requisicao": ["descricao", "Descricao_Requisicao"],
      "Total": ["total", "Total"],
      "Situacao": ["situacao", "Situacao"],
      "Centro_De_Custo": ["centro_custo", "Centro_De_Custo"],
      "Fornecedor": ["fornecedor", "Fornecedor"]
    };
    const keys = fieldMap[field] || [field];
    for (const key of keys) {
      if (obj[key] !== void 0) return obj[key];
    }
    return null;
  }
  _isDateField(field) {
    return ["Data_Requisicao", "Data_Pagamento", "Data_Criacao", "data_requisicao"].includes(field);
  }
  reset() {
    this.field = "Data_Requisicao";
    this.order = "DESC";
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var sorting_default = SortingManager;
export {
  MODULE_ID,
  SortingManager,
  VERSION,
  sorting_default as default,
  healthCheck,
  info
};
