// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (7.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: router.registry.definitions.routes-integrations
// PURPOSE: Router Definitions - Integration Routes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DOMAINS, LAYOUTS, GUARD_POLICIES from ./constants.js
//
// PROVIDES:
//   integrationRoutes — exported value
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
const MODULE_ID = 'router.registry.definitions.routes-integrations';
const VERSION = '7.2.0-P17WI';
import { DOMAINS, LAYOUTS, GUARD_POLICIES } from './constants.js';
const createIntegrationRoute = (id: string, title: string, panel: string, options: Record<string, any> = {}) => ({ id, name: title.replace(/\s+/g, ''), page: id, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: [] as string[], layout: LAYOUTS.DEFAULT, defaultView: panel, defaultHash: `#/${id}`, mountMain: true, domain: DOMAINS.INTEGRACOES, virtualDefaults: { view: panel, tab: (options.tab || 'overview') as string, section: null as string | null, entity: (options.entity || null) as string | null, mode: 'view' }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: options.aliases || [], tags: ['integracoes', ...(options.tags || [])] });
export const integrationRoutes = Object.freeze({
  '/automacoes': createIntegrationRoute('automacoes', 'Automações', 'panel-07', { permissions: ['cap:automacoes:view'], entity: 'automacao', tab: 'list', tags: ['automacoes'] }),
  '/bling': createIntegrationRoute('bling', 'Bling ERP', 'panel-08', { permissions: ['cap:bling:view'], tags: ['bling', 'erp'] }),
  '/google-ads': createIntegrationRoute('google-ads', 'Google Ads', 'panel-15', { permissions: ['cap:google-ads:view'], tags: ['google-ads', 'marketing'] }),
  '/google-drive': createIntegrationRoute('google-drive', 'Google Drive', 'panel-16', { permissions: ['cap:google-drive:view'], entity: 'file', tab: 'files', tags: ['google-drive', 'storage'] }),
  '/instagram': createIntegrationRoute('instagram', 'Instagram', 'panel-18', { permissions: ['cap:instagram:view'], tab: 'feed', tags: ['instagram', 'social'] }),
  '/pipedrive': createIntegrationRoute('pipedrive', 'Pipedrive CRM', 'panel-12', { permissions: ['cap:pipedrive:view'], entity: 'deal', tab: 'deals', tags: ['pipedrive', 'crm'] }),
  '/integrations/adwords': createIntegrationRoute('integration-adwords', 'Google Ads', 'panel-integration-adwords', { tags: ['adwords', 'google', 'marketing'] }),
  '/integrations/alfinete': createIntegrationRoute('integration-alfinete', 'Alfinete', 'panel-integration-alfinete', { tags: ['alfinete'] }),
  '/integrations/asaas': createIntegrationRoute('integration-asaas', 'Asaas', 'panel-integration-asaas', { tags: ['asaas', 'payments'] }),
  '/integrations/bling': createIntegrationRoute('integration-bling', 'Bling ERP', 'panel-integration-bling', { tags: ['bling', 'erp'] }),
  '/integrations/calendar': createIntegrationRoute('integration-calendar', 'Calendário', 'panel-integration-calendar', { tags: ['calendar', 'google'] }),
  '/integrations/chatgpt': createIntegrationRoute('integration-chatgpt', 'ChatGPT', 'panel-integration-chatgpt', { tags: ['chatgpt', 'ai'] }),
  '/integrations/google-drive': createIntegrationRoute('integration-google-drive', 'Google Drive', 'panel-integration-google-drive', { tags: ['google-drive', 'storage'] }),
  '/integrations/loja-integrada': createIntegrationRoute('integration-loja-integrada', 'Loja Integrada', 'panel-integration-loja-integrada', { tags: ['loja-integrada', 'ecommerce'] }),
  '/integrations/mercado-livre': createIntegrationRoute('integration-mercado-livre', 'Mercado Livre', 'panel-integration-mercado-livre', { tags: ['mercado-livre', 'marketplace'] }),
  '/integrations/pipedrive': createIntegrationRoute('integration-pipedrive', 'Pipedrive CRM', 'panel-integration-pipedrive', { tags: ['pipedrive', 'crm'] })
});
export { MODULE_ID, VERSION };
export default integrationRoutes;
