// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/grouping
// PURPOSE: Panel-01 Table Grouping
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/ui/table/grouping';

export class GroupingManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.groupBy = options.defaultGroup || null;
    this.expanded = new Set();
    this.onGroupChange = options.onGroupChange || (() => {});
  }

  setGroupBy(field: string | null) {
    this.groupBy = field;
    this.expanded.clear();
    this.onGroupChange(field);
  }

  clearGrouping() {
    this.groupBy = null;
    this.expanded.clear();
    this.onGroupChange(null);
  }

  toggleGroup(groupKey: unknown) {
    if (this.expanded.has(groupKey)) {
      this.expanded.delete(groupKey);
    } else {
      this.expanded.add(groupKey);
    }
  }

  isExpanded(groupKey: unknown) {
    return this.expanded.has(groupKey);
  }

  expandAll(groupKeys: unknown[]) {
    groupKeys.forEach((k: unknown) => this.expanded.add(k));
  }

  collapseAll() {
    this.expanded.clear();
  }

  groupItems(items: Record<string, unknown>[]) {
    if (!this.groupBy || !items?.length) {
      return [{ key: null, label: null, items }];
    }

    const groups = new Map();
    
    items.forEach((item: Record<string, unknown>) => {
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
      return String(a.label).localeCompare(String(b.label), 'pt-BR');
    });
  }

  _getGroupKey(item: Record<string, unknown>) {
    switch(this.groupBy) {
      case 'situacao': return item.id_situacao || item.Id_Situacao;
      case 'centro': return item.centro_custo || item.Centro_De_Custo;
      case 'fornecedor': return item.fornecedor || item.Fornecedor;
      case 'mes': return this._getMonthKey((item.data_requisicao || item.Data_Requisicao) as string | null | undefined);
      default: return item[this.groupBy];
    }
  }

  _getGroupLabel(key: unknown) {
    if (key === null || key === undefined) return 'Sem categoria';

    if (this.groupBy === 'situacao') {
      const labels: Record<string, string> = { '1304': 'Pendente Lançamento', '1305': 'Pendente Pagamento', '1306': 'Pago', '1308': 'Cancelado' };
      return labels[String(key)] || String(key);
    }
    
    if (this.groupBy === 'mes' && typeof key === 'string') {
      const [year, month] = key.split('-');
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
      return `${months[parseInt(month) - 1]} ${year}`;
    }
    
    return String(key);
  }

  _getMonthKey(dateStr: string | null | undefined) {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  }

  get() {
    return this.groupBy;
  }

  reset() {
    this.groupBy = null;
    this.expanded.clear();
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default GroupingManager;
