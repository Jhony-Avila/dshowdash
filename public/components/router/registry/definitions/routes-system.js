const MODULE_ID = "router.registry.definitions.routes-system";
const VERSION = "7.2.0-P17WI";
import { DOMAINS, LAYOUTS, GUARD_POLICIES } from "./constants.js";
const createStatusRoute = (id, title, panel, options = {}) => ({ id: `status-${id}`, name: title.replace(/\s+/g, ""), page: `status-${id}`, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: panel, defaultHash: `#/status/${id}`, mountMain: true, domain: options.domain || DOMAINS.DASHBOARD, virtualDefaults: { view: panel, tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: options.aliases || [], tags: ["status", id, ...options.tags || []] });
const systemRoutes = Object.freeze({
  "/login": { id: "login", name: "Login", page: "login", title: "Entrar", public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [], featureFlags: [], layout: LAYOUTS.LOGIN_ONLY, defaultView: "login-modal", defaultHash: "", mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: "login-modal", tab: null, section: null, entity: null, mode: "view" }, seo: { title: "DshowDash - Login", description: "Acesse o painel enterprise da Dshow." }, aliases: ["/signin", "#/login"], tags: ["auth", "public", "system"] },
  "/logout": { id: "logout", name: "Logout", page: "logout", title: "Logout", public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [], featureFlags: [], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "Logout", description: "Sair do sistema" }, aliases: ["/signout"], tags: ["auth", "public", "system"] },
  "/404": { id: "not-found", name: "NotFound", page: "not-found", title: "P\xE1gina N\xE3o Encontrada", public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [], featureFlags: [], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "404", description: "P\xE1gina n\xE3o encontrada" }, aliases: ["/not-found"], tags: ["error", "public", "system"] },
  "/forbidden": { id: "forbidden", name: "Forbidden", page: "forbidden", title: "Acesso Negado", public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [], featureFlags: [], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "403", description: "Acesso n\xE3o autorizado" }, aliases: ["/403"], tags: ["error", "public", "system"] },
  "/maintenance": { id: "maintenance", name: "Maintenance", page: "maintenance", title: "Manuten\xE7\xE3o", public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [], featureFlags: [], layout: LAYOUTS.FULL_SCREEN, defaultView: null, defaultHash: "", mountMain: false, domain: DOMAINS.SYSTEM, virtualDefaults: { view: null, tab: null, section: null, entity: null, mode: null }, seo: { title: "Manuten\xE7\xE3o", description: "Sistema em manuten\xE7\xE3o" }, aliases: [], tags: ["system", "public"] },
  "/status/currency-btc": createStatusRoute("currency-btc", "Bitcoin", "panel-status-currency-btc", { tags: ["currency", "crypto", "btc"] }),
  "/status/currency-usd-brl": createStatusRoute("currency-usd-brl", "D\xF3lar/Real", "panel-status-currency-usd-brl", { tags: ["currency", "usd", "brl"] }),
  "/status/currency-usd-cny": createStatusRoute("currency-usd-cny", "D\xF3lar/Yuan", "panel-status-currency-usd-cny", { tags: ["currency", "usd", "cny"] }),
  "/status/email": createStatusRoute("email", "Email Integration", "panel-status-email-integration", { domain: DOMAINS.INTEGRACOES, tags: ["email", "integration"] }),
  "/status/instagram": createStatusRoute("instagram", "Instagram", "panel-status-instagram-messenger", { domain: DOMAINS.INTEGRACOES, tags: ["instagram", "social"] }),
  "/status/weather": createStatusRoute("weather", "Clima SP", "panel-status-weather-sp", { tags: ["weather", "clima"] }),
  "/status/wechat": createStatusRoute("wechat", "WeChat", "panel-status-wechat-integration", { domain: DOMAINS.INTEGRACOES, tags: ["wechat", "social"] }),
  "/status/whatsapp": createStatusRoute("whatsapp", "WhatsApp", "panel-status-whatsapp-integration", { domain: DOMAINS.INTEGRACOES, tags: ["whatsapp", "social"] }),
  "/status/notifications": createStatusRoute("notifications", "Notifica\xE7\xF5es", "panel-footer-status", { tags: ["notifications", "alerts"] }),
  "/status/app": createStatusRoute("app", "App Status", "panel-footer-status", { tags: ["app", "system"] }),
  "/status/errors": createStatusRoute("errors", "Errors Status", "panel-footer-status", { tags: ["errors", "monitoring"] })
});
var routes_system_default = systemRoutes;
export {
  MODULE_ID,
  VERSION,
  routes_system_default as default,
  systemRoutes
};
