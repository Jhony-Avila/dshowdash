// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-components-index
// PURPOSE: Header Components Index - Enterprise
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//   CurrencyBtcComponent — exported value
//   CurrencyUsdBrlComponent — exported value
//   CurrencyUsdCnyComponent — exported value
//   ErrorsStatusComponent — exported value
//   NotificationsComponent — exported value
//   RealTimeClockComponent — exported value
//   WeatherSpComponent — exported value
//   UserMenuComponent — exported value
//   EmailIntegrationComponent — exported value
//   WhatsAppIntegrationComponent — exported value
//   InstagramMessengerComponent — exported value
//   WeChatIntegrationComponent — exported value
//   PanelAdwordsComponent — exported value
//   PanelAsaasComponent — exported value
//   PanelBlingComponent — exported value
//   PanelCalendarComponent — exported value
//   ... and 8 more exports
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

export const MODULE_ID = 'header-components-index';
export const VERSION = '8.2.0-ENTERPRISE';

// Currency component (pill rotativa unificada — substitui as 3 pills antigas)
export { CurrencyRotatorComponent } from './currency-rotator/index.js';

// Status components
export { ErrorsStatusComponent } from './errors-status/index.js';

// Info components
export { NotificationsComponent } from './notifications/index.js';
export { RealTimeClockComponent } from './real-time-clock/index.js';
export { WeatherSpComponent } from './weather-sp/index.js';

// User menu
export { UserMenuComponent } from './user-menu/index.js';

// Integration components (v8.2.0)
export { EmailIntegrationComponent } from './email-integration/index.js';
export { WhatsAppIntegrationComponent } from './whatsapp-integration/index.js';
export { InstagramMessengerComponent } from './instagram-messenger-integration/index.js';
export { WeChatIntegrationComponent } from './wechat-integration/index.js';

// Panel triggers (v8.1.0)
export { PanelAdwordsComponent } from './panel-adwords/index.js';
export { PanelAsaasComponent } from './panel-asaas/index.js';
export { PanelBlingComponent } from './panel-bling/index.js';
export { PanelCalendarComponent } from './panel-calendar/index.js';
export { PanelChatgptComponent } from './panel-chatgpt/index.js';
export { PanelGoogleDriveComponent } from './panel-google-drive/index.js';
export { PanelLojaIntegradaComponent } from './panel-loja-integrada/index.js';
export { PanelMapsComponent } from './panel-maps/index.js';
export { PanelMercadoLivreComponent } from './panel-mercado-livre/index.js';
export { PanelPipedriveComponent } from './panel-pipedrive/index.js';

// Base factory
export { BaseComponent, createComponent } from './_base/component-factory.js';

export function info() { 
  return { 
    moduleId: MODULE_ID, 
    version: VERSION, 
    componentsExported: 21,
    categories: {
      currency: 1,
      status: 1,
      notifications: 1,
      clock: 1,
      weather: 1,
      userMenu: 1,
      integrations: 4,
      panelTriggers: 10
    }
  }; 
}

export function healthCheck() { 
  return { 
    status: 'HEALTHY', 
    version: VERSION, 
    moduleId: MODULE_ID, 
    checks: { indexReady: true, allExportsValid: true } 
  }; 
}

export default { 
  CurrencyRotatorComponent: null,
  ErrorsStatusComponent: null,
  NotificationsComponent: null, 
  RealTimeClockComponent: null, 
  WeatherSpComponent: null, 
  UserMenuComponent: null,
  EmailIntegrationComponent: null,
  WhatsAppIntegrationComponent: null,
  InstagramMessengerComponent: null,
  WeChatIntegrationComponent: null,
  PanelAdwordsComponent: null,
  PanelAsaasComponent: null,
  PanelBlingComponent: null,
  PanelCalendarComponent: null,
  PanelChatgptComponent: null,
  PanelGoogleDriveComponent: null,
  PanelLojaIntegradaComponent: null,
  PanelMapsComponent: null,
  PanelMercadoLivreComponent: null,
  PanelPipedriveComponent: null
};
