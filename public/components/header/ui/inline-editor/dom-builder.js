const VERSION = "1.1.0-ES6";
const MODULE_ID = "header/ui/inline-editor/dom-builder";
function injectStyles() {
  if (document.getElementById("hie-styles")) return;
  const css = "\n.hie-trigger-btn { background: transparent; border: none; cursor: pointer; padding: 8px; border-radius: 4px; transition: background 0.2s; }\n.hie-trigger-btn:hover { background: rgba(255,255,255,0.1); }\n.hie-trigger-btn svg { width: 20px; height: 20px; fill: currentColor; }\n.hie-done-btn, .hie-reset-btn { background: #4CAF50; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-right: 8px; transition: all 0.2s; }\n.hie-done-btn:hover { background: #45a049; }\n.hie-done-btn.has-changes { background: #ff9800; }\n.hie-done-btn.saving { background: #2196F3; }\n.hie-done-btn.saved { background: #4CAF50; }\n.hie-reset-btn { background: #f44336; display: none; }\n.hie-reset-btn.visible { display: inline-block; }\n.hie-reset-btn:hover { background: #d32f2f; }\n.hie-edit-banner { position: fixed; top: 0; left: 0; right: 0; background: #2196F3; color: white; text-align: center; padding: 8px; z-index: 10000; display: none; font-size: 14px; }\n.hie-edit-banner.visible { display: block; }\n.hie-position-badge { position: absolute; top: -8px; left: -8px; background: #2196F3; color: white; border-radius: 50%; width: 20px; height: 20px; font-size: 11px; display: flex; align-items: center; justify-content: center; z-index: 10; }\n.hie-drop-indicator { position: absolute; width: 3px; background: #2196F3; z-index: 9999; display: none; pointer-events: none; transition: all 0.15s; }\n.hie-drop-indicator.hie-visible { display: block; }\n.hie-keyboard-selected { outline: 2px solid #2196F3 !important; outline-offset: 2px; }\n.hie-animate-in { animation: hie-bounce 0.4s ease; }\n@keyframes hie-bounce { 0% { transform: scale(0.95); } 50% { transform: scale(1.02); } 100% { transform: scale(1); } }\n.hie-dragging { opacity: 0.5; }\n.hie-confirm-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 10001; display: none; align-items: center; justify-content: center; }\n.hie-confirm-overlay.visible { display: flex; }\n.hie-confirm-dialog { background: white; padding: 24px; border-radius: 8px; max-width: 400px; text-align: center; }\n.hie-confirm-dialog h3 { margin: 0 0 16px; }\n.hie-confirm-dialog p { margin: 0 0 20px; color: #666; }\n.hie-confirm-dialog button { margin: 0 8px; padding: 8px 16px; border-radius: 4px; cursor: pointer; }\n.hie-toast { position: fixed; bottom: 20px; right: 20px; background: #333; color: white; padding: 12px 20px; border-radius: 4px; z-index: 10002; opacity: 0; transition: opacity 0.3s; }\n.hie-toast.visible { opacity: 1; }\n.hie-toast.error { background: #f44336; }\n.hie-toast.info { background: #2196F3; }\n";
  const style = document.createElement("style");
  style.id = "hie-styles";
  style.textContent = css;
  document.head.appendChild(style);
}
function createTriggerButton(onClick) {
  const btn = document.createElement("button");
  btn.id = "hie-trigger-btn";
  btn.className = "hie-trigger-btn";
  btn.title = "Personalizar Header";
  btn.setAttribute("aria-label", "Personalizar ordem dos componentes");
  btn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>';
  btn.addEventListener("click", onClick);
  return btn;
}
function createDoneButton(onClick) {
  const btn = document.createElement("button");
  btn.id = "hie-done-btn";
  btn.className = "hie-done-btn";
  btn.textContent = "Concluir";
  btn.style.display = "none";
  btn.addEventListener("click", onClick);
  return btn;
}
function createResetButton(onClick) {
  const btn = document.createElement("button");
  btn.id = "hie-reset-btn";
  btn.className = "hie-reset-btn";
  btn.textContent = "Restaurar";
  btn.addEventListener("click", onClick);
  return btn;
}
function createEditBanner() {
  const banner = document.createElement("div");
  banner.id = "hie-edit-banner";
  banner.className = "hie-edit-banner";
  banner.textContent = "Modo de edi\xE7\xE3o - Arraste para reorganizar";
  banner.setAttribute("role", "status");
  return banner;
}
function createConfirmOverlay(onAction) {
  const overlay = document.createElement("div");
  overlay.id = "hie-confirm-overlay";
  overlay.className = "hie-confirm-overlay";
  overlay.innerHTML = '<div class="hie-confirm-dialog"><h3>Altera\xE7\xF5es n\xE3o salvas</h3><p>Voc\xEA tem altera\xE7\xF5es n\xE3o salvas. O que deseja fazer?</p><button data-action="save">Salvar</button><button data-action="discard">Descartar</button><button data-action="cancel">Cancelar</button></div>';
  overlay.addEventListener("click", (e) => {
    const action = e.target.dataset.action;
    if (action) onAction(action);
  });
  return overlay;
}
function createDropIndicator() {
  const indicator = document.createElement("div");
  indicator.className = "hie-drop-indicator";
  return indicator;
}
function createAriaLiveRegion() {
  const region = document.createElement("div");
  region.setAttribute("aria-live", "polite");
  region.setAttribute("aria-atomic", "true");
  region.className = "sr-only";
  region.style.cssText = "position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;";
  return region;
}
function createPositionBadge(position) {
  const badge = document.createElement("span");
  badge.className = "hie-position-badge";
  badge.textContent = position;
  return badge;
}
function cleanupDOM() {
  const ids = ["hie-styles", "hie-trigger-btn", "hie-done-btn", "hie-reset-btn", "hie-edit-banner", "hie-confirm-overlay"];
  ids.forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });
}
var dom_builder_default = {
  VERSION,
  injectStyles,
  createTriggerButton,
  createDoneButton,
  createResetButton,
  createEditBanner,
  createConfirmOverlay,
  createDropIndicator,
  createAriaLiveRegion,
  createPositionBadge,
  cleanupDOM
};
export {
  MODULE_ID,
  VERSION,
  cleanupDOM,
  createAriaLiveRegion,
  createConfirmOverlay,
  createDoneButton,
  createDropIndicator,
  createEditBanner,
  createPositionBadge,
  createResetButton,
  createTriggerButton,
  dom_builder_default as default,
  injectStyles
};
