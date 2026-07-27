const MODULE_ID = "header-components-index";
const VERSION = "8.2.0-ENTERPRISE";
import { CurrencyRotatorComponent } from "./currency-rotator/index.js";
import { ErrorsStatusComponent } from "./errors-status/index.js";
import { NotificationsComponent } from "./notifications/index.js";
import { RealTimeClockComponent } from "./real-time-clock/index.js";
import { WeatherSpComponent } from "./weather-sp/index.js";
import { UserMenuComponent } from "./user-menu/index.js";
import { EmailIntegrationComponent } from "./email-integration/index.js";
import { WhatsAppIntegrationComponent } from "./whatsapp-integration/index.js";
import { InstagramMessengerComponent } from "./instagram-messenger-integration/index.js";
import { WeChatIntegrationComponent } from "./wechat-integration/index.js";
import { PanelAdwordsComponent } from "./panel-adwords/index.js";
import { PanelAsaasComponent } from "./panel-asaas/index.js";
import { PanelBlingComponent } from "./panel-bling/index.js";
import { PanelCalendarComponent } from "./panel-calendar/index.js";
import { PanelChatgptComponent } from "./panel-chatgpt/index.js";
import { PanelGoogleDriveComponent } from "./panel-google-drive/index.js";
import { PanelLojaIntegradaComponent } from "./panel-loja-integrada/index.js";
import { PanelMapsComponent } from "./panel-maps/index.js";
import { PanelMercadoLivreComponent } from "./panel-mercado-livre/index.js";
import { PanelPipedriveComponent } from "./panel-pipedrive/index.js";
import { BaseComponent, createComponent } from "./_base/component-factory.js";
function info() {
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
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { indexReady: true, allExportsValid: true }
  };
}
var components_default = {
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
export {
  BaseComponent,
  CurrencyRotatorComponent,
  EmailIntegrationComponent,
  ErrorsStatusComponent,
  InstagramMessengerComponent,
  MODULE_ID,
  NotificationsComponent,
  PanelAdwordsComponent,
  PanelAsaasComponent,
  PanelBlingComponent,
  PanelCalendarComponent,
  PanelChatgptComponent,
  PanelGoogleDriveComponent,
  PanelLojaIntegradaComponent,
  PanelMapsComponent,
  PanelMercadoLivreComponent,
  PanelPipedriveComponent,
  RealTimeClockComponent,
  UserMenuComponent,
  VERSION,
  WeChatIntegrationComponent,
  WeatherSpComponent,
  WhatsAppIntegrationComponent,
  createComponent,
  components_default as default,
  healthCheck,
  info
};
