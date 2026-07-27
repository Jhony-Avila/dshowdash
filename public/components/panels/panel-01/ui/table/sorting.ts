// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/sorting
// PURPOSE: Panel-01 Table Sorting
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
export const MODULE_ID = 'panel-01/ui/table/sorting';

export class SortingManager {
  [key: string]: any;
  constructor(options: Record<string, unknown> = {}) {
    this.field = options.defaultField || 'Data_Requisicao';
    this.order = options.defaultOrder || 'DESC';
    this.onSort = options.onSort || (() => {});
  }

  toggle(field: string) {
    if (this.field === field) {
      this.order = this.order === 'DESC' ? 'ASC' : 'DESC';
    } else {
      this.field = field;
      this.order = 'DESC';
    }
    this.onSort({ field: this.field, order: this.order });
  }

  set(field: string, order: string) {
    this.field = field;
    this.order = order;
  }

  get() {
    return { field: this.field, order: this.order };
  }

  compare(a: Record<string, unknown>, b: Record<string, unknown>) {
    const aVal = this._getValue(a, this.field);
    const bVal = this._getValue(b, this.field);
    
    let result = 0;
    
    if (aVal === null || aVal === undefined) result = 1;
    else if (bVal === null || bVal === undefined) result = -1;
    else if (typeof aVal === 'string') {
      result = aVal.localeCompare(bVal as string, 'pt-BR', { numeric: true });
    } else if (aVal instanceof Date || this._isDateField(this.field)) {
      result = (new Date(aVal as string | number | Date)).getTime() - (new Date(bVal as string | number | Date)).getTime();
    } else {
      result = (aVal as number) - (bVal as number);
    }
    
    return this.order === 'DESC' ? -result : result;
  }

  sortArray(array: Record<string, unknown>[]) {
    return [...array].sort((a, b) => this.compare(a, b));
  }

  _getValue(obj: Record<string, unknown>, field: string) {
    const fieldMap: Record<string, string[]> = {
      'Data_Requisicao': ['data_requisicao', 'Data_Requisicao'],
      'Id_Requisicao': ['id', 'Id_Requisicao'],
      'Descricao_Requisicao': ['descricao', 'Descricao_Requisicao'],
      'Total': ['total', 'Total'],
      'Situacao': ['situacao', 'Situacao'],
      'Centro_De_Custo': ['centro_custo', 'Centro_De_Custo'],
      'Fornecedor': ['fornecedor', 'Fornecedor']
    };

    const keys = fieldMap[field] || [field];
    for (const key of keys) {
      if (obj[key] !== undefined) return obj[key];
    }
    return null;
  }

  _isDateField(field: string) {
    return ['Data_Requisicao', 'Data_Pagamento', 'Data_Criacao', 'data_requisicao'].includes(field);
  }

  reset() {
    this.field = 'Data_Requisicao';
    this.order = 'DESC';
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default SortingManager;
