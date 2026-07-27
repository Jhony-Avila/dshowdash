// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.registry.definitions.routes-system
// PURPOSE: Router Definitions - System Routes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DOMAINS, LAYOUTS, GUARD_POLICIES from ./constants.js
//
// PROVIDES:
//   systemRoutes — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';
const MODULE_ID = 'router.registry.definitions.routes-system';
const VERSION = '7.2.0-P17WI';
import { DOMAINS, LAYOUTS, GUARD_POLICIES } from './constants.js';
const createStatusRoute = (id: string, title: string, panel: string, options: Record<string, any> = {}) => ({ id: `status-${id}`, name: title.replace(/\s+/g, ''), page: `status-${id}`, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: [] as string[], layout: LAYOUTS.DEFAULT, defaultView: panel, defaultHash: `#/status/${id}`, mountMain: true, domain: options.domain || DOMAINS.DASHBOARD, virtualDefaults: { view: panel, tab: 'overview', section: null as string | null, entity: null as string | null, mode: 'view' }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: options.aliases || [], tags: ['status', id, ...(options.tags || [])] });
export const systemRoutes = Object.freeze({
  '/login': { id: 'login', name: 'Login', page: 'login', title: 'Entrar', public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [] as string[], featureFlags: [] as string[], layout: LAYOUTS.LOGIN_ONLY, defaultView: 'login-modal', defaultHash: '', mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: 'login-modal', tab: null, section: null as string | null, entity: null as string | null, mode: 'view' }, seo: { title: 'DshowDash - Login', description: 'Acesse o painel enterprise da Dshow.' }, aliases: ['/signin', '#/login'], tags: ['auth', 'public', 'system'] },
  '/logout': { id: 'logout', name: 'Logout', page: 'logout', title: 'Logout', public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [] as string[], featureFlags: [] as string[], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: '', mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null as string | null, entity: null as string | null, mode: null }, seo: { title: 'Logout', description: 'Sair do sistema' }, aliases: ['/signout'], tags: ['auth', 'public', 'system'] },
  '/404': { id: 'not-found', name: 'NotFound', page: 'not-found', title: 'Página Não Encontrada', public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [] as string[], featureFlags: [] as string[], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: '', mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null as string | null, entity: null as string | null, mode: null }, seo: { title: '404', description: 'Página não encontrada' }, aliases: ['/not-found'], tags: ['error', 'public', 'system'] },
  '/forbidden': { id: 'forbidden', name: 'Forbidden', page: 'forbidden', title: 'Acesso Negado', public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [] as string[], featureFlags: [] as string[], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: '', mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null as string | null, entity: null as string | null, mode: null }, seo: { title: '403', description: 'Acesso não autorizado' }, aliases: ['/403'], tags: ['error', 'public', 'system'] },
  '/maintenance': { id: 'maintenance', name: 'Maintenance', page: 'maintenance', title: 'Manutenção', public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [] as string[], featureFlags: [] as string[], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: '', mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: 'Manutenção', description: 'Sistema em manutenção' }, aliases: [], tags: ['system', 'public'] },
  '/status/currency-btc': createStatusRoute('currency-btc', 'Bitcoin', 'panel-status-currency-btc', { tags: ['currency', 'crypto', 'btc'] }),
  '/status/currency-usd-brl': createStatusRoute('currency-usd-brl', 'Dólar/Real', 'panel-status-currency-usd-brl', { tags: ['currency', 'usd', 'brl'] }),
  '/status/currency-usd-cny': createStatusRoute('currency-usd-cny', 'Dólar/Yuan', 'panel-status-currency-usd-cny', { tags: ['currency', 'usd', 'cny'] }),
  '/status/email': createStatusRoute('email', 'Email Integration', 'panel-status-email-integration', { domain: DOMAINS.INTEGRACOES, tags: ['email', 'integration'] }),
  '/status/instagram': createStatusRoute('instagram', 'Instagram', 'panel-status-instagram-messenger', { domain: DOMAINS.INTEGRACOES, tags: ['instagram', 'social'] }),
  '/status/weather': createStatusRoute('weather', 'Clima SP', 'panel-status-weather-sp', { tags: ['weather', 'clima'] }),
  '/status/wechat': createStatusRoute('wechat', 'WeChat', 'panel-status-wechat-integration', { domain: DOMAINS.INTEGRACOES, tags: ['wechat', 'social'] }),
  '/status/whatsapp': createStatusRoute('whatsapp', 'WhatsApp', 'panel-status-whatsapp-integration', { domain: DOMAINS.INTEGRACOES, tags: ['whatsapp', 'social'] }),
  '/status/notifications': createStatusRoute('notifications', 'Notificações', 'panel-footer-status', { tags: ['notifications', 'alerts'] }),
  '/status/app': createStatusRoute('app', 'App Status', 'panel-footer-status', { tags: ['app', 'system'] }),
  '/status/errors': createStatusRoute('errors', 'Errors Status', 'panel-footer-status', { tags: ['errors', 'monitoring'] })
});
export { MODULE_ID, VERSION };
export default systemRoutes;
