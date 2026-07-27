// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05
// PURPOSE: Panel-05 Constants - Cliente 360º Enterprise Premium AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   PANEL_ID — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//   PANEL_TITLE — exported value
//   PANEL_DESCRIPTION — exported value
//   API_PATH — exported value
//   CSS_PATH — exported value
//   REFRESH_INTERVAL — exported value
//   REQUEST_TIMEOUT — exported value
//   ITEMS_PER_PAGE — exported value
//   STATES — exported value
//   STATUS_CONFIG — exported value
//   RISCO_CONFIG — exported value
//   TIPO_NEGOCIO_CONFIG — exported value
//   UF_LIST — exported value
//   ... and 5 more exports
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

export const PANEL_ID = 'panel-05';
export const MODULE_ID = 'panel-05.core.constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const PANEL_TITLE = 'Clientes 360º';
export const PANEL_DESCRIPTION = 'Gestão estratégica de clientes e relacionamentos';

export const API_PATH = '/api/modules/panels/panel-05/api.php';
export const CSS_PATH = '/components/panels/panel-05/styles/main.css';

export const REFRESH_INTERVAL = 60000;
export const REQUEST_TIMEOUT = 20000;
export const ITEMS_PER_PAGE = 25;

export const STATES = {
    IDLE: 'idle',
    LOADING: 'loading',
    READY: 'ready',
    ERROR: 'error',
    DETAIL: 'detail'
};

export const STATUS_CONFIG = {
    ativo: { label: 'Ativo', color: '#22C55E', bg: 'rgba(34,197,94,0.12)' },
    inativo: { label: 'Inativo', color: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
};

export const RISCO_CONFIG = {
    baixo: { label: 'Baixo', color: '#22C55E', bg: 'rgba(34,197,94,0.12)', icon: 'shieldCheck' },
    medio: { label: 'Médio', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', icon: 'alertTriangle' },
    alto: { label: 'Alto', color: '#EF4444', bg: 'rgba(239,68,68,0.12)', icon: 'alertCircle' },
    critico: { label: 'Crítico', color: '#DC2626', bg: 'rgba(220,38,38,0.15)', icon: 'xCircle' }
};

export const TIPO_NEGOCIO_CONFIG = {
    'Venda': { color: '#3B82F6', icon: 'shoppingCart' },
    'Locação': { color: '#8B5CF6', icon: 'calendar' },
    'Serviço': { color: '#10B981', icon: 'wrench' },
    'POC': { color: '#F59E0B', icon: 'flask' },
    'Digital Signage': { color: '#EC4899', icon: 'monitor' }
};

export const UF_LIST = [
    'AC','AL','AM','AP','BA','CE','DF','ES','GO','MA','MG','MS','MT',
    'PA','PB','PE','PI','PR','RJ','RN','RO','RR','RS','SC','SE','SP','TO'
];

export const PORTE_LIST = [
    'Microempresa (me)',
    'Micro Empresa',
    'Pequena Empresa',
    'Empresa de Pequeno Porte (epp)',
    'Demais',
    'Demais Empresas'
];

export const EXPORT_FORMATS = ['csv', 'excel', 'pdf'];
export const THEME_OPTIONS = ['light', 'dark', 'system'];

export default {
    PANEL_ID, MODULE_ID, VERSION, PANEL_TITLE, PANEL_DESCRIPTION,
    API_PATH, CSS_PATH, REFRESH_INTERVAL, REQUEST_TIMEOUT, ITEMS_PER_PAGE,
    STATES, STATUS_CONFIG, RISCO_CONFIG, TIPO_NEGOCIO_CONFIG, 
    UF_LIST, PORTE_LIST, EXPORT_FORMATS, THEME_OPTIONS
};

export function info() { return { moduleId: 'panels-panel-05-core-constants', version: VERSION || '1.0.0' }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: 'panels-panel-05-core-constants', version: VERSION || '1.0.0', checks: { constantsLoaded: true } }; }
