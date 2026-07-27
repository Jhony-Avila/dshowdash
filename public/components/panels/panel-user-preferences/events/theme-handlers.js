import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { PREFERENCES_EVENTS } from "/core/runtime/events/catalog/preferences.events.js";
import ThemeApplier from "../theme-applier.js";
import AccessibilityPort from "../ports/accessibility-port.js";
import { showToast, addMicroAnimation, requestPushPermission } from "./helpers.js";
import { pushUndo, scheduleAutoSave } from "./undo-autosave.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.events.theme-handlers";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
function _getPrefs(state) {
  return state?.preferences;
}
function _callHandler(handlers, name, ...args) {
  if (handlers && typeof handlers[name] === "function") {
    return handlers[name](...args);
  }
  return void 0;
}
let _abortController = null;
const _announce = (message) => {
  AccessibilityPort.announce(message, { context: "theme-change" });
};
const cleanupThemeHandlers = () => {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
  }
};
const setupThemeHandlers = (container, state, handlers) => {
  _initPorts();
  cleanupThemeHandlers();
  _abortController = new AbortController();
  const signal = _abortController.signal;
  const themeEls = container.querySelectorAll("[data-theme]");
  themeEls.forEach((el) => {
    const htmlEl = el;
    el.addEventListener("mouseenter", () => {
      const theme = htmlEl.dataset.theme;
      if (_getPrefs(state) && theme !== _getPrefs(state)?.theme) {
        el.classList.add("preview-active");
        ThemeApplier.previewTheme(theme);
      }
    }, { signal });
    el.addEventListener("mouseleave", () => {
      el.classList.remove("preview-active");
      ThemeApplier.cancelPreviews();
    }, { signal });
    el.addEventListener("click", () => {
      const theme = htmlEl.dataset.theme;
      const oldTheme = _getPrefs(state)?.theme ?? "dark";
      pushUndo("theme", oldTheme);
      ThemeApplier.applyTheme(theme);
      _callHandler(handlers, "markDirty", "theme", theme);
      scheduleAutoSave(state, handlers);
      addMicroAnimation(el, "pup-bounce");
      const label = theme === "light" ? "claro" : theme === "dark" ? "escuro" : "auto";
      _announce(`Tema: ${label}`);
    }, { signal });
    el.addEventListener("keydown", (e) => {
      const ke = e;
      if (ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault();
        htmlEl.click();
      }
    }, { signal });
  });
  const colorInputs = container.querySelectorAll(".pup-color-input");
  colorInputs.forEach((input) => {
    input.addEventListener("input", (e) => {
      const target = e.target;
      const color = target.value;
      const prop = target.dataset.color;
      const eb = _getPort("eventBus");
      eb?.emit?.(PREFERENCES_EVENTS.CUSTOM_COLOR_PREVIEW, { property: prop, color, source: MODULE_ID, timestamp: Date.now() });
    }, { signal });
  });
  const applyCustomBtn = container.querySelector('[data-action="apply-custom-theme"]');
  if (applyCustomBtn) {
    applyCustomBtn.addEventListener("click", () => {
      const accentEl = container.querySelector('[data-color="accent"]');
      const bgEl = container.querySelector('[data-color="bg"]');
      const cardEl = container.querySelector('[data-color="card"]');
      const textEl = container.querySelector('[data-color="text"]');
      const accent = accentEl?.value ?? "#7c3aed";
      const bg = bgEl?.value ?? "#09090b";
      const card = cardEl?.value ?? "#131316";
      const text = textEl?.value ?? "#ffffff";
      const customTheme = { accent, bg, card, text };
      const eb = _getPort("eventBus");
      eb?.emit?.(PREFERENCES_EVENTS.CUSTOM_THEME_SET, { theme: customTheme, source: MODULE_ID, timestamp: Date.now(), persist: true });
      _callHandler(handlers, "markDirty", "custom_theme", JSON.stringify(customTheme));
      _callHandler(handlers, "markDirty", "theme", "custom");
      scheduleAutoSave(state, handlers);
      showToast("Tema personalizado aplicado", "success");
      _announce("Tema personalizado aplicado");
    }, { signal });
  }
  const densityEls = container.querySelectorAll("[data-density]");
  densityEls.forEach((el) => {
    const htmlEl = el;
    el.addEventListener("click", () => {
      const density = htmlEl.dataset.density;
      const oldDensity = _getPrefs(state)?.density ?? "comfortable";
      pushUndo("density", oldDensity);
      ThemeApplier.applyDensity(density);
      _callHandler(handlers, "markDirty", "density", density);
      scheduleAutoSave(state, handlers);
      addMicroAnimation(el, "pup-bounce");
      _announce(`Densidade: ${density}`);
    }, { signal });
    el.addEventListener("keydown", (e) => {
      const ke = e;
      if (ke.key === "Enter" || ke.key === " ") {
        ke.preventDefault();
        htmlEl.click();
      }
    }, { signal });
  });
  const toggleEls = container.querySelectorAll('[data-pref-change="toggle"]');
  toggleEls.forEach((el) => {
    const inputEl = el;
    el.addEventListener("change", () => {
      const key = inputEl.dataset.pref;
      const value = inputEl.checked ? "true" : "false";
      const oldValue = inputEl.checked ? "false" : "true";
      pushUndo(key, oldValue);
      if (key === "push_enabled" && inputEl.checked) {
        requestPushPermission().then((granted) => {
          if (!granted) {
            inputEl.checked = false;
            return;
          }
          showToast("Notifica\xE7\xF5es push ativadas!", "success");
          _callHandler(handlers, "markDirty", key, value);
          scheduleAutoSave(state, handlers);
        });
        return;
      }
      _callHandler(handlers, "markDirty", key, value);
      scheduleAutoSave(state, handlers);
      let iconEl = el.closest(".pup-notif-item");
      iconEl = iconEl?.querySelector(".pup-notif-icon") ?? null;
      if (iconEl && key === "sound_enabled") {
        iconEl.innerHTML = inputEl.checked ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>' : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="22" y1="9" x2="16" y2="15"/><line x1="16" y1="9" x2="22" y2="15"/></svg>';
      }
      const parent = el.parentElement;
      if (parent) addMicroAnimation(parent, "pup-bounce");
      const label = key === "notifications_enabled" ? "Notifica\xE7\xF5es" : key === "push_enabled" ? "Push" : "Sons";
      _announce(`${label} ${inputEl.checked ? "ativados" : "desativados"}`);
    }, { signal });
  });
  const compactBtn = container.querySelector('[data-action="toggle-compact"]');
  if (compactBtn) {
    compactBtn.addEventListener("click", (e) => {
      const btn = e.currentTarget;
      _callHandler(handlers, "toggleCompact");
      addMicroAnimation(btn, "pup-bounce");
      _announce(state?.isCompact ? "Modo expandido" : "Modo compacto");
    }, { signal });
  }
};
const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  p12Compliant: true,
  hasAbortController: !!_abortController,
  portsInitialized: Ports.isInitialized()
});
const healthCheck = () => ({
  status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED",
  moduleId: MODULE_ID,
  version: VERSION,
  p12Compliant: true,
  portsInitialized: Ports.isInitialized(),
  checks: { handlersReady: true, cleanupReady: true, hasAbortController: !!_abortController },
  timestamp: Date.now()
});
var theme_handlers_default = { VERSION, MODULE_ID, setupThemeHandlers, cleanupThemeHandlers, info, healthCheck, injectPorts, getPorts };
export {
  MODULE_ID,
  VERSION,
  cleanupThemeHandlers,
  theme_handlers_default as default,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  setupThemeHandlers
};
