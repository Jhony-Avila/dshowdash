const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-01/ui/table/grouping";
class GroupingManager {
  constructor(options = {}) {
    this.groupBy = options.defaultGroup || null;
    this.expanded = /* @__PURE__ */ new Set();
    this.onGroupChange = options.onGroupChange || (() => {
    });
  }
  setGroupBy(field) {
    this.groupBy = field;
    this.expanded.clear();
    this.onGroupChange(field);
  }
  clearGrouping() {
    this.groupBy = null;
    this.expanded.clear();
    this.onGroupChange(null);
  }
  toggleGroup(groupKey) {
    if (this.expanded.has(groupKey)) {
      this.expanded.delete(groupKey);
    } else {
      this.expanded.add(groupKey);
    }
  }
  isExpanded(groupKey) {
    return this.expanded.has(groupKey);
  }
  expandAll(groupKeys) {
    groupKeys.forEach((k) => this.expanded.add(k));
  }
  collapseAll() {
    this.expanded.clear();
  }
  groupItems(items) {
    if (!this.groupBy || !items?.length) {
      return [{ key: null, label: null, items }];
    }
    const groups = /* @__PURE__ */ new Map();
    items.forEach((item) => {
      const key = this._getGroupKey(item);
      if (!groups.has(key)) {
        groups.set(key, {
          key,
          label: this._getGroupLabel(key),
          items: [],
          total: 0,
          count: 0
        });
      }
      const group = groups.get(key);
      group.items.push(item);
      group.count++;
      group.total += parseFloat(String(item.total || item.Total || 0));
    });
    return Array.from(groups.values()).sort((a, b) => {
      if (a.key === null) return 1;
      if (b.key === null) return -1;
      return String(a.label).localeCompare(String(b.label), "pt-BR");
    });
  }
  _getGroupKey(item) {
    switch (this.groupBy) {
      case "situacao":
        return item.id_situacao || item.Id_Situacao;
      case "centro":
        return item.centro_custo || item.Centro_De_Custo;
      case "fornecedor":
        return item.fornecedor || item.Fornecedor;
      case "mes":
        return this._getMonthKey(item.data_requisicao || item.Data_Requisicao);
      default:
        return item[this.groupBy];
    }
  }
  _getGroupLabel(key) {
    if (key === null || key === void 0) return "Sem categoria";
    if (this.groupBy === "situacao") {
      const labels = { "1304": "Pendente Lan\xE7amento", "1305": "Pendente Pagamento", "1306": "Pago", "1308": "Cancelado" };
      return labels[String(key)] || String(key);
    }
    if (this.groupBy === "mes" && typeof key === "string") {
      const [year, month] = key.split("-");
      const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return `${months[parseInt(month) - 1]} ${year}`;
    }
    return String(key);
  }
  _getMonthKey(dateStr) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
  }
  get() {
    return this.groupBy;
  }
  reset() {
    this.groupBy = null;
    this.expanded.clear();
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var grouping_default = GroupingManager;
export {
  GroupingManager,
  MODULE_ID,
  VERSION,
  grouping_default as default,
  healthCheck,
  info
};
