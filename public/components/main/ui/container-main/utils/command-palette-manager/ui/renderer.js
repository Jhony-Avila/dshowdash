import { getConfig, getResultsElement, getFilteredResults, getSelectedIndex } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.ui.renderer";
function _renderResults() {
  const resultsElement = getResultsElement();
  if (!resultsElement) return;
  const config = getConfig();
  const filteredResults = getFilteredResults();
  const selectedIndex = getSelectedIndex();
  if (filteredResults.length === 0) {
    resultsElement.innerHTML = `
      <div class="dsd-cp-empty">
        <p>Nenhum comando encontrado</p>
        <p style="font-size: 12px; margin-top: 8px;">
          Tente: <code>></code> ir para painel, <code>@</code> configura\xE7\xF5es
        </p>
      </div>
    `;
    return;
  }
  const grouped = {};
  filteredResults.forEach((cmd, index) => {
    const category = cmd.isRecent ? "Recentes" : cmd.category || "Comandos";
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push({ ...cmd, index });
  });
  let html = "";
  Object.entries(grouped).forEach(([category, commands]) => {
    if (config.showCategories) {
      html += `<div class="dsd-cp-section-title">${category}</div>`;
    }
    commands.forEach((cmd) => {
      const isSelected = cmd.index === selectedIndex;
      const icon = config.showIcons ? `<div class="dsd-cp-item-icon">${cmd.icon || "\u26A1"}</div>` : "";
      const shortcut = config.showShortcuts && cmd.shortcut ? `<span class="dsd-cp-item-shortcut">${cmd.shortcut}</span>` : "";
      html += `
        <div class="dsd-cp-item ${isSelected ? "dsd-cp-item--selected" : ""}" 
             data-index="${cmd.index}" onclick="window._dsdCommandPaletteClick(${cmd.index})">
          ${icon}
          <div class="dsd-cp-item-content">
            <div class="dsd-cp-item-title">${cmd.highlightedTitle || cmd.title}</div>
            ${cmd.description ? `<div class="dsd-cp-item-description">${cmd.description}</div>` : ""}
          </div>
          ${shortcut}
        </div>
      `;
    });
  });
  resultsElement.innerHTML = html;
  const selectedEl = resultsElement.querySelector(".dsd-cp-item--selected");
  if (selectedEl) {
    selectedEl.scrollIntoView({ block: "nearest" });
  }
}
export {
  MODULE_ID,
  VERSION,
  _renderResults
};
