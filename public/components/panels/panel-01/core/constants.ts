// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01
// PURPOSE: Panel-01 Constants - Gestao de Requisicoes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   CSS_PATH — exported value
//   API_PATH — exported value
//   REFRESH_INTERVAL — exported value
//   REQUEST_TIMEOUT — exported value
//   ITEMS_PER_PAGE — exported value
//   VIRTUAL_THRESHOLD — exported value
//   STATES — exported value
//   SITUACOES — exported value
//   EDITABLE_FIELDS — exported value
//   STICKY_LEFT — exported value
//   STICKY_RIGHT — exported value
//   getSituacaoById — exported value
//   ... and 2 more exports
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

export const PANEL_ID = 'panel-01';
export const MODULE_ID = 'panel-01.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const CSS_PATH = '/components/panels/panel-01/styles/index.css';
export const API_PATH = '/api/modules/panels/panel-01/api.php';
export const REFRESH_INTERVAL = 30000;
export const REQUEST_TIMEOUT = 30000;
export const ITEMS_PER_PAGE = 25;
export const VIRTUAL_THRESHOLD = 100;

export const STATES = Object.freeze({
  IDLE: 'IDLE',
  MOUNTING: 'MOUNTING',
  MOUNTED: 'MOUNTED',
  LOADING: 'LOADING',
  READY: 'READY',
  ERROR: 'ERROR',
  DEGRADED: 'DEGRADED',
  UNMOUNTING: 'UNMOUNTING',
  DESTROYED: 'DESTROYED'
});

export const SITUACOES = Object.freeze({
  PENDENTE_LANCAMENTO: { id: 1304, nome: 'Pendente de Lancamento', cor: '#F59E0B', icon: 'clock' },
  PENDENTE_PAGAMENTO: { id: 1305, nome: 'Pendente de Pagamento', cor: '#3B82F6', icon: 'creditCard' },
  PAGO: { id: 1306, nome: 'Pago', cor: '#10B981', icon: 'checkCircle' },
  CANCELADO: { id: 1308, nome: 'Cancelado', cor: '#EF4444', icon: 'xCircle' }
});

export const EDITABLE_FIELDS = ['descricao', 'observacao', 'centro_custo'];
export const STICKY_LEFT = ['select', 'id'];
export const STICKY_RIGHT = ['actions'];

export const getSituacaoById = (id: number) => Object.values(SITUACOES).find(s => s.id === id) || { nome: 'Desconhecido', cor: '#6B7280', icon: 'helpCircle' };

export default {
  PANEL_ID, MODULE_ID, VERSION, CSS_PATH, API_PATH,
  REFRESH_INTERVAL, REQUEST_TIMEOUT, ITEMS_PER_PAGE, VIRTUAL_THRESHOLD,
  STATES, SITUACOES, EDITABLE_FIELDS, STICKY_LEFT, STICKY_RIGHT, getSituacaoById
};

export function info() { return { moduleId: 'panels-panel-01-core-constants', version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-01-core-constants', version: VERSION, checks: { constantsLoaded: true } }; }
