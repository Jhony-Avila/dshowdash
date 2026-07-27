// Header Components Mega-Bundle Entry
// Exporta todos os 23 componentes como namespaces para lookup pelo loader
import * as currencyRotator from './currency-rotator/index.js';
import * as errorsStatus from './errors-status/index.js';
import * as notifications from './notifications/index.js';
import * as realTimeClock from './real-time-clock/index.js';
import * as weatherSp from './weather-sp/index.js';
import * as userMenu from './user-menu/index.js';
import * as logo from './logo/index.js';
import * as emailIntegration from './email-integration/index.js';
import * as whatsappIntegration from './whatsapp-integration/index.js';
import * as instagramMessengerIntegration from './instagram-messenger-integration/index.js';
import * as wechatIntegration from './wechat-integration/index.js';
import * as panelAdwords from './panel-adwords/index.js';
import * as panelAsaas from './panel-asaas/index.js';
import * as panelBling from './panel-bling/index.js';
import * as panelCalendar from './panel-calendar/index.js';
import * as panelChatgpt from './panel-chatgpt/index.js';
import * as panelGoogleDrive from './panel-google-drive/index.js';
import * as panelLojaIntegrada from './panel-loja-integrada/index.js';
import * as panelMaps from './panel-maps/index.js';
import * as panelMercadoLivre from './panel-mercado-livre/index.js';
import * as panelPipedrive from './panel-pipedrive/index.js';

export const HEADER_COMPONENTS = {
  'currency-rotator': currencyRotator,
  'errors-status': errorsStatus,
  'notifications': notifications,
  'real-time-clock': realTimeClock,
  'weather-sp': weatherSp,
  'user-menu': userMenu,
  'logo': logo,
  'email-integration': emailIntegration,
  'whatsapp-integration': whatsappIntegration,
  'instagram-messenger-integration': instagramMessengerIntegration,
  'wechat-integration': wechatIntegration,
  'panel-adwords': panelAdwords,
  'panel-asaas': panelAsaas,
  'panel-bling': panelBling,
  'panel-calendar': panelCalendar,
  'panel-chatgpt': panelChatgpt,
  'panel-google-drive': panelGoogleDrive,
  'panel-loja-integrada': panelLojaIntegrada,
  'panel-maps': panelMaps,
  'panel-mercado-livre': panelMercadoLivre,
  'panel-pipedrive': panelPipedrive
};
