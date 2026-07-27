const VERSION = "5.8.0-P2-ENTERPRISE";
const MODULE_ID = "main.core.initializer.ui.placeholder";
function createPlaceholder() {
  const placeholder = document.createElement("div");
  placeholder.className = "dsd-container__placeholder";
  placeholder.setAttribute("data-placeholder", "true");
  const icon = document.createElement("span");
  icon.className = "dsd-container__placeholder-icon";
  icon.textContent = "";
  const text = document.createElement("span");
  text.className = "dsd-container__placeholder-text";
  text.textContent = "Selecione um m\xF3dulo no menu";
  const hint = document.createElement("span");
  hint.className = "dsd-container__placeholder-hint";
  hint.textContent = "Use a barra lateral para navegar";
  placeholder.appendChild(icon);
  placeholder.appendChild(text);
  placeholder.appendChild(hint);
  placeholder.style.cssText = "display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;color:rgba(255,255,255,0.5);gap:1rem;text-align:center;";
  icon.style.cssText = "font-size:3rem;";
  text.style.cssText = "font-size:1.25rem;font-weight:500;";
  hint.style.cssText = "font-size:0.875rem;opacity:0.7;";
  return placeholder;
}
var placeholder_default = {
  createPlaceholder
};
export {
  MODULE_ID,
  VERSION,
  createPlaceholder,
  placeholder_default as default
};
