import { log } from "../helpers/logger.js";
const VERSION = "1.1.0-ES6";
const MODULE_ID = "header.core.header-events.user-menu.updater";
function getUserMenu(header) {
  if (!header) return null;
  if (!header.componentsLoader) return null;
  if (typeof header.componentsLoader.getComponent !== "function") return null;
  return header.componentsLoader.getComponent("user-menu") || null;
}
function updateUserMenu(header, userData) {
  const userMenu = getUserMenu(header);
  if (!userMenu) {
    log("warn", "User-menu n\xE3o dispon\xEDvel para atualiza\xE7\xE3o");
    return false;
  }
  if (typeof userMenu.setUser === "function") {
    userMenu.setUser(userData);
    log("debug", "User-menu atualizado via setUser()", userData ? userData.email : "null");
    return true;
  }
  if (userMenu.store && typeof userMenu.store.setState === "function") {
    if (userData) {
      userMenu.store.setState({ user: userData, status: "ok" });
    } else {
      userMenu.store.setState({ user: null, status: "guest" });
    }
    log("debug", "User-menu atualizado via store.setState() (fallback)");
    return true;
  }
  log("warn", "User-menu sem m\xE9todo de atualiza\xE7\xE3o dispon\xEDvel");
  return false;
}
export {
  MODULE_ID,
  VERSION,
  getUserMenu,
  updateUserMenu
};
