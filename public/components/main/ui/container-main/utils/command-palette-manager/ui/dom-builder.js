import { getConfig, getPaletteElement, setPaletteElement, setInputElement, setResultsElement } from "../state.js";
import { getStyles } from "./styles.js";
import { _handleInput, _handleKeyDown, _handleBackdropClick } from "../events/handlers.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.ui.dom-builder";
function _createPaletteDOM() {
  if (getPaletteElement()) return;
  const config = getConfig();
  const paletteElement = document.createElement("div");
  paletteElement.id = "dsd-command-palette";
  paletteElement.className = "dsd-command-palette";
  paletteElement.innerHTML = `
    <style>${getStyles()}</style>
    
    <div class="dsd-cp-container">
      <div class="dsd-cp-input-wrapper">
        <svg class="dsd-cp-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" class="dsd-cp-input" placeholder="${config.placeholder}" autocomplete="off" spellcheck="false">
        <span class="dsd-cp-shortcut">ESC</span>
      </div>
      
      <div class="dsd-cp-results"></div>
      
      <div class="dsd-cp-footer">
        <div class="dsd-cp-footer-hints">
          <span class="dsd-cp-footer-hint"><kbd>\u2191\u2193</kbd> navegar</span>
          <span class="dsd-cp-footer-hint"><kbd>\u21B5</kbd> executar</span>
          <span class="dsd-cp-footer-hint"><kbd>esc</kbd> fechar</span>
        </div>
        <div class="dsd-cp-footer-mode"></div>
      </div>
    </div>
  `;
  document.body.appendChild(paletteElement);
  setPaletteElement(paletteElement);
  setInputElement(paletteElement.querySelector(".dsd-cp-input"));
  setResultsElement(paletteElement.querySelector(".dsd-cp-results"));
  const inputElement = paletteElement.querySelector(".dsd-cp-input");
  inputElement.addEventListener("input", _handleInput);
  inputElement.addEventListener("keydown", _handleKeyDown);
  paletteElement.addEventListener("click", _handleBackdropClick);
}
export {
  MODULE_ID,
  VERSION,
  _createPaletteDOM
};
