// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/ui/table/constants
// PURPOSE: Panel-01 Table Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   COLUMNS — exported value
//   SITUACAO_COLORS — exported value
//   GROUP_LABELS — exported value
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
export const MODULE_ID = 'panel-01/ui/table/constants';

export const COLUMNS = [
  { id: 'select', label: '', sortable: false, visible: true, width: 40 },
  { id: 'id', label: 'ID', sortable: true, visible: true, width: 60, field: 'Id_Requisicao' },
  { id: 'descricao', label: 'Descrição', sortable: true, visible: true, width: null, field: 'Descricao_Requisicao' },
  { id: 'situacao', label: 'Situação', sortable: true, visible: true, width: 180, field: 'Situacao' },
  { id: 'centro', label: 'Centro Custo', sortable: true, visible: true, width: 140, field: 'Centro_De_Custo' },
  { id: 'fornecedor', label: 'Fornecedor', sortable: true, visible: true, width: 160, field: 'Fornecedor' },
  { id: 'total', label: 'Total', sortable: true, visible: true, width: 100, align: 'right', field: 'Total' },
  { id: 'data', label: 'Data', sortable: true, visible: true, width: 100, field: 'Data_Requisicao' },
  { id: 'actions', label: '', sortable: false, visible: true, width: 80 }
];

export const SITUACAO_COLORS = {
  1: '#F59E0B',
  2: '#3B82F6',
  3: '#10B981',
  4: '#EF4444',
  5: '#6B7280'
};

export const GROUP_LABELS = {
  'situacao': { 1: 'Pendente Lançamento', 2: 'Aguardando Pagamento', 3: 'Pago', 4: 'Cancelado', 5: 'Outros' },
  'centro': {}
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default { COLUMNS, SITUACAO_COLORS, GROUP_LABELS };
