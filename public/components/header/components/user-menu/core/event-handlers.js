import { emitUIAction, handleMenuAction } from "./actions.js";
const VERSION = "1.1.0-ENTERPRISE";
const MODULE_ID = "header/components/user-menu/core/event-handlers";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function handleTriggerClick(component, e) {
  e.preventDefault();
  e.stopPropagation();
  component.toggleMenu();
}
function handleClickOutside(component, event) {
  if (component.isDestroyed || !component.element || !component.dropdown) return;
  if (!component.element.contains(event.target) && !component.dropdown.contains(event.target)) {
    const state = component.store.getState();
    if (state.isOpen) {
      emitUIAction("close-outside", {});
      component.store.setState({ isOpen: false });
      component._announce("Menu fechado");
    }
  }
}
function navigateDropdownItems(component, direction) {
  const items = component.dropdown.querySelectorAll(".dropdown-item");
  if (items.length === 0) return;
  let currentIndex = -1;
  const activeElement = document.activeElement;
  for (let i = 0; i < items.length; i++) {
    if (items[i] === activeElement) {
      currentIndex = i;
      break;
    }
  }
  let nextIndex = currentIndex + direction;
  if (nextIndex < 0) nextIndex = items.length - 1;
  if (nextIndex >= items.length) nextIndex = 0;
  items[nextIndex].focus();
  component._announce(items[nextIndex].textContent.trim());
}
function handleKeydown(component, e) {
  if (component.isDestroyed) return;
  const state = component.store.getState();
  if (e.key === "Escape" && state.isOpen) {
    e.preventDefault();
    component.toggleMenu();
    component._announce("Menu fechado");
    component._metrics.keyboardNavigationCount++;
    const trigger = component.element.querySelector(".user-menu-trigger");
    if (trigger) trigger.focus();
    return;
  }
  if ((e.key === "Enter" || e.key === " ") && e.target.classList.contains("user-menu-trigger")) {
    e.preventDefault();
    component.toggleMenu();
    component._metrics.keyboardNavigationCount++;
    return;
  }
  if (state.isOpen && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
    e.preventDefault();
    navigateDropdownItems(component, e.key === "ArrowDown" ? 1 : -1);
    component._metrics.keyboardNavigationCount++;
    return;
  }
  if (e.key === "Tab" && state.isOpen) {
    const lastItem = component.dropdown.querySelector(".dropdown-item:last-of-type");
    const firstItem = component.dropdown.querySelector(".dropdown-item:first-of-type");
    if (!e.shiftKey && e.target === lastItem) {
      component.toggleMenu();
      component._announce("Menu fechado");
    } else if (e.shiftKey && e.target === firstItem) {
      component.toggleMenu();
      component._announce("Menu fechado");
    }
  }
}
function setupKeyboardShortcuts(component) {
  component.shortcuts.register("Escape", () => {
    if (component.store.getState().isOpen) {
      component.toggleMenu();
      component._announce("Menu fechado");
    }
  });
  document.addEventListener("keydown", component.boundHandleKeydown);
  _log("debug", "Keyboard shortcuts configurados");
}
function setupTooltips(component) {
  const items = component.dropdown.querySelectorAll(".dropdown-item");
  const tooltipTexts = {
    "profile": "Ver e editar seu perfil",
    "preferences": "Configurar suas prefer\xEAncias",
    "security": "Gerenciar seguran\xE7a da conta",
    "notifications": "Configurar notifica\xE7\xF5es",
    "sessions": "Ver dispositivos conectados",
    "logout": "Sair da sua conta"
  };
  items.forEach((item) => {
    const action = item.dataset.action;
    if (action && tooltipTexts[action]) {
      item.setAttribute("data-tooltip", tooltipTexts[action]);
      component.tooltips.attach(item);
    }
  });
  _log("debug", `Tooltips configurados para ${items.length} itens`);
}
function setupEventListeners(component) {
  const trigger = component.element.querySelector(".user-menu-trigger");
  if (trigger) {
    trigger.addEventListener("click", component.boundHandleTriggerClick);
  }
  component.dropdown.addEventListener("click", (e) => {
    const item = e.target.closest("[data-action]");
    if (!item) return;
    e.stopPropagation();
    const action = item.dataset.action;
    component._announce(`A\xE7\xE3o selecionada: ${item.textContent.trim()}`);
    handleMenuAction(action, {
      eventBus: component.eventBus,
      logger: component.logger,
      store: component.store,
      api: component.api,
      // @ts-expect-error TS migration - TS2349
      onLogout() {
        return component.handleLogout();
      }
    });
  });
  document.addEventListener("click", component.boundHandleClickOutside);
  window.addEventListener("resize", component.boundUpdateDropdownPosition);
  window.addEventListener("scroll", component.boundUpdateDropdownPosition, true);
}
function removeEventListeners(component) {
  const trigger = component.element ? component.element.querySelector(".user-menu-trigger") : null;
  if (trigger) {
    trigger.removeEventListener("click", component.boundHandleTriggerClick);
  }
  document.removeEventListener("click", component.boundHandleClickOutside);
  document.removeEventListener("keydown", component.boundHandleKeydown);
  window.removeEventListener("resize", component.boundUpdateDropdownPosition);
  window.removeEventListener("scroll", component.boundUpdateDropdownPosition, true);
}
function healthCheck() {
  const checks = { ready: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 1 ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: 1,
    scoreDisplay: `${passed}/1`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    healthCheck: healthCheck()
  };
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
export {
  MODULE_ID,
  VERSION,
  getLogs,
  handleClickOutside,
  handleKeydown,
  handleTriggerClick,
  healthCheck,
  info,
  navigateDropdownItems,
  removeEventListeners,
  setDebug,
  setupEventListeners,
  setupKeyboardShortcuts,
  setupTooltips
};
