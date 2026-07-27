import { createButtonExports } from "../_shared/button-factory.js";
const buttonExports = createButtonExports("navrail-admin");
const VERSION = buttonExports.VERSION;
const MODULE_ID = buttonExports.MODULE_ID;
const getInstance = buttonExports.getInstance;
const createNavrailAdminButton = buttonExports.createButton;
const init = buttonExports.init;
const mount = buttonExports.mount;
const unmount = buttonExports.unmount;
const healthCheck = buttonExports.healthCheck;
const info = buttonExports.info;
const getElement = buttonExports.getElement;
const isMounted = buttonExports.isMounted;
const getId = buttonExports.getId;
const BUTTON_CONFIG = buttonExports.BUTTON_CONFIG;
const ACTION_PAYLOAD = buttonExports.ACTION_PAYLOAD;
const EMITTED_EVENTS = buttonExports.EMITTED_EVENTS;
var navrail_admin_default = {
  NavrailAdminButton: buttonExports.getInstance,
  getInstance: buttonExports.getInstance,
  createNavrailAdminButton: buttonExports.createButton,
  init: buttonExports.init,
  mount: buttonExports.mount,
  unmount: buttonExports.unmount,
  healthCheck: buttonExports.healthCheck,
  info: buttonExports.info,
  VERSION: buttonExports.VERSION,
  MODULE_ID: buttonExports.MODULE_ID
};
export {
  ACTION_PAYLOAD,
  BUTTON_CONFIG,
  EMITTED_EVENTS,
  MODULE_ID,
  VERSION,
  createNavrailAdminButton,
  navrail_admin_default as default,
  getElement,
  getId,
  getInstance,
  healthCheck,
  info,
  init,
  isMounted,
  mount,
  unmount
};
