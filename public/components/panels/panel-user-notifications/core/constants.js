const MODULE_ID = "panel-user-notifications";
const VERSION = "9.3.0-P2-ENTERPRISE";
const UI_ACTIONS = Object.freeze({
  SETTINGS_SAVED: "settings:saved"
});
const API_ENDPOINTS = {
  GET_SETTINGS: "/api/users/notification-settings.php",
  SAVE_SETTINGS: "/api/users/notification-settings.php"
};
const NOTIFICATION_CHANNELS = [
  { id: "in_app", label: "In-App", description: "Notifica\xE7\xF5es dentro do sistema", icon: "bell" },
  { id: "email", label: "Email", description: "Receber por email", icon: "mail" },
  { id: "whatsapp", label: "WhatsApp", description: "Em breve", icon: "message-circle", disabled: true },
  { id: "telegram", label: "Telegram", description: "Em breve", icon: "send", disabled: true }
];
const NOTIFICATION_TYPES = [
  { id: "security", label: "Seguran\xE7a", description: "Login, altera\xE7\xF5es de senha, atividades suspeitas" },
  { id: "system", label: "Sistema", description: "Atualiza\xE7\xF5es, manuten\xE7\xF5es programadas" },
  { id: "operational", label: "Operacional", description: "Alertas de jobs, erros, integra\xE7\xF5es" }
];
var constants_default = { MODULE_ID, VERSION, UI_ACTIONS, API_ENDPOINTS, NOTIFICATION_CHANNELS, NOTIFICATION_TYPES };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
export {
  API_ENDPOINTS,
  MODULE_ID,
  NOTIFICATION_CHANNELS,
  NOTIFICATION_TYPES,
  UI_ACTIONS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
