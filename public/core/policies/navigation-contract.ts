// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.policies.navigation-contract
// PURPOSE: Contrato formal de navegação do DshowDash
// ───────────────────────────────────────────────────────────────
// @contract NAVIGATION_PIPELINE - Define pipeline único de navegação
// @contract HARD_NAV_EXCEPTIONS - Exceções autorizadas para hard nav
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (standalone contract)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   NAVIGATION_PIPELINE — pipeline de navegação
//   NAVIGATION_RULES — regras formais
//   HARD_NAV_EXCEPTIONS — exceções autorizadas
//   DEPRECATED_EVENTS — eventos deprecados
//   isHardNavAllowed(componentPath) — verifica se hard nav é permitido
//   getHardNavException(componentPath) — obtém exceção
//   healthCheck() — status de saúde
//   info() — informações do módulo
//
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.4.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.policies.navigation-contract';

export const NAVIGATION_PIPELINE = Object.freeze({ description: 'Pipeline único de navegação do DshowDash', steps: [ { order: 1, component: 'UI Component', action: 'emit ui:action', output: '{ actionId, meta }' }, { order: 2, component: 'EventBusGlobal', action: 'route event', output: 'ui:action payload' }, { order: 3, component: 'ActionHub', action: 'getBinding + dispatch', output: '{ effect, params }' }, { order: 4, component: 'ActionExecutor', action: 'executeEffect', output: 'NAVIGATE + route' }, { order: 5, component: 'RouterAdapter', action: 'navigate', output: 'route change' }, { order: 6, component: 'ManifestController', action: 'resolveRoute', output: 'panelId' }, { order: 7, component: 'PanelLoader', action: 'mount', output: 'panel rendered' } ] });

export const NAVIGATION_RULES = Object.freeze({ RULE_NAV_001: { id: 'UI_NO_NAVIGATE', description: 'Componentes UI NUNCA navegam diretamente', severity: 'CRITICAL', enforcement: 'MANDATORY' }, RULE_NAV_002: { id: 'SINGLE_OWNER', description: 'Apenas Main (ActionHub + RouterAdapter) pode navegar', severity: 'CRITICAL', enforcement: 'MANDATORY' }, RULE_NAV_003: { id: 'UI_ACTION_ONLY', description: 'Navegação inicia apenas via ui:action', severity: 'CRITICAL', enforcement: 'MANDATORY' }, RULE_NAV_004: { id: 'NO_ROUTER_GLOBAL_UI', description: 'UI não pode chamar RouterGlobal.navigate', severity: 'CRITICAL', enforcement: 'MANDATORY' }, RULE_NAV_005: { id: 'NO_LOCATION_UI', description: 'UI não pode alterar window.location.*', severity: 'CRITICAL', enforcement: 'MANDATORY' }, RULE_NAV_006: { id: 'HARD_NAV_CONTRACT', description: 'Hard navigation requer contrato explícito', severity: 'HIGH', enforcement: 'MANDATORY' } });

export const HARD_NAV_EXCEPTIONS = Object.freeze({ description: 'Componentes autorizados a usar hard navigation (window.location.*)', policy: 'Devem emitir ui:hard-nav ANTES de navegar para rastreabilidade', components: [ { path: 'pages/login', reason: 'Redirect pós-autenticação', allowed: ['window.location.hash'] }, { path: 'pages/logout', reason: 'Redirect pós-logout', allowed: ['RouterGlobal.navigate'] }, { path: 'pages/maintenance', reason: 'Fallback emergência', allowed: ['window.location.href'] }, { path: 'pages/forbidden', reason: '403 fallback', allowed: ['window.location.href'] }, { path: 'pages/404', reason: '404 fallback', allowed: ['window.location.href'] }, { path: 'login-modal', reason: 'Fallback sem Router', allowed: ['RouterGlobal.navigate'] }, { path: 'header/user-menu', reason: 'Logout redirect', allowed: ['window.location.href'] }, { path: 'nav-rail/core/router-bridge.js', reason: 'Código DESATIVADO via flag', allowed: ['RouterGlobal.navigate', 'window.location.hash'] }, { path: 'pages/bling', reason: 'Página legada', allowed: ['RouterGlobal.navigate'] }, { path: 'pages/geral', reason: 'Página legada', allowed: ['RouterGlobal.navigate'] } ] });

export const DEPRECATED_EVENTS = Object.freeze({ 'navrail:open-panel': { status: 'DEPRECATED', replacement: 'ui:action', removeBy: 'v3.0.0' } });

export const isHardNavAllowed = (componentPath: string) => { for (const comp of HARD_NAV_EXCEPTIONS.components) { if (componentPath.indexOf(comp.path) !== -1) return true; } return false; };
export const getHardNavException = (componentPath: string) => { for (const comp of HARD_NAV_EXCEPTIONS.components) { if (componentPath.indexOf(comp.path) !== -1) return comp; } return null; };

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, rulesCount: Object.keys(NAVIGATION_RULES).length, exceptionsCount: HARD_NAV_EXCEPTIONS.components.length });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { pipelineReady: !!NAVIGATION_PIPELINE, rulesReady: Object.keys(NAVIGATION_RULES).length > 0 } });

export const NavigationContract = Object.freeze({ VERSION, MODULE_ID, NAVIGATION_PIPELINE, NAVIGATION_RULES, HARD_NAV_EXCEPTIONS, DEPRECATED_EVENTS, isHardNavAllowed, getHardNavException, info, healthCheck });

export default NavigationContract;
